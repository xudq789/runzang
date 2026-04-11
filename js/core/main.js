// ============ 【导入新模块】 ============
import { RunzangStorage, PaymentStorage } from './storage.js';
import { createPaymentManager, isCurrentOrderPaid, applyStatusContent } from './payment.js';
import { createHistoryManager, getLastSelectedService, setLastSelectedService } from './history.js';
import { initFeedbackForm, showFeedbackModal } from './ui-feedback.js';
import { API_KEY } from './api.js';

// 将API_KEY暴露到window供其他模块使用
window.API_KEY = API_KEY;

// ============ 【创建支付管理器实例】 ============
// PaymentManager 和 HistoryManager 将在导入 UI 函数后创建（避免循环依赖）
let PaymentManager;
let HistoryManager;
let renderHistoryLists, applyHashView, updateHistoryNavVisibility;

// ============ 【URL支付回调检测函数】 ============
function checkPaymentSuccessFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success');
        const from = urlParams.get('from');
        
        // 只处理支付宝的回调
        if (paymentSuccess === 'true' && from === 'alipay') {
            console.log('✅ 检测到支付宝支付成功回调');
            
            // 获取订单号（支付宝回调可能会带 out_trade_no）
            const orderId = urlParams.get('out_trade_no') || 
                            urlParams.get('order_id') || 
                            PaymentStorage.getPaidOrderId();
            
            if (orderId) {
                console.log('订单ID:', orderId);
                
                // 保存到localStorage
                PaymentStorage.setPaidOrderId(orderId);
                
                // 清理URL参数
                try {
                    const cleanUrl = window.location.pathname + window.location.hash;
                    window.history.replaceState({}, document.title, cleanUrl);
                    console.log('URL参数已清理');
                } catch (e) {
                    console.log('URL清理失败:', e);
                }
                
                return orderId;
            }
        }
        
        return null;
    } catch (error) {
        console.error('检查支付回调失败:', error);
        return null;
    }
}

// ============ 【URL订单号直接访问】 ============
/**
 * 检查URL中是否有订单号参数，如果有则直接加载该订单
 * @returns {Promise<boolean>} 是否成功加载订单
 */
