// 反馈表单管理
let feedbackModal = null;
let feedbackOverlay = null;

// 初始化反馈表单
function initFeedbackForm() {
    createFeedbackModal();
    bindFeedbackEvents();
}

// 创建反馈弹窗DOM
function createFeedbackModal() {
    // 避免重复创建
    if (document.getElementById('feedback-modal')) return;

    const modalHTML = `
    <div id="feedback-modal" class="modal" style="display: none; z-index: 2000;">
        <div class="modal-content feedback-modal-content">
            <span id="close-feedback" class="close">&times;</span>
            <h3 style="color: var(--primary-color); text-align: center; margin-bottom: 20px; font-size: 18px;">
                📝 报告反馈
            </h3>

            <form id="feedback-form">
                <div class="feedback-type-group">
                    <label class="feedback-type-label">反馈类型</label>
                    <div class="feedback-type-buttons">
                        <button type="button" class="feedback-type-btn" data-type="好评">
                            <span class="feedback-emoji">😊</span>
                            <span>好评</span>
                        </button>
                        <button type="button" class="feedback-type-btn" data-type="中评">
                            <span class="feedback-emoji">😐</span>
                            <span>中评</span>
                        </button>
                        <button type="button" class="feedback-type-btn" data-type="差评">
                            <span class="feedback-emoji">😞</span>
                            <span>差评</span>
                        </button>
                        <button type="button" class="feedback-type-btn" data-type="纠错">
                            <span class="feedback-emoji">🔧</span>
                            <span>纠错</span>
                        </button>
                        <button type="button" class="feedback-type-btn" data-type="建议">
                            <span class="feedback-emoji">💡</span>
                            <span>建议</span>
                        </button>
                        <button type="button" class="feedback-type-btn" data-type="其他">
                            <span class="feedback-emoji">📝</span>
                            <span>其他</span>
                        </button>
                    </div>
                </div>

                <div id="rating-section" class="feedback-rating-section" style="display: none;">
                    <label class="feedback-rating-label">请评分</label>
                    <div class="rating-stars">
                        <span class="star" data-rating="1">☆</span>
                        <span class="star" data-rating="2">☆</span>
                        <span class="star" data-rating="3">☆</span>
                        <span class="star" data-rating="4">☆</span>
                        <span class="star" data-rating="5">☆</span>
                    </div>
                    <span id="rating-text" class="rating-text">未评分</span>
                </div>

                <div class="form-group feedback-content-group">
                    <label for="feedback-content" class="required">反馈内容</label>
                    <textarea id="feedback-content" rows="5" maxlength="2000"
                        placeholder="请详细描述您的反馈意见，我们会认真处理..."
                        style="width: 100%; padding: 12px; border: 1px solid var(--border-color);
                               border-radius: 8px; font-size: 14px; resize: vertical;
                               background: var(--input-bg); color: var(--text-color);"></textarea>
                    <div class="char-count"><span id="char-count">0</span>/2000</div>
                </div>

                <div class="form-group">
                    <label for="feedback-contact">联系方式（选填）</label>
                    <input type="text" id="feedback-contact" placeholder="手机号或微信号" maxlength="100"
                        style="width: 100%; padding: 12px; border: 1px solid var(--border-color);
                               border-radius: 8px; font-size: 14px;
                               background: var(--input-bg); color: var(--text-color);">
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <button type="submit" class="dynamic-pulse-btn" id="submit-feedback-btn"
                        style="max-width: 200px; padding: 12px 30px; font-size: 16px;">
                        <span>提交反馈</span>
                    </button>
                </div>
            </form>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    feedbackModal = document.getElementById('feedback-modal');

    // 添加样式
    addFeedbackStyles();
}

// 添加反馈表单样式
function addFeedbackStyles() {
    const styleId = 'feedback-styles';
    if (document.getElementById(styleId)) return;

    const styles = `
    .feedback-modal-content {
        max-width: 500px;
        max-height: 90vh;
        overflow-y: auto;
        padding: 25px;
    }

    .feedback-type-group {
        margin-bottom: 20px;
    }

    .feedback-type-label {
        display: block;
        margin-bottom: 10px;
        font-weight: 600;
        color: var(--text-color);
    }

    .feedback-type-buttons {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 10px;
    }

    .feedback-type-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 12px 8px;
        border: 2px solid var(--border-color);
        border-radius: 10px;
        background: var(--card-bg);
        cursor: pointer;
        transition: all 0.3s ease;
        color: var(--text-color);
    }

    .feedback-type-btn:hover {
        border-color: var(--primary-color);
        transform: scale(1.02);
    }

    .feedback-type-btn.selected {
        border-color: var(--primary-color);
        background: var(--primary-color);
        color: white;
    }

    .feedback-type-btn .feedback-emoji {
        font-size: 24px;
        margin-bottom: 5px;
    }

    .feedback-type-btn span:last-child {
        font-size: 13px;
    }

    .feedback-rating-section {
        margin-bottom: 20px;
        text-align: center;
    }

    .feedback-rating-label {
        display: block;
        margin-bottom: 10px;
        font-weight: 600;
        color: var(--text-color);
    }

    .rating-stars {
        font-size: 32px;
        cursor: pointer;
        margin-bottom: 5px;
    }

    .star {
        color: #ddd;
        transition: color 0.2s;
    }

    .star.active {
        color: #f5b50a;
    }

    .star:hover {
        color: #f5b50a;
    }

    .rating-text {
        font-size: 14px;
        color: var(--muted-text);
    }

    .char-count {
        text-align: right;
        font-size: 12px;
        color: var(--muted-text);
        margin-top: 5px;
    }

    body.dark-theme .feedback-type-btn {
        background: var(--card-bg);
        border-color: var(--border-color);
    }

    body.dark-theme .feedback-type-btn.selected {
        background: var(--primary-color);
    }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
}

