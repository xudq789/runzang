// ============ 【支付状态管理器】 ============
const PaymentManager = {
    // 初始化支付检查
    async initPaymentCheck() {
        console.log('🔍 检查支付状态...');
        
        try {
            // 从 localStorage 读取支付状态
            const paymentData = localStorage.getItem('rz_payment_data');
            if (paymentData) {
                const data = JSON.parse(paymentData);
                console.log('找到支付数据:', data);
                
                // 恢复支付状态
                if (data.verified && data.orderId) {
                    STATE.isPaymentUnlocked = true;
                    STATE.isDownloadLocked = false;
                    STATE.currentOrderId = data.orderId;
                    
                    console.log('✅ 支付状态已恢复');
                }
            }
        } catch (error) {
            console.error('检查支付状态失败:', error);
        }
    },
    
    // 保存支付数据
    savePaymentData(orderId, verified = true) {
        const paymentData = {
            orderId,
            verified,
            timestamp: new Date().toISOString(),
            service: STATE.currentService
        };
        
        localStorage.setItem('rz_payment_data', JSON.stringify(paymentData));
        console.log('支付数据已保存:', paymentData);
    }
};

// ============ 【主要应用代码】 ============
import { SERVICES, STATE } from './config.js';
import { checkAPIStatus, parseBaziData, callDeepSeekAPI } from './api.js';
import {
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

// ============ 【核心函数】 ============

// 初始化应用
async function initApp() {
    console.log('🚀 应用初始化开始...');
    
    try {
        // 1. 初始化表单选项
        initFormOptions();
        
        // 2. 设置默认值（延迟执行确保DOM已加载）
        setTimeout(() => {
            setDefaultValues();
        }, 100);
        
        // 3. 检查支付状态
        await PaymentManager.initPaymentCheck();
        
        // 4. 更新UI
        updateServiceDisplay(STATE.currentService);
        updateUnlockInfo();
        
        // 5. 根据支付状态设置下载按钮
        if (STATE.isPaymentUnlocked) {
            unlockDownloadButton();
        } else {
            lockDownloadButton();
        }
        
        // 6. 设置事件监听器
        setupEventListeners();
        
        // 7. 检查API状态
        STATE.apiStatus = await checkAPIStatus();
        
        console.log('✅ 应用初始化完成');
        
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
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
    const analyzeBtn = document.getElementById('analyze-btn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', startAnalysis);
    }
    
    // 解锁按钮
    const unlockBtn = document.getElementById('unlock-btn');
    if (unlockBtn) {
        unlockBtn.addEventListener('click', showPaymentModal);
    }
    
    // 下载报告按钮
    const downloadReportBtn = document.getElementById('download-report-btn');
    if (downloadReportBtn) {
        downloadReportBtn.addEventListener('click', downloadReport);
    }
    
    // 重新测算按钮
    const recalculateBtn = document.getElementById('recalculate-btn');
    if (recalculateBtn) {
        recalculateBtn.addEventListener('click', newAnalysis);
    }
    
    // 支付弹窗按钮
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');
    const cancelPaymentBtn = document.getElementById('cancel-payment-btn');
    const closePaymentBtn = document.getElementById('close-payment');
    
    if (confirmPaymentBtn) {
        confirmPaymentBtn.addEventListener('click', confirmPayment);
    }
    if (cancelPaymentBtn) {
        cancelPaymentBtn.addEventListener('click', closePaymentModal);
    }
    if (closePaymentBtn) {
        closePaymentBtn.addEventListener('click', closePaymentModal);
    }
    
    // ESC键关闭支付弹窗
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePaymentModal();
        }
    });
}

