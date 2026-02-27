<template>
  <router-view />
  <!-- Toast 通知容器 -->
  <div class="toast-container" id="toastContainer"></div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth.js'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

onMounted(() => {
  // 恢复登录态
  auth.restoreSession()
})
</script>
