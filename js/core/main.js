// ============ 【支付宝支付回调处理模块】 ============
const AlipayCallbackHandler = {
    // 检查URL中是否有后端返回的支付成功参数
    checkBackendCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success');
        const orderId = urlParams.get('order_id');
        const verified = urlParams.get('verified');
        const amount = urlParams.get('amount');
        
        if (paymentSuccess === 'true' && orderId && verified === 'true') {
            console.log('✅ 检测到后端已验证的支付成功参数:', { orderId, amount, verified });
            
            // 保存验证信息
            const paymentData = {
                orderId,
                amount,
                verified: true,
                backendVerified: true,
                timestamp: new Date().toISOString()
            };
            
            localStorage.setItem('alipay_payment_data', JSON.stringify(paymentData));
            console.log('支付验证信息已保存到 localStorage');
            
            // 清理URL参数
            this.cleanUrlParams();
            
            return orderId;
        }
        
        // 检查其他可能的支付状态参数
        const paymentStatus = urlParams.get('payment_status');
        if (paymentStatus === 'waiting' && orderId) {
            console.log('⏳ 检测到支付等待状态:', orderId);
            this.cleanUrlParams();
        }
        
        return null;
    },
    
    // 清理URL参数
    cleanUrlParams() {
        try {
            if (window.history.replaceState) {
                const cleanUrl = window.location.pathname + window.location.hash;
                window.history.replaceState({}, document.title, cleanUrl);
                console.log('URL参数已清理');
            }
        } catch (error) {
            console.log('URL清理失败:', error);
        }
    }
};

