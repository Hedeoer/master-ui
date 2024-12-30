<script setup lang="ts">
import type { SelectOption } from '~/types/extra/select'
import type { JobQueryParam } from '~/types/job/job'

defineProps<{
  /** 任务执行类下拉框数据 */
  jobClassOptions?: SelectOption[]
}>()

const emit = defineEmits<{
  (e: 'onSearch', formModel: JobQueryParam): void
}>()

const searchFormRef = ref()
const formModel = reactive<JobQueryParam>({
  jobName: undefined,
  jobDescription: undefined,
  triggerState: undefined,
  triggerType: undefined,
  jobClassName: undefined,
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
              <el-form-item label="触发器状态" prop="triggerState">
                <el-select v-model="formModel.triggerState" placeholder="请选择" clearable>
                  <el-option value="WAITING,ACQUIRED,EXECUTING" label="运行" />
                  <el-option value="PAUSED,PAUSED_BLOCKED" label="暂停" />
                  <el-option value="COMPLETE" label="完成" />
                  <el-option value="ERROR" label="出错" />
                  <el-option value="BLOCKED" label="阻塞" />
                  <el-option value="DELETED" label="无效" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="触发器类型" prop="triggerType">
                <el-select v-model="formModel.triggerType" placeholder="请选择" clearable>
                  <el-option value="CRON" label="CRON" />
                  <el-option value="CAL_INT" label="CAL_INT" />
                  <el-option value="DAILY_I" label="DAILY_I" />
                  <el-option value="SIMPLE" label="SIMPLE" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="任务执行类" prop="jobClassName">
                <el-select v-model="formModel.jobClassName" placeholder="请选择" clearable>
                  <template v-for="jobClass in jobClassOptions" :key="jobClass.value">
                    <el-option :value="jobClass.value" :label="jobClass.label" />
                  </template>
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="任务名" prop="jobName">
                <el-input v-model="formModel.jobName" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="任务描述" prop="jobDescription">
                <el-input v-model="formModel.jobDescription" placeholder="请填写" clearable />
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

<style scoped>
.el-form-item {
  margin-right: 32px;
}
</style>
