// ============ 【导入核心模块】 ============
import { SERVICES, STATE, API_BASE_URL } from './config.js';
import { parseBaziData, fetchAiResultContent } from './api.js';
import { PaymentManager, checkPaymentSuccessFromURL } from './payment.js';
import { SERVICE_API_MAP, buildAiRequestBody, callAiQuery } from './analysis.js';
import {
    UI,
    initFormOptions,
    setDefaultValues,
    updateServiceDisplay,
    updateUnlockInfo,
    renderResultSection,
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

// ============ 【支付相关】 ============
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
    if (!confirmed) return;
    fetch(`${API_BASE_URL}/api/payment/status/${STATE.currentOrderId}`, { mode: 'cors' })
        .then(r => (r.ok ? r.json() : Promise.reject(new Error('HTTP ' + r.status))))
        .then(result => {
            if (result.success && result.data && result.data.status === 'paid') {
                handlePaymentSuccess();
            } else {
                alert('支付状态未确认，请稍后再试或联系客服');
            }
        })
        .catch(err => {
            console.error('检查支付状态失败:', err);
            alert('网络错误: ' + err.message + '\n请稍后重试或联系客服');
        });
}

// ============ 【初始化与事件】 ============
async function initApp() {
    console.log('🚀 应用初始化开始...');
    try {
        const urlOrderId = checkPaymentSuccessFromURL();
        if (urlOrderId) console.log('✅ 检测到URL支付回调，订单ID:', urlOrderId);
        await PaymentManager.initPaymentCheck();
        initFormOptions();
        setDefaultValues();
        updateServiceDisplay(STATE.currentService);
        updateUnlockInfo();
        lockDownloadButton();
        setupEventListeners();
        preloadImages();
        initFontOptimization();
        console.log('✅ 应用初始化完成');
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
    }
}

function initFontOptimization() {
    const isMobile = /mobile|iphone|android/i.test(navigator.userAgent.toLowerCase());
    if (isMobile) {
        window.addEventListener('resize', adjustMobileFontSizes);
        console.log('📱 移动端字体优化已启用');
    }
}

function adjustMobileFontSizes() {
    const w = window.innerWidth;
    applyFontScale(w <= 480 ? 0.95 : 1.0);
}

function applyFontScale() {}

function setupEventListeners() {
    document.querySelectorAll('.service-nav a').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            switchService(link.dataset.service);
        });
    });
    UI.analyzeBtn().addEventListener('click', startAnalysis);
    UI.unlockBtn().addEventListener('click', showPaymentModal);
    UI.downloadReportBtn().addEventListener('click', downloadReport);
    UI.recalculateBtn().addEventListener('click', newAnalysis);
    UI.confirmPaymentBtn().addEventListener('click', confirmPayment);
    UI.cancelPaymentBtn().addEventListener('click', closePaymentModal);
    UI.closePaymentBtn().addEventListener('click', closePaymentModal);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePaymentModal(); });
    window.addEventListener('click', e => {
        if (e.target === UI.paymentModal()) closePaymentModal();
    });
    const hero = UI.heroImage(), detail = UI.detailImage();
    [hero, detail].forEach(img => {
        if (img) img.addEventListener('load', function() {
            this.classList.add('loaded');
            if (this.previousElementSibling) this.previousElementSibling.style.display = 'none';
        });
    });
}

