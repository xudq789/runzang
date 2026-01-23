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
            
            const parsedBaziData = parseBaziData(savedResult);
            STATE.baziData = parsedBaziData.userBazi;
            
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

// ============ 【流式分析管理器】 ============
const StreamingAnalysisManager = {
    isStreaming: false,
    fullContent: '',
    freeContent: '',
    streamController: null,
    
    // 开始流式分析
    async startStreamingAnalysis(prompt) {
        console.log('🎯 开始流式分析...');
        
        this.isStreaming = true;
        this.fullContent = '';
        this.freeContent = '';
        
        // 显示流式分析状态
        this.showStreamingStatus();
        
        try {
            // 使用流式API
            await this.callDeepSeekStreamingAPI(prompt);
            
            // 流式分析完成
            this.isStreaming = false;
            this.hideStreamingStatus();
            
            // 保存完整结果
            STATE.fullAnalysisResult = this.fullContent;
            
            // 提取八字数据
            const parsedBaziData = parseBaziData(this.fullContent);
            STATE.baziData = parsedBaziData.userBazi;
            
            // 保存到本地存储
            localStorage.setItem('last_analysis_result', this.fullContent);
            localStorage.setItem('last_analysis_service', STATE.currentService);
            
            console.log('✅ 流式分析完成，总字数:', this.fullContent.length);
            
            return true;
            
        } catch (error) {
            console.error('流式分析失败:', error);
            this.isStreaming = false;
            this.hideStreamingStatus();
            throw error;
        }
    },
    
    // 调用流式API
    async callDeepSeekStreamingAPI(prompt) {
        console.log('调用DeepSeek流式API...');
        
        const controller = new AbortController();
        this.streamController = controller;
        
        try {
            const response = await fetch(window.APP_CONFIG.DEEPSEEK_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${window.APP_CONFIG.DEEPSEEK_API_KEY}`
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: [
                        {
                            role: 'system',
                            content: '你是一位职业的命理大师，精通梁湘润论命体系。请严格按照要求的格式输出完整报告。'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    max_tokens: 4000,
                    temperature: 0.7,
                    stream: true  // 关键：启用流式输出
                }),
                signal: controller.signal
            });
            
            if (!response.ok) {
                throw new Error(`API请求失败: ${response.status}`);
            }
            
            const reader = response.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                buffer += decoder.decode(value, { stream: true });
                
                // 处理流式数据
                const lines = buffer.split('\n');
                buffer = lines.pop(); // 保留未完成的行
                
                for (const line of lines) {
                    if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                        try {
                            const data = JSON.parse(line.slice(6));
                            if (data.choices[0].delta.content) {
                                const content = data.choices[0].delta.content;
                                this.processStreamChunk(content);
                            }
                        } catch (e) {
                            // 忽略解析错误
                        }
                    }
                }
            }
            
            console.log('流式接收完成');
            
        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('流式请求被中止');
            } else {
                throw error;
            }
        }
    },
    
    // 处理流式数据块
    processStreamChunk(content) {
        // 累积完整内容
        this.fullContent += content;
        
        // 检测八字排盘数据
        this.detectAndUpdateBazi(content);
        
        // 检测是否到达免费部分结束
        if (!this.isFreeContentComplete()) {
            this.freeContent += content;
            
            // 实时更新免费内容显示
            this.updateFreeContentDisplay();
        }
    },
    
    // 修改后的八字检测和更新函数
    detectAndUpdateBazi(content) {
        // 实时检测八字数据并更新显示
        const baziData = parseBaziData(this.fullContent);
        if (baziData.userBazi && this.hasValidBaziData(baziData.userBazi)) {
            STATE.baziData = baziData.userBazi;
            
            // 立即更新显示
            displayBaziPan();
        }
    },
    
    // 检查八字数据是否有效
    hasValidBaziData(baziData) {
        return baziData.yearColumn && baziData.monthColumn && 
               baziData.dayColumn && baziData.hourColumn;
    },
    
    // 检查免费内容是否完成
    isFreeContentComplete() {
        const freeSections = [
            '【八字排盘】',
            '【大运排盘】',
            '【八字喜用分析】',
            '【性格特点】',
            '【适宜行业职业推荐】'
        ];
        
        // 检查是否出现了第一个付费部分
        const paidSections = [
            '【富贵层次评估】',
            '【过往大运吉凶分析】',
            '【过往关键流年验证】',
            '【专业建议与指导】',
            '【测算当年及往后5年运势】',
            '【事业财运走向】',
            '【婚姻感情趋势】',
            '【人生每步大运吉凶分析】',
            '【双方八字契合度分析】'
        ];
        
        for (const section of paidSections) {
            if (this.fullContent.includes(section)) {
                return true;
            }
        }
        
        return false;
    },
    
    // 实时更新免费内容显示
    updateFreeContentDisplay() {
        const freeAnalysisText = UI.freeAnalysisText();
        if (!freeAnalysisText) return;
        
        // 提取并格式化免费内容
        const formattedContent = this.formatFreeContent(this.freeContent);
        freeAnalysisText.innerHTML = formattedContent;
    },
    
    // 格式化免费内容
    formatFreeContent(content) {
        const freeSections = [
            '【八字排盘】',
            '【大运排盘】',
            '【八字喜用分析】',
            '【性格特点】',
            '【适宜行业职业推荐】'
        ];
        
        let formattedContent = '';
        
        for (const section of freeSections) {
            const startIndex = content.indexOf(section);
            if (startIndex !== -1) {
                // 找到下一个【或结束
                let endIndex = content.indexOf('【', startIndex + 1);
                if (endIndex === -1) endIndex = content.length;
                
                const sectionContent = content.substring(startIndex, endIndex);
                const titleMatch = sectionContent.match(/【([^】]+)】/);
                
                if (titleMatch) {
                    const title = titleMatch[1];
                    const contentText = sectionContent.replace(titleMatch[0], '').trim();
                    
                    // 八字排盘已单独显示，跳过
                    if (title.includes('八字排盘')) continue;
                    
                    formattedContent += `
                    <div class="analysis-section">
                        <h5>${title}</h5>
                        <div class="analysis-content">${contentText.replace(/\n/g, '<br>')}</div>
                    </div>`;
                }
            }
        }
        
        return formattedContent;
    },
    
    // 检测并显示八字排盘
    detectAndDisplayBazi(content) {
        // 检测八字排盘部分
        if (content.includes('年柱：') || content.includes('月柱：') || content.includes('日柱：') || content.includes('时柱：')) {
            // 延迟一点确保有完整数据
            setTimeout(() => {
                const baziData = parseBaziData(this.fullContent);
                if (baziData.userBazi && Object.values(baziData.userBazi).some(v => v)) {
                    STATE.baziData = baziData.userBazi;
                    displayBaziPan();
                }
            }, 500);
        }
    },
    
    // 显示流式分析状态
    showStreamingStatus() {
        const freeAnalysisText = UI.freeAnalysisText();
        if (!freeAnalysisText) return;
        
        freeAnalysisText.innerHTML = `
            <div class="streaming-status">
                <div class="streaming-spinner"></div>
                <div class="streaming-text">正在为您生成深度命理分析...</div>
                <div class="streaming-progress">分析内容正在实时生成中，请稍候</div>
            </div>
        `;
        
        // 添加CSS样式
        if (!document.getElementById('streaming-styles')) {
            const style = document.createElement('style');
            style.id = 'streaming-styles';
            style.textContent = `
                .streaming-status {
                    text-align: center;
                    padding: 30px;
                    background: linear-gradient(135deg, #f9f5f0, #f0e6d6);
                    border-radius: 10px;
                    border: 2px solid var(--secondary-color);
                }
                .streaming-spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(212, 175, 55, 0.2);
                    border-top-color: var(--secondary-color);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto 15px;
                }
                .streaming-text {
                    font-size: 16px;
                    font-weight: 600;
                    color: var(--primary-color);
                    margin-bottom: 8px;
                }
                .streaming-progress {
                    font-size: 14px;
                    color: #666;
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .streaming-analysis-section {
                    animation: fadeIn 0.5s ease-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `;
            document.head.appendChild(style);
        }
    },
    
    // 隐藏流式分析状态
    hideStreamingStatus() {
        const streamingStatus = document.querySelector('.streaming-status');
        if (streamingStatus && streamingStatus.parentNode) {
            streamingStatus.style.opacity = '0';
            streamingStatus.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                if (streamingStatus.parentNode) {
                    streamingStatus.parentNode.removeChild(streamingStatus);
                }
            }, 300);
        }
    },
    
    // 停止流式分析
    stopStreaming() {
        if (this.streamController) {
            this.streamController.abort();
            this.isStreaming = false;
            console.log('流式分析已停止');
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

// ============ 【原有主应用代码 - 仅修复语法，不修改逻辑】 ============
// 注意：这里使用原始导入语句，假设这些模块在您的项目中存在
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
        
        console.log('✅ 应用初始化完成');
        
    } catch (error) {
        console.error('❌ 应用初始化失败:', error);
    }
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
        
        // 停止流式分析
        StreamingAnalysisManager.stopStreaming();
        
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

// ============ 【核心修改：流式分析函数】 ============
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
    
    // 不显示传统加载弹窗
    // showLoadingModal();
    
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
                <div class="loading-bazi">
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <div class="spinner" style="width: 20px; height: 20px;"></div>
                        <span>正在排盘，请稍候...</span>
                    </div>
                </div>
            `;
        }

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
            alert(error.message);
            return;
        }
        
        console.log('开始流式分析，提示词长度:', prompt.length);
        
        // 开始流式分析
        const streamingSuccess = await StreamingAnalysisManager.startStreamingAnalysis(prompt);
        
        if (streamingSuccess) {
            console.log('流式分析成功');
            
            // 使用原有函数显示完整分析结果（保持相同格式）
            processAndDisplayAnalysis(STATE.fullAnalysisResult);
            
            // 检查支付状态
            const paymentData = PaymentManager.getPaymentData();
            if (paymentData && paymentData.verified) {
                const savedService = localStorage.getItem('last_analysis_service');
                if (savedService === STATE.currentService && !STATE.isPaymentUnlocked) {
                    console.log('当前服务已支付，自动解锁');
                    setTimeout(() => {
                        PaymentManager.updateUIAfterPayment();
                    }, 500);
                }
            }
        }
        
    } catch (error) {
        console.error('分析失败:', error);
        
        // 降级方案：使用传统API
        console.log('流式分析失败，降级到传统API');
        await fallbackToTraditionalAnalysis();
    }
}

// ============ 【降级方案：传统API】 ============
async function fallbackToTraditionalAnalysis() {
    console.log('执行降级方案：使用传统API');
    
    showLoadingModal();
    
    try {
        const serviceModule = SERVICE_MODULES[STATE.currentService];
        const prompt = serviceModule.getPrompt(STATE.userData, STATE.partnerData);
        
        console.log('调用传统API...');
        const analysisResult = await callDeepSeekAPI(prompt);
        
        STATE.fullAnalysisResult = analysisResult;
        
        const parsedBaziData = parseBaziData(analysisResult);
        STATE.baziData = parsedBaziData.userBazi;
        
        displayBaziPan();
        processAndDisplayAnalysis(analysisResult);
        
        hideLoadingModal();
        showAnalysisResult();
        
        console.log('传统API分析完成');
        
    } catch (error) {
        console.error('降级方案失败:', error);
        hideLoadingModal();
        
        let errorMessage = '命理分析失败，请稍后再试。';
        if (error.message.includes('401')) {
            errorMessage = 'API密钥错误，请联系管理员。';
        } else if (error.message.includes('429')) {
            errorMessage = '请求过于频繁，请稍后再试。';
        } else if (error.message.includes('网络')) {
            errorMessage = '网络连接失败，请检查您的网络设置。';
        }
        
        alert(errorMessage + '\n\n错误详情：' + error.message);
    }
}

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
    
    StreamingAnalysisManager.stopStreaming();
    
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
window.addEventListener('DOMContentLoaded', initApp);

// 导出给全局使用 - 创建包装函数
window.switchService = switchService;
window.startAnalysis = startAnalysis;

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

window.StreamingAnalysisManager = StreamingAnalysisManager;

// ✅ 也导出UI对象（如果需要在其他地方使用）
window.UI = UI;
