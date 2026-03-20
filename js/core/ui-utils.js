// ============ 【UI工具函数模块】 ============
/**
 * UI相关的工具函数和动画效果
 */

import { UI } from './ui-elements.js';

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
