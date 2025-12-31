// --- グローバル変数 ---
let blockedDomains = [];
let tempAllowed = {};
let isInitialized = false;

// --- 日付関連のヘルパー関数 ---
function getTodayDate() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// 訪問カウントデータの構造: { lastResetDate: 'YYYY-MM-DD', counts: { 'domain': count } }
async function getVisitCountData() {
    const data = await chrome.storage.local.get(['visitCountDaily']);
    const visitCountDaily = data.visitCountDaily || { lastResetDate: getTodayDate(), counts: {} };
    
    // 日付が変わっている場合、カウントをリセット
    const today = getTodayDate();
    if (visitCountDaily.lastResetDate !== today) {
        console.log(`📅 Date changed from ${visitCountDaily.lastResetDate} to ${today}, resetting visit counts`);
        visitCountDaily.lastResetDate = today;
        visitCountDaily.counts = {};
        await chrome.storage.local.set({ visitCountDaily });
    }
    
    return visitCountDaily;
}

async function incrementVisitCount(domain) {
    const visitCountDaily = await getVisitCountData();
    visitCountDaily.counts[domain] = (visitCountDaily.counts[domain] || 0) + 1;
    await chrome.storage.local.set({ visitCountDaily });
    console.log(`📊 Visit count for ${domain}: ${visitCountDaily.counts[domain]} (Date: ${visitCountDaily.lastResetDate})`);
    return visitCountDaily.counts[domain];
}

async function getVisitCount(domain) {
    const visitCountDaily = await getVisitCountData();
    return visitCountDaily.counts[domain] || 0;
}

async function clearDomainVisitCount(domain) {
    const visitCountDaily = await getVisitCountData();
    delete visitCountDaily.counts[domain];
    await chrome.storage.local.set({ visitCountDaily });
}

// --- 初期化 ---
async function initialize() {
    try {
        const data = await chrome.storage.local.get(['blockedDomains', 'tempAllowed']);
        blockedDomains = data.blockedDomains || [];
        tempAllowed = data.tempAllowed || {};
        isInitialized = true;
        
        console.log("=== Flux Initialized ===");
        console.log("- Blocked domains:", blockedDomains);
        console.log("- Temp allowed:", tempAllowed);
        
        // 各一時許可の残り時間を表示
        const now = Date.now();
        for (const domain in tempAllowed) {
            const remaining = Math.floor((tempAllowed[domain] - now) / 1000 / 60);
            console.log(`  ${domain}: ${remaining} minutes remaining`);
        }
        
        // 期限切れの一時許可を削除
        cleanExpiredAllowances();
        
        // 既存のアラームをすべてクリアして新規作成
        await chrome.alarms.clearAll();
        
        chrome.alarms.create("checkExpired", { 
            delayInMinutes: 1,
            periodInMinutes: 1 
        });
        console.log("✓ Alarm created (checks every 1 minute)");
        
        // 初回チェックを即座に実行
        checkExpiredAllowances();
        
        // 訪問カウントの日付チェック（起動時に実行）
        await getVisitCountData();
    } catch (e) {
        console.error("Initialization error:", e);
    }
}

async function ensureInitialized() {
    if (!isInitialized) {
        console.log("🔄 Service Worker restarted, re-initializing...");
        await initialize();
    }
}

// 期限切れの一時許可を削除
function cleanExpiredAllowances() {
    const now = Date.now();
    let changed = false;
    
    for (const domain in tempAllowed) {
        if (now >= tempAllowed[domain]) {
            console.log("Removing expired allowance for:", domain);
            delete tempAllowed[domain];
            changed = true;
        }
    }
    
    if (changed) {
        chrome.storage.local.set({ tempAllowed });
    }
}

// ドメインがブロック対象かチェック（正規化して比較）
function isDomainBlocked(hostname) {
    const normalizedHostname = hostname.replace(/^www\./, '');
    return blockedDomains.some(d => {
        const normalizedBlocked = d.replace(/^www\./, '');
        return normalizedHostname === normalizedBlocked || 
               normalizedHostname.endsWith(`.${normalizedBlocked}`);
    });
}

// 一時許可されているかチェック（正規化して比較）
function isTempAllowed(hostname) {
    const now = Date.now();
    const normalizedHostname = hostname.replace(/^www\./, '');
    
    for (const domain in tempAllowed) {
        const normalizedDomain = domain.replace(/^www\./, '');
        if (normalizedHostname === normalizedDomain && now < tempAllowed[domain]) {
            return true;
        }
    }
    return false;
}

// ドメインが期限切れになったかチェック
function isExpiredDomain(hostname, expiredDomains) {
    const normalizedHostname = hostname.replace(/^www\./, '');
    return expiredDomains.some(expiredDomain => {
        const normalizedExpired = expiredDomain.replace(/^www\./, '');
        return normalizedHostname === normalizedExpired || 
               normalizedHostname.endsWith(`.${normalizedExpired}`);
    });
}

