// ============ 【UI元素集合和配置】 ============
/**
 * UI 元素集合和配置模块
 * 提供统一的 DOM 元素访问接口
 */

import { DOM } from './utils.js';

// 进度条分析步骤配置
export const PROGRESS_STEPS = {
    '测算验证': [
        { title: '真太阳时排盘', time: 10 },
        { title: '八字排盘', time: 10 },
        { title: '大运排盘', time: 10 },
        { title: '八字喜用分析', time: 10 },
        { title: '性格特点解读', time: 10 },
        { title: '职业发展评估', time: 10 },
        { title: '过往运势验证', time: 10 },
        { title: '综合命理报告', time: 10 }
    ],
    '流年运程': [
        { title: '真太阳时排盘', time: 10 },
        { title: '八字排盘', time: 10 },
        { title: '大运排盘', time: 10 },
        { title: '八字喜用分析', time: 10 },
        { title: '性格特点解读', time: 10 },
        { title: '职业发展评估', time: 10 },
        { title: '流年运势分析', time: 10 },
        { title: '事业发展预测', time: 10 },
        { title: '感情趋势解读', time: 10 },
        { title: '年度发展建议', time: 10 }
    ],
    '人生详批': [
        { title: '真太阳时排盘', time: 10 },
        { title: '八字排盘', time: 10 },
        { title: '大运排盘', time: 10 },
        { title: '八字喜用分析', time: 10 },
        { title: '性格特点解读', time: 10 },
        { title: '职业发展评估', time: 10 },
        { title: '富贵层次评估', time: 10 },
        { title: '大运吉凶分析', time: 10 },
        { title: '人生高低点分析', time: 10 },
        { title: '未来流年分析', time: 10 },
        { title: '风水建议', time: 10 },
        { title: '综合人生报告', time: 10 }
    ],
    '八字合婚': [
        { title: '真太阳时排盘', time: 10 },
        { title: '用户八字排盘', time: 10 },
        { title: '伴侣八字排盘', time: 10 },
        { title: '用户大运排盘', time: 10 },
        { title: '伴侣大运排盘', time: 10 },
        { title: '八字喜用分析', time: 10 },
        { title: '性格特点解读', time: 10 },
        { title: '八字契合度分析', time: 10 },
        { title: '感情趋势分析', time: 10 },
        { title: '婚姻稳定性分析', time: 10 },
        { title: '性格匹配度分析', time: 10 },
        { title: '综合合婚报告', time: 10 }
    ]
};

// UI元素集合
export const UI = {
    // 表单元素
    name: () => DOM.id('name'),
    gender: () => DOM.id('gender'),
    birthCity: () => DOM.id('birth-city'),
    birthYear: () => DOM.id('birth-year'),
    birthMonth: () => DOM.id('birth-month'),
    birthDay: () => DOM.id('birth-day'),
    birthHour: () => DOM.id('birth-hour'),
    birthMinute: () => DOM.id('birth-minute'),
    
    // 伴侣信息元素
    partnerName: () => DOM.id('partner-name'),
    partnerGender: () => DOM.id('partner-gender'),
    partnerBirthCity: () => DOM.id('partner-birth-city'),
    partnerBirthYear: () => DOM.id('partner-birth-year'),
    partnerBirthMonth: () => DOM.id('partner-birth-month'),
    partnerBirthDay: () => DOM.id('partner-birth-day'),
    partnerBirthHour: () => DOM.id('partner-birth-hour'),
    partnerBirthMinute: () => DOM.id('partner-birth-minute'),
    
    // 按钮
    analyzeBtn: () => DOM.id('analyze-btn'),
    unlockBtn: () => DOM.id('unlock-btn'),
    downloadReportBtn: () => DOM.id('download-report-btn'),
    recalculateBtn: () => DOM.id('recalculate-btn'),
    confirmPaymentBtn: () => DOM.id('confirm-payment-btn'),
    cancelPaymentBtn: () => DOM.id('cancel-payment-btn'),
    closePaymentBtn: () => DOM.id('close-payment'),
    
    // 图片
    heroImage: () => DOM.id('hero-image'),
    detailImage: () => DOM.id('detail-image'),
    
    // 模态框
    paymentModal: () => DOM.id('payment-modal'),
    loadingModal: () => DOM.id('loading-modal'),
    
    // 结果区域
    analysisResultSection: () => DOM.id('analysis-result-section'),
    predictorInfoGrid: () => DOM.id('predictor-info-grid'),
    baziGrid: () => DOM.id('bazi-grid'),
    freeAnalysisText: () => DOM.id('free-analysis-text'),
    lockedAnalysisText: () => DOM.id('locked-analysis-text'),
    unlockItemsList: () => DOM.id('unlock-items-list'),
    unlockPrice: () => DOM.id('unlock-price'),
    unlockCount: () => DOM.id('unlock-count'),
    resultServiceName: () => DOM.id('result-service-name'),
    analysisTime: () => DOM.id('analysis-time'),
    orderInfo: () => DOM.id('order-info'),
    orderId: () => DOM.id('order-id'),
    
    // 支付弹窗
    paymentServiceType: () => DOM.id('payment-service-type'),
    paymentAmount: () => DOM.id('payment-amount'),
    paymentOrderId: () => DOM.id('payment-order-id')
};
