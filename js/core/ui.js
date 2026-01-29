// UI控制模块
'use strict';

import { DOM, formatDate, hideElement, showElement, generateOrderId, calculateBazi } from './utils.js';
import { SERVICES, STATE, PAYMENT_CONFIG } from './config.js';

// 进度条分析步骤配置
const PROGRESS_STEPS = {
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
const UI = {
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
    
    // 支付弹窗
    paymentServiceType: () => DOM.id('payment-service-type'),
    paymentAmount: () => DOM.id('payment-amount'),
    paymentOrderId: () => DOM.id('payment-order-id')
};

// ============ 【公共函数定义（不直接导出）】 ============

// 初始化表单选项
function initFormOptions() {
    // 年份选项 (1900-2024)
    const years = [];
    for (let i = 1900; i <= 2024; i++) years.push(i);
    
    // 月份选项
    const months = Array.from({ length: 12 }, (_, i) => i + 1);
    
    // 日期选项
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    
    // 小时选项
    const hours = Array.from({ length: 24 }, (_, i) => i);
    
    // 分钟选项
    const minutes = Array.from({ length: 60 }, (_, i) => i);
    
    // 填充选项的函数
    const fillSelect = (selectId, options, suffix) => {
        const select = DOM.id(selectId);
        if (!select) return;
        
        select.innerHTML = `<option value="">${suffix}</option>`;
        options.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option;
            opt.textContent = option + suffix;
            select.appendChild(opt);
        });
    };
    
    // 填充所有选择框
    fillSelect('birth-year', years, '年');
    fillSelect('birth-month', months, '月');
    fillSelect('birth-day', days, '日');
    fillSelect('birth-hour', hours, '时');
    fillSelect('birth-minute', minutes, '分');
    
    fillSelect('partner-birth-year', years, '年');
    fillSelect('partner-birth-month', months, '月');
    fillSelect('partner-birth-day', days, '日');
    fillSelect('partner-birth-hour', hours, '时');
    fillSelect('partner-birth-minute', minutes, '分');
}

// 设置默认表单值
function setDefaultValues() {
    // 用户默认值
    UI.name().value = '张三';
    UI.gender().value = 'male';
    UI.birthCity().value = '北京';
    UI.birthYear().value = 1990;
    UI.birthMonth().value = 1;
    UI.birthDay().value = 1;
    UI.birthHour().value = 12;
    UI.birthMinute().value = 0;
    
    // 伴侣默认值
    UI.partnerName().value = '李四';
    UI.partnerGender().value = 'female';
    UI.partnerBirthCity().value = '上海';
    UI.partnerBirthYear().value = 1992;
    UI.partnerBirthMonth().value = 6;
    UI.partnerBirthDay().value = 15;
    UI.partnerBirthHour().value = 15;
    UI.partnerBirthMinute().value = 30;
}

// 更新服务显示
function updateServiceDisplay(serviceName) {
    // 更新导航激活状态
    DOM.getAll('.service-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.service === serviceName) {
            link.classList.add('active');
        }
    });
    
    // 更新表单标题
    DOM.id('form-title').textContent = serviceName + '信息填写';
    
    // ✅ 修复：确保更新全局状态
    STATE.currentService = serviceName;
    console.log('服务更新为:', serviceName);
    
    // 更新结果区域标题
    const resultServiceName = UI.resultServiceName();
    if (resultServiceName) {
        resultServiceName.textContent = serviceName + '分析报告';
    }
    
    // 显示/隐藏伴侣信息区域
    const partnerInfoSection = DOM.id('partner-info-section');
    if (serviceName === '八字合婚') {
        showElement(partnerInfoSection);
    } else {
        hideElement(partnerInfoSection);
    }
    
    // 更新图片
    const serviceConfig = SERVICES[serviceName];
    if (serviceConfig) {
        const heroImage = UI.heroImage();
        const detailImage = UI.detailImage();
        
        // 显示加载占位符
        const heroPlaceholder = heroImage?.previousElementSibling;
        const detailPlaceholder = detailImage?.previousElementSibling;
        
        if (heroPlaceholder) showElement(heroPlaceholder);
        if (detailPlaceholder) showElement(detailPlaceholder);
        
        // 移除已加载类
        if (heroImage) heroImage.classList.remove('loaded');
        if (detailImage) detailImage.classList.remove('loaded');
        
        // 更新图片源
        if (heroImage) {
            heroImage.src = serviceConfig.heroImage;
            heroImage.alt = serviceName + '英雄区';
        }
        
        if (detailImage) {
            detailImage.src = serviceConfig.detailImage;
            detailImage.alt = serviceName + '明细图';
        }
    }
    
    // ✅ 新增：立即更新解锁信息
    updateUnlockInfo();
}

// 更新解锁价格和项目
function updateUnlockInfo() {
    // 确保使用当前服务
    const currentService = STATE.currentService;
    console.log('updateUnlockInfo: 当前服务=', currentService, '解锁状态=', STATE.isPaymentUnlocked);
    
    const serviceConfig = SERVICES[currentService];
    if (!serviceConfig) {
        console.error('updateUnlockInfo: 未找到服务配置:', currentService);
        return;
    }
    
    // 更新价格
    const unlockPriceElement = UI.unlockPrice();
    if (unlockPriceElement) {
        unlockPriceElement.textContent = serviceConfig.price;
    }
    
    // 更新项目列表
    const unlockItemsList = UI.unlockItemsList();
    const unlockCountElement = UI.unlockCount();
    
    if (unlockItemsList && unlockCountElement) {
        unlockItemsList.innerHTML = '';
        
        const lockedItems = serviceConfig.lockedItems;
        
        // 更新项目数量
        unlockCountElement.textContent = lockedItems.length;
        
        // 根据当前解锁状态显示
        lockedItems.forEach(item => {
            const li = document.createElement('li');
            if (STATE.isPaymentUnlocked) {
                li.innerHTML = '<span>✅ ' + item + '</span>';
                li.classList.add('unlocked-item');
            } else {
                li.innerHTML = '<span>🔒 ' + item + '</span>';
            }
            unlockItemsList.appendChild(li);
        });
    }
}

