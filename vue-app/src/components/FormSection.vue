<template>
  <section class="info-section">
    <div class="section-title">
      <h2>{{ app.currentService }}信息填写</h2>
      <p>请填写您的个人信息，我们将为您进行专业命理分析</p>
    </div>
    <div class="form-container">
      <div class="form-grid">
        <div class="form-group">
          <label class="required">姓名</label>
          <input v-model="form.name" type="text" placeholder="请输入您的姓名" />
        </div>
        <div class="form-group">
          <label class="required">性别</label>
          <select v-model="form.gender">
            <option value="">请选择性别</option>
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <div class="form-group">
          <label>出生城市</label>
          <input v-model="form.birthCity" type="text" placeholder="北京" />
        </div>
      </div>
      <div class="birth-time-group">
        <label class="required">出生公历时间</label>
        <div class="form-row">
          <div class="form-group">
            <select v-model.number="form.birthYear">
              <option v-for="y in years" :key="y" :value="y">{{ y }}年</option>
            </select>
          </div>
          <div class="form-group">
            <select v-model.number="form.birthMonth">
              <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
            </select>
          </div>
          <div class="form-group">
            <select v-model.number="form.birthDay">
              <option v-for="d in 31" :key="d" :value="d">{{ d }}日</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <select v-model="form.birthHour">
              <option value="">时辰（选填）</option>
              <option v-for="h in 24" :key="h" :value="h">{{ h }}时</option>
            </select>
          </div>
          <div class="form-group">
            <select v-model="form.birthMinute">
              <option value="">分钟（选填）</option>
              <option v-for="m in 60" :key="m" :value="m">{{ m }}分</option>
            </select>
          </div>
        </div>
      </div>
      <div v-show="app.currentService === '八字合婚'" class="partner-info-section">
        <h3>伴侣信息</h3>
        <div class="form-grid">
          <div class="form-group">
            <label class="required">伴侣姓名</label>
            <input v-model="form.partnerName" type="text" placeholder="请输入伴侣姓名" />
          </div>
          <div class="form-group">
            <label class="required">伴侣性别</label>
            <select v-model="form.partnerGender">
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
            </select>
          </div>
          <div class="form-group">
            <label>伴侣出生城市</label>
            <input v-model="form.partnerBirthCity" type="text" placeholder="北京" />
          </div>
        </div>
        <div class="birth-time-group">
          <label class="required">伴侣出生公历时间</label>
          <div class="form-row">
            <div class="form-group">
              <select v-model.number="form.partnerBirthYear">
                <option v-for="y in years" :key="'p'+y" :value="y">{{ y }}年</option>
              </select>
            </div>
            <div class="form-group">
              <select v-model.number="form.partnerBirthMonth">
                <option v-for="m in 12" :key="'p'+m" :value="m">{{ m }}月</option>
              </select>
            </div>
            <div class="form-group">
              <select v-model.number="form.partnerBirthDay">
                <option v-for="d in 31" :key="'p'+d" :value="d">{{ d }}日</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <select v-model="form.partnerBirthHour">
                <option value="">时辰（选填）</option>
                <option v-for="h in 24" :key="'ph'+h" :value="h">{{ h }}时</option>
              </select>
            </div>
            <div class="form-group">
              <select v-model="form.partnerBirthMinute">
                <option value="">分钟（选填）</option>
                <option v-for="m in 60" :key="'pm'+m" :value="m">{{ m }}分</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="analyze-btn" :disabled="app.loading" @click="submit">
          {{ app.loading ? '分析中…' : '开始分析' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, computed, watch } from 'vue'
import { useAppStore } from '../stores/app.js'

const app = useAppStore()
const years = Array.from({ length: 125 }, (_, i) => 2024 - i)

const form = reactive({
  name: '张三',
  gender: 'male',
  birthCity: '',
  birthYear: 1990,
  birthMonth: 1,
  birthDay: 1,
  birthHour: '',
  birthMinute: '',
  partnerName: '李四',
  partnerGender: 'female',
  partnerBirthCity: '',
  partnerBirthYear: 1992,
  partnerBirthMonth: 6,
  partnerBirthDay: 15,
  partnerBirthHour: 15,
  partnerBirthMinute: 30
})

watch(() => app.currentService, () => {
  if (app.currentService !== '八字合婚') form.partnerName = form.partnerGender = form.partnerBirthCity = ''
})

function collect() {
  const u = {
    name: form.name,
    gender: form.gender,
    birthCity: form.birthCity || '',
    birthYear: form.birthYear,
    birthMonth: form.birthMonth,
    birthDay: form.birthDay,
    birthHour: form.birthHour === '' || form.birthHour == null ? 12 : form.birthHour,
    birthMinute: form.birthMinute === '' || form.birthMinute == null ? 0 : form.birthMinute
  }
  app.setUserData(u)
  if (app.currentService === '八字合婚') {
    app.setPartnerData({
      partnerName: form.partnerName,
      partnerGender: form.partnerGender,
      partnerBirthCity: form.partnerBirthCity || '',
      partnerBirthYear: form.partnerBirthYear,
      partnerBirthMonth: form.partnerBirthMonth,
      partnerBirthDay: form.partnerBirthDay,
      partnerBirthHour: form.partnerBirthHour === '' || form.partnerBirthHour == null ? 12 : form.partnerBirthHour,
      partnerBirthMinute: form.partnerBirthMinute === '' || form.partnerBirthMinute == null ? 0 : form.partnerBirthMinute
    })
  } else {
    app.setPartnerData(null)
  }
}

function validate() {
  if (!form.name?.trim()) return '请输入姓名'
  if (!form.gender) return '请选择性别'
  if (!form.birthYear || !form.birthMonth || !form.birthDay) return '请选择完整出生日期'
  if (app.currentService === '八字合婚') {
    if (!form.partnerName?.trim()) return '请输入伴侣姓名'
    if (!form.partnerGender) return '请选择伴侣性别'
  }
  return null
}

const emit = defineEmits(['submit'])
function submit() {
  const err = validate()
  if (err) {
    alert(err)
    return
  }
  collect()
  emit('submit')
}
</script>

<style scoped>
.info-section { padding: 24px 16px; max-width: 1200px; margin: 0 auto; }
.section-title { margin-bottom: 20px; }
.section-title h2 { color: var(--primary-color); font-size: 1.5rem; }
.section-title p { color: #666; margin-top: 6px; }
.form-container { background: #fff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
.form-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 16px; margin-bottom: 16px; }
.form-row { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.form-group label { display: block; margin-bottom: 6px; font-weight: 600; color: var(--text-color); }
.form-group label.required::after { content: ' *'; color: var(--error-color); }
.form-group input, .form-group select { width: 100%; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px; font-size: 14px; }
.birth-time-group { margin-bottom: 16px; }
.birth-time-group > label { display: block; margin-bottom: 8px; font-weight: 600; }
.partner-info-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee; }
.partner-info-section h3 { margin-bottom: 16px; color: var(--primary-color); }
.form-actions { margin-top: 24px; }
.analyze-btn {
  width: 100%; max-width: 320px; padding: 14px 24px; font-size: 16px; font-weight: 600;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color)); color: #fff;
  border: none; border-radius: 28px; cursor: pointer; box-shadow: 0 4px 14px rgba(139,69,19,0.3);
}
.analyze-btn:hover:not(:disabled) { opacity: 0.95; transform: translateY(-1px); }
.analyze-btn:disabled { opacity: 0.7; cursor: not-allowed; }
</style>
