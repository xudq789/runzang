// UI控制模块
'use strict';

import { DOM, formatDate, hideElement, showElement, generateOrderId, calculateBazi } from './utils.js';
import { SERVICES, STATE, PAYMENT_CONFIG } from './config.js';
import { parseBaziData } from './api.js';

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

// 八字排盘日历格式 - 支持伴侣显示
function createBaziCalendar(baziData, isPartner = false) {
    if (!baziData) {
        return `
            <div style="text-align:center;padding:20px;color:#666;font-family:'SimSun','宋体',serif;background:#f9f9f9;border-radius:8px;border:1px dashed #ddd;">
                <div style="margin-bottom:10px;">${isPartner ? '伴侣' : '用户'}八字数据加载中...</div>
                <div style="font-size:13px;color:#999;">正在从分析结果中提取八字信息</div>
            </div>
        `;
    }
    
    const color = isPartner ? '#d2691e' : '#8b4513';
    
    return `
        <div class="bazi-calendar" style="border-color: ${color}20;">
            <div class="calendar-header">
                <div class="calendar-title" style="color: ${color};">📅 ${isPartner ? '伴侣' : '用户'}八字排盘</div>
                <div class="calendar-subtitle">生辰八字 • 命理基础</div>
            </div>
            <div class="calendar-grid">
                <div class="calendar-item year-item" style="border-color: ${color}40;">
                    <div class="calendar-label">年柱</div>
                    <div class="calendar-value" style="color: ${color};">${baziData.yearColumn}</div>
                    <div class="calendar-element">${baziData.yearElement}</div>
                </div>
                <div class="calendar-item month-item" style="border-color: ${color}40;">
                    <div class="calendar-label">月柱</div>
                    <div class="calendar-value" style="color: ${color};">${baziData.monthColumn}</div>
                    <div class="calendar-element">${baziData.monthElement}</div>
                </div>
                <div class="calendar-item day-item" style="border-color: ${color}40;">
                    <div class="calendar-label">日柱</div>
                    <div class="calendar-value" style="color: ${color};">${baziData.dayColumn}</div>
                    <div class="calendar-element">${baziData.dayElement}</div>
                </div>
                <div class="calendar-item hour-item" style="border-color: ${color}40;">
                    <div class="calendar-label">时柱</div>
                    <div class="calendar-value" style="color: ${color};">${baziData.hourColumn}</div>
                    <div class="calendar-element">${baziData.hourElement}</div>
                </div>
            </div>
            <div class="calendar-footer">
                <div class="calendar-note">※ 排盘基于真太阳时计算</div>
            </div>
        </div>
    `;
}

// 从文本中提取数字序列
function extractNumbersFromText(text) {
    const numbers = [];
    const regex = /\b\d+\b/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        numbers.push(parseInt(match[0]));
    }
    return numbers;
}

// 从文本中提取天干地支
function extractGanzhiFromText(text) {
    const ganzhi = [];
    const regex = /[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
        ganzhi.push(match[0]);
    }
    return ganzhi;
}

