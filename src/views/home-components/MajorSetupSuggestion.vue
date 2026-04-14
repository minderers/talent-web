<template>
  <div class="page">
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-green-400">专业规划指导</h1>
    </header>

    <section class="summary-grid">
      <div class="summary-item">
        <div class="summary-label">匹配度</div>
        <div class="summary-value">{{ analysisScore }}%</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">关键缺口</div>
        <div class="summary-value">{{ gapCount }}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">已选缺口</div>
        <div class="summary-value">{{ selectedGaps.length }}</div>
      </div>
      <div class="summary-item">
        <div class="summary-label">建议条目</div>
        <div class="summary-value">{{ list.length }}</div>
      </div>
    </section>

    <section class="panel">
      <div class="stepper">
        <div v-for="(s, idx) in steps" :key="s.key" class="step-item" :class="{ done: activeStep > idx + 1, active: activeStep === idx + 1 }" @click="setStep(idx + 1)">
          <div class="dot">{{ idx + 1 }}</div>
          <div class="txt">{{ s.label }}</div>
          <div v-if="idx < steps.length - 1" class="line"></div>
        </div>
      </div>

      <div v-if="activeStep === 1" class="step-panel">
        <div class="panel-title">需求分析</div>

        <div class="analysis-hint">
          <div class="hint-title">输入岗位与学历后，系统将基于产业技能需求生成缺口画像</div>
          <div class="hint-meta" v-if="matchAnalysis">
            当前分析：匹配度 {{ analysisScore }}%，缺口 {{ gapCount }} 项
          </div>
        </div>

        <el-form label-position="top" class="form two">
          <el-form-item label="TopN">
            <el-input-number v-model="form.topN" :min="1" :max="100" class="w-full" />
          </el-form-item>

          <el-form-item label="岗位类型">
            <el-input v-model="form.jobType" placeholder="如 前端 / Java开发 / 测试开发" />
          </el-form-item>

          <el-form-item label="学历层次">
            <el-select v-model="form.education">
              <el-option label="专科" value="专科" />
              <el-option label="本科" value="本科" />
              <el-option label="硕士" value="硕士" />
            </el-select>
          </el-form-item>

          <div class="preset-row span2">
            <span class="preset-label">岗位快捷：</span>
            <button
              v-for="item in jobTypePresets"
              :key="item"
              type="button"
              class="preset-chip"
              :class="{ active: form.jobType === item }"
              @click="applyJobPreset(item)">
              {{ item }}
            </button>
          </div>

          <el-form-item label="缺口技能" class="span2">
            <el-input v-model="gapSkillsText" placeholder="逗号分隔，如 TypeScript, Webpack, Node.js" />
          </el-form-item>

          <el-form-item label="分析维度" class="span2">
            <div class="dim-grid">
              <button
                v-for="dim in dimensionOptions"
                :key="dim.id"
                type="button"
                class="dim-card"
                :class="{ active: isDimensionActive(dim.id) }"
                @click="toggleDimension(dim.id)">
                <div class="dim-name">{{ dim.name }}</div>
                <div class="dim-desc">{{ dim.description || '基于产业趋势进行优化调整' }}</div>
              </button>
            </div>
          </el-form-item>

          <el-form-item label="自定义要求" class="span2">
            <el-input v-model="form.customRequirement" type="textarea" :rows="4" placeholder="例如：突出企业项目实践，强化工程化能力" />
          </el-form-item>
        </el-form>

        <div class="actions wrap">
          <el-button type="primary" :loading="loading.analyze" @click="analyzeGap">开始分析</el-button>
          <el-button @click="toStepGap" :disabled="!matchAnalysis">下一步：缺口识别</el-button>
        </div>
      </div>

      <div v-else-if="activeStep === 2" class="step-panel">
        <div class="panel-title">确认关键缺口</div>
        <div class="warn-box">发现 {{ gapOptions.length }} 个建议关注缺口，请优先确认重点。</div>
        <el-checkbox-group v-model="selectedGaps" class="gap-list">
          <label v-for="item in gapOptions" :key="item.name" class="gap-item">
            <el-checkbox :label="item.name" />
            <div class="gap-info">
              <div class="gap-name">{{ item.name }}</div>
              <div class="gap-sub">{{ item.type || '建议关注项' }}</div>
            </div>
            <span class="gap-badge">缺口度 {{ item.score }}%</span>
          </label>
        </el-checkbox-group>
        <div class="actions wrap">
          <el-button type="primary" :loading="loading.interpret" @click="runGapInterpret">开始解读</el-button>
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" @click="toStepPlan" :disabled="!selectedGaps.length">下一步：方案生成</el-button>
        </div>
        <div class="card mt12">
          <div class="label">缺口流式解读</div>
          <div v-if="!interpretMarkdown" class="empty-text">暂无解读内容</div>
          <div v-else class="md-body" v-html="interpretHtml"></div>
        </div>
      </div>

      <div v-else-if="activeStep === 3" class="step-panel">
        <div class="row between wrap">
          <div class="panel-title">AI生成规划方案</div>
          <el-button type="primary" :loading="loading.generate" @click="generateGuidance">重新生成方案</el-button>
        </div>
        <div class="card mt12 guidance-card">
          <div class="label">AI建议</div>
          <div class="guidance-fixed">
            <div v-if="!generatedGuidance" class="empty-text">正在生成或暂无建议内容</div>
            <div v-else class="md-body" v-html="guidanceHtml"></div>
          </div>
        </div>
        <div class="actions wrap">
          <el-button @click="prevStep">上一步</el-button>
          <el-button type="primary" :loading="loading.save || loading.submit" @click="submitSuggestionAndOpenReport" :disabled="!guidanceDone || loading.generate">
            提交建议并生成本次报告
          </el-button>
        </div>
      </div>

      <div v-else class="step-panel">
        <div class="panel-title">本次建议报告</div>
        <div class="card report-card">
          <div class="actions wrap mb8">
            <el-button type="primary" :loading="loading.report" @click="loadReport">重新生成报告</el-button>
            <el-button @click="downloadReport('word')">导出 Word</el-button>
            <el-button @click="downloadReport('excel')">导出 Excel</el-button>
          </div>
          <div class="report-fixed">
            <div v-if="loading.report && !reportDisplayText" class="empty-text">报告生成中...</div>
            <div v-else-if="!reportDisplayText" class="empty-text">暂无报告内容</div>
            <div v-else class="md-body" v-html="reportDisplayHtml"></div>
          </div>
        </div>
      </div>
    </section>

    <section class="panel mt12">
      <div class="row between wrap">
        <div class="panel-title small">建议列表</div>
        <div class="actions wrap">
          <el-select v-model="status" clearable placeholder="状态筛选" class="w-44" @change="fetchList"><el-option label="待审核" :value="0" /><el-option label="专业负责人通过" :value="1" /><el-option label="教务管理员通过" :value="2" /><el-option label="专业负责人驳回" :value="3" /><el-option label="教务管理员驳回" :value="4" /></el-select>
        </div>
      </div>
      <div v-if="!list.length" class="empty-text">暂无建议数据</div>
      <div v-else class="list-custom">
        <div class="list-head">
          <div>ID</div>
          <div>标题</div>
          <div>岗位</div>
          <div>学历</div>
          <div>状态</div>
          <div>进度</div>
        </div>

        <div v-for="row in list" :key="row.adviceId || row.id" class="list-row">
          <div>{{ row.adviceId || row.id || '--' }}</div>
          <div class="title-cell">{{ row.title || '--' }}</div>
          <div>{{ row.targetJobType || row.jobType || '--' }}</div>
          <div>{{ row.targetEducation || row.education || '--' }}</div>
          <div>
            <span class="status-pill" :class="statusClass(row.status)">{{ statusText(row.status) }}</span>
          </div>
          <div>{{ row.progressPercent ?? 0 }}%</div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { marked } from 'marked'
