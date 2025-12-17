[file name]: ui.js
[file content begin]
// UI控制模块
import { DOM, formatDate, hideElement, showElement, generateOrderId } from './utils.js';
import { SERVICES, STATE } from './config.js';

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
    
    // 更新结果区域标题
    UI.resultServiceName().textContent = serviceName + '分析报告';
    
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
        const heroPlaceholder = heroImage.previousElementSibling;
        const detailPlaceholder = detailImage.previousElementSibling;
        
        showElement(heroPlaceholder);
        showElement(detailPlaceholder);
        
        // 移除已加载类
        heroImage.classList.remove('loaded');
        detailImage.classList.remove('loaded');
        
        // 更新图片源 - 直接使用完整URL
        heroImage.src = serviceConfig.heroImage;
        heroImage.alt = serviceName + '英雄区';
        
        detailImage.src = serviceConfig.detailImage;
        detailImage.alt = serviceName + '明细图';
    }
}

// 更新解锁价格和项目
export function updateUnlockInfo() {
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
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
        
        // 创建项目列表
        lockedItems.forEach(item => {
            const li = document.createElement('li');
            li.textContent = item;
            unlockItemsList.appendChild(li);
        });
    }
}

// 显示预测者信息
export function displayPredictorInfo() {
    const predictorInfoGrid = UI.predictorInfoGrid();
    if (!predictorInfoGrid || !STATE.userData) return;
    
    predictorInfoGrid.innerHTML = '';
    
    // 添加预测者信息
    const infoItems = [
        { label: '姓名', value: STATE.userData.name },
        { label: '性别', value: STATE.userData.gender },
        { label: '出生时间', value: `${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日 ${STATE.userData.birthHour}时${STATE.userData.birthMinute}分` },
        { label: '出生城市', value: STATE.userData.birthCity },
        { label: '测算服务', value: STATE.currentService },
        { label: '测算时间', value: formatDate() }
    ];
    
    // 如果是八字合婚，添加伴侣信息
    if (STATE.currentService === '八字合婚' && STATE.partnerData) {
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

// 显示八字排盘结果
export function displayBaziPan() {
    const baziGrid = UI.baziGrid();
    if (!baziGrid) return;
    
    baziGrid.innerHTML = '';
    
    // 对于八字合婚，需要显示双方八字排盘
    if (STATE.currentService === '八字合婚') {
        // 首先尝试从分析结果中解析伴侣的八字数据
        const userBaziData = STATE.baziData;
        let partnerBaziData = {};
        
        // 尝试从分析结果中提取伴侣的八字信息
        if (STATE.fullAnalysisResult) {
            const baziMatch = STATE.fullAnalysisResult.match(/【伴侣八字排盘】\s*年柱：([^\n]+)\s*月柱：([^\n]+)\s*日柱：([^\n]+)\s*时柱：([^\n]+)/);
            
            if (baziMatch && baziMatch.length >= 5) {
                // 解析伴侣年柱
                const yearMatch = baziMatch[1].match(/([^\s]+)\s*\(([^)]+)\)/);
                if (yearMatch) {
                    partnerBaziData.yearColumn = yearMatch[1];
                    partnerBaziData.yearElement = yearMatch[2];
                }
                
                // 解析伴侣月柱
                const monthMatch = baziMatch[2].match(/([^\s]+)\s*\(([^)]+)\)/);
                if (monthMatch) {
                    partnerBaziData.monthColumn = monthMatch[1];
                    partnerBaziData.monthElement = monthMatch[2];
                }
                
                // 解析伴侣日柱
                const dayMatch = baziMatch[3].match(/([^\s]+)\s*\(([^)]+)\)/);
                if (dayMatch) {
                    partnerBaziData.dayColumn = dayMatch[1];
                    partnerBaziData.dayElement = dayMatch[2];
                }
                
                // 解析伴侣时柱
                const hourMatch = baziMatch[4].match(/([^\s]+)\s*\(([^)]+)\)/);
                if (hourMatch) {
                    partnerBaziData.hourColumn = hourMatch[1];
                    partnerBaziData.hourElement = hourMatch[2];
                }
            }
        }
        
        // 如果没有解析到伴侣八字数据，使用计算数据
        if (!partnerBaziData.yearColumn && STATE.partnerData) {
            // 计算伴侣八字数据
            const calculateBazi = (userData) => {
                const year = parseInt(userData.birthYear);
                const month = parseInt(userData.birthMonth);
                const day = parseInt(userData.birthDay);
                const hour = parseInt(userData.birthHour);
                
                const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
                const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
                const elements = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
                
                const yearIndex = (year - 4) % 60;
                const yearHeavenly = heavenlyStems[yearIndex % 10];
                const yearEarthly = earthlyBranches[yearIndex % 12];
                const yearColumn = yearHeavenly + yearEarthly;
                const yearElement = elements[yearIndex % 10];
                
                const monthIndex = (month + 1) % 12;
                const monthHeavenly = heavenlyStems[(yearIndex % 10 * 2 + monthIndex) % 10];
                const monthEarthly = earthlyBranches[monthIndex];
                const monthColumn = monthHeavenly + monthEarthly;
                const monthElement = elements[(yearIndex % 10 * 2 + monthIndex) % 10];
                
                const dayIndex = (year + month + day) % 60;
                const dayHeavenly = heavenlyStems[dayIndex % 10];
                const dayEarthly = earthlyBranches[dayIndex % 12];
                const dayColumn = dayHeavenly + dayEarthly;
                const dayElement = elements[dayIndex % 10];
                
                const hourIndex = Math.floor(hour / 2) % 12;
                const hourHeavenly = heavenlyStems[(dayIndex % 10 * 2 + hourIndex) % 10];
                const hourEarthly = earthlyBranches[hourIndex];
                const hourColumn = hourHeavenly + hourEarthly;
                const hourElement = elements[(dayIndex % 10 * 2 + hourIndex) % 10];
                
                return {
                    yearColumn,
                    yearElement,
                    monthColumn,
                    monthElement,
                    dayColumn,
                    dayElement,
                    hourColumn,
                    hourElement
                };
            };
            
            partnerBaziData = calculateBazi(STATE.partnerData);
        }
        
        // 创建用户和伴侣的八字排盘容器
        const container = document.createElement('div');
        container.className = 'dual-bazi-container';
        
        // 用户八字标题
        const userTitle = document.createElement('div');
        userTitle.className = 'bazi-section-title';
        userTitle.textContent = '用户八字排盘';
        userTitle.style.cssText = 'text-align: center; font-size: 18px; font-weight: bold; color: var(--primary-color); margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid var(--light-color);';
        container.appendChild(userTitle);
        
        // 用户八字网格
        const userGrid = document.createElement('div');
        userGrid.className = 'bazi-grid';
        userGrid.style.cssText = 'margin-bottom: 30px;';
        
        // 用户四柱数据
        const userColumns = [
            { label: '年柱', value: userBaziData.yearColumn, element: userBaziData.yearElement },
            { label: '月柱', value: userBaziData.monthColumn, element: userBaziData.monthElement },
            { label: '日柱', value: userBaziData.dayColumn, element: userBaziData.dayElement },
            { label: '时柱', value: userBaziData.hourColumn, element: userBaziData.hourElement }
        ];
        
        // 创建用户八字排盘展示
        userColumns.forEach(col => {
            const div = document.createElement('div');
            div.className = 'bazi-column';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'bazi-label';
            labelDiv.textContent = col.label;
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'bazi-value';
            valueDiv.textContent = col.value;
            
            const elementDiv = document.createElement('div');
            elementDiv.className = 'bazi-element';
            elementDiv.textContent = col.element || '';
            
            div.appendChild(labelDiv);
            div.appendChild(valueDiv);
            div.appendChild(elementDiv);
            userGrid.appendChild(div);
        });
        
        container.appendChild(userGrid);
        
        // 伴侣八字标题
        const partnerTitle = document.createElement('div');
        partnerTitle.className = 'bazi-section-title';
        partnerTitle.textContent = '伴侣八字排盘';
        partnerTitle.style.cssText = 'text-align: center; font-size: 18px; font-weight: bold; color: var(--primary-color); margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid var(--light-color);';
        container.appendChild(partnerTitle);
        
        // 伴侣八字网格
        const partnerGrid = document.createElement('div');
        partnerGrid.className = 'bazi-grid';
        
        // 伴侣四柱数据
        const partnerColumns = [
            { label: '年柱', value: partnerBaziData.yearColumn || '--', element: partnerBaziData.yearElement || '' },
            { label: '月柱', value: partnerBaziData.monthColumn || '--', element: partnerBaziData.monthElement || '' },
            { label: '日柱', value: partnerBaziData.dayColumn || '--', element: partnerBaziData.dayElement || '' },
            { label: '时柱', value: partnerBaziData.hourColumn || '--', element: partnerBaziData.hourElement || '' }
        ];
        
        // 创建伴侣八字排盘展示
        partnerColumns.forEach(col => {
            const div = document.createElement('div');
            div.className = 'bazi-column';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'bazi-label';
            labelDiv.textContent = col.label;
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'bazi-value';
            valueDiv.textContent = col.value;
            
            const elementDiv = document.createElement('div');
            elementDiv.className = 'bazi-element';
            elementDiv.textContent = col.element || '';
            
            div.appendChild(labelDiv);
            div.appendChild(valueDiv);
            div.appendChild(elementDiv);
            partnerGrid.appendChild(div);
        });
        
        container.appendChild(partnerGrid);
        baziGrid.appendChild(container);
        
    } else {
        // 其他服务的八字排盘显示
        const baziDataToDisplay = STATE.baziData;
        
        if (!baziDataToDisplay) return;
        
        // 四柱：年柱、月柱、日柱、时柱
        const columns = [
            { label: '年柱', value: baziDataToDisplay.yearColumn, element: baziDataToDisplay.yearElement },
            { label: '月柱', value: baziDataToDisplay.monthColumn, element: baziDataToDisplay.monthElement },
            { label: '日柱', value: baziDataToDisplay.dayColumn, element: baziDataToDisplay.dayElement },
            { label: '时柱', value: baziDataToDisplay.hourColumn, element: baziDataToDisplay.hourElement }
        ];
        
        // 创建八字排盘展示
        columns.forEach(col => {
            const div = document.createElement('div');
            div.className = 'bazi-column';
            
            const labelDiv = document.createElement('div');
            labelDiv.className = 'bazi-label';
            labelDiv.textContent = col.label;
            
            const valueDiv = document.createElement('div');
            valueDiv.className = 'bazi-value';
            valueDiv.textContent = col.value;
            
            const elementDiv = document.createElement('div');
            elementDiv.className = 'bazi-element';
            elementDiv.textContent = col.element || '';
            
            div.appendChild(labelDiv);
            div.appendChild(valueDiv);
            div.appendChild(elementDiv);
            baziGrid.appendChild(div);
        });
    }
}

