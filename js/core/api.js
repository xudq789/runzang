// 解析八字数据从AI回复中
export function parseBaziData(analysisResult) {
    console.log('解析八字数据...');
    
    const result = {
        userBazi: null,
        partnerBazi: null
    };
    
    // 如果是八字合婚，需要解析两个八字
    if (analysisResult.includes('【用户八字排盘】') && analysisResult.includes('【伴侣八字排盘】')) {
        // 解析用户八字
        const userBaziText = analysisResult.match(/【用户八字排盘】([\s\S]*?)【/);
        if (userBaziText && userBaziText[1]) {
            result.userBazi = parseSingleBazi(userBaziText[1]);
        }
        
        // 解析伴侣八字
        const partnerBaziText = analysisResult.match(/【伴侣八字排盘】([\s\S]*?)【/);
        if (partnerBaziText && partnerBaziText[1]) {
            result.partnerBazi = parseSingleBazi(partnerBaziText[1]);
        }
    } else {
        // 其他服务：只解析用户的八字
        result.userBazi = parseSingleBazi(analysisResult);
    }
    
    console.log('解析到的八字数据:', result);
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