import { downloadPlanningExcel, downloadPlanningWord, analyzePlanningMatch, generatePlanningGuidanceStreamWithEvents, getPlanningReport, interpretPlanningGapStreamWithEvents, listPlanningGuidance, savePlanningGuidanceFromStream, submitPlanningGuidance } from '@/api/planning'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const uid = computed(() => userStore.userInfo?.pkId || userStore.userInfo?.id || 0)
const splitByComma = (v) => String(v || '').split(/[，,]/).map((i) => i.trim()).filter(Boolean)
const renderText = (v, d = '暂无数据') => !v ? d : typeof v === 'string' ? v : v.content || v.interpretation || v.summary || v.message || JSON.stringify(v, null, 2)

const extractRichText = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) {
    return value.map((item) => extractRichText(item)).filter(Boolean).join('\n\n').trim()
  }
  if (typeof value === 'object') {
    const preferredKeys = ['content', 'text', 'summary', 'report', 'analysis', 'message', 'msg', 'markdown', 'md', 'result', 'data']
    for (const key of preferredKeys) {
      const text = extractRichText(value[key])
      if (text) return text
    }
  }
  return ''
}

const cnKeyMap = {
  title: '标题',
  majorName: '专业名称',
  year: '年度',
  createdAt: '生成时间',
  generatedAt: '生成时间',
  matchScore: '匹配度',
  matchRate: '匹配率',
  score: '评分',
  summary: '总结',
  report: '报告',
  analysis: '分析',
  conclusion: '结论',
  advice: '建议',
  suggestions: '建议',
  recommendation: '建议',
  recommendations: '建议',
  jobType: '岗位类型',
  education: '学历层次',
  gapSkills: '缺口技能',
  coveredSkills: '已覆盖技能',
  effect: '实施效果',
  evaluation: '评估结果',
  progress: '实施进度',
}

