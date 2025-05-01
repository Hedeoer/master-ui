<script setup lang="ts">
import { ref } from 'vue'

const error = ref<Error | null>(null)

onErrorCaptured((err) => {
  error.value = err instanceof Error ? err : new Error(String(err))
  // 阻止异常继续冒泡，防止全局渲染断链
  return false
})
</script>

<template>
  <div>
    <slot v-if="!error" />
    <div v-else style="padding: 40px; color: #f56c6c; text-align: center;">
      <h2>页面发生错误</h2>
      <div style="margin: 16px 0;">{{ error.message }}</div>
      <details style="color: #999; text-align: left; max-width: 600px; margin: 0 auto;">
        <summary>异常堆栈</summary>
        <pre>{{ error.stack }}</pre>
      </details>
      <div style="margin-top: 24px;">请联系管理员或刷新页面重试。</div>
    </div>
  </div>
</template> 