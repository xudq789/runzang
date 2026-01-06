// UI控制模块 - 简化版
import { formatDate, calculateBazi } from './utils.js';
import { SERVICES, STATE } from './config.js';

// 初始化表单选项
export function initFormOptions() {
    console.log('初始化表单选项...');
    
    // 延迟执行，确保DOM已加载
    setTimeout(() => {
        try {
            // 年份选项 (1900-2024)
            const years = [];
            for (let i = 1900; i <= 2024; i++) years.push(i);
            
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
            
            // 其他选项数组
            const months = Array.from({ length: 12 }, (_, i) => i + 1);
            const days = Array.from({ length: 31 }, (_, i) => i + 1);
            const hours = Array.from({ length: 24 }, (_, i) => i);
            const minutes = Array.from({ length: 60 }, (_, i) => i);
            
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
        } catch (error) {
            console.error('初始化表单选项失败:', error);
        }
    }, 300);
}

// 设置默认表单值
export function setDefaultValues() {
    console.log('设置默认表单值...');
    
    // 延迟执行，确保DOM已加载
    setTimeout(() => {
        try {
            // 安全的设置函数
            const safeSetValue = (elementId, value) => {
                const element = document.getElementById(elementId);
                if (element) {
                    element.value = value;
                    return true;
                }
                console.warn('找不到元素:', elementId);
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
            
            userDefaults.forEach(item => {
                safeSetValue(item.id, item.value);
            });
            
            console.log('✅ 默认值设置完成');
        } catch (error) {
            console.error('设置默认值失败:', error);
        }
    }, 500);
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
    
    // 显示/隐藏伴侣信息区域
    const partnerInfoSection = document.getElementById('partner-info-section');
    if (serviceName === '八字合婚') {
        if (partnerInfoSection) partnerInfoSection.style.display = 'block';
    } else {
        if (partnerInfoSection) partnerInfoSection.style.display = 'none';
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
        
        serviceConfig.lockedItems.forEach(item => {
            const li = document.createElement('li');
            if (STATE.isPaymentUnlocked) {
                li.innerHTML = '<span>✅ ' + item + '</span>';
                li.classList.add('unlocked-item');
            } else {
                li.innerHTML = '<span>🔒 ' + item + '</span>';
            }
            unlockItemsList.appendChild(li);
        });
        
        unlockCountElement.textContent = serviceConfig.lockedItems.length;
    }
}

// 显示预测者信息
export function displayPredictorInfo() {
    const predictorInfoGrid = document.getElementById('predictor-info-grid');
    if (!predictorInfoGrid || !STATE.userData) return;
    
    predictorInfoGrid.innerHTML = '';
    
    const infoItems = [
        { label: '姓名', value: STATE.userData.name },
        { label: '性别', value: STATE.userData.gender },
        { label: '出生时间', value: `${STATE.userData.birthYear}年${STATE.userData.birthMonth}月${STATE.userData.birthDay}日 ${STATE.userData.birthHour}时${STATE.userData.birthMinute}分` },
        { label: '出生城市', value: STATE.userData.birthCity },
        { label: '测算服务', value: STATE.currentService },
        { label: '测算时间', value: formatDate() }
    ];
    
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
    if (!baziGrid || !STATE.baziData) return;
    
    baziGrid.innerHTML = '';
    
    const columns = [
        { label: '年柱', value: STATE.baziData.yearColumn, element: STATE.baziData.yearElement },
        { label: '月柱', value: STATE.baziData.monthColumn, element: STATE.baziData.monthElement },
        { label: '日柱', value: STATE.baziData.dayColumn, element: STATE.baziData.dayElement },
        { label: '时柱', value: STATE.baziData.hourColumn, element: STATE.baziData.hourElement }
    ];
    
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
    if (!freeAnalysisText) return;
    
    // 简单处理：显示前2000字符
    const displayContent = result.substring(0, 2000) + (result.length > 2000 ? '...' : '');
    freeAnalysisText.innerHTML = `<div class="analysis-content">${displayContent.replace(/\n/g, '<br>')}</div>`;
    
    // 保存完整结果
    const lockedAnalysisText = document.getElementById('locked-analysis-text');
    if (lockedAnalysisText) {
        lockedAnalysisText.innerHTML = `<div class="analysis-content">${result.substring(2000).replace(/\n/g, '<br>')}</div>`;
    }
}

// 显示支付弹窗
export async function showPaymentModal() {
    console.log('显示支付弹窗...');
    
    const serviceConfig = SERVICES[STATE.currentService];
    if (!serviceConfig) return;
    
    try {
        const paymentModal = document.getElementById('payment-modal');
        if (paymentModal) {
            paymentModal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
        
        // 这里应该是调用您的支付接口
        // 暂时使用模拟数据
        const orderId = 'ORD' + Date.now();
        STATE.currentOrderId = orderId;
        
        const paymentOrderId = document.getElementById('payment-order-id');
        const paymentAmount = document.getElementById('payment-amount');
        const paymentServiceType = document.getElementById('payment-service-type');
        
        if (paymentOrderId) paymentOrderId.textContent = orderId;
        if (paymentAmount) paymentAmount.textContent = '¥' + serviceConfig.price;
        if (paymentServiceType) paymentServiceType.textContent = STATE.currentService;
        
    } catch (error) {
        console.error('支付失败:', error);
        alert('支付失败，请稍后重试');
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
    
    const lockIcon = lockedOverlay.querySelector('.lock-icon');
    const headerTitle = lockedOverlay.querySelector('h4');
    
    if (lockIcon) lockIcon.textContent = '✅';
    if (headerTitle) headerTitle.textContent = '完整报告已解锁';
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

// 解锁下载按钮
export function unlockDownloadButton() {
    console.log('🔓 解锁下载按钮');
    
    const downloadBtn = document.getElementById('download-report-btn');
    if (!downloadBtn) {
        console.error('找不到下载按钮');
        return;
    }
    
    downloadBtn.disabled = false;
    downloadBtn.classList.remove('download-btn-locked');
    downloadBtn.style.cssText = `
        background: linear-gradient(135deg, #1677FF, #4096ff) !important;
        box-shadow: 0 4px 15px rgba(58, 123, 213, 0.4) !important;
        cursor: pointer !important;
        opacity: 1 !important;
    `;
    
    STATE.isDownloadLocked = false;
    console.log('✅ 下载按钮已解锁');
}

// 重置解锁界面
export function resetUnlockInterface() {
    const lockedOverlay = document.getElementById('locked-overlay');
    if (!lockedOverlay) return;
    
    const lockIcon = lockedOverlay.querySelector('.lock-icon');
    const headerTitle = lockedOverlay.querySelector('h4');
    
    if (lockIcon) lockIcon.textContent = '🔒';
    if (headerTitle) headerTitle.textContent = '完整内容已锁定';
}

// 按钮拉伸动画
export function animateButtonStretch() {
    const button = document.getElementById('analyze-btn');
    if (!button) return;
    
    button.classList.add('stretching');
    setTimeout(() => button.classList.remove('stretching'), 800);
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
        analysisResultSection.scrollIntoView({ behavior: 'smooth' });
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
    
    requiredFields.forEach(field => {
        const element = document.getElementById(field.id);
        const error = document.getElementById(field.errorId);
        
        if (element && error) {
            if (!element.value) {
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
    
    console.log('用户数据收集完成:', STATE.userData);
}