async function checkAndLoadOrderFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId = urlParams.get('orderId');
        
        if (!orderId) {
            return false;
        }
        
        console.log('🔍 检测到URL中的订单号:', orderId);
        
        // 请求订单详情
        const result = await fetchPaymentStatus(orderId);
        
        if (!result.success || !result.data) {
            console.error('❌ 获取订单详情失败');
            return false;
        }
        
        const { serviceType, content, status, paymentStatus, serviceAmount } = result.data;
        
        if (!serviceType || !content) {
            console.error('❌ 订单数据不完整');
            return false;
        }
        
        console.log('✅ 订单详情获取成功:', { serviceType, status, paymentStatus });
        
        // 切换到对应的服务类型
        STATE.currentService = serviceType;
        STATE.lastAiOrderId = orderId;
        if (serviceAmount != null && serviceAmount !== '' && !Number.isNaN(Number(serviceAmount))) {
            STATE.queryPaymentAmount = Number(serviceAmount);
        }
        
        // 如果已支付，设置解锁状态
        if (paymentStatus === 'paid') {
            STATE.isPaymentUnlocked = true;
            STATE.isDownloadLocked = false;
        }
        
        // 更新UI
        updateServiceDisplay(serviceType);
        updateUnlockInfo();
        
        // 设置导航栏 active 状态
        document.querySelectorAll('.service-nav a').forEach(link => {
            if (link.dataset.service === serviceType) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
        
        // 如果有用户输入数据，恢复到表单
        if (result.data.userInput) {
            const userInput = result.data.userInput;
            
            // 判断是八字合婚（有 self/spouse）还是其他服务（直接字段）
            if (serviceType === '八字合婚' && userInput.self) {
                // 八字合婚：处理 self 和 spouse
                STATE.userData = {
                    name: userInput.self.name,
                    gender: userInput.self.gender,
                    birthYear: userInput.self.birthTime?.substring(0, 4),
                    birthMonth: userInput.self.birthTime?.substring(5, 7),
                    birthDay: userInput.self.birthTime?.substring(8, 10),
                    birthHour: userInput.self.birthTime?.substring(11, 13),
                    birthMinute: userInput.self.birthTime?.substring(14, 16),
                    birthCity: userInput.self.birthRegion || ''
                };
                
                if (userInput.spouse) {
                    STATE.partnerData = {
                        partnerName: userInput.spouse.name,
                        partnerGender: userInput.spouse.gender,
                        partnerBirthYear: userInput.spouse.birthTime?.substring(0, 4),
                        partnerBirthMonth: userInput.spouse.birthTime?.substring(5, 7),
                        partnerBirthDay: userInput.spouse.birthTime?.substring(8, 10),
                        partnerBirthHour: userInput.spouse.birthTime?.substring(11, 13),
                        partnerBirthMinute: userInput.spouse.birthTime?.substring(14, 16),
                        partnerBirthCity: userInput.spouse.birthRegion || ''
                    };
                }
            } else if (userInput.name) {
                // 其他服务：直接字段
                STATE.userData = {
                    name: userInput.name,
                    gender: userInput.gender,
                    birthYear: userInput.birthTime?.substring(0, 4),
                    birthMonth: userInput.birthTime?.substring(5, 7),
                    birthDay: userInput.birthTime?.substring(8, 10),
                    birthHour: userInput.birthTime?.substring(11, 13),
                    birthMinute: userInput.birthTime?.substring(14, 16),
                    birthCity: userInput.birthRegion || ''
                };
            }
        }
        
        // 处理并显示分析结果
        STATE.fullAnalysisResult = content;
        const baziData = parseBaziData(content);
        STATE.baziData = baziData.userBazi;
        STATE.partnerBaziData = baziData.partnerBazi;
        
        displayPredictorInfo();
        displayBaziPan();
        displayDayunPan();
        processAndDisplayAnalysis(content);
        showAnalysisResult();
        
        // 如果已支付，显示完整内容和订单号
        if (paymentStatus === 'paid') {
            showFullAnalysisContent();
            unlockDownloadButton();
            
            // ✅ 显示订单号和复制按钮
            const orderInfo = UI.orderInfo();
            const orderIdElement = UI.orderId();
            if (orderInfo && orderIdElement) {
                orderIdElement.textContent = orderId;
                orderInfo.style.display = 'block';
                
                // 绑定复制按钮事件
                const orderCopyBtn = document.getElementById('order-copy-btn');
                if (orderCopyBtn) {
                    // 移除旧的监听器（如果有）
                    const newBtn = orderCopyBtn.cloneNode(true);
                    orderCopyBtn.parentNode.replaceChild(newBtn, orderCopyBtn);
                    
                    newBtn.addEventListener('click', () => {
                        navigator.clipboard.writeText(orderId).then(() => {
                            const originalHTML = newBtn.innerHTML;
                            newBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                            </svg>`;
                            newBtn.style.color = '#52c41a';
                            
                            setTimeout(() => {
                                newBtn.innerHTML = originalHTML;
                                newBtn.style.color = '';
                            }, 1500);
                        }).catch(err => {
                            console.error('复制失败:', err);
                            alert('复制失败，请手动复制');
                        });
                    });
                }
            }
        }
        
        // 保存到本地存储
        RunzangStorage.setCurrentOrder(serviceType, orderId);
        RunzangStorage.setResult(serviceType, orderId, {
            content,
            userData: STATE.userData,
            partnerData: STATE.partnerData,
            createdAt: result.data.createdAt || new Date().toISOString()
        });
        
        // 如果已支付，添加到历史记录
        if (paymentStatus === 'paid') {
            RunzangStorage.addPaidOrder({
                orderId,
                serviceType,
                createdAt: result.data.createdAt,
                userInputSummary: RunzangStorage.userInputSummary(STATE.userData, STATE.partnerData, serviceType)
            });
            updateHistoryNavVisibility();
        }
        
        // ✅ 保留 URL 参数，方便分享和刷新
        // 不清理 URL，这样用户可以：
        // 1. 刷新页面继续查看同一订单
        // 2. 复制链接分享给他人
        // 3. 收藏链接以便后续访问
        console.log('✅ 订单链接已保留在URL中');
        
        return true;
    } catch (error) {
        console.error('❌ 从URL加载订单失败:', error);
        return false;
    }
}

// ============ 【导入核心模块】 ============
import { SERVICES, STATE } from './config.js';
import { parseBaziData, callAiQuery, fetchPaymentStatus } from './api.js';
import {
    UI,
    initFormOptions,
    setDefaultValues,
    updateServiceDisplay,
    updateUnlockInfo,
    displayPredictorInfo,
    displayBaziPan,
    displayDayunPan,
    processAndDisplayAnalysis,
    showPaymentModal,
    closePaymentModal,
    updateUnlockInterface,
    showFullAnalysisContent,
    lockDownloadButton,
    unlockDownloadButton,
    resetUnlockInterface,
    animateButtonStretch,
    showLoadingModal,
    hideLoadingModal,
    forceCompleteProgressBar,
    showAnalysisResult,
    hideAnalysisResult,
    validateForm,
    collectUserData
} from './ui.js';
import { initPageEnhancements } from './ui-enhancements.js';

const SERVICE_NAMES = ['测算验证', '流年运程', '人生详批', '八字合婚'];

// ============ 【初始化管理器实例】 ============
// 创建支付管理器
PaymentManager = createPaymentManager({
    updateServiceDisplay,
    displayPredictorInfo,
    displayBaziPan,
    displayDayunPan,
    processAndDisplayAnalysis,
    showAnalysisResult,
    updateUnlockInterface,
    showFullAnalysisContent,
    unlockDownloadButton,
    closePaymentModal,
    updateHistoryNavVisibility: () => {
        if (updateHistoryNavVisibility) updateHistoryNavVisibility();
    }
});

// 创建历史记录管理器
HistoryManager = createHistoryManager({
    updateServiceDisplay,
    updateUnlockInterface,
    unlockDownloadButton,
    showFullAnalysisContent,
    PaymentManager
});
renderHistoryLists = HistoryManager.renderHistoryLists;
applyHashView = HistoryManager.applyHashView;
updateHistoryNavVisibility = HistoryManager.updateHistoryNavVisibility;

// RunzangStorage 已从 storage.js 导入

// applyStatusContent 和 isCurrentOrderPaid 已从 payment.js 导入

function handlePaymentSuccess() {
    STATE.isPaymentUnlocked = true;
    STATE.isDownloadLocked = false;
    closePaymentModal();
    updateUnlockInterface();
    showFullAnalysisContent();
    unlockDownloadButton();
    PaymentManager.showSuccessMessage();
}

function confirmPayment() {
    const confirmed = confirm('如果您已在支付宝或微信中完成支付，请点击「确定」由系统核对订单并解锁内容。\n如支付遇到问题，请联系客服微信：runzang888');
    
    if (confirmed) {
        console.log('检查支付状态，订单:', STATE.lastAiOrderId);
        (async () => {
            try {
                const result = await fetchPaymentStatus(STATE.lastAiOrderId);
                console.log('支付状态结果:', result);

                const data = result.data;
                if (!result.success || !data) {
                    alert('支付状态未确认，请稍后再试或联系客服微信：runzang888');
                    return;
                }

                const status = data.status;
                const paymentStatus = data.paymentStatus;

                if (status === 'processing' || status === 'partial') {
                    alert('结果分析未完成，请1分钟后再试');
                    return;
                }
                if (status === 'failed') {
                    alert('结果分析失败，请联系客服微信：runzang888');
                    return;
                }

                if (paymentStatus === 'paid') {
                    // 更新 paymentData 的 verified 状态
                    const paymentData = PaymentManager.getPaymentData() || {};
                    paymentData.verified = true;
                    paymentData.verifiedAt = new Date().toISOString();
                    paymentData.serviceType = paymentData.serviceType || STATE.currentService;
                    paymentData.aiOrderId = paymentData.aiOrderId || STATE.lastAiOrderId;
                    PaymentStorage.setPaymentData(paymentData);
                    
                    // 如果有新 content，更新 STATE 和 RunzangStorage，并重新处理显示
                    if (data.content) {
                        applyStatusContent(result);
                        // 更新 RunzangStorage
                        const storageOrderId = paymentData.aiOrderId || STATE.lastAiOrderId;
                        const existing = RunzangStorage.getResult(STATE.currentService, storageOrderId);
                        RunzangStorage.setResult(STATE.currentService, storageOrderId, {
                            content: data.content,
                            userData: existing?.userData || STATE.userData || {},
                            partnerData: existing?.partnerData ?? STATE.partnerData ?? null,
                            createdAt: existing?.createdAt || new Date().toISOString()
                        });
                        // 重新处理并显示内容（填充 lockedAnalysisText）
                        processAndDisplayAnalysis(data.content);
                    } else if (STATE.fullAnalysisResult) {
                        // 如果没有新 content，但 STATE 中有内容，重新处理一次确保 lockedAnalysisText 有内容
                        processAndDisplayAnalysis(STATE.fullAnalysisResult);
                    }
                    
                    // 添加到已支付列表
                    if (STATE.lastAiOrderId && STATE.currentService) {
                        RunzangStorage.addPaidOrder({
                            orderId: STATE.lastAiOrderId,
                            serviceType: STATE.currentService,
                            userInputSummary: RunzangStorage.userInputSummary(STATE.userData, STATE.partnerData, STATE.currentService)
                        });
                    }
                    
                    // 解锁内容
                    handlePaymentSuccess();
                } else {
                    alert('支付状态未确认，请稍后再试或联系客服微信：runzang888');
                }
            } catch (error) {
                console.error('检查支付状态失败:', error);
                alert(`网络错误: ${error.message}\n请稍后重试或联系客服微信：runzang888`);
            }
        })();
    }
}

// ============ 【主要应用函数】 ============
async function initApp() {
    console.log('🚀 应用初始化开始...');

    try {
        initFormOptions();
        setDefaultValues();

        // 刷新后不恢复订单详情，只展示上次选中的 tab（变量失效）
        RunzangStorage.clearCurrentOrder();
        const serviceToShow = getLastSelectedService(SERVICES);
        STATE.currentService = serviceToShow;
        updateServiceDisplay(STATE.currentService);
        updateUnlockInfo();
        lockDownloadButton();
        setupEventListeners();
        preloadImages();
        applyHashView();
        initPageEnhancements();
        initTheme();
        initFeedbackForm();
        
        // ✅ 优先检查URL中是否有订单号参数（分享链接访问）
        const orderLoaded = await checkAndLoadOrderFromURL();
        if (orderLoaded) {
            console.log('✅ 已从URL加载订单详情');
            return;
        }
        
        // 支付回调或本地订单：查订单状态并解锁
        const urlOrderId = checkPaymentSuccessFromURL();
        if (urlOrderId) {
            console.log('✅ 检测到URL支付回调，订单ID:', urlOrderId);
        }
        await PaymentManager.initPaymentCheck();
        
        // 初始化字体优化
        initFontOptimization();
        
        console.log('✅ 应用初始化完成');
        
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
    }
}

// ============ 【字体优化初始化】 ============
function initFontOptimization() {
    // 检测设备类型并应用优化
    const isMobile = /mobile|iphone|android/i.test(navigator.userAgent.toLowerCase());
    
    if (isMobile) {
        // 移动端：动态调整字体大小
        adjustMobileFontSizes();
        
        // 监听窗口大小变化
        window.addEventListener('resize', adjustMobileFontSizes);
        
        console.log('📱 移动端字体优化已启用');
    } else {
        console.log('💻 电脑端保持原字体大小');
    }
}

function adjustMobileFontSizes() {
    const viewportWidth = window.innerWidth;
    
    // 根据屏幕宽度动态调整字体
    if (viewportWidth <= 480) {
        // 小屏幕手机
        applyFontScale(0.95);
    } else if (viewportWidth <= 768) {
        // 平板或大屏手机
        applyFontScale(1.0);
    } else {
        // 电脑端
        applyFontScale(1.0);
    }
}

function applyFontScale(scale) {
    // 这里可以添加动态字体调整逻辑
    // 目前已经在CSS中做了响应式处理
}

function setupEventListeners() {
    console.log('设置事件监听器...');
    
    document.querySelectorAll('.service-nav a[data-service]').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            if (location.hash === '#history') location.hash = '';
            switchService(this.dataset.service);
        });
    });
    const navHistory = document.getElementById('nav-history');
    if (navHistory) navHistory.addEventListener('click', (e) => { e.preventDefault(); location.hash = 'history'; });
    
    const historyBack = document.getElementById('history-back-btn');
    if (historyBack) historyBack.addEventListener('click', (e) => { e.preventDefault(); location.hash = ''; });
    
    window.addEventListener('hashchange', applyHashView);
    
    UI.analyzeBtn().addEventListener('click', startAnalysis);
    UI.unlockBtn().addEventListener('click', showPaymentModal);
    UI.downloadReportBtn().addEventListener('click', downloadReport);
    UI.recalculateBtn().addEventListener('click', newAnalysis);
    UI.confirmPaymentBtn().addEventListener('click', confirmPayment);
    UI.cancelPaymentBtn().addEventListener('click', closePaymentModal);
    UI.closePaymentBtn().addEventListener('click', closePaymentModal);

    // 反馈按钮事件
    const feedbackBtn = document.getElementById('feedback-btn');
    if (feedbackBtn) {
        feedbackBtn.addEventListener('click', showFeedbackModal);
    }
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePaymentModal();
        }
    });
    
    window.addEventListener('click', function(event) {
        const paymentModal = UI.paymentModal();
        if (event.target === paymentModal) {
            closePaymentModal();
        }
    });
    
    const heroImage = UI.heroImage();
    const detailImage = UI.detailImage();
    
    if (heroImage) {
        heroImage.addEventListener('load', function() {
            this.classList.add('loaded');
            const placeholder = this.previousElementSibling;
            if (placeholder) placeholder.style.display = 'none';
        });
    }
    
    if (detailImage) {
        detailImage.addEventListener('load', function() {
            this.classList.add('loaded');
            const placeholder = this.previousElementSibling;
            if (placeholder) placeholder.style.display = 'none';
        });
    }

    // 主题切换按钮事件
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
}

// ============ 【主题切换功能】 ============
function initTheme() {
    // 从localStorage读取保存的主题
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.body.classList.add('dark-theme');
        updateThemeIcon(true);
    } else if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        updateThemeIcon(true);
    } else {
        updateThemeIcon(false);
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
    console.log(isDark ? '🌙 深色模式已启用' : '☀️ 浅色模式已启用');
}

function updateThemeIcon(isDark) {
    const themeIcon = document.getElementById('theme-icon');
    if (themeIcon) {
        themeIcon.textContent = isDark ? '☀️' : '🌙';
    }
}

function switchService(serviceName) {
    console.log('切换服务到:', serviceName);
    
    if (!SERVICES[serviceName]) {
        console.error('服务不存在:', serviceName);
        return;
    }
    
    const oldService = STATE.currentService;
    
    if (oldService !== serviceName) {
        console.log('切换到不同服务，彻底重置状态');
        
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
        STATE.fullAnalysisResult = '';
        STATE.baziData = null;
        STATE.partnerBaziData = null;
        STATE.lastAiOrderId = null;
        STATE.queryPaymentAmount = null;
        STATE.userData = null;
        STATE.partnerData = null;
        
        console.log('✅ 所有状态已重置');
    }
    
    STATE.currentService = serviceName;
    setLastSelectedService(serviceName);
    updateServiceDisplay(serviceName);
    updateUnlockInfo();
    resetUnlockInterface();
    lockDownloadButton();
    
    // ✅ 隐藏订单号（切换服务时）
    const orderInfo = UI.orderInfo();
    if (orderInfo) {
        orderInfo.style.display = 'none';
    }
    
    if (oldService !== serviceName) {
        hideAnalysisResult();
        
        // ✅ 显示输入表单，隐藏历史记录和结果区域
        const seamless = document.querySelector('.seamless-container');
        const historySection = document.getElementById('history-section');
        const resultSection = document.getElementById('analysis-result-section');
        
        if (seamless) {
            seamless.style.display = 'block';
            seamless.style.visibility = 'visible';
            seamless.style.position = 'static';
            seamless.style.zIndex = 'auto';
            console.log('✅ 输入表单已显示');
        }
        
        if (historySection) {
            historySection.style.display = 'none';
        }
        
        if (resultSection) {
            resultSection.style.display = 'none';
        }
        
        // 清空内容
        const freeAnalysisText = UI.freeAnalysisText();
        if (freeAnalysisText) {
            freeAnalysisText.innerHTML = '';
        }
        
        const predictorInfoGrid = UI.predictorInfoGrid();
        if (predictorInfoGrid) {
            predictorInfoGrid.innerHTML = '';
        }
        
        const baziGrid = UI.baziGrid();
        if (baziGrid) {
            baziGrid.innerHTML = '';
        }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    console.log('服务切换完成，解锁状态:', STATE.isPaymentUnlocked);
}

function preloadImages() {
    console.log('预加载图片...');
    
    Object.values(SERVICES).forEach(service => {
        const heroImg = new Image();
        heroImg.src = service.heroImage;
        
        const detailImg = new Image();
        detailImg.src = service.detailImage;
    });
}

// ============ 【核心修改：传统分析函数 - 优化版】 ============
async function startAnalysis() {
    console.log('开始命理分析...');
   
    if (!validateForm()) {
        alert('请填写完整的个人信息');
        return;
    }
    
    const resultServiceName = document.getElementById('result-service-name');
    if (resultServiceName) {
        resultServiceName.textContent = STATE.currentService + '分析报告';
    }
    
    console.log('🔄 清空旧的分析结果...');
    RunzangStorage.clearCurrentOrder();
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    STATE.lastAiOrderId = null;
    STATE.queryPaymentAmount = null;
    
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    
    // ✅ 更新解锁界面，显示支付按钮
    updateUnlockInfo();
    
    // ✅ 隐藏订单号（新测算时）
    const orderInfo = UI.orderInfo();
    if (orderInfo) {
        orderInfo.style.display = 'none';
    }
    
    lockDownloadButton();
    animateButtonStretch();
    
    try {
        collectUserData();
        
        // 立即显示预测者信息
        displayPredictorInfo();
        
        // 立即显示分析结果区域（空内容）
        showAnalysisResult();

        // 在八字区域显示加载状态
        const baziGrid = UI.baziGrid();
        if (baziGrid) {
            baziGrid.innerHTML = `
                <div class="loading-bazi" style="text-align: center; padding: 40px;">
                    <div style="display: inline-flex; align-items: center; gap: 15px; background: #f9f9f9; padding: 20px 30px; border-radius: 10px;">
                        <div class="spinner" style="width: 24px; height: 24px; border-width: 3px;"></div>
                        <span style="font-size: 16px; color: #666;">正在排盘，请稍候...</span>
                    </div>
                </div>
            `;
        }

        // 显示加载弹窗
        showLoadingModal();

        let result;
        try {
            result = await callAiQuery(STATE.currentService, STATE.userData, STATE.partnerData);
        } catch (error) {
            console.error('AI 查询失败:', error);
            hideLoadingModal();
            alert(error.message || '分析请求失败，请稍后重试');
            return;
        }
        
        // ✅ 进度条如仍在运行则立即完成
        if (window.simpleProgress) {
            forceCompleteProgressBar();
        }
        
        // ✅ 关键修复：成功返回后立即关闭加载弹窗
        hideLoadingModal();
        
        const content = result.content;
        if (result.orderId) STATE.lastAiOrderId = result.orderId;
        if (result.amount != null) STATE.queryPaymentAmount = result.amount;
        else STATE.queryPaymentAmount = null;
        
        // 保存完整结果
        STATE.fullAnalysisResult = content;
        
        // 提取八字数据
        const parsedBaziData = parseBaziData(content);
        STATE.baziData = parsedBaziData.userBazi;
        
        // 如果是八字合婚，保存伴侣八字数据
        if (STATE.currentService === '八字合婚') {
            STATE.partnerBaziData = parsedBaziData.partnerBazi;
        }
        
        // 显示结果 - 先显示八字排盘（按顺序：用户->伴侣）
        displayBaziPan();
        
        // 显示大运排盘（按顺序：用户->伴侣）
        setTimeout(() => {
            displayDayunPan();
        }, 100);
        
        // 处理并显示分析内容
        processAndDisplayAnalysis(content);
        console.log('✅ 分析内容处理完成');
        
        console.log('AI 查询分析完成，总字数:', content.length);
        
        // 滚动到结果区域
        const analysisResultSection = UI.analysisResultSection();
        if (analysisResultSection) {
            setTimeout(() => {
                analysisResultSection.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'start',
                    inline: 'nearest'
                });
            }, 500);
        }
        
        // 按服务类型+订单号存储，并设为当前查看订单
        if (STATE.lastAiOrderId) {
            RunzangStorage.setResult(STATE.currentService, STATE.lastAiOrderId, {
                content,
                userData: STATE.userData || {},
                partnerData: STATE.partnerData || null,
                createdAt: new Date().toISOString()
            });
            RunzangStorage.setCurrentOrder(STATE.currentService, STATE.lastAiOrderId);
            console.log('✅ 分析数据已保存（服务+订单号）');
        }
        
        // 仅当「当前服务+当前订单号」对应已支付订单时才解锁；否则展示锁定区域并提示支付
        if (isCurrentOrderPaid()) {
            console.log('当前订单已支付，自动解锁');
            STATE.isPaymentUnlocked = true;
            STATE.isDownloadLocked = false;
            setTimeout(() => {
                PaymentManager.updateUIAfterPayment();
            }, 300);
        } else {
            // ✅ 未支付订单，显示支付解锁界面
            updateUnlockInfo(); // 显示 locked-content 容器
            const lockedOverlay = document.getElementById('locked-overlay');
            if (lockedOverlay) lockedOverlay.style.display = '';
            resetUnlockInterface();
            lockDownloadButton();
        }
        
    } catch (error) {
        console.error('分析失败:', error);
        hideLoadingModal();
        
        // 在八字区域显示详细的错误信息
        const baziGrid = UI.baziGrid();
        if (baziGrid) {
            baziGrid.innerHTML = `
                <div style="text-align: center; padding: 40px; background: #fff5f5; border-radius: 8px; border: 1px solid #ffcdd2;">
                    <div style="font-size: 48px; margin-bottom: 20px;">❌</div>
                    <div style="font-size: 18px; color: #c62828; margin-bottom: 15px; font-weight: bold;">分析失败</div>
                    <div style="color: #666; font-size: 16px; margin-bottom: 20px;">${error.message || '未知错误'}</div>
                    <button onclick="startAnalysis()" style="margin-top: 25px; padding: 10px 25px; background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer;">
                        重新尝试
                    </button>
                </div>
            `;
        }
        
        let errorMessage = '命理分析失败，请稍后再试。';
        if (error.message.includes('401')) {
            errorMessage = 'API密钥错误，请联系管理员。';
        } else if (error.message.includes('429')) {
            errorMessage = '请求过于频繁，请稍等1分钟后重试。';
        }
        
        alert(`⚠️ ${errorMessage}`);
    }
}

// ============ 【页面初始化】 ============
window.addEventListener('DOMContentLoaded', initApp);

// 导出给全局使用
window.switchService = switchService;
window.startAnalysis = startAnalysis;
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.confirmPayment = confirmPayment;
window.downloadReport = downloadReport;
window.newAnalysis = newAnalysis;
window.handlePaymentSuccess = handlePaymentSuccess;

// ✅ 导出对象
window.PaymentManager = PaymentManager;
window.STATE = STATE;
window.UI = UI;

function downloadReport() {
    console.log('📥 尝试下载报告...');
    
    if (STATE.isDownloadLocked) {
        alert('请先解锁完整报告才能下载！');
        showPaymentModal();
        return;
    }
    
    if (!STATE.userData || !STATE.fullAnalysisResult) {
        alert('请先进行测算分析');
        return;
    }
    
    const currentServiceName = STATE.currentService || '测算验证';
    
    let predictorInfo = `命理分析报告 - ${currentServiceName}

预测者信息：
姓名：${STATE.userData.name}
性别：${STATE.userData.gender}
出生时间：${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日${STATE.userData.birthHour}时${STATE.userData.birthMinute}分
出生城市：${STATE.userData.birthCity}
测算服务：${currentServiceName}
测算时间：${new Date().toLocaleString('zh-CN')}`;

    if (currentServiceName === '八字合婚' && STATE.partnerData) {
        predictorInfo += `

伴侣信息：
姓名：${STATE.partnerData.partnerName}
性别：${STATE.partnerData.partnerGender}
出生时间：${STATE.partnerData.partnerBirthYear}年${STATE.partnerData.partnerBirthMonth}月${STATE.partnerData.partnerBirthDay}日${STATE.partnerData.partnerBirthHour}时${STATE.partnerData.partnerBirthMinute}分
出生城市：${STATE.partnerData.partnerBirthCity}`;
    }

    let baziInfo = '';
    const baziDataToDisplay = STATE.baziData;
    baziInfo = `八字排盘：
年柱：${baziDataToDisplay.yearColumn} (${baziDataToDisplay.yearElement})
月柱：${baziDataToDisplay.monthColumn} (${baziDataToDisplay.monthElement})
日柱：${baziDataToDisplay.dayColumn} (${baziDataToDisplay.dayElement})
时柱：${baziDataToDisplay.hourColumn} (${baziDataToDisplay.hourElement})`;
    
    const reportContent = `命理分析报告 - ${STATE.currentService}

${predictorInfo}

${baziInfo}

${STATE.fullAnalysisResult}

--- 命理分析服务平台 ---
分析时间：${new Date().toLocaleString('zh-CN')}
使用技术：DeepSeek AI命理分析系统`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `命理分析报告_${STATE.userData.name}_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('报告下载完成');
}

function newAnalysis() {
    console.log('重新测算...');
    RunzangStorage.clearCurrentOrder();
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    STATE.lastAiOrderId = null;
    STATE.queryPaymentAmount = null;
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    lockDownloadButton();
    hideAnalysisResult();
    resetUnlockInterface();
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) freeAnalysisText.innerHTML = '';
    if (location.hash === '#history') location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 导出给全局使用 - 创建包装函数
window.switchService = switchService;

// ✅ 修改这里：显式地将导入的函数赋值给window
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.confirmPayment = confirmPayment;
window.downloadReport = downloadReport;
window.newAnalysis = newAnalysis;
window.handlePaymentSuccess = handlePaymentSuccess;

if (typeof PaymentManager !== 'undefined') {
    window.PaymentManager = PaymentManager;
}

if (typeof STATE !== 'undefined') {
    window.STATE = STATE;
}

// ✅ 也导出UI对象（如果需要在其他地方使用）
window.UI = UI;
