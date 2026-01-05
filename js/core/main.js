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

// 在 initApp 函数最开头添加：
async function initApp() {
  console.log('🚀 应用初始化开始...');
  
  // ============ 【核心修复】支付宝回调强制跳转 ============
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('out_trade_no');
  
  if (orderId) {
    console.log('🎯 支付宝支付完成回调，订单:', orderId);
    
    // 立即保存支付信息
    localStorage.setItem('paid_order_id', orderId);
    localStorage.setItem('payment_time', new Date().toISOString());
    
    // ✅ 关键：检查是否有分析结果
    const hasAnalysis = checkIfAnalysisExists();
    
    if (hasAnalysis) {
      // 有分析结果，直接解锁并显示
      console.log('有分析结果，解锁并显示');
      await handlePaymentAndShowReport(orderId);
    } else {
      // 没有分析结果，显示提示
      console.log('没有分析结果，显示提示');
      showNoAnalysisAlert(orderId);
    }
    
    return; // 停止继续初始化，等待下一步
  }
  
  // ============ 原有的初始化代码 ============
  // ... 你的其他代码
}

// 检查是否有分析结果
function checkIfAnalysisExists() {
  // 方法1：检查STATE
  if (window.STATE && STATE.fullAnalysisResult) {
    console.log('STATE中有分析结果');
    return true;
  }
  
  // 方法2：检查DOM元素
  const freeAnalysis = document.getElementById('free-analysis-text');
  if (freeAnalysis && freeAnalysis.innerText.length > 100) {
    console.log('DOM中有分析结果');
    return true;
  }
  
  // 方法3：检查localStorage
  const savedAnalysis = localStorage.getItem('last_analysis_result');
  if (savedAnalysis && savedAnalysis.length > 100) {
    console.log('localStorage中有分析结果');
    return true;
  }
  
  return false;
}

// 处理支付并显示报告
async function handlePaymentAndShowReport(orderId) {
  // 1. 验证支付状态
  const paid = await verifyPaymentStatus(orderId);
  
  if (paid) {
    console.log('✅ 支付验证成功');
    
    // 2. 强制显示分析结果区域
    showAnalysisResultArea();
    
    // 3. 解锁内容
    unlockAllContent();
    
    // 4. 清理URL参数
    cleanUrlParams();
    
    // 5. 显示成功提示
    showSuccessMessage();
    
  } else {
    console.log('支付未验证');
    // 显示支付提示
    showPaymentModal();
  }
}

// 强制显示分析结果区域
function showAnalysisResultArea() {
  const resultSection = document.getElementById('analysis-result-section');
  if (resultSection) {
    resultSection.style.display = 'block';
    console.log('分析结果区域已显示');
  }
  
  // 滚动到分析结果区域
  setTimeout(() => {
    resultSection?.scrollIntoView({ behavior: 'smooth' });
  }, 300);
}

// 解锁所有内容
function unlockAllContent() {
  console.log('🔓 解锁所有内容');
  
  // 1. 隐藏锁定遮罩
  const lockedOverlay = document.getElementById('locked-overlay');
  if (lockedOverlay) {
    lockedOverlay.style.display = 'none';
    console.log('锁定遮罩已隐藏');
  }
  
  // 2. 显示锁定内容
  const lockedText = document.getElementById('locked-analysis-text');
  const freeText = document.getElementById('free-analysis-text');
  if (lockedText && freeText) {
    // 合并锁定内容到免费内容
    freeText.innerHTML += lockedText.innerHTML;
    console.log('锁定内容已合并');
  }
  
  // 3. 解锁下载按钮
  const downloadBtn = document.getElementById('download-report-btn');
  if (downloadBtn) {
    downloadBtn.disabled = false;
    downloadBtn.classList.remove('download-btn-locked');
    downloadBtn.style.opacity = '1';
    console.log('下载按钮已解锁');
  }
  
  // 4. 更新解锁按钮状态
  const unlockBtn = document.getElementById('unlock-btn');
  if (unlockBtn) {
    unlockBtn.innerHTML = '✅ 已解锁完整报告';
    unlockBtn.style.background = '#4CAF50';
    unlockBtn.disabled = true;
    console.log('解锁按钮已更新');
  }
  
  // 5. 更新解锁项目列表
  const unlockItems = document.querySelectorAll('.unlock-items li');
  unlockItems.forEach(item => {
    if (item.textContent.includes('🔒')) {
      item.innerHTML = item.innerHTML.replace('🔒', '✅');
      item.classList.add('unlocked-item');
    }
  });
}

