<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { SysRole, SysRoleSaveParam, SysRoleUpdateParam } from '~/types/system/role'
import { cloneDeep } from '@pureadmin/utils'

const props = withDefaults(defineProps<{
  visible: boolean
  /** 修改时必传，角色基本数据 */
  data?: SysRole
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

// 设置为false,代表输入时不进行表单校验，只有提交时才进行表单校验
const validateEvent = ref<boolean>(false)

const refForm = ref()
// 是否修改弹窗
const isUpdate = ref(false)
// 表单数据
const baseFormData = {
  id: undefined,
  name: '',
  code: '',
  describe: '',
}
const form = reactive<SysRole>({ ...baseFormData })
// 表单校验规则
const rules = ref<FormRules<SysRole>>({
  name: { type: 'string', required: true, message: '角色名不能为空' },
  code: { type: 'string', required: true, message: '角色编码不能为空' },
})

/** 初始化表单数据 */
function initData() {
  if (props.data) {
    Object.assign(form, props.data)
    isUpdate.value = true
  } else {
    Object.assign(form, baseFormData)
    isUpdate.value = false
  }
}

/** 关闭弹窗 */
function handleClose() {
  // 关闭弹窗
  show.value = false

  // 重置表单数据，并移除校验结果
  refForm.value?.resetFields()
}

/** 保存数据 */
async function saveData(model: SysRole, close: () => void) {
  try {
    // 新增用户
    const { success, message } = await addRoleApi({
      ...model as SysRoleSaveParam,
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭loading
    close()
    // 关闭弹窗
    handleClose()
  } catch (e) {
    close()
    notifyError((e as Error).message, '错误')
  }
}

/** 修改数据 */
async function updateData(model: SysRole, close: () => void) {
  try {
    // 修改用户数据
    const { success, message } = await updateRoleApi({
      ...model as SysRoleUpdateParam,
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭loading
    close()
    // 关闭弹窗
    handleClose()
  } catch (e) {
    close()
    notifyError((e as Error).message, '错误')
  }
}

/** 表单提交 */
function handleSubmit() {
  refForm.value.validate((isValidate: boolean, _errors: any) => {
    if (!isValidate) return
    const model = cloneDeep(form)

    loadingMsg('正在提交数据...', async (close) => {
      isUpdate.value
        ? await updateData(model, close)
        : await saveData(model, close)
      emit('done')
    })
  })
}

watch(
  () => props.visible,
  (visible: boolean) => {
    if (visible) {
      // 初始化弹窗数据
      initData()
    }
  },
)
</script>

<template>
  <el-dialog
    v-model="show"
    width="500px"
    :title="isUpdate ? '编辑' : '新增'"
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

    <el-form ref="refForm" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="角色名" prop="account">
        <el-input v-model="form.name" placeholder="请填写" clearable :validate-event="validateEvent" />
      </el-form-item>
      <el-form-item label="角色编码" prop="code">
        <el-input v-model="form.code" placeholder="请填写" clearable :validate-event="validateEvent" />
      </el-form-item>
      <el-form-item label="描述" prop="describe">
        <el-input v-model="form.describe" type="textarea" resize="none" placeholder="请填写" clearable :validate-event="validateEvent" />
      </el-form-item>
    </el-form>
  </el-dialog>
</template>