// 显示预测者信息
function displayPredictorInfo() {
    const predictorInfoGrid = UI.predictorInfoGrid();
    if (!predictorInfoGrid || !STATE.userData) return;
    
    predictorInfoGrid.innerHTML = '';
    
    // ✅ 确保总是使用当前的STATE.currentService
    const currentServiceName = STATE.currentService || '测算验证';
    
    // 添加预测者信息
    const infoItems = [
        { label: '姓名', value: STATE.userData.name },
        { label: '性别', value: STATE.userData.gender },
        { label: '出生时间', value: `${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日 ${STATE.userData.birthHour}时${STATE.userData.birthMinute}分` },
        { label: '出生城市', value: STATE.userData.birthCity },
        { label: '测算服务', value: currentServiceName },
        { label: '测算时间', value: formatDate() }
    ];
    
    // 如果是八字合婚，添加伴侣信息
    if (currentServiceName === '八字合婚' && STATE.partnerData) {
        infoItems.push(
            { label: '伴侣姓名', value: STATE.partnerData.partnerName },
            { label: '伴侣性别', value: STATE.partnerData.partnerGender },
            { label: '伴侣出生时间', value: `${STATE.partnerData.partnerBirthYear}年${STATE.partnerData.partnerBirthMonth}月${STATE.partnerData.partnerBirthDay}日 ${STATE.partnerData.partnerBirthHour}时${STATE.partnerData.partnerBirthMinute}分` },
            { label: '伴侣出生城市', value: STATE.partnerData.partnerBirthCity }
        );
    }
    
    // 创建信息项
    infoItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'predictor-info-item';
        
        const labelSpan = document.createElement('span');
        labelSpan.className = 'predictor-info-label';
        labelSpan.textContent = item.label;
        
        const valueSpan = document.createElement('span');
        valueSpan.className = 'predictor-info-value';
        valueSpan.textContent = item.value;
        
        div.appendChild(labelSpan);
        div.appendChild(valueSpan);
        predictorInfoGrid.appendChild(div);
    });
}

// ============ 【内部辅助函数（不导出）】 ============

// 获取十神颜色
function getShishenColor(shishen) {
    const colors = {
        '正官': '#4169E1',
        '七杀': '#DC143C',
        '正印': '#32CD32',
        '偏印': '#20B2AA',
        '正财': '#FFD700',
        '偏财': '#FFA500',
        '食神': '#9370DB',
        '伤官': '#FF69B4',
        '比肩': '#808080',
        '劫财': '#A9A9A9'
    };
    return colors[shishen] || '#333';
}

// 八字排盘日历格式
function createBaziCalendar(baziData) {
    if (!baziData) return '<div style="text-align:center;padding:20px;color:#666;font-family:\'SimSun\',\'宋体\',serif;">八字数据加载中...</div>';
    
    return `
        <div class="bazi-calendar">
            <div class="calendar-header">
                <div class="calendar-title">📅 八字排盘</div>
                <div class="calendar-subtitle">生辰八字 • 命理基础</div>
            </div>
            <div class="calendar-grid">
                <div class="calendar-item year-item">
                    <div class="calendar-label">年柱</div>
                    <div class="calendar-value">${baziData.yearColumn}</div>
                    <div class="calendar-element">${baziData.yearElement}</div>
                </div>
                <div class="calendar-item month-item">
                    <div class="calendar-label">月柱</div>
                    <div class="calendar-value">${baziData.monthColumn}</div>
                    <div class="calendar-element">${baziData.monthElement}</div>
                </div>
                <div class="calendar-item day-item">
                    <div class="calendar-label">日柱</div>
                    <div class="calendar-value">${baziData.dayColumn}</div>
                    <div class="calendar-element">${baziData.dayElement}</div>
                </div>
                <div class="calendar-item hour-item">
                    <div class="calendar-label">时柱</div>
                    <div class="calendar-value">${baziData.hourColumn}</div>
                    <div class="calendar-element">${baziData.hourElement}</div>
                </div>
            </div>
            <div class="calendar-footer">
                <div class="calendar-note">※ 排盘基于真太阳时计算</div>
            </div>
        </div>
    `;
}

// 格式化标题
function formatTitle(title) {
    // 为不同类型的标题添加不同颜色
    if (title.includes('喜用') || title.includes('喜神') || title.includes('用神')) {
        return `<span style="color: #32CD32;">${title}</span>`;
    } else if (title.includes('忌神') || title.includes('忌')) {
        return `<span style="color: #FF4500;">${title}</span>`;
    } else if (title.includes('性格')) {
        return `<span style="color: #1E90FF;">${title}</span>`;
    } else if (title.includes('职业') || title.includes('行业')) {
        return `<span style="color: #8b4513;">${title}</span>`;
    } else if (title.includes('富贵') || title.includes('财富')) {
        return `<span style="color: #FFD700;">${title}</span>`;
    } else if (title.includes('婚姻') || title.includes('感情')) {
        return `<span style="color: #FF69B4;">${title}</span>`;
    } else if (title.includes('事业') || title.includes('财运')) {
        return `<span style="color: #FFA500;">${title}</span>`;
    } else if (title.includes('健康')) {
        return `<span style="color: #32CD32;">${title}</span>`;
    } else {
        return `<span style="color: #8b4513;">${title}</span>`;
    }
}

// 格式化报告内容
function formatReportContent(text) {
    // 只保留十神颜色处理
    text = text.replace(/喜神/g, '<span class="xiji-element xiji-xi">喜神</span>')
               .replace(/用神/g, '<span class="xiji-element xiji-yong">用神</span>')
               .replace(/忌神/g, '<span class="xiji-element xiji-ji">忌神</span>')
               .replace(/喜用/g, '<span class="xiji-element xiji-xiyong">喜用</span>');
    
    // 处理十神颜色
    const shishenKeywords = ['正官', '七杀', '正印', '偏印', '正财', '偏财', '食神', '伤官', '比肩', '劫财'];
    shishenKeywords.forEach(keyword => {
        const color = getShishenColor(keyword);
        text = text.replace(new RegExp(keyword, 'g'), `<span style="color: ${color};">${keyword}</span>`);
    });
    
    // 处理段落
    const paragraphs = text.split('\n').filter(p => p.trim());
    return paragraphs.map(para => `
        <div class="report-paragraph">${para}</div>
    `).join('');
}

// 创建分析段落
function createAnalysisSection(title, content) {
    const sectionTitle = title.replace(/【|】/g, '');
    
    return `
        <div class="report-section">
            <div class="report-title">${formatTitle(sectionTitle)}</div>
            <div class="report-content">${formatReportContent(content)}</div>
        </div>
    `;
}

// ============ 【更多公共函数】 ============

