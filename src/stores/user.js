import { defineStore } from 'pinia'
import { ref } from 'vue'

// 定义 Store
export const useUserStore = defineStore(
  'user',
  () => {
    // 登录用户信息
    const userInfo = ref(null)

    // 保存登录用户信息
    const setUserInfo = (val) => {
      userInfo.value = val
    }

    // 清除登录用户信息
    const clearUserInfo = () => {
      userInfo.value = null
    }

    // 记得 return
    return {
      userInfo,
      setUserInfo,
      clearUserInfo,
    }
  },
  {
    unistorage: true, // 开启后，userStore 下的所有数据都将自动持久化
  },
)
