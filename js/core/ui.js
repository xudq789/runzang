// UI控制模块
import { DOM, formatDate, hideElement, showElement, calculateBazi } from './utils.js';
import { SERVICES, STATE } from './config.js';

// UI元素集合
export const UI = {
    // 表单元素（使用函数返回，确保DOM已加载）
    name: () => document.getElementById('name'),
    gender: () => document.getElementById('gender'),
    birthCity: () => document.getElementById('birth-city'),
    birthYear: () => document.getElementById('birth-year'),
    birthMonth: () => document.getElementById('birth-month'),
    birthDay: () => document.getElementById('birth-day'),
    birthHour: () => document.getElementById('birth-hour'),
    birthMinute: () => document.getElementById('birth-minute'),
    
    // 伴侣信息元素
    partnerName: () => document.getElementById('partner-name'),
    partnerGender: () => document.getElementById('partner-gender'),
    partnerBirthCity: () => document.getElementById('partner-birth-city'),
    partnerBirthYear: () => document.getElementById('partner-birth-year'),
    partnerBirthMonth: () => document.getElementById('partner-birth-month'),
    partnerBirthDay: () => document.getElementById('partner-birth-day'),
    partnerBirthHour: () => document.getElementById('partner-birth-hour'),
    partnerBirthMinute: () => document.getElementById('partner-birth-minute'),
    
    // 按钮
    analyzeBtn: () => document.getElementById('analyze-btn'),
    unlockBtn: () => document.getElementById('unlock-btn'),
    downloadReportBtn: () => document.getElementById('download-report-btn'),
    recalculateBtn: () => document.getElementById('recalculate-btn'),
    confirmPaymentBtn: () => document.getElementById('confirm-payment-btn'),
    cancelPaymentBtn: () => document.getElementById('cancel-payment-btn'),
    closePaymentBtn: () => document.getElementById('close-payment'),
    
    // 图片
    heroImage: () => document.getElementById('hero-image'),
    detailImage: () => document.getElementById('detail-image'),
    
    // 模态框
    paymentModal: () => document.getElementById('payment-modal'),
    loadingModal: () => document.getElementById('loading-modal'),
    
    // 结果区域
    analysisResultSection: () => document.getElementById('analysis-result-section'),
    predictorInfoGrid: () => document.getElementById('predictor-info-grid'),
    baziGrid: () => document.getElementById('bazi-grid'),
    freeAnalysisText: () => document.getElementById('free-analysis-text'),
    lockedAnalysisText: () => document.getElementById('locked-analysis-text'),
    unlockItemsList: () => document.getElementById('unlock-items-list'),
    unlockPrice: () => document.getElementById('unlock-price'),
    unlockCount: () => document.getElementById('unlock-count'),
    resultServiceName: () => document.getElementById('result-service-name'),
    analysisTime: () => document.getElementById('analysis-time'),
    
    // 支付弹窗
    paymentServiceType: () => document.getElementById('payment-service-type'),
    paymentAmount: () => document.getElementById('payment-amount'),
    paymentOrderId: () => document.getElementById('payment-order-id')
};

// 初始化表单选项
export function initFormOptions() {
    console.log('初始化表单选项...');
    
    // 确保DOM已加载
    if (!document.getElementById('birth-year')) {
        console.log('表单元素尚未加载，稍后重试');
        setTimeout(initFormOptions, 100);
        return;
    }
    
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
        const select = document.getElementById(selectId);
        if (!select) {
            console.error('找不到元素:', selectId);
            return;
        }
        
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
    
    console.log('✅ 表单选项初始化完成');
}

// 设置默认表单值 - ✅ 修复：添加安全检查
export function setDefaultValues() {
    console.log('设置默认表单值...');
    
    // 安全的设置函数
    const safeSetValue = (elementId, value) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.value = value;
            return true;
        }
        return false;
    };
    
    // 用户默认值
    const userDefaults = [
        { id: 'name', value: '张三' },
        { id: 'gender', value: 'male' },
        { id: 'birth-city', value: '北京' },
        { id: 'birth-year', value: 1990 },
        { id: 'birth-month', value: 1 },
        { id: 'birth-day', value: 1 },
        { id: 'birth-hour', value: 12 },
        { id: 'birth-minute', value: 0 }
    ];
    
    let userSuccessCount = 0;
    userDefaults.forEach(item => {
        if (safeSetValue(item.id, item.value)) {
            userSuccessCount++;
        }
    });
    
    console.log(`用户默认值设置: ${userSuccessCount}/${userDefaults.length}`);
    
    // 伴侣默认值
    const partnerDefaults = [
        { id: 'partner-name', value: '李四' },
        { id: 'partner-gender', value: 'female' },
        { id: 'partner-birth-city', value: '上海' },
        { id: 'partner-birth-year', value: 1992 },
        { id: 'partner-birth-month', value: 6 },
        { id: 'partner-birth-day', value: 15 },
        { id: 'partner-birth-hour', value: 15 },
        { id: 'partner-birth-minute', value: 30 }
    ];
    
    let partnerSuccessCount = 0;
    partnerDefaults.forEach(item => {
        if (safeSetValue(item.id, item.value)) {
            partnerSuccessCount++;
        }
    });
    
    console.log(`伴侣默认值设置: ${partnerSuccessCount}/${partnerDefaults.length}`);
    console.log('✅ 默认值设置完成');
}

