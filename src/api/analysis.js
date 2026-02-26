import http from '@/utils/http'

/**
 * 获取专业-岗位匹配度分析
 * @param {object} params - 查询参数
 * @param {string} [params.jobType] - 岗位类型
 * @param {string} [params.education] - 学历要求
 * @returns {Promise}
 */
export const getMajorAnalysis = (params) => {
  return http.get('/analysis/major', { params: params })
}

/**
 * 获取专业-岗位匹配度流式分析
 * @param {object} params - 参数对象
 * @param {string} params.jobType - 岗位类型
 * @param {function} onProgress - 处理流式数据的回调函数
 */
export const getMajorStreamAnalysis = async ({ jobType, onProgress }) => {
  try {
    const params = new URLSearchParams()
    if (jobType) {
      params.append('jobType', jobType)
    }
    const url = `http://localhost:8080/talent-api/analysis/major/stream?${params.toString()}`

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        // 如果需要认证，请在这里添加 Authorization header
        // 'Authorization': `Bearer ${token}`
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      buffer += decoder.decode(value, { stream: true })

      // SSE 事件由两个换行符分隔
      const eventStrings = buffer.split('\n\n')
      buffer = eventStrings.pop() // 保留最后一个可能不完整的事件

      for (const eventString of eventStrings) {
        if (!eventString) continue

        const dataParts = []
        const lines = eventString.split('\n')

        for (const line of lines) {
          //  accommodating potential leading whitespace before "data:"
          const trimmedLine = line.trimStart()
          if (trimmedLine.startsWith('data:')) {
            // Take everything after 'data:' literally, including leading spaces
            dataParts.push(trimmedLine.substring(5))
          }
        }

        if (dataParts.length > 0) {
          const combinedData = dataParts.join('\n')
          if (combinedData.trim() === '[DONE]') {
            continue
          }
          if (onProgress) {
            onProgress(combinedData)
          }
        }
      }
    }
  } catch (error) {
    console.error('流式分析请求失败:', error)
    throw error // 抛出错误以便调用方可以处理
  }
}

/**
 * 通过AI分析岗位描述文本
 * @param {string} text - 原始岗位描述纯文本
 * @returns Promise
 */
export const analyzeJobDescription = (text) => {
  return http.post('/ai/analysis/job-description', { text })
}