// 提取大运数据（增强版）
function extractDayunData(text) {
    const result = {
        ages: [],
        stems: [],
        branches: []
    };
    
    if (!text) return result;
    
    console.log('开始提取大运数据，文本长度:', text.length);
    
    // 方法1：尝试从标准表格格式解析
    // 格式示例：岁 8 18 28 38 48 58 68 78
    const ageLineMatch = text.match(/岁\s*[:：]?\s*((?:\d+\s+){3,}\d+)/);
    if (ageLineMatch) {
        const ageLine = ageLineMatch[1];
        result.ages = ageLine.trim().split(/\s+/).slice(0, 8);
        console.log('方法1解析到年龄:', result.ages);
    }
    
    // 方法2：尝试从天干地支行解析
    const ganzhiMatches = extractGanzhiFromText(text);
    if (ganzhiMatches.length >= 4) {
        result.stems = ganzhiMatches.map(gz => gz.charAt(0)).slice(0, 8);
        result.branches = ganzhiMatches.map(gz => gz.charAt(1)).slice(0, 8);
        console.log('方法2解析到干支:', ganzhiMatches.slice(0, 8));
    }
    
    // 方法3：如果没有明确的年龄，尝试从文本中提取所有数字
    if (result.ages.length === 0) {
        const allNumbers = extractNumbersFromText(text);
        // 过滤出可能是年龄的数字（通常在5-80之间）
        const ageCandidates = allNumbers.filter(num => num >= 5 && num <= 80);
        if (ageCandidates.length >= 4) {
            // 去重并排序
            result.ages = [...new Set(ageCandidates)].sort((a, b) => a - b).slice(0, 8);
            console.log('方法3解析到年龄:', result.ages);
        }
    }
    
    // 如果还没有数据，使用默认示例
    if (result.ages.length === 0) {
        result.ages = ['8', '18', '28', '38', '48', '58', '68', '78'];
    }
    if (result.stems.length === 0) {
        result.stems = ['壬', '辛', '庚', '己', '戊', '丁', '丙', '乙'];
    }
    if (result.branches.length === 0) {
        result.branches = ['子', '亥', '戌', '酉', '申', '未', '午', '巳'];
    }
    
    return result;
}

