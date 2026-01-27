/**
 * 支付与回调逻辑：支付宝回调、支付状态、解锁与恢复
 */
import { STATE, API_BASE_URL } from './config.js';
import { parseBaziData, fetchAiResultContent } from './api.js';
import {
    updateServiceDisplay,
    renderResultSection,
    showAnalysisResult,
    updateUnlockInterface,
    showFullAnalysisContent,
    unlockDownloadButton,
    closePaymentModal
} from './ui.js';

// ============ 支付宝支付回调 ============
export const AlipayCallbackHandler = {
    checkBackendCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const paymentSuccess = urlParams.get('payment_success');
        const orderId = urlParams.get('order_id');
        const verified = urlParams.get('verified');
        const amount = urlParams.get('amount');

        if (paymentSuccess === 'true' && orderId && verified === 'true') {
            console.log('✅ 检测到后端已验证的支付成功参数:', { orderId, amount, verified });
            const paymentData = {
                orderId, amount, verified: true, backendVerified: true,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('alipay_payment_data', JSON.stringify(paymentData));
            this.cleanUrlParams();
            return orderId;
        }
        const paymentStatus = urlParams.get('payment_status');
        if (paymentStatus === 'waiting' && orderId) {
            console.log('⏳ 检测到支付等待状态:', orderId);
            this.cleanUrlParams();
        }
        return null;
    },

    cleanUrlParams() {
        try {
            if (window.history.replaceState) {
                window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
            }
        } catch (e) {
            console.log('URL清理失败:', e);
        }
    }
};

// ============ 支付状态管理器 ============
export const PaymentManager = {
    async initPaymentCheck() {
        console.log('🔍 初始化支付状态检查...');
        const orderIdFromCallback = AlipayCallbackHandler.checkBackendCallback();
        if (orderIdFromCallback) {
            await this.verifyAndUnlock(orderIdFromCallback, true);
            return;
        }
        await this.checkSavedPayment();
    },

    getPaymentData() {
        try {
            const data = localStorage.getItem('alipay_payment_data');
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('解析支付数据失败:', e);
            return null;
        }
    },

    async verifyPaymentStatus(orderId) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/payment/status/${orderId}`, { mode: 'cors' });
            if (!res.ok) return false;
            const result = await res.json();
            if (result.success && result.data && result.data.status === 'paid') {
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

    async verifyAndUnlock(orderId, isBackendVerified = false) {
        try {
            if (isBackendVerified) {
                await this.unlockContent(orderId);
                return true;
            }
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

    async checkSavedPayment() {
        try {
            const paymentData = this.getPaymentData();
            if (!paymentData) return;
            if (paymentData.backendVerified) {
                await this.unlockContent(paymentData.orderId);
                return;
            }
            const verified = await this.verifyPaymentStatus(paymentData.orderId);
            if (verified) await this.unlockContent(paymentData.orderId);
        } catch (error) {
            console.error('检查支付状态失败:', error);
        }
    },

    async unlockContent(orderId) {
        console.log('🔓 开始解锁内容，订单:', orderId);
        STATE.isPaymentUnlocked = true;
        STATE.isDownloadLocked = false;
        STATE.currentOrderId = orderId;
        try {
            const restored = await this.restoreAnalysis();
            if (restored) {
                this.updateUIAfterPayment();
                this.showSuccessMessage();
                setTimeout(() => this.unlockDownloadButtonDirectly(), 300);
                setTimeout(() => {
                    const el = document.getElementById('analysis-result-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                }, 500);
            } else if (STATE.fullAnalysisResult) {
                this.updateUIAfterPayment();
                this.showSuccessMessage();
            }
        } catch (error) {
            console.error('解锁内容失败:', error);
            this.unlockDownloadButtonDirectly();
        }
    },

    unlockDownloadButtonDirectly() {
        const btn = document.getElementById('download-report-btn');
        const text = document.getElementById('download-btn-text');
        if (btn && text) {
            btn.disabled = false;
            btn.classList.remove('download-btn-locked');
            text.textContent = '下载报告';
            btn.style.background = 'linear-gradient(135deg, var(--primary-color), #3a7bd5)';
            btn.style.boxShadow = '0 4px 15px rgba(58, 123, 213, 0.4)';
            return true;
        }
        return false;
    },

    async restoreAnalysis() {
        try {
            const savedResult = localStorage.getItem('last_analysis_result');
            const savedService = localStorage.getItem('last_analysis_service');
            const savedUserData = localStorage.getItem('last_user_data');
            if (!savedResult || !savedService) return false;

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

            let contentToShow = savedResult;
            if (STATE.isPaymentUnlocked && STATE.currentOrderId) {
                const fullContent = await fetchAiResultContent(STATE.currentOrderId);
                if (fullContent) {
                    contentToShow = fullContent;
                    STATE.fullAnalysisResult = fullContent;
                }
            }
            renderResultSection({ content: contentToShow, isUnlocked: STATE.isPaymentUnlocked });
            showAnalysisResult();
            return true;
        } catch (error) {
            console.error('恢复分析失败:', error);
            return false;
        }
    },

    updateUIAfterPayment() {
        updateUnlockInterface();
        showFullAnalysisContent();
        unlockDownloadButton();
        closePaymentModal();
    },

    showSuccessMessage() {
        if (document.getElementById('payment-success-alert')) return;
        const div = document.createElement('div');
        div.id = 'payment-success-alert';
        div.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,#4CAF50,#45a049);color:#fff;padding:15px 30px;border-radius:8px;z-index:10000;box-shadow:0 4px 20px rgba(76,175,80,0.3);font-size:16px;font-weight:bold;text-align:center;min-width:300px;max-width:90%;';
        div.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;gap:10px;"><span style="font-size:20px">✅</span><span>支付成功！算命报告已解锁</span></div><div style="margin-top:8px;font-size:12px;opacity:.9">现在可以查看完整分析和下载报告</div>';
        document.body.appendChild(div);
        setTimeout(() => div.parentNode && div.parentNode.removeChild(div), 5000);
    },

    saveAnalysisBeforePayment() {
        if (!STATE.fullAnalysisResult || !STATE.currentService || !STATE.userData) return false;
        try {
            localStorage.setItem('last_analysis_result', STATE.fullAnalysisResult);
            localStorage.setItem('last_analysis_service', STATE.currentService);
            localStorage.setItem('last_user_data', JSON.stringify(STATE.userData));
            return true;
        } catch (e) {
            console.error('保存分析数据失败:', e);
            return false;
        }
    }
};

// ============ URL 支付回调检测 ============
export function checkPaymentSuccessFromURL() {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment_success') !== 'true' || urlParams.get('from') !== 'alipay') return null;
        const orderId = urlParams.get('out_trade_no') || urlParams.get('order_id') || localStorage.getItem('paid_order_id');
        if (orderId) {
            localStorage.setItem('paid_order_id', orderId);
            try {
                window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
            } catch (e) {}
            return orderId;
        }
        return null;
    } catch (error) {
        console.error('检查支付回调失败:', error);
        return null;
    }
}
