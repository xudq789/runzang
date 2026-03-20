// ============ 【UI 控制模块 - 入口文件】 ============
/**
 * UI 模块的统一入口
 * 从各个子模块导入并重新导出所有功能
 */

// ============ 【导入子模块】 ============

// UI 元素和配置
export { UI, PROGRESS_STEPS } from './ui-elements.js';

// 表单相关
export {
    initFormOptions,
    setDefaultValues,
    validateForm,
    collectUserData,
    resetFormErrors
} from './ui-form.js';

// 显示相关
export {
    updateServiceDisplay,
    updateUnlockInfo,
    displayPredictorInfo,
    displayBaziPan,
    displayDayunPan,
    processAndDisplayAnalysis,
    showFullAnalysisContent,
    showAnalysisResult,
    hideAnalysisResult
} from './ui-display.js';

// 支付弹窗相关
export {
    showPaymentModal,
    closePaymentModal
} from './ui-payment.js';

// 解锁界面相关
export {
    updateUnlockInterface,
    lockDownloadButton,
    unlockDownloadButton,
    resetUnlockInterface
} from './ui-unlock.js';

// 加载相关
export {
    showLoadingModal,
    hideLoadingModal,
    forceCompleteProgressBar
} from './ui-loading.js';

// UI 工具
export {
    animateButtonStretch
} from './ui-utils.js';