function switchService(serviceName) {
    if (!SERVICES[serviceName]) return;
    const old = STATE.currentService;
    if (old !== serviceName) {
        STATE.isPaymentUnlocked = false;
        STATE.isDownloadLocked = true;
        STATE.fullAnalysisResult = '';
        STATE.baziData = null;
        STATE.partnerBaziData = null;
        STATE.currentOrderId = null;
        STATE.userData = null;
        STATE.partnerData = null;
        hideAnalysisResult();
        const freeEl = UI.freeAnalysisText();
        if (freeEl) freeEl.innerHTML = '';
        const grid = UI.predictorInfoGrid();
        if (grid) grid.innerHTML = '';
        const baziGrid = UI.baziGrid();
        if (baziGrid) baziGrid.innerHTML = '';
    }
    STATE.currentService = serviceName;
    updateServiceDisplay(serviceName);
    updateUnlockInfo();
    resetUnlockInterface();
    lockDownloadButton();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function preloadImages() {
    Object.values(SERVICES).forEach(s => {
        new Image().src = s.heroImage;
        new Image().src = s.detailImage;
    });
}

// ============ 【分析流程】 ============
async function startAnalysis() {
    if (!validateForm()) {
        alert('请填写完整的个人信息');
        return;
    }
    const titleEl = document.getElementById('result-service-name');
    if (titleEl) titleEl.textContent = STATE.currentService + '分析报告';

    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    lockDownloadButton();
    animateButtonStretch();

    try {
        collectUserData();
        showAnalysisResult();
        const baziGrid = UI.baziGrid();
        if (baziGrid) {
            baziGrid.innerHTML = '<div class="loading-bazi"><div style="display:flex;align-items:center;gap:10px"><div class="spinner" style="width:20px;height:20px"></div><span>正在排盘，请稍候...</span></div></div>';
        }
        showLoadingModal();

        const apiEndpoint = SERVICE_API_MAP[STATE.currentService];
        if (!apiEndpoint) throw new Error('未找到服务对应的API接口');
        const requestBody = buildAiRequestBody(STATE.currentService, STATE.userData, STATE.partnerData);

        const { orderId, content } = await callAiQuery(apiEndpoint, requestBody);
        STATE.currentOrderId = orderId;
        let contentToDisplay = content || '';
        STATE.fullAnalysisResult = contentToDisplay;

        const paymentData = PaymentManager.getPaymentData();
        if (paymentData && paymentData.verified && paymentData.orderId === orderId) {
            const fullContent = await fetchAiResultContent(orderId);
            if (fullContent) {
                contentToDisplay = fullContent;
                STATE.fullAnalysisResult = fullContent;
                STATE.isPaymentUnlocked = true;
            }
        }

        const parsed = parseBaziData(contentToDisplay);
        STATE.baziData = parsed.userBazi;
        renderResultSection({ content: contentToDisplay, isUnlocked: STATE.isPaymentUnlocked });
        hideLoadingModal();

        const section = UI.analysisResultSection();
        if (section) setTimeout(() => section.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
        if (paymentData && paymentData.verified && !STATE.isPaymentUnlocked) {
            setTimeout(() => PaymentManager.updateUIAfterPayment(), 500);
        }
    } catch (error) {
        console.error('分析失败:', error);
        hideLoadingModal();
        const baziGrid = UI.baziGrid();
        if (baziGrid) {
            baziGrid.innerHTML = '<div style="text-align:center;padding:40px;color:#dc3545">❌ 分析失败</div><div style="color:#666;font-size:14px">' + (error.message || '') + '</div>';
        }
        let msg = '命理分析失败，请稍后再试。';
        if (error.message && (error.message.includes('401') || error.message.includes('429') || error.message.includes('网络'))) {
            msg = error.message.includes('401') ? 'API密钥错误，请联系管理员。' : error.message.includes('429') ? '请求过于频繁，请稍后再试。' : '网络连接失败，请检查您的网络设置。';
        }
        alert(msg + '\n\n错误详情：' + (error.message || ''));
    }
}

function downloadReport() {
    if (STATE.isDownloadLocked) {
        alert('请先解锁完整报告才能下载！');
        showPaymentModal();
        return;
    }
    if (!STATE.userData || !STATE.fullAnalysisResult) {
        alert('请先进行测算分析');
        return;
    }
    const svc = STATE.currentService || '测算验证';
    let predictorInfo = `命理分析报告 - ${svc}\n\n预测者信息：\n姓名：${STATE.userData.name}\n性别：${STATE.userData.gender}\n出生时间：${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日${STATE.userData.birthHour}时${STATE.userData.birthMinute}分\n出生城市：${STATE.userData.birthCity}\n测算服务：${svc}\n测算时间：${new Date().toLocaleString('zh-CN')}`;
    if (svc === '八字合婚' && STATE.partnerData) {
        predictorInfo += `\n\n伴侣信息：\n姓名：${STATE.partnerData.partnerName}\n性别：${STATE.partnerData.partnerGender}\n出生时间：${STATE.partnerData.partnerBirthYear}年${STATE.partnerData.partnerBirthMonth}月${STATE.partnerData.partnerBirthDay}日${STATE.partnerData.partnerBirthHour}时${STATE.partnerData.partnerBirthMinute}分\n出生城市：${STATE.partnerData.partnerBirthCity}`;
    }
    const bazi = STATE.baziData;
    const baziStr = bazi ? `八字排盘：\n年柱：${bazi.yearColumn} (${bazi.yearElement})\n月柱：${bazi.monthColumn} (${bazi.monthElement})\n日柱：${bazi.dayColumn} (${bazi.dayElement})\n时柱：${bazi.hourColumn} (${bazi.hourElement})` : '';
    const report = `命理分析报告 - ${STATE.currentService}\n\n${predictorInfo}\n\n${baziStr}\n\n${STATE.fullAnalysisResult}\n\n--- 命理分析服务平台 ---\n分析时间：${new Date().toLocaleString('zh-CN')}\n使用技术：DeepSeek AI命理分析系统`;
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `命理分析报告_${STATE.userData.name}_${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(a.href);
}

function newAnalysis() {
    STATE.isPaymentUnlocked = false;
    STATE.isDownloadLocked = true;
    lockDownloadButton();
    hideAnalysisResult();
    resetUnlockInterface();
    const freeEl = UI.freeAnalysisText();
    if (freeEl) freeEl.innerHTML = '';
    STATE.currentOrderId = null;
    STATE.fullAnalysisResult = '';
    STATE.baziData = null;
    STATE.partnerBaziData = null;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ============ 【挂载与导出】 ============
window.addEventListener('DOMContentLoaded', initApp);
window.switchService = switchService;
window.startAnalysis = startAnalysis;
window.showPaymentModal = showPaymentModal;
window.closePaymentModal = closePaymentModal;
window.confirmPayment = confirmPayment;
window.downloadReport = downloadReport;
window.newAnalysis = newAnalysis;
window.handlePaymentSuccess = handlePaymentSuccess;
window.PaymentManager = PaymentManager;
window.STATE = STATE;
window.UI = UI;
