import http from '@/utils/http'

/**
 * @description 获取近N年高频技能占比变化趋势
 * @param {object} params
 * @param {number} params.years - 年份
 * @param {string} [params.jobType] - 岗位类型 (可选)
 * @returns
 */
export const getSkillTrends = (params) => {
  return http.get('/analysis/trends/skills', { params })
}

/**
 * @description 获取核心岗位数量变化趋势
 * @param {object} params
 * @param {string} [params.startDate] - 开始日期 (可选)
 * @param {string} [params.endDate] - 结束日期 (可选)
 * @param {string} [params.jobType] - 岗位类型 (可选)
 * @returns
 */
export const getJobCountTrends = (params) => {
  return http.get('/analysis/trends/job-count', { params })
}

/**
 * @description 获取不同维度的分布数据(如区域、学历、经验)
 * @param {object} params
 * @param {string} params.dimension - 维度 (e.g., 'region', 'education', 'experience')
 * @param {string} [params.jobType] - 岗位类型 (可选)
 * @returns
 */
export const getDistribution = (params) => {
  return http.get('/analysis/distribution', { params })
}
