import type { ThemeState } from '~/types/store'
import type { ThemeSettings } from '~/types/theme'
import { cloneDeep } from '@pureadmin/utils'
import { DEFAULT_PERMARY_COLOR, DEFAULT_THEME_MODE } from '~/config/setting'
import { CacheKey } from '~/types/cache'
import { storageLocal, storageSession } from '~/utils/cache'

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    /** 主题设置 */
    settings: {
      /** 是否显示Logo */
      showLogo: true,
      /** 是否显示面包屑 */
      showBreadcrumb: true,
      /** 是否显示多页签 */
      showTabs: true,
      /** 是否显示页脚 */
      showFoot: true,
      /** 宽度小于特定值时，是否自动折叠菜单 */
      autoCollapseSode: true,
      /** 是否缓存多页签 */
      cacheTabs: true,
      /** 菜单是否手风琴效果 */
      accordion: true,
      /** 菜单主题是否相反 */
      sideThemeInverse: false,
      /** 是否显示页面切换动画 */
      showAnimation: true,
      /** 页面切换动画类型 */
      animationMode: 'fade-slide',
      /** 多页签样式 */
      tabTheme: '',
      /** 页面主题的亮暗模式 */
      themeMode: DEFAULT_THEME_MODE,
      /** 主题色 */
      primaryColor: DEFAULT_PERMARY_COLOR,

      /** 全局组件大小 */
      size: 'default',
      /** 按钮文字是否自动插入空格(仅当文本长度为 2 且所有字符均为中文时才生效) */
      autoInsertSpace: false,
    },
    /** 展开收起菜单 */
    collapseSide: storageSession(false).getItem(CacheKey.MENU_COLLAPSE_CACHE_KEY) ?? false,
  }),
  actions: {
    /** 展开收起菜单 */
    toggle(value?: boolean) {
      if (value === undefined) {
        this.collapseSide = !this.collapseSide
        storageSession(false).setItem(CacheKey.MENU_COLLAPSE_CACHE_KEY, this.collapseSide)
        return
      }
      if (this.collapseSide === value!) return

      this.collapseSide = value!
      storageSession(false).setItem(CacheKey.MENU_COLLAPSE_CACHE_KEY, this.collapseSide)
    },
    /** 是否黑暗模式 */
    isDark() {
      return this.settings.themeMode === 'dark'
    },
    /** 初始化设置 */
    initSettings() {
      const cacheData = storageLocal().getItem<ThemeSettings>(CacheKey.THEME_SETTING_CACHE_KEY)
      if (cacheData) {
        this.settings = cacheData
      }

      // 设置主题色
      useElementPlusTheme(this.settings.primaryColor)

      // 初始化暗黑模式
      if (this.isDark()) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    },
    /** 保存设置 */
    saveSettins({
      callback,
      showTips = true,
    }: {
      callback?: () => void
      showTips?: boolean
    }) {
      if (!showTips) {
        storageLocal().setItem<ThemeSettings>(CacheKey.THEME_SETTING_CACHE_KEY, cloneDeep(this.settings))
        return
      }

      storageLocal().setItem<ThemeSettings>(CacheKey.THEME_SETTING_CACHE_KEY, cloneDeep(this.settings))
      toastSuccess('保存成功', 1000)
      callback && callback()
    },
    /** 重置设置 */
    resetSettings() {
      this.settings = {
        showLogo: true,
        showBreadcrumb: true,
        showTabs: true,
        showFoot: true,
        autoCollapseSode: true,
        cacheTabs: true,
        accordion: true,
        sideThemeInverse: false,
        showAnimation: true,
        animationMode: 'fade-slide',
        tabTheme: '',
        themeMode: DEFAULT_THEME_MODE,
        primaryColor: DEFAULT_PERMARY_COLOR,
        size: 'default',
        autoInsertSpace: false,
      }
    },
  },
})

export function useThemeStoreHook() {
  return useThemeStore(store)
}
