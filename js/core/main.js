// 主入口文件
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

// 服务模块映射
const SERVICE_MODULES = {
    '测算验证': CesuanModule,
    '流年运程': YunchengModule,
    '人生详批': XiangpiModule,
    '八字合婚': HehunModule
};

// 初始化应用
async function initApp() {
    console.log('正在初始化应用...');
    
    try {
        // 初始化表单选项
        initFormOptions();
        
        // 设置默认值
        setDefaultValues();
        
        // 更新服务显示
        updateServiceDisplay(STATE.currentService);
        
        // 更新解锁信息
        updateUnlockInfo();
        
        // 锁定下载按钮
        lockDownloadButton();
        
        // 设置事件监听器
        setupEventListeners();
        
        // 检查API状态
        STATE.apiStatus = await checkAPIStatus();
        
        // 预加载图片
        preloadImages();
        
        console.log('应用初始化完成');
    } catch (error) {
        console.error('应用初始化失败:', error);
    }
}

// 设置事件监听器
function setupEventListeners() {
    console.log('设置事件监听器...');
    
    // 导航栏点击事件
    document.querySelectorAll('.service-nav a').forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const serviceName = this.dataset.service;
            switchService(serviceName);
        });
    });
    
    // 立即测算按钮
    UI.analyzeBtn().addEventListener('click', startAnalysis);
    
    // 解锁按钮
    UI.unlockBtn().addEventListener('click', showPaymentModal);
    
    // 下载报告按钮
    UI.downloadReportBtn().addEventListener('click', downloadReport);
    
    // 重新测算按钮
    UI.recalculateBtn().addEventListener('click', newAnalysis);
    
    // 支付弹窗按钮
    UI.confirmPaymentBtn().addEventListener('click', confirmPayment);
    UI.cancelPaymentBtn().addEventListener('click', closePaymentModal);
    UI.closePaymentBtn().addEventListener('click', closePaymentModal);
    
    // ESC键关闭支付弹窗
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePaymentModal();
        }
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        const paymentModal = UI.paymentModal();
        if (event.target === paymentModal) {
            closePaymentModal();
        }
    });
    
    // 图片加载完成事件
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

// 切换服务 - 修正：重置解锁状态
function switchService(serviceName) {
    console.log('切换服务到:', serviceName);
    
    if (!SERVICES[serviceName]) {
        console.error('服务不存在:', serviceName);
        return;
    }
    
    // 记录旧服务状态（如果需要）
    const oldService = STATE.currentService;
    STATE.currentService = serviceName;
    
    // 重要：切换服务时重置全局解锁状态
    STATE.isPaymentUnlocked = STATE.serviceUnlockedStates[serviceName] || false;
    STATE.isDownloadLocked = !STATE.isPaymentUnlocked;
    
    // 更新UI显示
    updateServiceDisplay(serviceName);
    
    // 更新解锁信息 - 这会根据当前服务的解锁状态更新界面
    updateUnlockInfo();
    
    // 隐藏分析结果区域
    hideAnalysisResult();
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('服务切换完成，当前服务:', serviceName, '解锁状态:', STATE.isPaymentUnlocked);
}