const ignoredKeys = new Set(['id', 'pkId', 'majorId', 'adviceId', 'status', 'type', 'sort', 'version'])

const hasChinese = (text) => /[\u4e00-\u9fa5]/.test(String(text || ''))
const toCnLabel = (key) => {
  const raw = String(key || '')
  if (!raw || ignoredKeys.has(raw)) return ''
  if (hasChinese(raw)) return raw
  return cnKeyMap[raw] || ''
}

const sanitizePlainText = (text) => {
  const normalized = String(text || '').replace(/\r/g, '').replace(/、\"/g, '、').replace(/[\[\]"]/g, '')
  const lines = normalized.split('\n').map((line) => line.trim()).filter(Boolean)

  return lines
    .filter((line) => {
      if (!line) return false
      if (/^\d{1,3}$/.test(line)) return false
      if (/^\d{4}$/.test(line)) return true
      return true
    })
    .join('\n')
    .trim()
}

const isNoiseNumber = (text) => /^\d{1,3}$/.test(String(text || '').trim())

const formatStructuredMarkdown = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    const cleaned = sanitizePlainText(String(value))
    if (!cleaned || isNoiseNumber(cleaned)) return ''
    return cleaned
  }

  if (Array.isArray(value)) {
    if (!value.length) return ''
    return value
      .map((item) => {
        const content = formatStructuredMarkdown(item)
        return content ? `- ${content}` : ''
      })
      .filter(Boolean)
      .join('\n')
  }

  const entries = Object.entries(value)
  if (!entries.length) return ''

  return entries
    .map(([key, val]) => {
      const content = formatStructuredMarkdown(val)
      if (!content) return ''
      const label = toCnLabel(key)

      if (label) {
        if (!content.includes('\n')) return `- **${label}**：${content}`
        return `- **${label}**：\n${content.split('\n').map((line) => `  ${line}`).join('\n')}`
      }

      const hasMeaningfulText = hasChinese(content) || content.length >= 12 || /[%：:]/.test(content)
      if (!hasMeaningfulText) return ''
      if (!content.includes('\n')) return `- ${content}`
      return `- ${content.split('\n').join('\n  ')}`
    })
    .filter(Boolean)
    .join('\n')
}

const reportText = (value) => {
  const structured = formatStructuredMarkdown(value)
  if (structured) return structured
  const directText = sanitizePlainText(extractRichText(value))
  return directText
}

const reportHtml = computed(() => (reportText(reportResult.value) ? marked(reportText(reportResult.value)) : ''))
const reportDisplayText = computed(() => reportStreamText.value || reportText(reportResult.value) || '')
const reportDisplayHtml = computed(() => (reportDisplayText.value ? marked(reportDisplayText.value) : ''))
const interpretHtml = computed(() => (interpretMarkdown.value ? marked(interpretMarkdown.value) : ''))

const guidanceHtml = computed(() => (generatedGuidance.value ? marked(generatedGuidance.value) : ''))

const form = reactive({ jobType: 'Java开发', education: '本科', topN: 20, gapSkills: ['Spring Boot', 'Vue3', 'Docker'], analysisDimensions: [0, 1, 2], customRequirement: '重点突出校企合作和项目驱动实践。' })
const jobTypePresets = ['前端', 'Java开发', '后端开发', '测试开发', '数据开发']
const report = reactive({ year: new Date().getFullYear() })
const gapSkillsText = computed({ get: () => form.gapSkills.join(', '), set: (v) => (form.gapSkills = splitByComma(v)) })

const dimensionOptions = computed(() => {
  const fromApi = Array.isArray(matchAnalysis.value?.stepView?.dimensions) ? matchAnalysis.value.stepView.dimensions : []
  if (fromApi.length) {
    return fromApi.map((d) => ({
      id: Number(d?.id),
      name: d?.name || `维度${d?.id}`,
      description: d?.description || '',
    }))
  }
  return [
    { id: 0, name: '专业方向调整', description: '基于产业趋势新增或合并专业方向' },
    { id: 1, name: '课程体系优化', description: '调整课程设置与产业技能对齐' },
    { id: 2, name: '实训内容升级', description: '引入真实企业项目与工程实践' },
  ]
})