// 处理并显示分析结果
export function processAndDisplayAnalysis(result) {
    console.log('处理分析结果...');
    
    // 根据服务类型定义不同的免费部分
    let freeSections = [];
    
    if (STATE.currentService === '八字合婚') {
        // 八字合婚的免费部分
        freeSections = [
            '【用户八字排盘】',
            '【伴侣八字排盘】',
            '【用户大运排盘】',
            '【伴侣大运排盘】',
            '【八字喜用分析】',
            '【性格特点】',
            '【适宜行业职业推荐】'
        ];
    } else {
        // 其他服务的免费部分
        freeSections = [
            '【八字排盘】',
            '【大运排盘】',
            '【八字喜用分析】',
            '【性格特点】',
            '【适宜行业职业推荐】'
        ];
    }
    
    let freeContent = '';
    let lockedContent = '';
    
    // 按【分割内容
    const sections = result.split('【');
    
    // 重新组装，保留【标记
    for (let i = 1; i < sections.length; i++) {
        const section = '【' + sections[i];
        const sectionTitle = section.split('】')[0] + '】';
        
        // 对于八字合婚，八字和大运排盘已经单独显示，不在这里显示
        if (STATE.currentService === '八字合婚') {
            if (sectionTitle === '【用户八字排盘】' || 
                sectionTitle === '【伴侣八字排盘】' ||
                sectionTitle === '【用户大运排盘】' ||
                sectionTitle === '【伴侣大运排盘】') {
                continue;
            }
        } else {
            // 对于其他服务，八字和大运排盘已经单独显示
            if (sectionTitle === '【八字排盘】' || 
                sectionTitle === '【大运排盘】') {
                continue;
            }
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
        // 尝试找到免费部分
        for (const freeSection of freeSections) {
            const startIndex = result.indexOf(freeSection);
            if (startIndex !== -1) {
                // 找到下一个【或结束
                let endIndex = result.indexOf('【', startIndex + 1);
                if (endIndex === -1) {
                    endIndex = result.length;
                }
                freeContent += result.substring(startIndex, endIndex) + '\n\n';
            }
        }
        
        // 剩余部分作为锁定内容
        if (freeContent) {
            lockedContent = result.replace(freeContent, '');
        }
    }
    
    // 显示免费内容
    const freeAnalysisText = UI.freeAnalysisText();
    if (freeAnalysisText) {
        // 将免费内容格式化为HTML
        let formattedContent = '';
        const freeSectionsArray = freeContent.split('\n\n');
        
        freeSectionsArray.forEach(section => {
            if (section.trim()) {
                // 提取标题
                const titleMatch = section.match(/【([^】]+)】/);
                if (titleMatch) {
                    const title = titleMatch[1];
                    const content = section.replace(titleMatch[0], '').trim();
                    
                    formattedContent += `
                    <div class="analysis-section">
                        <h5>${title}</h5>
                        <div class="analysis-content">${content.replace(/\n/g, '<br>')}</div>
                    </div>`;
                } else {
                    formattedContent += `<div class="analysis-content">${section.replace(/\n/g, '<br>')}</div>`;
                }
            }
        });
        
        freeAnalysisText.innerHTML = formattedContent;
    }
    
    // 存储锁定内容
    const lockedAnalysisText = UI.lockedAnalysisText();
    if (lockedAnalysisText) {
        // 将锁定内容格式化为HTML
        let formattedLockedContent = '';
        const lockedSectionsArray = lockedContent.split('\n\n');
        
        lockedSectionsArray.forEach(section => {
            if (section.trim()) {
                // 提取标题
                const titleMatch = section.match(/【([^】]+)】/);
                if (titleMatch) {
                    const title = titleMatch[1];
                    const content = section.replace(titleMatch[0], '').trim();
                    
                    formattedLockedContent += `
                    <div class="analysis-section">
                        <h5>${title}</h5>
                        <div class="analysis-content">${content.replace(/\n/g, '<br>')}</div>
                    </div>`;
                } else {
                    formattedLockedContent += `<div class="analysis-content">${section.replace(/\n/g, '<br>')}</div>`;
                }
            }
        });
        
        lockedAnalysisText.innerHTML = formattedLockedContent;
    }
}

// 显示支付弹窗
export function showPaymentModal() {
    console.log('显示支付弹窗...');
    
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
    // 生成订单信息
    STATE.currentOrder = {
        serviceType: STATE.currentService,
        price: serviceConfig.price,
        orderId: generateOrderId(),
        unlockItems: serviceConfig.lockedItems
    };
    
    // 更新支付弹窗内容
    UI.paymentServiceType().textContent = STATE.currentService + '完整报告解锁';
    UI.paymentAmount().textContent = '¥' + STATE.currentOrder.price;
    UI.paymentOrderId().textContent = STATE.currentOrder.orderId;
    
    // 显示支付弹窗
    const paymentModal = UI.paymentModal();
    if (paymentModal) {
        showElement(paymentModal);
        document.body.style.overflow = 'hidden';
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

// 显示完整分析内容
export function showFullAnalysisContent() {
    const lockedAnalysisText = UI.lockedAnalysisText();
    const freeAnalysisText = UI.freeAnalysisText();
    
    if (lockedAnalysisText && lockedAnalysisText.textContent.trim() && freeAnalysisText) {
        // 将锁定内容添加到免费内容中
        const currentContent = freeAnalysisText.innerHTML;
        freeAnalysisText.innerHTML = currentContent + lockedAnalysisText.innerHTML;
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
    }
}

// 解锁下载按钮
export function unlockDownloadButton() {
    const downloadBtn = UI.downloadReportBtn();
    const downloadBtnText = DOM.id('download-btn-text');
    
    if (downloadBtn && downloadBtnText) {
        downloadBtn.disabled = false;
        downloadBtn.classList.remove('download-btn-locked');
        downloadBtnText.textContent = '下载报告';
        STATE.isDownloadLocked = false;
    }
}

// 重置解锁界面
export function resetUnlockInterface() {
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
    
    // 重置项目列表为锁定状态
    const unlockItems = lockedOverlay.querySelectorAll('.unlock-items li');
    unlockItems.forEach(item => {
        item.classList.remove('unlocked-item');
        const text = item.textContent.replace('✅ ', '');
        item.innerHTML = '<span>🔒 ' + text + '</span>';
    });
    
    // 重置解锁按钮
    const unlockBtnContainer = lockedOverlay.querySelector('.unlock-btn-container');
    if (unlockBtnContainer) {
        const unlockBtn = unlockBtnContainer.querySelector('.unlock-btn');
        const unlockPrice = unlockBtnContainer.querySelector('.unlock-price');
        
        if (unlockBtn) {
            unlockBtn.innerHTML = `解锁完整报告 (¥<span id="unlock-price">${SERVICES[STATE.currentService].price}</span>)`;
            unlockBtn.style.background = 'linear-gradient(135deg, var(--secondary-color), #e6b800)';
            unlockBtn.style.cursor = 'pointer';
            unlockBtn.disabled = false;
        }
        
        if (unlockPrice) {
            const itemCount = SERVICES[STATE.currentService].lockedItems.length;
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
[file content end]
