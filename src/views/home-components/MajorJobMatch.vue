<template>
  <div class="page">
    <header class="flex justify-between items-center mb-8">
      <h1 class="text-3xl font-bold text-green-400">专业岗位评估</h1>
    </header>

    <section class="panel">
      <div class="toolbar-line">
        <el-form label-position="top" class="form-inline">
          <el-form-item label="岗位类型"><el-input v-model="analysis.jobType" placeholder="如 Java后端开发" /></el-form-item>
          <el-form-item label="学历层次">
            <el-select v-model="analysis.education">
              <el-option label="专科" value="专科" />
              <el-option label="本科" value="本科" />
              <el-option label="硕士" value="硕士" />
            </el-select>
          </el-form-item>
          <el-form-item label="TopN"><el-input-number v-model="analysis.topN" :min="1" :max="100" class="w-full" /></el-form-item>
        </el-form>

        <el-button type="primary" :loading="loading.match" class="run-btn" @click="runMatch">生成缺口分析</el-button>
      </div>
    </section>

    <section class="top-grid mt12">
      <div class="score-card panel">
        <div class="panel-title">综合匹配度评分</div>
        <div class="score-ring" :style="scoreRingStyle">
          <div class="score-ring-inner">
            <div class="score-num">{{ overallScore }}</div>
            <div class="score-unit">分</div>
          </div>
        </div>
        <div class="score-level">{{ scoreLevelText }}</div>
        <div class="score-tag">{{ scoreTagText }}</div>
        <p class="score-desc">基于 {{ courseCount }} 门课程与 {{ industrySkillCount }} 项产业技能</p>
      </div>

      <div class="ability-card panel">
        <div class="panel-title">技能覆盖缺口分析</div>

        <div v-if="!capabilityRows.length" class="empty-text">暂无能力项数据</div>
        <div v-for="item in capabilityRows" :key="item.id" class="ability-row">
          <div class="ability-head">
            <div class="ability-left">
              <span class="ability-dot" :style="{ background: item.color }"></span>
              <span class="ability-name">{{ item.capability }}</span>
              <span class="ability-type">{{ item.type }}</span>
            </div>
            <span class="ability-score">{{ item.score }}%</span>
          </div>
          <div class="ability-track"><div class="ability-fill" :style="{ width: `${item.score}%`, background: item.color }"></div></div>
        </div>

        <div class="insight-box">
          <div class="insight-title">AI 智能分析</div>
          <div class="insight-text clamp-3">{{ aiInsightText || '暂无分析内容' }}</div>
        </div>
      </div>
    </section>

    <section class="panel mt12">
      <div class="panel-title">课程-技能映射矩阵</div>
      <el-table :data="matrixRows" class="matrix-table" stripe empty-text="暂无课程映射数据">
        <el-table-column label="专业课程" min-width="220">
          <template #default="x">
            <div class="course-name">{{ x.row.courseName || '--' }}</div>
            <div class="course-code">{{ x.row.courseCode || '' }}</div>
          </template>
        </el-table-column>
        <el-table-column label="覆盖技能" min-width="260">
          <template #default="x">
            <div class="tag-row">
              <el-tag v-for="skill in x.row.coveredSkills" :key="`${x.row.courseCode}-${skill}`" size="small" effect="plain">{{ skill }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="产业需求强度" width="150">
          <template #default="x">
            <el-tag :type="demandTagType(x.row.industryDemandLevel)" effect="dark">{{ x.row.industryDemandLevel || '待提升' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="匹配度" width="110">
          <template #default="x">
            <span class="match-degree">{{ x.row.matchDegree }}%</span>
          </template>
        </el-table-column>
        <el-table-column prop="actionSuggestion" label="操作建议" min-width="180" />
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { evaluatePlanningEffect } from '@/api/planning'

const analysis = reactive({ majorId: 1, jobType: 'Java后端开发', education: '本科', topN: 20 })
const loading = reactive({ match: false })
const matchResult = ref(null)

const normalizePercent = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return 0
  if (num < 0) return 0
  if (num <= 1) {
    if (num === 1) return 1
    return Math.round(num * 100)
  }
  return Math.max(0, Math.min(100, Math.round(num)))
}

const normalizeSkillList = (value) => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => (typeof item === 'string' ? item : item?.skillName || item?.name || item?.label || ''))
    .map((item) => String(item).trim())
    .filter(Boolean)
}

