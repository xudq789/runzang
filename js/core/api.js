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
    
    // 重置八字数据
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
    
    // 尝试从分析结果中提取八字信息
    const baziMatch = analysisResult.match(/【八字排盘】\s*年柱：([^\n]+)\s*月柱：([^\n]+)\s*日柱：([^\n]+)\s*时柱：([^\n]+)/);
    
    if (baziMatch && baziMatch.length >= 5) {
        // 解析年柱
        const yearMatch = baziMatch[1].match(/([^\s]+)\s*\(([^)]+)\)/);
        if (yearMatch) {
            baziData.yearColumn = yearMatch[1];
            baziData.yearElement = yearMatch[2];
        }
        
        // 解析月柱
        const monthMatch = baziMatch[2].match(/([^\s]+)\s*\(([^)]+)\)/);
        if (monthMatch) {
            baziData.monthColumn = monthMatch[1];
            baziData.monthElement = monthMatch[2];
        }
        
        // 解析日柱
        const dayMatch = baziMatch[3].match(/([^\s]+)\s*\(([^)]+)\)/);
        if (dayMatch) {
            baziData.dayColumn = dayMatch[1];
            baziData.dayElement = dayMatch[2];
        }
        
        // 解析时柱
        const hourMatch = baziMatch[4].match(/([^\s]+)\s*\(([^)]+)\)/);
        if (hourMatch) {
            baziData.hourColumn = hourMatch[1];
            baziData.hourElement = hourMatch[2];
        }
    } else {
        // 如果没有找到标准格式，尝试其他格式
        const baziSections = analysisResult.split('【八字排盘】');
        if (baziSections.length > 1) {
            const baziText = baziSections[1].split('【')[0];
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
        }
    }
    
    console.log('解析到的八字数据:', baziData);
    return baziData;
}