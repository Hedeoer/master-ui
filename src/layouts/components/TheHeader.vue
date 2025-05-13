<script setup lang="ts">
import {
  Avatar,
  Breadcrumb,
  FullScreen,
} from './header-items'
import TheSearch from './search'
import TheSetting from './settings'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()

/** 刷新页面 */
function reloadPage() {
  router.push({
    path: `/redirect${unref(route).fullPath}`,
  })
}
</script>

<template>
  <div class="the-nav">
    <!-- 菜单展开收起 -->
    <div class="the-nav-item">
      <!-- 更多图标请参阅 https://icones.js.org/collection/ep -->
      <el-icon @click="themeStore.toggle()">
        <i-ep-expand v-if="themeStore.collapseSide" />
        <i-ep-fold v-else />
      </el-icon>
    </div>

    <!-- 刷新图标 -->
    <div class="the-nav-item">
      <!-- 更多图标请参阅 https://icones.js.org/collection/ep -->
      <el-icon @click="reloadPage"><i-ep-refresh-right /></el-icon>
    </div>

    <!-- 面包屑 -->
    <Breadcrumb v-if="isPC && themeStore.settings.showBreadcrumb" class="the-nav-item" />

    <!-- 占位 -->
    <div style="flex: auto;" />

    <!-- 系统功能 -->
    <div class="end-nav">
      <TheSearch class="the-nav-item" />
      <FullScreen class="the-nav-item" />
      <Avatar class="the-nav-item" />
      <TheSetting class="the-nav-item" />
    </div>
  </div>
</template>

<style scoped>
.end-nav {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  margin-right: 16px;
}
</style>
