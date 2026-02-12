import http from '../utils/http'
export const getJobPage = (params) => http.post('industry/job/page', params) //获取职位列表
