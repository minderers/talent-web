<template>
  <div class="p-4">
    <h1 class="text-3xl font-bold underline mb-4">Home</h1>
    <button
      @click="handleLogout"
      class="py-2 px-4 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-75"
    >
      退出登录
    </button>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { logout } from '@/api/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()

const handleLogout = async () => {
  try {
    await logout()
    userStore.clearUserInfo()
    router.push('/login')
    ElMessage.success('已成功退出登录')
  } catch (error) {
    ElMessage.error('退出登录失败，请稍后重试')
  }
}
</script>

<style lang="scss" scoped></style>
