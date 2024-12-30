<script setup lang="ts">
import type { UserMenu } from '~/types/login'
import type { RouteItem } from '~/types/router'
import MenuItem from './MenuItem.vue'

const route = useRoute()
const themeStore = useThemeStore()
const userStore = useUserStore()

/** 生成菜单 */
function generateMenuOption(userMenu: UserMenu): RouteItem {
  const { name, path, meta, children } = userMenu
  return {
    name,
    path,
    meta,
    children: children?.map((child: UserMenu) => generateMenuOption(child)),
  }
}
/** 计算菜单选项 */
const menuOptions = computed<RouteItem[]>(() => (
  userStore.menus.map(i => generateMenuOption(i))
))

/** 计算展开的菜单 */
function calcuOpenKey() {
  const data = route.matched
    .filter(item => item.children.length > 0)
    .map(item => item.name as string)
  return data
}
// 展开的菜单
const openKey = ref<string[]>(calcuOpenKey())
// 选中的菜单
const selectedKey = ref<string>(route.name as string)

/** 计算是否手风琴模式 */
const accordion = computed(() => themeStore.settings.accordion)

/** 计算当前展开的菜单 */
function computedOpenKey() {
  if (accordion.value) {
    // 如果开启手风琴，计算当前路由可以展开的菜单
    // eg: old = ["系统管理", "测试菜单"]， route.name = ["多级菜单一"]，  new = ["多级菜单", "多级菜单一"]
    // eg: old = ["多级菜单", "多级菜单一"]， route.name = ["多级菜单一"]，  new = ["多级菜单", "多级菜单一"]
    openKey.value = calcuOpenKey()
  } else {
    // 如果不开启手风琴，添加当前路由可以展开的菜单
    // eg: old = ["系统管理", "测试菜单"]， route.name = ["多级菜单一"]，  new = ["系统管理", "测试菜单", "多级菜单", "多级菜单一"]
    // eg: old = ["多级菜单", "多级菜单一"]， route.name = ["多级菜单一"]，  new = ["多级菜单", "多级菜单一"]
    openKey.value = [...new Set(openKey.value.concat(calcuOpenKey()))]
  }
}

// 监听路由变化
watch(
  () => route.path,
  () => {
    // 计算当前展开的菜单
    computedOpenKey()
    // 计算选中的菜单
    selectedKey.value = route.name as string
  },
)
</script>

<template>
  <el-menu
    :default-openeds="openKey"
    :default-active="selectedKey"
    :collapse="themeStore.collapseSide"
    :unique-opened="accordion"
    :collapse-transition="false"
  >
    <MenuItem :menu-options="menuOptions" />
  </el-menu>
</template>

<style scoped>
/** 修改菜单展开、收缩动画。 解决卡顿问题 */
:deep(.el-aside) {
  transition: width 0.3s;
}
</style>
