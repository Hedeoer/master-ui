<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { SelectOption } from '~/types/extra/select'
import type { ExistParam } from '~/types/global'
import type { SysRole } from '~/types/system/role'
import type { SysUser, SysUserSaveParam, SysUserUpdateParam } from '~/types/system/user'
import { Iphone, Message } from '@element-plus/icons-vue'
import { cloneDeep } from '@pureadmin/utils'

const props = withDefaults(defineProps<{
  visible: boolean
  /** 修改时必传，用户基本数据 */
  data?: SysUser
}>(), {
  visible: false
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
  account: '',
  email: undefined,
  mobile: undefined,
  username: '',
  password: '',
  roles: [],
  sex: 1,
  state: 1,
  birthday: '',
}
const form = reactive<SysUser>({ ...baseFormData })
// 表单校验规则
const rules = ref<FormRules<SysUser>>({
  account: [
    { type: 'string', required: true, message: '账号不能为空' },
    { type: 'string', min: 6, max: 64, message: '账号长度6-64' },
    {
      // TODO: 问题1：需要防抖，不然的话请求太频繁了。
      asyncValidator: async (_rule: any, value: string) => {
        // 如果值为空，不触发校验
        if (!value) return Promise.resolve()
        // 如果是修改，不触发校验 ps：账号不允许修改
        if (form.id) return Promise.resolve()

        try {
          // 校验是否存在
          const { message, data } = await existenceUserApi({
            field: 'account',
            value,
          } as ExistParam<string>)
          return data
            ? Promise.reject(message)
            : Promise.resolve()
        } catch (e) {
          Promise.reject((e as Error).message)
        }
      },
    },
  ],
  username: [
    { type: 'string', required: true, message: '用户名不能为空' },
    { type: 'string', min: 6, max: 64, message: '用户名长度6-64' },
  ],
  email: { type: 'email' },
  sex: { type: 'number', required: true, message: '性别不能为空' },
})
// 角色列表数据
const roleOptions = ref<SelectOption[]>()
// 用户的角色列表
const roles = ref<string[]>()

/** 获取角色列表 */
async function getRoleOptions() {
  try {
    const { success, message, data } = await queryRoleApi()
    if (!success) {
      toastError(message || '获取角色失败')
      return
    }

    // 回显
    roleOptions.value = data!.map((role: SysRole) => ({
      label: role.name!,
      value: role.id!,
    }))
  } catch (err) {
    notifyError((err as Error).message, '错误')
  }
}

/** 初始化表单数据 */
function initData() {
  if (props.data) {
    Object.assign(form, props.data)
    isUpdate.value = true
    if (form.roles) {
      roles.value = form.roles.map((role: SysRole) => role.id!)
    }
  } else {
    Object.assign(form, baseFormData)
    isUpdate.value = false
  }
}

/** 关闭弹窗 */
function handleClose() {
  // 清空选中的角色
  roles.value = []
  // 关闭弹窗
  show.value = false

  // 重置表单数据，并移除校验结果
  refForm.value?.resetFields()
}

/** 保存数据 */
async function saveData(model: SysUser, close: () => void) {
  try {
    // 新增用户
    const { success, message } = await addUserApi({
      ...model as SysUserSaveParam,
      ...{ roleIds: roles.value },
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭弹窗
    handleClose()
    // 关闭loading
    close()
  } catch (e) {
    close()
    notifyError((e as Error).message, '错误')
  }
}

/** 修改数据 */
async function updateData(model: SysUser, close: () => void) {
  try {
    // 删除不允许修改的字段
    delete model.roles
    delete model.password
    delete model.account
    delete model.mobile
    delete model.email
    // 修改用户数据
    const { success, message } = await updateUserApi({
      ...model as SysUserUpdateParam,
      ...{ roleIds: roles.value },
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭弹窗
    handleClose()
    // 关闭loading
    close()
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
      // 获取角色列表
      getRoleOptions()
      // 初始化弹窗数据
      initData()
    }
  },
)
</script>

<template>
  <el-dialog
    v-model="show"
    width="700px"
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
      <el-row>
        <!-- 左 -->
        <el-col :md="12">
          <el-form-item label="账号" prop="account" required>
            <el-input v-model="form.account" placeholder="请填写" :disabled="isUpdate" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item label="用户名" prop="username" required>
            <el-input v-model="form.username" placeholder="请填写" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item
            v-if="!isUpdate"
            label="密码"
            prop="password"
            :rules="[
              { type: 'string', required: true, message: '密码不能为空' },
              { type: 'string', min: 6, max: 10, message: '密码长度6-10' },
            ]"
            required
          >
            <el-input v-model="form.password" type="password" placeholder="请填写" show-password clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item prop="roles">
            <template #label>
              <div style="display: flex; align-items: center;">
                角色
                <el-tooltip content="不选则解绑该用户原有的角色">
                  <el-icon><i-ep-info-filled /></el-icon>
                </el-tooltip>
              </div>
            </template>

            <el-select
              v-model="roles"
              placeholder="请选择"
              multiple
              clearable
              collapse-tags
              collapse-tags-tooltip
              :max-collapse-tags="1"
              :offset="4"
              :validate-event="validateEvent"
            >
              <template v-for="role in roleOptions" :key="role.value">
                <el-option :value="role.value" :label="role.label" />
              </template>
            </el-select>
          </el-form-item>
          <el-form-item label="生日" prop="birthday">
            <el-date-picker
              v-model="form.birthday"
              type="date"
              placeholder="请选择"
              clearable
              style="width: 100%"
            />
          </el-form-item>
        </el-col>
        <!-- 右 -->
        <el-col :md="12">
          <el-form-item label="邮箱" prop="email" required>
            <el-input
              v-model="form.email"
              type="email"
              placeholder="请填写"
              :disabled="isUpdate"
              clearable
              :prefix-icon="Message"
              :validate-event="validateEvent"
            />
          </el-form-item>
          <el-form-item label="手机号" prop="mobile">
            <el-input
              v-model="form.mobile"
              placeholder="请填写"
              :disabled="isUpdate"
              clearable
              :validate-event="validateEvent"
              :prefix-icon="Iphone"
            />
          </el-form-item>
          <el-form-item label="性别" prop="sex" required>
            <el-radio v-model="form.sex" name="sex" :value="1" label="男" />
            <el-radio v-model="form.sex" name="sex" :value="2" label="女" />
          </el-form-item>
          <el-form-item label="状态" prop="state">
            <el-radio v-model="form.state" name="state" :value="1" label="启用" />
            <el-radio v-model="form.state" name="state" :value="0" label="停用" />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </el-dialog>
</template>
