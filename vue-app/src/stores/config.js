import { defineStore } from 'pinia'
import { API_BASE_URL, SERVICES } from '../config/services.js'

export const useConfigStore = defineStore('config', {
  state: () => ({
    API_BASE_URL,
    SERVICES
  }),
  getters: {
    serviceNames: (s) => Object.keys(s.SERVICES),
    getService: (s) => (name) => s.SERVICES[name] || null
  }
})