// ============ 【八字排盘显示函数 - 优化显示顺序】 ============
function displayBaziPan() {
    const baziGrid = UI.baziGrid();
    if (!baziGrid) return;
    
    baziGrid.innerHTML = '';
    
    // 1. 先显示用户八字排盘
    if (STATE.baziData) {
        const userContainer = createBaziContainer(STATE.baziData, 'user');
        baziGrid.appendChild(userContainer);
    }
    
    // 2. 如果是八字合婚，再显示伴侣八字排盘
    if (STATE.currentService === '八字合婚' && STATE.partnerBaziData) {
        const partnerContainer = createBaziContainer(STATE.partnerBaziData, 'partner');
        baziGrid.appendChild(partnerContainer);
    }
}

// ============ 【创建八字容器】 ============
function createBaziContainer(baziData, type = 'user') {
    const isPartner = type === 'partner';
    const title = isPartner ? '伴侣八字排盘' : '八字排盘';
    const color = isPartner ? '#FF69B4' : '#8b4513';
    const bgColor = isPartner ? '#fff5f5' : '#f9f5f0';
    const borderColor = isPartner ? '#ffc1cc' : '#e8d4b9';
    
    const container = document.createElement('div');
    container.className = isPartner ? 'partner-bazi-container' : 'bazi-container';
    container.style.cssText = `
        background: white;
        border-radius: 10px;
        box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        padding: 20px;
        margin-bottom: 25px;
        border: 1px solid #e8e8e8;
        ${isPartner ? 'border-left: 4px solid #FF69B4;' : ''}
        overflow: hidden;
    `;
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid ${borderColor};">
            <div style="font-size: 20px; color: ${color}; font-weight: bold; font-family: 'SimSun', '宋体', serif; margin-bottom: 6px;">
                ${title}
            </div>
            <div style="font-size: 13px; color: #666; font-family: 'SimSun', '宋体', serif;">
                ${isPartner ? '伴侣命理 • 配对分析' : '命理根基 • 生辰八字'}
            </div>
        </div>
        
        <!-- 八字排盘网格 -->
        <div class="bazi-grid-horizontal" style="display: flex; flex-wrap: wrap; gap: 15px; justify-content: center;">
            ${createBaziItem(baziData.yearColumn, baziData.yearElement, '年柱', isPartner)}
            ${createBaziItem(baziData.monthColumn, baziData.monthElement, '月柱', isPartner)}
            ${createBaziItem(baziData.dayColumn, baziData.dayElement, '日柱', isPartner)}
            ${createBaziItem(baziData.hourColumn, baziData.hourElement, '时柱', isPartner)}
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #e0e0e0;">
            <div style="font-size: 12px; color: #999; font-family: 'SimSun', '宋体', serif;">
                ※ 排盘基于真太阳时计算
            </div>
        </div>
    `;
    
    return container;
}

// ============ 【创建八字项目】 ============
function createBaziItem(column, element, label, isPartner = false) {
    const color = isPartner ? '#FF69B4' : '#8b4513';
    const bgColor = isPartner ? '#fff5f5' : '#f9f9f9';
    
    return `
        <div class="bazi-item" style="flex: 1; min-width: 120px; max-width: 150px; background: ${bgColor}; border-radius: 8px; padding: 15px 10px; text-align: center; border: 1px solid ${isPartner ? '#ffc1cc' : '#d9d9d9'};">
            <div class="bazi-label" style="font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500; font-family: 'SimSun', '宋体', serif;">
                ${label}
            </div>
            <div class="bazi-value" style="font-size: 24px; font-weight: bold; font-family: 'SimSun', '宋体', serif; margin-bottom: 8px; height: 36px; line-height: 36px; color: #333;">
                ${column || ''}
            </div>
            <div class="bazi-element" style="font-size: 14px; font-weight: 500; color: #666; padding: 4px 10px; background: white; border-radius: 15px; display: inline-block; border: 1px solid ${isPartner ? '#ffc1cc' : '#d9d9d9'};">
                ${element || ''}
            </div>
        </div>
    `;
}

// ============ 【大运排盘显示函数 - 完整干支显示】 ============
function displayDayunPan() {
    console.log('显示大运排盘（完整干支显示）...');
    
    if (!STATE.fullAnalysisResult) {
        console.log('没有分析结果，跳过显示大运排盘');
        return;
    }
    
    const baziGrid = UI.baziGrid();
    if (!baziGrid) return;
    
    // 移除原有的大运容器
    document.querySelectorAll('.dayun-container, .partner-dayun-container').forEach(el => el.remove());
    
    try {
        // 解析用户大运
        const userDayunData = extractDayunData(STATE.fullAnalysisResult, false);
        if (userDayunData && userDayunData.years.length > 0 && userDayunData.ganzhi.length > 0) {
            const userContainer = createDayunContainer(userDayunData, 'user');
            baziGrid.appendChild(userContainer);
            console.log('✅ 用户大运显示完成');
        } else {
            console.warn('用户大运数据解析失败或数据不全');
            // 显示备用数据
            const fallbackData = createFallbackDayunData('user');
            const userContainer = createDayunContainer(fallbackData, 'user');
            baziGrid.appendChild(userContainer);
        }
        
        // 如果是八字合婚，解析伴侣大运
        if (STATE.currentService === '八字合婚') {
            const partnerDayunData = extractDayunData(STATE.fullAnalysisResult, true);
            if (partnerDayunData && partnerDayunData.years.length > 0 && partnerDayunData.ganzhi.length > 0) {
                const partnerContainer = createDayunContainer(partnerDayunData, 'partner');
                baziGrid.appendChild(partnerContainer);
                console.log('✅ 伴侣大运显示完成');
            } else {
                console.warn('伴侣大运数据解析失败或数据不全');
                // 显示备用数据
                const fallbackData = createFallbackDayunData('partner');
                const partnerContainer = createDayunContainer(fallbackData, 'partner');
                baziGrid.appendChild(partnerContainer);
            }
        }
    } catch (error) {
        console.error('显示大运排盘失败:', error);
        // 显示错误信息
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #fff5f5; border-radius: 8px; margin: 20px 0;">
                <div style="color: #c62828; margin-bottom: 10px;">❌ 大运排盘显示失败</div>
                <div style="color: #666; font-size: 14px;">错误: ${error.message}</div>
            </div>
        `;
        baziGrid.appendChild(errorDiv);
    }
}

