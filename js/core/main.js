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

// ============ 【新增】支付宝支付返回处理 ============

// 处理支付宝支付返回
async function handleAlipayReturn() {
    console.log('🔍 检查支付宝支付返回...');
    
    const urlParams = new URLSearchParams(window.location.search);
    
    // 检查是否是支付宝回调
    const isAlipayReturn = urlParams.get('alipay_return') === '1' || 
                          urlParams.has('out_trade_no') ||
                          urlParams.get('payment_success') === '1';
    
    if (!isAlipayReturn) {
        console.log('不是支付宝支付返回页面');
        return false;
    }
    
    console.log('🎯 检测到支付宝支付返回');
    
    // 提取支付宝参数
    const alipayParams = {
        orderId: urlParams.get('out_trade_no'),
        tradeNo: urlParams.get('trade_no'),
        amount: urlParams.get('total_amount'),
        subject: urlParams.get('subject'),
        timestamp: urlParams.get('timestamp') || new Date().toISOString()
    };
    
    console.log('支付宝回调参数:', alipayParams);
    
    if (!alipayParams.orderId) {
        console.warn('未找到订单号');
        return false;
    }
    
    // 保存支付信息到 localStorage
    localStorage.setItem('alipay_order_id', alipayParams.orderId);
    localStorage.setItem('alipay_paid_time', new Date().toISOString());
    localStorage.setItem('alipay_amount', alipayParams.amount || '');
    
    // 验证支付状态
    const verified = await verifyPaymentStatus(alipayParams.orderId);
    
    if (verified) {
        console.log('✅ 支付验证成功');
        return true;
    } else {
        console.log('支付验证失败或未完成');
        return false;
    }
}

// 验证支付状态
async function verifyPaymentStatus(orderId) {
    try {
        console.log(`正在验证支付状态，订单: ${orderId}`);
        
        const response = await fetch(`https://runzang.top/api/payment/status/${orderId}`);
        const result = await response.json();
        
        console.log('支付验证结果:', result);
        
        if (result.success && result.data.status === 'paid') {
            // 保存支付成功标记
            localStorage.setItem('paid_order_id', orderId);
            localStorage.setItem('payment_verified', 'true');
            localStorage.setItem('last_paid_order', orderId);
            
            return true;
        }
    } catch (error) {
        console.error('支付验证失败:', error);
    }
    
    return false;
}

// 解锁内容
function unlockContent() {
    console.log('🔓 解锁报告内容');
    
    // 更新全局状态
    STATE.isPaymentUnlocked = true;
    STATE.isDownloadLocked = false;
    
    // 调用UI解锁函数
    if (typeof updateUnlockInterface === 'function') {
        updateUnlockInterface();
    }
    
    if (typeof showFullAnalysisContent === 'function') {
        showFullAnalysisContent();
    }
    
    if (typeof unlockDownloadButton === 'function') {
        unlockDownloadButton();
    }
    
    // 显示成功提示
    setTimeout(() => {
        alert('✅ 支付成功！算命报告已解锁。');
    }, 300);
}

// 清理URL参数
function cleanUrlParams() {
    try {
        // 移除支付宝回调参数，避免刷新后重复处理
        if (window.history.replaceState) {
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            console.log('已清理URL参数');
        }
    } catch (error) {
        console.error('清理URL参数失败:', error);
    }
}

// 检查本地支付记录
function checkLocalPaymentRecords() {
    console.log('📱 检查本地支付记录...');
    
    // 检查是否有已支付的订单
    const paidOrderId = localStorage.getItem('paid_order_id') || 
                       localStorage.getItem('alipay_order_id');
    
    if (paidOrderId && localStorage.getItem('payment_verified') === 'true') {
        console.log('找到已支付的订单:', paidOrderId);
        
        // 如果已经有分析结果，立即解锁
        if (STATE.fullAnalysisResult) {
            console.log('已有分析结果，自动解锁');
            unlockContent();
            return true;
        } else {
            console.log('等待分析结果生成后再解锁');
            STATE.pendingUnlock = true;
            return false;
        }
    }
    
    return false;
}

// ============ 原有初始化函数（修改版） ============

