// api.js - 完整修正版
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
    } else {
        // 备用提取方式
        const lines = text.split('\n');
        let inTargetSection = false;
        let sectionFound = false;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            if (line.includes(`【${prefix}八字排盘】`)) {
                inTargetSection = true;
                sectionFound = true;
                continue;
            }
            
            if (inTargetSection) {
                if (line.includes('【')) {
                    // 遇到下一个章节，停止
                    break;
                }
                
                extractFromLine(line, baziData);
            }
        }
        
        // 如果没找到特定章节，尝试通用提取
        if (!sectionFound) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                extractFromLine(line, baziData);
            }
        }
    }
    
    // 如果没有提取到元素，使用默认的
    if (!baziData.yearElement && baziData.yearColumn) {
        baziData.yearElement = getElementByGanzhi(baziData.yearColumn);
    }
    if (!baziData.monthElement && baziData.monthColumn) {
        baziData.monthElement = getElementByGanzhi(baziData.monthColumn);
    }
    if (!baziData.dayElement && baziData.dayColumn) {
        baziData.dayElement = getElementByGanzhi(baziData.dayColumn);
    }
    if (!baziData.hourElement && baziData.hourColumn) {
        baziData.hourElement = getElementByGanzhi(baziData.hourColumn);
    }
    
    return baziData;
}

function extractFromLine(line, baziData) {
    if (line.includes('年柱')) {
        const match = line.match(/年柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
        if (match) {
            baziData.yearColumn = match[1] || '';
            baziData.yearElement = match[2] || '';
        }
    } else if (line.includes('月柱')) {
        const match = line.match(/月柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
        if (match) {
            baziData.monthColumn = match[1] || '';
            baziData.monthElement = match[2] || '';
        }
    } else if (line.includes('日柱')) {
        const match = line.match(/日柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
        if (match) {
            baziData.dayColumn = match[1] || '';
            baziData.dayElement = match[2] || '';
        }
    } else if (line.includes('时柱')) {
        const match = line.match(/时柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
        if (match) {
            baziData.hourColumn = match[1] || '';
            baziData.hourElement = match[2] || '';
        }
    }
}

// 根据干支获取五行元素
function getElementByGanzhi(ganzhi) {
    if (!ganzhi || ganzhi.length < 2) return '';
    
    const gan = ganzhi.charAt(0);
    const zhi = ganzhi.charAt(1);
    
    // 天干五行
    const ganElements = {
        '甲': '木', '乙': '木',
        '丙': '火', '丁': '火', 
        '戊': '土', '己': '土',
        '庚': '金', '辛': '金',
        '壬': '水', '癸': '水'
    };
    
    // 地支五行
    const zhiElements = {
        '子': '水', '丑': '土',
        '寅': '木', '卯': '木',
        '辰': '土', '巳': '火',
        '午': '火', '未': '土', 
        '申': '金', '酉': '金',
        '戌': '土', '亥': '水'
    };
    
    return ganElements[gan] || zhiElements[zhi] || '';
}

// 提取大运数据（增强版）
export function extractDayunData(text, type = 'user') {
    const result = {
        ages: [],
        ganzhi: []
    };
    
    if (!text) return result;
    
    console.log(`提取${type}大运数据...`);
    
    // 根据类型选择搜索关键词
    const prefix = type === 'partner' ? '伴侣' : '用户';
    const sectionPattern = new RegExp(`【${prefix}大运排盘】([\\s\\S]*?)(?=【|$)`);
    const sectionMatch = text.match(sectionPattern);
    
    let searchText = sectionMatch ? sectionMatch[1] : text;
    
    // 模式1：标准的"岁："和"大运："格式
    const pattern1 = /岁[：:]\s*((?:\d+\s+){3,}\d+)[\s\S]*?大运[：:]\s*((?:[^\s]+\s+){3,}[^\s]+)/;
    const match1 = searchText.match(pattern1);
    
    if (match1) {
        console.log('使用模式1提取');
        // 提取岁数
        const ages = match1[1].trim().split(/\s+/);
        result.ages = ages.slice(0, 8);
        
        // 提取大运干支
        const ganzhi = match1[2].trim().split(/\s+/);
        result.ganzhi = ganzhi.slice(0, 8);
    }
    
    // 模式2：表格格式
    if (result.ages.length === 0) {
        const pattern2 = /岁数[：:]\s*((?:\d+\s+){3,}\d+)[\s\S]*?大运[：:]\s*((?:[^\s]+\s+){3,}[^\s]+)/;
        const match2 = searchText.match(pattern2);
        
        if (match2) {
            console.log('使用模式2提取');
            const ages = match2[1].trim().split(/\s+/);
            result.ages = ages.slice(0, 8);
            
            const ganzhi = match2[2].trim().split(/\s+/);
            result.ganzhi = ganzhi.slice(0, 8);
        }
    }
    
    // 模式3：提取所有数字作为年龄，提取所有干支作为大运
    if (result.ages.length === 0) {
        const ageMatches = searchText.match(/\b\d+\b/g);
        if (ageMatches) {
            // 过滤出可能的起运岁数（通常在5-80之间）
            const possibleAges = ageMatches
                .map(age => parseInt(age))
                .filter(age => age >= 5 && age <= 80)
                .sort((a, b) => a - b);
            
            // 去重并取前8个
            result.ages = [...new Set(possibleAges)].slice(0, 8).map(age => age.toString());
        }
        
        // 提取干支
        const ganzhiMatches = searchText.match(/[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]/g);
        if (ganzhiMatches) {
            result.ganzhi = ganzhiMatches.slice(0, 8);
        }
    }
    
    // 如果还没有数据，使用默认示例数据
    if (result.ages.length === 0) {
        result.ages = ['8', '18', '28', '38', '48', '58', '68', '78'];
    }
    if (result.ganzhi.length === 0) {
        result.ganzhi = ['壬子', '辛亥', '庚戌', '己酉', '戊申', '丁未', '丙午', '乙巳'];
    }
    
    // 确保数组长度一致
    const maxLength = Math.min(result.ages.length, result.ganzhi.length, 8);
    result.ages = result.ages.slice(0, maxLength);
    result.ganzhi = result.ganzhi.slice(0, maxLength);
    
    console.log(`提取到${type}大运数据:`, result);
    return result;
}

