/**
 * 页面级增强：今日锦囊、移动端快捷 CTA、FAQ 折叠无障细节
 */
const DAILY_TIPS = [
    '《易经》有言：天行健，君子以自强不息——趋势可作参考，脚步仍在自己脚下。',
    '八字重「平衡」：知所长、亦知所短，便是最好的趋吉避凶。',
    '流年看的是节奏：顺境多积淀，逆境多守常，心定则事缓则圆。',
    '合婚重在「相处」：命理提示差异，沟通与尊重才是长久之道。',
    '子时与真太阳时会影响时辰，若出生在时辰交界，可对照出生证明再核一次。',
    '同一八字，不同时代与地域，际遇不同；报告是视角，不是判决书。',
    '阅读报告时建议记下 1～2 条最有共鸣的点，比「全盘背诵」更有用。',
    '免费部分先看格局与性格摘要，再决定是否解锁深度章节，更省心。',
    '支付完成后若页面未自动解锁，点「我已支付」即可向服务器再次确认。',
    '若有疑问，保存订单号并联系客服微信，便于快速核对。'
];

function tipIndexForToday() {
    const n = new Date();
    const key = n.getFullYear() * 10000 + (n.getMonth() + 1) * 100 + n.getDate();
    return key % DAILY_TIPS.length;
}

function initDailyInsight() {
    const el = document.getElementById('daily-insight-text');
    if (!el) return;
    el.textContent = DAILY_TIPS[tipIndexForToday()];
}

function initMobileStickyCta() {
    const bar = document.getElementById('mobile-sticky-cta');
    const btn = document.getElementById('mobile-sticky-cta-btn');
    if (!bar || !btn) return;

    const mq = window.matchMedia('(max-width: 768px)');
    const analyzeBtn = document.getElementById('analyze-btn');
    const infoSection = document.querySelector('.info-section');

    function scrollToForm() {
        const target = infoSection || analyzeBtn;
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            analyzeBtn?.focus({ preventScroll: true });
        }
    }

    btn.addEventListener('click', scrollToForm);

    function anyModalOpen() {
        return ['payment-modal', 'loading-modal'].some((id) => {
            const el = document.getElementById(id);
            return el && window.getComputedStyle(el).display !== 'none';
        });
    }

    function updateVisibility() {
        if (!mq.matches) {
            bar.hidden = true;
            return;
        }
        const y = window.scrollY || document.documentElement.scrollTop;
        bar.hidden = anyModalOpen() || y < 120;
    }

    window.addEventListener('scroll', updateVisibility, { passive: true });
    mq.addEventListener('change', updateVisibility);
    updateVisibility();
}

function initFaqDetails() {
    document.querySelectorAll('.faq-compact details').forEach((d) => {
        d.addEventListener('toggle', () => {
            if (!d.open) return;
            document.querySelectorAll('.faq-compact details').forEach((other) => {
                if (other !== d) other.removeAttribute('open');
            });
        });
    });
}

export function initPageEnhancements() {
    initDailyInsight();
    initMobileStickyCta();
    initFaqDetails();
}
