// ============ 【统一存储管理模块】 ============
/**
 * 统一管理所有 localStorage 操作
 * 避免在代码中直接调用 localStorage.setItem/getItem/removeItem
 */

const STORAGE_KEYS = {
    // 支付相关
    PAYMENT_DATA: 'alipay_payment_data',
    PAID_ORDER_ID: 'paid_order_id',
    
    // 分析结果相关（旧版兼容）
    LAST_ANALYSIS_RESULT: 'last_analysis_result',
    LAST_ANALYSIS_SERVICE: 'last_analysis_service',
    LAST_USER_DATA: 'last_user_data',
    LAST_PARTNER_DATA: 'last_partner_data',
    LAST_ORDER_ID: 'last_order_id',
    LAST_SELECTED_SERVICE: 'last_selected_service',
    
    // Runzang 存储前缀
    RUNZANG_PREFIX: 'runzang_'
};

// ============ 【基础存储操作】 ============
const Storage = {
    /**
     * 安全地设置 localStorage 值
     * @param {string} key - 存储键
     * @param {any} value - 存储值（会自动 JSON.stringify）
     */
    set(key, value) {
        try {
            const serialized = typeof value === 'string' ? value : JSON.stringify(value);
            localStorage.setItem(key, serialized);
            return true;
        } catch (error) {
            console.warn(`Storage.set failed for key "${key}":`, error);
            return false;
        }
    },
    
    /**
     * 安全地获取 localStorage 值
     * @param {string} key - 存储键
     * @param {any} defaultValue - 默认值（如果不存在或解析失败）
     * @returns {any} 解析后的值或默认值
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            if (item === null) return defaultValue;
            try {
                return JSON.parse(item);
            } catch {
                return item; // 如果不是 JSON，返回原始字符串
            }
        } catch (error) {
            console.warn(`Storage.get failed for key "${key}":`, error);
            return defaultValue;
        }
    },
    
    /**
     * 安全地删除 localStorage 值
     * @param {string} key - 存储键
     */
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Storage.remove failed for key "${key}":`, error);
            return false;
        }
    },
    
    /**
     * 检查 localStorage 中是否存在某个键
     * @param {string} key - 存储键
     * @returns {boolean}
     */
    has(key) {
        return localStorage.getItem(key) !== null;
    }
};

// ============ 【支付数据存储】 ============
const PaymentStorage = {
    /**
     * 获取支付数据
     * @returns {object|null}
     */
    getPaymentData() {
        return Storage.get(STORAGE_KEYS.PAYMENT_DATA, null);
    },
    
    /**
     * 设置支付数据
     * @param {object} paymentData - 支付数据对象
     */
    setPaymentData(paymentData) {
        return Storage.set(STORAGE_KEYS.PAYMENT_DATA, paymentData);
    },
    
    /**
     * 清除支付数据
     */
    clearPaymentData() {
        return Storage.remove(STORAGE_KEYS.PAYMENT_DATA);
    },
    
    /**
     * 获取已支付的订单ID
     * @returns {string|null}
     */
    getPaidOrderId() {
        return Storage.get(STORAGE_KEYS.PAID_ORDER_ID, null);
    },
    
    /**
     * 设置已支付的订单ID
     * @param {string} orderId - 订单ID
     */
    setPaidOrderId(orderId) {
        return Storage.set(STORAGE_KEYS.PAID_ORDER_ID, orderId);
    }
};

// ============ 【分析结果存储（旧版兼容）】 ============
const AnalysisStorage = {
    /**
     * 获取上次分析结果
     * @returns {string|null}
     */
    getLastAnalysisResult() {
        return Storage.get(STORAGE_KEYS.LAST_ANALYSIS_RESULT, null);
    },
    
    /**
     * 设置上次分析结果
     * @param {string} content - 分析内容
     */
    setLastAnalysisResult(content) {
        return Storage.set(STORAGE_KEYS.LAST_ANALYSIS_RESULT, content);
    },
    
    /**
     * 获取上次分析服务
     * @returns {string|null}
     */
    getLastAnalysisService() {
        return Storage.get(STORAGE_KEYS.LAST_ANALYSIS_SERVICE, null);
    },
    
    /**
     * 设置上次分析服务
     * @param {string} service - 服务名称
     */
    setLastAnalysisService(service) {
        return Storage.set(STORAGE_KEYS.LAST_ANALYSIS_SERVICE, service);
    },
    
    /**
     * 获取上次用户数据
     * @returns {object|null}
     */
    getLastUserData() {
        return Storage.get(STORAGE_KEYS.LAST_USER_DATA, null);
    },
    
    /**
     * 设置上次用户数据
     * @param {object} userData - 用户数据
     */
    setLastUserData(userData) {
        return Storage.set(STORAGE_KEYS.LAST_USER_DATA, userData);
    },
    
    /**
     * 获取上次伴侣数据
     * @returns {object|null}
     */
    getLastPartnerData() {
        return Storage.get(STORAGE_KEYS.LAST_PARTNER_DATA, null);
    },
    
    /**
     * 设置上次伴侣数据
     * @param {object} partnerData - 伴侣数据
     */
    setLastPartnerData(partnerData) {
        return Storage.set(STORAGE_KEYS.LAST_PARTNER_DATA, partnerData);
    },
    
    /**
     * 获取上次订单ID
     * @returns {string|null}
     */
    getLastOrderId() {
        return Storage.get(STORAGE_KEYS.LAST_ORDER_ID, null);
    },
    
    /**
     * 设置上次订单ID
     * @param {string} orderId - 订单ID
     */
    setLastOrderId(orderId) {
        return Storage.set(STORAGE_KEYS.LAST_ORDER_ID, orderId);
    }
};

// ============ 【Runzang 存储（按服务+订单号）】 ============
const RunzangStorage = {
    PREFIX: STORAGE_KEYS.RUNZANG_PREFIX,
    
    /**
     * 获取当前查看的订单
     * @returns {object|null} { serviceType, orderId } 或 null
     */
    getCurrentOrder() {
        return Storage.get(this.PREFIX + 'current', null);
    },
    
    /**
     * 设置当前查看的订单
     * @param {string} serviceType - 服务类型
     * @param {string} orderId - 订单ID
     */
    setCurrentOrder(serviceType, orderId) {
        return Storage.set(this.PREFIX + 'current', { serviceType, orderId });
    },
    
    /**
     * 清除当前订单
     */
    clearCurrentOrder() {
        return Storage.remove(this.PREFIX + 'current');
    },
    
    /**
     * 生成结果存储键
     * @param {string} serviceType - 服务类型
     * @param {string} orderId - 订单ID
     * @returns {string}
     */
    resultKey(serviceType, orderId) {
        return this.PREFIX + 'result_' + serviceType + '_' + orderId;
    },
    
    /**
     * 获取分析结果
     * @param {string} serviceType - 服务类型
     * @param {string} orderId - 订单ID
     * @returns {object|null} { content, userData, partnerData, createdAt } 或 null
     */
    getResult(serviceType, orderId) {
        return Storage.get(this.resultKey(serviceType, orderId), null);
    },
    
    /**
     * 设置分析结果
     * @param {string} serviceType - 服务类型
     * @param {string} orderId - 订单ID
     * @param {object} data - { content, userData, partnerData, createdAt }
     */
    setResult(serviceType, orderId, data) {
        const payload = {
            content: data.content,
            userData: data.userData || {},
            partnerData: data.partnerData || null,
            createdAt: data.createdAt || new Date().toISOString()
        };
        return Storage.set(this.resultKey(serviceType, orderId), payload);
    },
    
    /**
     * 获取已支付订单列表
     * @returns {Array} 订单列表
     */
    getPaidOrders() {
        return Storage.get(this.PREFIX + 'paid_orders', []);
    },
    
    /**
     * 添加已支付订单
     * @param {object} entry - { orderId, serviceType, createdAt, userInputSummary }
     */
    addPaidOrder(entry) {
        const list = this.getPaidOrders();
        // 检查是否已存在
        if (list.some(o => o.orderId === entry.orderId && o.serviceType === entry.serviceType)) {
            return;
        }
        list.unshift({
            orderId: entry.orderId,
            serviceType: entry.serviceType,
            createdAt: entry.createdAt || new Date().toISOString(),
            userInputSummary: entry.userInputSummary || ''
        });
        // 只保留最近200条
        return Storage.set(this.PREFIX + 'paid_orders', list.slice(0, 200));
    },
    
    /**
     * 生成用户输入摘要
     * @param {object} userData - 用户数据
     * @param {object} partnerData - 伴侣数据（可选）
     * @param {string} serviceType - 服务类型
     * @returns {string}
     */
    userInputSummary(userData, partnerData, serviceType) {
        if (!userData) return '';
        let s = `${userData.name || ''} ${userData.gender === 'male' ? '男' : userData.gender === 'female' ? '女' : ''} ${userData.birthYear || ''}-${userData.birthMonth || ''}-${userData.birthDay || ''} ${userData.birthCity || ''}`.trim();
        if (serviceType === '八字合婚' && partnerData) {
            s += ' | 伴侣: ' + `${partnerData.partnerName || ''} ${partnerData.partnerGender === 'male' ? '男' : partnerData.partnerGender === 'female' ? '女' : ''}`.trim();
        }
        return s || '—';
    },
    
    /**
     * 删除指定订单的所有数据
     * @param {string} serviceType - 服务类型
     * @param {string} orderId - 订单ID
     * @returns {boolean} 是否删除成功
     */
    deleteOrder(serviceType, orderId) {
        try {
            // 1. 删除分析结果数据
            Storage.remove(this.resultKey(serviceType, orderId));
            
            // 2. 从已支付订单列表中移除
            const list = this.getPaidOrders();
            const filtered = list.filter(o => !(o.orderId === orderId && o.serviceType === serviceType));
            Storage.set(this.PREFIX + 'paid_orders', filtered);
            
            // 3. 如果删除的是当前订单，清除当前订单缓存
            const current = this.getCurrentOrder();
            if (current && current.orderId === orderId && current.serviceType === serviceType) {
                this.clearCurrentOrder();
            }
            
            console.log('✅ 已删除订单:', serviceType, orderId);
            return true;
        } catch (error) {
            console.error('❌ 删除订单失败:', error);
            return false;
        }
    }
};

// ============ 【用户偏好设置存储】 ============
const PreferenceStorage = {
    /**
     * 获取上次选中的服务
     * @returns {string|null}
     */
    getLastSelectedService() {
        return Storage.get(STORAGE_KEYS.LAST_SELECTED_SERVICE, null);
    },
    
    /**
     * 设置上次选中的服务
     * @param {string} serviceName - 服务名称
     */
    setLastSelectedService(serviceName) {
        return Storage.set(STORAGE_KEYS.LAST_SELECTED_SERVICE, serviceName);
    }
};

// ============ 【导出】 ============
export {
    Storage,
    PaymentStorage,
    AnalysisStorage,
    RunzangStorage,
    PreferenceStorage,
    STORAGE_KEYS
};
