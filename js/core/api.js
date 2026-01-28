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
        partnerBazi: null,
        userDayun: null,
        partnerDayun: null
    };
    
    // 提取八字数据
    result.userBazi = extractSingleBazi(analysisResult, false);
    result.partnerBazi = extractSingleBazi(analysisResult, true);
    
    console.log('解析到的八字数据:', result);
    return result;
}

// 提取单个八字（改进版）
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
    
    // 根据是否伴侣选择搜索模式
    const prefix = isPartner ? '伴侣' : '';
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
    } else {
        // 备用提取方式
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (isPartner && line.includes('伴侣八字排盘')) {
                // 从这一行开始查找八字
                for (let j = i; j < Math.min(i + 10, lines.length); j++) {
                    extractFromLine(lines[j].trim(), baziData);
                }
                break;
            } else if (!isPartner && line.includes('八字排盘') && !line.includes('伴侣')) {
                for (let j = i; j < Math.min(i + 10, lines.length); j++) {
                    extractFromLine(lines[j].trim(), baziData);
                }
                break;
            }
        }
    }
    
    return baziData;
}

function extractFromLine(line, baziData) {
    if (line.includes('年柱')) {
        const match = line.match(/年柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
        if (match) {
            baziData.yearColumn = match[1] || '';
            baziData.yearElement = match[2] || getElementByGanzhi(match[1] || '');
        }
    } else if (line.includes('月柱')) {
        const match = line.match(/月柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
        if (match) {
            baziData.monthColumn = match[1] || '';
            baziData.monthElement = match[2] || getElementByGanzhi(match[1] || '');
        }
    } else if (line.includes('日柱')) {
        const match = line.match(/日柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
        if (match) {
            baziData.dayColumn = match[1] || '';
            baziData.dayElement = match[2] || getElementByGanzhi(match[1] || '');
        }
    } else if (line.includes('时柱')) {
        const match = line.match(/时柱[：:]\s*([^\s(]+)(?:\s*\(([^)]+)\))?/);
        if (match) {
            baziData.hourColumn = match[1] || '';
            baziData.hourElement = match[2] || getElementByGanzhi(match[1] || '');
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