// ============ 【提取大运数据 - 完整干支】 ============
function extractDayunData(text, isPartner = false) {
    const prefix = isPartner ? '伴侣大运排盘' : '大运排盘';
    const userPrefix = isPartner ? '伴侣大运排盘' : (text.includes('用户大运排盘') ? '用户大运排盘' : '大运排盘');
    
    console.log(`开始提取${prefix}数据...`);
    
    // 查找对应的大运排盘部分
    const pattern = new RegExp(`【${userPrefix}】([\\s\\S]*?)(?:【|$)`, 'i');
    const match = text.match(pattern);
    
    if (!match || !match[1]) {
        console.log(`未找到${prefix}数据`);
        return null;
    }
    
    const dayunText = match[1].trim();
    console.log(`${prefix}原始文本:`, dayunText);
    
    // 解析数据
    const years = [];
    const ganzhi = [];
    
    const lines = dayunText.split('\n');
    
    // 先提取岁数据
    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('岁：') || trimmed.startsWith('岁:')) {
            console.log('找到岁行:', trimmed);
            
            // 提取所有数字
            const yearMatches = trimmed.match(/\d+/g);
            if (yearMatches) {
                years.push(...yearMatches.slice(0, 8)); // 最多8步大运
                console.log('提取的岁数据:', years);
            }
            break;
        }
    }
    
    // 再提取大运干支数据
    for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('大运：') || trimmed.startsWith('大运:')) {
            console.log('找到大运行:', trimmed);
            
            // 提取所有两字干支
            const ganzhiMatches = trimmed.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g);
            if (ganzhiMatches) {
                ganzhi.push(...ganzhiMatches.slice(0, 8)); // 最多8步大运
                console.log('提取的干支数据:', ganzhi);
            } else {
                // 如果没有匹配到标准干支，尝试提取空格分隔的内容
                const content = trimmed.replace(/大运[：:]\s*/, '');
                const items = content.split(/\s+/);
                ganzhi.push(...items.slice(0, 8));
                console.log('提取的备选数据:', ganzhi);
            }
            break;
        }
    }
    
    // 确保数据对齐
    const maxLength = Math.max(years.length, ganzhi.length);
    while (years.length < maxLength && years.length < 8) {
        years.push((years.length * 10 + 8).toString());
    }
    while (ganzhi.length < maxLength && ganzhi.length < 8) {
        ganzhi.push('待定');
    }
    
    console.log(`${prefix}最终数据:`, { 
        years: years.slice(0, 8), 
        ganzhi: ganzhi.slice(0, 8) 
    });
    
    return {
        years: years.slice(0, 8),
        ganzhi: ganzhi.slice(0, 8),
        rawText: dayunText,
        isPartner: isPartner
    };
}

// ============ 【创建备用大运数据】 ============
function createFallbackDayunData(type = 'user') {
    const isPartner = type === 'partner';
    const startAge = isPartner ? 9 : 8;
    
    const years = [];
    const ganzhi = [];
    
    for (let i = 0; i < 8; i++) {
        years.push((startAge + i * 10).toString());
        // 示例干支，实际应该从API返回
        ganzhi.push(['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未'][i] || '待定');
    }
    
    return {
        years: years,
        ganzhi: ganzhi,
        rawText: '大运数据加载中...',
        isPartner: isPartner
    };
}

// ============ 【创建大运容器 - 完整干支显示】 ============
function createDayunContainer(dayunData, type = 'user') {
    const isPartner = type === 'partner';
    const title = isPartner ? '伴侣大运排盘' : '大运排盘';
    const color = isPartner ? '#FF69B4' : '#3a7bd5';
    const bgColor = isPartner ? '#fff5f5' : '#f0f8ff';
    const borderColor = isPartner ? '#ffc1cc' : '#d1e9ff';
    
    const { years, ganzhi } = dayunData;
    
    const container = document.createElement('div');
    container.className = isPartner ? 'partner-dayun-container' : 'dayun-container';
    
    // 基础样式
    container.style.cssText = `
        background: white;
        border-radius: 10px;
        box-shadow: 0 3px 15px rgba(0,0,0,0.08);
        padding: 20px;
        margin-bottom: 25px;
        border: 1px solid #e8e8e8;
        ${isPartner ? 'border-left: 4px solid #FF69B4;' : ''}
        overflow: hidden;
    `;
    
    // 创建横向表格
    const tableHTML = createSimpleDayunTable(years, ganzhi, isPartner);
    
    container.innerHTML = `
        <div style="text-align: center; margin-bottom: 25px; padding-bottom: 15px; border-bottom: 2px solid ${borderColor};">
            <div style="font-size: 20px; color: ${color}; font-weight: bold; font-family: 'SimSun', '宋体', serif; margin-bottom: 6px;">
                ${title}
            </div>
            <div style="font-size: 13px; color: #666; font-family: 'SimSun', '宋体', serif;">
                ${isPartner ? '伴侣运势 • 同步分析' : '运势轨迹 • 十年一运'}
            </div>
        </div>
        
        <!-- 横向大运表格 -->
        <div class="dayun-horizontal-container" style="margin-bottom: 20px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
            ${tableHTML}
        </div>
        
        <!-- 原始数据（折叠显示） -->
        <div style="margin-top: 20px; font-size: 13px;">
            <details style="background: #f9f9f9; border-radius: 6px; padding: 10px;">
                <summary style="color: #666; cursor: pointer; font-weight: bold; padding: 5px;">
                    📋 查看详细大运信息
                </summary>
                <div style="margin-top: 10px; padding: 10px; background: white; border-radius: 4px; border: 1px solid #e0e0e0; font-family: 'SimSun', '宋体', serif; font-size: 12px; line-height: 1.5; color: #333;">
                    <div style="white-space: pre-line;">${dayunData.rawText}</div>
                </div>
            </details>
        </div>
    `;
    
    return container;
}