// 更新服务显示
export function updateServiceDisplay(serviceName) {
    console.log('更新服务显示:', serviceName);
    
    // 更新导航激活状态
    document.querySelectorAll('.service-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.service === serviceName) {
            link.classList.add('active');
        }
    });
    
    // 更新表单标题
    const formTitle = document.getElementById('form-title');
    if (formTitle) {
        formTitle.textContent = serviceName + '信息填写';
    }
    
    // 更新结果区域标题
    const resultServiceName = document.getElementById('result-service-name');
    if (resultServiceName) {
        resultServiceName.textContent = serviceName + '分析报告';
    }
    
    // 显示/隐藏伴侣信息区域
    const partnerInfoSection = document.getElementById('partner-info-section');
    if (serviceName === '八字合婚') {
        if (partnerInfoSection) partnerInfoSection.style.display = 'block';
    } else {
        if (partnerInfoSection) partnerInfoSection.style.display = 'none';
    }
    
    // 更新图片
    const serviceConfig = SERVICES[serviceName];
    if (serviceConfig) {
        const heroImage = document.getElementById('hero-image');
        const detailImage = document.getElementById('detail-image');
        
        if (heroImage) {
            heroImage.src = serviceConfig.heroImage;
            heroImage.alt = serviceName + '英雄区';
        }
        
        if (detailImage) {
            detailImage.src = serviceConfig.detailImage;
            detailImage.alt = serviceName + '明细图';
        }
    }
}

