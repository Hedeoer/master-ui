<script setup lang="ts">
import { zhCn } from 'element-plus/es/locales.mjs'

// 初始化主题设置
const themeStore = useThemeStore()
themeStore.initSettings()
const themeSetting = computed(() => themeStore.settings)

const { loading, endLoading } = useLoading(true)
const LOADING_INTERVAL = 1500
const BEFORE_LEAVING_MS = 1000
useTimeoutFn(endLoading, LOADING_INTERVAL)
</script>

<template>
  <el-config-provider
    :locale="zhCn"
    :size="themeSetting.size"
    :button="{ autoInsertSpace: themeSetting.autoInsertSpace }"
  >
    <PreLoadPage v-if="loading" :before-leaving-ms="BEFORE_LEAVING_MS" />
    <RouterView v-else />
  </el-config-provider>
</template>
