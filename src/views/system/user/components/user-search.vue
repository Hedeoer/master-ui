<script setup lang="ts">
import type { SysUser } from '~/types/system/user'

const emit = defineEmits<{
  (e: 'onSearch', formModel: SysUser): void
}>()

const searchFormRef = ref()
const formModel = reactive<SysUser>({
  username: '',
  account: '',
  sex: undefined,
  email: '',
  mobile: '',
  state: undefined,
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
              <el-form-item label="用户名" prop="username">
                <el-input v-model="formModel.username" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="账号" prop="account">
                <el-input v-model="formModel.account" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="性别" prop="sex">
                <el-select v-model="formModel.sex" placeholder="请选择" clearable style="width: 100%">
                  <el-option value="0" label="未知" />
                  <el-option value="1" label="男" />
                  <el-option value="2" label="女" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="邮箱" prop="email">
                <el-input v-model="formModel.email" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="手机号" prop="mobile">
                <el-input v-model="formModel.mobile" placeholder="请填写" clearable />
              </el-form-item>
            </el-col>
            <el-col :md="8" :sm="12" :xs="24">
              <el-form-item label="状态" prop="state">
                <el-select v-model="formModel.state" placeholder="请选择" clearable style="width: 100%">
                  <el-option value="0" label="停用" />
                  <el-option value="1" label="启用" />
                </el-select>
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
