<template>
  <header>
    <ul class="service-nav">
      <li v-for="name in config.serviceNames" :key="name">
        <a
          href="#"
          :class="{ active: app.currentService === name }"
          @click.prevent="app.setService(name); onSwitch()"
        >
          {{ name }}
        </a>
      </li>
    </ul>
  </header>
</template>

<script setup>
import { useAppStore } from '../stores/app.js'
import { useConfigStore } from '../stores/config.js'

const app = useAppStore()
const config = useConfigStore()

function onSwitch() {
  app.resetOnServiceChange()
}
</script>

<style scoped>
header {
  background: white;
  padding: 8px 12px;
  box-shadow: 0 2px 15px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 1000;
}
.service-nav {
  display: flex;
  list-style: none;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
  margin: 0;
  padding: 0;
}
.service-nav a {
  text-decoration: none;
  color: var(--text-color);
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 20px;
  transition: all 0.3s ease;
  font-size: 13px;
  white-space: nowrap;
}
.service-nav a:hover {
  background: linear-gradient(135deg, var(--secondary-color), var(--primary-color));
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(212, 175, 55, 0.3);
}
.service-nav a.active {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  box-shadow: 0 4px 12px rgba(139, 69, 19, 0.3);
}

/* 响应式设计 */
@media (max-width: 768px) {
  header {
    padding: 6px 10px;
  }
  
  .service-nav {
    gap: 6px;
  }
  
  .service-nav a {
    padding: 4px 10px;
    font-size: 12px;
  }
}
</style>
