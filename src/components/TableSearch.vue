<script setup lang="ts">
import { ref, defineEmits, defineProps } from 'vue';
import { ElInput } from 'element-plus';
import { Search } from '@element-plus/icons-vue';

const props = defineProps({
  searchName: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['update:searchName', 'search']);

const handleSearch = () => {
  emit('search');
}

const updateSearchName = (val: string) => {
  emit('update:searchName', val);
}
</script>

<template>
  <div class="table-search">
    <el-input
      :modelValue="searchName" 
      @update:modelValue="updateSearchName"
      placeholder="搜索..."
      clearable
      @keyup.enter="handleSearch"
      @clear="handleSearch"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
  </div>
</template>

<style scoped>
.table-search {
  width: 200px;
}
</style> 