// 绑定反馈事件
function bindFeedbackEvents() {
    const closeBtn = document.getElementById('close-feedback');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeFeedbackModal);
    }

    window.addEventListener('click', (e) => {
        if (e.target === feedbackModal) {
            closeFeedbackModal();
        }
    });

    // 反馈类型按钮
    document.querySelectorAll('.feedback-type-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.feedback-type-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');

            const type = this.dataset.type;
            const ratingSection = document.getElementById('rating-section');
            if (type === '好评' || type === '中评' || type === '差评') {
                ratingSection.style.display = 'block';
            } else {
                ratingSection.style.display = 'none';
            }
        });
    });

    // 星级评分
    document.querySelectorAll('.star').forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.dataset.rating);
            setRating(rating);
        });

        star.addEventListener('mouseenter', function() {
            const rating = parseInt(this.dataset.rating);
            highlightStars(rating);
        });
    });

    document.querySelector('.rating-stars').addEventListener('mouseleave', () => {
        const selected = document.querySelector('.star.selected');
        if (selected) {
            setRating(parseInt(selected.dataset.rating));
        } else {
            resetStars();
        }
    });

    // 字数统计
    const feedbackContent = document.getElementById('feedback-content');
    if (feedbackContent) {
        feedbackContent.addEventListener('input', function() {
            document.getElementById('char-count').textContent = this.value.length;
        });
    }

    // 提交表单
    const form = document.getElementById('feedback-form');
    if (form) {
        form.addEventListener('submit', submitFeedback);
    }
}

// 显示反馈弹窗
function showFeedbackModal() {
    if (!feedbackModal) {
        initFeedbackForm();
    }

    // 重置表单
    resetFeedbackForm();

    feedbackModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭反馈弹窗
function closeFeedbackModal() {
    if (feedbackModal) {
        feedbackModal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// 重置反馈表单
function resetFeedbackForm() {
    document.querySelectorAll('.feedback-type-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.star').forEach(s => s.classList.remove('active'));
    document.getElementById('rating-text').textContent = '未评分';
    document.getElementById('rating-section').style.display = 'none';
    document.getElementById('feedback-content').value = '';
    document.getElementById('feedback-contact').value = '';
    document.getElementById('char-count').textContent = '0';
}

// 设置评分
function setRating(rating) {
    document.querySelectorAll('.star').forEach(s => {
        s.classList.remove('active');
        s.textContent = '☆';
    });

    for (let i = 1; i <= rating; i++) {
        const star = document.querySelector(`.star[data-rating="${i}"]`);
        if (star) {
            star.classList.add('active');
            star.textContent = '★';
        }
    }

    const ratingTexts = ['', '很差', '较差', '一般', '较好', '很好'];
    document.getElementById('rating-text').textContent = ratingTexts[rating] || '未评分';
}

// 高亮星星
function highlightStars(rating) {
    document.querySelectorAll('.star').forEach(s => {
        s.classList.remove('active');
        s.textContent = '☆';
    });

    for (let i = 1; i <= rating; i++) {
        const star = document.querySelector(`.star[data-rating="${i}"]`);
        if (star) {
            star.classList.add('active');
            star.textContent = '★';
        }
    }
}

// 重置星星
function resetStars() {
    document.querySelectorAll('.star').forEach(s => {
        s.classList.remove('active');
        s.textContent = '☆';
    });
}

// 提交反馈
async function submitFeedback(e) {
    e.preventDefault();

    const selectedType = document.querySelector('.feedback-type-btn.selected');
    if (!selectedType) {
        alert('请选择反馈类型');
        return;
    }

    const feedbackType = selectedType.dataset.type;
    const content = document.getElementById('feedback-content').value.trim();
    if (!content) {
        alert('请输入反馈内容');
        return;
    }

    const ratingEl = document.querySelector('.star.selected');
    const rating = ratingEl ? parseInt(ratingEl.dataset.rating) : null;

    const contact = document.getElementById('feedback-contact').value.trim();

    const submitBtn = document.getElementById('submit-feedback-btn');
    submitBtn.disabled = true;
    submitBtn.querySelector('span').textContent = '提交中...';

    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': window.API_KEY || ''
            },
            body: JSON.stringify({
                feedbackType,
                content,
                rating,
                contact,
                orderId: window.STATE?.lastAiOrderId || null,
                serviceType: window.STATE?.currentService || null
            })
        });

        const result = await response.json();

        if (result.success) {
            alert('✅ ' + result.message);
            closeFeedbackModal();
        } else {
            alert('❌ ' + (result.message || '提交失败'));
        }
    } catch (error) {
        console.error('提交反馈失败:', error);
        alert('网络错误，请稍后重试');
    } finally {
        submitBtn.disabled = false;
        submitBtn.querySelector('span').textContent = '提交反馈';
    }
}

// 导出
window.initFeedbackForm = initFeedbackForm;
window.showFeedbackModal = showFeedbackModal;
