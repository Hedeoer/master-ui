<script setup lang="ts">
import type { SchemaItem } from './interface'

withDefaults(defineProps<{
  /** 表格项 */
  schemaItem: SchemaItem[]
  /** 总列数 */
  column?: number
}>(), {
  column: 2,
})
</script>

<template>
  <el-descriptions :column="column" border>
    <el-descriptions-item v-for="(info, index) in schemaItem" :key="index">
      <template #label>
        <div class="cell-item">
          {{ info.label }}
        </div>
      </template>
      <span v-html="info.value" />
    </el-descriptions-item>
  </el-descriptions>
</template>

<style scoped>
.cell-item {
  display: flex;
  align-items: center;
}
</style>
