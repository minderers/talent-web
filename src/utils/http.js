import axios from 'axios'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import router from '@/router'

const baseURL = import.meta.env.VITE_API_URL

const instance = axios.create({
  baseURL,
  timeout: 60000,
})

;(instance.interceptors.request.use(
  (config) => {
    const userStore = useUserStore()
    // 使用可选链操作符,以防 userInfo 为 null
    const token =
      userStore.userInfo?.accessToken || userStore.token || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `${token}`
    }
    return config
  },
  (err) => Promise.reject(err),
),
  instance.interceptors.response.use(
    (res) => {
      // 统一返回 res.data
      const responseData = res.data || {}
      // 检查 code 是否存在且不为 0，如果 code 不存在，则视为成功
      if (responseData.code !== undefined && responseData.code !== 0) {
        ElMessage.error(responseData.msg || '服务异常')
        // 如果有业务错误，则将 Promise 置为 rejected 状态
        return Promise.reject(responseData)
      }
      // 如果没有业务错误，则直接返回数据
      return responseData
    },
    (err) => {
      if (err.response?.status === 401) {
        const userStore = useUserStore()
        userStore.clearUserInfo()
        router.push('/login')
      }

      ElMessage.error(err.response?.data.msg || '服务异常')
      return Promise.reject(err)
    },
  ))

export default instance
export { baseURL }
