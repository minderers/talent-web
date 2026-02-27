<template>
  <div class="h-full min-h-0 flex flex-col">
    <header class="flex justify-between items-center mb-4">
      <h1 class="text-2xl font-bold text-green-400">专业规划指导</h1>
    </header>
    <div class="flex h-full min-h-0 gap-6">
      <div class="w-80 bg-slate-800/80 border border-green-400/20 rounded-2xl p-6 overflow-y-auto">
        <div class="space-y-6">
          <div class="space-y-3">
            <h3 class="text-base font-semibold text-green-400">生成与润色</h3>
            <el-input v-model="form.jobType" placeholder="岗位类型(可选)" />
            <el-input v-model="form.education" placeholder="学历(可选)" />
            <el-button class="w-full" type="primary" :loading="loading.ai" @click="handleAi"
              >生成AI规划建议</el-button
            >
          </div>
          <div class="space-y-3">
            <h3 class="text-base font-semibold text-green-400">报告导出</h3>
            <el-input v-model="exportFilename" placeholder="输出文件名(不含扩展名)" />
            <div class="flex gap-3 justify-center">
              <el-button @click="handleExportExcel">导出Excel</el-button>
              <el-button @click="handleExportWord">导出Word</el-button>
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-base font-semibold text-green-400">建议进度管理</h3>
            <div class="grid grid-cols-3 gap-2">
              <el-select v-model="adviceFilter.type" placeholder="类型" clearable>
                <el-option
                  v-for="opt in typeOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-select v-model="adviceFilter.status" placeholder="状态" clearable>
                <el-option
                  v-for="opt in statusOptions"
                  :key="opt.value"
                  :label="opt.label"
                  :value="opt.value"
                />
              </el-select>
              <el-input v-model="adviceFilter.keyword" placeholder="关键词" />
            </div>
            <div class="mt-2 flex gap-2">
              <el-button type="primary" :loading="loading.adviceList" @click="handleAdviceSearch"
                >查询建议</el-button
              >
              <el-button @click="handleAdviceReset">重置</el-button>
            </div>
            <div class="mt-3">
              <el-table
                :data="adviceList"
                size="small"
                border
                :header-cell-class-name="'bg-slate-700/50 text-green-300'"
              >
                <el-table-column prop="title" label="标题" min-width="180" />
                <el-table-column label="类型" min-width="120">
                  <template #default="scope">{{ formatType(scope.row.type) }}</template>
                </el-table-column>
                <el-table-column label="状态" min-width="140">
                  <template #default="scope">
                    <el-select v-model="scope.row.status" placeholder="状态" class="w-full">
                      <el-option
                        v-for="opt in statusOptions"
                        :key="opt.value"
                        :label="opt.label"
                        :value="opt.value"
                      />
                    </el-select>
                  </template>
                </el-table-column>
                <el-table-column label="优先级" min-width="120">
                  <template #default="scope">
                    <el-input-number v-model="scope.row.priority" :min="0" />
                  </template>
                </el-table-column>
                <el-table-column prop="reason" label="原因" min-width="220" />
                <el-table-column label="结果" min-width="220">
                  <template #default="scope">
                    <el-input v-model="scope.row.result" placeholder="实施结果" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="180" fixed="right">
                  <template #default="scope">
                    <el-button size="small" @click="handleAdviceUpdate(scope.row)"
                      >保存更新</el-button
                    >
                    <el-button size="small" type="danger" @click="handleAdviceDelete(scope.row)"
                      >删除</el-button
                    >
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
          <div class="space-y-2">
            <h3 class="text-base font-semibold text-green-400">效果评估</h3>
            <div class="flex items-center justify-center gap-3">
              <el-button :loading="loading.evaluate" @click="handleEvaluate"
                >评估实施效果</el-button
              >
              <span v-if="effectScore !== null" class="text-green-400"
                >当前匹配度: {{ effectScore }}</span
              >
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 bg-slate-800/80 border border-blue-400/20 rounded-2xl p-6 overflow-y-auto">
        <h3 class="text-xl font-semibold text-blue-400 mb-4">AI规划建议</h3>
        <div class="prose prose-invert max-w-none" v-html="aiHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getPlanningAiStream,
  downloadPlanningExcel,
  downloadPlanningWord,
  evaluateEffect,
  getAdviceList,
  updateAdvice,
  deleteAdvice,
} from '@/api/planning'
import { marked } from 'marked'

