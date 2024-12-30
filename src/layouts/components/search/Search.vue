<script setup lang="ts">
import SearchModal from './SearchModal.vue'

const { bool: show, toggle } = useBool()
</script>

<template>
  <div>
    <el-tooltip content="菜单搜索" position="bottom">
      <el-icon @click="toggle"><i-ep-search /></el-icon>
    </el-tooltip>

    <SearchModal v-model:value="show" />
  </div>
</template>
