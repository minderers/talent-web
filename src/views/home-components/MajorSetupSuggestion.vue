<template>
  <div class="page">
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-green-400">专业设置建议</h1>
    </header>

    <div class="grid">
      <section class="panel">
        <div class="panel-title">规划建议生成</div>
        <el-form label-position="top" class="form two">
          <el-form-item label="TopN"><el-input-number v-model="form.topN" :min="1" :max="100" class="w-full" /></el-form-item>
          <el-form-item label="岗位类型"><el-input v-model="form.jobType" placeholder="如 Java开发" /></el-form-item>
          <el-form-item label="学历层次"><el-select v-model="form.education"><el-option label="专科" value="专科" /><el-option label="本科" value="本科" /><el-option label="硕士" value="硕士" /></el-select></el-form-item>
          <el-form-item class="span2"></el-form-item>
          <el-form-item label="缺口技能" class="span2"><el-input v-model="gapSkillsText" placeholder="逗号分隔，如 Spring Boot, Vue3, Docker" /></el-form-item>
          <el-form-item label="分析维度" class="span2"><el-select v-model="form.analysisDimensions" multiple><el-option label="岗位需求差距" :value="0" /><el-option label="课程能力覆盖" :value="1" /><el-option label="培养目标适配" :value="2" /></el-select></el-form-item>
          <el-form-item label="自定义要求" class="span2"><el-input v-model="form.customRequirement" type="textarea" :rows="4" /></el-form-item>
        </el-form>
        <div class="actions wrap">
          <el-button type="primary" :loading="loading.generate" @click="generateGuidance">生成建议</el-button>
          <el-button :disabled="!generatedAdviceIds.length" :loading="loading.submit" @click="submitGuidance">提交审核</el-button>
        </div>
        <div class="card mt12">
          <div class="label">最新建议内容</div>
          <div v-if="!generatedGuidance" class="empty-text">暂无建议内容</div>
          <div v-else class="md-body" v-html="guidanceHtml"></div>
        </div>
      </section>

      <section class="panel">
        <div class="panel-title">年度报告 / 效果评估</div>
        <el-form label-position="top" class="form two">
          <el-form-item label="年份"><el-input-number v-model="report.year" :min="2020" :max="2100" class="w-full" /></el-form-item>
        </el-form>
        <div class="actions wrap">
          <el-button type="primary" @click="loadReport">获取报告</el-button>
          <el-button @click="downloadReport('word')">导出 Word</el-button>
          <el-button @click="downloadReport('excel')">导出 Excel</el-button>
          <el-button type="warning" @click="runEffect">效果评估</el-button>
        </div>
        <div class="card mt12">
          <div class="label">年度规划报告</div>
          <div v-if="!reportText(reportResult)" class="empty-text">暂无报告内容</div>
          <div v-else class="md-body" v-html="reportHtml"></div>
        </div>
        <div class="card mt12">
          <div class="label">实施效果评估</div>
          <div v-if="!reportText(effectResult)" class="empty-text">暂无评估结果</div>
          <div v-else class="md-body" v-html="effectHtml"></div>
        </div>
      </section>
    </div>

    <section class="panel mt12">
      <div class="row between wrap">
        <div class="panel-title small">建议列表 / 审核 / 进度</div>
        <div class="actions wrap">
          <el-select v-model="status" clearable placeholder="状态筛选" class="w-44" @change="fetchList"><el-option label="待审核" :value="0" /><el-option label="专业负责人通过" :value="1" /><el-option label="教务管理员通过" :value="2" /><el-option label="专业负责人驳回" :value="3" /><el-option label="教务管理员驳回" :value="4" /></el-select>
          <el-button @click="fetchList">刷新列表</el-button>
        </div>
      </div>
      <el-table :data="list" class="table" empty-text="暂无建议数据">
        <el-table-column prop="adviceId" label="ID" width="90" />
        <el-table-column prop="title" label="标题" min-width="160" />
        <el-table-column prop="jobType" label="岗位" width="120" />
        <el-table-column prop="education" label="学历" width="100" />
        <el-table-column label="状态" width="160"><template #default="x"><el-tag :type="statusTag(x.row.status)">{{ statusText(x.row.status) }}</el-tag></template></el-table-column>
        <el-table-column label="进度" width="100"><template #default="x">{{ x.row.progressPercent ?? 0 }}%</template></el-table-column>
        <el-table-column label="操作" min-width="360"><template #default="x"><div class="actions wrap"><el-button size="small" @click="viewAdvice(x.row)">查看</el-button><el-button size="small" @click="reviewAdvice(x.row,'leader',true)">负责人通过</el-button><el-button size="small" @click="reviewAdvice(x.row,'leader',false)">负责人驳回</el-button><el-button size="small" @click="reviewAdvice(x.row,'admin',true)">教务通过</el-button><el-button size="small" @click="reviewAdvice(x.row,'admin',false)">教务驳回</el-button><el-button size="small" @click="updateProgress(x.row)">更新进度</el-button></div></template></el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { marked } from 'marked'
