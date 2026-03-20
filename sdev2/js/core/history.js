// ============ 【历史记录管理模块】 ============
/**
 * 历史记录相关功能：渲染历史列表、切换视图等
 */

import { RunzangStorage, PreferenceStorage } from './storage.js';
import { STATE } from './config.js';

const SERVICE_NAMES = ['测算验证', '流年运程', '人生详批', '八字合婚'];

/**
 * 创建历史记录管理器
 * @param {object} uiFunctions - UI更新函数
 * @returns {object} 历史记录管理器
 */
export function createHistoryManager(uiFunctions) {
    const {
        updateServiceDisplay,
        updateUnlockInterface,
        unlockDownloadButton,
        showFullAnalysisContent,
        PaymentManager
    } = uiFunctions;

    /**
     * 渲染历史记录列表
     */
    /**
     * 格式化时间为 "MM-DD HH:mm" 格式
     */
    function formatDateTime(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${month}-${day} ${hours}:${minutes}`;
    }
    
    /**
     * 截取订单号显示（保留前缀+后6位）
     */
    function formatOrderId(orderId) {
        if (!orderId || orderId.length < 10) return orderId;
        // 例如：RZCSYZ202602051140256822496 -> RZCSYZ...822496
        const prefix = orderId.substring(0, 6);
        const suffix = orderId.substring(orderId.length - 6);
        return `${prefix}...${suffix}`;
    }
    
    function renderHistoryLists() {
        const orders = RunzangStorage.getPaidOrders();
        SERVICE_NAMES.forEach(serviceType => {
            const listEl = document.getElementById('history-list-' + serviceType);
            if (!listEl) return;
            const items = orders.filter(o => o.serviceType === serviceType);
            listEl.innerHTML = items.length
                ? items.map(o => {
                    const timeStr = formatDateTime(o.createdAt);
                    const orderIdDisplay = formatOrderId(o.orderId);
                    return `<li class="history-order-item" data-service="${serviceType}" data-order-id="${o.orderId}">
                        <div class="history-order-content">
                            <div class="history-order-header">
                                <span class="history-order-time">${timeStr}</span>
                            </div>
                            <span class="history-order-summary">${(o.userInputSummary || '—').substring(0, 60)}${(o.userInputSummary || '').length > 60 ? '…' : ''}</span>
                            <div class="history-order-id-row">
                                <span class="history-order-id">${orderIdDisplay}</span>
                                <button class="history-copy-btn" data-order-id="${o.orderId}" title="复制完整订单号">
                                    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                        <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                                        <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <button class="history-delete-btn" data-service="${serviceType}" data-order-id="${o.orderId}" title="删除记录">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                            </svg>
                        </button>
                    </li>`;
                }).join('')
                : '<li class="history-order-empty">暂无记录</li>';
            
            // 绑定复制按钮事件
            listEl.querySelectorAll('.history-copy-btn').forEach(copyBtn => {
                copyBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止冒泡，避免触发 li 的点击
                    e.preventDefault();
                    
                    const orderId = copyBtn.dataset.orderId;
                    
                    // 复制到剪贴板
                    navigator.clipboard.writeText(orderId).then(() => {
                        // 显示复制成功提示
                        const originalHTML = copyBtn.innerHTML;
                        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                        </svg>`;
                        copyBtn.style.color = '#52c41a';
                        
                        setTimeout(() => {
                            copyBtn.innerHTML = originalHTML;
                            copyBtn.style.color = '';
                        }, 1500);
                    }).catch(err => {
                        console.error('复制失败:', err);
                        alert('复制失败，请手动复制');
                    });
                });
            });
            
            // 绑定删除按钮事件
            listEl.querySelectorAll('.history-delete-btn').forEach(deleteBtn => {
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation(); // 阻止冒泡，避免触发 li 的点击
                    e.preventDefault();
                    
                    const serviceType = deleteBtn.dataset.service;
                    const orderId = deleteBtn.dataset.orderId;
                    
                    if (confirm('确定要删除这条历史记录吗？')) {
                        // 删除订单数据
                        const success = RunzangStorage.deleteOrder(serviceType, orderId);
                        
                        if (success) {
                            console.log('✅ 已删除历史记录:', serviceType, orderId);
                            
                            // 检查是否还有剩余记录
                            const remainingOrders = RunzangStorage.getPaidOrders();
                            
                            if (remainingOrders.length === 0) {
                                console.log('📭 没有历史记录了，切换到第一个服务');
                                // 如果没有记录了，切换到第一个服务
                                location.hash = '';
                                // 需要从 main.js 调用 switchToService，这里通过事件触发
                                const firstServiceLink = document.querySelector('.service-nav a[data-service]');
                                if (firstServiceLink) {
                                    firstServiceLink.click();
                                }
                            } else {
                                // 重新渲染历史记录列表
                                renderHistoryLists();
                                // 更新导航栏可见性
                                updateHistoryNavVisibility();
                            }
                        } else {
                            alert('删除失败，请重试');
                        }
                    }
                });
            });
            
            // 绑定历史记录项点击事件
            listEl.querySelectorAll('.history-order-item').forEach(li => {
                li.addEventListener('click', async () => {
                    const serviceType = li.dataset.service;
                    const orderId = li.dataset.orderId;
                    RunzangStorage.setCurrentOrder(serviceType, orderId);
                    STATE.currentService = serviceType;
                    STATE.lastAiOrderId = orderId;
                    
                    // 先切换视图，隐藏历史记录页面
                    location.hash = '';
                    
                    // 手动控制页面显示，不使用 applyHashView()
                    const seamless = document.querySelector('.seamless-container');
                    const resultSection = document.getElementById('analysis-result-section');
                    const historySection = document.getElementById('history-section');
                    
                    console.log('🔍 [历史记录] 页面元素状态检查:');
                    console.log('  - historySection:', historySection ? '存在' : '不存在');
                    console.log('  - seamless:', seamless ? '存在' : '不存在');
                    console.log('  - resultSection:', resultSection ? '存在' : '不存在', resultSection?.style.display);
                    
                    if (historySection) {
                        historySection.style.display = 'none';
                        console.log('  ✅ 历史记录区域已隐藏');
                    }
                    if (seamless) {
                        seamless.style.display = 'none';
                        console.log('  ✅ 输入表单已隐藏');
                        // 强制确认隐藏
                        seamless.style.visibility = 'hidden';
                        seamless.style.position = 'absolute';
                        seamless.style.zIndex = '-1';
                        console.log('  ✅ 输入表单已强制隐藏（visibility + position）');
                    }
                    if (resultSection) {
                        resultSection.style.display = 'block';
                        resultSection.style.visibility = 'visible';
                        resultSection.style.position = 'static';
                        resultSection.style.zIndex = 'auto';
                        console.log('  ✅ 结果区域已完全显示，当前 display:', resultSection.style.display);
                    }
                    
                    // ✅ 先设置解锁状态，再恢复分析结果（因为 restoreAnalysis 会调用 updateServiceDisplay）
                    STATE.isPaymentUnlocked = true;
                    STATE.isDownloadLocked = false;
                    
                    // 恢复分析结果
                    const restored = await PaymentManager.restoreAnalysis();
                    console.log('🔍 [历史记录] restoreAnalysis 结果:', restored);
                    
                    if (restored) {
                        // 显示完整内容（包括锁定的部分）
                        if (showFullAnalysisContent) {
                            console.log('🔍 [历史记录] 调用 showFullAnalysisContent');
                            showFullAnalysisContent();
                        }
                        
                        // 隐藏锁定覆盖层和整个锁定内容容器
                        const lockedOverlay = document.getElementById('locked-overlay');
                        const lockedContent = document.getElementById('locked-content');
                        
                        console.log('🔍 [历史记录] lockedOverlay:', lockedOverlay ? '存在' : '不存在', lockedOverlay?.style.display);
                        console.log('🔍 [历史记录] lockedContent:', lockedContent ? '存在' : '不存在', lockedContent?.style.display);
                        
                        if (lockedOverlay) {
                            lockedOverlay.style.display = 'none';
                            console.log('  ✅ 锁定覆盖层已隐藏');
                        }
                        
                        // ✅ 隐藏整个 locked-content 容器，避免显示空白框
                        if (lockedContent) {
                            lockedContent.style.display = 'none';
                            console.log('  ✅ 锁定内容容器已隐藏');
                        }
                        
                        // 检查内容元素
                        const freeAnalysisText = document.getElementById('free-analysis-text');
                        const lockedAnalysisText = document.getElementById('locked-analysis-text');
                        console.log('🔍 [历史记录] 内容元素检查:');
                        console.log('  - freeAnalysisText:', freeAnalysisText ? '存在' : '不存在', freeAnalysisText?.innerHTML?.length, '字符');
                        console.log('  - lockedAnalysisText:', lockedAnalysisText ? '存在' : '不存在', lockedAnalysisText?.innerHTML?.length, '字符');
                        
                        // 检查结果区域的实际显示状态
                        if (resultSection) {
                            const computedStyle = window.getComputedStyle(resultSection);
                            console.log('🔍 [历史记录] resultSection 计算后样式:');
                            console.log('  - display:', computedStyle.display);
                            console.log('  - visibility:', computedStyle.visibility);
                            console.log('  - opacity:', computedStyle.opacity);
                            console.log('  - height:', computedStyle.height);
                            console.log('  - position:', computedStyle.position);
                            console.log('  - zIndex:', computedStyle.zIndex);
                            console.log('  - transform:', computedStyle.transform);
                            
                            // 检查父元素
                            let parent = resultSection.parentElement;
                            let level = 0;
                            console.log('🔍 [历史记录] 检查父元素链:');
                            while (parent && level < 5) {
                                const parentStyle = window.getComputedStyle(parent);
                                console.log(`  - 父元素${level} (${parent.tagName}#${parent.id || 'no-id'}.${parent.className}):`, 
                                    'display:', parentStyle.display,
                                    'visibility:', parentStyle.visibility,
                                    'opacity:', parentStyle.opacity);
                                parent = parent.parentElement;
                                level++;
                            }
                            
                            // 检查是否有元素在上面遮挡
                            const rect = resultSection.getBoundingClientRect();
                            console.log('🔍 [历史记录] resultSection 位置:');
                            console.log('  - top:', rect.top, 'left:', rect.left);
                            console.log('  - width:', rect.width, 'height:', rect.height);
                            console.log('  - 是否在视口内:', rect.top < window.innerHeight && rect.bottom > 0);
                        }
                        
                        // 更新解锁界面
                        if (updateUnlockInterface) {
                            console.log('🔍 [历史记录] 调用 updateUnlockInterface');
                            updateUnlockInterface();
                        }
                        if (unlockDownloadButton) {
                            console.log('🔍 [历史记录] 调用 unlockDownloadButton');
                            unlockDownloadButton();
                        }
                        
                        // ✅ 显示订单号和复制按钮
                        const orderInfo = document.getElementById('order-info');
                        const orderIdElement = document.getElementById('order-id');
                        if (orderInfo && orderIdElement) {
                            orderIdElement.textContent = orderId;
                            orderInfo.style.display = 'block';
                            console.log('✅ [历史记录] 订单号已显示:', orderId);
                            
                            // 绑定复制按钮事件
                            const orderCopyBtn = document.getElementById('order-copy-btn');
                            if (orderCopyBtn) {
                                // 移除旧的监听器（如果有）
                                const newBtn = orderCopyBtn.cloneNode(true);
                                orderCopyBtn.parentNode.replaceChild(newBtn, orderCopyBtn);
                                
                                newBtn.addEventListener('click', () => {
                                    navigator.clipboard.writeText(orderId).then(() => {
                                        const originalHTML = newBtn.innerHTML;
                                        newBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                                        </svg>`;
                                        newBtn.style.color = '#52c41a';
                                        
                                        setTimeout(() => {
                                            newBtn.innerHTML = originalHTML;
                                            newBtn.style.color = '';
                                        }, 1500);
                                    }).catch(err => {
                                        console.error('复制失败:', err);
                                        alert('复制失败，请手动复制');
                                    });
                                });
                            }
                        }
                        
                        // 滚动到结果区域
                        setTimeout(() => {
                            if (resultSection) {
                                console.log('🔍 [历史记录] 准备滚动到结果区域');
                                console.log('  - 当前 scrollY:', window.scrollY);
                                console.log('  - resultSection offsetTop:', resultSection.offsetTop);
                                
                                resultSection.scrollIntoView({ behavior: 'smooth' });
                                
                                // 滚动完成后再次检查
                                setTimeout(() => {
                                    console.log('🔍 [历史记录] 滚动后检查:');
                                    console.log('  - 新的 scrollY:', window.scrollY);
                                    const rect = resultSection.getBoundingClientRect();
                                    console.log('  - resultSection 在视口位置:', rect.top, '到', rect.bottom);
                                    console.log('  - 视口高度:', window.innerHeight);
                                    console.log('  - 是否可见:', rect.top < window.innerHeight && rect.bottom > 0);
                                    
                                    // 强制刷新显示
                                    resultSection.style.display = 'none';
                                    resultSection.offsetHeight; // 触发重排
                                    resultSection.style.display = 'block';
                                    console.log('  ✅ 已强制刷新 resultSection 显示');
                                    
                                    // 再次检查刷新后的状态
                                    setTimeout(() => {
                                        const afterRect = resultSection.getBoundingClientRect();
                                        console.log('🔍 [历史记录] 强制刷新后状态:');
                                        console.log('  - height:', afterRect.height);
                                        console.log('  - top:', afterRect.top, 'bottom:', afterRect.bottom);
                                        console.log('  - computed height:', window.getComputedStyle(resultSection).height);
                                        
                                        if (afterRect.height === 0) {
                                            console.error('❌ [历史记录] 元素高度仍然为 0，可能内容被清空了');
                                            // 检查子元素
                                            console.log('  - resultSection.children.length:', resultSection.children.length);
                                            console.log('  - resultSection.innerHTML.length:', resultSection.innerHTML.length);
                                        }
                                    }, 100);
                                }, 1000);
                            }
                        }, 100);
                    } else {
                        console.error('❌ [历史记录] restoreAnalysis 失败');
                    }
                    
                    // 更新导航状态（清除历史记录的 active，恢复服务导航的 active）
                    document.querySelectorAll('.service-nav a').forEach(link => {
                        if (link.id === 'nav-history') {
                            link.classList.remove('active');
                        } else if (link.dataset.service === serviceType) {
                            link.classList.add('active');
                        } else {
                            link.classList.remove('active');
                        }
                    });
                });
            });
        });
    }

    /**
     * 应用 hash 视图切换
     */
    function applyHashView() {
        const isHistory = location.hash === '#history';
        const seamless = document.querySelector('.seamless-container');
        const resultSection = document.getElementById('analysis-result-section');
        const historySection = document.getElementById('history-section');
        if (seamless) seamless.style.display = isHistory ? 'none' : '';
        if (resultSection) resultSection.style.display = isHistory ? 'none' : '';
        if (historySection) {
            historySection.style.display = isHistory ? 'block' : 'none';
            if (isHistory) renderHistoryLists();
        }
        
        // 更新导航状态
        document.querySelectorAll('.service-nav a').forEach(link => {
            if (isHistory) {
                // 在历史记录页面，清除所有服务导航的 active，只保留历史记录的 active
                if (link.id === 'nav-history') {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            } else {
                // 不在历史记录页面，移除历史记录的 active
                if (link.id === 'nav-history') {
                    link.classList.remove('active');
                }
            }
        });
        
        updateHistoryNavVisibility();
    }

    /**
     * 更新历史导航可见性
     */
    function updateHistoryNavVisibility() {
        const wrap = document.getElementById('nav-history-wrap');
        if (!wrap) return;
        const hasRecords = RunzangStorage.getPaidOrders().length > 0;
        wrap.style.display = hasRecords ? '' : 'none';
    }

    return {
        renderHistoryLists,
        applyHashView,
        updateHistoryNavVisibility
    };
}

/**
 * 获取上次选中的服务
 * @param {object} SERVICES - 服务配置对象
 * @returns {string} 服务名称
 */
export function getLastSelectedService(SERVICES) {
    const lastTab = PreferenceStorage.getLastSelectedService();
    return (lastTab && SERVICES[lastTab]) ? lastTab : '测算验证';
}

/**
 * 设置上次选中的服务
 * @param {string} serviceName - 服务名称
 */
export function setLastSelectedService(serviceName) {
    PreferenceStorage.setLastSelectedService(serviceName);
}
