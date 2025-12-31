// block.js の先頭に追加
document.body.style.backgroundImage = `url('${chrome.runtime.getURL('image/block-background.png')}')`;

document.addEventListener('DOMContentLoaded', async () => {
    // 多言語対応の初期化
    await i18n.init();
    
    const params = new URLSearchParams(window.location.search);
    const targetUrl = params.get('url');
    const domainParam = params.get('domain');

    // ドメイン表示
    let hostname = domainParam || "unknown";
    if (!domainParam && targetUrl) {
        try {
            hostname = new URL(targetUrl).hostname;
        } catch (e) {
            console.error("URL parse error:", e);
        }
    }
    
    // ドメイン名の正規化（www.を削除）
    const normalizedDomain = hostname.replace(/^www\./, '');
    
    document.getElementById('target-domain').textContent = hostname;

    // 訪問回数を取得して文言を変更（background.jsで自動的に日次リセット）
    chrome.runtime.sendMessage({
        action: "getVisitCount",
        domain: hostname
    }, (response) => {
        const visitCount = response?.count || 0;
        
        const heading = document.querySelector('h1');
        const message = document.querySelector('p.message');
        
        if (visitCount === 0) {
            // 初回訪問
            heading.textContent = i18n.t('block.title');
            message.innerHTML = i18n.t('block.message');
        } else if (visitCount === 1) {
            // 2回目
            heading.textContent = i18n.t('block.titleReturn');
            message.innerHTML = i18n.t('block.messageReturn');
        } else if (visitCount === 2) {
            // 3回目
            heading.textContent = i18n.t('block.titleMultiple', { count: visitCount + 1 });
            message.innerHTML = i18n.t('block.messageMultiple1');
        } else {
            // 4回目以降
            heading.textContent = i18n.t('block.titleMultiple', { count: visitCount + 1 });
            message.innerHTML = i18n.t('block.messageMultiple2');
        }
        
        console.log(`📊 Visit count for ${hostname}: ${visitCount}`);
    });

    // デフォルト時間設定を読み込む
    console.log('🔍 Loading settings for domain:', hostname);
    console.log('🔍 Normalized domain:', normalizedDomain);
    
    const data = await chrome.storage.local.get(['domainTimeSettings']);
    const domainTimeSettings = data.domainTimeSettings || {};
    
    // ドメインの設定を取得（デフォルトは5分）
    let defaultTime = 5;
    
    if (domainTimeSettings.hasOwnProperty(hostname)) {
        defaultTime = domainTimeSettings[hostname];
    } else if (domainTimeSettings.hasOwnProperty(normalizedDomain)) {
        defaultTime = domainTimeSettings[normalizedDomain];
    } else if (domainTimeSettings.hasOwnProperty('www.' + hostname)) {
        defaultTime = domainTimeSettings['www.' + hostname];
    }
    
    console.log(`✅ Default time for ${hostname}: ${defaultTime} minutes`);

    // 現在の解禁時間（編集可能）
    let currentAllowTime = defaultTime;

    // デフォルト時間を左のブロックに表示
    const timeDisplay = document.getElementById('default-time-display');
    timeDisplay.textContent = i18n.formatTime(currentAllowTime);

    // UIテキストの翻訳
    document.getElementById('go-back-btn').textContent = i18n.t('block.btnBack');
    document.getElementById('edit-btn').textContent = i18n.t('block.btnEdit');
    document.querySelector('.modal-title').textContent = i18n.t('block.timeModal');
    document.querySelector('.modal-input-group span').textContent = i18n.t('block.minutes');
    document.getElementById('modal-cancel-btn').textContent = i18n.t('block.cancel');
    document.getElementById('modal-ok-btn').textContent = i18n.t('block.confirm');

    // スライダー要素（DOMが完全に読み込まれた後に取得）
    const sliderContainer = document.getElementById('slider-container');
    const timeSlider = document.getElementById('time-slider');
    const sliderValue = document.getElementById('slider-value');
    
    // 要素が存在するか確認
    if (sliderContainer && timeSlider && sliderValue) {
        // スライダーの初期値を設定
        timeSlider.value = currentAllowTime;
        sliderValue.textContent = i18n.formatTime(currentAllowTime);

        // --- 「編集」ボタン（スライダー表示/非表示トグル）---
        document.getElementById('edit-btn').addEventListener('click', () => {
            sliderContainer.classList.toggle('show');
        });

        // --- スライダー変更時 ---
        timeSlider.addEventListener('input', (e) => {
            const minutes = parseInt(e.target.value, 10);
            currentAllowTime = minutes;
            sliderValue.textContent = i18n.formatTime(minutes);
            timeDisplay.textContent = i18n.formatTime(minutes);
            console.log('⏱️ Slider time changed to:', minutes);
        });
    } else {
        console.error('❌ Slider elements not found in DOM');
    }

    // --- 「戻る」ボタン ---
    document.getElementById('go-back-btn').addEventListener('click', () => {
        chrome.tabs.getCurrent((tab) => {
            if (tab && tab.id) {
                chrome.tabs.query({ currentWindow: true }, (tabs) => {
                    if (tabs.length > 1) {
                        chrome.tabs.remove(tab.id);
                    } else {
                        chrome.tabs.update(tab.id, { url: 'https://www.google.com' });
                    }
                });
            } else {
                window.location.href = 'https://www.google.com';
            }
        });
    });

    // --- 「→」ボタン（解除して進む）---
    document.getElementById('proceed-btn').addEventListener('click', () => {
        allowAccess(currentAllowTime);
    });

    // --- アクセス許可処理 ---
    function allowAccess(minutes) {
        const allButtons = document.querySelectorAll('button');
        allButtons.forEach(b => b.disabled = true);
        
        const proceedBtn = document.getElementById('proceed-btn');
        const originalText = proceedBtn.textContent;
        proceedBtn.textContent = '...';
        proceedBtn.classList.add('loading');
        
        console.log('🚀 Allowing access for:', hostname, 'Duration:', minutes, 'minutes');
        
        // YouTube動画のタイムスタンプを保存
        let finalUrl = targetUrl;
        
        if (targetUrl && (hostname.includes('youtube.com') || hostname.includes('youtu.be'))) {
            try {
                const url = new URL(targetUrl);
                console.log('📺 YouTube URL detected, preserving timestamp if exists');
            } catch (e) {
                console.error('URL parsing error:', e);
            }
        }
        
        // background.js に許可を依頼
        chrome.runtime.sendMessage({
            action: "addTempAllow",
            domain: hostname,
            durationMinutes: minutes
        }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Runtime error:", chrome.runtime.lastError);
                alert(i18n.t('block.addError'));
                allButtons.forEach(b => b.disabled = false);
                proceedBtn.textContent = originalText;
                proceedBtn.classList.remove('loading');
                return;
            }
            
            if (response && response.status === "success") {
                console.log(`✅ Allowed for ${minutes} minutes. Redirecting to:`, finalUrl);
                
                if (finalUrl) {
                    window.location.replace(finalUrl);
                } else {
                    window.location.href = 'https://www.google.com';
                }
            } else {
                console.error("Allow failed:", response);
                alert(i18n.t('block.addFailed'));
                allButtons.forEach(b => b.disabled = false);
                proceedBtn.textContent = originalText;
                proceedBtn.classList.remove('loading');
            }
        });
    }
});