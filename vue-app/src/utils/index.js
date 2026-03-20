/**
 * 工具函数集合
 * 从 sdev2/js/core/utils.js 迁移
 */

/**
 * 格式化日期
 */
export function formatDate(date = new Date()) {
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 生成随机订单ID
 */
export function generateOrderId() {
  return 'ORD' + Date.now() + Math.floor(Math.random() * 1000)
}

/**
 * 预加载图片
 */
export function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(url)
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    img.src = url
  })
}

/**
 * 防抖函数
 */
export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
export function throttle(func, limit) {
  let inThrottle
  return function() {
    const args = arguments
    const context = this
    if (!inThrottle) {
      func.apply(context, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 计算八字（演示函数，备用）
 */
export function calculateBazi(userData) {
  const year = parseInt(userData.birthYear)
  const month = parseInt(userData.birthMonth)
  const day = parseInt(userData.birthDay)
  const hour = parseInt(userData.birthHour)
  
  // 天干地支基础数据
  const heavenlyStems = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
  const earthlyBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
  const elements = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水']
  
  // 计算年柱（简化算法）
  const yearIndex = (year - 4) % 60
  const yearHeavenly = heavenlyStems[yearIndex % 10]
  const yearEarthly = earthlyBranches[yearIndex % 12]
  const yearColumn = yearHeavenly + yearEarthly
  const yearElement = elements[yearIndex % 10]
  
  // 计算月柱（简化算法）
  const monthIndex = (month + 1) % 12
  const monthHeavenly = heavenlyStems[(yearIndex % 10 * 2 + monthIndex) % 10]
  const monthEarthly = earthlyBranches[monthIndex]
  const monthColumn = monthHeavenly + monthEarthly
  const monthElement = elements[(yearIndex % 10 * 2 + monthIndex) % 10]
  
  // 计算日柱（简化算法）
  const dayIndex = (year + month + day) % 60
  const dayHeavenly = heavenlyStems[dayIndex % 10]
  const dayEarthly = earthlyBranches[dayIndex % 12]
  const dayColumn = dayHeavenly + dayEarthly
  const dayElement = elements[dayIndex % 10]
  
  // 计算时柱（简化算法）
  const hourIndex = Math.floor(hour / 2) % 12
  const hourHeavenly = heavenlyStems[(dayIndex % 10 * 2 + hourIndex) % 10]
  const hourEarthly = earthlyBranches[hourIndex]
  const hourColumn = hourHeavenly + hourEarthly
  const hourElement = elements[(dayIndex % 10 * 2 + hourIndex) % 10]
  
  return {
    yearColumn,
    yearElement,
    monthColumn,
    monthElement,
    dayColumn,
    dayElement,
    hourColumn,
    hourElement
  }
}

/**
 * 生成年份选项
 */
export function generateYearOptions(startYear = 1900, endYear = 2024) {
  const years = []
  for (let i = startYear; i <= endYear; i++) {
    years.push({ value: i, text: `${i}年` })
  }
  return years
}

/**
 * 验证邮箱格式
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

/**
 * 验证手机格式
 */
export function isValidPhone(phone) {
  const re = /^1[3-9]\d{9}$/
  return re.test(phone)
}

/**
 * 复制到剪贴板
 */
export function copyToClipboard(text) {
  return new Promise((resolve, reject) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => resolve(true))
        .catch(err => reject(err))
    } else {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        resolve(true)
      } catch (err) {
        reject(err)
      }
      document.body.removeChild(textArea)
    }
  })
}

/**
 * 解析八字排盘文本
 * @param {string} content - 分析结果文本
 * @returns {object|null} 八字数据对象
 */
export function parseBaziFromContent(content) {
  if (!content) return null
  
  try {
    const baziMatch = content.match(/【八字排盘】\s*\n年柱：([^\n]+)\n月柱：([^\n]+)\n日柱：([^\n]+)\n时柱：([^\n]+)/)
    const dayunMatch = content.match(/【(?:大运排盘|用户大运排盘)】\s*\n岁：([^\n]+)\n大运：([^\n]+)/)
    
    if (baziMatch) {
      const bazi = {
        yearColumn: baziMatch[1].trim(),
        monthColumn: baziMatch[2].trim(),
        dayColumn: baziMatch[3].trim(),
        hourColumn: baziMatch[4].trim()
      }
      
      if (dayunMatch) {
        bazi.dayunAges = dayunMatch[1].trim()
        bazi.dayunPillars = dayunMatch[2].trim()
      }
      
      return bazi
    }
    
    return null
  } catch (error) {
    console.error('解析八字数据失败:', error)
    return null
  }
}

/**
 * 解析伴侣八字排盘文本
 * @param {string} content - 分析结果文本
 * @returns {object|null} 伴侣八字数据对象
 */
export function parsePartnerBaziFromContent(content) {
  if (!content) return null
  
  try {
    const baziMatch = content.match(/【伴侣八字排盘】\s*\n年柱：([^\n]+)\n月柱：([^\n]+)\n日柱：([^\n]+)\n时柱：([^\n]+)/)
    const dayunMatch = content.match(/【伴侣大运排盘】\s*\n岁：([^\n]+)\n大运：([^\n]+)/)
    
    if (baziMatch) {
      const bazi = {
        yearColumn: baziMatch[1].trim(),
        monthColumn: baziMatch[2].trim(),
        dayColumn: baziMatch[3].trim(),
        hourColumn: baziMatch[4].trim()
      }
      
      if (dayunMatch) {
        bazi.dayunAges = dayunMatch[1].trim()
        bazi.dayunPillars = dayunMatch[2].trim()
      }
      
      return bazi
    }
    
    return null
  } catch (error) {
    console.error('解析伴侣八字数据失败:', error)
    return null
  }
}

/**
 * 分割分析结果为免费和付费部分
 * @param {string} content - 完整分析结果
 * @param {Array<string>} lockedItems - 需要锁定的章节标题列表
 * @returns {{freeContent: string, lockedContent: string}}
 */
export function splitAnalysisContent(content, lockedItems = []) {
  if (!content || !lockedItems || lockedItems.length === 0) {
    return { freeContent: content || '', lockedContent: '' }
  }
  
  // 找到第一个需要锁定的章节
  let firstLockedIndex = -1
  let firstLockedTitle = ''
  
  for (const item of lockedItems) {
    const index = content.indexOf(`【${item}】`)
    if (index !== -1 && (firstLockedIndex === -1 || index < firstLockedIndex)) {
      firstLockedIndex = index
      firstLockedTitle = item
    }
  }
  
  if (firstLockedIndex === -1) {
    // 没有找到锁定章节，全部为免费内容
    return { freeContent: content, lockedContent: '' }
  }
  
  const freeContent = content.substring(0, firstLockedIndex).trim()
  const lockedContent = content.substring(firstLockedIndex).trim()
  
  return { freeContent, lockedContent }
}
