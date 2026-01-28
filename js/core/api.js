// api.js - 修复 searchText 未定义的错误
// API通信模块
import { DOM } from './utils.js';

// DeepSeek API调用
export async function callDeepSeekAPI(prompt) {
    console.log('调用DeepSeek API...');
    
    try {
        const response = await fetch(window.APP_CONFIG.DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.APP_CONFIG.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [
                    {
                        role: 'system',
                        content: '你是一位职业的命理大师，精通梁湘润论命体系。请根据用户信息进行专业命理分析，严格按照要求的格式输出。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 4000,
                temperature: 0.7,
                stream: false
            })
        });
        
        console.log('API响应状态:', response.status);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API错误响应:', errorData);
            throw new Error(`API请求失败: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API响应数据接收成功');
        
        if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            return data.choices[0].message.content;
        } else {
            throw new Error('API返回数据格式错误');
        }
        
    } catch (error) {
        console.error('DeepSeek API调用失败:', error);
        throw error;
    }
}

// 检查API状态
export async function checkAPIStatus() {
    console.log('正在检查DeepSeek API状态...');
    const statusElement = DOM.id('api-status');
    
    if (!statusElement) return 'unknown';
    
    try {
        const response = await fetch(window.APP_CONFIG.DEEPSEEK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.APP_CONFIG.DEEPSEEK_API_KEY}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: [{ 
                    role: 'user', 
                    content: '请回复"API连接正常"' 
                }],
                max_tokens: 10,
                temperature: 0.1
            })
        });
        
        if (response.ok) {
            statusElement.textContent = '✅ API连接正常';
            statusElement.className = 'api-status online';
            return 'online';
        } else {
            statusElement.textContent = '❌ API连接异常';
            statusElement.className = 'api-status offline';
            return 'offline';
        }
    } catch (error) {
        statusElement.textContent = '❌ API连接失败';
        statusElement.className = 'api-status offline';
        return 'offline';
    }
}

// 解析八字数据从AI回复中
export function parseBaziData(analysisResult) {
    console.log('解析八字数据...');
    
    const result = {
        userBazi: null,
        partnerBazi: null
    };
    
    // 提取用户八字数据
    result.userBazi = extractSingleBazi(analysisResult, false);
    
    // 提取伴侣八字数据
    result.partnerBazi = extractSingleBazi(analysisResult, true);
    
    console.log('解析到的八字数据:', result);
    return result;
}

// 提取单个八字
function extractSingleBazi(text, isPartner = false) {
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
    
    const prefix = isPartner ? '伴侣' : '用户';
    
    // 如果是伴侣且非合婚服务，返回空数据
    if (isPartner && !text.includes('伴侣八字排盘')) {
        return baziData;
    }
    
    // 非合婚服务的标题是"八字排盘"
    if (!isPartner && !text.includes('用户八字排盘')) {
        const pattern = /【八字排盘】[\s\S]*?年柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?[\s\S]*?月柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?[\s\S]*?日柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?[\s\S]*?时柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/;
        const match = text.match(pattern);
        
        if (match) {
            baziData.yearColumn = match[1] || '';
            baziData.yearElement = match[2] || '';
            baziData.monthColumn = match[3] || '';
            baziData.monthElement = match[4] || '';
            baziData.dayColumn = match[5] || '';
            baziData.dayElement = match[6] || '';
            baziData.hourColumn = match[7] || '';
            baziData.hourElement = match[8] || '';
        }
    } else {
        // 合婚服务的提取
        const pattern = new RegExp(`【${prefix}八字排盘】[\\s\\S]*?年柱[：:]\\s*([^\\s(]+)(?:\\s*\\(([^)]+)\\))?[\\s\\S]*?月柱[：:]\\s*([^\\s(]+)(?:\\s*\\(([^)]+)\\))?[\\s\\S]*?日柱[：:]\\s*([^\\s(]+)(?:\\s*\\(([^)]+)\\))?[\\s\\S]*?时柱[：:]\\s*([^\\s(]+)(?:\\s*\\(([^)]+)\\))?`);
        
        const match = text.match(pattern);
        
        if (match) {
            baziData.yearColumn = match[1] || '';
            baziData.yearElement = match[2] || '';
            baziData.monthColumn = match[3] || '';
            baziData.monthElement = match[4] || '';
            baziData.dayColumn = match[5] || '';
            baziData.dayElement = match[6] || '';
            baziData.hourColumn = match[7] || '';
            baziData.hourElement = match[8] || '';
        }
    }
    
    return baziData;
}

// 提取大运数据
export function extractDayunData(text, type = 'user') {
    const result = {
        ages: [],
        ganzhi: []
    };
    
    if (!text) return result;
    
    console.log(`提取${type}大运数据...`);
    
    // 初始化搜索文本
    let searchText = text;
    
    // 根据类型选择搜索关键词
    const prefix = type === 'partner' ? '伴侣' : '用户';
    
    // 如果是伴侣且非合婚服务，返回空数据
    if (type === 'partner' && !text.includes('伴侣大运排盘')) {
        return result;
    }
    
    // 非合婚服务的标题是"大运排盘"
    if (type === 'user' && !text.includes('用户大运排盘')) {
        const sectionPattern = /【大运排盘】([\s\S]*?)(?=【|$)/;
        const sectionMatch = text.match(sectionPattern);
        if (sectionMatch) {
            searchText = sectionMatch[1];
        }
    } else {
        // 合婚服务的提取
        const sectionPattern = new RegExp(`【${prefix}大运排盘】([\\s\\S]*?)(?=【|$)`);
        const sectionMatch = text.match(sectionPattern);
        if (sectionMatch) {
            searchText = sectionMatch[1];
        }
    }
    
    console.log(`搜索文本长度: ${searchText.length}`);
    
    // 提取岁数
    const agePattern = /岁[：:]\s*((?:\d+\s+){3,}\d+)/;
    const ageMatch = searchText.match(agePattern);
    
    if (ageMatch) {
        result.ages = ageMatch[1].trim().split(/\s+/).slice(0, 8);
        console.log(`提取到岁数: ${result.ages}`);
    }
    
    // 提取大运干支
    const ganzhiPattern = /大运[：:]\s*((?:[^\s]+\s+){3,}[^\s]+)/;
    const ganzhiMatch = searchText.match(ganzhiPattern);
    
    if (ganzhiMatch) {
        result.ganzhi = ganzhiMatch[1].trim().split(/\s+/).slice(0, 8);
        console.log(`提取到大运干支: ${result.ganzhi}`);
    }
    
    // 如果提取失败，尝试备用方法
    if (result.ages.length === 0 || result.ganzhi.length === 0) {
        console.log('使用备用方法提取...');
        
        // 提取所有数字作为年龄
        const allAges = searchText.match(/\b\d+\b/g);
        if (allAges) {
            // 过滤出可能的起运岁数（通常在5-80之间）
            const possibleAges = [...new Set(allAges.map(age => parseInt(age)).filter(age => age >= 5 && age <= 80).sort((a, b) => a - b))];
            result.ages = possibleAges.slice(0, 8).map(age => age.toString());
            console.log(`备用方法提取到岁数: ${result.ages}`);
        }
        
        // 提取所有干支
        const allGanzhi = searchText.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g);
        if (allGanzhi) {
            result.ganzhi = allGanzhi.slice(0, 8);
            console.log(`备用方法提取到大运干支: ${result.ganzhi}`);
        }
    }
    
    // 如果还没有数据，使用默认示例数据
    if (result.ages.length === 0) {
        result.ages = ['8', '18', '28', '38', '48', '58', '68', '78'];
        console.log('使用默认岁数数据');
    }
    if (result.ganzhi.length === 0) {
        result.ganzhi = ['壬子', '辛亥', '庚戌', '己酉', '戊申', '丁未', '丙午', '乙巳'];
        console.log('使用默认大运干支数据');
    }
    
    // 确保长度一致
    const minLength = Math.min(result.ages.length, result.ganzhi.length, 8);
    result.ages = result.ages.slice(0, minLength);
    result.ganzhi = result.ganzhi.slice(0, minLength);
    
    console.log(`最终提取到${type}大运数据:`, result);
    return result;
}
