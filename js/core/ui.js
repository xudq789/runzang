// UI控制模块
'use strict';

import { DOM, formatDate, hideElement, showElement, generateOrderId, calculateBazi } from './utils.js';
import { SERVICES, STATE, PAYMENT_CONFIG } from './config.js';

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
    
    // 支付弹窗
    paymentServiceType: () => DOM.id('payment-service-type'),
    paymentAmount: () => DOM.id('payment-amount'),
    paymentOrderId: () => DOM.id('payment-order-id')
};

// 初始化表单选项
export function initFormOptions() {
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
export function setDefaultValues() {
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
export function updateServiceDisplay(serviceName) {
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
export function updateUnlockInfo() {
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
export function displayPredictorInfo() {
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

// ============ 【优化版八字排盘显示函数】 ============

// 显示八字排盘结果 - 优化版（解决闪烁问题）
export function displayBaziPan() {
    const baziGrid = UI.baziGrid();
    if (!baziGrid) return;
    
    // 防止闪烁：先清空并显示加载状态
    baziGrid.innerHTML = `
        <div class="loading-bazi" style="
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 200px; 
            color: var(--primary-color); 
            font-size: 16px; 
            font-weight: 500;">
            <div style="display: flex; align-items: center; gap: 10px;">
                <div class="spinner" style="width: 20px; height: 20px; border: 3px solid rgba(212, 175, 55, 0.2); border-top-color: var(--secondary-color); border-radius: 50%; animation: spin 1s ease-in-out infinite;"></div>
                <span>正在排盘...</span>
            </div>
        </div>
    `;
    
    // 延迟一点确保数据完整，然后更新显示
    setTimeout(() => {
        updateBaziDisplay();
    }, 300);
}

// 更新八字显示函数
function updateBaziDisplay() {
    const baziGrid = UI.baziGrid();
    if (!baziGrid) return;
    
    // 清空内容
    baziGrid.innerHTML = '';
    
    // 如果是八字合婚服务
    if (STATE.currentService === '八字合婚' && STATE.partnerData) {
        createHehunBaziDisplay();
    } else {
        createSingleBaziDisplay();
    }
}

// 创建合婚八字显示 - ✅ 修复：处理伴侣八字数据
function createHehunBaziDisplay() {
    const baziGrid = UI.baziGrid();
    
    // 确保伴侣八字数据存在
    let partnerBaziData = STATE.partnerBaziData;
    if (!partnerBaziData && STATE.partnerData) {
        // 从分析结果中提取伴侣八字，如果没有则使用备用计算
        partnerBaziData = extractPartnerBaziFromResult() || calculatePartnerBaziData();
    }
    
    // 创建用户八字区域
    const userSection = createBaziCard(
        `${STATE.userData.name} 的八字排盘`,
        STATE.baziData,
        true
    );
    
    // 创建伴侣八字区域
    const partnerSection = createBaziCard(
        `${STATE.partnerData.partnerName} 的八字排盘`,
        partnerBaziData,
        true
    );
    
    // 保存伴侣八字数据
    if (partnerBaziData) {
        STATE.partnerBaziData = partnerBaziData;
    }
    
    // 使用平滑过渡
    baziGrid.style.opacity = '0';
    baziGrid.innerHTML = '';
    baziGrid.appendChild(userSection);
    
    // 添加分隔线
    const separator = document.createElement('div');
    separator.className = 'bazi-separator';
    separator.style.cssText = `
        height: 2px;
        background: linear-gradient(to right, transparent, var(--secondary-color), transparent);
        margin: 25px 10px;
        border-radius: 1px;
    `;
    baziGrid.appendChild(separator);
    
    baziGrid.appendChild(partnerSection);
    
    // 淡入效果
    setTimeout(() => {
        baziGrid.style.transition = 'opacity 0.5s ease';
        baziGrid.style.opacity = '1';
    }, 50);
}

// 从分析结果中提取伴侣八字数据 - ✅ 新增函数
function extractPartnerBaziFromResult() {
    if (!STATE.fullAnalysisResult) return null;
    
    const result = {
        yearColumn: '',
        yearElement: '',
        monthColumn: '',
        monthElement: '',
        dayColumn: '',
        dayElement: '',
        hourColumn: '',
        hourElement: ''
    };
    
    // 查找伴侣八字排盘部分
    const partnerBaziMatch = STATE.fullAnalysisResult.match(/【伴侣八字排盘】([\s\S]*?)(?=【|$)/);
    if (!partnerBaziMatch) return null;
    
    const baziText = partnerBaziMatch[1];
    const lines = baziText.split('\n');
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes('年柱')) {
            const match = trimmedLine.match(/年柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                result.yearColumn = match[1] || '';
                result.yearElement = match[2] || '';
            }
        } else if (trimmedLine.includes('月柱')) {
            const match = trimmedLine.match(/月柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                result.monthColumn = match[1] || '';
                result.monthElement = match[2] || '';
            }
        } else if (trimmedLine.includes('日柱')) {
            const match = trimmedLine.match(/日柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                result.dayColumn = match[1] || '';
                result.dayElement = match[2] || '';
            }
        } else if (trimmedLine.includes('时柱')) {
            const match = trimmedLine.match(/时柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                result.hourColumn = match[1] || '';
                result.hourElement = match[2] || '';
            }
        }
    });
    
    // 检查是否所有字段都有值
    if (result.yearColumn && result.monthColumn && result.dayColumn && result.hourColumn) {
        return result;
    }
    
    return null;
}

// 创建单个八字显示
function createSingleBaziDisplay() {
    const baziGrid = UI.baziGrid();
    const baziDataToDisplay = STATE.baziData;
    
    if (!baziDataToDisplay) {
        baziGrid.innerHTML = '<div style="text-align:center;padding:40px;color:#666;">八字数据未找到</div>';
        return;
    }
    
    const baziCard = createBaziCard('八字排盘', baziDataToDisplay, false);
    
    // 使用平滑过渡
    baziGrid.style.opacity = '0';
    baziGrid.innerHTML = '';
    baziGrid.appendChild(baziCard);
    
    // 淡入效果
    setTimeout(() => {
        baziGrid.style.transition = 'opacity 0.5s ease';
        baziGrid.style.opacity = '1';
    }, 50);
}

// 创建八字卡片（统一格式）
function createBaziCard(title, baziData, showTitle = true) {
    const card = document.createElement('div');
    card.className = 'bazi-card';
    card.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 25px;
        margin-bottom: 20px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.08);
        border: 1px solid var(--border-color);
        transition: all 0.3s ease;
        overflow: hidden;
    `;
    
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-5px)';
        card.style.boxShadow = '0 15px 35px rgba(0,0,0,0.1)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.08)';
    });
    
    // 添加标题
    if (showTitle) {
        const titleElement = document.createElement('div');
        titleElement.className = 'bazi-title';
        titleElement.style.cssText = `
            color: var(--primary-color);
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            text-align: center;
            position: relative;
            padding-bottom: 12px;
        `;
        
        titleElement.innerHTML = `
            ${title}
            <div style="position: absolute; bottom: 0; left: 50%; transform: translateX(-50%); 
                width: 80px; height: 3px; background: linear-gradient(to right, var(--primary-color), var(--secondary-color)); 
                border-radius: 2px;"></div>
        `;
        card.appendChild(titleElement);
    }
    
    // 创建八字网格
    const baziGridContainer = document.createElement('div');
    baziGridContainer.className = 'bazi-grid-container';
    baziGridContainer.style.cssText = `
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 15px;
    `;
    
    // 四柱数据
    const columns = [
        { label: '年柱', value: baziData.yearColumn, element: baziData.yearElement, color: '#8b4513' },
        { label: '月柱', value: baziData.monthColumn, element: baziData.monthElement, color: '#d4af37' },
        { label: '日柱', value: baziData.dayColumn, element: baziData.dayElement, color: '#5c3d2e' },
        { label: '时柱', value: baziData.hourColumn, element: baziData.hourElement, color: '#3a2c1e' }
    ];
    
    columns.forEach(col => {
        const columnDiv = document.createElement('div');
        columnDiv.className = 'bazi-column-item';
        columnDiv.style.cssText = `
            background: linear-gradient(135deg, #f9f5f0, #f0e6d6);
            border: 2px solid ${col.color};
            border-radius: 12px;
            padding: 20px 15px;
            text-align: center;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        `;
        
        columnDiv.addEventListener('mouseenter', () => {
            columnDiv.style.transform = 'translateY(-3px)';
            columnDiv.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
        });
        
        columnDiv.addEventListener('mouseleave', () => {
            columnDiv.style.transform = 'translateY(0)';
            columnDiv.style.boxShadow = 'none';
        });
        
        // 添加装饰线
        const topLine = document.createElement('div');
        topLine.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(to right, ${col.color}, var(--secondary-color));
            border-radius: 2px;
        `;
        columnDiv.appendChild(topLine);
        
        // 标签
        const labelDiv = document.createElement('div');
        labelDiv.className = 'bazi-label';
        labelDiv.style.cssText = `
            color: ${col.color};
            font-weight: 700;
            margin-bottom: 12px;
            font-size: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
        `;
        labelDiv.textContent = col.label;
        
        // 值
        const valueDiv = document.createElement('div');
        valueDiv.className = 'bazi-value';
        valueDiv.style.cssText = `
            font-size: 28px;
            font-weight: bold;
            color: var(--dark-color);
            margin-bottom: 8px;
            font-family: 'SimSun', '宋体', serif;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        `;
        valueDiv.textContent = col.value;
        
        // 五行
        const elementDiv = document.createElement('div');
        elementDiv.className = 'bazi-element';
        elementDiv.style.cssText = `
            font-size: 14px;
            color: #7d6e63;
            font-style: italic;
            opacity: 0.9;
            padding: 4px 10px;
            background: rgba(255,255,255,0.7);
            border-radius: 20px;
            display: inline-block;
        `;
        elementDiv.textContent = col.element || '';
        
        columnDiv.appendChild(labelDiv);
        columnDiv.appendChild(valueDiv);
        columnDiv.appendChild(elementDiv);
        baziGridContainer.appendChild(columnDiv);
    });
    
    card.appendChild(baziGridContainer);
    
    return card;
}

