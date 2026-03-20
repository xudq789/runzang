// ============ 【支付弹窗相关功能模块】 ============
/**
 * 支付弹窗显示、支付方式选择、支付界面显示等功能
 */

import { hideElement, showElement } from './utils.js';
import { UI } from './ui-elements.js';
import { STATE, PAYMENT_CONFIG, SERVICES } from './config.js';
import { PaymentStorage, AnalysisStorage } from './storage.js';

// 显示支付弹窗 - 支持支付宝和微信支付
export async function showPaymentModal() {
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
    
    try {
        // 1. 先显示支付弹窗
        const paymentModal = UI.paymentModal();
        if (paymentModal) {
            showElement(paymentModal);
            document.body.style.overflow = 'hidden';
            
            // 先显示基本信息
            UI.paymentServiceType().textContent = STATE.currentService;
            UI.paymentAmount().textContent = '¥' + serviceConfig.price;
            UI.paymentOrderId().textContent = '生成中...';
        }
        
        // 2. 显示支付方式选择
        const selectedMethod = await showPaymentMethodSelection();
        if (!selectedMethod) {
            closePaymentModal();
            return;
        }
        
        // 3. 调用后端支付接口
        const frontendOrderId = STATE.lastAiOrderId || ('RUNZ-FRONT-' + Date.now() + '-' + Math.floor(Math.random() * 10000));

        const createUrl = `${PAYMENT_CONFIG.GATEWAY_URL}/api/payment/create`;
        console.log('🔗 调用支付API:', createUrl);
        console.log('请求数据:', {
            serviceType: STATE.currentService,
            amount: parseFloat(serviceConfig.price).toFixed(2),
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
                amount: parseFloat(serviceConfig.price).toFixed(2),
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

// 支付方式选择弹窗
function showPaymentMethodSelection() {
    return new Promise((resolve) => {
        // 直接根据设备类型决定支付方式
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /mobile|iphone|android/i.test(userAgent);
        
        // 规则：电脑端用微信native，手机端用支付宝H5
        const selectedMethod = isMobile ? 'alipay' : 'wechatpay';
        
        console.log('设备检测:', {
            userAgent: userAgent.substring(0, 100),
            isMobile: isMobile,
            selectedMethod: selectedMethod
        });
        
        // 显示支付方式提示
        const paymentMethods = document.querySelector('.payment-methods');
        if (paymentMethods) {
            const paymentHint = isMobile ? 
                '📱 检测到移动设备，将使用支付宝H5支付' :
                '💻 检测到电脑设备，将使用微信扫码支付';
            
            paymentMethods.innerHTML = `
                <div class="payment-auto-selection">
                <div class="device-detect-result">
                    <div class="device-icon">${isMobile ? '📱' : '💻'}</div>
                    <div class="device-info">
                    <div class="device-type">${isMobile ? '移动设备' : '电脑设备'}</div>
                    <div class="payment-method">${isMobile ? '支付宝H5支付' : '微信扫码支付'}</div>
                    </div>
                </div>
                <p style="text-align: center; color: #666; margin-top: 15px; font-size: 14px;">
                    ${paymentHint}
                </p>
                </div>
            `;
            
            // 添加样式
            const style = document.createElement('style');
            style.textContent = `
                .payment-auto-selection {
                padding: 20px;
                text-align: center;
                }
                .device-detect-result {
                display: inline-flex;
                align-items: center;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                padding: 20px 30px;
                border-radius: 15px;
                margin: 10px 0;
                border: 2px solid ${isMobile ? '#1677FF' : '#07C160'};
                }
                .device-icon {
                font-size: 40px;
                margin-right: 20px;
                }
                .device-info {
                text-align: left;
                }
                .device-type {
                font-size: 16px;
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
                }
                .payment-method {
                font-size: 18px;
                font-weight: bold;
                color: ${isMobile ? '#1677FF' : '#07C160'};
                }
            `;
            document.head.appendChild(style);
        }
        
        // 直接返回检测结果
        setTimeout(() => resolve(selectedMethod), 300);
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
        statusText.textContent = method === 'alipay' ? 
            '请在新打开的支付宝页面完成支付' : 
            '请使用微信扫码完成支付';
    }
    
    if (method === 'alipay') {
        // 支付宝支付 - 跳转按钮
        const payBtn = document.createElement('button');
        payBtn.id = 'alipay-redirect-btn';
        payBtn.className = 'dynamic-pulse-btn';
        payBtn.style.cssText = `
            margin: 20px auto;
            display: block;
            max-width: 250px;
            background: linear-gradient(135deg, #1677FF, #4096ff);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s;
        `;
        payBtn.innerHTML = `
            <span style="display: flex; align-items: center; justify-content: center;">
                <span style="margin-right: 8px;">💰</span>
                前往支付宝支付
            </span>
        `;
        
        payBtn.onclick = () => {
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
            window.open(paymentData.paymentUrl, '_blank');
        };
        
        paymentMethods.appendChild(payBtn);
        
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
            // 如果有支付链接，显示跳转按钮（备用）
            const payBtn = document.createElement('button');
            payBtn.id = 'wechat-redirect-btn';
            payBtn.className = 'dynamic-pulse-btn';
            payBtn.style.cssText = `
                margin: 20px auto;
                display: block;
                max-width: 250px;
                background: linear-gradient(135deg, #09BB07, #2DC100);
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s;
            `;
            payBtn.innerHTML = `
                <span style="display: flex; align-items: center; justify-content: center;">
                    <span style="margin-right: 8px;">💳</span>
                    前往微信支付
                </span>
            `;
            
            payBtn.onclick = () => {
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
                window.open(paymentData.paymentUrl, '_blank');
            };
            
            paymentMethods.appendChild(payBtn);
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
    const paymentModal = UI.paymentModal();
    if (paymentModal) {
        hideElement(paymentModal);
        document.body.style.overflow = 'auto';
    }
}