const loading = reactive({ analyze: false, interpret: false, generate: false, save: false, submit: false, report: false })
const generatedGuidance = ref('')
const guidanceDone = ref(false)
const generatedAdviceIds = ref([])
const list = ref([])
const status = ref(undefined)
const reportResult = ref(null)
const reportStreamText = ref('')
const reportLoading = ref(false)
const interpretMarkdown = ref('')
const matchAnalysis = ref(null)

const steps = [
  { key: 'analysis', label: '需求分析' },
  { key: 'gap', label: '缺口识别' },
  { key: 'plan', label: '方案生成' },
  { key: 'report', label: '本次建议报告' },
]
const activeStep = ref(1)
const setStep = (step) => {
  if (step < 1 || step > steps.length) return
  activeStep.value = step
}
const nextStep = () => { if (activeStep.value < steps.length) activeStep.value += 1 }
const prevStep = () => { if (activeStep.value > 1) activeStep.value -= 1 }

const analysisScore = computed(() => {
  const raw = matchAnalysis.value?.stepView?.analysis?.score ?? matchAnalysis.value?.matchScore
  const num = Number(raw)
  if (Number.isNaN(num)) return 0
  if (num <= 1) return Math.round(num * 100)
  return Math.round(num)
})

const gapCount = computed(() => {
  const stepGap = matchAnalysis.value?.stepView?.gap?.gapCount
  const rootGap = matchAnalysis.value?.gapSkillCount
  return Number((stepGap ?? rootGap ?? gapOptions.value.length) || 0)
})

const toStepGap = async () => {
  if (!matchAnalysis.value) await analyzeGap()
  if (matchAnalysis.value) activeStep.value = 2
}

const toStepPlan = async () => {
  if (!selectedGaps.value.length) return ElMessage.warning('请先选择至少一个关键缺口')
  activeStep.value = 3
  if (!generatedGuidance.value && !loading.generate) {
    await generateGuidance()
  }
}

const toStepReview = async () => {
  if (!generatedGuidance.value) {
    await generateGuidance()
  }
  if (generatedGuidance.value) activeStep.value = 4
}

const submitSuggestionAndOpenReport = async () => {
  if (loading.generate || !guidanceDone.value) {
    ElMessage.warning('AI建议仍在生成中，请等待流式完成后再提交')
    return
  }

  const savedAdviceId = await saveGuidanceFromStream()
  if (!savedAdviceId) return

  const ok = await submitGuidance()
  if (ok) {
    activeStep.value = 4
    await loadReport()
  }
}

const applyJobPreset = (value) => {
  form.jobType = value
}

const isDimensionActive = (id) => {
  return form.analysisDimensions.includes(id)
}

const toggleDimension = (id) => {
  if (isDimensionActive(id)) {
    form.analysisDimensions = form.analysisDimensions.filter((item) => item !== id)
  } else {
    form.analysisDimensions = [...form.analysisDimensions, id]
  }
}

const gapOptions = ref([])
const selectedGaps = ref([])

const buildAnalyzePayload = () => ({ majorId: 1, jobType: form.jobType, education: form.education, topN: form.topN })

const syncGapOptionsFromMatch = (payload) => {
  const stepGap = payload?.stepView?.gap || {}
  const listFromStep = Array.isArray(stepGap.priorityGapSkills) ? stepGap.priorityGapSkills : []
  const listFromRoot = Array.isArray(payload?.priorityGapSkills) ? payload.priorityGapSkills : []
  const fallbackGapSkills = Array.isArray(payload?.gapSkills)
    ? payload.gapSkills.map((item) => (typeof item === 'string' ? item : item?.skillName || item?.name || item?.label || '')).filter(Boolean)
    : []

  const picked = listFromStep.length ? listFromStep : (listFromRoot.length ? listFromRoot : fallbackGapSkills)
  const total = Number((stepGap.gapCount ?? payload?.gapSkillCount ?? picked.length) || 0)

  gapOptions.value = picked.map((name, idx) => {
    const remain = Math.max(total - idx, 1)
    const score = Math.max(35, Math.min(95, Math.round((remain / Math.max(total, 1)) * 100)))
    return { name, type: stepGap.dataScope || payload?.gapDataScope || 'ALL_JOBS', score }
  })

  selectedGaps.value = gapOptions.value.slice(0, 2).map((i) => i.name)
}