// 计算伴侣八字数据
function calculatePartnerBaziData() {
    if (!STATE.partnerData) return null;
    
    // 使用相同的计算函数
    const partnerDataForCalc = {
        birthYear: STATE.partnerData.partnerBirthYear,
        birthMonth: STATE.partnerData.partnerBirthMonth,
        birthDay: STATE.partnerData.partnerBirthDay,
        birthHour: STATE.partnerData.partnerBirthHour,
        birthMinute: STATE.partnerData.partnerBirthMinute
    };
    
    return calculateBazi(partnerDataForCalc);
}

// 处理并显示分析结果 - 优化版
export function processAndDisplayAnalysis(result) {
    console.log('处理分析结果...');
    
    const freeSections = [
        '【八字排盘】',
        '【大运排盘】',
        '【八字喜用分析】',
        '【性格特点】',
        '【适宜行业职业推荐】'
    ];
    
    let freeContent = '';
    let lockedContent = '';
    
    // 按【分割内容
    const sections = result.split('【');
    
    for (let i = 1; i < sections.length; i++) {
        const section = '【' + sections[i];
        const sectionTitle = section.split('】')[0] + '】';
        
        // 八字排盘已经单独显示，跳过
        if (sectionTitle === '【八字排盘】' || sectionTitle === '【大运排盘】') {
            continue;
        }
        
        if (freeSections.includes(sectionTitle)) {
            freeContent += section + '\n\n';
        } else {
            lockedContent += section + '\n\n';
        }
    }
    
    // 如果分割不理想，使用简单的方法
    if (freeContent.length < 100) {
        freeContent = '';
        for (const freeSection of freeSections) {
            const startIndex = result.indexOf(freeSection);
            if (startIndex !== -1) {
                let endIndex = result.indexOf('【', startIndex + 1);
                if (endIndex === -1) {
                    endIndex = result.length;
                }
                freeContent += result.substring(startIndex, endIndex) + '\n\n';
            }
        }
        
        if (freeContent) {
            lockedContent = result.replace(freeContent, '');
        }
    }
    
    // 格式化并显示免费内容
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) {
        const formattedContent = formatAnalysisContent(freeContent, 'free');
        freeAnalysisText.innerHTML = formattedContent;
    }
    
    // 存储锁定内容
    const lockedAnalysisText = UI.lockedAnalysisText();
    if (lockedAnalysisText) {
        const formattedLockedContent = formatAnalysisContent(lockedContent, 'locked');
        lockedAnalysisText.innerHTML = formattedLockedContent;
    }
    
    // 显示大运排盘
    displayDayunPan();
}

