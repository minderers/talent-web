<template>
  <div class="p-4 sm:p-6 lg:p-8">
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-green-400">人才需求预测</h1>
      <p class="mt-2 text-slate-400">基于历史数据，洞察产业人才需求的变化趋势。</p>
    </header>

    <!-- 图表区域 -->
    <div v-if="loading" class="grid grid-cols-1 gap-8">
      <div
        v-for="i in 3"
        :key="i"
        class="flex h-96 items-center justify-center rounded-lg bg-slate-800"
      >
        <p class="text-slate-400">图表加载中...</p>
      </div>
    </div>
    <div v-else class="grid grid-cols-1 gap-8">
      <!-- 技能趋势图 -->
      <div class="rounded-lg bg-slate-800 p-6">
        <h2 class="mb-4 text-xl font-semibold text-green-400">高频技能占比变化趋势</h2>
        <div ref="skillTrendChartRef" class="h-96 w-full"></div>
      </div>
      <!-- 岗位数量趋势图 -->
      <div class="rounded-lg bg-slate-800 p-6">
        <h2 class="mb-4 text-xl font-semibold text-green-400">核心岗位数量变化趋势</h2>
        <div ref="jobCountChartRef" class="h-96 w-full"></div>
      </div>
      <!-- 分布数据图 -->
      <div class="rounded-lg bg-slate-800 p-6">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="text-xl font-semibold text-green-400">人才需求分布</h2>
          <el-select
            v-model="selectedDimension"
            @change="handleDimensionChange"
            size="small"
            style="width: 120px"
          >
            <el-option label="按经验" value="experience" />
            <el-option label="按学历" value="education" />
            <el-option label="按城市" value="region" />
          </el-select>
        </div>
        <div ref="distributionChartRef" class="h-96 w-full"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, shallowRef, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getSkillTrends, getJobCountTrends, getDistribution } from '@/api/trend'
import { ElMessage } from 'element-plus'

// --- Refs for state management ---
const loading = ref(true)
const selectedDimension = ref('experience')

// --- Refs for chart DOM elements ---
const skillTrendChartRef = ref(null)
const jobCountChartRef = ref(null)
const distributionChartRef = ref(null)

// --- shallowRef for ECharts instances ---
const skillTrendChart = shallowRef(null)
const jobCountChart = shallowRef(null)
const distributionChart = shallowRef(null)

// --- Reactive refs for chart options ---
const skillTrendOption = ref(null)
const jobCountOption = ref(null)
const distributionOption = ref(null)

// --- ECharts Base Option ---
const baseChartOption = {
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(30, 41, 59, 0.9)',
    borderColor: '#4ade80',
    textStyle: {
      color: '#e2e8f0',
    },
  },
  legend: {
    textStyle: {
      color: '#94a3b8',
    },
    top: 'bottom',
    itemWidth: 15,
    itemHeight: 15,
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '15%',
    containLabel: true,
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: [],
    axisLine: {
      lineStyle: {
        color: '#475569',
      },
    },
    axisLabel: {
      color: '#94a3b8',
    },
  },
  yAxis: {
    type: 'value',
    axisLine: {
      lineStyle: {
        color: '#475569',
      },
    },
    splitLine: {
      lineStyle: {
        color: '#334155',
      },
    },
    axisLabel: {
      color: '#94a3b8',
    },
  },
  series: [],
}

// --- Data Fetching and Option Preparation ---

const prepareSkillTrendData = async () => {
  try {
    const res = await getSkillTrends()
    skillTrendOption.value = {
      ...baseChartOption,
      xAxis: { ...baseChartOption.xAxis, data: res.data.categories },
      series: res.data.series.map((seriesItem) => ({
        name: seriesItem.name,
        type: 'line',
        smooth: true,
        data: seriesItem.data,
        emphasis: { focus: 'series' },
      })),
    }
  } catch (error) {
    console.error('获取技能趋势数据失败:', error)
    ElMessage.error('获取技能趋势数据失败')
    skillTrendOption.value = baseChartOption // Fallback to base option
  }
}

const prepareJobCountData = async () => {
  try {
    const res = await getJobCountTrends()
    jobCountOption.value = {
      ...baseChartOption,
      tooltip: { ...baseChartOption.tooltip, trigger: 'axis' },
      xAxis: { ...baseChartOption.xAxis, data: res.data.categories, boundaryGap: true },
      yAxis: { ...baseChartOption.yAxis, name: '岗位数量' },
      series: [
        {
          name: res.data.seriesName,
          type: 'bar',
          barWidth: '60%',
          data: res.data.data,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#4ade80' },
              { offset: 1, color: '#16a34a' },
            ]),
          },
        },
      ],
    }
  } catch (error) {
    console.error('获取岗位数量趋势失败:', error)
    ElMessage.error('获取岗位数量趋势失败')
    jobCountOption.value = baseChartOption // Fallback
  }
}