const planCards = computed(() => {
  if (!list.value.length) return []
  return list.value.slice(0, 3).map((item, idx) => ({
    id: item.adviceId || item.id || idx,
    tag: item.type === 0 ? '新增方向' : item.type === 1 ? '课程调整' : item.type === 2 ? '实训优化' : (idx === 0 ? '新增方向' : idx === 1 ? '课程调整' : '实训优化'),
    title: item.title || `方案 ${idx + 1}`,
    desc: item.reason || item.implementationPlan || (item.jobType ? `${item.jobType} / ${item.education || '--'}` : (item.progress || '建议实施中')),
    active: idx === 0,
  }))
})

async function analyzeGap() {
  loading.analyze = true
  interpretMarkdown.value = ''
  matchAnalysis.value = null
  try {
    const res = await analyzePlanningMatch(buildAnalyzePayload())
    const payload = res?.data ?? res
    matchAnalysis.value = payload

    const dimensions = Array.isArray(payload?.stepView?.dimensions) ? payload.stepView.dimensions : []
    if (dimensions.length) {
      form.analysisDimensions = dimensions.map((d) => Number(d?.id)).filter((id) => !Number.isNaN(id))
    }

    syncGapOptionsFromMatch(payload)

    const topGaps = gapOptions.value.map((i) => i.name)
    if (topGaps.length) form.gapSkills = topGaps

    ElMessage.success('需求分析完成')
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '需求分析失败')
  } finally {
    loading.analyze = false
  }
}

async function runGapInterpret() {
  loading.interpret = true
  interpretMarkdown.value = ''
  try {
    await interpretPlanningGapStreamWithEvents({
      data: buildAnalyzePayload(),
      onEvent: (evt) => {
        if (evt?.event === 'analysis' && evt?.data) {
          matchAnalysis.value = evt.data
          return
        }
        if (evt?.event === 'message') {
          const content = typeof evt?.data === 'string' ? evt.data : evt?.content
          if (content) interpretMarkdown.value += content
        }
      },
      onProgress: (chunk) => {
        interpretMarkdown.value += chunk
      },
    })
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '缺口解读失败')
  } finally {
    loading.interpret = false
  }
}

async function generateGuidance() {
  loading.generate = true
  guidanceDone.value = false
  generatedGuidance.value = ''
  generatedAdviceIds.value = []
  try {
    await generatePlanningGuidanceStreamWithEvents({
      data: {
        majorId: 1,
        jobType: form.jobType,
        education: form.education,
        topN: form.topN,
        gapSkills: selectedGaps.value.length ? selectedGaps.value : form.gapSkills,
        analysisDimensions: form.analysisDimensions,
        customRequirement: form.customRequirement,
      },
      onEvent: (evt) => {
        if (evt?.event === 'analysis' && evt?.data) {
          matchAnalysis.value = evt.data
          return
        }
        if (evt?.event === 'meta') {
          const gs = Array.isArray(evt?.data?.gapSkills) ? evt.data.gapSkills : []
          const dims = Array.isArray(evt?.data?.dimensions) ? evt.data.dimensions : []
          if (gs.length) form.gapSkills = gs
          if (dims.length) form.analysisDimensions = dims.map((d) => Number(d)).filter((n) => !Number.isNaN(n))
          return
        }
        if (evt?.event === 'message') {
          const content = typeof evt?.data === 'string' ? evt.data : evt?.content
          if (content) generatedGuidance.value += content
        }
      },
      onProgress: (chunk) => {
        generatedGuidance.value += chunk
      },
    })
    guidanceDone.value = true
    ElMessage.success('规划建议生成完成')
    await fetchList()
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '生成建议失败')
  } finally {
    loading.generate = false
  }
}

async function saveGuidanceFromStream() {
  if (loading.generate || !guidanceDone.value) {
    ElMessage.warning('AI建议仍在生成中，请稍后再保存')
    return null
  }

  if (!generatedGuidance.value.trim()) {
    ElMessage.warning('暂无可保存的建议正文')
    return null
  }
  if (!uid.value) {
    ElMessage.warning('未获取到当前用户ID')
    return null
  }

  const dimensionId = Array.isArray(form.analysisDimensions) && form.analysisDimensions.length
    ? Number(form.analysisDimensions[0])
    : 0

  loading.save = true
  try {
    const res = await savePlanningGuidanceFromStream({
      majorId: 1,
      content: generatedGuidance.value,
      jobType: form.jobType,
      education: form.education,
      gapSkills: selectedGaps.value.length ? selectedGaps.value : form.gapSkills,
      analysisDimension: Number.isNaN(dimensionId) ? 0 : dimensionId,
      submitterId: uid.value,
    })

    const payload = res?.data ?? res
    const adviceId = payload?.adviceId || payload?.id
    if (adviceId) {
      generatedAdviceIds.value = [adviceId]
      ElMessage.success('建议已入库')
      await fetchList()
      return adviceId
    }

    ElMessage.warning('建议入库成功，但未返回 adviceId')
    await fetchList()
    return null
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '建议入库失败')
    return null
  } finally {
    loading.save = false
  }
}