// 格式化分析内容 - 新增函数
function formatAnalysisContent(content, type = 'free') {
    if (!content.trim()) return '';
    
    let formattedContent = '';
    const sections = content.split('\n\n').filter(s => s.trim());
    
    sections.forEach(section => {
        if (section.trim()) {
            // 提取标题
            const titleMatch = section.match(/【([^】]+)】/);
            if (titleMatch) {
                const title = titleMatch[1];
                const contentText = section.replace(titleMatch[0], '').trim();
                
                // 格式化内容文本
                const formattedText = formatTextContent(contentText);
                
                formattedContent += `
                <div class="analysis-section ${type}-section">
                    <h5>${title}</h5>
                    <div class="analysis-content">
                        ${formattedText}
                    </div>
                </div>`;
            } else {
                // 没有标题的内容
                const formattedText = formatTextContent(section);
                formattedContent += `<div class="analysis-content">${formattedText}</div>`;
            }
        }
    });
    
    return formattedContent;
}

// 格式化文本内容 - 新增函数
function formatTextContent(text) {
    if (!text) return '';
    
    // 按段落分割
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
    
    let formatted = '';
    
    paragraphs.forEach(paragraph => {
        const lines = paragraph.split('\n').filter(line => line.trim());
        
        if (lines.length === 1) {
            // 单行：可能是标题或短段落
            const trimmed = lines[0].trim();
            if (trimmed.endsWith('：') || trimmed.length < 50) {
                formatted += `<h6>${trimmed}</h6>`;
            } else {
                formatted += `<p>${trimmed}</p>`;
            }
        } else {
            // 多行：可能是列表或段落组
            let isList = lines.every(line => 
                line.trim().match(/^[•·●◦○▪▫►◄►◄▶◀※§¶]/) || 
                line.trim().match(/^\d+[\.、]/) ||
                line.trim().match(/^[一二三四五六七八九十]+[、.]/)
            );
            
            if (isList) {
                formatted += '<ul>';
                lines.forEach(line => {
                    const cleanLine = line.trim().replace(/^[•·●◦○▪▫►◄►◄▶◀※§¶\d+[\.、一二三四五六七八九十]+[、.]]\s*/, '');
                    formatted += `<li>${cleanLine}</li>`;
                });
                formatted += '</ul>';
            } else {
                lines.forEach(line => {
                    const trimmed = line.trim();
                    if (trimmed) {
                        // 检测关键词并加粗
                        const highlighted = highlightKeywords(trimmed);
                        formatted += `<p>${highlighted}</p>`;
                    }
                });
            }
        }
    });
    
    return formatted;
}

