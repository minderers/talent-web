<template>
  <div class="min-h-screen relative">
    <!-- 调用技术背景组件 -->
    <TechBackground
      :show-glow="true"
      :animated="true"
      code-density="25"
      particle-density="60"
      animation-speed="1"
      theme="green"
    />

    <!-- 登录表单容器 -->
    <div class="relative z-10 min-h-screen flex items-center justify-center p-4">
      <div
        class="w-full max-w-md bg-slate-800/80 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-2xl p-8 transform transition-all duration-500 hover:scale-105"
      >
        <!-- Logo区域 -->
        <div class="text-center mb-8">
          <div
            class="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center text-slate-900 text-2xl font-bold shadow-lg shadow-green-400/50 animate-pulse"
          >
            软
          </div>

          <h1 class="text-2xl font-bold text-white mb-2">软件产业人才供需匹配与专业规划系统</h1>
          <p class="text-green-400 text-sm opacity-80">
            Software Industry Talent Matching & Career Planning System
          </p>
        </div>

        <!-- 登录表单 -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- 学号输入 -->
          <div>
            <label for="userCode" class="block text-sm font-medium text-slate-300 mb-2">
              学号 / 工号 / ID
            </label>
            <input
              id="userCode"
              v-model="form.userCode"
              type="text"
              :class="[
                'w-full px-4 py-3 bg-slate-700/50 border rounded-lg',
                'text-white placeholder-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent',
                'transition-all duration-300',
                errors.userCode ? 'border-red-500' : 'border-slate-600',
              ]"
              placeholder="请输入您的学号/工号"
              maxlength="20"
            />
            <p v-if="errors.userCode" class="mt-1 text-sm text-red-500">
              {{ errors.userCode }}
            </p>
          </div>

          <!-- 密码输入 -->
          <div>
            <label for="password" class="block text-sm font-medium text-slate-300 mb-2">
              密码 / Password
            </label>
            <input
              id="password"
              v-model="form.password"
              type="password"
              :class="[
                'w-full px-4 py-3 bg-slate-700/50 border rounded-lg',
                'text-white placeholder-slate-400',
                'focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent',
                'transition-all duration-300',
                errors.password ? 'border-red-500' : 'border-slate-600',
              ]"
              placeholder="请输入您的密码"
              maxlength="30"
            />
            <p v-if="errors.password" class="mt-1 text-sm text-red-500">
              {{ errors.password }}
            </p>
          </div>

          <!-- 登录按钮 -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full py-3 px-4 bg-gradient-to-r from-green-400 to-blue-500 text-slate-900 font-semibold rounded-lg shadow-lg hover:shadow-green-400/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-slate-800"
          >
            <span v-if="!loading">登录系统 / Login</span>
            <span v-else class="flex items-center justify-center">
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  class="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  stroke-width="4"
                ></circle>
                <path
                  class="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              登录中...
            </span>
          </button>
        </form>

        <!-- 页脚 -->
        <div class="mt-8 pt-6 border-t border-slate-700 text-center">
          <p class="text-slate-400 text-sm">© 2026 软件产业人才供需匹配与专业规划系统</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { passwordLogin } from '@/api/user'
import { ElMessage } from 'element-plus'
import TechBackground from '@/components/TechBackground.vue' // 根据实际路径调整

// 响应式数据
const form = reactive({
  userCode: '',
  password: '',
})

const errors = reactive({
  userCode: '',
  password: '',
})

const loading = ref(false)
const router = useRouter()
const userStore = useUserStore()

// 表单验证
const validateForm = () => {
  let isValid = true

  // 重置错误
  errors.userCode = ''
  errors.password = ''

  if (!form.userCode.trim()) {
    errors.userCode = '请输入有效的学号/工号/ID'
    isValid = false
  }

  if (!form.password.trim()) {
    errors.password = '密码不能为空'
    isValid = false
  }

  return isValid
}

// 登录处理
const handleLogin = async () => {
  if (!validateForm()) return

  loading.value = true

  try {
    const res = await passwordLogin(form.userCode, form.password)
    // 将整个响应体存入 store，以确保 token 能被正确设置
    userStore.setUserInfo(res.data)
    userStore.setToken(res.data.accesstoken)
    // router.setLocalStorage('token', res.data.accesstoken)
    ElMessage.success('登录成功')
    router.push('/')
  } catch (error) {
    // API 错误已由 http.js 中的拦截器处理并提示，这里捕获异常以防止程序崩溃
    console.error('登录流程失败:', error)
  } finally {
    loading.value = false
  }
}
</script>
