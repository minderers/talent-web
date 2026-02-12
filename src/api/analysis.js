import http from '@/utils/http'

/**
 * 获取专业-岗位匹配度分析
 * @param {object} params - 查询参数
 * @param {string} [params.jobType] - 岗位类型
 * @param {string} [params.education] - 学历要求
 * @returns {Promise}
 */
export const getMajorAnalysis = (params) => {
  return http.get('/analysis/major', { params })
}
