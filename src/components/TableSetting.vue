<script setup lang="ts">
import { ref, defineEmits, defineProps, watch } from 'vue';
import { ElButton, ElPopover, ElSelect, ElOption } from 'element-plus';
import { RefreshRight } from '@element-plus/icons-vue';

const props = defineProps({
  refreshRate: {
    type: String,
    default: '不刷新'
  }
});

const emit = defineEmits(['update:refreshRate']);

// 创建本地响应式变量
const localRefreshRate = ref(props.refreshRate);

// 监听prop变化，更新本地变量
watch(() => props.refreshRate, (newVal) => {
  localRefreshRate.value = newVal;
});

// 监听本地变量变化，通知父组件
watch(localRefreshRate, (newVal) => {
  emit('update:refreshRate', newVal);
});

// 刷新频率选项
const refreshRates = [
  { label: '不刷新', value: '不刷新' },
  { label: '5 秒/次', value: '5' },
  { label: '10 秒/次', value: '10' },
  { label: '30 秒/次', value: '30' },
  { label: '60 秒/次', value: '60' },
  { label: '120 秒/次', value: '120' },
  { label: '300 秒/次', value: '300' }
];
</script>

<template>
  <div class="refresh-setting">
    <el-popover placement="bottom" :width="200" trigger="click">
      <template #reference>
        <el-button>
          刷新频率
          <el-icon class="ml-1"><RefreshRight /></el-icon>
        </el-button>
      </template>
      <div class="refresh-options">
        <el-select v-model="localRefreshRate" style="width: 100%">
          <el-option
            v-for="item in refreshRates"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </div>
    </el-popover>
  </div>
</template>

<style scoped>
.refresh-setting {
  margin-left: 8px;
}
.refresh-options {
  padding: 10px 0;
}
.ml-1 {
  margin-left: 4px;
}
</style> 