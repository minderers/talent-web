<template>
  <div class="flex h-full min-h-0">
    <div class="w-72 border-r border-green-600/20 bg-slate-800/50">
      <div class="px-4 py-3 text-green-400 font-semibold flex items-center justify-between">
        <span>会话</span>
        <button
          class="text-slate-300 hover:text-green-400 transition-colors"
          @click.stop="handleCreateSession"
          title="新建会话"
          aria-label="新建会话"
        >
          <el-icon><Plus /></el-icon>
        </button>
      </div>
      <div class="px-2 space-y-2">
        <div
          v-for="s in sessions"
          :key="s.pkId"
          class="group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors"
          :class="[
            selectedSessionId === Number(s.pkId)
              ? 'bg-green-900/40 text-white'
              : 'bg-slate-700/40 text-slate-300 hover:bg-slate-700/60',
          ]"
          @click="handleSelectSession(s)"
        >
          <div class="flex items-center gap-2 flex-1 pr-2">
            <input
              v-if="editingSessionId === Number(s.pkId)"
              v-model="editingTitle"
              @keyup.enter.stop="commitEdit"
              @keyup.esc.stop="cancelEdit"
              @blur="commitEdit"
              class="flex-1 px-2 py-1 rounded bg-slate-700 text-slate-200 border border-slate-600 outline-none"
            />
            <div
              v-else
              class="truncate cursor-text"
              @dblclick.stop="startEdit(s)"
              :title="s.title || '未命名会话'"
            >
              {{ s.title || '未命名会话' }}
            </div>
          </div>
          <button
            class="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-400"
            @click.stop="handleDelete(s)"
            aria-label="删除会话"
            title="删除"
          >
            <el-icon><Close /></el-icon>
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex flex-col bg-slate-900 min-h-0">
      <div class="px-6 py-4 border-b border-green-600/20 flex items-center">
        <div class="text-green-400 font-bold">AI 智能问答</div>
      </div>

      <div ref="messagesContainer" class="flex-1 overflow-y-auto p-4 space-y-4">
        <div
          v-for="(m, i) in messages"
          :key="i"
          class="flex"
          :class="m.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-3xl px-4 py-2 rounded-lg"
            :class="
              m.role === 'user'
                ? 'bg-green-700 text-white rounded-br-none'
                : 'bg-slate-800/80 backdrop-blur-xl border border-purple-400/20 rounded-2xl shadow-lg text-slate-200 rounded-bl-none p-6'
            "
          >
            <div
              v-if="m.role === 'assistant'"
              class="prose prose-invert max-w-none"
              v-html="renderMarkdown(m.content)"
            ></div>
            <div v-else class="whitespace-pre-wrap break-words">{{ m.content }}</div>
          </div>
        </div>
      </div>

      <div class="p-4 border-t border-green-600/20">
        <div class="flex items-center gap-3">
          <input
            v-model="input"
            :disabled="sending"
            placeholder="请输入内容"
            class="flex-1 px-4 py-3 rounded bg-slate-800 text-slate-200 border border-slate-700 outline-none"
            @keyup.enter="handleSend"
          />
          <button
            class="px-4 py-3 rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
            :disabled="sending || !canSend"
            @click="handleSend"
          >
            发送
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import {
  listSessions,
  renameSession,
  deleteSession,
  createSession,
  getChatStream,
  getSessionMessages,
} from '@/api/ai'
import { marked } from 'marked'
import { Close, Plus } from '@element-plus/icons-vue'

const userStore = useUserStore()
const messagesContainer = ref(null)

const sessions = ref([])
const selectedSessionId = ref(null)
const messages = ref([])
const input = ref('')
const sending = ref(false)
const editingSessionId = ref(null)
const editingTitle = ref('')

const userId = computed(() => userStore.userInfo?.pkId)
const scrollToBottom = () => {
  const el = messagesContainer.value
  if (!el) return
  el.scrollTop = el.scrollHeight
}

const canSend = computed(() => !!input.value && !!userId.value)

const renderMarkdown = (text) => {
  return text ? marked(text) : ''
}

const loadSessions = async () => {
  if (!userId.value) return
  const res = await listSessions(userId.value)
  const all = res.data || []
  sessions.value = all.filter((s) => s.deleteFlag !== 1).sort((a, b) => a.pkId - b.pkId)
  if (!selectedSessionId.value && sessions.value.length > 0) {
    selectedSessionId.value = Number(sessions.value[0].pkId)
    await loadMessages(selectedSessionId.value)
  }
}

const loadMessages = async (sessionId) => {
  messages.value = []
  const res = await getSessionMessages(sessionId, userId.value)
  const list = (res.data || []).filter((m) => m.deleteFlag !== 1)
  list.sort((a, b) => ((a.createTime || 0) > (b.createTime || 0) ? 1 : -1))
  for (const m of list) {
    messages.value.push({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content || '',
    })
  }
  nextTick(scrollToBottom)
}

const startEdit = (s) => {
  editingSessionId.value = Number(s.pkId)
  editingTitle.value = s.title || ''
}

const commitEdit = async () => {
  const id = editingSessionId.value
  const title = (editingTitle.value || '').trim()
  if (!id) return
  if (!title) {
    ElMessage.warning('标题不能为空')
    return
  }
  try {
    await renameSession(id, userId.value, title)
    await loadSessions()
    ElMessage.success('重命名成功')
  } catch (e) {
    ElMessage.error('重命名失败')
  } finally {
    editingSessionId.value = null
    editingTitle.value = ''
  }
}

const cancelEdit = () => {
  editingSessionId.value = null
  editingTitle.value = ''
}
const handleCreateSession = async () => {
  if (!userId.value) return
  try {
    const res = await createSession(userId.value, '')
    const created = res.data
    await loadSessions()
    if (created?.pkId) {
      selectedSessionId.value = Number(created.pkId)
      await loadMessages(selectedSessionId.value)
    }
    ElMessage.success('新建会话成功')
  } catch (e) {
    ElMessage.error('新建会话失败')
  }
}
const handleSelectSession = async (s) => {
  selectedSessionId.value = Number(s.pkId)
  await loadMessages(selectedSessionId.value)
}

const handleRename = async (s) => {
  const { value } = await ElMessageBox.prompt('请输入新的会话标题', '重命名', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
  if (!value) return
  await renameSession(s.pkId, userId.value, value)
  await loadSessions()
  ElMessage.success('重命名成功')
}

const handleDelete = async (s) => {
  await ElMessageBox.confirm('确认删除该会话？', '提示', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await deleteSession(s.pkId, userId.value)
  await loadSessions()
  if (selectedSessionId.value === Number(s.pkId)) {
    selectedSessionId.value = sessions.value[0]?.pkId ? Number(sessions.value[0].pkId) : null
    messages.value = []
  }
  ElMessage.success('删除成功')
}

const handleSend = async () => {
  if (!canSend.value) return
  messages.value.push({ role: 'user', content: input.value })
  messages.value.push({ role: 'assistant', content: '' })
  const assistantIndex = messages.value.length - 1
  nextTick(scrollToBottom)
  sending.value = true
  try {
    await getChatStream({
      sessionId: selectedSessionId.value,
      userId: userId.value,
      message: input.value,
      onProgress: (chunk) => {
        messages.value[assistantIndex].content += chunk
        nextTick(scrollToBottom)
      },
    })
    await loadSessions()
  } catch (e) {
    ElMessage.error('发送失败')
  } finally {
    sending.value = false
    input.value = ''
  }
}
onMounted(async () => {
  await loadSessions()
})
</script>

<style scoped></style>
