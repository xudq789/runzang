// ============ 【显示相关功能模块】 ============
/**
 * 各种内容显示功能：预测者信息、八字排盘、大运排盘、分析结果等
 */

import { DOM, formatDate, hideElement, showElement } from './utils.js';
import { UI } from './ui-elements.js';
import { STATE, SERVICES } from './config.js';

// ============ 【服务显示更新】 ============

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
    
    // ✅ 根据解锁状态控制 locked-content 容器的显示
    const lockedContent = document.getElementById('locked-content');
    const lockedOverlay = document.getElementById('locked-overlay');
    
    if (STATE.isPaymentUnlocked) {
        // 已解锁：隐藏整个 locked-content 容器
        if (lockedContent) lockedContent.style.display = 'none';
        if (lockedOverlay) lockedOverlay.style.display = 'none';
    } else {
        // 未解锁：显示 locked-content 容器
        if (lockedContent) lockedContent.style.display = 'block';
        if (lockedOverlay) lockedOverlay.style.display = 'flex';
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

// ============ 【预测者信息显示】 ============

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

// ============ 【内部辅助函数】 ============

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

// ============ 【八字排盘显示】 ============

// 显示八字排盘（优化显示顺序）
export function displayBaziPan() {
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

// 创建八字容器
function createBaziContainer(baziData, type = 'user') {
    const isPartner = type === 'partner';
    const title = isPartner ? '伴侣八字排盘' : '八字排盘';
    const color = isPartner ? '#FF69B4' : '#8b4513';
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

// 创建八字项目
function createBaziItem(column, element, label, isPartner = false) {
    const bgColor = isPartner ? '#fff5f5' : '#f9f9f9';
    const borderColor = isPartner ? '#ffc1cc' : '#d9d9d9';
    
    return `
        <div class="bazi-item" style="flex: 1; min-width: 120px; max-width: 150px; background: ${bgColor}; border-radius: 8px; padding: 15px 10px; text-align: center; border: 1px solid ${borderColor};">
            <div class="bazi-label" style="font-size: 14px; color: #666; margin-bottom: 12px; font-weight: 500; font-family: 'SimSun', '宋体', serif;">
                ${label}
            </div>
            <div class="bazi-value" style="font-size: 24px; font-weight: bold; font-family: 'SimSun', '宋体', serif; margin-bottom: 8px; height: 36px; line-height: 36px; color: #333;">
                ${column || ''}
            </div>
            <div class="bazi-element" style="font-size: 14px; font-weight: 500; color: #666; padding: 4px 10px; background: white; border-radius: 15px; display: inline-block; border: 1px solid ${borderColor};">
                ${element || ''}
            </div>
        </div>
    `;
}

// ============ 【大运排盘显示】 ============

// 显示大运排盘（完整干支显示）
export function displayDayunPan() {
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
                const fallbackData = createFallbackDayunData('partner');
                const partnerContainer = createDayunContainer(fallbackData, 'partner');
                baziGrid.appendChild(partnerContainer);
            }
        }
    } catch (error) {
        console.error('显示大运排盘失败:', error);
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

// 提取大运数据（完整干支）
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
            const yearMatches = trimmed.match(/\d+/g);
            if (yearMatches) {
                years.push(...yearMatches.slice(0, 8));
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
            const ganzhiMatches = trimmed.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g);
            if (ganzhiMatches) {
                ganzhi.push(...ganzhiMatches.slice(0, 8));
                console.log('提取的干支数据:', ganzhi);
            } else {
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

// 创建备用大运数据
function createFallbackDayunData(type = 'user') {
    const isPartner = type === 'partner';
    const startAge = isPartner ? 9 : 8;
    
    const years = [];
    const ganzhi = [];
    
    for (let i = 0; i < 8; i++) {
        years.push((startAge + i * 10).toString());
        ganzhi.push(['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未'][i] || '待定');
    }
    
    return {
        years: years,
        ganzhi: ganzhi,
        rawText: '大运数据加载中...',
        isPartner: isPartner
    };
}

// 创建大运容器（完整干支显示）
function createDayunContainer(dayunData, type = 'user') {
    const isPartner = type === 'partner';
    const title = isPartner ? '伴侣大运排盘' : '大运排盘';
    const color = isPartner ? '#FF69B4' : '#3a7bd5';
    const bgColor = isPartner ? '#fff5f5' : '#f0f8ff';
    const borderColor = isPartner ? '#ffc1cc' : '#d1e9ff';
    
    const { years, ganzhi } = dayunData;
    
    const container = document.createElement('div');
    container.className = isPartner ? 'partner-dayun-container' : 'dayun-container';
    
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
        
        <div class="dayun-horizontal-container" style="margin-bottom: 20px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
            ${tableHTML}
        </div>
        
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

// 创建简化的大运表格（完整干支）
function createSimpleDayunTable(years, ganzhi, isPartner = false) {
    const color = isPartner ? '#FF69B4' : '#3a7bd5';
    const bgColor = isPartner ? '#fff5f5' : '#f0f8ff';
    const borderColor = isPartner ? '#ffc1cc' : '#d1e9ff';
    
    let tableHTML = `
        <div class="dayun-simple-table" style="min-width: 600px;">
            <div class="dayun-row" style="display: flex; margin-bottom: 10px; background: ${bgColor}; border-radius: 6px; padding: 12px;">
                <div class="dayun-label" style="width: 80px; font-weight: bold; color: ${color}; display: flex; align-items: center; justify-content: center; font-family: 'SimSun', '宋体', serif; font-size: 16px;">
                    大运
                </div>
    `;
    
    for (let i = 0; i < 8; i++) {
        tableHTML += `
            <div class="dayun-cell" style="flex: 1; text-align: center; padding: 8px 4px; border-right: 1px solid ${borderColor}; min-width: 60px;">
                <div style="font-size: 14px; font-weight: bold; color: #333; font-family: 'SimSun', '宋体', serif;">第${i + 1}步</div>
            </div>
        `;
    }
    
    tableHTML += `
            </div>
            
            <div class="dayun-row" style="display: flex; margin-bottom: 10px; background: white; border-radius: 6px; padding: 12px; border: 1px solid ${borderColor};">
                <div class="dayun-label" style="width: 80px; font-weight: bold; color: ${color}; display: flex; align-items: center; justify-content: center; font-family: 'SimSun', '宋体', serif; font-size: 16px;">
                    岁
                </div>
    `;
    
    years.slice(0, 8).forEach((year, index) => {
        tableHTML += `
            <div class="dayun-cell" style="flex: 1; text-align: center; padding: 8px 4px; border-right: 1px solid ${borderColor}; min-width: 60px;">
                <div style="font-size: 16px; font-weight: bold; color: #333; font-family: 'SimSun', '宋体', serif; height: 28px; line-height: 28px;">${year || ''}</div>
                <div style="font-size: 11px; color: #666; margin-top: 2px;">${index === 0 ? '起运' : ''}</div>
            </div>
        `;
    });
    
    tableHTML += `
            </div>
            
            <div class="dayun-row" style="display: flex; margin-bottom: 0; background: white; border-radius: 6px; padding: 12px; border: 1px solid ${borderColor}; border-top: none;">
                <div class="dayun-label" style="width: 80px; font-weight: bold; color: ${color}; display: flex; align-items: center; justify-content: center; font-family: 'SimSun', '宋体', serif; font-size: 16px;">
                    干支
                </div>
    `;
    
    ganzhi.slice(0, 8).forEach((gz, index) => {
        tableHTML += `
            <div class="dayun-cell" style="flex: 1; text-align: center; padding: 8px 4px; border-right: 1px solid ${borderColor}; min-width: 60px;">
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

// ============ 【分析结果处理和显示】 ============

// 处理并显示分析结果
export function processAndDisplayAnalysis(result) {
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
export function showFullAnalysisContent() {
    console.log('🔍 [showFullAnalysisContent] 开始执行');
    
    const lockedAnalysisText = UI.lockedAnalysisText();
    const freeAnalysisText = UI.freeAnalysisText();
    
    console.log('🔍 [showFullAnalysisContent] 元素检查:');
    console.log('  - freeAnalysisText:', freeAnalysisText ? '存在' : '不存在');
    console.log('  - lockedAnalysisText:', lockedAnalysisText ? '存在' : '不存在');
    
    if (!freeAnalysisText) {
        console.warn('❌ [showFullAnalysisContent] freeAnalysisText 不存在');
        return;
    }
    
    console.log('🔍 [showFullAnalysisContent] 内容长度:');
    console.log('  - freeAnalysisText.innerHTML:', freeAnalysisText.innerHTML?.length || 0, '字符');
    console.log('  - lockedAnalysisText.innerHTML:', lockedAnalysisText?.innerHTML?.length || 0, '字符');
    
    const lockedContent = lockedAnalysisText?.innerHTML?.trim() || '';
    const freeContent = freeAnalysisText.innerHTML.trim();
    
    // ✅ 防止重复合并：使用更精确的检查方法
    if (lockedContent) {
        // 方法1：检查长度 - 如果 freeContent 长度已经接近两者之和，说明已合并
        const expectedLength = freeContent.length + lockedContent.length;
        const currentLength = freeContent.length;
        const alreadyMerged = currentLength >= (expectedLength * 0.9); // 允许10%误差
        
        // 方法2：检查 lockedContent 的末尾内容（更可靠）
        const lockedSuffix = lockedContent.substring(Math.max(0, lockedContent.length - 100));
        const suffixExists = freeContent.includes(lockedSuffix);
        
        console.log('🔍 [showFullAnalysisContent] 合并检查:');
        console.log('  - 当前长度:', currentLength);
        console.log('  - 预期长度:', expectedLength);
        console.log('  - 长度检查:', alreadyMerged ? '已合并' : '未合并');
        console.log('  - 末尾检查:', suffixExists ? '已合并' : '未合并');
        
        if (alreadyMerged || suffixExists) {
            console.log('🔍 [showFullAnalysisContent] 内容已合并，跳过重复追加');
        } else {
            // 合并内容
            freeAnalysisText.innerHTML = freeContent + lockedContent;
            console.log('✅ [showFullAnalysisContent] 内容已合并');
            console.log('  - 合并前长度:', freeContent.length);
            console.log('  - 合并后长度:', freeAnalysisText.innerHTML.length);
        }
    } else if (!lockedContent && STATE.fullAnalysisResult) {
        // 如果 lockedAnalysisText 为空，尝试从 STATE.fullAnalysisResult 重新处理
        console.log('⚠️ [showFullAnalysisContent] lockedAnalysisText 为空，尝试重新处理内容');
        console.log('🔍 [showFullAnalysisContent] STATE.fullAnalysisResult 长度:', STATE.fullAnalysisResult?.length || 0);
        processAndDisplayAnalysis(STATE.fullAnalysisResult);
        
        const newLockedText = UI.lockedAnalysisText();
        const newLockedContent = newLockedText?.innerHTML?.trim() || '';
        if (newLockedContent) {
            const newLockedPreview = newLockedContent.substring(0, Math.min(50, newLockedContent.length));
            if (!freeContent.includes(newLockedPreview)) {
                freeAnalysisText.innerHTML = freeContent + newLockedContent;
                console.log('✅ [showFullAnalysisContent] 内容已合并（重新处理后）');
            }
        } else {
            console.warn('❌ [showFullAnalysisContent] 重新处理后仍无法获取锁定内容');
        }
    }
    
    // 隐藏锁定覆盖层和整个锁定内容容器
    const lockedOverlay = document.getElementById('locked-overlay');
    const lockedContentContainer = document.getElementById('locked-content');
    
    if (lockedOverlay) {
        lockedOverlay.style.display = 'none';
    }
    
    // ✅ 隐藏整个 locked-content 容器，避免显示空白框
    if (lockedContentContainer) {
        lockedContentContainer.style.display = 'none';
    }
    
    console.log('✅ [showFullAnalysisContent] 完整内容已显示');
    console.log('  - 最终 freeAnalysisText 长度:', freeAnalysisText.innerHTML.length);
}

// 显示分析结果区域
export function showAnalysisResult() {
    const analysisResultSection = UI.analysisResultSection();
    if (analysisResultSection) {
        showElement(analysisResultSection);
        UI.analysisTime().textContent = formatDate();
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
