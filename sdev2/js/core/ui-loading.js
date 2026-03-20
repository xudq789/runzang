// ============ 【加载相关功能模块】 ============
/**
 * 加载弹窗、进度条动画等功能
 */

import { hideElement, showElement } from './utils.js';
import { UI, PROGRESS_STEPS } from './ui-elements.js';
import { STATE } from './config.js';

// 进度条总时长（秒），整条跑完的时间
const PROGRESS_TOTAL_SECONDS = 45;

// 显示加载弹窗（简洁版进度条）
export function showLoadingModal() {
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
                        润藏八字正在为您进行深度命理分析，预计1分钟左右...
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
    const stepDuration = (PROGRESS_TOTAL_SECONDS * 1000) / totalSteps; // 每步均分 45 秒
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
        const updateInterval = 50;
        
        clearInterval(stepInterval);
        
        stepInterval = setInterval(() => {
            const elapsed = Date.now() - stepStartTime;
            progress = Math.min(100, (elapsed / stepDuration) * 100);
            
            if (progressBar) {
                progressBar.style.width = progress + '%';
            }
            
            if (progress >= 100) {
                clearInterval(stepInterval);
                updateStepIndicator(currentStep, 'completed');
                
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
        
        for (let i = 0; i < totalSteps; i++) {
            updateStepIndicator(i, 'completed');
        }
    }
    
    let stepStartTime = Date.now();
    updateNextStepHint();
    startCurrentStep();
    
    window.simpleProgress = {
        clear: () => clearInterval(stepInterval)
    };
}

// 强制完成进度条（当分析结果提前返回时调用）
export function forceCompleteProgressBar() {
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

// 隐藏加载弹窗（清理进度动画）
export function hideLoadingModal() {
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
        
        hideElement(loadingModal);
        document.body.style.overflow = 'auto';
        
        setTimeout(() => {
            delete window.loadingModalHiding;
        }, 100);
    }
}
