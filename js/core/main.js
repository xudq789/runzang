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

// 切换服务
function switchService(serviceName) {
    console.log('切换服务到:', serviceName);
    
    if (!SERVICES[serviceName]) {
        console.error('服务不存在:', serviceName);
        return;
    }
    
    STATE.currentService = serviceName;
    
    // 更新UI显示
    updateServiceDisplay(serviceName);
    
    // 更新解锁信息
    updateUnlockInfo();
    
    // 重置下载按钮状态
    if (!STATE.isPaymentUnlocked) {
        lockDownloadButton();
    }
    
    // 隐藏分析结果区域
    hideAnalysisResult();
    
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    console.log('服务切换完成');
}

// 预加载图片
function preloadImages() {
    console.log('预加载图片...');
    
    // 预加载所有服务图片
    Object.values(SERVICES).forEach(service => {
        const heroImg = new Image();
        heroImg.src = service.heroImage;
        
        const detailImg = new Image();
        detailImg.src = service.detailImage;
    });
}

// 开始分析
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
    
    // 重置支付解锁状态
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    
    // 锁定下载按钮
    lockDownloadButton();
    
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

// 确认支付
function confirmPayment() {
    console.log('确认支付...');
    
    const confirmed = confirm('请确认您已完成支付？\n\n注意：如果是测试，请点击"确定"继续。实际应用中这里会连接支付网关验证支付状态。');
    
    if (confirmed) {
        // 设置支付解锁状态
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
        console.log('支付确认完成，内容已解锁，下载按钮已解锁');
    }
}

// 下载报告
function downloadReport() {
    console.log('下载报告...');
    
    // 检查是否已解锁
    if (STATE.isDownloadLocked) {
        alert('请先解锁完整报告才能下载！');
        showPaymentModal();
        return;
    }
    
    if (!STATE.userData || !STATE.fullAnalysisResult) {
        alert('请先进行测算分析');
        return;
    }
    
    // 收集预测者信息
    let predictorInfo = `预测者信息：
姓名：${STATE.userData.name}
性别：${STATE.userData.gender}
出生时间：${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日${STATE.userData.birthHour}时${STATE.userData.birthMinute}分
出生城市：${STATE.userData.birthCity}
测算服务：${STATE.currentService}
测算时间：${new Date().toLocaleString('zh-CN')}`;

    // 如果是八字合婚，添加伴侣信息
    if (STATE.currentService === '八字合婚' && STATE.partnerData) {
        predictorInfo += `

伴侣信息：
姓名：${STATE.partnerData.partnerName}
性别：${STATE.partnerData.partnerGender}
出生时间：${STATE.partnerData.partnerBirthYear}年${STATE.partnerData.partnerBirthMonth}月${STATE.partnerData.partnerBirthDay}日${STATE.partnerData.partnerBirthHour}时${STATE.partnerData.partnerBirthMinute}分
出生城市：${STATE.partnerData.partnerBirthCity}`;
    }

    // 获取八字排盘信息
    let baziInfo = '';
    
    if (STATE.currentService === '八字合婚' && STATE.partnerData && STATE.partnerBaziData) {
        // 八字合婚：显示用户和伴侣的八字
        baziInfo = `${STATE.userData.name} 八字排盘：
年柱：${STATE.baziData.yearColumn} (${STATE.baziData.yearElement})
月柱：${STATE.baziData.monthColumn} (${STATE.baziData.monthElement})
日柱：${STATE.baziData.dayColumn} (${STATE.baziData.dayElement})
时柱：${STATE.baziData.hourColumn} (${STATE.baziData.hourElement})

${STATE.partnerData.partnerName} 八字排盘：
年柱：${STATE.partnerBaziData.yearColumn} (${STATE.partnerBaziData.yearElement})
月柱：${STATE.partnerBaziData.monthColumn} (${STATE.partnerBaziData.monthElement})
日柱：${STATE.partnerBaziData.dayColumn} (${STATE.partnerBaziData.dayElement})
时柱：${STATE.partnerBaziData.hourColumn} (${STATE.partnerBaziData.hourElement})`;
    } else {
        // 其他服务：只显示用户的八字
        const baziDataToDisplay = STATE.baziData;
        baziInfo = `八字排盘：
年柱：${baziDataToDisplay.yearColumn} (${baziDataToDisplay.yearElement})
月柱：${baziDataToDisplay.monthColumn} (${baziDataToDisplay.monthElement})
日柱：${baziDataToDisplay.dayColumn} (${baziDataToDisplay.dayElement})
时柱：${baziDataToDisplay.hourColumn} (${baziDataToDisplay.hourElement})`;
    }
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

// 重新测算
function newAnalysis() {
    console.log('重新测算...');
    
    // 重置支付解锁状态
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    
    // 锁定下载按钮
    lockDownloadButton();
    
    // 隐藏分析结果区域
    hideAnalysisResult();
    
    // 重置解锁界面
    resetUnlockInterface();
    
    // 重置免费内容
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


