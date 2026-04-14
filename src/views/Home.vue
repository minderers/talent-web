<template>
  <el-container class="h-screen bg-slate-900 text-white">
    <!-- Left Sidebar -->
    <el-aside width="200px" class="bg-slate-800 p-4">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-xl font-bold text-green-400">导航菜单</h1>
      </div>
      <nav>
        <ul>
          <li v-for="item in filteredMenuItems" :key="item.id" class="mb-2">
            <button
              @click="activeTab = item.id"
              :class="[
                'w-full text-left px-3 py-2 rounded-md transition-colors duration-200 focus:outline-none',
                activeTab === item.id
                  ? 'font-bold text-green-400 bg-slate-700'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white',
              ]"
            >
              {{ item.name }}
            </button>
          </li>
        </ul>
      </nav>
    </el-aside>

    <!-- Main Content -->
    <el-main class="p-4 sm:p-6 lg:p-8">
      <div class="flex justify-end items-center mb-8">
        <div class="flex items-center space-x-4">
          <el-avatar
            :src="userStore.userInfo?.avatar"
            class="cursor-pointer"
            @click="openProfileDialog"
          />
          <button
            @click="handleLogout"
            class="py-2 px-4 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 transition-transform transform hover:scale-105"
          >
            退出登录
          </button>
        </div>
      </div>
      <!-- 动态组件渲染 -->
      <keep-alive>
        <component :is="currentComponent" />
      </keep-alive>
    </el-main>
  </el-container>

  <!-- 自定义用户信息弹窗 -->
  <div
    v-if="isProfileDialogVisible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click.self="isProfileDialogVisible = false"
  >
    <div class="w-full max-w-lg rounded-lg border border-green-400/20 bg-slate-800 shadow-xl">
      <!-- 弹窗头部 -->
      <div class="flex items-center justify-between border-b border-slate-700 p-4">
        <h2 class="text-xl font-bold text-green-400">个人信息</h2>
        <button
          @click="isProfileDialogVisible = false"
          class="text-slate-400 transition-colors hover:text-green-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- 弹窗主体 -->
      <div class="p-6">
        <el-form :model="profileForm" label-width="80px">
          <el-form-item label="头像">
            <el-upload
              class="avatar-uploader"
              :show-file-list="false"
              :http-request="handleAvatarUpload"
              :before-upload="beforeAvatarUpload"
            >
              <img v-if="profileForm.avatar" :src="profileForm.avatar" class="avatar" />
              <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
            </el-upload>
          </el-form-item>
          <el-form-item label="学号">
            <el-input v-model="profileForm.userCode" disabled />
          </el-form-item>
          <el-form-item label="昵称">
            <el-input v-model="profileForm.nickname" />
          </el-form-item>
          <el-form-item label="角色">
            <el-input :value="roleName" disabled />
          </el-form-item>
          <el-form-item label="新密码">
            <el-input v-model="profileForm.password" type="password" placeholder="留空则不修改" />
          </el-form-item>
          <el-form-item label="手机号">
            <div v-if="profileForm.phone" class="flex w-full items-center">
              <el-input v-model="profileForm.phone" disabled class="mr-2" />
              <el-button type="primary" link @click="openPhoneDialog(false)">修改</el-button>
            </div>
            <div v-else>
              <el-button type="primary" @click="openPhoneDialog(true)">绑定手机号</el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 弹窗底部 -->
      <div class="flex justify-end space-x-4 rounded-b-lg bg-slate-800/50 p-4">
        <button
          @click="isProfileDialogVisible = false"
          class="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          取消
        </button>
        <button
          @click="handleProfileUpdate"
          class="rounded-md border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          保存
        </button>
      </div>
    </div>
  </div>

  <!-- 自定义手机号操作弹窗 -->
  <div
    v-if="isPhoneDialogVisible"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click.self="isPhoneDialogVisible = false"
  >
    <div class="w-full max-w-md rounded-lg border border-green-400/20 bg-slate-800 shadow-xl">
      <!-- 弹窗头部 -->
      <div class="flex items-center justify-between border-b border-slate-700 p-4">
        <h2 class="text-xl font-bold text-green-400">
          {{ isBinding ? '绑定手机号' : '修改手机号' }}
        </h2>
        <button
          @click="isPhoneDialogVisible = false"
          class="text-slate-400 transition-colors hover:text-green-400"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- 弹窗主体 -->
      <div class="p-6">
        <el-form :model="phoneForm" label-width="80px">
          <el-form-item label="手机号">
            <el-input v-model="phoneForm.phone" placeholder="请输入新的手机号" />
          </el-form-item>
          <el-form-item label="验证码">
            <div class="flex w-full items-center">
              <el-input v-model="phoneForm.code" placeholder="请输入验证码" class="mr-2" />
              <el-button @click="handleSendCode" :disabled="countdown > 0">
                {{ countdown > 0 ? `${countdown}s` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <!-- 弹窗底部 -->
      <div class="flex justify-end space-x-4 rounded-b-lg bg-slate-800/50 p-4">
        <button
          @click="isPhoneDialogVisible = false"
          class="rounded-md border border-slate-600 px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-700 hover:text-white"
        >
          取消
        </button>
        <button
          @click="handlePhoneUpdate"
          class="rounded-md border border-green-600 bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
        >
          确认
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue' // Add watch
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { logout, updateUserInfo, updateUserPhone, sendSmsCode } from '@/api/user'
import { uploadImage } from '@/api/common'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

// 导入子组件
import IndustryDatabase from './home-components/IndustryDatabase.vue'
import TalentDemandForecast from './home-components/TalentDemandForecast.vue'
import MajorSetupSuggestion from './home-components/MajorSetupSuggestion.vue'
import MajorJobMatch from './home-components/MajorJobMatch.vue'
import JobList from './home-components/JobList.vue'
import DataAnalysis from './home-components/DataAnalysis.vue'
import AiQa from './home-components/AiQa.vue'

const router = useRouter()
const userStore = useUserStore()

// --- 个人信息弹窗 ---
const isProfileDialogVisible = ref(false)
const profileForm = reactive({
  pkId: null,
  userCode: '',
  nickname: '',
  avatar: '',
  role: null,
  phone: '',
  password: '', // 用于“新密码”输入框
  originalPassword: '', // 用于存储获取到的原始密码
})

// --- 手机号弹窗 ---
const isPhoneDialogVisible = ref(false)
const isBinding = ref(true) // true: 绑定, false: 修改
const countdown = ref(0)
const phoneForm = reactive({
  phone: '',
  code: '',
})

const roleName = computed(() => {
  switch (profileForm.role) {
    case 0:
      return '专业负责人'
    case 1:
      return '教务管理员'
    case 2:
      return '学生'
    default:
      return '未知'
  }
})

// 打开个人信息弹窗
const openProfileDialog = () => {
  onProfileDialogOpened() // 先填充数据
  isProfileDialogVisible.value = true // 再显示弹窗
}

// 打开个人信息弹窗时，用 store 中的数据填充表单
const onProfileDialogOpened = () => {
  const userInfo = userStore.userInfo
  if (userInfo) {
    profileForm.pkId = userInfo.pkId
    profileForm.userCode = userInfo.userCode
    profileForm.nickname = userInfo.nickname
    profileForm.avatar = userInfo.avatar
    profileForm.role = userInfo.role
    profileForm.phone = userInfo.phone
    profileForm.password = '' // 清空“新密码”输入框
    profileForm.originalPassword = userInfo.password // 存储原始密码
  }
}

// 打开手机号弹窗
const openPhoneDialog = (binding) => {
  isBinding.value = binding
  phoneForm.phone = ''
  phoneForm.code = ''
  countdown.value = 0
  isPhoneDialogVisible.value = true
}

// 发送验证码
const handleSendCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(phoneForm.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }
  try {
    // 调用发送验证码的 API
    await sendSmsCode(phoneForm.phone)
    ElMessage.success('验证码已发送')
    // 开始倒计时
    countdown.value = 60
    const timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    ElMessage.error('验证码发送失败')
  }
}

// 确认更新手机号
const handlePhoneUpdate = async () => {
  try {
    await updateUserPhone(phoneForm.phone, phoneForm.code)
    ElMessage.success('手机号更新成功！')
    await userStore.getUserInfo() // 刷新用户信息
    isPhoneDialogVisible.value = false
    isProfileDialogVisible.value = false // 关闭主弹窗以刷新数据
    isProfileDialogVisible.value = true
  } catch (error) {
    ElMessage.error('手机号更新失败，请检查验证码是否正确')
  }
}

// 自定义头像上传
const handleAvatarUpload = async ({ file }) => {
  try {
    const res = await uploadImage(file)
    profileForm.avatar = res.data
    ElMessage.success('头像上传成功！')
  } catch (error) {
    ElMessage.error('头像上传失败')
  }
}

// 上传前检查
const beforeAvatarUpload = (rawFile) => {
  if (rawFile.type !== 'image/jpeg' && rawFile.type !== 'image/png') {
    ElMessage.error('头像必须是 JPG 或 PNG 格式!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    ElMessage.error('头像大小不能超过 2MB!')
    return false
  }
  return true
}

// 更新用户信息
const handleProfileUpdate = async () => {
  try {
    const dataToUpdate = {
      pkId: profileForm.pkId,
      nickname: profileForm.nickname,
      avatar: profileForm.avatar,
      password: profileForm.password || profileForm.originalPassword,
    }

    await updateUserInfo(dataToUpdate)

    // 如果修改了密码，则显示成功消息并立即执行登出
    if (profileForm.password) {
      ElMessage.success('密码已修改，将立即退出登录')
      isProfileDialogVisible.value = false
      handleLogout() // 直接调用登出，清除token并跳转
      return // 提前结束函数
    }

    // 如果没修改密码，则正常更新 store 并关闭弹窗
    ElMessage.success('用户信息更新成功！')
    userStore.userInfo.nickname = profileForm.nickname
    userStore.userInfo.avatar = profileForm.avatar
    isProfileDialogVisible.value = false
  } catch (error) {
    // 此处的 catch 现在只应捕获真正的更新失败
    ElMessage.error('用户信息更新失败')
  }
}

// Tab 控制
const activeTab = ref('jobList') // Default to 'jobList'
const menuItems = ref([
  // { id: 'industryDatabase', name: '产业数据库', component: IndustryDatabase },
  { id: 'jobList', name: '岗位列表', component: JobList },
  { id: 'talentDemandForecast', name: '人才需求分析', component: TalentDemandForecast },
  { id: 'dataAnalysis', name: '数据采集与分析', component: DataAnalysis },
  { id: 'majorJobMatch', name: '专业-岗位匹配评估', component: MajorJobMatch },
  { id: 'majorSetupSuggestion', name: '专业设置建议', component: MajorSetupSuggestion },
  { id: 'aiQa', name: 'AI智能问答', component: AiQa },
])

const filteredMenuItems = computed(() => {
  const role = userStore.userInfo?.role
  if (role === undefined || role === null) {
    return []
  }
  return menuItems.value.filter((item) => {
    if (item.id === 'majorSetupSuggestion') {
      return role === 0 || role === 1 // Only show for role 0 (专业负责人) or 1 (教务管理员)
    }
    return true // Show other items for all roles by default
  })
})

const currentComponent = computed(() => {
  const activeItem = filteredMenuItems.value.find((item) => item.id === activeTab.value)
  return activeItem ? activeItem.component : null
})

// Watch for role changes and adjust activeTab if necessary
watch(
  () => userStore.userInfo?.role,
  (newRole) => {
    // If the current active tab is 'majorSetupSuggestion' and the new role doesn't have access
    if (activeTab.value === 'majorSetupSuggestion' && !(newRole === 0 || newRole === 1)) {
      // Find the first available tab for the new role
      const firstAvailableTab =
        filteredMenuItems.value.length > 0 ? filteredMenuItems.value[0].id : ''
      activeTab.value = firstAvailableTab
    } else if (
      filteredMenuItems.value.length > 0 &&
      !filteredMenuItems.value.some((item) => item.id === activeTab.value)
    ) {
      // If current active tab is not in filteredMenuItems (e.g., after initial load or role change)
      activeTab.value = filteredMenuItems.value[0].id
    }
  },
  { immediate: true },
) // Run immediately on component mount to set initial activeTab based on role

// 退出登录
const handleLogout = async () => {
  try {
    // 尝试调用后端退出登录接口
    await logout()
  } catch (error) {
    // 即便后端接口失败，也继续执行登出流程
    console.error('调用退出登录接口失败:', error)
  } finally {
    // 无论后端退出成功与否，都清空前端状态并跳转
    userStore.clearUserInfo()
    userStore.clearToken()
    router.push('/login')
  }
}
</script>

<style lang="scss" scoped>
.avatar-uploader .avatar {
  width: 100px;
  height: 100px;
  display: block;
}

.avatar-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.avatar-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
}

/* --- 深色主题适配 --- */

/* 弹窗样式 */
:deep(.el-dialog) {
  --el-dialog-title-font-size: 1.25rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(56, 189, 128, 0.2); // border-green-400/20
  overflow: hidden; /* 关键：确保子元素的圆角被裁切 */
  background: transparent; /* 移除父容器的背景 */
}

:deep(.el-dialog__header) {
  background-color: #1e293b; // bg-slate-800
  margin-right: 0;
}

:deep(.el-dialog__body) {
  background-color: #1e293b; // bg-slate-800
}

:deep(.el-dialog__footer) {
  background-color: #1e293b; // bg-slate-800
}

:deep(.el-dialog__title) {
  color: #4ade80; // text-green-400
  font-weight: bold;
}

:deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #cbd5e1; // text-slate-300
  &:hover {
    color: #4ade80; // text-green-400
  }
}

