<script setup lang="ts">
import type { RouteLocationMatched } from 'vue-router'
import type { Tab } from '~/types/theme'

const route = useRoute()
const data = ref<Tab[]>([])

/** 获取面包屑数据 */
function getBreadCrumbs() {
  const matched = route.matched.filter((i: RouteLocationMatched) => i.meta && i.meta.title)
  if (!matched.length) return

  data.value = matched.map((i) => {
    let path = i.path

    // 说明：很多有子路由的父级路由，没有对应的view页面，点击跳转会跳转到空白页面，所以需要处理一下
    if (i.children.length) {
      // 如果有子路由, 取父路由的重定向路径，没有也没关系
      path = i.redirect as string || ''
    }

    return {
      title: i.meta.title,
      name: i.name,
      path,
    } as Tab
  })
}
getBreadCrumbs()

watch(
  () => route.path,
  (path) => {
    if (!path.startsWith('/redirect/')) {
      getBreadCrumbs()
    }
  },
)
</script>

<template>
  <div v-if="data.length">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="{ title, path } of data" :key="title">
        <router-link :to="path">
          {{ title }}
        </router-link>
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>