// ============ 【支付状态管理器】 ============
const PaymentManager = {
    // 初始化支付检查
    initPaymentCheck: async function() {
        console.log('🔍 初始化支付状态检查...');
        
        // 1. 检查后端回调
        const orderIdFromCallback = AlipayCallbackHandler.checkBackendCallback();
        if (orderIdFromCallback) {
            console.log('发现后端回调订单，立即解锁:', orderIdFromCallback);
            await this.verifyAndUnlock(orderIdFromCallback, true);
            return;
        }
        
        // 2. 检查已保存的支付状态
        await this.checkSavedPayment();
    },
    
    // 检查已保存的支付状态
    checkSavedPayment: async function() {
        try {
            const paymentData = this.getPaymentData();
            if (!paymentData) {
                console.log('没有找到已保存的支付数据');
                return;
            }
            
            console.log('找到已保存的支付数据:', paymentData.orderId);
            
            // 如果已经是后端验证过的，直接解锁
            if (paymentData.backendVerified) {
                console.log('支付已由后端验证过，解锁内容');
                await this.unlockContent(paymentData.orderId);
                return;
            }
            
            // 否则向后端查询状态
            const verified = await this.verifyPaymentStatus(paymentData.orderId);
            if (verified) {
                await this.unlockContent(paymentData.orderId);
            }
            
        } catch (error) {
            console.error('检查支付状态失败:', error);
        }
    },
    
    // 获取支付数据
    getPaymentData: function() {
        try {
            const data = localStorage.getItem('alipay_payment_data');
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('解析支付数据失败:', error);
            return null;
        }
    },
    
    // 验证支付状态
    verifyPaymentStatus: async function(orderId) {
        try {
            console.log('🔐 验证支付状态，订单号:', orderId);
            const apiUrl = `https://runzang.top/api/payment/status/${orderId}`;
            console.log('查询URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                mode: 'cors'
            });
            
            if (!response.ok) {
                console.error('HTTP错误:', response.status);
                return false;
            }
            
            const result = await response.json();
            console.log('支付状态响应:', result);
            
            if (result.success && result.data.status === 'paid') {
                console.log('✅ 支付验证成功');
                
                // 更新支付数据
                const paymentData = this.getPaymentData() || {};
                paymentData.verified = true;
                paymentData.verifiedAt = new Date().toISOString();
                localStorage.setItem('alipay_payment_data', JSON.stringify(paymentData));
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('支付验证失败:', error);
            return false;
        }
    },
    
    // 验证并解锁
    verifyAndUnlock: async function(orderId, isBackendVerified = false) {
        try {
            // 如果是后端已验证的，直接解锁
            if (isBackendVerified) {
                console.log('✅ 后端已验证支付，直接解锁');
                await this.unlockContent(orderId);
                return true;
            }
            
            // 否则查询状态
            const verified = await this.verifyPaymentStatus(orderId);
            if (verified) {
                await this.unlockContent(orderId);
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('验证并解锁失败:', error);
            return false;
        }
    },
    
    // 解锁内容
    unlockContent: async function(orderId) {
        console.log('🔓 开始解锁内容，订单:', orderId);
        
        STATE.isPaymentUnlocked = true;
        STATE.isDownloadLocked = false;
        STATE.currentOrderId = orderId;
        
        try {
            // 尝试恢复分析结果
            const restored = await this.restoreAnalysis();
            
            if (restored) {
                this.updateUIAfterPayment();
                this.showSuccessMessage();
                
                setTimeout(() => {
                    this.unlockDownloadButtonDirectly();
                }, 300);
                
                setTimeout(() => {
                    const resultSection = document.getElementById('analysis-result-section');
                    if (resultSection) {
                        resultSection.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 500);
            } else {
                console.log('没有找到保存的分析结果');
                if (STATE.fullAnalysisResult) {
                    console.log('但有当前分析结果，直接解锁');
                    this.updateUIAfterPayment();
                    this.showSuccessMessage();
                }
            }
        } catch (error) {
            console.error('解锁内容失败:', error);
            this.unlockDownloadButtonDirectly();
        }
    },
    
    unlockDownloadButtonDirectly: function() {
        const downloadBtn = document.getElementById('download-report-btn');
        const downloadBtnText = document.getElementById('download-btn-text');
        
        if (downloadBtn && downloadBtnText) {
            downloadBtn.disabled = false;
            downloadBtn.classList.remove('download-btn-locked');
            downloadBtnText.textContent = '下载报告';
            downloadBtn.style.background = 'linear-gradient(135deg, var(--primary-color), #3a7bd5)';
            downloadBtn.style.boxShadow = '0 4px 15px rgba(58, 123, 213, 0.4)';
            
            console.log('✅ 直接解锁下载按钮成功');
            return true;
        }
        console.error('❌ 找不到下载按钮元素');
        return false;
    },
    
    restoreAnalysis: async function() {
        try {
            const savedResult = localStorage.getItem('last_analysis_result');
            const savedService = localStorage.getItem('last_analysis_service');
            const savedUserData = localStorage.getItem('last_user_data');
            
            if (!savedResult || !savedService) {
                console.log('没有保存的分析结果');
                return false;
            }
            
            console.log('📥 从存储恢复分析结果...');
            STATE.fullAnalysisResult = savedResult;
            STATE.currentService = savedService;
            
            if (savedUserData) {
                try {
                    STATE.userData = JSON.parse(savedUserData);
                } catch (e) {
                    console.error('解析用户数据失败:', e);
                }
            }
            
            // 这里调用了 parseBaziData
            //const parsedBaziData = parseBaziData(savedResult);
            //STATE.baziData = parsedBaziData.userBazi;
            
            updateServiceDisplay(savedService);
            displayPredictorInfo();
            displayBaziPan();
            processAndDisplayAnalysis(savedResult);
            showAnalysisResult();
            
            console.log('✅ 分析结果恢复成功');
            return true;
            
        } catch (error) {
            console.error('恢复分析失败:', error);
            return false;
        }
    },
    
    updateUIAfterPayment: function() {
        console.log('🎨 更新支付后UI...');
        
        if (typeof updateUnlockInterface === 'function') {
            updateUnlockInterface();
        }
        
        if (typeof showFullAnalysisContent === 'function') {
            showFullAnalysisContent();
        }
        
        if (typeof unlockDownloadButton === 'function') {
            unlockDownloadButton();
        }
        
        if (typeof closePaymentModal === 'function') {
            closePaymentModal();
        }
    },
    
    showSuccessMessage: function() {
        if (document.getElementById('payment-success-alert')) return;
        
        const alertDiv = document.createElement('div');
        alertDiv.id = 'payment-success-alert';
        alertDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 15px 30px;
            border-radius: 8px;
            z-index: 10000;
            box-shadow: 0 4px 20px rgba(76, 175, 80, 0.3);
            font-size: 16px;
            font-weight: bold;
            animation: slideDown 0.5s ease;
            text-align: center;
            min-width: 300px;
            max-width: 90%;
        `;
        
        alertDiv.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                <span style="font-size: 20px;">✅</span>
                <span>支付成功！算命报告已解锁</span>
            </div>
            <div style="margin-top: 8px; font-size: 12px; opacity: 0.9;">
                现在可以查看完整分析和下载报告
            </div>
        `;
        
        document.body.appendChild(alertDiv);
        
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    },
    
    saveAnalysisBeforePayment: function() {
        if (!STATE.fullAnalysisResult || !STATE.currentService || !STATE.userData) {
            console.error('无法保存分析数据：缺少必要信息');
            return false;
        }
        
        try {
            localStorage.setItem('last_analysis_result', STATE.fullAnalysisResult);
            localStorage.setItem('last_analysis_service', STATE.currentService);
            localStorage.setItem('last_user_data', JSON.stringify(STATE.userData));
            
            console.log('✅ 分析数据已保存到 localStorage');
            return true;
            
        } catch (error) {
            console.error('保存分析数据失败:', error);
            return false;
        }
    }
};

// ============ 【新增：简化版URL支付回调检测函数】 ============
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
                            localStorage.getItem('paid_order_id');
            
            if (orderId) {
                console.log('订单ID:', orderId);
                
                // 保存到localStorage
                localStorage.setItem('paid_order_id', orderId);
                
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

// ============ 【导入核心模块】 ============
import { SERVICES, STATE } from './config.js';
import { checkAPIStatus, parseBaziData, callDeepSeekAPI } from './api.js';
import {
    UI,
    initFormOptions,
    setDefaultValues,
    updateServiceDisplay,
    updateUnlockInfo,
    displayPredictorInfo,
    displayBaziPan,
    displayDayunPan,  // 确保这行存在
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
    showAnalysisResult,
    hideAnalysisResult,
    validateForm,
    collectUserData
} from './ui.js';

import { CesuanModule } from '../modules/cesuan.js';
import { YunchengModule } from '../modules/yuncheng.js';
import { XiangpiModule } from '../modules/xiangpi.js';
import { HehunModule } from '../modules/hehun.js';

const SERVICE_MODULES = {
    '测算验证': CesuanModule,
    '流年运程': YunchengModule,
    '人生详批': XiangpiModule,
    '八字合婚': HehunModule
};

// ============ 【支付相关函数】 ============
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
    if (!STATE.currentOrderId) {
        alert('请先点击"前往支付宝支付"按钮完成支付');
        return;
    }
    
    const confirmed = confirm('如果您已完成支付宝支付，请点击"确定"解锁内容。\n如支付遇到问题，请联系客服微信：runzang888');
    
    if (confirmed) {
        console.log('检查支付状态，订单:', STATE.currentOrderId);
        fetch(`https://runzang.top/api/payment/status/${STATE.currentOrderId}`, {
            mode: 'cors'
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            console.log('支付状态结果:', result);
            if (result.success && result.data.status === 'paid') {
                handlePaymentSuccess();
            } else {
                alert('支付状态未确认，请稍后再试或联系客服');
            }
        })
        .catch(error => {
            console.error('检查支付状态失败:', error);
            alert(`网络错误: ${error.message}\n请稍后重试或联系客服`);
        });
    }
}

// ============ 【主要应用函数】 ============
async function initApp() {
    console.log('🚀 应用初始化开始...');
    
    try {
        const urlOrderId = checkPaymentSuccessFromURL();
        if (urlOrderId) {
            console.log('✅ 检测到URL支付回调，订单ID:', urlOrderId);
        }
        
        await PaymentManager.initPaymentCheck();
        
        console.log('3. 常规初始化...');
        initFormOptions();
        setDefaultValues();
        updateServiceDisplay(STATE.currentService);
        updateUnlockInfo();
        lockDownloadButton();
        setupEventListeners();
        STATE.apiStatus = await checkAPIStatus();
        preloadImages();
        
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
    
    document.querySelectorAll('.service-nav a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const serviceName = this.dataset.service;
            switchService(serviceName);
        });
    });
    
    UI.analyzeBtn().addEventListener('click', startAnalysis);
    UI.unlockBtn().addEventListener('click', showPaymentModal);
    UI.downloadReportBtn().addEventListener('click', downloadReport);
    UI.recalculateBtn().addEventListener('click', newAnalysis);
    UI.confirmPaymentBtn().addEventListener('click', confirmPayment);
    UI.cancelPaymentBtn().addEventListener('click', closePaymentModal);
    UI.closePaymentBtn().addEventListener('click', closePaymentModal);
    
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
        STATE.currentOrderId = null;
        STATE.userData = null;
        STATE.partnerData = null;
        
        console.log('✅ 所有状态已重置');
    }
    
    STATE.currentService = serviceName;
    updateServiceDisplay(serviceName);
    updateUnlockInfo();
    resetUnlockInterface();
    lockDownloadButton();
    
    if (oldService !== serviceName) {
        hideAnalysisResult();
        
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
    
    if (STATE.apiStatus !== 'online') {
        alert('⚠️ API连接异常，请稍后再试或检查网络连接。');
        return;
    }
    
    if (!validateForm()) {
        alert('请填写完整的个人信息');
        return;
    }
    
    const resultServiceName = document.getElementById('result-service-name');
    if (resultServiceName) {
        resultServiceName.textContent = STATE.currentService + '分析报告';
    }
    
    console.log('🔄 清空旧的分析结果...');
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    
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
        
        // 获取当前服务的模块和完整提示词
        const serviceModule = SERVICE_MODULES[STATE.currentService];
        if (!serviceModule) {
            throw new Error(`未找到服务模块: ${STATE.currentService}`);
        }
        
        let prompt;
        try {
            prompt = serviceModule.getPrompt(STATE.userData, STATE.partnerData);
        } catch (error) {
            console.error('生成提示词失败:', error);
            hideLoadingModal();
            alert(error.message);
            return;
        }
        
        console.log('开始分析，提示词长度:', prompt.length);
        
        // 调用传统API（一次性获取完整结果）
        const analysisResult = await callDeepSeekAPI(prompt);
        
        // 保存完整结果
        STATE.fullAnalysisResult = analysisResult;
        
        // 提取八字数据
        const parsedBaziData = parseBaziData(analysisResult);
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
        processAndDisplayAnalysis(analysisResult);
        console.log('✅ 分析内容处理完成');
        
        console.log('传统API分析完成，总字数:', analysisResult.length);
        
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
        
        // 保存到本地存储（用于支付后恢复）
        try {
            localStorage.setItem('last_analysis_result', analysisResult);
            localStorage.setItem('last_analysis_service', STATE.currentService);
            localStorage.setItem('last_user_data', JSON.stringify(STATE.userData || {}));
            
            if (STATE.partnerData) {
                localStorage.setItem('last_partner_data', JSON.stringify(STATE.partnerData));
            }
            
            console.log('✅ 分析数据已保存到本地存储');
        } catch (storageError) {
            console.warn('保存到本地存储失败:', storageError);
        }
        
        // 检查支付状态
        const paymentData = PaymentManager.getPaymentData();
        if (paymentData && paymentData.verified) {
            const savedService = localStorage.getItem('last_analysis_service');
            if (savedService === STATE.currentService && !STATE.isPaymentUnlocked) {
                console.log('当前服务已支付，自动解锁');
                setTimeout(() => {
                    PaymentManager.updateUIAfterPayment();
                }, 1000);
            }
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
                    <div style="color: #999; font-size: 14px; background: #f9f9f9; padding: 15px; border-radius: 6px; text-align: left;">
                        <div style="margin-bottom: 8px;"><strong>可能原因：</strong></div>
                        <ul style="margin: 0; padding-left: 20px;">
                            <li>网络连接不稳定</li>
                            <li>API服务暂时不可用</li>
                            <li>输入信息格式有误</li>
                            <li>服务器繁忙，请稍后重试</li>
                        </ul>
                    </div>
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
        } else if (error.message.includes('网络') || error.message.includes('Network')) {
            errorMessage = '网络连接失败，请检查网络后重试。';
        } else if (error.message.includes('超时') || error.message.includes('timeout')) {
            errorMessage = '请求超时，网络较慢，请稍后重试。';
        }
        
        // 更友好的错误提示
        const errorDetail = error.message ? error.message.substring(0, 100) : '未知错误';
        alert(`⚠️ ${errorMessage}\n\n错误代码: ${errorDetail}\n\n建议：\n1. 检查网络连接\n2. 稍后重试\n3. 如持续失败，请联系客服`);
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
    
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    
    lockDownloadButton();
    hideAnalysisResult();
    resetUnlockInterface();
    
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) {
        freeAnalysisText.innerHTML = '';
    }
    
    STATE.currentOrderId = null;
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ 【页面初始化】 ============
//window.addEventListener('DOMContentLoaded', initApp);

// 导出给全局使用 - 创建包装函数
window.switchService = switchService;
//window.startAnalysis = startAnalysis;

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

// 移除流式输出相关导出
// window.StreamingAnalysisManager = StreamingAnalysisManager;

// ✅ 也导出UI对象（如果需要在其他地方使用）
window.UI = UI;










