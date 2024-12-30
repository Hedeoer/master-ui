<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import type { ChangePasswordParam } from '~/types/system/user'
import { cloneDeep } from '@pureadmin/utils'

const props = withDefaults(defineProps<{
  visible: boolean
}>(), {
  visible: false,
})

const emit = defineEmits<{
  (e: 'done'): void
  (e: 'update:visible', visible: boolean): void
}>()

const show = computed({
  get() {
    return props.visible
  },
  set(val: boolean) {
    emit('update:visible', val)
  },
})

const refForm = ref<FormInstance>()
// 设置为false,代表输入时不进行表单校验，只有提交时才进行表单校验
const validateEvent = ref<boolean>(false)

// 表单数据
const baseFormData = {
  oldPwd: '',
  newPwd: '',
  confirmPwd: '',
}
const form = reactive<ChangePasswordParam>({ ...baseFormData })
// 表单校验规则
const rules = reactive<FormRules<ChangePasswordParam>>({
  oldPwd: [
    { type: 'string', required: true, message: '旧密码不能为空' },
    { type: 'string', min: 6, max: 10, message: '密码长度6-10' },
  ],
  newPwd: [
    { type: 'string', required: true, message: '新密码不能为空' },
    { type: 'string', min: 6, max: 10, message: '密码长度6-10' },
  ],
  confirmPwd: {
    type: 'string',
    required: true,
    message: '两次输入的密码不一致',
    validator: (_rule: any, value: string) => {
      return value === form.newPwd
    },
  },
})

/** 关闭弹窗 */
function handleClose() {
  // 关闭弹窗
  show.value = false

  // 重置表单数据，并移除校验结果
  refForm.value?.resetFields()
}

/**
 * 表单提交
 * 说明：
 * 修改密码成功后，后端会自动注销登录
 * 此时请求其它接口，会提示未登录并重定向到登录页面
 * 所以这里不需要调用注销登录接口
 */
function handleSubmit() {
  refForm.value?.validate((isValidate: boolean, _errors: any) => {
    if (!isValidate) return

    loadingMsg('正在提交数据...', async (close) => {
      // 修改自己的密码
      const { success, message } = await changeUserPasswordApi(cloneDeep(form))
      if (!success) {
        close()
        toastError(message || '操作失败')
        return
      }

      // 关闭弹窗
      handleClose()
      // 关闭loading
      close()
      // 发射done事件
      emit('done')
    })
  })
}
</script>

<template>
  <el-dialog
    v-model="show"
    width="420px"
    title="修改密码"
    draggable
    destroy-on-close
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    @before-close="handleClose"
  >
    <template #footer>
      <el-space>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </el-space>
    </template>

    <el-form ref="refForm" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="旧密码" prop="oldPwd" required>
        <el-input v-model="form.oldPwd" type="password" placeholder="请填写" clearable show-password :validate-event="validateEvent" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPwd" required>
        <el-input v-model="form.newPwd" type="password" placeholder="请填写" clearable show-password :validate-event="validateEvent" />
      </el-form-item>
      <el-form-item label="确认密码" prop="confirmPwd" required>
        <el-input v-model="form.confirmPwd" type="password" placeholder="请填写" clearable show-password :validate-event="validateEvent" />
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
