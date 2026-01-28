<template>
  <div class="app">
    <DisclaimerBar />
    <Home />
  </div>
</template>

<script setup>
import DisclaimerBar from './components/DisclaimerBar.vue'
import Home from './views/Home.vue'
</script>

<style scoped>
.app { min-height: 100vh; }
</style>
