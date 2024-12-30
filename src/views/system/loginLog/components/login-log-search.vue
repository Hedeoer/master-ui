<script setup lang="ts">
import type { SelectOption } from '~/types/extra/select'
import type { SysLoginLog } from '~/types/system/loginLog'

defineProps<{
  /** 状态下拉框数据 */
  stateOptions: SelectOption[]
}>()

const emit = defineEmits<{
  (e: 'onSearch', formModel: SysLoginLog): void
}>()

const searchFormRef = ref()
const formModel = reactive<SysLoginLog>({
  account: '',
  state: undefined,
  os: '',
  browser: '',
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
      <el-col :md="22" :sm="20" :xs="24">
        <el-form ref="searchFormRef" :model="formModel" label-width="100px">
          <el-row>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="状态" prop="state">
                <el-select v-model="formModel.state" placeholder="请选择" clearable style="width: 100%">
                  <template v-for="state in stateOptions" :key="state.value">
                    <el-option :value="state.value" :label="state.label" />
                  </template>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="账号" prop="account">
                <el-input v-model="formModel.account" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="操作系统" prop="os">
                <el-input v-model="formModel.os" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="浏览器类型" prop="browser">
                <el-input v-model="formModel.browser" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </el-col>
      <el-col :md="2" :sm="4" :xs="24" class="z-text-center">
        <el-space :direction="isSmallerMd ? 'horizontal' : 'vertical'" wrap size="large">
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