// 高亮关键词 - 新增函数
function highlightKeywords(text) {
    if (!text) return text;
    
    // 1. 高亮专业术语
    const terms = {
        // 格局
        '偏印格': '<span class="keyword-highlight">偏印格</span>',
        '正官格': '<span class="keyword-highlight">正官格</span>',
        '七杀格': '<span class="keyword-highlight">七杀格</span>',
        '正财格': '<span class="keyword-highlight">正财格</span>',
        '偏财格': '<span class="keyword-highlight">偏财格</span>',
        '食神格': '<span class="keyword-highlight">食神格</span>',
        '伤官格': '<span class="keyword-highlight">伤官格</span>',
        
        // 十神
        '比肩': '<span class="keyword-highlight">比肩</span>',
        '劫财': '<span class="keyword-highlight">劫财</span>',
        '食神': '<span class="keyword-highlight">食神</span>',
        '伤官': '<span class="keyword-highlight">伤官</span>',
        '正财': '<span class="keyword-highlight">正财</span>',
        '偏财': '<span class="keyword-highlight">偏财</span>',
        '正官': '<span class="keyword-highlight">正官</span>',
        '七杀': '<span class="keyword-highlight">七杀</span>',
        '正印': '<span class="keyword-highlight">正印</span>',
        '偏印': '<span class="keyword-highlight">偏印</span>',
        
        // 五行
        '金': '<span class="keyword-highlight">金</span>',
        '木': '<span class="keyword-highlight">木</span>',
        '水': '<span class="keyword-highlight">水</span>',
        '火': '<span class="keyword-highlight">火</span>',
        '土': '<span class="keyword-highlight">土</span>',
        
        // 重要概念
        '用神': '<span class="keyword-highlight">用神</span>',
        '喜神': '<span class="keyword-highlight">喜神</span>',
        '忌神': '<span class="keyword-highlight">忌神</span>',
        '闲神': '<span class="keyword-highlight">闲神</span>',
        '身强': '<span class="keyword-highlight">身强</span>',
        '身弱': '<span class="keyword-highlight">身弱</span>',
        '中和': '<span class="keyword-highlight">中和</span>',
        '调候': '<span class="keyword-highlight">调候</span>',
        '通关': '<span class="keyword-highlight">通关</span>',
        '扶抑': '<span class="keyword-highlight">扶抑</span>',
        
        // 重要结论词汇
        '富贵': '<span class="keyword-highlight" style="color:#d90000;">富贵</span>',
        '财运': '<span class="keyword-highlight" style="color:#d90000;">财运</span>',
        '事业': '<span class="keyword-highlight" style="color:#d90000;">事业</span>',
        '婚姻': '<span class="keyword-highlight" style="color:#d90000;">婚姻</span>',
        '感情': '<span class="keyword-highlight" style="color:#d90000;">感情</span>',
        '健康': '<span class="keyword-highlight" style="color:#d90000;">健康</span>',
        '贵人': '<span class="keyword-highlight" style="color:#d90000;">贵人</span>',
        '机遇': '<span class="keyword-highlight" style="color:#d90000;">机遇</span>',
        '挑战': '<span class="keyword-highlight" style="color:#d90000;">挑战</span>',
        '注意': '<span class="keyword-highlight" style="color:#ff6600;">注意</span>',
        '建议': '<span class="keyword-highlight" style="color:#ff6600;">建议</span>',
        '重要': '<span class="keyword-highlight" style="color:#ff6600;">重要</span>',
        '关键': '<span class="keyword-highlight" style="color:#ff6600;">关键</span>',
        '转折点': '<span class="keyword-highlight" style="color:#ff6600;">转折点</span>',
        '优势': '<span class="keyword-highlight" style="color:#009900;">优势</span>',
        '劣势': '<span class="keyword-highlight" style="color:#cc0000;">劣势</span>',
        '适合': '<span class="keyword-highlight" style="color:#009900;">适合</span>',
        '不宜': '<span class="keyword-highlight" style="color:#cc0000;">不宜</span>'
    };
    
    let highlightedText = text;
    
    // 替换专业术语
    Object.keys(terms).forEach(term => {
        const regex = new RegExp(term, 'g');
        highlightedText = highlightedText.replace(regex, terms[term]);
    });
    
    // 高亮年份（四位数年份）
    highlightedText = highlightedText.replace(/(\d{4})年/g, '<span class="year-highlight">$1年</span>');
    
    // 高亮年龄（数字+岁）
    highlightedText = highlightedText.replace(/(\d{1,2})岁/g, '<span class="age-highlight">$1岁</span>');
    
    // 高亮大运（如：7-16岁、壬子运）
    highlightedText = highlightedText.replace(/(\d{1,2})-(\d{1,2})岁/g, '<span class="keyword-highlight">$1-$2岁</span>');
    highlightedText = highlightedText.replace(/([甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥])运/g, '<span class="keyword-highlight">$1运</span>');
    
    return highlightedText;
}