// 大运排盘表格格式 - 从分析结果中提取真实数据
function createDayunCalendar() {
    const isHehun = STATE.currentService === '八字合婚';
    const hasPartnerData = STATE.partnerData && STATE.partnerBaziData;
    
    let userDayunData = { ages: [], stems: [], branches: [] };
    let partnerDayunData = { ages: [], stems: [], branches: [] };
    
    // 从分析结果中提取用户大运数据
    if (STATE.fullAnalysisResult) {
        userDayunData = extractDayunData(STATE.fullAnalysisResult);
        console.log('用户大运数据:', userDayunData);
    }
    
    // 如果是八字合婚且有伴侣数据，尝试提取伴侣大运数据
    if (isHehun && hasPartnerData && STATE.fullAnalysisResult) {
        // 注意：这里假设伴侣数据也在同一个分析结果中
        // 实际可能需要从单独的伴侣分析结果中提取
        partnerDayunData = extractDayunData(STATE.fullAnalysisResult);
        console.log('伴侣大运数据:', partnerDayunData);
    }
    
    // 确保数据长度一致
    const maxLength = Math.min(
        userDayunData.ages.length,
        userDayunData.stems.length,
        userDayunData.branches.length,
        8
    );
    
    const userAges = userDayunData.ages.slice(0, maxLength);
    const userStems = userDayunData.stems.slice(0, maxLength);
    const userBranches = userDayunData.branches.slice(0, maxLength);
    
    // 如果没有数据，显示提示
    if (maxLength === 0) {
        return `
            <div class="dayun-calendar">
                <div class="calendar-header">
                    <div class="calendar-title">📈 ${isHehun && hasPartnerData ? '双方大运排盘' : '大运排盘'}</div>
                    <div class="calendar-subtitle">命运流转 • 十年一运</div>
                </div>
                <div style="text-align: center; padding: 40px; color: #666; font-family: 'SimSun', '宋体', serif;">
                    <div style="margin-bottom: 15px; font-size: 18px;">大运数据解析中...</div>
                    <div style="font-size: 14px; color: #999;">正在从分析结果中提取大运信息</div>
                </div>
            </div>
        `;
    }
    
    // 如果是八字合婚，显示双人大运对比表格
    if (isHehun && hasPartnerData && partnerDayunData.ages.length > 0) {
        const partnerMaxLength = Math.min(
            partnerDayunData.ages.length,
            partnerDayunData.stems.length,
            partnerDayunData.branches.length,
            8
        );
        
        const partnerAges = partnerDayunData.ages.slice(0, partnerMaxLength);
        const partnerStems = partnerDayunData.stems.slice(0, partnerMaxLength);
        const partnerBranches = partnerDayunData.branches.slice(0, partnerMaxLength);
        
        return `
            <div class="dayun-calendar">
                <div class="calendar-header">
                    <div class="calendar-title">📊 双方大运排盘对比</div>
                    <div class="calendar-subtitle">命运同步 • 十年一运</div>
                </div>
                
                <!-- 用户大运表格 -->
                <div style="margin-bottom: 30px;">
                    <div style="font-size: 18px; color: #8b4513; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #f0e6d6;">
                        ${STATE.userData?.name || '用户'} 大运
                    </div>
                    <div class="dayun-table-container">
                        <table class="dayun-table">
                            <thead>
                                <tr>
                                    <th>岁</th>
                                    ${userAges.map(age => `<th>${age}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>大</td>
                                    ${userStems.map(stem => `<td>${stem}</td>`).join('')}
                                </tr>
                                <tr>
                                    <td>运</td>
                                    ${userBranches.map(branch => `<td>${branch}</td>`).join('')}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- 伴侣大运表格 -->
                <div>
                    <div style="font-size: 18px; color: #d2691e; font-weight: bold; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #f0e6d6;">
                        ${STATE.partnerData?.partnerName || '伴侣'} 大运
                    </div>
                    <div class="dayun-table-container">
                        <table class="dayun-table">
                            <thead>
                                <tr>
                                    <th>岁</th>
                                    ${partnerAges.map(age => `<th>${age}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>大</td>
                                    ${partnerStems.map(stem => `<td>${stem}</td>`).join('')}
                                </tr>
                                <tr>
                                    <td>运</td>
                                    ${partnerBranches.map(branch => `<td>${branch}</td>`).join('')}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="calendar-footer">
                    <div class="calendar-note">※ 大运推算遵循"男命阳顺阴逆，女命阳逆阴顺"原则</div>
                    <div class="calendar-note" style="color: #666; margin-top: 8px;">
                        提示：对比双方大运走势，分析婚姻运势同步情况
                    </div>
                </div>
            </div>
        `;
    }
    
    // 单人大运表格
    return `
        <div class="dayun-calendar">
            <div class="calendar-header">
                <div class="calendar-title">📈 大运排盘</div>
                <div class="calendar-subtitle">命运流转 • 十年一运</div>
            </div>
            <div class="dayun-table-container">
                <table class="dayun-table">
                    <thead>
                        <tr>
                            <th>岁</th>
                            ${userAges.map(age => `<th>${age}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>大</td>
                            ${userStems.map(stem => `<td>${stem}</td>`).join('')}
                        </tr>
                        <tr>
                            <td>运</td>
                            ${userBranches.map(branch => `<td>${branch}</td>`).join('')}
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="calendar-footer">
                <div class="calendar-note">※ 大运推算遵循"男命阳顺阴逆，女命阳逆阴顺"原则</div>
                ${maxLength < 4 ? '<div class="calendar-note" style="color: #999; margin-top: 5px;">注：部分大运数据未能完整解析</div>' : ''}
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

// 显示八字排盘结果 - 支持单人/双人显示
function displayBaziPan() {
    const baziGrid = UI.baziGrid();
    if (!baziGrid) return;
    
    baziGrid.innerHTML = '';
    
    // 创建排盘容器
    const container = document.createElement('div');
    container.className = 'bazi-dayun-container';
    container.style.cssText = `
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.08);
        padding: 30px;
        margin-bottom: 40px;
        border: 1px solid #e8e8e8;
        max-width: 900px;
        margin-left: auto;
        margin-right: auto;
    `;
    
    // 添加标题
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
        text-align: center;
        margin-bottom: 30px;
        padding-bottom: 20px;
        border-bottom: 3px solid #f0e6d6;
    `;
    
    const isHehun = STATE.currentService === '八字合婚';
    const hasPartnerData = STATE.partnerData && STATE.partnerBaziData;
    
    titleDiv.innerHTML = `
        <div style="font-size: 26px; color: #8b4513; font-weight: bold; font-family: 'SimSun', '宋体', serif; margin-bottom: 10px;">
            ${isHehun ? '👫 合婚双人排盘分析' : '📜 命理排盘分析'}
        </div>
        <div style="font-size: 15px; color: #666; font-family: 'SimSun', '宋体', serif;">
            ${isHehun ? '双方八字根基 • 大运对比' : '八字根基 • 大运流年'}
        </div>
    `;
    container.appendChild(titleDiv);
    
    // ============ 用户八字排盘部分 ============
    const userBaziSection = document.createElement('div');
    userBaziSection.className = 'bazi-section';
    userBaziSection.style.cssText = `
        margin-bottom: 30px;
        padding-bottom: ${isHehun ? '15px' : '25px'};
        border-bottom: ${isHehun ? '1px solid #e8e8e8' : '2px dashed #e8e8e8'};
    `;
    
    // 添加用户标题
    const userTitle = document.createElement('div');
    userTitle.style.cssText = `
        font-size: 20px;
        color: #8b4513;
        font-weight: bold;
        margin-bottom: 20px;
        padding-left: 10px;
        border-left: 4px solid #8b4513;
        font-family: 'SimSun', '宋体', serif;
    `;
    userTitle.textContent = `${STATE.userData?.name || '用户'} 八字排盘`;
    userBaziSection.appendChild(userTitle);
    
    userBaziSection.innerHTML += createBaziCalendar(STATE.baziData);
    container.appendChild(userBaziSection);
    
    // ============ 伴侣八字排盘部分（如果是八字合婚） ============
    if (isHehun && hasPartnerData) {
        const partnerBaziSection = document.createElement('div');
        partnerBaziSection.className = 'bazi-section';
        partnerBaziSection.style.cssText = `
            margin-bottom: 30px;
            padding-bottom: 25px;
            border-bottom: 2px dashed #e8e8e8;
        `;
        
        // 添加伴侣标题
        const partnerTitle = document.createElement('div');
        partnerTitle.style.cssText = `
            font-size: 20px;
            color: #d2691e;
            font-weight: bold;
            margin-bottom: 20px;
            padding-left: 10px;
            border-left: 4px solid #d2691e;
            font-family: 'SimSun', '宋体', serif;
        `;
        partnerTitle.textContent = `${STATE.partnerData?.partnerName || '伴侣'} 八字排盘`;
        partnerBaziSection.appendChild(partnerTitle);
        
        partnerBaziSection.innerHTML += createBaziCalendar(STATE.partnerBaziData, true);
        container.appendChild(partnerBaziSection);
    }
    
    // ============ 大运排盘部分 ============
    const dayunSection = document.createElement('div');
    dayunSection.className = 'dayun-section';
    
    // 添加大运标题
    const dayunTitle = document.createElement('div');
    dayunTitle.style.cssText = `
        font-size: 20px;
        color: #3a7bd5;
        font-weight: bold;
        margin-bottom: 20px;
        padding-left: 10px;
        border-left: 4px solid #3a7bd5;
        font-family: 'SimSun', '宋体', serif;
    `;
    dayunTitle.textContent = isHehun && hasPartnerData ? '双方大运排盘对比' : '大运排盘';
    dayunSection.appendChild(dayunTitle);
    
    dayunSection.innerHTML += createDayunCalendar();
    container.appendChild(dayunSection);
    
    baziGrid.appendChild(container);
    
    // 添加响应式样式
    const styleId = 'bazi-dayun-responsive-styles';
    if (document.getElementById(styleId)) {
        return;
    }
    
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        /* 电脑端边距优化 */
        @media (min-width: 769px) {
            .bazi-dayun-container {
                padding: 35px 40px !important;
                margin-left: auto !important;
                margin-right: auto !important;
                max-width: 900px !important;
            }
            
            .calendar-grid {
                gap: 20px !important;
            }
            
            .calendar-item {
                padding: 25px !important;
            }
            
            .calendar-value {
                font-size: 32px !important;
                height: 45px !important;
                line-height: 45px !important;
            }
            
            .dayun-table {
                font-size: 16px !important;
            }
        }
        
        /* H5端边距优化 */
        @media (max-width: 768px) {
            .bazi-dayun-container {
                padding: 20px 15px !important;
                margin: 0 -10px 30px -10px !important;
                width: calc(100% + 20px) !important;
                border-radius: 8px !important;
            }
            
            .calendar-grid {
                gap: 10px !important;
            }
            
            .calendar-item {
                padding: 18px 12px !important;
            }
            
            .calendar-value {
                font-size: 26px !important;
                height: 36px !important;
                line-height: 36px !important;
            }
            
            .dayun-table th,
            .dayun-table td {
                padding: 10px 8px !important;
                min-width: 50px !important;
                font-size: 14px !important;
            }
        }
        
        /* 小屏幕H5优化 */
        @media (max-width: 480px) {
            .bazi-dayun-container {
                padding: 15px 10px !important;
                margin: 0 -8px 25px -8px !important;
                width: calc(100% + 16px) !important;
                border-radius: 6px !important;
            }
            
            .calendar-grid {
                grid-template-columns: 1fr !important;
                gap: 8px !important;
            }
            
            .calendar-item {
                padding: 16px 10px !important;
            }
            
            .calendar-value {
                font-size: 24px !important;
            }
            
            .dayun-table {
                font-size: 13px !important;
                min-width: 350px !important;
            }
            
            .dayun-table th,
            .dayun-table td {
                padding: 8px 6px !important;
                min-width: 45px !important;
                font-size: 13px !important;
            }
        }
        
        /* 合婚双人排盘样式 */
        .bazi-section + .bazi-section {
            margin-top: 20px;
        }
        
        /* 大运对比表格样式 */
        .dayun-table-container + .dayun-table-container {
            margin-top: 25px;
        }
    `;
    document.head.appendChild(style);
}

// 处理并显示分析结果 - 宋体格式
function processAndDisplayAnalysis(result) {
    console.log('处理分析结果...');
    
    const freeAnalysisText = UI.freeAnalysisText();
    const lockedAnalysisText = UI.lockedAnalysisText();
    
    if (!freeAnalysisText || !lockedAnalysisText) return;
    
    // 清空内容
    freeAnalysisText.innerHTML = '';
    lockedAnalysisText.innerHTML = '';
    
    // 提取八字数据
    const parsedBaziData = parseBaziData(result);
    STATE.baziData = parsedBaziData.userBazi;
    
    // 如果是八字合婚，尝试提取伴侣八字数据
    if (STATE.currentService === '八字合婚' && STATE.partnerData) {
        // 注意：这里假设分析结果中包含了伴侣的八字信息
        // 实际可能需要从API返回的特定格式中提取
        STATE.partnerBaziData = parsedBaziData.partnerBazi || {
            yearColumn: '待解析',
            monthColumn: '待解析', 
            dayColumn: '待解析',
            hourColumn: '待解析',
            yearElement: '待解析',
            monthElement: '待解析',
            dayElement: '待解析',
            hourElement: '待解析'
        };
        
        console.log('伴侣八字数据:', STATE.partnerBaziData);
    }
    
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

// 显示加载弹窗
function showLoadingModal() {
    const loadingModal = UI.loadingModal();
    if (loadingModal) {
        showElement(loadingModal);
        document.body.style.overflow = 'hidden';
    }
}

// 隐藏加载弹窗
function hideLoadingModal() {
    const loadingModal = UI.loadingModal();
    if (loadingModal) {
        hideElement(loadingModal);
        document.body.style.overflow = 'auto';
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

// 空函数，用于兼容旧的 main.js 调用
function displayDayunPan() {
    console.log('displayDayunPan: 大运排盘已合并到 displayBaziPan 中，无需单独调用');
    return;
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
    resetFormErrors,
    displayDayunPan
};