// 切换服务
function switchService(serviceName) {
    console.log('🔄 切换服务到:', serviceName);
    
    if (!SERVICES[serviceName]) {
        console.error('服务不存在:', serviceName);
        return;
    }
    
    // 更新当前服务
    STATE.currentService = serviceName;
    
    // 如果是不同服务，重置分析状态（除非已支付）
    if (!STATE.isPaymentUnlocked) {
        STATE.fullAnalysisResult = '';
        STATE.baziData = null;
        STATE.partnerBaziData = null;
        STATE.userData = null;
        STATE.partnerData = null;
        STATE.isDownloadLocked = true;
    }
    
    // 更新UI
    updateServiceDisplay(serviceName);
    updateUnlockInfo();
    resetUnlockInterface();
    
    // 锁定下载按钮（如果未支付）
    if (!STATE.isPaymentUnlocked) {
        lockDownloadButton();
        hideAnalysisResult();
    } else {
        // 如果已支付，确保下载按钮解锁
        unlockDownloadButton();
    }
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('✅ 服务切换完成');
}

// 开始分析
async function startAnalysis() {
    console.log('🔮 开始命理分析...');
    console.log('当前服务:', STATE.currentService);
    
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
    
    // 重置状态（除非已经支付）
    if (!STATE.isPaymentUnlocked) {
        STATE.fullAnalysisResult = '';
        STATE.baziData = null;
        STATE.partnerBaziData = null;
        STATE.isDownloadLocked = true;
        lockDownloadButton();
    }
    
    // 触发按钮拉伸动画
    animateButtonStretch();
    
    // 显示加载弹窗
    showLoadingModal();
    
    try {
        // 收集用户数据
        collectUserData();
        console.log('✅ 用户数据收集完成');
        
        // 清空显示区域
        const freeAnalysisText = document.getElementById('free-analysis-text');
        if (freeAnalysisText) {
            freeAnalysisText.innerHTML = '<div class="loading-text">正在生成分析结果...</div>';
        }
        
        // 显示预测者信息
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
            console.log('📝 提示词生成完成');
        } catch (error) {
            console.error('生成提示词失败:', error);
            alert(error.message);
            hideLoadingModal();
            return;
        }
        
        // 调用API
        console.log('📡 调用DeepSeek API...');
        const analysisResult = await callDeepSeekAPI(prompt);
        console.log('✅ API调用成功');
        
        // 保存分析结果
        STATE.fullAnalysisResult = analysisResult;
        
        // 处理分析结果
        const parsedBaziData = parseBaziData(analysisResult);
        STATE.baziData = parsedBaziData.userBazi;
        STATE.partnerBaziData = parsedBaziData.partnerBazi;
        
        // 显示结果
        displayBaziPan();
        processAndDisplayAnalysis(analysisResult);
        showAnalysisResult();
        
        // 隐藏加载弹窗
        hideLoadingModal();
        
        console.log('🎉 命理分析完成');
        
    } catch (error) {
        console.error('分析失败:', error);
        hideLoadingModal();
        alert('命理分析失败，请稍后再试。错误：' + error.message);
    }
}

// 支付成功处理
function handlePaymentSuccess(orderId) {
    console.log('💰 支付成功处理，订单:', orderId);
    
    // 更新状态
    STATE.isPaymentUnlocked = true;
    STATE.isDownloadLocked = false;
    STATE.currentOrderId = orderId;
    
    // 保存支付数据
    PaymentManager.savePaymentData(orderId);
    
    // 更新UI
    closePaymentModal();
    updateUnlockInterface();
    showFullAnalysisContent();
    unlockDownloadButton();
    
    // 显示成功提示
    showSuccessAlert('支付成功！算命报告已解锁', '#4CAF50');
    
    console.log('✅ 支付成功处理完成');
}

// 确认支付
function confirmPayment() {
    if (!STATE.currentOrderId) {
        alert('请先点击"前往支付宝支付"按钮完成支付');
        return;
    }
    
    const confirmed = confirm('如果您已完成支付宝支付，请点击"确定"解锁内容。\n如支付遇到问题，请联系客服微信：runzang888');
    
    if (confirmed) {
        handlePaymentSuccess(STATE.currentOrderId);
    }
}