/* 表单样式 */
:deep(.el-form-item__label) {
  color: #cbd5e1; // text-slate-300
}

:deep(.el-input__wrapper) {
  background-color: #334155; // bg-slate-700
  box-shadow: none;
  border: 1px solid transparent;
  transition: border-color 0.2s;
  &:hover {
    border-color: #4ade80; // text-green-400
  }
}

:deep(.el-input__inner) {
  color: #f1f5f9; // text-slate-100
}

:deep(.el-input.is-disabled .el-input__wrapper) {
  background-color: #475569; // bg-slate-600
}

:deep(.el-input.is-disabled .el-input__inner) {
  color: #94a3b8; // text-slate-400
}

/* 按钮样式 */
:deep(.el-button--primary) {
  background-color: #16a34a; // bg-green-600
  border-color: #16a34a;
  &:hover {
    background-color: #15803d; // bg-green-700
    border-color: #15803d;
  }
}

:deep(.el-button) {
  background-color: #475569; // bg-slate-600
  border-color: #475569;
  color: white;
  &:hover {
    background-color: #334155; // bg-slate-700
    border-color: #334155;
  }
}

:deep(.el-button--primary.is-link) {
  color: #4ade80; // text-green-400
  background-color: transparent;
  border-color: transparent;
  &:hover {
    color: #86efac; // lighter green
  }
}

/* 分页器样式 */
:deep(.el-pagination.is-background .el-pager li) {
  background-color: #334155; // bg-slate-700
  color: #cbd5e1; // text-slate-300
}

:deep(.el-pagination.is-background .el-pager li:hover) {
  color: #4ade80; // text-green-400
}

:deep(.el-pagination.is-background .el-pager li.is-active) {
  background-color: #16a34a; // bg-green-600
  color: white;
}

:deep(.el-pagination.is-background .btn-next),
:deep(.el-pagination.is-background .btn-prev) {
  background-color: #334155;
  color: #cbd5e1;
}
</style>
