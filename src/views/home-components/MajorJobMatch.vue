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

      <div v-if="!matrixRows.length" class="empty-text">暂无课程映射数据</div>
      <div v-else class="matrix-custom">
        <div class="matrix-head">
          <div>专业课程</div>
          <div>覆盖技能</div>
          <div>产业需求强度</div>
          <div>匹配度</div>
          <div>操作建议</div>
        </div>

        <div v-for="row in matrixRows" :key="row.id" class="matrix-row">
          <div>
            <div class="course-name">{{ row.courseName || '--' }}</div>
            <div class="course-code">{{ row.courseCode || '' }}</div>
          </div>

          <div class="tag-row">
            <span v-for="skill in row.coveredSkills" :key="`${row.id}-${skill}`" class="skill-chip">{{ skill }}</span>
          </div>

          <div>
            <span class="demand-badge" :class="demandClass(row.industryDemandLevel)">{{ row.industryDemandLevel || '待提升' }}</span>
          </div>

          <div>
            <span class="match-degree">{{ row.matchDegree }}%</span>
          </div>

          <div class="suggestion-text">{{ row.actionSuggestion || '--' }}</div>
        </div>
      </div>
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

const demandClass = (level) => {
  if (level === '高' || level === '极高') return 'is-high'
  if (level === '中') return 'is-mid'
  return 'is-low'
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
.matrix-custom{border:1px solid rgba(74,222,128,.18);border-radius:14px;overflow:hidden;background:rgba(10,18,34,.88)!important}
.matrix-head,.matrix-row{display:grid;grid-template-columns:1.2fr 2fr .9fr .7fr 1fr;gap:18px;align-items:center}
.matrix-head{padding:14px 16px;background:rgba(15,23,42,.96)!important;color:#bbf7d0;font-weight:700;border-bottom:1px solid rgba(74,222,128,.2)}
.matrix-row{padding:14px 16px;color:#86efac;border-bottom:1px solid rgba(74,222,128,.14);background:rgba(15,23,42,.82)!important}
.matrix-row:nth-child(even){background:rgba(30,41,59,.72)!important}
.matrix-row:hover{background:rgba(34,197,94,.1)!important}
.skill-chip{display:inline-flex;align-items:center;padding:2px 8px;border-radius:9999px;border:1px solid rgba(74,222,128,.32);background:rgba(34,197,94,.08);color:#86efac;font-size:12px}
.demand-badge{display:inline-flex;align-items:center;justify-content:center;min-width:56px;padding:2px 10px;border-radius:9999px;font-size:12px;border:1px solid transparent}
.demand-badge.is-high{color:#fca5a5;border-color:rgba(248,113,113,.45);background:rgba(239,68,68,.15)}
.demand-badge.is-mid{color:#fcd34d;border-color:rgba(251,191,36,.45);background:rgba(245,158,11,.15)}
.demand-badge.is-low{color:#cbd5e1;border-color:rgba(148,163,184,.4);background:rgba(71,85,105,.25)}
.suggestion-text{color:#a7f3d0}
.tag-row{display:flex;flex-wrap:wrap;gap:8px}
.course-name{font-weight:700;color:#bbf7d0}
.course-code{color:#86efac;font-size:12px;margin-top:2px}
.match-degree{display:inline-flex;align-items:center;justify-content:center;min-width:54px;padding:2px 10px;border-radius:9999px;border:1px solid rgba(74,222,128,.75);color:#86efac}
.empty-text{padding:10px 0;color:#94a3b8}
@media (max-width:1200px){.top-grid{grid-template-columns:1fr}.form-inline{grid-template-columns:1fr 1fr}.toolbar-line{flex-direction:column;align-items:stretch}.run-btn{width:100%}.matrix-head,.matrix-row{grid-template-columns:1fr}}
@media (max-width:768px){.form-inline{grid-template-columns:1fr}}
</style>
