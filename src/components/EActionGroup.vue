<!--
用法：
<e-action-group size="small" placement="bottom">
  <el-button>编辑</el-button>
  <el-button>删除</el-button>

  <template #dropdown>
    <div>导入</div> <-必须用div包裹
    <div>导出</div>
  </template>
</e-action-group>
-->
<script setup lang="ts">
import { MoreFilled } from '@element-plus/icons-vue'

withDefaults(defineProps<{
  /** 按钮尺寸 */
  size?: 'large' | 'default' | 'small'
  /** 菜单弹出位置 */
  placement?: string
}>(), {
  size: 'default',
  placement: 'bottom-start',
})
</script>

<template>
  <div>
    <el-space wrap :size="8">
      <slot />

      <el-popover popper-class="e-action-popover" :placement="placement" :offset="3" :hide-after="0" :width="'auto'" trigger="click">
        <template #reference>
          <el-button :icon="MoreFilled" :size="size" />
        </template>
        <div class="dropdown">
          <slot name="dropdown" />
        </div>
      </el-popover>
    </el-space>
  </div>
</template>