// 更新解锁价格和项目
export function updateUnlockInfo() {
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
    // 更新价格
    const unlockPriceElement = document.getElementById('unlock-price');
    if (unlockPriceElement) {
        unlockPriceElement.textContent = serviceConfig.price;
    }
    
    // 更新项目列表
    const unlockItemsList = document.getElementById('unlock-items-list');
    const unlockCountElement = document.getElementById('unlock-count');
    
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
    const predictorInfoGrid = document.getElementById('predictor-info-grid');
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
    const baziGrid = document.getElementById('bazi-grid');
    if (!baziGrid) return;
    
    baziGrid.innerHTML = '';
    
    if (!STATE.baziData) return;
    
    // 四柱：年柱、月柱、日柱、时柱
    const columns = [
        { label: '年柱', value: STATE.baziData.yearColumn, element: STATE.baziData.yearElement },
        { label: '月柱', value: STATE.baziData.monthColumn, element: STATE.baziData.monthElement },
        { label: '日柱', value: STATE.baziData.dayColumn, element: STATE.baziData.dayElement },
        { label: '时柱', value: STATE.baziData.hourColumn, element: STATE.baziData.hourElement }
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

// 处理并显示分析结果
export function processAndDisplayAnalysis(result) {
    console.log('处理分析结果...');
    
    const freeAnalysisText = document.getElementById('free-analysis-text');
    const lockedAnalysisText = document.getElementById('locked-analysis-text');
    
    if (!freeAnalysisText || !lockedAnalysisText) return;
    
    // 简单处理：前2000字为免费内容，其余为锁定内容
    const freeContent = result.substring(0, 2000);
    const lockedContent = result.substring(2000);
    
    // 显示免费内容
    freeAnalysisText.innerHTML = `<div class="analysis-content">${freeContent.replace(/\n/g, '<br>')}</div>`;
    
    // 存储锁定内容
    lockedAnalysisText.innerHTML = `<div class="analysis-content">${lockedContent.replace(/\n/g, '<br>')}</div>`;
}

// 显示支付弹窗
export async function showPaymentModal() {
    console.log('显示支付弹窗...');
    
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
    try {
        // 显示支付弹窗
        const paymentModal = document.getElementById('payment-modal');
        if (paymentModal) {
            paymentModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
            
            // 显示基本信息
            const paymentServiceType = document.getElementById('payment-service-type');
            const paymentAmount = document.getElementById('payment-amount');
            const paymentOrderId = document.getElementById('payment-order-id');
            
            if (paymentServiceType) paymentServiceType.textContent = STATE.currentService;
            if (paymentAmount) paymentAmount.textContent = '¥' + serviceConfig.price;
            if (paymentOrderId) paymentOrderId.textContent = '生成中...';
        }
        
        // 调用后端支付接口
        const response = await fetch('https://runzang.top/api/payment/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                serviceType: STATE.currentService
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            alert('创建订单失败：' + (result.message || '请稍后重试'));
            closePaymentModal();
            return;
        }
        
        const { paymentUrl, outTradeNo, amount, subject } = result.data;
        
        console.log('支付URL:', paymentUrl);
        console.log('订单号:', outTradeNo);
        
        // 更新支付弹窗显示
        const paymentServiceType = document.getElementById('payment-service-type');
        const paymentAmount = document.getElementById('payment-amount');
        const paymentOrderId = document.getElementById('payment-order-id');
        
        if (paymentServiceType) paymentServiceType.textContent = subject || STATE.currentService;
        if (paymentAmount) paymentAmount.textContent = '¥' + amount;
        if (paymentOrderId) paymentOrderId.textContent = outTradeNo;
        
        // 保存订单ID
        STATE.currentOrderId = outTradeNo;
        
        // 清除旧的支付按钮
        const oldBtn = document.getElementById('alipay-redirect-btn');
        if (oldBtn) oldBtn.remove();
        
        // 创建支付按钮
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
        `;
        payBtn.innerHTML = `
            <span style="display: flex; align-items: center; justify-content: center;">
                <span style="margin-right: 8px;">💰</span>
                前往支付宝支付
            </span>
        `;
        
        payBtn.onclick = () => {
            console.log('跳转到支付宝支付');
            window.location.href = paymentUrl;
        };
        
        // 插入到支付弹窗
        const paymentMethods = document.querySelector('.payment-methods');
        if (paymentMethods) {
            paymentMethods.innerHTML = '';
            paymentMethods.appendChild(payBtn);
        }
        
    } catch (error) {
        console.error('支付失败:', error);
        alert('网络连接失败，请检查网络后重试');
        closePaymentModal();
    }
}

// 关闭支付弹窗
export function closePaymentModal() {
    const paymentModal = document.getElementById('payment-modal');
    if (paymentModal) {
        paymentModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 更新解锁界面状态
export function updateUnlockInterface() {
    const lockedOverlay = document.getElementById('locked-overlay');
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
}

// 显示完整分析内容
export function showFullAnalysisContent() {
    const lockedAnalysisText = document.getElementById('locked-analysis-text');
    const freeAnalysisText = document.getElementById('free-analysis-text');
    
    if (lockedAnalysisText && freeAnalysisText && lockedAnalysisText.innerHTML) {
        freeAnalysisText.innerHTML += lockedAnalysisText.innerHTML;
    }
}

// 锁定下载按钮
export function lockDownloadButton() {
    const downloadBtn = document.getElementById('download-report-btn');
    if (downloadBtn) {
        downloadBtn.disabled = true;
        downloadBtn.classList.add('download-btn-locked');
        STATE.isDownloadLocked = true;
        console.log('🔒 下载按钮已锁定');
    }
}

// 解锁下载按钮 - ✅ 关键修复
export function unlockDownloadButton() {
    console.log('🔓 解锁下载按钮');
    
    const downloadBtn = document.getElementById('download-report-btn');
    if (!downloadBtn) {
        console.error('找不到下载按钮');
        return;
    }
    
    // 彻底清理锁定状态
    downloadBtn.disabled = false;
    downloadBtn.classList.remove('download-btn-locked');
    
    // 应用解锁样式
    downloadBtn.style.cssText = `
        background: linear-gradient(135deg, #1677FF, #4096ff) !important;
        box-shadow: 0 4px 15px rgba(58, 123, 213, 0.4) !important;
        cursor: pointer !important;
        opacity: 1 !important;
    `;
    
    // 更新状态
    STATE.isDownloadLocked = false;
    
    console.log('✅ 下载按钮已解锁');
}

// 重置解锁界面
export function resetUnlockInterface() {
    const lockedOverlay = document.getElementById('locked-overlay');
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
}

// 按钮拉伸动画
export function animateButtonStretch() {
    const button = document.getElementById('analyze-btn');
    if (!button) return;
    
    button.classList.add('stretching');
    
    setTimeout(() => {
        button.classList.remove('stretching');
    }, 800);
}

// 显示加载弹窗
export function showLoadingModal() {
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
        loadingModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// 隐藏加载弹窗
export function hideLoadingModal() {
    const loadingModal = document.getElementById('loading-modal');
    if (loadingModal) {
        loadingModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 显示分析结果区域
export function showAnalysisResult() {
    const analysisResultSection = document.getElementById('analysis-result-section');
    if (analysisResultSection) {
        analysisResultSection.style.display = 'block';
        
        // 设置分析时间
        const analysisTime = document.getElementById('analysis-time');
        if (analysisTime) {
            analysisTime.textContent = formatDate();
        }
        
        // 滚动到结果区域
        setTimeout(() => {
            analysisResultSection.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }
}

// 隐藏分析结果区域
export function hideAnalysisResult() {
    const analysisResultSection = document.getElementById('analysis-result-section');
    if (analysisResultSection) {
        analysisResultSection.style.display = 'none';
    }
}

// 验证表单
export function validateForm() {
    let isValid = true;
    
    // 验证必填字段
    const requiredFields = [
        { id: 'name', errorId: 'name-error' },
        { id: 'gender', errorId: 'gender-error' },
        { id: 'birth-year', errorId: 'birth-year-error' },
        { id: 'birth-month', errorId: 'birth-month-error' },
        { id: 'birth-day', errorId: 'birth-day-error' },
        { id: 'birth-hour', errorId: 'birth-hour-error' },
        { id: 'birth-minute', errorId: 'birth-minute-error' },
        { id: 'birth-city', errorId: 'birth-city-error' }
    ];
    
    // 如果是八字合婚，验证伴侣信息
    if (STATE.currentService === '八字合婚') {
        requiredFields.push(
            { id: 'partner-name', errorId: 'partner-name-error' },
            { id: 'partner-gender', errorId: 'partner-gender-error' },
            { id: 'partner-birth-year', errorId: 'partner-birth-year-error' },
            { id: 'partner-birth-month', errorId: 'partner-birth-month-error' },
            { id: 'partner-birth-day', errorId: 'partner-birth-day-error' },
            { id: 'partner-birth-hour', errorId: 'partner-birth-hour-error' },
            { id: 'partner-birth-minute', errorId: 'partner-birth-minute-error' },
            { id: 'partner-birth-city', errorId: 'partner-birth-city-error' }
        );
    }
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const error = document.getElementById(field.errorId);
        
        if (element && error) {
            if (!element.value || element.value.trim() === '') {
                error.style.display = 'block';
                isValid = false;
            } else {
                error.style.display = 'none';
            }
        }
    });
    
    return isValid;
}

// 收集用户数据
export function collectUserData() {
    const name = document.getElementById('name');
    const gender = document.getElementById('gender');
    const birthYear = document.getElementById('birth-year');
    const birthMonth = document.getElementById('birth-month');
    const birthDay = document.getElementById('birth-day');
    const birthHour = document.getElementById('birth-hour');
    const birthMinute = document.getElementById('birth-minute');
    const birthCity = document.getElementById('birth-city');
    
    if (name && gender && birthYear && birthMonth && birthDay && birthHour && birthMinute && birthCity) {
        STATE.userData = {
            name: name.value,
            gender: gender.value === 'male' ? '男' : '女',
            birthYear: birthYear.value,
            birthMonth: birthMonth.value,
            birthDay: birthDay.value,
            birthHour: birthHour.value,
            birthMinute: birthMinute.value,
            birthCity: birthCity.value
        };
    }
    
    // 如果是八字合婚，收集伴侣数据
    if (STATE.currentService === '八字合婚') {
        const partnerName = document.getElementById('partner-name');
        const partnerGender = document.getElementById('partner-gender');
        const partnerBirthYear = document.getElementById('partner-birth-year');
        const partnerBirthMonth = document.getElementById('partner-birth-month');
        const partnerBirthDay = document.getElementById('partner-birth-day');
        const partnerBirthHour = document.getElementById('partner-birth-hour');
        const partnerBirthMinute = document.getElementById('partner-birth-minute');
        const partnerBirthCity = document.getElementById('partner-birth-city');
        
        if (partnerName && partnerGender && partnerBirthYear && partnerBirthMonth && partnerBirthDay && partnerBirthHour && partnerBirthMinute && partnerBirthCity) {
            STATE.partnerData = {
                partnerName: partnerName.value,
                partnerGender: partnerGender.value === 'male' ? '男' : '女',
                partnerBirthYear: partnerBirthYear.value,
                partnerBirthMonth: partnerBirthMonth.value,
                partnerBirthDay: partnerBirthDay.value,
                partnerBirthHour: partnerBirthHour.value,
                partnerBirthMinute: partnerBirthMinute.value,
                partnerBirthCity: partnerBirthCity.value
            };
        }
    }
    
    console.log('用户数据收集完成:', STATE.userData);
}