// 期限切れチェック処理（アラームから呼ばれる）
async function checkExpiredAllowances() {
    await ensureInitialized();
    
    const now = Date.now();
    console.log("🔍 Checking expired allowances at", new Date().toLocaleTimeString());
    
    // 期限切れの一時許可を削除
    const expiredDomains = [];
    
    for (const domain in tempAllowed) {
        const expiryTime = tempAllowed[domain];
        const remainingMs = expiryTime - now;
        const remainingMin = Math.floor(remainingMs / 1000 / 60);
        
        console.log(`- ${domain}: ${remainingMin} min remaining`);
        
        if (now >= expiryTime) {
            expiredDomains.push(domain);
            delete tempAllowed[domain];
        }
    }
    
    if (expiredDomains.length > 0) {
        console.log("⏰ EXPIRED domains:", expiredDomains);
        await chrome.storage.local.set({ tempAllowed });
        
        // 拡張機能が有効かチェック
        const data = await chrome.storage.local.get(['extensionEnabled']);
        const isEnabled = data.extensionEnabled !== false;
        
        if (!isEnabled) {
            console.log("Extension is disabled, skipping tab blocking");
            return;
        }
        
        // 期限切れになったドメインのタブをチェック
        const tabs = await chrome.tabs.query({});
        console.log(`Checking ${tabs.length} tabs for expired domains...`);
        
        for (const tab of tabs) {
            if (!tab.url) continue;
            if (tab.url.startsWith('chrome://')) continue;
            if (tab.url.startsWith('chrome-extension://')) continue;
            
            try {
                const url = new URL(tab.url);
                const hostname = url.hostname;
                
                // 期限切れになったドメインに一致するかチェック
                if (isExpiredDomain(hostname, expiredDomains)) {
                    // さらにブロック対象ドメインであることを確認
                    if (isDomainBlocked(hostname)) {
                        console.log("🚫 BLOCKING expired tab:", tab.id, hostname);
                        
                        const blockUrl = chrome.runtime.getURL('block.html') + 
                            `?url=${encodeURIComponent(tab.url)}&domain=${encodeURIComponent(hostname)}`;
                        
                        try {
                            await chrome.tabs.update(tab.id, { url: blockUrl });
                            console.log("✅ Successfully redirected tab", tab.id);
                        } catch (updateError) {
                            console.error("Failed to update tab:", tab.id, updateError);
                        }
                    }
                }
            } catch (e) {
                console.error("Tab check error for tab", tab.id, ":", e);
            }
        }
    }
    
    console.log("=== Check Complete ===\n");
}

chrome.runtime.onInstalled.addListener(initialize);
chrome.runtime.onStartup.addListener(initialize);

chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local') {
        if (changes.blockedDomains) {
            blockedDomains = changes.blockedDomains.newValue || [];
            console.log("Blocked domains updated:", blockedDomains);
        }
        if (changes.tempAllowed) {
            tempAllowed = changes.tempAllowed.newValue || {};
            console.log("Temp allowed updated:", tempAllowed);
        }
    }
});

// --- 監視ロジック（onBeforeNavigate - ページ遷移時）---
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
    if (details.frameId !== 0) return;
    if (details.documentLifecycle === 'prerender') return;

    await ensureInitialized();

    try {
        const url = new URL(details.url);
        const currentDomain = url.hostname;
        
        if (url.protocol.startsWith('chrome')) return;
        if (url.protocol === 'chrome-extension:') return;

        console.log("Navigation to:", currentDomain);
        
        chrome.storage.local.get(['extensionEnabled'], (data) => {
            const isEnabled = data.extensionEnabled !== false;
            if (!isEnabled) {
                console.log("Extension is disabled, allowing navigation");
                return;
            }
            
            // 一時許可チェック
            if (isTempAllowed(currentDomain)) {
                console.log("Temp allowed:", currentDomain);
                return;
            }

            // ブロックチェック
            if (isDomainBlocked(currentDomain)) {
                console.log("Blocking:", currentDomain);
                const blockUrl = chrome.runtime.getURL('block.html') + 
                    `?url=${encodeURIComponent(details.url)}&domain=${encodeURIComponent(currentDomain)}`;
                chrome.tabs.update(details.tabId, { url: blockUrl });
            }
        });
    } catch (e) {
        console.error("Navigation check error:", e);
    }
});