// 下载报告
function downloadReport() {
    console.log('📥 下载报告...');
    
    // 检查是否已支付
    if (STATE.isDownloadLocked || !STATE.isPaymentUnlocked) {
        console.log('❌ 未支付，无法下载');
        alert('请先解锁完整报告才能下载！');
        showPaymentModal();
        return;
    }
    
    // 检查必要数据
    if (!STATE.userData || !STATE.fullAnalysisResult) {
        alert('请先进行测算分析');
        return;
    }
    
    try {
        // 生成报告内容
        let reportContent = `命理分析报告 - ${STATE.currentService}\n\n`;
        
        // 预测者信息
        reportContent += `预测者信息：\n`;
        reportContent += `姓名：${STATE.userData.name}\n`;
        reportContent += `性别：${STATE.userData.gender}\n`;
        reportContent += `出生时间：${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日${STATE.userData.birthHour}时${STATE.userData.birthMinute}分\n`;
        reportContent += `出生城市：${STATE.userData.birthCity}\n`;
        reportContent += `测算服务：${STATE.currentService}\n`;
        reportContent += `测算时间：${new Date().toLocaleString('zh-CN')}\n\n`;
        
        // 八字排盘
        if (STATE.baziData) {
            reportContent += `八字排盘：\n`;
            reportContent += `年柱：${STATE.baziData.yearColumn} (${STATE.baziData.yearElement})\n`;
            reportContent += `月柱：${STATE.baziData.monthColumn} (${STATE.baziData.monthElement})\n`;
            reportContent += `日柱：${STATE.baziData.dayColumn} (${STATE.baziData.dayElement})\n`;
            reportContent += `时柱：${STATE.baziData.hourColumn} (${STATE.baziData.hourElement})\n\n`;
        }
        
        // 分析结果
        reportContent += `${STATE.fullAnalysisResult}\n\n`;
        
        // 页脚
        reportContent += `--- 命理分析服务平台 ---\n`;
        reportContent += `分析时间：${new Date().toLocaleString('zh-CN')}\n`;
        reportContent += `使用技术：DeepSeek AI命理分析系统`;
        
        // 创建并下载文件
        const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `命理分析报告_${STATE.userData.name}_${new Date().toISOString().slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        console.log('✅ 报告下载完成');
        
        // 显示成功提示
        showSuccessAlert('报告下载成功！', '#2196F3');
        
    } catch (error) {
        console.error('下载失败:', error);
        alert('下载失败：' + error.message);
    }
}

// 显示成功提示
function showSuccessAlert(message, color) {
    const alertDiv = document.createElement('div');
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background: linear-gradient(135deg, ${color}, ${color}99);
        color: white;
        padding: 15px 30px;
        border-radius: 8px;
        z-index: 10000;
        box-shadow: 0 4px 20px ${color}4D;
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
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 3000);
}

// 重新测算
function newAnalysis() {
    console.log('重新测算...');
    
    // 重置状态
    if (!STATE.isPaymentUnlocked) {
        STATE.fullAnalysisResult = '';
        STATE.baziData = null;
        STATE.partnerBaziData = null;
        STATE.isDownloadLocked = true;
        lockDownloadButton();
    }
    
    // 隐藏分析结果区域
    hideAnalysisResult();
    
    // 重置解锁界面
    resetUnlockInterface();
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ 【页面初始化】 ============

// 页面完全加载后初始化
window.addEventListener('load', () => {
    console.log('📄 页面完全加载，开始初始化应用...');
    setTimeout(initApp, 100);
});

// 导出给全局使用
window.switchService = switchService;
window.startAnalysis = startAnalysis;
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.confirmPayment = confirmPayment;
window.downloadReport = downloadReport;
window.newAnalysis = newAnalysis;
window.handlePaymentSuccess = handlePaymentSuccess;