// 显示完整分析内容 - ✅ 优化版
export function showFullAnalysisContent() {
    const lockedAnalysisText = UI.lockedAnalysisText();
    const freeAnalysisText = UI.freeAnalysisText();
    
    if (lockedAnalysisText && lockedAnalysisText.innerHTML.trim() && freeAnalysisText) {
        // 获取锁定内容并格式化
        const lockedContent = lockedAnalysisText.innerHTML;
        
        // 使用平滑过渡
        freeAnalysisText.style.opacity = '0.8';
        freeAnalysisText.style.transition = 'opacity 0.5s ease';
        
        // 添加锁定内容
        setTimeout(() => {
            freeAnalysisText.innerHTML += lockedContent;
            freeAnalysisText.style.opacity = '1';
            
            // 触发动画
            setTimeout(() => {
                const newSections = freeAnalysisText.querySelectorAll('.locked-section, .analysis-section:not(.free-section)');
                newSections.forEach((section, index) => {
                    section.style.animationDelay = `${index * 0.1}s`;
                    section.classList.add('animated');
                    // 添加悬停效果
                    section.style.cursor = 'pointer';
                    section.onmouseover = function() {
                        this.style.transform = 'translateY(-3px)';
                        this.style.boxShadow = '0 8px 20px rgba(0,0,0,0.08)';
                    };
                    section.onmouseout = function() {
                        this.style.transform = 'translateY(0)';
                        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
                    };
                });
            }, 100);
        }, 300);
    }
}

