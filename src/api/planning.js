import http, { baseURL } from '@/utils/http'
import { useUserStore } from '@/stores/user'

const getAuthToken = () => {
  const userStore = useUserStore()
  return userStore.userInfo?.accessToken || userStore.token || localStorage.getItem('token') || ''
}

const parseSsePayload = (payload) => {
  const text = String(payload || '').trim()
  if (!text || text === '[DONE]') return ''

  try {
    const parsed = JSON.parse(text)

    if (typeof parsed === 'string') return parsed

    const content =
      parsed?.data?.content ||
      parsed?.data?.text ||
      parsed?.data?.message ||
      parsed?.data ||
      parsed?.content ||
      parsed?.text ||
      parsed?.message ||
      parsed?.msg ||
      ''

    if (typeof content === 'string') return content
    if (content && typeof content === 'object') {
      return content.content || content.text || content.message || ''
    }

    return ''
  } catch {
    return text
  }
}

const emitSseEvent = (eventString, onProgress) => {
  if (!eventString) return

  const dataParts = []
  const lines = String(eventString).split(/\r?\n/)
  for (const line of lines) {
    const trimmedLine = line.trimStart()
    if (trimmedLine.startsWith('data:')) {
      dataParts.push(trimmedLine.substring(5))
    }
  }

  const rawPayload = dataParts.length ? dataParts.join('\n') : String(eventString)
  const content = parseSsePayload(rawPayload)
  if (content && onProgress) onProgress(content)
}

const parseSseStream = async (response, onProgress) => {
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const eventStrings = buffer.split(/\r?\n\r?\n/)
    buffer = eventStrings.pop() || ''

    for (const eventString of eventStrings) {
      emitSseEvent(eventString, onProgress)
    }
  }

  const tail = buffer + decoder.decode()
  if (tail.trim()) {
    emitSseEvent(tail, onProgress)
  }
}

const postSse = async (path, data, onProgress) => {
  const response = await fetch(`${baseURL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: getAuthToken(),
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('登录失效，请重新登录')
    }
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  await parseSseStream(response, onProgress)
}

const buildDownloadUrl = (path, params = {}) => {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      query.append(key, value)
    }
  })
  return `${baseURL}${path}${query.toString() ? `?${query.toString()}` : ''}`
}

const triggerDownload = async (path, params, fallbackName) => {
  const url = buildDownloadUrl(path, params)
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: getAuthToken(),
    },
  })

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('登录失效，请重新登录')
    }
    throw new Error(`HTTP error! status: ${res.status}`)
  }

  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') || ''
  const matchedName = disposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
  const filename = decodeURIComponent(matchedName?.[1] || matchedName?.[2] || fallbackName)

  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()

  setTimeout(() => {
    URL.revokeObjectURL(link.href)
    document.body.removeChild(link)
  }, 1000)
}

export const savePlanningProfile = (data) => {
  return http.post('/planning/profile/save', data)
}

export const getPlanningProfile = (majorId) => {
  return http.get(`/planning/profile/${majorId}`)
}

export const analyzePlanningMatch = (data) => {
  return http.post('/planning/match', data)
}

export const analyzePlanningMatchSplit = (data) => {
  return http.post('/planning/match/split', data)
}

export const interpretPlanningGap = (data) => {
  return http.post('/planning/gap/interpret', data)
}

export const interpretPlanningGapStream = ({ data, onProgress }) => {
  return postSse('/planning/gap/interpret', data, onProgress)
}

export const generatePlanningGuidance = (data) => {
  return http.post('/planning/guidance/generate', data)
}

export const generatePlanningGuidanceStream = ({ data, onProgress }) => {
  return postSse('/planning/guidance/generate', data, onProgress)
}

export const listPlanningGuidance = (params) => {
  return http.get('/planning/guidance/list', { params })
}

export const submitPlanningGuidance = (data) => {
  return http.post('/planning/guidance/submit', data)
}

export const reviewPlanningGuidanceByLeader = (data) => {
  return http.post('/planning/guidance/review/leader', data)
}

export const reviewPlanningGuidanceByAdmin = (data) => {
  return http.post('/planning/guidance/review/admin', data)
}

export const updatePlanningGuidanceProgress = (data) => {
  return http.post('/planning/guidance/progress', data)
}

export const getPlanningReport = (params) => {
  return http.get('/planning/report', { params })
}

export const downloadPlanningWord = (params) => {
  return triggerDownload('/planning/report/export/word', params, 'planning-report.docx')
}

export const downloadPlanningExcel = (params) => {
  return triggerDownload('/planning/report/export/excel', params, 'planning-report.xlsx')
}

export const evaluatePlanningEffect = (data) => {
  return http.post('/planning/effect', data)
}
