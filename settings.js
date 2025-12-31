document.addEventListener('DOMContentLoaded', async () => {
    // 多言語対応の初期化
    await i18n.init();
    
    // UIテキストの翻訳を適用
    translateUI();
    
    // モーダル要素の取得
    const modal = document.getElementById('confirm-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalCancel = document.getElementById('modal-cancel');
    const modalConfirm = document.getElementById('modal-confirm');
    
    // モーダル関数
    function showConfirmModal(message, onConfirm) {
        modalMessage.textContent = message;
        modal.classList.add('active');
        
        function handleConfirm() {
            modal.classList.remove('active');
            onConfirm();
            cleanup();
        }
        
        function handleCancel() {
            modal.classList.remove('active');
            cleanup();
        }
        
        function cleanup() {
            modalConfirm.removeEventListener('click', handleConfirm);
            modalCancel.removeEventListener('click', handleCancel);
            modal.removeEventListener('click', handleOverlayClick);
        }
        
        function handleOverlayClick(e) {
            if (e.target === modal) {
                handleCancel();
            }
        }
        
        modalConfirm.addEventListener('click', handleConfirm);
        modalCancel.addEventListener('click', handleCancel);
        modal.addEventListener('click', handleOverlayClick);
    }
    
    // ========== サイドバーナビゲーション ==========
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');
    
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.getAttribute('data-section');
            
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');
            
            contentSections.forEach(section => {
                section.classList.remove('active');
            });
            document.getElementById(`${targetSection}-section`).classList.add('active');
        });
    });
    
    // 閉じるボタン
    const closeBtn = document.getElementById('close-settings-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            chrome.tabs.getCurrent((tab) => {
                if (tab && tab.id) {
                    chrome.tabs.remove(tab.id);
                } else {
                    window.close();
                }
            });
        });
    }
    
    // ========== Block Site セクション ==========
    const input = document.getElementById('domain-input');
    const addBtn = document.querySelector('.add-btn');
    const list = document.getElementById('blocked-list');
    const countBadge = document.getElementById('count-badge');
    const countUnit = document.getElementById('count-unit');
    const chips = document.querySelectorAll('.chip');
    
    let domainTimeSettings = {};
    
    loadData();
    
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            const domain = input.value.trim().toLowerCase();
            if (domain) {
                if (domain.includes(' ') || domain.includes('/')) {
                    showConfirmModal(i18n.t('blockSite.invalidDomain'), () => {});
                    return;
                }
                addDomain(domain);
                input.value = '';
            }
        });
    }
    
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (addBtn) addBtn.click();
            }
        });
    }
    
    chips.forEach(chip => {
        chip.addEventListener('click', () => {
            const domain = chip.getAttribute('data-domain');
            if (domain) {
                addDomain(domain);
            }
        });
    });
    
    function addDomain(domain) {
        console.log('Adding domain:', domain);
        
        if (!addBtn) return;
        
        addBtn.disabled = true;
        const originalText = addBtn.textContent;
        addBtn.textContent = i18n.t('blockSite.adding');
        
        const timeout = setTimeout(() => {
            addBtn.disabled = false;
            addBtn.textContent = originalText;
            showConfirmModal(i18n.t('blockSite.addError'), () => {});
        }, 5000);
        
        chrome.runtime.sendMessage({ 
            action: "addBlockedDomain", 
            domain: domain 
        }, (response) => {
            clearTimeout(timeout);
            addBtn.disabled = false;
            addBtn.textContent = originalText;
            
            if (chrome.runtime.lastError) {
                console.error("Runtime Error:", chrome.runtime.lastError);
                showConfirmModal(i18n.t('blockSite.addError') + "\n" + chrome.runtime.lastError.message, () => {});
                return;
            }
            
            if (response && response.status === "success") {
                if (!domainTimeSettings[domain]) {
                    domainTimeSettings[domain] = 5;
                    chrome.storage.local.set({ domainTimeSettings }, () => {
                        loadData();
                    });
                } else {
                    loadData();
                }
            } else {
                showConfirmModal(i18n.t('blockSite.addFailed') + (response?.message || 'Unknown error'), () => {});
            }
        });
    }
    
    function loadData() {
        chrome.runtime.sendMessage({ action: "getBlockedDomains" }, async (response) => {
            if (chrome.runtime.lastError) {
                console.error("Load error:", chrome.runtime.lastError);
                renderList([]);
                return;
            }
            
            if (response && response.blockedDomains) {
                const data = await chrome.storage.local.get(['domainTimeSettings']);
                domainTimeSettings = data.domainTimeSettings || {};
                
                let needsSave = false;
                response.blockedDomains.forEach(domain => {
                    if (!domainTimeSettings[domain]) {
                        domainTimeSettings[domain] = 5;
                        needsSave = true;
                    }
                });
                
                if (needsSave) {
                    await chrome.storage.local.set({ domainTimeSettings });
                }
                
                renderList(response.blockedDomains);
            } else {
                renderList([]);
            }
        });
    }
    
    function renderList(domains) {
        list.innerHTML = '';
        countBadge.textContent = domains.length;
        countUnit.textContent = ' ' + i18n.t('blockSite.count');
        
        if (!domains || domains.length === 0) {
            const empty = document.createElement('li');
            empty.className = 'empty-state';
            empty.textContent = i18n.t('blockSite.empty');
            list.appendChild(empty);
            return;
        }
        
        domains.forEach(domain => {
            const li = document.createElement('li');
            
            const header = document.createElement('div');
            header.className = 'site-header';
            
            const headerLeft = document.createElement('div');
            headerLeft.className = 'site-header-left';
            
            const expandIcon = document.createElement('span');
            expandIcon.className = 'expand-icon';
            expandIcon.textContent = '▶';
            
            const siteName = document.createElement('span');
            siteName.className = 'site-name';
            siteName.textContent = domain;
            
            const timeBadge = document.createElement('span');
            timeBadge.className = 'site-time-badge';
            const currentTime = domainTimeSettings[domain] || 5;
            timeBadge.textContent = i18n.t('blockSite.defaultTime') + ' ' + i18n.formatTime(currentTime);
            
            headerLeft.appendChild(expandIcon);
            headerLeft.appendChild(siteName);
            headerLeft.appendChild(timeBadge);
            
            const actions = document.createElement('div');
            actions.className = 'site-actions';
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '×';
            deleteBtn.title = i18n.t('blockSite.deleteTitle');
            
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteBtn.disabled = true;
                
                chrome.runtime.sendMessage({ 
                    action: "removeBlockedDomain", 
                    domain: domain 
                }, (response) => {
                    if (chrome.runtime.lastError) {
                        console.error("Delete error:", chrome.runtime.lastError);
                        deleteBtn.disabled = false;
                        showConfirmModal(i18n.t('blockSite.deleteFailed'), () => {});
                        return;
                    }
                    
                    if (response && response.status === "success") {
                        delete domainTimeSettings[domain];
                        chrome.storage.local.set({ domainTimeSettings });
                        loadData();
                    } else {
                        deleteBtn.disabled = false;
                        showConfirmModal(i18n.t('blockSite.deleteFailed'), () => {});
                    }
                });
            });
            
            actions.appendChild(deleteBtn);
            header.appendChild(headerLeft);
            header.appendChild(actions);
            
            const details = document.createElement('div');
            details.className = 'site-details';
            
            const timeSettingSection = document.createElement('div');
            timeSettingSection.className = 'time-setting-section';
            
            const timeLabel = document.createElement('label');
            timeLabel.className = 'time-setting-label';
            timeLabel.textContent = i18n.t('blockSite.timeLabel');
            
            const sliderContainer = document.createElement('div');
            sliderContainer.className = 'slider-container';
            
            const sliderValue = document.createElement('div');
            sliderValue.className = 'slider-value';
            
            const valueDisplay = document.createElement('span');
            const valueNumber = document.createElement('span');
            valueNumber.className = 'slider-value-display';
            
            valueDisplay.appendChild(valueNumber);
            sliderValue.appendChild(valueDisplay);
            
            const applyToAllBtn = document.createElement('button');
            applyToAllBtn.className = 'apply-to-all-btn';
            applyToAllBtn.textContent = i18n.t('blockSite.applyToAll');
            
            applyToAllBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                
                const currentValue = parseInt(slider.value, 10);
                const timeStr = i18n.formatTime(currentValue);
                
                showConfirmModal(
                    i18n.t('blockSite.applyToAllConfirm', { time: timeStr }),
                    () => {
                        domains.forEach(d => {
                            domainTimeSettings[d] = currentValue;
                        });
                        
                        chrome.storage.local.set({ domainTimeSettings }, () => {
                            loadData();
                        });
                    }
                );
            });
            
            sliderValue.appendChild(applyToAllBtn);
            
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '1';
            slider.max = '180';
            slider.step = '1';
            slider.value = currentTime;
            
            const sliderMarks = document.createElement('div');
            sliderMarks.className = 'slider-marks';
            sliderMarks.innerHTML = `<span>${i18n.t('blockSite.sliderMin')}</span><span>${i18n.t('blockSite.sliderMax')}</span>`;
            
            function updateSliderDisplay(value) {
                valueNumber.textContent = i18n.formatTime(value);
            }
            updateSliderDisplay(currentTime);
            
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value, 10);
                updateSliderDisplay(value);
            });
            
            slider.addEventListener('change', (e) => {
                e.stopPropagation();
                const value = parseInt(e.target.value, 10);
                
                domainTimeSettings[domain] = value;
                
                chrome.storage.local.set({ domainTimeSettings }, () => {
                    timeBadge.textContent = i18n.t('blockSite.defaultTime') + ' ' + i18n.formatTime(value);
                });
            });
            
            sliderContainer.appendChild(sliderValue);
            sliderContainer.appendChild(slider);
            sliderContainer.appendChild(sliderMarks);
            
            timeSettingSection.appendChild(timeLabel);
            timeSettingSection.appendChild(sliderContainer);
            
            details.appendChild(timeSettingSection);
            
            header.addEventListener('click', (e) => {
                if (e.target.closest('.delete-btn')) return;
                
                const isExpanded = details.classList.contains('expanded');
                
                if (isExpanded) {
                    details.classList.remove('expanded');
                    expandIcon.classList.remove('expanded');
                } else {
                    details.classList.add('expanded');
                    expandIcon.classList.add('expanded');
                }
            });
            
            li.appendChild(header);
            li.appendChild(details);
            list.appendChild(li);
        });
    }
    
    // ========== Feedback セクション ==========
    const feedbackForm = document.getElementById('feedback-form');
    const feedbackStatus = document.getElementById('feedback-status');
    
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = feedbackForm.querySelector('.submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = i18n.t('feedback.submitting');
            
            const formData = new FormData(feedbackForm);
            
            try {
                const response = await fetch(feedbackForm.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });
                
                if (response.ok) {
                    feedbackStatus.className = 'feedback-status success';
                    feedbackStatus.textContent = i18n.t('feedback.success');
                    feedbackForm.reset();
                } else {
                    throw new Error('Submission failed');
                }
            } catch (error) {
                feedbackStatus.className = 'feedback-status error';
                feedbackStatus.textContent = i18n.t('feedback.error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = i18n.t('feedback.submit');
                
                setTimeout(() => {
                    feedbackStatus.className = 'feedback-status';
                }, 5000);
            }
        });
    }
    
    // ========== 言語切り替え ==========
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.value = i18n.getCurrentLanguage();
        
        languageSelect.addEventListener('change', async (e) => {
            const newLang = e.target.value;
            await i18n.setLanguage(newLang);
        });
    }
});

