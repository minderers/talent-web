<template>
  <div>
    <!-- 页面头部 -->
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-green-400">职位列表</h1>
      <!-- 用户头像和退出按钮将保留在 Home.vue 的主布局中 -->
    </header>

    <!-- 筛选区域 -->
    <div class="mb-8 p-6 bg-slate-800/50 rounded-xl border border-slate-700">
      <div class="flex flex-col md:flex-row gap-6 items-center">
        <el-input
          v-model="filters.jobName"
          placeholder="输入职位名称"
          clearable
          class="w-full md:w-auto flex-1"
        />
        <el-input
          v-model="filters.region"
          placeholder="输入地区"
          clearable
          class="w-full md:w-auto flex-1"
        />
        <el-select
          v-model="filters.salaryRange"
          placeholder="选择薪资范围"
          clearable
          class="w-full md:w-auto flex-1"
        >
          <el-option label="5k-10k" value="5-10" />
          <el-option label="10k-15k" value="10-15" />
          <el-option label="15k-20k" value="15-20" />
          <el-option label="20k以上" value="20-" />
        </el-select>
        <div class="flex space-x-4">
          <el-button @click="resetFilters">重置</el-button>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </div>
      </div>
    </div>

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
const total = ref(0)

const pagination = reactive({
  page: 1,
  limit: 9,
})

const initialFilters = {
  jobName: '',
  region: '',
  salaryRange: '',
}

const filters = reactive({ ...initialFilters })

// 获取职位列表
const fetchJobs = async () => {
  if (loading.value) return
  loading.value = true
  try {
    let minSalary, maxSalary
    if (filters.salaryRange) {
      const [min, max] = filters.salaryRange.split('-')
      minSalary = min ? Number(min) : undefined
      maxSalary = max ? Number(max) : undefined
    }

    const params = {
      ...pagination,
      jobName: filters.jobName || undefined,
      region: filters.region || undefined,
      minSalary,
      maxSalary,
    }
    const res = await getJobPage(params)
    jobList.value = res.data.list
    total.value = res.data.total
  } catch (error) {
    ElMessage.error('获取职位列表失败')
  } finally {
    loading.value = false
  }
}

// 处理搜索
const handleSearch = () => {
  pagination.page = 1 // 搜索时回到第一页
  fetchJobs()
}

// 重置筛选
const resetFilters = () => {
  Object.assign(filters, initialFilters)
  handleSearch()
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