const overallScore = computed(() => {
  const d = matchResult.value || {}
  return normalizePercent(d.overallScore)
})

const scoreRingStyle = computed(() => {
  const p = overallScore.value
  return { background: `conic-gradient(#8b5cf6 ${p * 3.6}deg, rgba(148,163,184,.2) ${p * 3.6}deg)` }
})

const scoreLevelText = computed(() => {
  const d = matchResult.value || {}
  return d.scoreLevel || '--'
})

const scoreTagText = computed(() => {
  const d = matchResult.value || {}
  return d.scoreTag || '--'
})

const courseCount = computed(() => {
  const d = matchResult.value || {}
  return Number(d.courseCount || 0)
})

const industrySkillCount = computed(() => {
  const d = matchResult.value || {}
  return Number(d.industrySkillCount || 0)
})

const capabilityRows = computed(() => {
  const d = matchResult.value || {}
  const rows = Array.isArray(d.capabilityScores) ? d.capabilityScores : []
  const colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#06b6d4']
  return rows.map((item, idx) => ({
    id: item?.id || `${idx}-${item?.capability || item?.skillName || item?.name || 'capability'}`,
    capability: item?.capability || item?.skillName || item?.name || `能力项${idx + 1}`,
    type: item?.type || item?.tag || '--',
    score: normalizePercent(item?.score),
    color: colors[idx % colors.length],
  }))
})

const aiInsightText = computed(() => {
  const d = matchResult.value || {}
  return d.aiInsight || ''
})

const matrixRows = computed(() => {
  const d = matchResult.value || {}
  const rows = Array.isArray(d.courseSkillMatrix) ? d.courseSkillMatrix : []
  return rows.map((item, idx) => ({
    id: item?.id || idx,
    courseName: item?.courseName || '--',
    courseCode: item?.courseCode || '',
    coveredSkills: normalizeSkillList(item?.coveredSkills),
    industryDemandLevel: item?.industryDemandLevel || '待提升',
    matchDegree: normalizePercent(item?.matchDegree),
    actionSuggestion: item?.actionSuggestion || '--',
  }))
})

const demandTagType = (level) => {
  if (level === '高' || level === '极高') return 'danger'
  if (level === '中') return 'warning'
  return 'info'
}

const analysisPayload = () => ({ majorId: 1, jobType: analysis.jobType, education: analysis.education, topN: analysis.topN })

async function runMatch() {
  loading.match = true
  try {
    const res = await evaluatePlanningEffect(analysisPayload())
    const payload = res?.data ?? res
    matchResult.value = payload
    const count = Array.isArray(payload?.capabilityScores) ? payload.capabilityScores.length : 0
    if (count > 0) ElMessage.success(`缺口分析生成完成（能力项 ${count} 条）`)
    else ElMessage.warning('缺口分析生成完成，但 capabilityScores 为空')
  } catch (e) {
    ElMessage.error(e?.msg || e?.message || '缺口分析失败')
  } finally {
    loading.match = false
  }
}
</script>

