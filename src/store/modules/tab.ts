import type { RouteRecord } from 'vue-router'
import type { TabState } from '~/types/store'
import type { Tab } from '~/types/theme'
import { cloneDeep } from '@pureadmin/utils'
import { CacheKey } from '~/types/cache'
import { storageLocal } from '~/utils/cache'
import { getToken } from '~/utils/token'
import { useThemeStore } from './theme'

/**
 * 缓存tab数据
 * @param tabs
 * @return
 */
export function cacheTabs(tabs: Tab[]) {
  if (!getToken()) return
  const userStore = useUserStore()
  const userId = userStore.info?.id
  if (!userId) return

  // tabData : { 'userId': ['用户打开的菜单1', '用户打开的菜单2'] }
  const tabData: { [key: string]: Tab[] } = {}
  tabData[userId] = tabs
  storageLocal().setItem<{ [key: string]: Tab[] }>(CacheKey.TAB_SETTING_CACHE_KEY, tabData)
}

/**
 * 清空tabs缓存
 */
export function clearCachedTabs() {
  storageLocal().removeItem(CacheKey.TAB_SETTING_CACHE_KEY)
}

/**
 * 使用缓存中的tab数据
 * @return
 */
function applyCachedTabs(): Tab[] {
  if (!getToken()) return []
  const userStore = useUserStore()
  const userId = userStore.info?.id
  if (!userId) return []

  // tabData : { 'userId': ['用户打开的菜单1', '用户打开的菜单2'] }
  const tabData = storageLocal().getItem<{ [key: string]: Tab[] }>(CacheKey.TAB_SETTING_CACHE_KEY) || {}
  return tabData[userId] || []
}

/**
 * router 转换为 tab
 * @param routes
 * @return
 */
function routesToTabs(routes: RouteRecord[]): Tab[] {
  return routes.map((route: RouteRecord) => {
    return {
      name: route.name,
      path: route.path,
      title: route.meta?.title || '',
      icon: route.meta?.icon,
      keepAlive: route?.meta.keepAlive,
      affix: route.meta?.affix,
    } as Tab
  })
}

/**
 * 菜单TabStore
 */
export const useTabStore = defineStore('tab', {
  state: (): TabState => ({
    /** 打开的tab */
    tabs: [],
  }),
  getters: {
    /** 记录访问过的缓存页面 */
    cachedTabNames(state) {
      // 筛选有名字已缓存的tab，提取tab名字，去重后返回
      const names = state.tabs
        .filter(tab => !!tab.keepAlive && !!tab.name)
        .map(tab => tab.name)
      
      // 增加debug信息，帮助排查缓存问题
      console.log('【TabStore】计算keepAlive缓存组件列表:', [...new Set(names).values()]);
      
      return [...new Set(names).values()]
    },
  },
  actions: {
    /** 创建/初始化tabs数据 */
    createTabs() {
      // 判断是否缓存多页签, 有缓存就用缓存里的tabs
      const themeStore = useThemeStore()
      if (themeStore.settings.cacheTabs) {
        this.tabs = applyCachedTabs()
        console.log('【TabStore】从缓存初始化tabs:', this.tabs);
        return
      }

      // 如果不缓存多页签, 生成固定的tabs
      const router = useRouter()
      // 从路由中获取route.meta.affix = true的路由
      const routes = router.getRoutes().filter(i => i.meta.affix)
      if (!routes.length) {
        this.tabs = []
        console.log('【TabStore】未找到固定路由，初始化空tabs');
        return
      }
      // 生成固定的tabs
      this.tabs = routesToTabs(routes)
      console.log('【TabStore】从固定路由初始化tabs:', this.tabs);
    },
    /** 如果需要，则缓存tab */
    cacheIfNeed() {
      const themeStore = useThemeStore()
      // 判断是否缓存多页签
      if (themeStore.settings.cacheTabs) {
        cacheTabs(cloneDeep(this.tabs))
      }
    },
    /** 添加一个tab */
    addTab(tab: Tab) {
      const tabs = cloneDeep(this.tabs)
      // 如果要添加的tab不存在于tabs中，则添加
      if (tab.path && !tabs.map((i: Tab) => i.path).includes(tab.path)) {
        console.log('【TabStore】添加新tab:', tab);
        tabs.push(tab)
        this.tabs = tabs
        this.cacheIfNeed()
      } else {
        // 如果tab已存在，检查是否需要更新keepAlive标志
        const existingTabIndex = tabs.findIndex((i: Tab) => i.path === tab.path);
        if (existingTabIndex >= 0 && tab.keepAlive && !tabs[existingTabIndex].keepAlive) {
          console.log('【TabStore】更新existing tab的keepAlive标志:', tab);
          tabs[existingTabIndex].keepAlive = true;
          this.tabs = tabs;
          this.cacheIfNeed();
        }
      }
      return Promise.resolve({ tabs })
    },
    /** 关闭一个tab */
    removeOneTab(tab: Tab) {
      // 如果是固定不可关闭的tab，则不关闭
      if (tab.affix) return Promise.resolve({})

      const tabs = cloneDeep(this.tabs)
      // 从tabs中查询传入的tab，获取该tab的索引值
      const index = tabs.findIndex((i: Tab) => i.path === tab.path)

      // 如果索引值不为-1，则删除该tab
      if (~index) {
        tabs.splice(index, 1) // 删除索引值为index的tab
        this.tabs = tabs
        this.cacheIfNeed()
      }
      return Promise.resolve({ tabs })
    },
    /** 关闭其它tab */
    removeOtherTabs(tab: Tab) {
      // 筛选出固定不可关闭的tab
      const affixTab = this.tabs.filter(i => i.affix)
      // 添加当前tab
      const newTabs = affixTab.concat(tab)

      // 去重后赋值给tabs
      this.tabs = [...new Set(newTabs).values()]
      this.cacheIfNeed()

      const tabs = cloneDeep(this.tabs)
      return Promise.resolve({ tabs })
    },
    /** 关闭指定tabs */
    removeListTabs(list: Tab[]) {
      // 筛选出非固定不可关闭的tab
      const pathList = list.filter(i => !i.affix).map(i => i.path) || []

      // 如果有可以关闭的tab，则关闭
      if (pathList.length) {
        this.tabs = this.tabs.filter(i => !pathList.includes(i.path))
        this.cacheIfNeed()
      }

      const tabs = cloneDeep(this.tabs)
      return Promise.resolve({ tabs })
    },
    /** 关闭所有tab */
    removeAllTabs() {
      // 筛选出固定不可关闭的tab
      const affixTab = this.tabs.filter(i => i.affix)
      // 赋值给tabs
      this.tabs = affixTab
      this.cacheIfNeed()

      const tabs = cloneDeep(this.tabs)
      return Promise.resolve({ tabs })
    },
  },
})

// 确保传递正确的 store 声明
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTabStore, import.meta.hot))
}