// 显示成功消息
function showSuccessMessage() {
  // 创建自定义提示
  const msg = document.createElement('div');
  msg.id = 'payment-success-msg';
  msg.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #4CAF50;
    color: white;
    padding: 15px 30px;
    border-radius: 5px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    font-size: 16px;
    animation: slideDown 0.3s ease;
  `;
  msg.innerHTML = '✅ 支付成功！算命报告已解锁。';
  
  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { top: -50px; opacity: 0; }
      to { top: 20px; opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(msg);
  
  // 5秒后移除
  setTimeout(() => {
    if (msg.parentNode) {
      msg.parentNode.removeChild(msg);
    }
  }, 5000);
}

// 没有分析结果的提示
function showNoAnalysisAlert(orderId) {
  const alertHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10000;
      display: flex;
      justify-content: center;
      align-items: center;
    ">
      <div style="
        background: white;
        padding: 30px;
        border-radius: 10px;
        max-width: 400px;
        text-align: center;
      ">
        <h3 style="color: #4CAF50; margin-bottom: 20px;">✅ 支付成功！</h3>
        <p>订单号: <strong>${orderId}</strong></p>
        <p style="margin: 20px 0;">但未找到您的分析结果。</p>
        <div style="margin-top: 30px;">
          <button onclick="location.href='./'" style="
            padding: 10px 20px;
            background: #2196F3;
            color: white;
            border: none;
            border-radius: 5px;
            margin-right: 10px;
            cursor: pointer;
          ">返回首页重新测算</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
            padding: 10px 20px;
            background: #ccc;
            color: #333;
            border: none;
            border-radius: 5px;
            cursor: pointer;
          ">关闭</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', alertHTML);
}

// 新增：恢复支付前状态
async function restorePaymentState() {
  console.log('🔄 检查是否需要恢复支付前状态...');
  
  // 1. 检查是否有待恢复的状态
  const savedState = localStorage.getItem('pending_payment_state');
  const pendingOrderId = localStorage.getItem('pending_order_id');
  
  if (!savedState || !pendingOrderId) {
    console.log('没有待恢复的支付状态');
    return;
  }
  
  try {
    const stateData = JSON.parse(savedState);
    console.log('找到待恢复的状态，订单:', pendingOrderId);
    
    // 2. 恢复分析结果
    if (stateData.analysisResult) {
      console.log('恢复分析结果...');
      
      // 恢复状态
      STATE.currentService = stateData.serviceType;
      STATE.fullAnalysisResult = stateData.analysisResult;
      STATE.baziData = stateData.baziData;
      STATE.partnerBaziData = stateData.partnerBaziData;
      STATE.userData = stateData.userData;
      STATE.partnerData = stateData.partnerData;
      
      // 重新显示分析结果
      displayPredictorInfo();
      displayBaziPan();
      processAndDisplayAnalysis(stateData.analysisResult);
      showAnalysisResult();
      
      console.log('✅ 分析结果已恢复');
    }
    
    // 3. 验证支付状态
    console.log('验证支付状态...');
    const paymentVerified = await verifyPaymentStatus(pendingOrderId);
    
    if (paymentVerified) {
      console.log('✅ 支付验证成功，解锁报告');
      
      // 解锁内容
      STATE.isPaymentUnlocked = true;
      STATE.isDownloadLocked = false;
      
      updateUnlockInterface();
      showFullAnalysisContent();
      unlockDownloadButton();
      
      // 显示成功提示
      setTimeout(() => {
        alert('✅ 支付成功！算命报告已解锁。');
      }, 500);
      
      // 清理状态
      localStorage.removeItem('pending_payment_state');
      localStorage.removeItem('pending_order_id');
      
    } else {
      console.log('支付未完成，保持锁定状态');
      // 保持锁定状态，等待用户重试
    }
    
    // 4. 恢复滚动位置
    if (stateData.scrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, stateData.scrollPosition);
      }, 100);
    }
    
  } catch (error) {
    console.error('恢复状态失败:', error);
    // 清理损坏的状态
    localStorage.removeItem('pending_payment_state');
    localStorage.removeItem('pending_order_id');
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


