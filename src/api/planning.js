import http from '@/utils/http'

export const getPlanningSuggestions = (params) => {
  return http.get('/planning/suggestions', { params })
}

export const getPlanningPolishStream = async ({ majorId, jobType, education, onProgress }) => {
  try {
    const params = new URLSearchParams()
    if (majorId !== undefined && majorId !== null) params.append('majorId', majorId)
    if (jobType) params.append('jobType', jobType)
    if (education) params.append('education', education)
    const url = `http://localhost:8080/talent-api/planning/suggestions/stream?${params.toString()}`
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const eventStrings = buffer.split('\n\n')
      buffer = eventStrings.pop()
      for (const eventString of eventStrings) {
        if (!eventString) continue
        const dataParts = []
        const lines = eventString.split('\n')
        for (const line of lines) {
          const trimmedLine = line.trimStart()
          if (trimmedLine.startsWith('data:')) {
            dataParts.push(trimmedLine.substring(5))
          }
        }
        if (dataParts.length > 0) {
          const combinedData = dataParts.join('\n')
          if (combinedData.trim() === '[DONE]') continue
          if (onProgress) onProgress(combinedData)
        }
      }
    }
  } catch (error) {
    console.error('规划建议流式请求失败:', error)
    throw error
  }
}

export const downloadPlanningExcel = async ({ majorId, year, filename }) => {
  const params = new URLSearchParams()
  params.append('majorId', majorId)
  params.append('year', year)
  const url = `http://localhost:8080/talent-api/planning/report/excel?${params.toString()}`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename && filename.trim() ? filename.trim() : 'planning.xlsx'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    URL.revokeObjectURL(link.href)
    document.body.removeChild(link)
  }, 1000)
}

export const downloadPlanningWord = async ({ majorId, year, filename }) => {
  const params = new URLSearchParams()
  params.append('majorId', majorId)
  params.append('year', year)
  const url = `http://localhost:8080/talent-api/planning/report/word?${params.toString()}`
  const res = await fetch(url, { method: 'GET' })
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
  const blob = await res.blob()
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename && filename.trim() ? filename.trim() : 'planning.docx'
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => {
    URL.revokeObjectURL(link.href)
    document.body.removeChild(link)
  }, 1000)
}

export const evaluateEffect = (params) => {
  return http.get('/planning/effect/evaluate', { params })
}

export const getPlanningAiStream = async ({ majorId, jobType, education, onProgress }) => {
  try {
    const params = new URLSearchParams()
    params.append('majorId', majorId)
    if (jobType) params.append('jobType', jobType)
    if (education) params.append('education', education)
    const url = `http://localhost:8080/talent-api/planning/suggestions/ai-stream?${params.toString()}`
    const response = await fetch(url, { method: 'GET' })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    const SEP_RE = /\r?\n\r?\n/
    const LINE_RE = /\r?\n/
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const eventStrings = buffer.split(SEP_RE)
      buffer = eventStrings.pop()
      for (const eventString of eventStrings) {
        if (!eventString) continue
        const dataParts = []
        let eventType = null
        const lines = eventString.split(LINE_RE)
        for (const line of lines) {
          const trimmedLine = line.trimStart()
          if (trimmedLine.startsWith('event:')) {
            eventType = trimmedLine.substring(6).trim()
            continue
          }
          if (trimmedLine.startsWith('data:')) {
            dataParts.push(trimmedLine.substring(5))
          }
        }
        if (dataParts.length > 0) {
          const combinedData = dataParts.join('\n')
          if (combinedData.trim() === '[DONE]') continue
          if (!eventType || eventType === 'message') {
            if (onProgress) onProgress(combinedData)
          }
        }
      }
    }
  } catch (error) {
    console.error('规划AI流式请求失败:', error)
    throw error
  }
}

export const getAdviceList = (params) => {
  return http.get('/planning/advice/list', { params })
}

export const updateAdvice = (data) => {
  return http.post('/planning/advice/update', data)
}

export const deleteAdvice = (data) => {
  return http.post('/planning/advice/delete', data)
}