<style scoped>
.page{min-height:100%;padding:0;background:transparent;color:#fff}
.panel{background:linear-gradient(180deg,rgba(30,41,59,.9),rgba(15,23,42,.84));border:1px solid rgba(74,222,128,.14);border-radius:24px;padding:22px;box-shadow:0 16px 40px rgba(2,6,23,.22)}
.panel-title{font-size:20px;font-weight:700;letter-spacing:.02em;color:#dcfce7;margin-bottom:16px}
.form-inline{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;flex:1}
.toolbar-line{display:flex;align-items:flex-end;gap:12px}
.run-btn{margin-bottom:2px;height:40px;border-radius:12px}
.form-inline :deep(.el-form-item__label){color:#cbd5e1;font-weight:600}
.form-inline :deep(.el-input__wrapper),.form-inline :deep(.el-select__wrapper),.form-inline :deep(.el-input-number .el-input__wrapper){background:rgba(15,23,42,.96);box-shadow:none;border:1px solid rgba(148,163,184,.18);border-radius:14px}
.form-inline :deep(.el-input__inner),.form-inline :deep(.el-select__selected-item){color:#f8fafc}
.actions{display:flex;gap:10px;align-items:center}.wrap{flex-wrap:wrap}
.mt12{margin-top:12px}
.top-grid{display:grid;grid-template-columns:330px 1fr;gap:24px;margin-top:12px}
.score-card{text-align:center}
.score-ring{width:180px;height:180px;margin:6px auto 12px;border-radius:9999px;display:grid;place-items:center}
.score-ring-inner{width:142px;height:142px;border-radius:9999px;background:rgba(15,23,42,.95);display:flex;flex-direction:column;align-items:center;justify-content:center}
.score-num{font-size:48px;font-weight:800;line-height:1;color:#f8fafc}
.score-unit{margin-top:4px;color:#94a3b8}
.score-level{color:#cbd5e1;margin-bottom:8px}
.score-tag{display:inline-block;padding:4px 10px;border-radius:9999px;background:rgba(250,204,21,.15);color:#fde68a;font-size:12px}
.score-desc{margin:12px 0 0;color:#94a3b8;font-size:13px}
.ability-row{margin-bottom:12px}
.ability-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.ability-left{display:flex;align-items:center;gap:8px}
.ability-dot{width:8px;height:8px;border-radius:9999px}
.ability-name{color:#e2e8f0}
.ability-type{font-size:12px;padding:2px 8px;border-radius:9999px;background:rgba(148,163,184,.16);color:#cbd5e1}
.ability-score{color:#94a3b8;font-size:13px}
.ability-track{height:8px;background:rgba(148,163,184,.2);border-radius:9999px;overflow:hidden}
.ability-fill{height:100%;border-radius:9999px}
.insight-box{margin-top:16px;padding:14px;border:1px solid rgba(99,102,241,.28);border-radius:14px;background:rgba(30,41,59,.45)}
.insight-title{color:#a5b4fc;font-weight:700;margin-bottom:6px}
.insight-text{color:#cbd5e1;line-height:1.75}
.insight-text.clamp-3{
  display:block;
  max-height:calc(1.75em * 3);
  overflow:hidden;
}
.matrix-table :deep(.el-table){
  --el-table-bg-color: rgba(10,18,34,.72);
  --el-table-tr-bg-color: rgba(15,23,42,.62);
  --el-table-row-hover-bg-color: rgba(59,130,246,.16);
  --el-table-current-row-bg-color: rgba(59,130,246,.18);
  --el-table-header-bg-color: rgba(15,23,42,.88);
  --el-table-text-color: #cbd5e1;
  --el-table-header-text-color: #86efac;
  --el-table-border-color: rgba(148,163,184,.3);
  --el-fill-color-lighter: rgba(30,41,59,.46);
  background: rgba(10,18,34,.68) !important;
  border: 1px solid rgba(74,222,128,.14);
  border-radius: 14px;
  overflow: hidden;
}
.matrix-table :deep(.el-table::before),.matrix-table :deep(.el-table__inner-wrapper::before){background:rgba(148,163,184,.3)!important}
.matrix-table :deep(.el-table__inner-wrapper),.matrix-table :deep(.el-table__body-wrapper),.matrix-table :deep(.el-table__header-wrapper),.matrix-table :deep(.el-scrollbar__view){background:rgba(10,18,34,.68)!important}
.matrix-table :deep(.el-table td.el-table__cell){background:rgba(15,23,42,.58)!important;color:#cbd5e1;border-bottom-color:rgba(148,163,184,.24)!important}
.matrix-table :deep(.el-table th.el-table__cell){background:rgba(15,23,42,.9)!important;color:#86efac!important;border-bottom-color:rgba(148,163,184,.34)!important}
.matrix-table :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell){background:rgba(30,41,59,.5)!important}
.matrix-table :deep(.el-table__body tr:hover>td.el-table__cell){background:rgba(59,130,246,.16)!important}
.tag-row{display:flex;flex-wrap:wrap;gap:8px}
.course-name{font-weight:700;color:#93c5fd}
.course-code{color:#94a3b8;font-size:12px;margin-top:2px}
.match-degree{display:inline-block;min-width:54px;text-align:center;padding:2px 10px;border-radius:9999px;border:1px solid rgba(34,197,94,.8);color:#86efac}
.empty-text{padding:10px 0;color:#94a3b8}
@media (max-width:1200px){.top-grid{grid-template-columns:1fr}.form-inline{grid-template-columns:1fr 1fr}.toolbar-line{flex-direction:column;align-items:stretch}.run-btn{width:100%}}
@media (max-width:768px){.form-inline{grid-template-columns:1fr}}
</style>
