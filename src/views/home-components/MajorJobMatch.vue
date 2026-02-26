<template>
  <div>
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-green-400">专业-岗位匹配评估</h1>
    </header>

    <!-- 筛选区域 -->
    <div
      class="bg-slate-800/80 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg p-6 mb-8"
    >
      <el-form :model="analysisFilters" inline>
        <el-form-item label="岗位类型">
          <el-input v-model="analysisFilters.jobType" placeholder="例如: Java" clearable />
        </el-form-item>
        <el-form-item label="学历要求">
          <el-input v-model="analysisFilters.education" placeholder="例如: 本科" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleAnalysis" :loading="isAnalyzing">
            {{ isAnalyzing ? '正在分析...' : '开始分析' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 结果展示区域 -->
    <div v-if="isAnalyzing && !analysisResult && !streamAiAnalysis" class="text-center py-10">
      <p class="text-lg text-slate-400">正在分析中，请稍候...</p>
    </div>

    <div v-if="analysisResult" class="space-y-8">
      <!-- 匹配度 -->
      <div
        class="bg-slate-800/80 backdrop-blur-xl border border-green-400/20 rounded-2xl shadow-lg p-6 text-center"
      >
        <h2 class="text-2xl font-bold text-white mb-4">综合匹配度</h2>
        <div class="text-6xl font-bold text-green-400">
          {{ (analysisResult.matchScore * 100).toFixed(1) }}%
        </div>
      </div>

      <!-- 技能对比 -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- 行业高频技能 -->
        <div
          class="bg-slate-800/80 backdrop-blur-xl border border-blue-400/20 rounded-2xl shadow-lg p-6"
        >
          <h3 class="text-xl font-semibold text-blue-400 mb-4">行业高频技能</h3>
          <div v-if="analysisResult.industrySkills.length > 0" class="flex flex-wrap gap-2">
            <el-tag v-for="skill in analysisResult.industrySkills" :key="skill.pkId" type="info">{{
              skill.skillName
            }}</el-tag>
          </div>
          <p v-else class="text-slate-400">无</p>
        </div>

        <!-- 专业缺失技能 -->
        <div
          class="bg-slate-800/80 backdrop-blur-xl border border-red-400/20 rounded-2xl shadow-lg p-6"
        >
          <h3 class="text-xl font-semibold text-red-400 mb-4">专业缺失技能 (Gap)</h3>
          <div v-if="analysisResult.gapSkills.length > 0" class="flex flex-wrap gap-2">
            <el-tag v-for="skill in analysisResult.gapSkills" :key="skill.pkId" type="danger">{{
              skill.skillName
            }}</el-tag>
          </div>
          <p v-else class="text-slate-400">无缺失技能，完美匹配！</p>
        </div>

        <!-- 专业独有技能 -->
        <div
          class="bg-slate-800/80 backdrop-blur-xl border border-yellow-400/20 rounded-2xl shadow-lg p-6"
        >
          <h3 class="text-xl font-semibold text-yellow-400 mb-4">专业独有技能</h3>
          <div v-if="analysisResult.uniqueSkills.length > 0" class="flex flex-wrap gap-2">
            <el-tag v-for="skill in analysisResult.uniqueSkills" :key="skill.pkId" type="warning">{{
              skill.skillName
            }}</el-tag>
          </div>
          <p v-else class="text-slate-400">无</p>
        </div>
      </div>

      <!-- AI 分析报告 -->
      <div
        v-if="streamAiAnalysis"
        class="bg-slate-800/80 backdrop-blur-xl border border-purple-400/20 rounded-2xl shadow-lg p-6"
      >
        <h3 class="text-2xl font-bold text-purple-400 mb-4">AI 技能缺口分析报告</h3>
        <div class="prose prose-invert max-w-none" v-html="aiAnalysisHtml"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { getMajorAnalysis, getMajorStreamAnalysis } from '@/api/analysis'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'

const analysisFilters = reactive({
  jobType: '',
  education: '',
})

const isAnalyzing = ref(false)
const analysisResult = ref(null)
const streamAiAnalysis = ref('')

const handleAnalysis = async () => {
  if (isAnalyzing.value) return
  isAnalyzing.value = true
  analysisResult.value = null
  streamAiAnalysis.value = ''

  try {
    const params = {
      jobType: analysisFilters.jobType || undefined,
      education: analysisFilters.education || undefined,
    }

    // 并行启动两个请求
    const analysisPromise = getMajorAnalysis(params)
    const streamPromise = getMajorStreamAnalysis({
      jobType: params.jobType,
      onProgress: (textChunk) => {
        if (textChunk) {
          streamAiAnalysis.value += textChunk
        }
      },
    })

    // 等待非流式请求完成
    const analysisRes = await analysisPromise
    analysisResult.value = analysisRes.data

    // 等待流式请求完成（虽然UI已经开始更新）
    await streamPromise
  } catch (error) {
    ElMessage.error('分析失败，请稍后重试')
  } finally {
    isAnalyzing.value = false
  }
}

const aiAnalysisHtml = computed(() => {
  if (streamAiAnalysis.value) {
    return marked(streamAiAnalysis.value)
  }
  return ''
})
</script>

<style scoped>
/* 如果有特定于此组件的样式，可以写在这里 */
</style>
