// ★ 改善1: YouTube動画の視聴位置を追跡・保存・復元

(function() {
    'use strict';
    
    console.log('📺 YouTube Tracker initialized');
    
    // 動画IDを取得
    function getVideoId() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('v');
    }
    
    // 現在の再生位置を保存
    function saveCurrentTime() {
        const videoId = getVideoId();
        if (!videoId) return;
        
        const video = document.querySelector('video');
        if (!video) return;
        
        const currentTime = Math.floor(video.currentTime);
        
        if (currentTime > 0) {
            chrome.storage.local.get(['youtubeTimestamps'], (data) => {
                const timestamps = data.youtubeTimestamps || {};
                timestamps[videoId] = {
                    time: currentTime,
                    savedAt: Date.now()
                };
                
                chrome.storage.local.set({ youtubeTimestamps: timestamps }, () => {
                    console.log(`💾 Saved YouTube position: ${videoId} at ${currentTime}s`);
                });
            });
        }
    }
    
    // 保存された再生位置を復元
    function restoreSavedTime() {
        const videoId = getVideoId();
        if (!videoId) return;
        
        chrome.storage.local.get(['youtubeTimestamps'], (data) => {
            const timestamps = data.youtubeTimestamps || {};
            const savedData = timestamps[videoId];
            
            if (savedData) {
                const savedTime = savedData.time;
                const savedAt = savedData.savedAt;
                const now = Date.now();
                const hoursSinceSaved = (now - savedAt) / (1000 * 60 * 60);
                
                // 24時間以内に保存された位置のみ復元
                if (hoursSinceSaved < 24) {
                    const video = document.querySelector('video');
                    if (video && video.readyState >= 2) {
                        // 既にタイムスタンプパラメータがある場合は優先
                        const urlParams = new URLSearchParams(window.location.search);
                        const urlTime = urlParams.get('t');
                        
                        if (!urlTime && savedTime > 5) {
                            video.currentTime = savedTime;
                            console.log(`▶️ Restored YouTube position: ${videoId} to ${savedTime}s`);
                        }
                    }
                }
            }
        });
    }
    
    // 動画要素の監視
    function observeVideo() {
        const video = document.querySelector('video');
        if (!video) {
            // 動画要素がまだ存在しない場合は少し待ってから再試行
            setTimeout(observeVideo, 1000);
            return;
        }
        
        console.log('🎬 Video element found');
        
        // 動画が読み込まれたら保存された位置を復元
        if (video.readyState >= 2) {
            restoreSavedTime();
        } else {
            video.addEventListener('loadeddata', () => {
                restoreSavedTime();
            }, { once: true });
        }
        
        // 定期的に再生位置を保存（10秒ごと）
        let saveInterval = setInterval(() => {
            if (!document.querySelector('video')) {
                clearInterval(saveInterval);
                return;
            }
            saveCurrentTime();
        }, 10000);
        
        // ページを離れる直前にも保存
        window.addEventListener('beforeunload', () => {
            saveCurrentTime();
        });
        
        // ページビジビリティが変わったときも保存
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                saveCurrentTime();
            }
        });
    }
    
    // URLが変更されたとき（YouTube SPAナビゲーション）
    let lastUrl = location.href;
    new MutationObserver(() => {
        const currentUrl = location.href;
        if (currentUrl !== lastUrl) {
            lastUrl = currentUrl;
            console.log('🔄 YouTube URL changed, re-initializing tracker');
            observeVideo();
        }
    }).observe(document, { subtree: true, childList: true });
    
    // 初回実行
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', observeVideo);
    } else {
        observeVideo();
    }
    
})();