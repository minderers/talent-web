<template>
  <div>
    <!-- 页面头部 -->
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-green-400">职位列表</h1>
      <!-- 用户头像和退出按钮将保留在 Home.vue 的主布局中 -->
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="text-center py-10">
      <p class="text-lg text-slate-400">正在加载职位数据...</p>
    </div>

    <!-- 职位卡片列表 -->
    <div
      v-else-if="jobList.length > 0"
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <div
        v-for="job in jobList"
        :key="job.pkId"
        class="bg-slate-800/80 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg p-6 transform transition-all duration-300 hover:scale-105 hover:border-green-400"
      >
        <h2 class="text-xl font-semibold text-white mb-2">
          {{ job.jobName }}
        </h2>
        <p class="text-green-400 mb-4">{{ job.companyName }}</p>
        <p class="text-slate-300 text-sm mb-1">
          <span class="font-semibold">薪资:</span> {{ job.salaryRange }}
        </p>
        <p class="text-slate-300 text-sm">
          <span class="font-semibold">地点:</span> {{ job.region }}
        </p>
      </div>
    </div>

    <!-- 无数据状态 -->
    <div v-else class="text-center py-10">
      <p class="text-lg text-slate-400">暂无职位信息</p>
    </div>

    <!-- 分页器 -->
    <div v-if="total > 0" class="flex justify-center mt-8">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pagination.limit"
        v-model:current-page="pagination.page"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getJobPage } from '@/api/job'
import { ElMessage } from 'element-plus'

const jobList = ref([])
const loading = ref(false)
const pagination = reactive({
  page: 1,
  limit: 9,
})
const total = ref(0)

// 获取职位列表
const fetchJobs = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res = await getJobPage(pagination)
    jobList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取职位列表失败')
  } finally {
    loading.value = false
  }
}

// 处理分页变化
const handlePageChange = (newPage) => {
  pagination.page = newPage
  fetchJobs()
}

// 组件挂载时获取初始数据
onMounted(() => {
  fetchJobs()
})
</script>

<style scoped>
/* 如果有特定于此组件的样式，可以写在这里 */
</style>
