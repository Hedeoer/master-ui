<script lang="ts" setup>
import type { Tab } from '~/types/theme'

const route = useRoute()
const router = useRouter()
const themeStore = useThemeStore()
const tabStore = useTabStore()
tabStore.createTabs()

const tabs = computed(() => tabStore.tabs)

const currentPath = ref(route.path)

// 上一个打开的下拉菜单
const lastOpenDropdown = ref<string>()
// 存储所有下拉菜单的ref
const tabDropdownRefs = ref<Record<string, any>>({})

/** 动态添加、减少下拉菜单的ref */
function setDropdownRef(name: string, el: any) {
  if (el) {
    tabDropdownRefs.value[name] = el
  } else {
    delete tabDropdownRefs.value[name]
  }
}

/** 添加tab */
function addTab() {
  // 解构当前路由，判断是否是hide隐藏路由，如果是，则不添加tab
  const { name, path, meta: { title, hide, icon, keepAlive, affix } } = route
  if (hide) return

  // 判断title和path是否为空，如果为空则不添加tab
  if ([title, path].some(i => !i)) return
  tabStore.addTab({
    path,
    name,
    icon,
    title,
    keepAlive,
    affix,
  } as Tab)
}
addTab()
watch(() => route.path, (path) => {
  addTab()
  currentPath.value = path
})

/**
 * change事件处理
 * @param id 路由path
 */
function handleChange(id: string) {
  router.push(id)
}

/**
 * close事件处理
 * @param id 路由path
 */
function handleClose(id: string) {
  if (tabs.value.length === 1) {
    toastWarn('已经是最后一个标签了')
    return
  }

  // 找到当前tab对象
  const currentTab = tabs.value.find(i => i.path === id) as unknown as Tab
  if (!currentTab) return

  // 删除tab的下拉菜单
  setDropdownRef(id, null)

  // 删除tab
  tabStore
    .removeOneTab(currentTab)
    .then(() => {
      if (currentTab.path === route.path) {
        // 找到最后一个
        const latest = tabs.value.slice(-1)[0]
        router.push(latest?.path ?? '/')
      }
    })
}

/** 关闭左边 */
function closeLeft(idx?: number) {
  const index = idx || tabs.value.findIndex(i => i.name === route.name) as number
  // 左边是否有tab
  const hasLeftTabs = tabs.value.length > 1 && index > 0
  // 当前tab对象
  const currentTab = tabs.value[index]
  // 如果当前tab不存在，或者左边没有tab，则不处理
  if (!currentTab || !hasLeftTabs) return

  // 删除左边的tab。
  tabStore
    .removeListTabs(tabs.value.slice(0, index))
    .then(() => router.push(currentTab.path))
}

/** 关闭右边 */
function closeRight(idx?: number) {
  const index = idx || tabs.value.findIndex(i => i.name === route.name) as number
  const hasRightTabs = tabs.value.length > 1 && index < tabs.value.length - 1
  const currentTab = tabs.value[index]
  if (!currentTab || !hasRightTabs) return
  tabStore
    .removeListTabs(tabs.value.slice(index + 1))
    .then(() => router.push(currentTab.path))
}

/** 关闭当前 */
function closeCurrent(tab?: Tab) {
  if (tabs.value.length === 1) {
    toastWarn('已经是最后一个标签了')
    return
  }
  const currentTab = tab || tabs.value.find(i => i.name === route.name) as unknown as Tab
  if (!currentTab) return
  tabStore
    .removeOneTab(currentTab)
    .then(() => {
      if (currentTab.path === route.path) {
        // 找到最后一个
        const latest = tabs.value.slice(-1)[0]
        router.push(latest?.path ?? '/')
      }
    })
}

/** 关闭其它 */
function closeOther(tab?: Tab) {
  const currentTab = tab || tabs.value.find(i => i.name === route.name) as unknown as Tab
  if (!currentTab) return
  tabStore
    .removeOtherTabs(currentTab)
    .then(() => router.push(currentTab.path))
}

/** tabDropdown显示、隐藏事件 */
function tabDropdownVisibleChange(name: string, val: boolean) {
  if (!val) {
    return
  }
  if (lastOpenDropdown.value !== undefined) {
    // 关闭上一个dropdown
    tabDropdownRefs.value[lastOpenDropdown.value]?.handleClose()
  }
  // 打开当前dropdown
  tabDropdownRefs.value[name]?.handleOpen()

  // 更新上一次打开的下拉菜单
  lastOpenDropdown.value = name
}
</script>

<template>
  <div class="the-tab" :class="themeStore.settings.tabTheme" @contextmenu.prevent>
    <el-tabs
      v-model:="currentPath"
      @tab-change="(name: any) => handleChange(name as string)"
      @tab-remove="(name: any) => handleClose(name as string)"
    >
      <el-tab-pane v-for="tab, index in tabs" :key="index" :name="tab.path" :closable="!tab.affix">
        <template #label>
          <el-dropdown
            :ref="(el: any) => setDropdownRef(tab.path, el)"
            trigger="contextmenu"
            :popper-options="{
              modifiers: [
                {
                  name: 'offset',
                  options: {
                    offset: [0, 0],
                  },
                },
              ],
            }"
            @visible-change="(val: boolean) => tabDropdownVisibleChange(tab.path, val)"
          >
            <div style="height: var(--layout-tab-height); line-height: var(--layout-tab-height); display: inline-block;">
              <span class="dot" />
              {{ tab.title }}
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="closeLeft(index)">
                  <el-icon><i-mdi-arrow-left /></el-icon>
                  关闭左边
                </el-dropdown-item>
                <el-dropdown-item @click="closeRight(index)">
                  <el-icon><i-mdi-arrow-right /></el-icon>
                  关闭右边
                </el-dropdown-item>
                <el-dropdown-item @click="closeOther(tab)">
                  <el-icon><i-mdi-arrow-left-right /></el-icon>
                  关闭其他
                </el-dropdown-item>
                <el-dropdown-item divided @click="closeCurrent(tab)">
                  <el-icon><i-mdi-close /></el-icon>
                  关闭当前
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-tab-pane>
    </el-tabs>

    <el-dropdown
      :trigger="['click', 'contextmenu']" class="customDropdown" :popper-options="{
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 0],
            },
          },
        ],
      }"
    >
      <div>
        <el-icon :class="themeStore.settings.tabTheme === 'designer' ? 'designer-last-icon' : ''">
          <i-ep-arrow-down />
        </el-icon>
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="closeLeft()">
            <el-icon><i-mdi-arrow-left /></el-icon>
            关闭左边
          </el-dropdown-item>
          <el-dropdown-item @click="closeRight()">
            <el-icon><i-mdi-arrow-right /></el-icon>
            关闭右边
          </el-dropdown-item>
          <el-dropdown-item @click="closeOther()">
            <el-icon><i-mdi-arrow-left-right /></el-icon>
            关闭其他
          </el-dropdown-item>
          <el-dropdown-item @click="closeCurrent()">
            <el-icon><i-mdi-close /></el-icon>
            关闭当前
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.the-tab .el-icon {
  width: 40px;
  height: var(--layout-tab-height);
  line-height: var(--layout-tab-height);
  text-align: center;
}

.dark .the-tab .el-icon {
  border: 1px solid var(--el-border-color-light);
}

/** 下拉菜单距离顶部偏移 */
:deep(.el-dropdown__popper) {
  top: 94px!important;
}
</style>