// ============ 【完整版】支付弹窗 - 支持支付宝和微信支付 ============
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
        const frontendOrderId = 'RUNZ-FRONT-' + Date.now() + '-' + Math.floor(Math.random() * 10000);

        console.log('🔗 调用支付API: http://runzang.top/api/payment/create');
        console.log('请求数据:', {
            serviceType: STATE.currentService,
            amount: parseFloat(serviceConfig.price).toFixed(2),
            frontendOrderId: frontendOrderId,
            paymentMethod: selectedMethod
        });

        const response = await fetch('https://runzang.top/api/payment/create', {
            method: 'POST',
            mode: 'cors',  // 添加CORS模式
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

// ============ 【修改后】支付方式选择弹窗 - 移除手动选择 ============
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

// ============ 【修改后】显示支付界面 ============
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

// ============ 保存分析数据 ============
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
export function closePaymentModal() {
    const paymentModal = UI.paymentModal();
    if (paymentModal) {
        hideElement(paymentModal);
        document.body.style.overflow = 'auto';
    }
}

// 更新解锁界面状态
export function updateUnlockInterface() {
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
export function lockDownloadButton() {
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

// 解锁下载按钮 - ✅ 修复1：确保能正确解锁
export function unlockDownloadButton() {
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

// 重置解锁界面 - ✅ 修复2：确保切换服务时正确重置
export function resetUnlockInterface() {
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

// 按钮拉伸动画
export function animateButtonStretch() {
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

// 显示加载弹窗
export function showLoadingModal() {
    const loadingModal = UI.loadingModal();
    if (loadingModal) {
        showElement(loadingModal);
        document.body.style.overflow = 'hidden';
    }
}

// 隐藏加载弹窗
export function hideLoadingModal() {
    const loadingModal = UI.loadingModal();
    if (loadingModal) {
        hideElement(loadingModal);
        document.body.style.overflow = 'auto';
    }
}

// 显示分析结果区域
export function showAnalysisResult() {
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
export function hideAnalysisResult() {
    const analysisResultSection = UI.analysisResultSection();
    if (analysisResultSection) {
        hideElement(analysisResultSection);
    }
}

// 重置表单错误状态
export function resetFormErrors() {
    DOM.getAll('.error').forEach(error => {
        error.style.display = 'none';
    });
}

// 验证表单
export function validateForm() {
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
export function collectUserData() {
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

// 显示大运排盘 - ✅ 修复：正确提取和显示大运信息
export function displayDayunPan() {
    console.log('显示大运排盘...');
    
    // 创建或获取大运排盘卡片
    let dayunPanCard = document.querySelector('.dayun-pan-card');
    if (!dayunPanCard) {
        // 创建大运排盘卡片
        dayunPanCard = document.createElement('div');
        dayunPanCard.className = 'dayun-pan-card';
        dayunPanCard.style.cssText = `
            display: none;
            background: linear-gradient(135deg, #f0f5ff, #e6ecff);
            border: 2px solid #3a7bd5;
            border-radius: 12px;
            padding: 25px;
            margin: 25px 0;
            animation: fadeInUp 0.8s ease-out;
        `;
        
        // 找到八字排盘卡片之后插入大运排盘
        const baziPanCard = document.querySelector('.bazi-pan-card');
        if (baziPanCard && baziPanCard.parentNode) {
            baziPanCard.parentNode.insertBefore(dayunPanCard, baziPanCard.nextSibling);
        }
    }
    
    // 尝试从分析结果中提取大运信息
    if (STATE.fullAnalysisResult && STATE.fullAnalysisResult.includes('【大运排盘】')) {
        console.log('找到大运排盘信息');
        
        const startIndex = STATE.fullAnalysisResult.indexOf('【大运排盘】');
        let endIndex = STATE.fullAnalysisResult.indexOf('【', startIndex + 1);
        if (endIndex === -1) endIndex = STATE.fullAnalysisResult.length;
        
        const dayunContent = STATE.fullAnalysisResult.substring(startIndex, endIndex);
        
        // 解析大运内容
        const lines = dayunContent.split('\n').filter(line => line.trim());
        let htmlContent = '';
        let hasDayunData = false;
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.includes('起运岁数：') || trimmedLine.includes('起运时间：')) {
                // 修改这里：添加更好的样式和悬停效果
                htmlContent += `<div class="dayun-info-item" style="
                    margin-bottom: 12px; 
                    color: #3a7bd5; 
                    font-weight: 600; 
                    font-size: 15px;
                    padding: 10px 15px;
                    background: rgba(255, 255, 255, 0.9);
                    border-radius: 8px;
                    border-left: 3px solid #3a7bd5;
                    transition: all 0.3s ease;
                " onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 4px 12px rgba(58, 123, 213, 0.2)'" 
                 onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='none'">
                    ${trimmedLine}
                </div>`;
                hasDayunData = true;
            } else if (trimmedLine.includes('第') && trimmedLine.includes('步大运：')) {
                // 修改这里：优化大运行显示，添加悬停效果
                htmlContent += `<div class="dayun-item" style="
                    background: white; 
                    padding: 12px 15px; 
                    border-radius: 8px; 
                    border-left: 4px solid #3a7bd5; 
                    font-size: 14px; 
                    color: var(--dark-color); 
                    margin-bottom: 10px; 
                    box-shadow: 0 3px 8px rgba(58, 123, 213, 0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                " onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 5px 15px rgba(58, 123, 213, 0.2)'; this.style.borderLeftColor='#5a8de8'" 
                 onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 3px 8px rgba(58, 123, 213, 0.1)'; this.style.borderLeftColor='#3a7bd5'">
                    ${trimmedLine}
                </div>`;
                hasDayunData = true;
            } else if (trimmedLine.includes('大运详细：')) {
                // 跳过标题行
            } else if (trimmedLine.startsWith('第') && trimmedLine.includes('步大运')) {
                // 修改这里：处理另一种格式的大运行
                htmlContent += `<div class="dayun-item" style="
                    background: white; 
                    padding: 12px 15px; 
                    border-radius: 8px; 
                    border-left: 4px solid #3a7bd5; 
                    font-size: 14px; 
                    color: var(--dark-color); 
                    margin-bottom: 10px; 
                    box-shadow: 0 3px 8px rgba(58, 123, 213, 0.1);
                    transition: all 0.3s ease;
                    cursor: pointer;
                " onmouseover="this.style.transform='translateX(5px)'; this.style.boxShadow='0 5px 15px rgba(58, 123, 213, 0.2)'; this.style.borderLeftColor='#5a8de8'" 
                 onmouseout="this.style.transform='translateX(0)'; this.style.boxShadow='0 3px 8px rgba(58, 123, 213, 0.1)'; this.style.borderLeftColor='#3a7bd5'">
                    ${trimmedLine}
                </div>`;
                hasDayunData = true;
            }
        });
        
        if (hasDayunData) {
            dayunPanCard.style.display = 'block';
            dayunPanCard.innerHTML = `
                <h6 style="
                    color: #3a7bd5; 
                    margin-bottom: 20px; 
                    font-size: 20px; 
                    text-align: center; 
                    position: relative; 
                    padding-bottom: 12px; 
                    font-weight: 700;
                ">
                    大运排盘
                    <div style="
                        position: absolute; 
                        bottom: 0; 
                        left: 50%; 
                        transform: translateX(-50%); 
                        width: 100px; 
                        height: 3px; 
                        background: linear-gradient(to right, #3a7bd5, #5a8de8); 
                        border-radius: 2px;
                    "></div>
                </h6>
                <div style="margin-top: 15px;">${htmlContent}</div>
            `;
            console.log('大运排盘显示成功');
        } else {
            dayunPanCard.style.display = 'none';
            console.log('没有找到有效的大运数据');
        }
    } else {
        dayunPanCard.style.display = 'none';
        console.log('分析结果中没有找到大运排盘信息');
    }
}





