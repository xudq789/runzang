/**
 * 命理分析相关：AI 请求参数构建与接口调用
 */
import { API_BASE_URL } from './config.js';

/** 服务类型 -> API 路径 */
export const SERVICE_API_MAP = {
    '人生详批': '/api/ai/query-rsxp',
    '测算验证': '/api/ai/query-csyz',
    '流年运程': '/api/ai/query-lnyc',
    '八字合婚': '/api/ai/query-bzhh'
};

function formatGender(gender) {
    if (gender === '男' || gender === '女') return gender;
    return gender === 'male' ? '男' : '女';
}

function formatBirthTime(year, month, day, hour, minute) {
    const h = (hour === '' || hour == null) ? 12 : hour;
    const m = (minute === '' || minute == null) ? 0 : minute;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/**
 * 构建 AI 查询请求体
 * @param {string} serviceName
 * @param {object} userData
 * @param {object} [partnerData]
 */
export function buildAiRequestBody(serviceName, userData, partnerData) {
    if (serviceName === '八字合婚') {
        if (!partnerData) throw new Error('八字合婚需要提供伴侣信息');
        return {
            selfName: userData.name,
            selfGender: formatGender(userData.gender),
            selfBirthTime: formatBirthTime(userData.birthYear, userData.birthMonth, userData.birthDay, userData.birthHour, userData.birthMinute),
            selfBirthRegion: userData.birthCity || '',
            spouseName: partnerData.partnerName,
            spouseGender: formatGender(partnerData.partnerGender),
            spouseBirthTime: formatBirthTime(partnerData.partnerBirthYear, partnerData.partnerBirthMonth, partnerData.partnerBirthDay, partnerData.partnerBirthHour, partnerData.partnerBirthMinute),
            spouseBirthRegion: partnerData.partnerBirthCity || '',
            description: serviceName || ''
        };
    }
    return {
        name: userData.name,
        gender: formatGender(userData.gender),
        birthTime: formatBirthTime(userData.birthYear, userData.birthMonth, userData.birthDay, userData.birthHour, userData.birthMinute),
        birthRegion: userData.birthCity || '',
        description: serviceName || ''
    };
}

/**
 * 调用 AI 查询接口
 * @param {string} apiEndpoint 如 '/api/ai/query-rsxp'
 * @param {object} requestBody
 * @returns {Promise<{ orderId: string, content: string }>}
 */
export async function callAiQuery(apiEndpoint, requestBody) {
    const url = `${API_BASE_URL}${apiEndpoint}`;
    const response = await fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'runzang-payment-security-key-2025-1234567890'
        },
        body: JSON.stringify(requestBody)
    });
    if (!response.ok) throw new Error(`服务器接口调用失败: ${response.status}`);
    const data = await response.json();
    if (!data.success) throw new Error(data.message || '查询失败');
    return {
        orderId: data.data.orderId,
        content: data.data.content || ''
    };
}