const form = reactive({
  majorId: 1,
  jobType: '',
  education: '',
})
const exportYear = ref(new Date().getFullYear())
const exportFilename = ref('planning')
const loading = reactive({
  ai: false,
  evaluate: false,
  adviceList: false,
})
const aiMarkdown = ref('')
const aiHtml = computed(() => (aiMarkdown.value ? marked(aiMarkdown.value) : ''))
const effectScore = ref(null)
const adviceFilter = reactive({
  type: undefined,
  status: undefined,
  keyword: '',
})
const adviceList = ref([])
const typeOptions = [
  { label: '新增方向', value: 0 },
  { label: '课程/实训', value: 1 },
]
const statusOptions = [
  { label: '未开始', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
]

const handleAi = async () => {
  if (!form.majorId) {
    ElMessage.warning('请填写专业ID')
    return
  }
  loading.ai = true
  aiMarkdown.value = ''
  try {
    await getPlanningAiStream({
      majorId: form.majorId,
      jobType: form.jobType || undefined,
      education: form.education || undefined,
      onProgress: (chunk) => {
        aiMarkdown.value += chunk
      },
    })
    ElMessage.success('AI规划建议生成完成')
  } catch (e) {
    ElMessage.error('生成失败')
  } finally {
    loading.ai = false
  }
}

const handleExportExcel = async () => {
  if (!form.majorId) {
    ElMessage.warning('请填写专业ID')
    return
  }
  try {
    await downloadPlanningExcel({
      majorId: form.majorId,
      year: exportYear.value,
      filename: `${(exportFilename.value || 'planning').trim()}.xlsx`,
    })
    ElMessage.success('Excel已下载')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

const handleExportWord = async () => {
  if (!form.majorId) {
    ElMessage.warning('请填写专业ID')
    return
  }
  try {
    await downloadPlanningWord({
      majorId: form.majorId,
      year: exportYear.value,
      filename: `${(exportFilename.value || 'planning').trim()}.docx`,
    })
    ElMessage.success('Word已下载')
  } catch (e) {
    ElMessage.error('导出失败')
  }
}

const handleEvaluate = async () => {
  if (!form.majorId) {
    ElMessage.warning('请填写专业ID')
    return
  }
  loading.evaluate = true
  try {
    const res = await evaluateEffect({
      majorId: form.majorId,
      jobType: form.jobType || undefined,
      education: form.education || undefined,
    })
    effectScore.value = res.data
    ElMessage.success('评估完成')
  } catch (e) {
    ElMessage.error('评估失败')
  } finally {
    loading.evaluate = false
  }
}

const handleAdviceSearch = async () => {
  loading.adviceList = true
  try {
    const params = {
      ...(adviceFilter.type !== undefined && adviceFilter.type !== null
        ? { type: adviceFilter.type }
        : {}),
      ...(adviceFilter.status !== undefined && adviceFilter.status !== null
        ? { status: adviceFilter.status }
        : {}),
      ...(adviceFilter.keyword ? { keyword: adviceFilter.keyword } : {}),
    }
    const res = await getAdviceList(params)
    const raw = Array.isArray(res.data) ? res.data : res.data?.list || []
    adviceList.value = raw.filter((x) => !x.delete_flag)
  } catch (e) {
    ElMessage.error('查询失败')
  } finally {
    loading.adviceList = false
  }
}

const handleAdviceUpdate = async (item) => {
  try {
    await updateAdvice({
      id: item.id,
      status: item.status,
      priority: item.priority,
      result: item.result,
    })
    ElMessage.success('更新成功')
    await handleAdviceSearch()
  } catch (e) {
    ElMessage.error('更新失败')
  }
}

const handleAdviceDelete = async (item) => {
  try {
    await deleteAdvice({ id: item.id })
    adviceList.value = adviceList.value.filter((x) => x.id !== item.id)
    ElMessage.success('删除成功')
  } catch (e) {
    ElMessage.error('删除失败')
  }
}

const formatType = (t) => {
  const found = typeOptions.find((x) => x.value === t)
  return found ? found.label : t
}

const handleAdviceReset = () => {
  adviceFilter.type = undefined
  adviceFilter.status = undefined
  adviceFilter.keyword = ''
}
</script>

<style scoped></style>
