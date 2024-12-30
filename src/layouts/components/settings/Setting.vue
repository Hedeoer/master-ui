<script setup lang="ts">
import SettingDrawer from './SettingDrawer.vue'

const show = ref<boolean>(false)
function toggle() {
  show.value = !show.value
}
</script>

<template>
  <div>
    <el-icon @click="toggle">
      <i-mdi-dots-vertical />
    </el-icon>

    <SettingDrawer v-model:value="show" />
  </div>
</template>
