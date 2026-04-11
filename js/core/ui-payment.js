// ============ 【支付弹窗相关功能模块】 ============
/**
 * 支付弹窗显示、支付方式选择、支付界面显示等功能
 */

import { hideElement, showElement } from './utils.js';
import { UI } from './ui-elements.js';
import { STATE, PAYMENT_CONFIG, SERVICES } from './config.js';
import { PaymentStorage, AnalysisStorage } from './storage.js';

/** 用户关闭弹窗时，结束「等待选择支付方式」的 Promise */
let pendingPaymentMethodResolve = null;

function setPaymentMethodDisplayLabel(method) {
    const el = document.getElementById('payment-method-display');
    if (!el) return;
    if (method === 'alipay') {
        el.textContent = '支付宝';
        el.style.color = '#1677FF';
    } else if (method === 'wechatpay') {
        el.textContent = '微信支付';
        el.style.color = '#07C160';
    } else {
        el.textContent = '请选择';
        el.style.color = '#7d6e63';
    }
}

function persistBeforeRedirect(paymentData) {
    const aiOrderId = STATE.lastAiOrderId;
    try {
        PaymentStorage.setPaymentData({
            orderId: paymentData.outTradeNo,
            aiOrderId: aiOrderId,
            serviceType: STATE.currentService,
            timestamp: new Date().toISOString()
        });
    } catch (e) {}
    STATE.lastAiOrderId = paymentData.outTradeNo;
    saveAnalysisData();
}

// 显示支付弹窗 - 支持支付宝和微信支付（用户主动选择）
export function showPaymentModal() {
    void runPaymentModalAsync();
}

