import http from '@/utils/http'
import { baseURL } from '@/utils/http'

export const listSessions = (userId) => {
  return http.get('/ai/chat/sessions', { params: { userId } })
}

export const renameSession = (sessionId, userId, title) => {
  return http.post(
    `/ai/chat/session/rename?sessionId=${sessionId}&userId=${userId}&title=${encodeURIComponent(
      title,
    )}`,
  )
}

export const deleteSession = (sessionId, userId) => {
  return http.post(`/ai/chat/session/delete?sessionId=${sessionId}&userId=${userId}`)
}

export const createSession = (userId, title) => {
  const t = title ? encodeURIComponent(title) : ''
  const suffix = t ? `&title=${t}` : ''
  return http.post(`/ai/chat/session/create?userId=${userId}${suffix}`)
}

export const getSessionMessages = (sessionId, userId) => {
  return http.get('/ai/chat/session/messages', { params: { sessionId, userId } })
}

export const streamChat = async ({ sessionId, userId, message, onProgress, onEvent }) => {
  const params = new URLSearchParams()
  if (sessionId) params.append('sessionId', sessionId)
  if (userId) params.append('userId', userId)
  if (message) params.append('message', message)
  const url = `${baseURL}/ai/chat/stream?${params.toString()}`
  const token = localStorage.getItem('token')
  const headers = {
    Accept: 'text/event-stream',
    'Cache-Control': 'no-cache',
  }
  if (token) {
    headers.Authorization = `${token}`
  }
  const response = await fetch(url, {
    method: 'GET',
    headers,
  })
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const reader = response.body.getReader()
  const decoder = new TextDecoder('utf-8')
  let buffer = ''
  const SEP_RE = /\r?\n\r?\n/
  const LINE_RE = /\r?\n/
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
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
        if (combinedData.trim() === '[DONE]') {
          continue
        }
        if (eventType && onEvent) {
          onEvent(eventType, combinedData)
        } else if (onProgress) {
          onProgress(combinedData)
        }
      }
    }
  }
}

export const streamChatES = ({ sessionId, userId, message, onProgress, onEvent }) => {
  const params = new URLSearchParams()
  if (sessionId) params.append('sessionId', sessionId)
  if (userId) params.append('userId', userId)
  if (message) params.append('message', message)
  const token = localStorage.getItem('token')
  if (token) {
    params.append('token', token)
  }
  const url = `http://localhost:8080/talent-api/ai/chat/stream?${params.toString()}`
  return new Promise((resolve, reject) => {
    const es = new EventSource(url)
    const cleanup = () => {
      try {
        es.close()
      } catch {}
    }
    es.onopen = () => {
      // connection opened
    }
    es.addEventListener('message', (e) => {
      const data = e.data ?? ''
      if (data.trim() === '[DONE]') {
        cleanup()
        resolve()
        return
      }
      if (onProgress) {
        onProgress(data)
      }
    })
    es.addEventListener('session', (e) => {
      const data = e.data ?? ''
      if (onEvent) {
        onEvent('session', data)
      }
    })
    es.addEventListener('done', () => {
      cleanup()
      resolve()
    })
    es.onerror = () => {
      // Many servers close SSE without a final event; treat as completed
      cleanup()
      resolve()
    }
  })
}

export const getChatStream = async ({ sessionId, userId, message, onProgress }) => {
  try {
    const params = new URLSearchParams()
    if (sessionId) {
      params.append('sessionId', sessionId)
    }
    if (userId) {
      params.append('userId', userId)
    }
    if (message) {
      params.append('message', message)
    }
    const url = `http://localhost:8080/talent-api/ai/chat/stream?${params.toString()}`
    const token = localStorage.getItem('token')
    const headers = {
      Accept: 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
    if (token) {
      headers.Authorization = `${token}`
    }
    const response = await fetch(url, {
      method: 'GET',
      headers,
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''
    const SEP_RE = /\r?\n\r?\n/
    const LINE_RE = /\r?\n/
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const eventStrings = buffer.split(SEP_RE)
      buffer = eventStrings.pop()
      for (const eventString of eventStrings) {
        if (!eventString) continue
        const dataParts = []
        const lines = eventString.split(LINE_RE)
        for (const line of lines) {
          const trimmedLine = line.trimStart()
          if (trimmedLine.startsWith('data:')) {
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
    console.error('AI流式请求失败:', error)
    throw error
  }
}
