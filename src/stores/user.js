import { defineStore } from 'pinia'
import { getUserInfo } from '../api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    userInfo: null,
    token: '',
  }),

  actions: {
    setUserInfo(info) {
      this.userInfo = info
    },

    setToken(newToken) {
      this.token = newToken
      localStorage.setItem('token', newToken)
    },

    clearUserInfo() {
      this.userInfo = null
    },

    clearToken() {
      this.token = ''
      localStorage.removeItem('token')
      localStorage.removeItem('userId')
    },

    async getLoginUserInfo() {
      try {
        const res = await getUserInfo()
        if (res.code === 0 && res.data) {
          this.setUserInfo(res.data)
        } else {
          throw new Error(res.msg || '获取用户信息失败')
        }
      } catch (error) {
        console.error('获取用户信息失败:', error)
        this.clearUserInfo()
        this.clearToken()
        throw error
      }
    },
  },

  persist: {
    key: 'user-store',
    storage: localStorage,
    paths: ['token', 'userInfo'], // 指定要持久化的字段
  },
})