// --- 追加: onCommitted でも監視（SPA対応）---
chrome.webNavigation.onCommitted.addListener(async (details) => {
    if (details.frameId !== 0) return;
    
    const validTransitionTypes = [
        'link', 'typed', 'auto_bookmark', 'auto_subframe', 
        'manual_subframe', 'generated', 'start_page', 
        'form_submit', 'reload', 'keyword', 'keyword_generated'
    ];
    
    if (!validTransitionTypes.includes(details.transitionType)) return;

    await ensureInitialized();

    try {
        const url = new URL(details.url);
        const currentDomain = url.hostname;
        
        if (url.protocol.startsWith('chrome')) return;
        if (url.protocol === 'chrome-extension:') return;

        chrome.storage.local.get(['extensionEnabled'], (data) => {
            const isEnabled = data.extensionEnabled !== false;
            if (!isEnabled) return;
            
            // 一時許可チェック
            if (isTempAllowed(currentDomain)) {
                return;
            }

            // ブロックチェック
            if (isDomainBlocked(currentDomain)) {
                console.log("Blocking (onCommitted):", currentDomain);
                const blockUrl = chrome.runtime.getURL('block.html') + 
                    `?url=${encodeURIComponent(details.url)}&domain=${encodeURIComponent(currentDomain)}`;
                chrome.tabs.update(details.tabId, { url: blockUrl });
            }
        });
    } catch (e) {
        console.error("Committed check error:", e);
    }
});

// --- アラームリスナー ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
    console.log("🔔 Alarm fired:", alarm.name, "at", new Date().toLocaleTimeString());
    
    if (alarm.name === "checkExpired") {
        await checkExpiredAllowances();
    }
});

// --- メッセージ処理 ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    (async () => {
        await ensureInitialized();
        
        try {
            console.log("📨 Message received:", request.action, request);
            
            if (request.action === "addBlockedDomain") {
                const domain = request.domain.trim().toLowerCase();
                
                if (!domain) {
                    console.error("❌ Empty domain");
                    sendResponse({ status: "error", message: "Invalid domain" });
                    return;
                }
                
                if (!blockedDomains.includes(domain)) {
                    blockedDomains.push(domain);
                    await chrome.storage.local.set({ blockedDomains });
                    console.log("✅ Domain added:", domain);
                } else {
                    console.log("⚠️ Domain already exists:", domain);
                }
                sendResponse({ status: "success", list: blockedDomains });
            } 
            else if (request.action === "removeBlockedDomain") {
                console.log("🗑️ Removing domain:", request.domain);
                blockedDomains = blockedDomains.filter(d => d !== request.domain);
                await chrome.storage.local.set({ blockedDomains });
                
                // ドメイン削除時に訪問回数もクリア
                await clearDomainVisitCount(request.domain);
                
                console.log("✅ Domain removed. New list:", blockedDomains);
                sendResponse({ status: "success", list: blockedDomains });
            } 
            else if (request.action === "getBlockedDomains") {
                console.log("📤 Sending blocked domains:", blockedDomains);
                sendResponse({ blockedDomains: blockedDomains });
            } 
            else if (request.action === "addTempAllow") {
                const durationMinutes = parseInt(request.durationMinutes, 10);
                
                if (!isNaN(durationMinutes) && durationMinutes > 0) {
                    const expirationTimestamp = Date.now() + durationMinutes * 60 * 1000;
                    tempAllowed[request.domain] = expirationTimestamp;
                    await chrome.storage.local.set({ tempAllowed });
                    
                    const expiryDate = new Date(expirationTimestamp);
                    console.log(`⏱️ Temp allowed: ${request.domain} until ${expiryDate.toLocaleTimeString()}`);
                    
                    // 訪問回数をカウント（日次リセット対応）
                    const count = await incrementVisitCount(request.domain);
                    
                    await chrome.alarms.clearAll();
                    chrome.alarms.create("checkExpired", { 
                        delayInMinutes: 1,
                        periodInMinutes: 1 
                    });
                    
                    sendResponse({ status: "success", expiry: expirationTimestamp });
                } else {
                    sendResponse({ status: "error", message: "Invalid duration" });
                }
            }
            else if (request.action === "getVisitCount") {
                const count = await getVisitCount(request.domain);
                sendResponse({ count: count });
            }
            else if (request.action === "resetAll") {
                blockedDomains = [];
                tempAllowed = {};
                await chrome.storage.local.set({ 
                    blockedDomains: [], 
                    tempAllowed: {},
                    visitCountDaily: { lastResetDate: getTodayDate(), counts: {} },
                    extensionEnabled: true 
                });
                console.log("🔄 All data reset");
                sendResponse({ status: "success" });
            }
            else {
                console.error("❌ Unknown action:", request.action);
                sendResponse({ status: "error", message: "Unknown action" });
            }
        } catch (e) {
            console.error("💥 Message handling error:", e);
            sendResponse({ status: "error", message: e.toString() });
        }
    })();

    return true;
});