// 初始化应用
async function initApp() {
    console.log('🚀 应用初始化开始...');
    
    try {
        // ============ 【第一步】支付返回处理 ============
        console.log('1. 处理支付返回...');
        const isPaymentReturn = await handleAlipayReturn();
        
        if (isPaymentReturn) {
            console.log('支付返回处理完成');
            // 清理URL参数
            cleanUrlParams();
        }
        
        // ============ 【第二步】初始化表单选项 ============
        console.log('2. 初始化表单选项...');
        initFormOptions();
        
        // ============ 【第三步】设置默认值 ============
        console.log('3. 设置默认值...');
        setDefaultValues();
        
        // ============ 【第四步】更新服务显示 ============
        console.log('4. 更新服务显示...');
        updateServiceDisplay(STATE.currentService);
        
        // ============ 【第五步】更新解锁信息 ============
        console.log('5. 更新解锁信息...');
        updateUnlockInfo();
        
        // ============ 【第六步】锁定下载按钮 ============
        console.log('6. 锁定下载按钮...');
        lockDownloadButton();
        
        // ============ 【第七步】设置事件监听器 ============
        console.log('7. 设置事件监听器...');
        setupEventListeners();
        
        // ============ 【第八步】检查API状态 ============
        console.log('8. 检查API状态...');
        STATE.apiStatus = await checkAPIStatus();
        
        // ============ 【第九步】预加载图片 ============
        console.log('9. 预加载图片...');
        preloadImages();
        
        // ============ 【第十步】检查本地支付记录 ============
        console.log('10. 检查本地支付记录...');
        checkLocalPaymentRecords();
        
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
    
    // 添加支付成功消息监听
    window.addEventListener('message', function(event) {
        if (event.data && event.data.type === 'payment_success') {
            console.log('收到支付成功消息');
            handlePaymentSuccess();
        }
    });
    
    // ============ 【新增】监听页面可见性变化 ============
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            // 页面从后台恢复，检查支付状态
            console.log('页面恢复，检查支付状态');
            checkLocalPaymentRecords();
        }
    });
}

// main.js - 确保 switchService 函数正确调用
function switchService(serviceName) {
    console.log('切换服务到:', serviceName, '当前服务:', STATE.currentService);
    
    if (!SERVICES[serviceName]) {
        console.error('服务不存在:', serviceName);
        return;
    }
    
    // 保存旧服务名称用于比较
    const oldService = STATE.currentService;
    
    // 重置解锁状态（如果切换了不同服务）
    if (oldService !== serviceName) {
        console.log('切换不同服务，重置解锁状态');
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
    }
    
    // 先更新当前服务状态
    STATE.currentService = serviceName;
    console.log('STATE.currentService 已更新为:', STATE.currentService);
    
    // 更新UI显示
    updateServiceDisplay(serviceName);
    
    // 更新解锁信息 - 这里应该使用新的服务配置
    updateUnlockInfo();
    
    // 重置解锁界面
    resetUnlockInterface();
    
    // 锁定下载按钮
    lockDownloadButton();
    
    // 如果切换了不同服务，隐藏分析结果区域
    if (oldService !== serviceName) {
        hideAnalysisResult();
    }
    
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
        
        // ============ 【新增】检查是否需要解锁 ============
        if (STATE.pendingUnlock || 
            localStorage.getItem('payment_verified') === 'true') {
            console.log('检测到待解锁的支付，立即解锁');
            unlockContent();
            STATE.pendingUnlock = false;
        }
        
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

// 确认支付（用户手动点击"我已支付"时调用）
function confirmPayment() {
  // 检查是否有订单ID
  if (!STATE.currentOrderId) {
    alert('请先点击"前往支付宝支付"按钮完成支付');
    return;
  }
  
  const confirmed = confirm('如果您已完成支付宝支付，请点击"确定"解锁内容。\n如支付遇到问题，请联系客服微信：runzang888');
  
  if (confirmed) {
    // 调用后端接口检查支付状态
    fetch(`https://runzang.top/api/payment/status/${STATE.currentOrderId}`)
      .then(response => response.json())
      .then(result => {
        if (result.success && result.data.status === 'paid') {
          // 支付成功，解锁内容
          handlePaymentSuccess();
        } else {
          alert('支付状态未确认，请稍后再试或联系客服');
        }
      })
      .catch(error => {
        console.error('检查支付状态失败:', error);
        alert('网络错误，请稍后重试');
      });
  }
}

// 支付成功处理函数
function handlePaymentSuccess() {
  // 设置支付解锁状态
  STATE.isPaymentUnlocked = true;
  STATE.isDownloadLocked = false;
  
  // 关闭支付弹窗
  closePaymentModal();
  
  // 更新解锁界面
  updateUnlockInterface();
  
  // 显示完整内容
  showFullAnalysisContent();
  
  // 解锁下载按钮
  unlockDownloadButton();
  
  // 显示成功提示
  alert('✅ 支付成功！完整报告已解锁。');
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
    
    // 清除当前订单ID
    STATE.currentOrderId = null;
    
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
window.handlePaymentSuccess = handlePaymentSuccess;
window.unlockContent = unlockContent; // 【新增】导出解锁函数
