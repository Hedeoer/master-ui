<script setup lang="ts">
import pkg from '@/package.json'
import { COPY_RIGHT } from '~/config/setting'
import { ABOUT_ROUTE } from '~/types/router'

const router = useRouter()
</script>

<template>
  <div class="the-footer z-user-select-none">
    <div>{{ COPY_RIGHT }}</div>
    <div>当前版本：<el-link type="primary" @click="router.push(ABOUT_ROUTE)">v{{ pkg.version }}</el-link></div>
  </div>
</template>