async function submitGuidance() {
  if (!generatedAdviceIds.value.length) {
    ElMessage.warning('暂无可提交的建议')
    return false
  }
  if (!uid.value) {
    ElMessage.warning('未获取到当前用户ID')
    return false
  }

  loading.submit = true
  try {
    await submitPlanningGuidance({ majorId: 1, adviceIds: generatedAdviceIds.value, submitterId: uid.value })
    ElMessage.success('建议已提交审核')
    await fetchList()
    return true
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '提交审核失败')
    return false
  } finally {
    loading.submit = false
  }
}

async function fetchList() {
  try {
    const res = await listPlanningGuidance({ majorId: 1, status: status.value })
    list.value = Array.isArray(res.data) ? res.data : []
    if (!generatedAdviceIds.value.length && list.value.length) {
      const latest = list.value[0]
      const latestId = latest?.adviceId || latest?.id
      generatedAdviceIds.value = latestId ? [latestId] : []
    }
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '获取建议列表失败')
  }
}

const statusText = (s) => ({ 0: '待审核', 1: '专业负责人通过', 2: '教务管理员通过', 3: '专业负责人驳回', 4: '教务管理员驳回' }[s] || '未知')
const statusClass = (s) => ({ 0: 'is-warn', 1: 'is-ok', 2: 'is-ok', 3: 'is-danger', 4: 'is-danger' }[s] || 'is-info')

function viewAdvice(row) {
  ElMessageBox.alert(renderText(row), row.title || `建议 ${row.adviceId || row.id}`, { confirmButtonText: '关闭' })
}

async function reviewAdvice(row, role, approved) {
  if (!uid.value) return ElMessage.warning('未获取到当前用户ID')
  try {
    const { value } = await ElMessageBox.prompt('请输入审核意见', approved ? '通过审核' : '驳回审核', { inputValue: approved ? '同意，进入下一流程。' : '请补充后重新提交。' })
    const payload = { adviceId: row.adviceId || row.id, reviewerId: uid.value, approved, comment: value }
    if (role === 'leader') await reviewPlanningGuidanceByLeader(payload)
    else await reviewPlanningGuidanceByAdmin(payload)
    ElMessage.success('审核完成')
    await fetchList()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.msg || e?.message || '审核失败')
  }
}

async function updateProgress(row) {
  try {
    const { value } = await ElMessageBox.prompt('格式：进度描述|百分比', '更新进度', { inputValue: `${row.progress || '已启动'}|${row.progressPercent ?? 0}` })
    const [progress, percent] = String(value || '').split('|')
    await updatePlanningGuidanceProgress({ adviceId: row.adviceId || row.id, progress: (progress || '').trim(), progressPercent: Number(percent || 0) })
    ElMessage.success('进度已更新')
    await fetchList()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error(e?.msg || e?.message || '更新进度失败')
  }
}

async function loadReport() {
  loading.report = true
  reportLoading.value = true
  reportStreamText.value = ''
  try {
    const text = '正在生成本次建议报告，请稍候...\n\n'
    reportStreamText.value = text

    const res = await getPlanningReport({ majorId: 1, year: report.year })
    const payload = res?.data ?? res
    reportResult.value = payload

    const finalText = reportText(payload)
    reportStreamText.value = finalText || reportStreamText.value

    if (finalText) ElMessage.success('报告获取成功')
    else ElMessage.warning('报告接口返回成功，但内容为空')
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '获取报告失败')
  } finally {
    loading.report = false
    reportLoading.value = false
  }
}

async function downloadReport(type) {
  try {
    if (type === 'word') await downloadPlanningWord({ majorId: 1, year: report.year })
    else await downloadPlanningExcel({ majorId: 1, year: report.year })
    ElMessage.success('报告导出成功')
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '导出失败')
  }
}