// ============ 【创建简化的大运表格 - 完整干支】 ============
function createSimpleDayunTable(years, ganzhi, isPartner = false) {
    const color = isPartner ? '#FF69B4' : '#3a7bd5';
    const bgColor = isPartner ? '#fff5f5' : '#f0f8ff';
    
    let tableHTML = `
        <div class="dayun-simple-table" style="min-width: 600px;">
            <!-- 标题行 -->
            <div class="dayun-row" style="display: flex; margin-bottom: 10px; background: ${bgColor}; border-radius: 6px; padding: 12px;">
                <div class="dayun-label" style="width: 80px; font-weight: bold; color: ${color}; display: flex; align-items: center; justify-content: center; font-family: 'SimSun', '宋体', serif; font-size: 16px;">
                    大运
                </div>
    `;
    
    // 添加步数标题
    for (let i = 0; i < 8; i++) {
        tableHTML += `
            <div class="dayun-cell" style="flex: 1; text-align: center; padding: 8px 4px; border-right: 1px solid ${isPartner ? '#ffc1cc' : '#d1e9ff'}; min-width: 60px;">
                <div style="font-size: 14px; font-weight: bold; color: #333; font-family: 'SimSun', '宋体', serif;">第${i + 1}步</div>
            </div>
        `;
    }
    
    tableHTML += `
            </div>
            
            <!-- 岁行 -->
            <div class="dayun-row" style="display: flex; margin-bottom: 10px; background: white; border-radius: 6px; padding: 12px; border: 1px solid ${isPartner ? '#ffc1cc' : '#d1e9ff'};">
                <div class="dayun-label" style="width: 80px; font-weight: bold; color: ${color}; display: flex; align-items: center; justify-content: center; font-family: 'SimSun', '宋体', serif; font-size: 16px;">
                    岁
                </div>
    `;
    
    // 添加岁数据
    years.slice(0, 8).forEach((year, index) => {
        tableHTML += `
            <div class="dayun-cell" style="flex: 1; text-align: center; padding: 8px 4px; border-right: 1px solid ${isPartner ? '#ffc1cc' : '#d1e9ff'}; min-width: 60px;">
                <div style="font-size: 16px; font-weight: bold; color: #333; font-family: 'SimSun', '宋体', serif; height: 28px; line-height: 28px;">${year || ''}</div>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">${index === 0 ? '起运' : ''}</div>
            </div>
        `;
    });
    
    tableHTML += `
            </div>
            
            <!-- 干支行 -->
            <div class="dayun-row" style="display: flex; margin-bottom: 0; background: white; border-radius: 6px; padding: 12px; border: 1px solid ${isPartner ? '#ffc1cc' : '#d1e9ff'}; border-top: none;">
                <div class="dayun-label" style="width: 80px; font-weight: bold; color: ${color}; display: flex; align-items: center; justify-content: center; font-family: 'SimSun', '宋体', serif; font-size: 16px;">
                    干支
                </div>
    `;
    
    // 添加干支数据
    ganzhi.slice(0, 8).forEach((gz, index) => {
        tableHTML += `
            <div class="dayun-cell" style="flex: 1; text-align: center; padding: 8px 4px; border-right: 1px solid ${isPartner ? '#ffc1cc' : '#d1e9ff'}; min-width: 60px;">
                <div style="font-size: 20px; font-weight: bold; color: #333; font-family: 'SimSun', '宋体', serif; height: 32px; line-height: 32px;">${gz || ''}</div>
            </div>
        `;
    });
    
    tableHTML += `
            </div>
        </div>
    `;
    
    return tableHTML;
}

