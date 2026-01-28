/**
 * 服务配置。完整数据请从项目根目录 js/core/config.js 的 SERVICES 复制过来并合并。
 * 此处仅保留「测算验证」示例，其余服务需从原 config.js 复制。
 */
export const API_BASE_URL = 'https://runzang.top'

export const SERVICES = {
  '测算验证': {
    heroImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/1-1.jpg',
    detailImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/1-2.jpg',
    price: 0.01,
    lockedItems: ['富贵层次评估', '过往大运吉凶分析', '过往关键流年验证', '专业建议与指导'],
    prompt: ''
  },
  '流年运程': {
    heroImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/2-1.jpg',
    detailImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/2-2.jpg',
    price: 0.01,
    lockedItems: ['富贵层次评估', '测算当年及往后5年运势', '事业财运走向分析', '婚姻感情趋势分析', '年度发展建议', '重要注意事项'],
    prompt: ''
  },
  '人生详批': {
    heroImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/3-1.jpg',
    detailImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/3-2.jpg',
    price: 0.01,
    lockedItems: ['富贵层次评估', '事业财运分析', '婚姻感情分析', '健康运势分析', '流年大运分析', '综合建议'],
    prompt: ''
  },
  '八字合婚': {
    heroImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/4-1.jpg',
    detailImage: 'https://runzang-1388534671.cos.ap-guangzhou.myqcloud.com/images/4-2.jpg',
    price: 0.01,
    lockedItems: ['双方八字契合度分析', '感情发展趋势解读', '婚姻稳定性分析', '双方性格匹配度分析', '婚姻建议和注意事项'],
    prompt: ''
  }
}
