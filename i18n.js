// lang/i18n.js
class I18n {
    constructor() {
        this.currentLang = 'ja'; // デフォルト
        this.translations = null;
        this.initialized = false;
    }
    
    async init() {
        // ストレージから言語設定を取得
        const data = await chrome.storage.local.get(['language']);
        
        if (data.language) {
            this.currentLang = data.language;
        } else {
            // ブラウザの言語設定を取得
            const browserLang = navigator.language || navigator.userLanguage;
            this.currentLang = browserLang.startsWith('ja') ? 'ja' : 'en';
        }
        
        // 翻訳データを読み込み
        this.translations = this.currentLang === 'ja' ? ja : en;
        this.initialized = true;
        
        return this.currentLang;
    }
    
    t(key, params = {}) {
        if (!this.initialized || !this.translations) {
            console.error('i18n not initialized');
            return key;
        }
        
        const keys = key.split('.');
        let value = this.translations;
        
        for (const k of keys) {
            value = value?.[k];
            if (!value) {
                console.warn(`Translation key not found: ${key}`);
                return key;
            }
        }
        
        // パラメータ置換 (例: {count}, {num}, {hours}, {minutes}, {time})
        if (typeof value === 'string') {
            return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
                return params[paramKey] !== undefined ? params[paramKey] : match;
            });
        }
        
        return value;
    }
    
    async setLanguage(lang) {
        if (lang !== 'ja' && lang !== 'en') {
            console.error('Unsupported language:', lang);
            return;
        }
        
        this.currentLang = lang;
        await chrome.storage.local.set({ language: lang });
        
        // ページをリロード
        location.reload();
    }
    
    getCurrentLanguage() {
        return this.currentLang;
    }
    
    // 時間フォーマット用のヘルパー関数
    formatTime(minutes) {
        if (minutes < 60) {
            return this.t('time.minutes', { num: minutes });
        } else {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            if (mins === 0) {
                return this.t('time.hours', { num: hours });
            } else {
                return this.t('time.hoursMinutes', { hours, minutes: mins });
            }
        }
    }
}

// グローバルインスタンスを作成
const i18n = new I18n();