// 处理并显示分析结果
function processAndDisplayAnalysis(result) {
    console.log('处理分析结果...');
    
    const freeAnalysisText = UI.freeAnalysisText();
    const lockedAnalysisText = UI.lockedAnalysisText();
    
    if (!freeAnalysisText || !lockedAnalysisText) return;
    
    // 清空内容
    freeAnalysisText.innerHTML = '';
    lockedAnalysisText.innerHTML = '';
    
    // 定义免费部分
    const freeSections = [
        '【八字喜用分析】',
        '【性格特点】',
        '【适宜行业职业推荐】'
    ];
    
    // 根据当前服务动态调整免费内容
    const serviceConfig = SERVICES[STATE.currentService];
    
    // 按【分割内容
    const sections = result.split('【');
    
    let freeContent = '';
    let lockedContent = '';
    
    for (let i = 1; i < sections.length; i++) {
        const section = '【' + sections[i];
        const sectionTitle = section.split('】')[0] + '】';
        const sectionContent = section.replace(sectionTitle, '').trim();
        
        // 跳过八字排盘和大运排盘（已单独显示）
        if (sectionTitle === '【八字排盘】' || sectionTitle === '【大运排盘】') {
            continue;
        }
        
        // 判断是免费还是付费内容
        if (freeSections.includes(sectionTitle)) {
            freeContent += createAnalysisSection(sectionTitle, sectionContent);
        } else {
            lockedContent += createAnalysisSection(sectionTitle, sectionContent);
        }
    }
    
    // 显示免费内容
    if (freeContent.trim()) {
        freeAnalysisText.innerHTML = freeContent;
    } else {
        freeAnalysisText.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666; font-family: 'SimSun', '宋体', serif; font-size: 16px;">
                免费分析内容加载中...
            </div>
        `;
    }
    
    // 存储付费内容
    if (lockedContent.trim()) {
        lockedAnalysisText.innerHTML = lockedContent;
    }
    
    console.log('分析结果处理完成');
}

// 显示完整分析内容（支付后调用）
function showFullAnalysisContent() {
    const lockedAnalysisText = UI.lockedAnalysisText();
    const freeAnalysisText = UI.freeAnalysisText();
    
    if (lockedAnalysisText && lockedAnalysisText.innerHTML.trim() && freeAnalysisText) {
        // 将锁定内容添加到免费内容中
        const currentContent = freeAnalysisText.innerHTML;
        freeAnalysisText.innerHTML = currentContent + lockedAnalysisText.innerHTML;
        
        // 隐藏锁定覆盖层
        const lockedOverlay = document.getElementById('locked-overlay');
        if (lockedOverlay) {
            lockedOverlay.style.display = 'none';
        }
        
        console.log('✅ 完整内容已显示');
    }
}

// ============ 【支付弹窗相关函数】 ============

// 显示支付弹窗 - 支持支付宝和微信支付
async function showPaymentModal() {
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
        const frontendOrderId = 'RUNZ-FRONT-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

        console.log('🔗 调用支付API: https://runzang.top/api/payment/create');
        console.log('请求数据:', {
            serviceType: STATE.currentService,
            amount: parseFloat(serviceConfig.price).toFixed(2),
            frontendOrderId: frontendOrderId,
            paymentMethod: selectedMethod
        });

        const response = await fetch('https://runzang.top/api/payment/create', {
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
            // 保存订单信息
            STATE.currentOrderId = paymentData.outTradeNo;
            saveAnalysisData();
            
            // 直接跳转
            window.location.href = paymentData.paymentUrl;
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
                STATE.currentOrderId = paymentData.outTradeNo;
                saveAnalysisData();
                window.location.href = paymentData.paymentUrl;
            };
            
            paymentMethods.appendChild(payBtn);
        }
    }
}

// 保存分析数据
function saveAnalysisData() {
    if (STATE.fullAnalysisResult) {
        localStorage.setItem('last_analysis_result', STATE.fullAnalysisResult);
        localStorage.setItem('last_analysis_service', STATE.currentService);
        localStorage.setItem('last_user_data', JSON.stringify(STATE.userData || {}));
        localStorage.setItem('last_order_id', STATE.currentOrderId);
        console.log('分析结果已保存到 localStorage');
    }
}

// 关闭支付弹窗
function closePaymentModal() {
    const paymentModal = UI.paymentModal();
    if (paymentModal) {
        hideElement(paymentModal);
        document.body.style.overflow = 'auto';
    }
}

// ============ 【解锁界面相关函数】 ============

// 更新解锁界面状态
function updateUnlockInterface() {
    const lockedOverlay = DOM.id('locked-overlay');
    if (!lockedOverlay) return;
    
    // 更新标题
    const unlockHeader = lockedOverlay.querySelector('.unlock-header');
    if (unlockHeader) {
        const lockIcon = unlockHeader.querySelector('.lock-icon');
        const headerTitle = unlockHeader.querySelector('h4');
        const headerDesc = unlockHeader.querySelector('p');
        
        if (lockIcon) lockIcon.textContent = '✅';
        if (headerTitle) headerTitle.textContent = '完整报告已解锁';
        if (headerDesc) headerDesc.textContent = '您可以查看全部命理分析内容';
    }
    
    // 更新项目列表为已解锁状态
    const unlockItems = lockedOverlay.querySelectorAll('.unlock-items li');
    unlockItems.forEach(item => {
        item.classList.add('unlocked-item');
        const text = item.textContent.replace('🔒 ', '');
        item.innerHTML = '<span>✅ ' + text + '</span>';
    });
    
    // 更新解锁按钮
    const unlockBtnContainer = lockedOverlay.querySelector('.unlock-btn-container');
    if (unlockBtnContainer) {
        const unlockBtn = unlockBtnContainer.querySelector('.unlock-btn');
        const unlockPrice = unlockBtnContainer.querySelector('.unlock-price');
        
        if (unlockBtn) {
            unlockBtn.innerHTML = '✅ 已解锁完整报告';
            unlockBtn.style.background = 'linear-gradient(135deg, var(--success-color), #28c76f)';
            unlockBtn.style.cursor = 'default';
            unlockBtn.disabled = true;
        }
        
        if (unlockPrice) {
            unlockPrice.innerHTML = '<span style="color: var(--success-color);">✅ 已解锁全部内容</span>';
        }
    }
}

// 锁定下载按钮
function lockDownloadButton() {
    const downloadBtn = UI.downloadReportBtn();
    const downloadBtnText = DOM.id('download-btn-text');
    
    if (downloadBtn && downloadBtnText) {
        downloadBtn.disabled = true;
        downloadBtn.classList.add('download-btn-locked');
        downloadBtnText.textContent = '下载报告';
        STATE.isDownloadLocked = true;
        console.log('🔒 下载按钮已锁定');
    }
}

// 解锁下载按钮
function unlockDownloadButton() {
    const downloadBtn = UI.downloadReportBtn();
    const downloadBtnText = DOM.id('download-btn-text');
    
    if (downloadBtn && downloadBtnText) {
        console.log('🔓 开始解锁下载按钮...');
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('download-btn-locked');
        downloadBtnText.textContent = '下载报告';
        STATE.isDownloadLocked = false;
        
        // 添加视觉反馈
        downloadBtn.style.background = 'linear-gradient(135deg, var(--primary-color), #3a7bd5)';
        downloadBtn.style.boxShadow = '0 4px 15px rgba(58, 123, 213, 0.4)';
        
        console.log('✅ 下载按钮已解锁');
    } else {
        console.error('❌ 找不到下载按钮元素');
    }
}

// 重置解锁界面
function resetUnlockInterface() {
    console.log('resetUnlockInterface: 重置解锁界面');
    
    const lockedOverlay = DOM.id('locked-overlay');
    if (!lockedOverlay) return;
    
    // 重置标题
    const unlockHeader = lockedOverlay.querySelector('.unlock-header');
    if (unlockHeader) {
        const lockIcon = unlockHeader.querySelector('.lock-icon');
        const headerTitle = unlockHeader.querySelector('h4');
        const headerDesc = unlockHeader.querySelector('p');
        
        if (lockIcon) lockIcon.textContent = '🔒';
        if (headerTitle) headerTitle.textContent = '完整内容已锁定';
        if (headerDesc) headerDesc.textContent = '解锁完整分析报告，查看全部命理分析内容';
    }
    
    // 重置项目列表
    const unlockItemsList = UI.unlockItemsList();
    if (unlockItemsList) {
        unlockItemsList.innerHTML = '';
        const serviceConfig = SERVICES[STATE.currentService];
        if (serviceConfig) {
            serviceConfig.lockedItems.forEach(item => {
                const li = document.createElement('li');
                li.innerHTML = '<span>🔒 ' + item + '</span>';
                unlockItemsList.appendChild(li);
            });
        }
    }
    
    // 重置解锁按钮
    const unlockBtnContainer = lockedOverlay.querySelector('.unlock-btn-container');
    if (unlockBtnContainer) {
        const unlockBtn = unlockBtnContainer.querySelector('.unlock-btn');
        const unlockPrice = unlockBtnContainer.querySelector('.unlock-price');
        
        const serviceConfig = SERVICES[STATE.currentService];
        if (serviceConfig && unlockBtn && unlockPrice) {
            unlockBtn.innerHTML = `解锁完整报告 (¥<span id="unlock-price">${serviceConfig.price}</span>)`;
            unlockBtn.style.background = 'linear-gradient(135deg, var(--secondary-color), #e6b800)';
            unlockBtn.style.cursor = 'pointer';
            unlockBtn.disabled = false;
            
            const itemCount = serviceConfig.lockedItems.length;
            unlockPrice.innerHTML = `共包含 <span id="unlock-count">${itemCount}</span> 项详细分析`;
        }
    }
}

// ============ 【其他UI函数】 ============

// 按钮拉伸动画
function animateButtonStretch() {
    const button = UI.analyzeBtn();
    if (!button) return;
    
    // 添加拉伸动画类
    button.classList.add('stretching');
    
    // 动画结束后移除类并恢复初始状态
    setTimeout(() => {
        button.classList.remove('stretching');
        
        // 5秒后恢复原始宽度
        setTimeout(() => {
            button.style.width = '';
            button.style.maxWidth = '';
        }, 5000);
    }, 800);
}

// 显示加载弹窗（简洁版进度条）
function showLoadingModal() {
    const loadingModal = UI.loadingModal();
    if (loadingModal) {
        // 获取当前服务的分析步骤
        const steps = PROGRESS_STEPS[STATE.currentService] || PROGRESS_STEPS['测算验证'];
        
        loadingModal.innerHTML = `
            <div class="modal-content" style="text-align: center; padding: 40px 30px; max-width: 500px;">
                <div class="loading-header">
                    <div class="spinner" style="display: inline-block; margin-bottom: 25px;"></div>
                    <h3 style="color: var(--primary-color); margin-bottom: 8px; font-size: 22px;">润藏八字正在为您进行深度命理分析</h3>
                    <p style="color: #7d6e63; margin-bottom: 30px; font-size: 15px;">请耐心等待，不要关闭页面</p>
                </div>
                
                <!-- 当前项目进度 -->
                <div style="background: white; padding: 25px; border-radius: 12px; margin-bottom: 25px; box-shadow: 0 5px 15px rgba(0,0,0,0.05);">
                    <div id="current-step-title" style="font-size: 18px; font-weight: bold; color: var(--primary-color); margin-bottom: 20px; text-align: left;">
                        ${steps[0].title}
                    </div>
                    
                    <!-- 当前项目进度条 -->
                    <div style="width: 100%; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; position: relative;">
                        <div id="step-progress-bar" style="width: 0%; height: 100%; background: linear-gradient(90deg, var(--secondary-color), var(--primary-color)); border-radius: 4px; transition: width 0.5s ease;"></div>
                    </div>
                    
                    <!-- 进度指示器 -->
                    <div style="display: flex; justify-content: flex-start; gap: 8px; margin-top: 20px; flex-wrap: wrap;">
                        ${steps.map((_, index) => `
                            <div id="step-indicator-${index}" class="step-indicator" style="width: 10px; height: 10px; border-radius: 50%; background: #ddd; transition: all 0.3s ease;"></div>
                        `).join('')}
                    </div>
                </div>
                
                <!-- 下一个项目提示 -->
                <div style="text-align: left; padding: 15px; background: #f9f9f9; border-radius: 8px; margin-bottom: 25px;">
                    <div style="font-size: 14px; color: #666; margin-bottom: 5px;">下一个项目：</div>
                    <div id="next-step-title" style="font-size: 16px; color: var(--dark-color); font-weight: 500;">${steps.length > 1 ? steps[1].title : '完成分析'}</div>
                </div>
                
                <!-- 温馨提示 -->
                <div style="text-align: left; padding-top: 20px; border-top: 1px solid #eee;">
                    <div style="font-size: 13px; color: #999; line-height: 1.6;">
                        润藏八字正在为您进行深度命理分析，预计1-2分钟...
                    </div>
                </div>
            </div>
        `;
        
        showElement(loadingModal);
        document.body.style.overflow = 'hidden';
        
        // 开始进度动画
        startSimpleProgressAnimation(steps);
    }
}

// 开始简洁版进度动画
function startSimpleProgressAnimation(steps) {
    let currentStep = 0;
    const totalSteps = steps.length;
    let stepInterval;
    
    // 更新步骤指示器
    function updateStepIndicator(stepIndex, status) {
        const indicator = document.getElementById(`step-indicator-${stepIndex}`);
        if (!indicator) return;
        
        if (status === 'active') {
            indicator.style.background = 'var(--secondary-color)';
            indicator.style.boxShadow = '0 0 0 2px rgba(212, 175, 55, 0.2)';
            indicator.style.transform = 'scale(1.2)';
        } else if (status === 'completed') {
            indicator.style.background = '#4CAF50';
            indicator.style.boxShadow = 'none';
            indicator.style.transform = 'scale(1)';
        } else {
            indicator.style.background = '#ddd';
            indicator.style.boxShadow = 'none';
            indicator.style.transform = 'scale(1)';
        }
    }
    
    // 更新下一个项目提示
    function updateNextStepHint() {
        const nextStepTitle = document.getElementById('next-step-title');
        if (!nextStepTitle) return;
        
        if (currentStep + 1 < totalSteps) {
            nextStepTitle.textContent = steps[currentStep + 1].title;
        } else {
            nextStepTitle.textContent = '完成分析';
            nextStepTitle.style.color = '#4CAF50';
        }
    }
    
    // 开始当前步骤
    function startCurrentStep() {
        if (currentStep >= totalSteps) {
            // 所有步骤完成
            completeAllSteps();
            return;
        }
        
        // 更新当前项目标题
        const currentTitle = document.getElementById('current-step-title');
        if (currentTitle) {
            currentTitle.textContent = steps[currentStep].title;
        }
        
        // 更新步骤指示器
        updateStepIndicator(currentStep, 'active');
        
        // 重置进度条
        const progressBar = document.getElementById('step-progress-bar');
        if (progressBar) {
            progressBar.style.width = '0%';
        }
        
        // 开始进度条动画
        let progress = 0;
        const stepDuration = steps[currentStep].time * 1000;
        const updateInterval = 50; // 每50毫秒更新一次
        
        clearInterval(stepInterval);
        
        stepInterval = setInterval(() => {
            const elapsed = Date.now() - stepStartTime;
            progress = Math.min(100, (elapsed / stepDuration) * 100);
            
            // 更新进度条
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            // 如果步骤完成
            if (progress >= 100) {
                clearInterval(stepInterval);
                
                // 标记当前步骤为完成
                updateStepIndicator(currentStep, 'completed');
                
                // 等待300毫秒后开始下一步
                setTimeout(() => {
                    currentStep++;
                    updateNextStepHint();
                    
                    if (currentStep < totalSteps) {
                        stepStartTime = Date.now();
                        startCurrentStep();
                    } else {
                        completeAllSteps();
                    }
                }, 300);
            }
        }, updateInterval);
    }
    
    // 完成所有步骤
    function completeAllSteps() {
        clearInterval(stepInterval);
        
        // 更新UI为完成状态
        const currentTitle = document.getElementById('current-step-title');
        const progressBar = document.getElementById('step-progress-bar');
        const nextTitle = document.getElementById('next-step-title');
        
        if (currentTitle) {
            currentTitle.textContent = '✓ 分析完成';
            currentTitle.style.color = '#4CAF50';
        }
        
        if (progressBar) {
            progressBar.style.background = '#4CAF50';
            progressBar.style.width = '100%';
        }
        
        if (nextTitle) {
            nextTitle.textContent = '正在生成报告...';
            nextTitle.style.color = '#4CAF50';
        }
        
        // 更新所有指示器为完成状态
        for (let i = 0; i < totalSteps; i++) {
            updateStepIndicator(i, 'completed');
        }
    }
    
    // 开始计时
    let stepStartTime = Date.now();
    
    // 更新下一个项目提示
    updateNextStepHint();
    
    // 开始第一个步骤
    startCurrentStep();
    
    // 保存到全局，以便清理
    window.simpleProgress = {
        clear: () => clearInterval(stepInterval)
    };
}

// 强制完成进度条（当分析结果提前返回时调用）
function forceCompleteProgressBar() {
    // 清理进度动画
    if (window.simpleProgress) {
        window.simpleProgress.clear();
        delete window.simpleProgress;
    }
    
    // 立即更新UI为完成状态
    const currentTitle = document.getElementById('current-step-title');
    const progressBar = document.getElementById('step-progress-bar');
    const nextTitle = document.getElementById('next-step-title');
    
    if (currentTitle) {
        currentTitle.textContent = '✓ 分析完成';
        currentTitle.style.color = '#4CAF50';
    }
    
    if (progressBar) {
        progressBar.style.background = '#4CAF50';
        progressBar.style.width = '100%';
    }
    
    if (nextTitle) {
        nextTitle.textContent = '正在显示报告...';
        nextTitle.style.color = '#4CAF50';
    }
    
    // 更新所有指示器为完成状态
    const totalIndicators = document.querySelectorAll('.step-indicator').length;
    for (let i = 0; i < totalIndicators; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        if (indicator) {
            indicator.style.background = '#4CAF50';
            indicator.style.boxShadow = 'none';
            indicator.style.transform = 'scale(1)';
        }
    }
    
    // 等待500毫秒后自动关闭（给用户看到完成状态）
    setTimeout(() => {
        hideLoadingModal();
    }, 500);
}

// 更新进度条
function updateProgressBar(percentage) {
    const progressFill = document.getElementById('progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = percentage + '%';
    }
}

// 隐藏加载弹窗（清理进度动画）
function hideLoadingModal() {
    const loadingModal = UI.loadingModal();
    if (loadingModal) {
        // 清理进度动画
        if (window.simpleProgress) {
            window.simpleProgress.clear();
            delete window.simpleProgress;
        }
        
        // 设置一个标记，防止重复调用
        if (window.loadingModalHiding) return;
        window.loadingModalHiding = true;
        
        // 立即隐藏（不需要等待，因为forceCompleteProgressBar已经给了延迟）
        hideElement(loadingModal);
        document.body.style.overflow = 'auto';
        
        // 清除标记
        setTimeout(() => {
            delete window.loadingModalHiding;
        }, 100);
    }
}

// 显示分析结果区域
function showAnalysisResult() {
    const analysisResultSection = UI.analysisResultSection();
    if (analysisResultSection) {
        showElement(analysisResultSection);
        
        // 设置分析时间
        UI.analysisTime().textContent = formatDate();
        
        // 滚动到结果区域
        analysisResultSection.scrollIntoView({ behavior: 'smooth' });
    }
}

// 隐藏分析结果区域
function hideAnalysisResult() {
    const analysisResultSection = UI.analysisResultSection();
    if (analysisResultSection) {
        hideElement(analysisResultSection);
    }
}

// 重置表单错误状态
function resetFormErrors() {
    DOM.getAll('.error').forEach(error => {
        error.style.display = 'none';
    });
}

// 验证表单
function validateForm() {
    console.log('验证表单...');
    let isValid = true;
    
    // 重置错误信息
    resetFormErrors();
    
    // 验证函数
    const validateField = (fieldId, errorId) => {
        const field = DOM.id(fieldId);
        const error = DOM.id(errorId);
        
        if (!field || !error) return true;
        
        if (!field.value || field.value.trim() === '') {
            error.style.display = 'block';
            return false;
        }
        
        return true;
    };
    
    // 验证必填字段
    if (!validateField('name', 'name-error')) isValid = false;
    if (!validateField('gender', 'gender-error')) isValid = false;
    if (!validateField('birth-year', 'birth-year-error')) isValid = false;
    if (!validateField('birth-month', 'birth-month-error')) isValid = false;
    if (!validateField('birth-day', 'birth-day-error')) isValid = false;
    if (!validateField('birth-hour', 'birth-hour-error')) isValid = false;
    if (!validateField('birth-minute', 'birth-minute-error')) isValid = false;
    if (!validateField('birth-city', 'birth-city-error')) isValid = false;
    
    // 如果是八字合婚，验证伴侣信息
    if (STATE.currentService === '八字合婚') {
        if (!validateField('partner-name', 'partner-name-error')) isValid = false;
        if (!validateField('partner-gender', 'partner-gender-error')) isValid = false;
        if (!validateField('partner-birth-year', 'partner-birth-year-error')) isValid = false;
        if (!validateField('partner-birth-month', 'partner-birth-month-error')) isValid = false;
        if (!validateField('partner-birth-day', 'partner-birth-day-error')) isValid = false;
        if (!validateField('partner-birth-hour', 'partner-birth-hour-error')) isValid = false;
        if (!validateField('partner-birth-minute', 'partner-birth-minute-error')) isValid = false;
        if (!validateField('partner-birth-city', 'partner-birth-city-error')) isValid = false;
    }
    
    return isValid;
}

// 收集用户数据
function collectUserData() {
    STATE.userData = {
        name: UI.name().value,
        gender: UI.gender().value === 'male' ? '男' : '女',
        birthYear: UI.birthYear().value,
        birthMonth: UI.birthMonth().value,
        birthDay: UI.birthDay().value,
        birthHour: UI.birthHour().value,
        birthMinute: UI.birthMinute().value,
        birthCity: UI.birthCity().value
    };
    
    // 如果是八字合婚，收集伴侣数据
    if (STATE.currentService === '八字合婚') {
        STATE.partnerData = {
            partnerName: UI.partnerName().value,
            partnerGender: UI.partnerGender().value === 'male' ? '男' : '女',
            partnerBirthYear: UI.partnerBirthYear().value,
            partnerBirthMonth: UI.partnerBirthMonth().value,
            partnerBirthDay: UI.partnerBirthDay().value,
            partnerBirthHour: UI.partnerBirthHour().value,
            partnerBirthMinute: UI.partnerBirthMinute().value,
            partnerBirthCity: UI.partnerBirthCity().value
        };
    }
}

// ============ 【统一导出】 ============
export {
    UI,
    initFormOptions,
    setDefaultValues,
    updateServiceDisplay,
    updateUnlockInfo,
    displayPredictorInfo,
    displayBaziPan,
    displayDayunPan,
    processAndDisplayAnalysis,
    showFullAnalysisContent,
    showPaymentModal,
    closePaymentModal,
    updateUnlockInterface,
    lockDownloadButton,
    unlockDownloadButton,
    resetUnlockInterface,
    animateButtonStretch,
    showLoadingModal,
    hideLoadingModal,
    showAnalysisResult,
    hideAnalysisResult,
    validateForm,
    collectUserData,
    resetFormErrors
};





