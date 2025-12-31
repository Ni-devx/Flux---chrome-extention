document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== Popup Script Started ===');
    
    // 要素の取得
    const toggleSwitch = document.getElementById('toggle-switch');
    const blockedCount = document.getElementById('blocked-count');
    const activeCount = document.getElementById('active-count');
    const settingsBtn = document.getElementById('settings-btn');

    // 要素の存在確認（デバッグ用）
    console.log('Elements check:', {
        toggleSwitch: toggleSwitch ? 'found' : 'NOT FOUND',
        blockedCount: blockedCount ? 'found' : 'NOT FOUND',
        activeCount: activeCount ? 'found' : 'NOT FOUND',
        settingsBtn: settingsBtn ? 'found' : 'NOT FOUND'
    });

    // 要素が見つからない場合は警告
    if (!toggleSwitch) console.error('❌ toggle-switch element not found!');
    if (!blockedCount) console.error('❌ blocked-count element not found!');
    if (!activeCount) console.error('❌ active-count element not found!');
    if (!settingsBtn) console.error('❌ settings-btn element not found!');

    // 多言語対応の初期化（エラーハンドリング追加）
    try {
        if (typeof i18n !== 'undefined') {
            await i18n.init();
            console.log('i18n initialized');
            
            // UIテキストの翻訳
            const toggleTitle = document.querySelector('.toggle-title');
            const toggleSubtitle = document.querySelector('.toggle-subtitle');
            const statLabels = document.querySelectorAll('.stat-label');
            
            if (toggleTitle) toggleTitle.textContent = i18n.t('popup.extensionToggle');
            if (toggleSubtitle) toggleSubtitle.textContent = i18n.t('popup.toggleDescription');
            if (statLabels[0]) statLabels[0].textContent = i18n.t('popup.blockedSites');
            if (statLabels[1]) statLabels[1].textContent = i18n.t('popup.activeNow');
            if (settingsBtn) settingsBtn.textContent = i18n.t('popup.openSettings');
        }
    } catch (error) {
        console.log('i18n not available, using default text:', error);
    }

    // 初期状態を読み込み
    await loadStatus();

    // トグルスイッチのクリック
    if (toggleSwitch) {
        toggleSwitch.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Toggle clicked ===');
            
            try {
                const data = await chrome.storage.local.get(['extensionEnabled']);
                const currentState = data.extensionEnabled !== false;
                const newState = !currentState;
                
                console.log('Current state:', currentState, '-> New state:', newState);
                
                await chrome.storage.local.set({ extensionEnabled: newState });
                console.log('✓ State saved to storage');
                
                updateUI(newState);
                console.log('✓ UI updated');
            } catch (error) {
                console.error('❌ Error toggling extension:', error);
                alert('エラーが発生しました: ' + error.message);
            }
        });
        console.log('✓ Toggle event listener attached');
    }

    // 設定ボタン
    if (settingsBtn) {
        settingsBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('=== Settings button clicked ===');
            
            try {
                if (chrome && chrome.runtime && chrome.runtime.openOptionsPage) {
                    chrome.runtime.openOptionsPage();
                    console.log('✓ Options page opened');
                } else {
                    console.error('❌ chrome.runtime.openOptionsPage not available');
                    alert('設定画面を開けませんでした。manifest.jsonを確認してください。');
                }
            } catch (error) {
                console.error('❌ Error opening options page:', error);
                alert('設定画面を開けませんでした: ' + error.message);
            }
        });
        console.log('✓ Settings button event listener attached');
    }

    // 状態を読み込み
    async function loadStatus() {
        console.log('=== Loading status ===');
        try {
            const data = await chrome.storage.local.get(['extensionEnabled', 'blockedDomains', 'tempAllowed']);
            const isEnabled = data.extensionEnabled !== false;
            const domains = data.blockedDomains || [];
            const tempAllowed = data.tempAllowed || {};
            
            // 一時許可中のドメイン数をカウント
            const now = Date.now();
            const activeAllowedCount = Object.keys(tempAllowed).filter(
                domain => tempAllowed[domain] > now
            ).length;
            
            console.log('Status data:', {
                isEnabled,
                domainsCount: domains.length,
                activeAllowed: activeAllowedCount
            });
            
            if (blockedCount) {
                blockedCount.textContent = domains.length;
                console.log('✓ Blocked count updated:', domains.length);
            }
            if (activeCount) {
                activeCount.textContent = activeAllowedCount;
                console.log('✓ Active count updated:', activeAllowedCount);
            }
            
            updateUI(isEnabled);
            console.log('✓ Status loaded successfully');
        } catch (error) {
            console.error('❌ Error loading status:', error);
        }
    }

    // UI更新
    function updateUI(isEnabled) {
        console.log('=== Updating UI, isEnabled:', isEnabled, '===');
        
        if (!toggleSwitch) {
            console.error('❌ Cannot update UI: toggle switch element not found');
            return;
        }
        
        try {
            if (isEnabled) {
                toggleSwitch.classList.add('active');
                console.log('✓ Added "active" class to toggle');
            } else {
                toggleSwitch.classList.remove('active');
                console.log('✓ Removed "active" class from toggle');
            }
        } catch (error) {
            console.error('❌ Error updating UI:', error);
        }
    }

    console.log('=== Popup initialization complete ===');
});