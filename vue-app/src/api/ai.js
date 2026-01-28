import { API_BASE_URL } from '../config/services.js'

const SERVICE_API_MAP = {
  '人生详批': '/api/ai/query-rsxp',
  '测算验证': '/api/ai/query-csyz',
  '流年运程': '/api/ai/query-lnyc',
  '八字合婚': '/api/ai/query-bzhh'
}

function formatGender(gender) {
  if (gender === '男' || gender === '女') return gender
  return gender === 'male' ? '男' : '女'
}

function formatBirthTime(year, month, day, hour, minute) {
  const h = (hour === '' || hour == null) ? 12 : Number(hour)
  const m = (minute === '' || minute == null) ? 0 : Number(minute)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`
}

export function buildAiRequestBody(serviceName, userData, partnerData) {
  if (serviceName === '八字合婚') {
    if (!partnerData) throw new Error('八字合婚需要提供伴侣信息')
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
    }
  }
  return {
    name: userData.name,
    gender: formatGender(userData.gender),
    birthTime: formatBirthTime(userData.birthYear, userData.birthMonth, userData.birthDay, userData.birthHour, userData.birthMinute),
    birthRegion: userData.birthCity || '',
    description: serviceName || ''
  }
}

export async function callAiQuery(apiEndpoint, requestBody) {
  const url = `${API_BASE_URL}${apiEndpoint}`
  const res = await fetch(url, {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'runzang-payment-security-key-2025-1234567890'
    },
    body: JSON.stringify(requestBody)
  })
  if (!res.ok) throw new Error(`服务器接口调用失败: ${res.status}`)
  const data = await res.json()
  if (!data.success) throw new Error(data.message || '查询失败')
  return { orderId: data.data.orderId, content: data.data.content || '' }
}

export async function fetchAiResultContent(orderId) {
  if (!orderId) return null
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/result/${orderId}`, {
      method: 'GET',
      mode: 'cors',
      headers: { 'X-API-Key': 'runzang-payment-security-key-2025-1234567890' }
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.success && data.data && data.data.content) return data.data.content
    return null
  } catch (e) {
    console.error('获取AI结果失败:', e)
    return null
  }
}

export function parseBaziData(analysisResult) {
  const result = { userBazi: null, partnerBazi: null }
  if (!analysisResult) return result
  if (analysisResult.includes('【用户八字排盘】') && analysisResult.includes('【伴侣八字排盘】')) {
    const userMatch = analysisResult.match(/【用户八字排盘】([\s\S]*?)【/)
    if (userMatch && userMatch[1]) result.userBazi = parseSingleBazi(userMatch[1])
    const partnerMatch = analysisResult.match(/【伴侣八字排盘】([\s\S]*?)【/)
    if (partnerMatch && partnerMatch[1]) result.partnerBazi = parseSingleBazi(partnerMatch[1])
  } else {
    result.userBazi = parseSingleBazi(analysisResult)
  }
  return result
}

function parseSingleBazi(text) {
  const bazi = { yearColumn: '', yearElement: '', monthColumn: '', monthElement: '', dayColumn: '', dayElement: '', hourColumn: '', hourElement: '' }
  text.split('\n').forEach((line) => {
    const t = line.trim()
    const col = (label, keyCol, keyEl) => {
      const m = t.match(new RegExp(`${label}[：:]\\s*([^\\s(]+)(?:\\s*\\(([^)]+)\\))?`))
      if (m) { bazi[keyCol] = m[1] || ''; bazi[keyEl] = m[2] || '' }
    }
    if (t.includes('年柱')) col('年柱', 'yearColumn', 'yearElement')
    else if (t.includes('月柱')) col('月柱', 'monthColumn', 'monthElement')
    else if (t.includes('日柱')) col('日柱', 'dayColumn', 'dayElement')
    else if (t.includes('时柱')) col('时柱', 'hourColumn', 'hourElement')
  })
  return bazi
}

export { SERVICE_API_MAP }