async function runEffect() {
  try {
    const res = await evaluatePlanningEffect({ majorId: 1, jobType: form.jobType, education: form.education, topN: form.topN })
    const payload = res?.data ?? res
    effectResult.value = payload
    if (reportText(payload)) ElMessage.success('效果评估完成')
    else ElMessage.warning('效果评估接口返回成功，但内容为空')
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '效果评估失败')
  }
}

onMounted(fetchList)
</script>

<style scoped>
.page{min-height:100%;padding:0;background:transparent;color:#fff}
.hero-lite{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px}
.row,.between,.actions{display:flex;align-items:center;gap:10px}
.between{justify-content:space-between}
.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:12px}
.summary-item{background:rgba(15,23,42,.7);border:1px solid rgba(74,222,128,.18);border-radius:14px;padding:12px}
.summary-label{font-size:12px;color:#94a3b8}
.summary-value{margin-top:4px;font-size:22px;font-weight:800;color:#86efac}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.panel,.card{background:linear-gradient(180deg,rgba(30,41,59,.9),rgba(15,23,42,.84));border:1px solid rgba(96,165,250,.14);border-radius:20px;padding:18px;box-shadow:0 16px 40px rgba(2,6,23,.22)}
.card{margin-top:12px;border-radius:16px;background:rgba(15,23,42,.78)}
.panel-title{font-size:24px;font-weight:700;letter-spacing:.02em;color:#e2e8f0;margin-bottom:14px}
.small{font-size:20px}
.form :deep(.el-form-item__label){color:#cbd5e1;font-weight:600}
.form :deep(.el-input__wrapper),.form :deep(.el-textarea__inner),.form :deep(.el-select__wrapper),.form :deep(.el-input-number .el-input__wrapper){background:rgba(15,23,42,.96);box-shadow:none;border:1px solid rgba(148,163,184,.18);border-radius:14px}
.form :deep(.el-input__inner),.form :deep(.el-textarea__inner),.form :deep(.el-select__selected-item){color:#f8fafc}
.form :deep(.el-textarea__inner){min-height:120px}
.two{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.span2{grid-column:span 2}.wrap{flex-wrap:wrap}.mt12{margin-top:12px}
.label{margin-bottom:8px;font-size:13px;font-weight:700;letter-spacing:.04em;color:#93c5fd;text-transform:uppercase}
.empty-text{padding:10px 0;color:#94a3b8}
.md-body{color:#dbeafe;line-height:1.8}
.md-body :deep(p){margin:0 0 10px}
.md-body :deep(ul),.md-body :deep(ol){padding-left:18px;margin:8px 0}
.md-body :deep(code){background:rgba(2,6,23,.6);padding:1px 4px;border-radius:4px}
.md-body :deep(pre){background:rgba(2,6,23,.7);padding:10px;border-radius:8px;overflow:auto}
pre{margin:0;white-space:pre-wrap;word-break:break-word;line-height:1.75;color:#dbeafe;max-height:280px;overflow:auto}
.stepper{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
.step-item{position:relative;flex:1;display:flex;flex-direction:column;align-items:center;color:#64748b;cursor:pointer}
.step-item .dot{width:30px;height:30px;border-radius:9999px;background:rgba(51,65,85,.55);display:grid;place-items:center;font-weight:700;border:1px solid rgba(148,163,184,.25)}
.step-item .txt{margin-top:8px;font-size:12px}
.step-item .line{position:absolute;top:14px;left:50%;right:-50%;height:2px;background:rgba(71,85,105,.5)}
.step-item.done .dot,.step-item.active .dot{background:#4f46e5;color:#fff;border-color:#6366f1}
.step-item.done .line{background:#4f46e5}
.step-item.active .txt,.step-item.done .txt{color:#a5b4fc}
.step-panel{border-top:1px solid rgba(99,102,241,.22);padding-top:16px}
.warn-box{padding:10px 12px;border-radius:12px;background:rgba(127,29,29,.25);border:1px solid rgba(248,113,113,.24);color:#fecaca;margin-bottom:12px}
.analysis-hint{margin-bottom:14px;padding:12px 14px;border-radius:12px;border:1px solid rgba(99,102,241,.28);background:linear-gradient(180deg,rgba(49,46,129,.22),rgba(15,23,42,.42))}
.hint-title{color:#c7d2fe;font-weight:700}
.hint-meta{margin-top:6px;color:#93c5fd;font-size:13px}
.preset-row{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:-2px}
.preset-label{color:#94a3b8;font-size:13px}
.preset-chip{border:1px solid rgba(148,163,184,.3);background:rgba(30,41,59,.56);color:#cbd5e1;padding:4px 10px;border-radius:9999px;font-size:12px;cursor:pointer;transition:.2s}
.preset-chip.active,.preset-chip:hover{border-color:rgba(99,102,241,.65);color:#c7d2fe;background:rgba(79,70,229,.22)}
.dim-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dim-card{padding:12px;border-radius:12px;border:1px solid rgba(148,163,184,.25);background:rgba(15,23,42,.55);text-align:left;cursor:pointer;transition:.2s}
.dim-card:hover{border-color:rgba(99,102,241,.55);transform:translateY(-1px)}
.dim-card.active{border-color:rgba(99,102,241,.75);box-shadow:0 0 0 1px rgba(99,102,241,.45) inset;background:rgba(79,70,229,.22)}
.dim-name{font-weight:700;color:#e2e8f0}
.dim-desc{margin-top:5px;color:#94a3b8;font-size:12px;line-height:1.5}
.gap-list{display:grid;gap:10px}
.gap-item{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid rgba(148,163,184,.2);border-radius:12px;background:rgba(15,23,42,.5)}
.gap-info{flex:1}
.gap-name{color:#f1f5f9;font-weight:700}
.gap-sub{color:#94a3b8;font-size:12px;margin-top:2px}
.gap-badge{color:#fda4af;background:rgba(127,29,29,.22);border:1px solid rgba(248,113,113,.28);padding:2px 8px;border-radius:9999px;font-size:12px}
.plan-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.plan-card{border:1px solid rgba(99,102,241,.25);background:rgba(15,23,42,.55);border-radius:14px;padding:14px}
.plan-card.active{box-shadow:0 0 0 1px rgba(99,102,241,.5) inset;background:rgba(49,46,129,.25)}
.plan-tag{display:inline-block;background:rgba(34,197,94,.16);border:1px solid rgba(74,222,128,.35);color:#86efac;padding:2px 8px;border-radius:9999px;font-size:12px}
.plan-title{margin-top:10px;font-size:18px;color:#e2e8f0;font-weight:700}
.plan-desc{margin-top:8px;color:#94a3b8;line-height:1.7}
.guidance-card{padding:14px}
.guidance-fixed{height:360px;overflow:auto;padding:8px 4px}
.report-fixed{height:420px;overflow:auto;padding:8px 4px}
.submit-card{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px;border-radius:14px;background:rgba(79,70,229,.2);border:1px solid rgba(99,102,241,.35)}
.submit-title{font-size:18px;color:#e2e8f0;font-weight:700}
.submit-sub{margin-top:4px;color:#cbd5e1}
.list-custom{border:1px solid rgba(74,222,128,.18);border-radius:14px;overflow:hidden;background:rgba(10,18,34,.88)!important}
.list-head,.list-row{display:grid;grid-template-columns:.5fr 1.5fr .9fr .8fr 1fr .7fr;gap:14px;align-items:center}
.list-head{padding:14px 16px;background:rgba(15,23,42,.96)!important;color:#bbf7d0;font-weight:700;border-bottom:1px solid rgba(74,222,128,.2)}
.list-row{padding:14px 16px;color:#86efac;border-bottom:1px solid rgba(74,222,128,.14);background:rgba(15,23,42,.82)!important}
.list-row:nth-child(even){background:rgba(30,41,59,.72)!important}
.list-row:hover{background:rgba(34,197,94,.1)!important}
.title-cell{font-weight:700;color:#bbf7d0}
.status-pill{display:inline-flex;align-items:center;justify-content:center;min-width:92px;padding:2px 10px;border-radius:9999px;font-size:12px;border:1px solid transparent}
.status-pill.is-ok{color:#86efac;border-color:rgba(74,222,128,.45);background:rgba(34,197,94,.16)}
.status-pill.is-warn{color:#fcd34d;border-color:rgba(251,191,36,.45);background:rgba(245,158,11,.16)}
.status-pill.is-danger{color:#fca5a5;border-color:rgba(248,113,113,.45);background:rgba(239,68,68,.15)}
.status-pill.is-info{color:#cbd5e1;border-color:rgba(148,163,184,.35);background:rgba(71,85,105,.24)}
@media (max-width:1200px){.grid{grid-template-columns:1fr}.list-head,.list-row{grid-template-columns:1fr 1fr}.dim-grid{grid-template-columns:1fr 1fr}}
@media (max-width:768px){.hero-lite{flex-direction:column;align-items:flex-start}.two{grid-template-columns:1fr}.span2{grid-column:auto}.list-head,.list-row{grid-template-columns:1fr}.summary-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.dim-grid{grid-template-columns:1fr}}
</style>