<script setup lang="ts">
import type { SysFile } from '~/types/system/file'

const emit = defineEmits<{
  (e: 'onSearch', formModel: SysFile): void
}>()

const searchFormRef = ref()
const formModel = reactive<SysFile>({
  bizType: '',
  bucket: '',
  uniqueFileName: '',
})
defineExpose({ formModel })

/** 表单搜索事件 */
function search() {
  return emit('onSearch', formModel)
}

/** 表单重置事件 */
function reset() {
  searchFormRef.value.resetFields()
}
</script>

<template>
  <div class="z-search-layout">
    <el-row :gutter="8">
      <el-col :md="20" :sm="20" :xs="24">
        <el-form ref="searchFormRef" :model="formModel" label-width="100px">
          <el-row>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="业务类型" prop="bizType">
                <el-input v-model="formModel.bizType" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="桶" prop="bucket">
                <el-input v-model="formModel.bucket" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="文件名称" prop="uniqueFileName">
                <el-input v-model="formModel.uniqueFileName" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-col>
      <el-col :md="4" :sm="4" :xs="24" class="z-text-center">
        <el-space direction="horizontal" wrap>
          <el-button type="primary" @click="search">
            <el-icon><i-ep-search /></el-icon> 查询
          </el-button>
          <el-button @click="reset">
            <el-icon><i-ep-refresh-right /></el-icon> 重置
          </el-button>
        </el-space>
      </el-col>
    </el-row>
  </div>
</template>
