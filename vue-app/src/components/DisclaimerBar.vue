<template>
  <div class="disclaimer-bar">
    <div class="disclaimer-wrapper">
      <div class="disclaimer-content">
        <strong>重要声明：</strong>本平台提供的命理分析服务仅供娱乐参考，不构成任何实际的人生建议或决策依据。命运掌握在自己手中，请理性对待分析结果，切勿迷信。本服务基于传统命理学说，分析结果仅供参考。
      </div>
    </div>
  </div>
</template>

<style scoped>
.disclaimer-bar {
  background: linear-gradient(135deg, var(--accent-color), var(--dark-color));
  color: white;
  padding: 10px 0;
  overflow: hidden;
  font-size: 14px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}
.disclaimer-wrapper {
  display: flex;
  width: max-content;
  animation: scrollLeft 28s linear infinite;
}
.disclaimer-content {
  white-space: nowrap;
  padding: 0 20px;
}
@keyframes scrollLeft {
  0% { transform: translateX(calc(100vw - 8%)); }
  100% { transform: translateX(-100%); }
}
</style>
