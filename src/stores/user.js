import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义 Store
export const useUserStore = defineStore('user', () => {
  // 登录用户信息
  const userInfo = ref(null)

  // 保存登录用户信息
  const setUserInfo = (val) => {
    userInfo.value = val
  }

  // 清除登录用户信息
  const clearUserInfo = () => {
    userInfo.value = undefined
  }

  // 记得 return
  return {
    userInfo,
    setUserInfo,
    clearUserInfo,
  }
})