// 开始分析 - 修正：重置解锁状态
async function startAnalysis() {
    console.log('开始命理分析...');
    
    // 检查API状态
    if (STATE.apiStatus !== 'online') {
        alert('⚠️ API连接异常，请稍后再试或检查网络连接。');
        return;
    }
    
    // 验证表单
    if (!validateForm()) {
        alert('请填写完整的个人信息');
        return;
    }
    
    // 开始新的分析时，重置解锁状态（除非当前服务已经解锁过）
    if (!STATE.serviceUnlockedStates[STATE.currentService]) {
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
        
        // 锁定下载按钮
        lockDownloadButton();
        
        // 重置解锁界面
        resetUnlockInterface();
    } else {
        // 如果服务已解锁，保持解锁状态
        STATE.isPaymentUnlocked = true;
        STATE.isDownloadLocked = false;
        updateUnlockInterface();
        unlockDownloadButton();
    }
    
    // 触发按钮拉伸动画
    animateButtonStretch();
    
    // 显示加载弹窗
    showLoadingModal();
    
    try {
        // 收集用户数据
        collectUserData();
        
        // 先显示预测者信息
        displayPredictorInfo();
        
        // 获取当前服务的模块
        const serviceModule = SERVICE_MODULES[STATE.currentService];
        if (!serviceModule) {
            throw new Error(`未找到服务模块: ${STATE.currentService}`);
        }
        
        // 获取提示词
        let prompt;
        try {
            prompt = serviceModule.getPrompt(STATE.userData, STATE.partnerData);
        } catch (error) {
            console.error('生成提示词失败:', error);
            alert(error.message);
            hideLoadingModal();
            return;
        }
        
        console.log('生成的分析提示词长度:', prompt.length);
        
        // 调用API
        console.log('正在调用DeepSeek API...');
        const analysisResult = await callDeepSeekAPI(prompt);
        console.log('DeepSeek API调用成功，响应长度:', analysisResult.length);
        
        // 保存完整分析结果
        STATE.fullAnalysisResult = analysisResult;
        
        // 处理分析结果，提取八字数据
        const parsedBaziData = parseBaziData(analysisResult);
        STATE.baziData = parsedBaziData.userBazi;
        STATE.partnerBaziData = parsedBaziData.partnerBazi;
        
        // 显示八字排盘
        displayBaziPan();
        
        // 处理并显示分析结果
        processAndDisplayAnalysis(analysisResult);
        
        // 隐藏加载弹窗
        hideLoadingModal();
        
        // 显示分析结果区域
        showAnalysisResult();
        
        console.log('命理分析完成，结果已显示');
        
    } catch (error) {
        console.error('分析失败:', error);
        
        // 隐藏加载弹窗
        hideLoadingModal();
        
        // 显示错误信息
        let errorMessage = '命理分析失败，请稍后再试。';
        
        if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            errorMessage = 'API密钥错误，请联系管理员。';
        } else if (error.message.includes('429')) {
            errorMessage = '请求过于频繁，请稍后再试。';
        } else if (error.message.includes('网络') || error.message.includes('Network')) {
            errorMessage = '网络连接失败，请检查您的网络设置。';
        }
        
        alert(errorMessage + '\n\n错误详情：' + error.message);
    }
}

// 确认支付 - 修正：记录当前服务已解锁
function confirmPayment() {
    console.log('确认支付...');
    
    const confirmed = confirm('请确认您已完成支付？\n\n注意：如果是测试，请点击"确定"继续。实际应用中这里会连接支付网关验证支付状态。');
    
    if (confirmed) {
        // 标记当前服务已解锁
        STATE.serviceUnlockedStates[STATE.currentService] = true;
        STATE.isPaymentUnlocked = true;
        STATE.isDownloadLocked = false;
        
        // 关闭支付弹窗
        closePaymentModal();
        
        // 更新解锁界面状态
        updateUnlockInterface();
        
        // 显示完整内容
        showFullAnalysisContent();
        
        // 解锁下载报告按钮
        unlockDownloadButton();
        
        alert('支付成功！完整报告已解锁。');
        console.log('支付确认完成，当前服务解锁状态:', STATE.isPaymentUnlocked);
    }
}

// 重新测算 - 修正：不改变解锁状态
function newAnalysis() {
    console.log('重新测算...');
    
    // 重新测算时不改变解锁状态
    
    // 隐藏分析结果区域
    hideAnalysisResult();
    
    // 重置免费内容
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) {
        freeAnalysisText.innerHTML = '';
    }
    
    // 重置锁定内容
    const lockedAnalysisText = UI.lockedAnalysisText();
    if (lockedAnalysisText) {
        lockedAnalysisText.innerHTML = '';
    }
    
    // 根据当前服务的解锁状态更新界面
    if (STATE.serviceUnlockedStates[STATE.currentService]) {
        // 如果已解锁，保持解锁状态
        updateUnlockInterface();
        unlockDownloadButton();
    } else {
        // 如果未解锁，重置为锁定状态
        resetUnlockInterface();
        lockDownloadButton();
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', initApp);

// 导出给全局使用
window.switchService = switchService;
window.startAnalysis = startAnalysis;
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.confirmPayment = confirmPayment;
window.downloadReport = downloadReport;
window.newAnalysis = newAnalysis;