// UI翻訳関数
function translateUI() {
    // サイドバー
    const menuLabels = document.querySelectorAll('.menu-label');
    menuLabels[0].textContent = i18n.t('sidebar.blockSite');
    menuLabels[1].textContent = i18n.t('sidebar.feedback');
    menuLabels[2].textContent = i18n.t('sidebar.update');
    menuLabels[3].textContent = i18n.t('sidebar.howToUse');
    menuLabels[4].textContent = i18n.t('sidebar.language');
    document.getElementById('close-settings-btn').textContent = i18n.t('sidebar.close');
    
    // Block Site セクション
    document.querySelectorAll('.section-title')[0].textContent = i18n.t('blockSite.title');
    document.querySelectorAll('.section-description')[0].innerHTML = i18n.t('blockSite.description');
    document.querySelectorAll('label')[0].textContent = i18n.t('blockSite.addNew');
    document.getElementById('domain-input').placeholder = i18n.t('blockSite.placeholder');
    document.querySelector('.quick-add-label').textContent = i18n.t('blockSite.quickAdd');
    document.querySelectorAll('label')[1].textContent = i18n.t('blockSite.registered');
    
    // 「件」の翻訳を適用
    const countUnit = document.getElementById('count-unit');
    if (countUnit) {
        countUnit.textContent = ' ' + i18n.t('blockSite.count');
    }
    
    // Feedback セクション
    document.querySelectorAll('.section-title')[1].textContent = i18n.t('feedback.title');
    document.querySelectorAll('.section-description')[1].textContent = i18n.t('feedback.description');
    document.querySelector('label[for="feedback-name"]').textContent = i18n.t('feedback.name');
    document.getElementById('feedback-name').placeholder = i18n.t('feedback.namePlaceholder');
    document.querySelector('label[for="feedback-email"]').textContent = i18n.t('feedback.email');
    document.getElementById('feedback-email').placeholder = i18n.t('feedback.emailPlaceholder');
    document.querySelector('label[for="feedback-type"]').textContent = i18n.t('feedback.type');
    
    const typeSelect = document.getElementById('feedback-type');
    typeSelect.options[0].textContent = i18n.t('feedback.typeSelect');
    typeSelect.options[1].textContent = i18n.t('feedback.typeBug');
    typeSelect.options[2].textContent = i18n.t('feedback.typeFeature');
    typeSelect.options[3].textContent = i18n.t('feedback.typeImprovement');
    typeSelect.options[4].textContent = i18n.t('feedback.typeOther');
    
    document.querySelector('label[for="feedback-message"]').textContent = i18n.t('feedback.message');
    document.getElementById('feedback-message').placeholder = i18n.t('feedback.messagePlaceholder');
    document.querySelector('.submit-btn').textContent = i18n.t('feedback.submit');
    
    // Update セクション
    document.querySelectorAll('.section-title')[2].textContent = i18n.t('update.title');
    document.querySelectorAll('.section-description')[2].textContent = i18n.t('update.description');
    
    // How to Use セクション
    document.querySelectorAll('.section-title')[3].textContent = i18n.t('howToUse.title');
    document.querySelectorAll('.section-description')[3].textContent = i18n.t('howToUse.description');
    
    const cardTitles = document.querySelectorAll('.card-title');
    cardTitles[0].textContent = i18n.t('howToUse.addTitle');
    cardTitles[1].textContent = i18n.t('howToUse.removeTitle');
    
    const howToLists = document.querySelectorAll('.how-to-list');
    howToLists[0].children[0].textContent = i18n.t('howToUse.addStep1');
    howToLists[0].children[1].textContent = i18n.t('howToUse.addStep2');
    howToLists[0].children[2].textContent = i18n.t('howToUse.addStep3');
    howToLists[1].children[0].textContent = i18n.t('howToUse.removeStep1');
    howToLists[1].children[1].textContent = i18n.t('howToUse.removeStep2');
    howToLists[1].children[2].textContent = i18n.t('howToUse.removeStep3');
    
    // Language セクション
    document.querySelectorAll('.section-title')[4].textContent = i18n.t('language.title');
    document.querySelectorAll('.section-description')[4].textContent = i18n.t('language.description');
    document.querySelector('label[for="language-select"]').textContent = i18n.t('language.select');
    
    // モーダル
    document.getElementById('modal-title').textContent = i18n.t('modal.title');
    document.getElementById('modal-cancel').textContent = i18n.t('modal.cancel');
    document.getElementById('modal-confirm').textContent = i18n.t('modal.confirm');
}