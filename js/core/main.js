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

// 修正这里的导入路径 - 使用相对于当前文件的路径
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
        // preloadImages(); // 注释掉或删除
        
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
    UI.downloadReportBtn().addEventListener('click', function() {
    console.log('下载报告功能...');
    
    if (STATE.isDownloadLocked) {
        alert('请先解锁完整报告才能下载');
        return;
    }
    
    alert('下载功能正在开发中，请稍后再试');
});
    
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

// 1. 切换服务 - 修改
function switchService(serviceName) {
    console.log('切换服务到:', serviceName);
    
    if (!SERVICES[serviceName]) {
        console.error('服务不存在:', serviceName);
        return;
    }
    
    STATE.currentService = serviceName;
    
    // 重要：切换服务时，读取新服务的解锁状态
    const newServiceUnlocked = STATE.servicesUnlocked[serviceName] || false;
    STATE.isPaymentUnlocked = newServiceUnlocked;
    STATE.isDownloadLocked = !newServiceUnlocked;
    
    // 更新UI显示
    updateServiceDisplay(serviceName);
    
    // 更新解锁信息
    updateUnlockInfo();
    
    // 隐藏分析结果区域
    hideAnalysisResult();
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('服务切换完成，解锁状态:', STATE.isPaymentUnlocked);
}

// 2. 开始分析 - 修改开头部分
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
    
    // 重要：检查当前服务是否已解锁
    const currentServiceUnlocked = STATE.servicesUnlocked[STATE.currentService] || false;
    
    // 根据解锁状态设置
    if (!currentServiceUnlocked) {
        // 服务未解锁，重置状态
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
        
        // 锁定下载按钮
        lockDownloadButton();
        
        // 重置解锁界面
        resetUnlockInterface();
    } else {
        // 服务已解锁，保持解锁状态
        STATE.isPaymentUnlocked = true;
        STATE.isDownloadLocked = false;
    }
    
    // 触发按钮拉伸动画
    animateButtonStretch();
    
    // 显示加载弹窗
    showLoadingModal();
    
    // ... 从这里开始，所有原有代码保持原样不变 ...
    try {
        // 收集用户数据
        collectUserData();
        
        // ... 原有代码 ...
    } catch (error) {
        // ... 原有错误处理 ...
    }
}

// 3. 确认支付 - 修改
function confirmPayment() {
    console.log('确认支付...');
    
    const confirmed = confirm('请确认您已完成支付？\n\n注意：如果是测试，请点击"确定"继续。实际应用中这里会连接支付网关验证支付状态。');
    
    if (confirmed) {
        // 重要：标记当前服务为已解锁
        STATE.servicesUnlocked[STATE.currentService] = true;
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
        console.log('当前服务已解锁:', STATE.currentService);
    }
}

// 4. 重新测算 - 修改
function newAnalysis() {
    console.log('重新测算...');
    
    // 检查当前服务是否已解锁
    const currentServiceUnlocked = STATE.servicesUnlocked[STATE.currentService] || false;
    
    // 根据解锁状态设置
    if (!currentServiceUnlocked) {
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
    }
    
    // 隐藏分析结果区域
    hideAnalysisResult();
    
    // 根据状态更新界面
    if (currentServiceUnlocked) {
        updateUnlockInterface();
        unlockDownloadButton();
    } else {
        resetUnlockInterface();
        lockDownloadButton();
    }
    
    // 重置内容显示
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) {
        freeAnalysisText.innerHTML = '';
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





