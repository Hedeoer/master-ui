<script setup lang="ts">
import {
  TheContent,
  TheFooter,
  TheHeader,
  TheLogo,
  TheMenu,
  TheTabs,
} from './components'

// 窗口宽度
const { width } = useWindowSize()
const themeStore = useThemeStore()

/** 初始化侧边栏状态 */
function initSideCollapse() {
  if (width.value < 768) {
    themeStore.toggle(true)
  }
}

// 防抖函数. 窗口宽度停止改变50ms后执行
const debouncedFn = useDebounceFn(() => {
  initSideCollapse()
}, 50)

// 如果需要自动折叠侧边栏
if (themeStore.settings.autoCollapseSode) {
  initSideCollapse()
  // 添加窗口变化监听器，用于动态计算侧边栏宽度
  window.addEventListener('resize', debouncedFn)
}

// 监听自动折叠侧边栏设置 值变化
watch (() => themeStore.settings.autoCollapseSode, (val) => {
  if (val) {
    initSideCollapse()
    window.addEventListener('resize', debouncedFn)
  } else {
    window.removeEventListener('resize', debouncedFn)
  }
})

// 计算侧边栏宽度
const sideWidth = computed(() =>
  themeStore.collapseSide
    ? 'var(--layout-side-fold-width)'
    : 'var(--layout-side-unfold-width)',
)
// 计算侧边栏折叠状态, 折叠之后添加类名fold
const foldClass = computed(() => {
  return themeStore.collapseSide ? 'fold' : ''
})
// 计算侧边栏主题色，如果反色则添加类名reverse
const menuTheme = computed(() => {
  return themeStore.settings.sideThemeInverse ? 'reverse' : ''
})
</script>

<template>
  <div class="admin-layout">
    <el-container @contextmenu.prevent>
      <!-- 侧边栏 -->
      <el-aside :width="sideWidth" class="admin-side" :class="[menuTheme, foldClass]">
        <!-- Logo -->
        <div v-if="themeStore.settings.showLogo" class="admin-logo">
          <TheLogo />
        </div>

        <!-- Menu -->
        <el-scrollbar
          class="menu-scroll"
          :style="{
            height: themeStore.settings.showLogo
              ? 'calc(100vh - var(--layout-nav-height))'
              : '100vh',
          }"
        >
          <TheMenu />
        </el-scrollbar>
      </el-aside>

      <el-container>
        <!-- 头部 -->
        <el-header class="admin-header" @contextmenu.prevent>
          <TheHeader />
          <TheTabs v-if="themeStore.settings.showTabs" />
        </el-header>

        <!-- 内容 -->
        <el-main class="admin-main">
          <TheContent />
          <el-backtop target=".admin-main" :right="20" :bottom="60">
            <el-icon><i-ep-top /></el-icon>
          </el-backtop>
        </el-main>

        <!-- 页脚 -->
        <el-footer v-if="themeStore.settings.showFoot" class="admin-footer">
          <TheFooter />
        </el-footer>
      </el-container>
    </el-container>
  </div>
</template>

<style scoped>
:deep(.el-header) {
  padding: 0;
  height: calc(var(--layout-nav-height) + var(--layout-tab-height));
}
:deep(.el-footer) {
  --el-footer-padding: 0;
  --el-footer-height: 0;
}
</style>