async function runPaymentModalAsync() {
    console.log('调用支付接口...');

    // 检查完整分析是否已完成
    if (!STATE.fullAnalysisResult) {
        const confirmed = confirm('完整分析报告还在生成中，可能需要额外1-2分钟。\n\n建议您先阅读免费部分内容，支付后将立即解锁完整报告。\n\n是否继续支付？');
        
        if (!confirmed) {
            return;
        }
    }

    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;

    const payAmountNum = (STATE.queryPaymentAmount != null && !Number.isNaN(Number(STATE.queryPaymentAmount)))
        ? Number(STATE.queryPaymentAmount)
        : parseFloat(serviceConfig.price);
    const payAmountStr = payAmountNum.toFixed(2);
    
    try {
        // 1. 先显示支付弹窗
        const paymentModal = UI.paymentModal();
        if (paymentModal) {
            showElement(paymentModal);
            document.body.style.overflow = 'hidden';
            
            // 先显示基本信息
            UI.paymentServiceType().textContent = STATE.currentService;
            UI.paymentAmount().textContent = '¥' + payAmountStr;
            UI.paymentOrderId().textContent = '请选择支付方式…';
            setPaymentMethodDisplayLabel(null);
        }
        
        // 2. 用户选择支付宝 / 微信
        const selectedMethod = await showPaymentMethodSelection();
        if (!selectedMethod) {
            closePaymentModal();
            return;
        }

        if (!STATE.lastAiOrderId) {
            alert('未找到测算订单号，请等待测算完成后再支付，否则无法到账。');
            closePaymentModal();
            return;
        }

        setPaymentMethodDisplayLabel(selectedMethod);
        UI.paymentOrderId().textContent = '生成中...';
        
        // 3. 调用后端支付接口（订单号必须与 AI 订单一致，支付宝/微信回调才能匹配数据库）
        const frontendOrderId = STATE.lastAiOrderId;

        const createUrl = `${PAYMENT_CONFIG.GATEWAY_URL}/api/payment/create`;
        console.log('🔗 调用支付API:', createUrl);
        console.log('请求数据:', {
            serviceType: STATE.currentService,
            amount: payAmountStr,
            frontendOrderId: frontendOrderId,
            paymentMethod: selectedMethod
        });

        const response = await fetch(createUrl, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'runzang-payment-security-key-2025-1234567890'
            },
            body: JSON.stringify({
                serviceType: STATE.currentService,
                amount: payAmountStr,
                frontendOrderId: frontendOrderId,
                paymentMethod: selectedMethod
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            alert('创建订单失败：' + (result.message || '请稍后重试'));
            closePaymentModal();
            return;
        }
        
        const { paymentUrl, qrCodeUrl, outTradeNo, amount, subject } = result.data;
        console.log('支付响应:', result.data);
        const aiOrderId = STATE.lastAiOrderId;
        try {
            PaymentStorage.setPaymentData({
                orderId: outTradeNo,
                aiOrderId: aiOrderId,
                serviceType: STATE.currentService,
                timestamp: new Date().toISOString()
            });
        } catch (e) {}
        
        // 4. 更新支付弹窗显示真实信息
        UI.paymentServiceType().textContent = subject || STATE.currentService;
        UI.paymentAmount().textContent = '¥' + amount;
        UI.paymentOrderId().textContent = outTradeNo;
        
        // 5. 根据支付方式显示不同支付界面
        displayPaymentInterface(result.data, selectedMethod);
        
    } catch (error) {
        console.error('支付失败:', error);
        alert('网络连接失败，请检查网络后重试');
        closePaymentModal();
    }
}

async function fetchPaymentConfig() {
    try {
        const url = `${PAYMENT_CONFIG.GATEWAY_URL}/api/payment/config`;
        const res = await fetch(url, {
            headers: { 'X-API-Key': 'runzang-payment-security-key-2025-1234567890' }
        });
        const json = await res.json().catch(() => ({}));
        if (json.success && json.data) return json.data;
    } catch (e) {
        console.warn('获取支付配置失败，将展示全部方式', e);
    }
    return { alipay: { enabled: true }, wechatpay: { enabled: true } };
}

// 支付方式选择：支付宝 / 微信（关闭弹窗或取消时 resolve null，见 closePaymentModal）
function showPaymentMethodSelection() {
    return new Promise((resolve) => {
        pendingPaymentMethodResolve = resolve;

        const paymentMethods = document.querySelector('.payment-methods');
        if (!paymentMethods) {
            pendingPaymentMethodResolve = null;
            resolve(null);
            return;
        }

        const finish = (method) => {
            if (pendingPaymentMethodResolve) {
                pendingPaymentMethodResolve = null;
                resolve(method);
            }
        };

        paymentMethods.innerHTML = '<p class="payment-method-loading" style="color:#7d6e63;">加载支付方式…</p>';

        fetchPaymentConfig().then((cfg) => {
            const alipayOn = cfg.alipay && cfg.alipay.enabled !== false;
            const wxOn = cfg.wechatpay && cfg.wechatpay.enabled !== false;
            if (!alipayOn && !wxOn) {
                paymentMethods.innerHTML = '<p style="color:#c00;">暂无可用的支付方式，请稍后再试。</p>';
                finish(null);
                return;
            }
            paymentMethods.innerHTML = `
                <p style="color:#333;font-size:15px;margin-bottom:14px;font-weight:600;">请选择支付方式</p>
                <div class="payment-method-pick" style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;">
                    ${alipayOn ? `
                    <button type="button" class="dynamic-pulse-btn pay-pick-alipay" style="min-width:140px;padding:14px 22px;font-size:15px;background:linear-gradient(135deg,#1677FF,#4096ff);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:bold;">
                        支付宝支付
                    </button>` : ''}
                    ${wxOn ? `
                    <button type="button" class="dynamic-pulse-btn pay-pick-wechat" style="min-width:140px;padding:14px 22px;font-size:15px;background:linear-gradient(135deg,#09BB07,#2DC100);color:#fff;border:none;border-radius:12px;cursor:pointer;font-weight:bold;">
                        微信支付
                    </button>` : ''}
                </div>
                <p style="color:#888;font-size:13px;margin-top:12px;">电脑端微信一般为扫码；手机端微信将跳转支付页</p>
            `;
            const bAli = paymentMethods.querySelector('.pay-pick-alipay');
            const bWx = paymentMethods.querySelector('.pay-pick-wechat');
            if (bAli) bAli.onclick = () => finish('alipay');
            if (bWx) bWx.onclick = () => finish('wechatpay');
        });
    });
}

// 显示支付界面
function displayPaymentInterface(paymentData, method) {
    const paymentMethods = document.querySelector('.payment-methods');
    if (!paymentMethods) return;
    
    paymentMethods.innerHTML = '';
    
    // 更新支付弹窗的标题
    const paymentTitle = document.querySelector('.order-info p:last-child strong');
    if (paymentTitle) {
        const methodName = method === 'alipay' ? '支付宝H5支付' : '微信扫码支付';
        paymentTitle.textContent = methodName;
    }
    
    // 更新支付状态文本
    const statusText = document.getElementById('payment-status-text');
    if (statusText) {
        const isWxH5 = method === 'wechatpay' && paymentData.paymentType === 'h5';
        if (method === 'alipay') {
            statusText.textContent = '点击下方按钮将在新标签页打开支付宝，支付完成后请回到本页点击「我已支付」';
        } else if (isWxH5) {
            statusText.textContent = '点击下方按钮将在新标签页打开微信收银台，支付完成后请回到本页点击「我已支付」';
        } else {
            statusText.textContent = '请使用微信扫码完成支付';
        }
    }
    
    if (method === 'alipay') {
        // 使用 <a target="_blank">，避免移动端拦截 window.open 导致当前页跳转、丢失弹窗
        const payLink = document.createElement('a');
        payLink.id = 'alipay-redirect-btn';
        payLink.href = paymentData.paymentUrl || '#';
        payLink.target = '_blank';
        payLink.rel = 'noopener noreferrer';
        payLink.className = 'dynamic-pulse-btn';
        payLink.style.cssText = `
            margin: 20px auto;
            display: block;
            max-width: 250px;
            text-align: center;
            text-decoration: none;
            background: linear-gradient(135deg, #1677FF, #4096ff);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
            box-sizing: border-box;
        `;
        payLink.innerHTML = `
            <span style="display: flex; align-items: center; justify-content: center;">
                <span style="margin-right: 8px;">💰</span>
                前往支付宝支付
            </span>
        `;
        payLink.addEventListener('click', () => persistBeforeRedirect(paymentData));
        paymentMethods.appendChild(payLink);
        
    } else if (method === 'wechatpay') {
        // 微信支付 - 显示二维码
        if (paymentData.qrCodeUrl || paymentData.codeUrl) {
            const qrContainer = document.createElement('div');
            qrContainer.className = 'wechat-qr-container';
            const qrCode = paymentData.qrCodeUrl || 
                `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(paymentData.codeUrl)}`;
            
            qrContainer.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                <div style="font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #07C160;">
                    <span style="margin-right: 8px;">💳</span>
                    微信扫码支付
                </div>
                <div style="background: white; padding: 20px; border-radius: 10px; display: inline-block; border: 2px solid #07C160;">
                    <img src="${qrCode}" 
                         alt="微信支付二维码" 
                         style="width: 200px; height: 200px; border: 1px solid #eee;">
                    <div style="margin-top: 15px; color: #333; font-size: 14px;">
                    <div>支付金额：¥${paymentData.amount}</div>
                    <div style="color: #666; font-size: 13px; margin-top: 5px;">订单号：${paymentData.outTradeNo}</div>
                    </div>
                </div>
                <div style="margin-top: 15px; color: #999; font-size: 14px;">
                    请使用微信扫一扫扫描二维码
                    <br>
                    <span style="color: #07C160; font-size: 12px;">扫码后请在微信内完成支付</span>
                </div>
                </div>
            `;
            
            paymentMethods.appendChild(qrContainer);
        } else if (paymentData.paymentUrl) {
            const payLink = document.createElement('a');
            payLink.id = 'wechat-redirect-btn';
            payLink.href = paymentData.paymentUrl;
            payLink.target = '_blank';
            payLink.rel = 'noopener noreferrer';
            payLink.className = 'dynamic-pulse-btn';
            payLink.style.cssText = `
                margin: 20px auto;
                display: block;
                max-width: 250px;
                text-align: center;
                text-decoration: none;
                background: linear-gradient(135deg, #09BB07, #2DC100);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
                box-sizing: border-box;
            `;
            payLink.innerHTML = `
                <span style="display: flex; align-items: center; justify-content: center;">
                    <span style="margin-right: 8px;">💳</span>
                    前往微信支付
                </span>
            `;
            payLink.addEventListener('click', () => persistBeforeRedirect(paymentData));
            paymentMethods.appendChild(payLink);
        }
    }
}

// 保存分析数据（跳转支付宝前调用，返回时用于恢复界面并查单）
function saveAnalysisData() {
    if (STATE.fullAnalysisResult) {
        AnalysisStorage.setLastAnalysisResult(STATE.fullAnalysisResult);
        AnalysisStorage.setLastAnalysisService(STATE.currentService);
        AnalysisStorage.setLastUserData(STATE.userData || {});
        AnalysisStorage.setLastOrderId(STATE.lastAiOrderId);
        if (STATE.partnerData) {
            AnalysisStorage.setLastPartnerData(STATE.partnerData);
        }
        if (STATE.lastAiOrderId) {
            try {
                const cur = PaymentStorage.getPaymentData() || {};
                PaymentStorage.setPaymentData({
                    orderId: STATE.lastAiOrderId,
                    aiOrderId: cur.aiOrderId || STATE.lastAiOrderId,
                    serviceType: cur.serviceType || STATE.currentService,
                    timestamp: new Date().toISOString()
                });
            } catch (e) {}
        }
        console.log('分析结果已保存到 localStorage');
    }
}

// 关闭支付弹窗
export function closePaymentModal() {
    if (pendingPaymentMethodResolve) {
        const r = pendingPaymentMethodResolve;
        pendingPaymentMethodResolve = null;
        r(null);
    }
    const paymentModal = UI.paymentModal();
    if (paymentModal) {
        hideElement(paymentModal);
        document.body.style.overflow = 'auto';
    }
}
