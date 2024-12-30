<script setup lang="ts">
import type { Meta, RouteItem } from '~/types/router'
import { Icon } from '@iconify/vue'

defineProps<{
  menuOptions: RouteItem[]
}>()

const router = useRouter()

/** 点击菜单 */
function clickMenuItem(path: string, meta?: Meta) {
  // 判断是否有外链地址，如果有则打开外链，否则路由跳转
  meta?.href ? useOpenWindow(meta?.href) : router.push(path)
}
</script>

<template>
  <template v-for="{ name, path, meta, children } of menuOptions" :key="name">
    <!-- 如果有子菜单 -->
    <template v-if="children?.length">
      <el-sub-menu v-if="!(meta?.hide)" :index="name" teleported>
        <template #title>
          <el-icon v-if="meta?.icon">
            <Icon :icon="meta.icon" />
          </el-icon>
          <span>{{ meta?.title }}</span>
        </template>

        <MenuItem :menu-options="children" />
      </el-sub-menu>
    </template>

    <!-- 如果没有子菜单 -->
    <template v-else>
      <el-menu-item v-if="!(meta?.hide)" :index="name" @click="clickMenuItem(path, meta)">
        <el-icon v-if="meta?.icon">
          <Icon :icon="meta.icon" />
        </el-icon>
        <template #title>
          <span>{{ meta?.title }}</span>
        </template>
      </el-menu-item>
    </template>
  </template>
</template>
