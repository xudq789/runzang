// API通信模块
import { PAYMENT_CONFIG } from './config.js';

// 服务名称 -> AI 接口路径
const AI_QUERY_ENDPOINTS = {
    '人生详批': '/api/ai/query-rsxp',
    '测算验证': '/api/ai/query-csyz',
    '流年运程': '/api/ai/query-lnyc',
    '八字合婚': '/api/ai/query-bzhh'
};

const API_KEY = 'runzang-payment-security-key-2025-1234567890';
export { API_KEY };

const DOM = {
    id: (id) => document.getElementById(id),
    get: (selector) => document.querySelector(selector),
    getAll: (selector) => document.querySelectorAll(selector)
};

function formatBirthTime(year, month, day, hour, minute) {
    const y = String(year);
    const m = String(month ?? 0).padStart(2, '0');
    const d = String(day ?? 0).padStart(2, '0');
    const h = String(hour ?? 0).padStart(2, '0');
    const min = String(minute ?? 0).padStart(2, '0');
    return `${y}-${m}-${d} ${h}:${min}:00`;
}

/** 根据当前服务与用户/伴侣数据构建 AI 查询请求体 */
function buildAiRequestBody(serviceKey, userData, partnerData) {
    if (serviceKey === '八字合婚') {
        if (!partnerData) throw new Error('伴侣信息是八字合婚服务的必填项');
        return {
            selfName: userData.name,
            selfGender: userData.gender,
            selfBirthTime: formatBirthTime(userData.birthYear, userData.birthMonth, userData.birthDay, userData.birthHour, userData.birthMinute),
            selfBirthRegion: userData.birthCity || '',
            spouseName: partnerData.partnerName,
            spouseGender: partnerData.partnerGender,
            spouseBirthTime: formatBirthTime(partnerData.partnerBirthYear, partnerData.partnerBirthMonth, partnerData.partnerBirthDay, partnerData.partnerBirthHour, partnerData.partnerBirthMinute),
            spouseBirthRegion: partnerData.partnerBirthCity || '',
            description: ''
        };
    }
    return {
        name: userData.name,
        gender: userData.gender,
        birthTime: formatBirthTime(userData.birthYear, userData.birthMonth, userData.birthDay, userData.birthHour, userData.birthMinute),
        birthRegion: userData.birthCity || '',
        description: ''
    };
}

/**
 * 调用 AI 查询接口（人生详批/测算验证/流年运程/八字合婚）
 * @param {string} serviceKey - 服务名称：人生详批、测算验证、流年运程、八字合婚
 * @param {object} userData - 用户数据
 * @param {object} [partnerData] - 伴侣数据（八字合婚必填）
 * @returns {Promise<{ content: string, orderId: string, status: string|null, amount: number|null }>} 分析内容、订单号、状态与应付金额（金额来自后端写死配置）
 */
export async function callAiQuery(serviceKey, userData, partnerData) {
    const path = AI_QUERY_ENDPOINTS[serviceKey];
    if (!path) throw new Error(`未支持的 AI 服务: ${serviceKey}`);
    const url = `${PAYMENT_CONFIG.GATEWAY_URL}${path}`;
    const body = buildAiRequestBody(serviceKey, userData, partnerData);
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
        },
        body: JSON.stringify(body)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `请求失败: ${response.status}`);
    if (!data.success) throw new Error(data.message || '查询失败');
    const content = data.data?.content;
    if (content == null) throw new Error('接口未返回分析内容');
    const orderId = data.data?.outTradeNo || data.data?.orderId || '';
    const status = data.data?.status || null;
    const rawAmount = data.data?.amount;
    const amount = rawAmount != null && rawAmount !== '' && !Number.isNaN(Number(rawAmount))
        ? Number(rawAmount)
        : null;
    return { content, orderId, status, amount };
}

/**
 * 查询订单状态 GET /api/payment/status/:orderId
 * @param {string} orderId - 订单号
 * @returns {Promise<{ success: boolean, data?: { status, paymentStatus, content, ... } }>}
 */
async function fetchPaymentStatus(orderId) {
    if (!orderId || String(orderId).length < 10) {
        throw new Error('订单号无效');
    }
    const url = `${PAYMENT_CONFIG.GATEWAY_URL}/api/payment/status/${orderId}`;
    const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: { 'X-API-Key': API_KEY }
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(result.message || `请求失败: ${response.status}`);
    }
    return result;
}

// 解析八字数据
export function parseBaziData(analysisResult) {
    console.log('解析八字数据...');
    
    const result = {
        userBazi: null,
        partnerBazi: null
    };
    
    try {
        // 解析用户八字
        let userBaziText = '';
        
        // 尝试从【八字排盘】提取
        const userBaziMatch = analysisResult.match(/【八字排盘】([\s\S]*?)(?:【|$)/);
        if (userBaziMatch && userBaziMatch[1]) {
            userBaziText = userBaziMatch[1];
            result.userBazi = parseSingleBazi(userBaziText);
        }
        
        // 如果是八字合婚，解析伴侣八字
        if (analysisResult.includes('【伴侣八字排盘】')) {
            const partnerBaziMatch = analysisResult.match(/【伴侣八字排盘】([\s\S]*?)(?:【|$)/);
            if (partnerBaziMatch && partnerBaziMatch[1]) {
                result.partnerBazi = parseSingleBazi(partnerBaziMatch[1]);
            }
        }
        
    } catch (error) {
        console.error('解析八字数据出错:', error);
    }
    
    return result;
}

// 解析单个八字（辅助函数）
function parseSingleBazi(baziText) {
    const baziData = {
        yearColumn: '',
        yearElement: '',
        monthColumn: '',
        monthElement: '',
        dayColumn: '',
        dayElement: '',
        hourColumn: '',
        hourElement: ''
    };
    
    const lines = baziText.split('\n');
    
    lines.forEach(line => {
        const trimmedLine = line.trim();
        
        // 支持多种分隔符：：和:
        if (trimmedLine.includes('年柱')) {
            const match = trimmedLine.match(/年柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                baziData.yearColumn = match[1] || '';
                baziData.yearElement = match[2] || '';
            }
        } else if (trimmedLine.includes('月柱')) {
            const match = trimmedLine.match(/月柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                baziData.monthColumn = match[1] || '';
                baziData.monthElement = match[2] || '';
            }
        } else if (trimmedLine.includes('日柱')) {
            const match = trimmedLine.match(/日柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                baziData.dayColumn = match[1] || '';
                baziData.dayElement = match[2] || '';
            }
        } else if (trimmedLine.includes('时柱')) {
            const match = trimmedLine.match(/时柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
            if (match) {
                baziData.hourColumn = match[1] || '';
                baziData.hourElement = match[2] || '';
            }
        }
    });
    
    return baziData;
}

export { fetchPaymentStatus };
