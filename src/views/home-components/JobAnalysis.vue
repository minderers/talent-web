<template>
  <div class="job-analysis-container p-4 sm:p-6 lg:p-8">
    <header class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-green-400">AI解析结果展示</h2>
      <div>
        <el-button type="primary" @click="handleAnalysis" :loading="isAnalyzing">{{
          isAnalyzing ? '正在解析...' : '岗位解析'
        }}</el-button>
      </div>
    </header>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Left Panel: Original Text -->
      <div
        class="bg-slate-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-lg p-6"
      >
        <h3 class="text-xl font-semibold text-white mb-4">原始岗位文本</h3>
        <el-input
          type="textarea"
          :rows="20"
          placeholder="请在此处粘贴岗位描述文本..."
          v-model="originalText"
          class="custom-textarea"
        ></el-input>
      </div>

      <!-- Right Panel: Structured Data -->
      <div
        class="bg-slate-800/80 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-lg p-6 space-y-4"
      >
        <h3 class="text-xl font-semibold text-white mb-4">AI结构化提取</h3>

        <!-- Core Skills -->
        <div class="p-4 rounded-lg bg-slate-900/50 border border-gray-600/50">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-blue-400">核心技能</h4>
            <el-tag v-if="analysisResult.coreSkills.length > 0" type="info" size="small"
              >置信度 96%</el-tag
            >
          </div>
          <div v-if="analysisResult.coreSkills.length > 0" class="flex flex-wrap gap-2">
            <el-tag
              v-for="skill in analysisResult.coreSkills"
              :key="skill"
              type="primary"
              effect="light"
              >{{ skill }}</el-tag
            >
          </div>
          <div v-else class="text-slate-500 text-center py-2 italic">— 尚未提取 —</div>
        </div>

        <!-- Experience Requirement -->
        <div class="p-4 rounded-lg bg-slate-900/50 border border-gray-600/50">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-purple-400">经验要求</h4>
            <el-tag v-if="analysisResult.experience" type="success" size="small">已提取</el-tag>
          </div>
          <p v-if="analysisResult.experience" class="text-slate-300">
            {{ analysisResult.experience }}
          </p>
          <div v-else class="text-slate-500 text-center py-2 italic">— 尚未提取 —</div>
        </div>

        <!-- Education Requirement -->
        <div class="p-4 rounded-lg bg-slate-900/50 border border-gray-600/50">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-yellow-400">学历要求</h4>
            <el-tag v-if="analysisResult.education" type="success" size="small">已提取</el-tag>
          </div>
          <p v-if="analysisResult.education" class="text-slate-300">
            {{ analysisResult.education }}
          </p>
          <div v-else class="text-slate-500 text-center py-2 italic">— 尚未提取 —</div>
        </div>

        <!-- Emerging Trends -->
        <div class="p-4 rounded-lg bg-slate-900/50 border border-gray-600/50">
          <div class="flex justify-between items-center mb-2">
            <h4 class="font-semibold text-teal-400">新兴趋势标签</h4>
            <el-tag v-if="analysisResult.emergingTags.length > 0" type="warning" size="small"
              >AI生成</el-tag
            >
          </div>
          <div v-if="analysisResult.emergingTags.length > 0" class="flex flex-wrap gap-2">
            <el-tag
              v-for="tag in analysisResult.emergingTags"
              :key="tag"
              type="warning"
              effect="light"
              >{{ tag }}</el-tag
            >
          </div>
          <div v-else class="text-slate-500 text-center py-2 italic">— 尚未提取 —</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { analyzeJobDescription } from '@/api/analysis'
import { ElMessage } from 'element-plus'

const originalText = ref(`职位:高级Java开发工程师

岗位职责:
1. 负责公司核心业务系统的设计与开发,使用Spring Boot、Spring Cloud构建微服务架构;
2. 优化系统性能,解决高并发场景下的技术难题;
3. 参与技术选型,推动云原生技术落地(Kubernetes、Docker);
4. 指导初中级工程师,进行代码Review。

任职要求:
1. 本科及以上学历,计算机相关专业,5年以上Java开发经验;
2. 精通Spring生态,熟悉MySQL、Redis、Kafka等中间件;`)

const isAnalyzing = ref(false)

// 初始状态为空
const analysisResult = reactive({
  coreSkills: [],
  experience: '',
  education: '',
  emergingTags: [],
})

// 点击按钮后调用API进行分析
const handleAnalysis = async () => {
  if (!originalText.value.trim()) {
    ElMessage.warning('请输入要分析的岗位文本')
    return
  }

  isAnalyzing.value = true
  // 重置结果
  Object.assign(analysisResult, {
    coreSkills: [],
    experience: '',
    education: '',
    emergingTags: [],
  })

  try {
    const res = await analyzeJobDescription(originalText.value)
    const data = res.data
    analysisResult.coreSkills = data.coreSkills
      ? data.coreSkills.split(',').map((s) => s.trim())
      : []
    analysisResult.experience = data.experienceRequirement
    analysisResult.education = data.educationRequirement
    analysisResult.emergingTags = data.emergingTrends
      ? data.emergingTrends.split(',').map((s) => s.trim())
      : []
    ElMessage.success('解析成功！')
  } catch (error) {
    ElMessage.error('解析失败，请稍后重试')
  } finally {
    isAnalyzing.value = false
  }
}
</script>

<style scoped>
.job-analysis-container {
  max-width: 1400px;
  margin: auto;
}

.custom-textarea :deep(textarea) {
  background-color: #1e293b; /* bg-slate-800 */
  color: #cbd5e1; /* text-slate-300 */
  border: 1px solid #475569; /* border-slate-600 */
  border-radius: 0.75rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.custom-textarea :deep(textarea:focus) {
  border-color: #4ade80; /* border-green-400 */
  box-shadow: 0 0 0 2px rgba(56, 189, 128, 0.4);
}
</style>
