<script setup lang="ts">
const { isFullscreen, toggle } = useFullscreen()
</script>

<template>
  <div>
    <el-icon :size="18" @click="toggle">
      <i-mdi-fullscreen-exit v-if="isFullscreen" />
      <i-mdi-fullscreen v-else />
    </el-icon>
  </div>
</template>
