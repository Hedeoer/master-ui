<script setup lang="ts">
import type { SelectOption } from '~/types/extra/select'
import type { SysOptLog } from '~/types/system/optLog'

defineProps<{
  /** 操作类型选项 */
  typeOptions: SelectOption[]
}>()
const emit = defineEmits<{
  (e: 'onSearch', formModel: SysOptLog): void
}>()

const searchFormRef = ref()
const formModel = reactive<SysOptLog>({
  type: undefined,
  description: '',
  httpMethod: '',
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
        <el-form ref="searchFormRef" :model="formModel" label-width="100px" >
          <el-row>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="操作类型" prop="type">
                <el-select v-model="formModel.type" placeholder="请选择" clearable style="width: 100%">
                  <template v-for="option in typeOptions" :key="option.value">
                    <el-option :value="option.value" :label="option.label" />
                  </template>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="操作描述" prop="description">
                <el-input v-model="formModel.description" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="请求方式" prop="httpMethod">
                <el-select v-model="formModel.httpMethod" placeholder="请选择" clearable style="width: 100%">
                  <el-option value="GET" label="GET" />
                  <el-option value="POST" label="POST" />
                  <el-option value="PUT" label="PUT" />
                  <el-option value="DELETE" label="DELETE" />
                </el-select>
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
