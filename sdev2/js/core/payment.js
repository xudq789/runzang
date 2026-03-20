// ============ 【支付管理模块】 ============
/**
 * 支付相关逻辑：回调处理、状态验证、内容解锁等
 */

import { PaymentStorage, RunzangStorage, AnalysisStorage } from './storage.js';
import { STATE } from './config.js';
import { fetchPaymentStatus, parseBaziData } from './api.js';

// ============ 【支付宝支付回调处理】 ============
export const AlipayCallbackHandler = {
    /**
     * 检查URL中是否有后端返回的支付成功参数
     * @returns {string|null} 订单ID或null
     */
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
            
            PaymentStorage.setPaymentData(paymentData);
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
    
    /**
     * 清理URL参数
     */
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
/**
 * 用接口返回的 data.content 更新本地存储和 STATE
 * processing/partial 时不覆盖避免清空当前展示
 */
export function applyStatusContent(result) {
    if (!result || !result.success || !result.data || result.data.content == null) return;
    const status = result.data.status;
    if (status === 'processing' || status === 'partial') return;
    const content = result.data.content;
    try {
        AnalysisStorage.setLastAnalysisResult(content);
        STATE.fullAnalysisResult = content;
    } catch (e) {
        console.warn('更新分析内容到本地失败:', e);
    }
}

/**
 * 当前展示的订单（当前服务+当前订单号）是否已支付
 * 仅当 paymentData 对应本订单且 verified 时为 true
 */
export function isCurrentOrderPaid() {
    const paymentData = PaymentStorage.getPaymentData();
    if (!paymentData || !paymentData.verified) return false;
    if (!STATE.lastAiOrderId || !STATE.currentService) return false;
    const storageOrderId = paymentData.aiOrderId || paymentData.orderId;
    const match = paymentData.serviceType === STATE.currentService && storageOrderId === STATE.lastAiOrderId;
    return !!match;
}

// ============ 【支付管理器】 ============
/**
 * 支付管理器 - 处理支付状态检查、验证、解锁等
 * 需要注入 UI 更新函数（避免循环依赖）
 */
export function createPaymentManager(uiFunctions) {
    const {
        updateServiceDisplay,
        displayPredictorInfo,
        displayBaziPan,
        displayDayunPan,
        processAndDisplayAnalysis,
        showAnalysisResult,
        updateUnlockInterface,
        showFullAnalysisContent,
        unlockDownloadButton,
        closePaymentModal,
        updateHistoryNavVisibility
    } = uiFunctions;

    return {
        /**
         * 初始化支付检查
         */
        async initPaymentCheck() {
            console.log('🔍 初始化支付状态检查...');
            
            // 1. 检查后端回调
            const orderIdFromCallback = AlipayCallbackHandler.checkBackendCallback();
            if (orderIdFromCallback) {
                console.log('发现后端回调订单，立即解锁:', orderIdFromCallback);
                await this.verifyAndUnlock(orderIdFromCallback, true);
                return;
            }
            
            // 2. 页面刷新时清除当前订单缓存
            // 用户需要通过点击历史记录来查看报告，而不是自动恢复
            RunzangStorage.clearCurrentOrder();
            console.log('✅ 已清除当前订单缓存，需要从历史记录中选择查看');
            
            // 不再自动检查已保存的支付状态，避免刷新时自动展示报告
            // 只有用户点击历史记录时才会恢复报告
        },
        
        /**
         * 检查已保存的支付状态
         */
        async checkSavedPayment() {
            try {
                const paymentData = PaymentStorage.getPaymentData();
                if (!paymentData) {
                    console.log('没有找到已保存的支付数据');
                    return;
                }
                
                console.log('找到已保存的支付数据:', paymentData.orderId);
                
                // 如果已经是后端验证过的，直接解锁（不显示消息，避免刷新时重复提示）
                if (paymentData.backendVerified) {
                    console.log('支付已由后端验证过，解锁内容');
                    await this.unlockContent(paymentData.orderId, false);
                    return;
                }
                
                // 否则向后端查询状态（不显示消息，避免刷新时重复提示）
                const verified = await this.verifyPaymentStatus(paymentData.orderId);
                if (verified) {
                    await this.unlockContent(paymentData.orderId, false);
                }
                
            } catch (error) {
                console.error('检查支付状态失败:', error);
            }
        },
        
        /**
         * 获取支付数据
         * @returns {object|null}
         */
        getPaymentData() {
            return PaymentStorage.getPaymentData();
        },
        
        /**
         * 验证支付状态
         * @param {string} orderId - 订单ID
         * @returns {Promise<boolean>}
         */
        async verifyPaymentStatus(orderId) {
            try {
                console.log('🔐 验证支付状态，订单号:', orderId);
                const result = await fetchPaymentStatus(orderId);
                console.log('支付状态响应:', result);

                const data = result.data;
                if (!result.success || !data) return false;

                const status = data.status;
                const paymentStatus = data.paymentStatus;

                // 用接口返回的最新 content 更新本地存储
                applyStatusContent(result);

                if (status === 'processing' || status === 'partial') {
                    alert('结果分析未完成，请1分钟后再试');
                    return false;
                }
                if (status === 'failed') {
                    alert('结果分析失败，请联系客服微信：runzang888');
                    return false;
                }

                if (paymentStatus === 'paid') {
                    console.log('✅ 支付验证成功');
                    const paymentData = PaymentStorage.getPaymentData() || {};
                    paymentData.verified = true;
                    paymentData.verifiedAt = new Date().toISOString();
                    PaymentStorage.setPaymentData(paymentData);
                    if (data.content) {
                        const serviceType = paymentData.serviceType || STATE.currentService;
                        const storageOrderId = paymentData.aiOrderId || orderId;
                        const existing = RunzangStorage.getResult(serviceType, storageOrderId);
                        RunzangStorage.setResult(serviceType, storageOrderId, {
                            content: data.content,
                            userData: existing?.userData || STATE.userData || {},
                            partnerData: existing?.partnerData ?? STATE.partnerData ?? null,
                            createdAt: existing?.createdAt || new Date().toISOString()
                        });
                    }
                    return true;
                }

                return false;
            } catch (error) {
                console.error('支付验证失败:', error);
                return false;
            }
        },
        
        /**
         * 验证并解锁
         * @param {string} orderId - 订单ID
         * @param {boolean} isBackendVerified - 是否后端已验证
         * @returns {Promise<boolean>}
         */
        async verifyAndUnlock(orderId, isBackendVerified = false) {
            try {
                // 如果是后端已验证的，直接解锁（显示成功消息，因为这是用户刚支付完成）
                if (isBackendVerified) {
                    console.log('✅ 后端已验证支付，直接解锁');
                    await this.unlockContent(orderId, true);
                    return true;
                }
                
                // 否则查询状态（显示成功消息）
                const verified = await this.verifyPaymentStatus(orderId);
                if (verified) {
                    await this.unlockContent(orderId, true);
                    return true;
                }
                
                return false;
                
            } catch (error) {
                console.error('验证并解锁失败:', error);
                return false;
            }
        },
        
        /**
         * 解锁内容
         * @param {string} orderId - 订单ID（支付单号）
         * @param {boolean} showMessage - 是否显示成功消息（默认true）
         */
        async unlockContent(orderId, showMessage = true) {
            console.log('🔓 开始解锁内容，订单:', orderId);
            const paymentData = PaymentStorage.getPaymentData();
            const serviceType = paymentData?.serviceType || STATE.currentService;
            const storageOrderId = paymentData?.aiOrderId || orderId;
            RunzangStorage.setCurrentOrder(serviceType, storageOrderId);
            STATE.lastAiOrderId = storageOrderId;
            STATE.isPaymentUnlocked = true;
            STATE.isDownloadLocked = false;
            try {
                const restored = await this.restoreAnalysis();
                if (restored) {
                    RunzangStorage.addPaidOrder({
                        orderId: storageOrderId,
                        serviceType,
                        userInputSummary: RunzangStorage.userInputSummary(STATE.userData, STATE.partnerData, serviceType)
                    });
                    if (updateHistoryNavVisibility) updateHistoryNavVisibility();
                    this.updateUIAfterPayment();
                    if (showMessage) {
                        this.showSuccessMessage();
                    }
                    setTimeout(() => this.unlockDownloadButtonDirectly(), 300);
                    setTimeout(() => {
                        const resultSection = document.getElementById('analysis-result-section');
                        if (resultSection) resultSection.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
                } else {
                    if (STATE.fullAnalysisResult) {
                        this.updateUIAfterPayment();
                        if (showMessage) {
                            this.showSuccessMessage();
                        }
                    }
                }
            } catch (error) {
                console.error('解锁内容失败:', error);
                this.unlockDownloadButtonDirectly();
            }
        },
        
        /**
         * 直接解锁下载按钮
         */
        unlockDownloadButtonDirectly() {
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
        
        /**
         * 恢复分析结果
         * @returns {Promise<boolean>}
         */
        async restoreAnalysis() {
            try {
                const current = RunzangStorage.getCurrentOrder();
                if (!current || !current.serviceType || !current.orderId) {
                    console.log('没有当前查询订单，不恢复结果');
                    return false;
                }
                const data = RunzangStorage.getResult(current.serviceType, current.orderId);
                if (!data || !data.content) {
                    console.log('未找到该订单的结果');
                    return false;
                }
                console.log('📥 从存储恢复分析结果:', current.serviceType, current.orderId);
                STATE.currentService = current.serviceType;
                STATE.lastAiOrderId = current.orderId;
                STATE.fullAnalysisResult = data.content;
                STATE.userData = data.userData || null;
                STATE.partnerData = data.partnerData || null;
                const parsedBaziData = parseBaziData(data.content);
                STATE.baziData = parsedBaziData.userBazi;
                STATE.partnerBaziData = parsedBaziData.partnerBazi;
                updateServiceDisplay(current.serviceType);
                displayPredictorInfo();
                displayBaziPan();
                displayDayunPan();
                processAndDisplayAnalysis(data.content);
                // ✅ 注释掉 showAnalysisResult()，避免与 history.js 的滚动冲突
                // showAnalysisResult();  // 由调用方（history.js）控制显示
                console.log('✅ 分析结果恢复成功');
                return true;
            } catch (error) {
                console.error('恢复分析失败:', error);
                return false;
            }
        },
        
        /**
         * 更新支付后的UI
         */
        updateUIAfterPayment() {
            console.log('🎨 更新支付后UI...');
            
            if (updateUnlockInterface) updateUnlockInterface();
            if (showFullAnalysisContent) showFullAnalysisContent();
            if (unlockDownloadButton) unlockDownloadButton();
            if (closePaymentModal) closePaymentModal();
        },
        
        /**
         * 显示成功消息
         */
        showSuccessMessage() {
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
        
        /**
         * 支付前保存分析数据（旧版兼容）
         */
        saveAnalysisBeforePayment() {
            if (!STATE.fullAnalysisResult || !STATE.currentService || !STATE.userData) {
                console.error('无法保存分析数据：缺少必要信息');
                return false;
            }
            
            try {
                AnalysisStorage.setLastAnalysisResult(STATE.fullAnalysisResult);
                AnalysisStorage.setLastAnalysisService(STATE.currentService);
                AnalysisStorage.setLastUserData(STATE.userData);
                
                console.log('✅ 分析数据已保存到 localStorage');
                return true;
                
            } catch (error) {
                console.error('保存分析数据失败:', error);
                return false;
            }
        }
    };
}