const prepareDistributionData = async () => {
  try {
    const res = await getDistribution({ dimension: selectedDimension.value })
    const option = {
      ...baseChartOption,
      tooltip: { trigger: 'item' },
      legend: {
        ...baseChartOption.legend,
        orient: 'vertical',
        left: 'left',
        top: 'center',
      },
      series: [
        {
          name: '分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['65%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#1e293b',
            borderWidth: 2,
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: '20', fontWeight: 'bold', color: '#fff' },
          },
          labelLine: { show: false },
          data: res.data.data.map((item) => ({
            value: item.value,
            name: item.name,
          })),
        },
      ],
    }
    delete option.xAxis
    delete option.yAxis
    delete option.grid
    distributionOption.value = option
  } catch (error) {
    console.error('获取分布数据失败:', error)
    ElMessage.error(`获取${selectedDimension.value}分布数据失败`)
    distributionOption.value = { ...baseChartOption, series: [] } // Fallback
  }
}

const handleDimensionChange = async () => {
  await prepareDistributionData()
  if (distributionChart.value) {
    distributionChart.value.setOption(distributionOption.value, true)
  }
}

// --- Chart Initialization and Rendering ---

const initCharts = () => {
  // Skill Trend Chart
  if (skillTrendChartRef.value && skillTrendOption.value) {
    if (!skillTrendChart.value) {
      skillTrendChart.value = echarts.init(skillTrendChartRef.value)
    }
    skillTrendChart.value.setOption(skillTrendOption.value)
  }

  // Job Count Chart
  if (jobCountChartRef.value && jobCountOption.value) {
    if (!jobCountChart.value) {
      jobCountChart.value = echarts.init(jobCountChartRef.value)
    }
    jobCountChart.value.setOption(jobCountOption.value)
  }

  // Distribution Chart
  if (distributionChartRef.value && distributionOption.value) {
    if (!distributionChart.value) {
      distributionChart.value = echarts.init(distributionChartRef.value)
    }
    distributionChart.value.setOption(distributionOption.value, true)
  }
}

// --- Main Data Loading Orchestrator ---

const loadDataAndRenderCharts = async () => {
  loading.value = true
  try {
    await Promise.all([prepareSkillTrendData(), prepareJobCountData(), prepareDistributionData()])
  } catch (error) {
    ElMessage.error('加载图表数据时出错')
    console.error(error)
  } finally {
    loading.value = false
    await nextTick()
    initCharts()
  }
}

// --- Resize Logic ---
const resizeCharts = () => {
  skillTrendChart.value?.resize()
  jobCountChart.value?.resize()
  distributionChart.value?.resize()
}

// --- Lifecycle Hooks ---
onMounted(() => {
  loadDataAndRenderCharts()
  window.addEventListener('resize', resizeCharts)
})

onUnmounted(() => {
  window.removeEventListener('resize', resizeCharts)
  // Dispose of charts to prevent memory leaks
  skillTrendChart.value?.dispose()
  jobCountChart.value?.dispose()
  distributionChart.value?.dispose()
})
</script>

<style scoped>
/* 深度选择器，用于定制 Element Plus 组件在深色主题下的样式 */
:deep(.el-select .el-input__wrapper) {
  background-color: #334155; /* bg-slate-700 */
  box-shadow: none !important;
  border: 1px solid #475569; /* bg-slate-600 */
}
:deep(.el-select .el-input__inner) {
  color: #f1f5f9; /* text-slate-100 */
}
:deep(.el-select .el-input .el-select__caret) {
  color: #94a3b8; /* text-slate-400 */
}

/* 下拉框面板样式 */
.el-select-dropdown {
  border: 1px solid #4ade80 !important;
  background-color: #1e293b !important;
}
:deep(.el-select-dropdown__item) {
  color: #cbd5e1; /* text-slate-300 */
}
:deep(.el-select-dropdown__item.hover),
:deep(.el-select-dropdown__item:hover) {
  background-color: #334155; /* bg-slate-700 */
}
:deep(.el-select-dropdown__item.selected) {
  color: #4ade80; /* text-green-400 */
  background-color: #334155;
}
:deep(.el-popper__arrow::before) {
  background: #1e293b !important;
  border-color: #4ade80 !important;
}
</style>