import { downloadPlanningExcel, downloadPlanningWord, evaluatePlanningEffect, generatePlanningGuidanceStream, getPlanningReport, listPlanningGuidance, reviewPlanningGuidanceByAdmin, reviewPlanningGuidanceByLeader, submitPlanningGuidance, updatePlanningGuidanceProgress } from '@/api/planning'
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
const effectHtml = computed(() => (reportText(effectResult.value) ? marked(reportText(effectResult.value)) : ''))

const guidanceHtml = computed(() => (generatedGuidance.value ? marked(generatedGuidance.value) : ''))

const form = reactive({ jobType: 'Java开发', education: '本科', topN: 20, gapSkills: ['Spring Boot', 'Vue3', 'Docker'], analysisDimensions: [0, 1, 2], customRequirement: '重点突出校企合作和项目驱动实践。' })
const report = reactive({ year: new Date().getFullYear() })
const gapSkillsText = computed({ get: () => form.gapSkills.join(', '), set: (v) => (form.gapSkills = splitByComma(v)) })

const loading = reactive({ generate: false, submit: false })
const generatedGuidance = ref('')
const generatedAdviceIds = ref([])
const list = ref([])
const status = ref(undefined)
const reportResult = ref(null)
const effectResult = ref(null)

async function generateGuidance() {
  loading.generate = true
  generatedGuidance.value = ''
  generatedAdviceIds.value = []
  try {
    await generatePlanningGuidanceStream({
      data: { majorId: 1, jobType: form.jobType, education: form.education, topN: form.topN, gapSkills: form.gapSkills, analysisDimensions: form.analysisDimensions, customRequirement: form.customRequirement },
      onProgress: (chunk) => {
        generatedGuidance.value += chunk
      },
    })
    ElMessage.success('规划建议生成完成')
    await fetchList()
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '生成建议失败')
  } finally {
    loading.generate = false
  }
}

async function submitGuidance() {
  if (!generatedAdviceIds.value.length) return ElMessage.warning('暂无可提交的建议')
  if (!uid.value) return ElMessage.warning('未获取到当前用户ID')
  loading.submit = true
  try {
    await submitPlanningGuidance({ majorId: 1, adviceIds: generatedAdviceIds.value, submitterId: uid.value })
    ElMessage.success('建议已提交审核')
    await fetchList()
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '提交审核失败')
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
const statusTag = (s) => ({ 0: 'warning', 1: 'success', 2: 'success', 3: 'danger', 4: 'danger' }[s] || 'info')

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
  try {
    const res = await getPlanningReport({ majorId: 1, year: report.year })
    const payload = res?.data ?? res
    reportResult.value = payload
    if (reportText(payload)) ElMessage.success('报告获取成功')
    else ElMessage.warning('报告接口返回成功，但内容为空')
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '获取报告失败')
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
.hero,.row,.between,.actions{display:flex;align-items:center;gap:10px}
.hero,.between{justify-content:space-between}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
.panel,.card{background:linear-gradient(180deg,rgba(30,41,59,.9),rgba(15,23,42,.84));border:1px solid rgba(96,165,250,.14);border-radius:24px;padding:22px;box-shadow:0 16px 40px rgba(2,6,23,.22)}
.card{margin-top:14px;border-radius:20px;background:rgba(15,23,42,.78)}
.panel-title{font-size:20px;font-weight:700;letter-spacing:.02em;color:#dbeafe;margin-bottom:16px}
.small{font-size:18px}
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
.actions :deep(.el-button){border-radius:12px}
.table :deep(.el-table){
  --el-table-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-row-hover-bg-color: rgba(148,163,184,.14);
  --el-table-header-bg-color: transparent;
  --el-table-text-color: #fff;
  --el-table-header-text-color: #fff;
  --el-table-border-color: rgba(255,255,255,.35);
  background: transparent !important;
  color:#fff;
}
.table :deep(.el-table__inner-wrapper),.table :deep(.el-table__body-wrapper),.table :deep(.el-scrollbar__view){background:transparent !important}
.table :deep(.el-table tr),.table :deep(.el-table td.el-table__cell),.table :deep(.el-table th.el-table__cell){background:transparent !important;color:#fff;border-bottom-color:rgba(255,255,255,.35)!important}
.table :deep(.el-table__body tr:hover>td.el-table__cell){background:rgba(148,163,184,.14)!important}
@media (max-width:1200px){.grid{grid-template-columns:1fr}}
@media (max-width:768px){.two{grid-template-columns:1fr}.span2{grid-column:auto}}
</style>