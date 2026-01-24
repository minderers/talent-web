<template>
  <!-- 技术感背景容器 - 使用Teleport插入到body层级 -->
  <Teleport to="body">
    <div class="fixed inset-0 -z-10 overflow-hidden">
      <!-- 基础渐变背景 -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
      ></div>

      <!-- 代码雨效果 -->
      <div class="absolute inset-0 opacity-10">
        <div
          v-for="(column, index) in codeColumns"
          :key="`code-${index}`"
          class="absolute text-green-400 font-mono text-sm animate-codeFall"
          :style="{
            left: column.left + '%',
            animationDelay: column.delay + 's',
            animationDuration: column.duration + 's',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
          }"
        >
          {{ column.code }}
        </div>
      </div>

      <!-- 网格覆盖层 -->
      <div
        class="absolute inset-0 opacity-20 animate-gridMove"
        style="
          background-image:
            linear-gradient(rgba(34, 197, 94, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.1) 1px, transparent 1px);
          background-size: 40px 40px;
        "
      ></div>

      <!-- 二进制背景 -->
      <div class="absolute inset-0 opacity-5 font-mono text-xs text-green-400 overflow-hidden">
        <div
          v-for="(char, index) in binaryChars"
          :key="`binary-${index}`"
          class="absolute animate-binaryFlicker"
          :style="{
            left: char.left + '%',
            top: char.top + '%',
            animationDelay: char.delay + 's',
          }"
        >
          {{ char.value }}
        </div>
      </div>

      <!-- 粒子效果 -->
      <div class="absolute inset-0">
        <div
          v-for="(particle, index) in particles"
          :key="`particle-${index}`"
          class="absolute w-1 h-1 bg-green-400 rounded-full animate-particleFloat"
          :style="{
            left: particle.left + '%',
            top: particle.top + '%',
            animationDelay: particle.delay + 's',
            animationDuration: particle.duration + 's',
          }"
        ></div>
      </div>

      <!-- 额外的装饰层 - 可通过props控制 -->
      <div
        v-if="showGlow"
        class="absolute inset-0 bg-gradient-to-t from-green-500/10 via-transparent to-transparent"
      ></div>

      <!-- 动态光效 -->
      <div
        v-if="animated"
        class="absolute inset-0 bg-gradient-to-r from-transparent via-green-400/5 to-transparent animate-shine"
      ></div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// Props定义
const props = defineProps({
  // 是否显示光晕效果
  showGlow: {
    type: Boolean,
    default: true,
  },
  // 是否启用动画
  animated: {
    type: Boolean,
    default: true,
  },
  // 代码密度 (1-50)
  codeDensity: {
    type: Number,
    default: 20,
    validator: (value) => value >= 1 && value <= 50,
  },
  // 粒子密度 (10-100)
  particleDensity: {
    type: Number,
    default: 50,
    validator: (value) => value >= 10 && value <= 100,
  },
  // 动画速度 (0.5-2)
  animationSpeed: {
    type: Number,
    default: 1,
    validator: (value) => value >= 0.5 && value <= 2,
  },
  // 主题颜色
  theme: {
    type: String,
    default: 'green',
    validator: (value) => ['green', 'blue', 'purple', 'cyan'].includes(value),
  },
})

// 主题颜色映射
const themeColors = {
  green: {
    primary: 'rgba(34, 197, 94, 0.1)',
    secondary: 'rgba(34, 197, 94, 0.05)',
    text: 'text-green-400',
    particle: 'bg-green-400',
  },
  blue: {
    primary: 'rgba(59, 130, 246, 0.1)',
    secondary: 'rgba(59, 130, 246, 0.05)',
    text: 'text-blue-400',
    particle: 'bg-blue-400',
  },
  purple: {
    primary: 'rgba(147, 51, 234, 0.1)',
    secondary: 'rgba(147, 51, 234, 0.05)',
    text: 'text-purple-400',
    particle: 'bg-purple-400',
  },
  cyan: {
    primary: 'rgba(6, 182, 212, 0.1)',
    secondary: 'rgba(6, 182, 212, 0.05)',
    text: 'text-cyan-400',
    particle: 'bg-cyan-400',
  },
}

// 代码片段
const codeSnippets = [
  'import java.util.*;',
  'public class TalentSystem',
  'private String studentId;',
  'public static void main',
  'System.out.println',
  'Connection conn = null;',
  'SELECT * FROM students',
  'INSERT INTO login_log',
  'token = generateToken()',
  'if (validateUser)',
  'return true;',
  'catch (Exception e)',
  'for (int i = 0; i < n; i++)',
  'Map<String, Object>',
  'List<TalentProfile>',
  '@Autowired',
  '@RestController',
  '@RequestMapping',
  '@GetMapping',
  'public ResponseEntity',
  'HttpStatus.OK',
  'JSON.parseObject',
  'RedisTemplate<String>',
  'rabbitMQ.send',
  'database.commit()',
]

// 计算属性
const codeColumns = computed(() => {
  return Array.from({ length: props.codeDensity }, (_, i) => ({
    left: Math.random() * 100,
    delay: (Math.random() * 20) / props.animationSpeed,
    duration: (15 + Math.random() * 10) / props.animationSpeed,
    code: Array.from(
      { length: 30 },
      () => codeSnippets[Math.floor(Math.random() * codeSnippets.length)],
    ).join('  '),
  }))
})

const particles = computed(() => {
  return Array.from({ length: props.particleDensity }, (_, i) => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: (Math.random() * 15) / props.animationSpeed,
    duration: (10 + Math.random() * 10) / props.animationSpeed,
  }))
})

const binaryChars = computed(() => {
  return Array.from({ length: 200 }, (_, i) => ({
    value: Math.random() > 0.5 ? '0' : '1',
    left: Math.random() * 100,
    top: Math.random() * 100,
    delay: (Math.random() * 3) / props.animationSpeed,
  }))
})

// 方法
const updateTheme = () => {
  const colors = themeColors[props.theme]
  // 这里可以添加主题切换逻辑
  console.log(`主题已切换到: ${props.theme}`, colors)
}

// 生命周期
onMounted(() => {
  updateTheme()
})

// 监听主题变化
watch(() => props.theme, updateTheme)
</script>

<style scoped>
/* 自定义动画 */
@keyframes codeFall {
  0% {
    transform: translateY(-100%);
  }
  100% {
    transform: translateY(100vh);
  }
}

@keyframes gridMove {
  0% {
    transform: translate(0, 0);
  }
  100% {
    transform: translate(40px, 40px);
  }
}

@keyframes particleFloat {
  0% {
    transform: translateY(100vh) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) translateX(100px);
    opacity: 0;
  }
}

@keyframes binaryFlicker {
  0% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.8;
  }
}

@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-codeFall {
  animation: codeFall linear infinite;
}

.animate-gridMove {
  animation: gridMove linear infinite;
}

.animate-particleFloat {
  animation: particleFloat linear infinite;
}

.animate-binaryFlicker {
  animation: binaryFlicker 3s ease-in-out infinite alternate;
}

.animate-shine {
  animation: shine 3s ease-in-out infinite;
}
</style>
