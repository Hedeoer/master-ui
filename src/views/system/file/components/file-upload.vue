<script setup lang="ts">
import type { UploadFile, UploadFiles } from 'element-plus'
import type { SysFileUploadParam } from '~/types/system/file'
import { API_BASE_URL } from '~/config/setting'
import { getToken } from '~/utils/token'

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

// 最大文件大小
const maxFileSize = 1024 * 1024 * 100
// 上传地址
const uploadUrl = `${API_BASE_URL}${UploadUrl}`

const uploadRef = ref()
const refForm = ref()
// 表单数据
const baseFormData = {
  bizType: '',
  file: undefined,
}
const form = reactive<SysFileUploadParam>({ ...baseFormData })

// 文件上传组件请求头
const headers = computed(() => {
  const token = getToken()
  if (!token) return {}
  const headers: Record<string, string> = {}
  headers[token.tokenName] = token.token
  return headers
})

/** 上传前检查 */
function beforeUpload(file: any) {
  let isOver = true
  if (file.size > maxFileSize) {
    isOver = false
    toastError('文件大小不能超过100MB')
  }
  return isOver
}

/** 上传成功回调 */
function handleUploadSuccess(response: any, _file: UploadFile, _files: UploadFiles) {
  const { success, message } = response
  if (!success) {
    toastError(message || '上传失败')
    return
  }
  toastSuccess(message || '上传成功')
  emit('done')
  handleClose()
}

/** 关闭弹窗 */
function handleClose() {
  // 关闭弹窗
  show.value = false

  // 重置表单数据，并移除校验结果
  refForm.value?.resetFields()
}

/**
 * 表单提交
 */
function handleSubmit() {
  uploadRef?.value.submit()
}
</script>

<template>
  <el-dialog
    v-model="show"
    width="500px"
    title="上传文件"
    draggable
    destroy-on-close
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    @before-close="handleClose"
  >
    <template #footer>
      <el-space>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">上传</el-button>
      </el-space>
    </template>

    <el-form ref="refForm" :model="form" label-position="top" label-width="100px">
      <el-form-item prop="bizType">
        <template #label>
          业务类型
          <el-tooltip content="例如：order、user_avatar等 会影响文件url的值">
            <el-icon><i-ep-info-filled /></el-icon>
          </el-tooltip>
        </template>

        <el-input v-model="form.bizType" placeholder="请填写" clearable />
      </el-form-item>

      <el-form-item prop="file" label="文件" required>
        <!-- 关闭自动上传，用户选中的文件会赋值给表单的form.file字段 -->
        <el-upload
          ref="uploadRef"
          :action="uploadUrl"
          :headers="headers"
          :data="{ bizType: form.bizType }"
          :auto-upload="false"
          :before-upload="beforeUpload"
          :on-success="handleUploadSuccess"
          :limit="1"
          drag
          style="width: 100%;"
        >
          <el-icon class="el-icon--upload"><i-ep-upload-filled /></el-icon>
          <div class="el-upload__text">
            点击选择文件，或将文件<em>拖拽到此处</em>
          </div>
        </el-upload>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<style scoped>
:deep(.el-form-item__label) {
  display: flex;
  align-items: center;
  justify-content: start;
}
</style>
