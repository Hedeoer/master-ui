<script setup lang="ts">
import SettingColor from './SettingColor.vue'

const props = defineProps<{
  /** 抽屉显隐 */
  value: boolean
}>()
const emit = defineEmits(['update:value'])

const show = computed({
  get() {
    return props.value
  },
  set(val: boolean) {
    emit('update:value', val)
  },
})

const themeStore = useThemeStore()
const settings = computed(() => themeStore.settings)
const switchRef = ref()
const isDark = useDark({
  storageKey: 'dark-theme'
})
const toggleDark = useToggle(isDark)
const darkMode = ref(isDark.value)

/**
 * 黑暗模式切换前回调
 * 参考：https://juejin.cn/post/7444109900878151731
 */
function handleThemeBeforeChange() {
  if (!document.startViewTransition) {
    return true
  }

  return new Promise<boolean>((resolve) => {
    const switchEl = switchRef.value.$el as HTMLElement
    const rect = switchEl.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(
      Math.max(x, innerWidth - x),
      Math.max(y, innerHeight - y)
    )
    const transition = document.startViewTransition(() => {
      resolve(true)
    })
    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${radius}px at ${x}px ${y}px)`
      ]
      document.documentElement.animate(
        {
          clipPath
        },
        {
          duration: 400,
          easing: 'ease-in',
          pseudoElement: '::view-transition-new(root)'
        }
      )
    })
  })
}

/** 黑暗模式切换 */
function darkModeChange(val: boolean) {
  settings.value.themeMode = val ? 'dark' : 'light'
  toggleDark(val)
}

watch(() => darkMode.value, (val) => {
  darkModeChange(val as boolean)
})

/** 保存设置 */
function handleSave() {
  themeStore.saveSettins({
    callback: () => {
      show.value = false
    },
  })
}

/** 重置设置 */
function handleReset() {
  themeStore.resetSettings()
}

/** 关闭抽屉 */
function handleClose() {
  show.value = false
  // 自动保存设置
  themeStore.saveSettins({ showTips: false })
}
</script>

<template>
  <div class="the-settings-drawer">
    <el-drawer
      v-model="show"
      title="系统设置"
      :size="340"
      :close-btn="false"
      destroy-on-close
      @close="handleClose"
    >
      <el-scrollbar style="padding-right: 30px">
        <!-- 布局设置 -->
        <el-divider content-position="left">布局设置</el-divider>
        <div class="setting-item">
          开启黑暗模式
          <el-switch
            ref="switchRef"
            v-model="darkMode"
            :before-change="handleThemeBeforeChange"
          />
        </div>
        <div class="setting-item">
          全局组件大小
          <el-select
            v-model="settings.size"
            style="width: 120px"
          >
            <el-option value="large" label="大" />
            <el-option value="default" label="默认" />
            <el-option value="small" label="小" />
          </el-select>
        </div>
        <div class="setting-item">
          <span>
            按钮自动插入空格
            <el-tooltip content="仅当文本长度为 2 且所有字符均为中文时才生效">
              <el-icon><i-ep-info-filled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="settings.autoInsertSpace" />
        </div>

        <!-- 主题色 -->
        <el-divider content-position="left">主题色</el-divider>
        <SettingColor v-model="settings.primaryColor" />

        <!-- 基础设置 -->
        <el-divider content-position="left">基础设置</el-divider>
        <div class="setting-item">
          是否显示Logo
          <el-switch v-model="settings.showLogo" />
        </div>
        <div class="setting-item">
          是否显示面包屑
          <el-switch v-model="settings.showBreadcrumb" />
        </div>
        <div class="setting-item">
          是否显示页脚
          <el-switch v-model="settings.showFoot" />
        </div>
        <div class="setting-item">
          <span>
            是否自动折叠菜单
            <el-tooltip content="页面宽度小于特定值时，是否自动折叠菜单">
              <el-icon><i-ep-info-filled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="settings.autoCollapseSode" />
        </div>

        <!-- 菜单设置 -->
        <el-divider content-position="left">菜单设置</el-divider>
        <div class="setting-item">
          菜单手风琴效果
          <el-switch v-model="settings.accordion" />
        </div>
        <div class="setting-item">
          菜单主题是否相反
          <el-switch v-model="settings.sideThemeInverse" />
        </div>

        <!-- 多页签 -->
        <el-divider content-position="left">多页签</el-divider>
        <div class="setting-item">
          是否显示多页签
          <el-switch v-model="settings.showTabs" />
        </div>
        <div class="setting-item">
          样式
          <el-select
            v-model="settings.tabTheme"
            :disabled="!settings.showTabs"
            :empty-values="[null, undefined]"
            style="width: 120px"
          >
            <el-option value="" label="样式一" />
            <el-option value="underpainting" label="样式二" />
            <el-option value="designer" label="样式三" />
          </el-select>
        </div>
        <div class="setting-item">
          <span>
            是否缓存多页签
            <el-tooltip content="不缓存会导致刷新页面后tab栏标签都关闭">
              <el-icon><i-ep-info-filled /></el-icon>
            </el-tooltip>
          </span>
          <el-switch v-model="settings.cacheTabs" />
        </div>
        <div class="setting-item">
          是否显示页面切换动画
          <el-switch v-model="settings.showAnimation" />
        </div>
        <div class="setting-item">
          页面切换动画类型
          <el-select
            v-model="settings.animationMode"
            :disabled="!settings.showAnimation"
            style="width: 120px"
          >
            <el-option value="fade-slide" label="滑动" />
            <el-option value="fade" label="消退" />
            <el-option value="fade-bottom" label="底部消退" />
            <el-option value="fade-scale" label="缩放消退" />
            <el-option value="zoom-fade" label="渐变" />
            <el-option value="zoom-out" label="闪现" />
          </el-select>
        </div>
      </el-scrollbar>

      <template #footer>
        <el-space>
          <el-button type="primary" plain @click="handleSave">
            保存配置
          </el-button>
          <el-button plain @click="handleReset"> 重置配置 </el-button>
        </el-space>
      </template>
    </el-drawer>
  </div>
</template>

<style scoped>
.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  margin-bottom: 10px;
}

.setting-item span {
  display: flex;
  align-items: center;
  justify-content: center;
}

/** 抽屉头部太高辣 */
:deep(.el-drawer__header) {
  margin-bottom: 0;
}

/** 隐藏抽屉本身的滚动条，使用 el-scrollbar 滚动条 */
:deep(.el-drawer__body) {
  overflow: hidden;
  padding-right: 0;
  padding-bottom: 0;
}

/** 抽屉底部按钮居中 */
:deep(.el-drawer__footer) {
  text-align: center;
}
</style>
