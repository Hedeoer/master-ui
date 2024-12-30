<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { SysUser, SysUserUpdateParam } from '~/types/system/user'
import { cloneDeep } from '@pureadmin/utils'
import defaultAvatar from '~/assets/default-avatar.jpg'
import { assignObj } from '~/utils'

const userStore = useUserStore()
const avatar = computed(() => userStore.info?.avatar || defaultAvatar)

// 设置为false,代表输入时不进行表单校验，只有提交时才进行表单校验
const validateEvent = ref<boolean>(false)
// 表单相关
const refForm = ref()
const sysUser = ref<SysUser>({})
const form = reactive<SysUserUpdateParam>({
  id: '',
  username: '',
  sex: 1,
  mobile: '',
  email: '',
  birthday: '',
})
// 表单校验规则
const rules = ref<FormRules<SysUserUpdateParam>>({
  username: [
    { type: 'string', required: true, message: '用户名不能为空' },
    { type: 'string', min: 6, max: 64, message: '用户名长度6-64' },
  ],
  email: { type: 'email' },
  sex: { type: 'number', required: true, message: '性别不能为空' },
})

const tableData = [
  {
    date: '2025-05-03 09:00',
    state: true
  },
  {
    date: '2025-05-02 18:00',
    state: true
  },
  {
    date: '2025-05-02 09:00',
    state: true
  },
  {
    date: '2025-05-01 18:00',
    state: true
  },
  {
    date: '2025-05-01 09:00',
    state: false
  }
]

/**
 * 获取当前登录用户的信息
 */
async function fetchUserInfo() {
  const id = userStore.info?.id
  if (!id) return

  const { success, message, data } = await getUserApi(id as string)
  if (!success) {
    toastError(message || '获取用户信息失败')
  }

  // 赋值
  sysUser.value = data as SysUser
  assignObj(data as SysUser, form)
}
fetchUserInfo()

/** 表单提交 */
function handleSubmit() {
  refForm.value.validate((isValidate: boolean, _errors: any) => {
    if (!isValidate) return

    loadingMsg('正在提交数据...', async (close) => {
      try {
      // 修改用户数据
        const { success, message } = await updateUserApi(cloneDeep(form))
        if (!success) {
          close()
          toastError(message || '操作失败')
          return
        }

        toastSuccess(message || '操作成功')
        // 关闭loading
        close()
      } catch (e) {
        close()
        toastError((e as Error).message)
      }
    })
  })
}
</script>

<template>
  <el-row :gutter="10">
    <el-col :lg="8" :md="24" :sm="24" :xs="24">
      <el-card header="用户信息" shadow="never">
        <el-descriptions direction="vertical" border>
          <el-descriptions-item :rowspan="3" :width="140" label="" align="center">
            <el-image style="width: 100px; height: 140px" :src="avatar" alt="用户头像" />
          </el-descriptions-item>
          <el-descriptions-item label="账号">{{ sysUser.account }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ sysUser.createTime }}</el-descriptions-item>
          <el-descriptions-item label="邮箱">{{ sysUser.email || '-' }}</el-descriptions-item>
          <el-descriptions-item label="角色">
            {{ sysUser.roles?.map(item => item.name).join('、') }}
          </el-descriptions-item>
          <el-descriptions-item label="职务">
            运维
          </el-descriptions-item>
          <el-descriptions-item label="上次登录时间">
            2025-05-03 07:00
          </el-descriptions-item>
        </el-descriptions>
        <el-descriptions direction="vertical" border :column="1">
          <el-descriptions-item label="个性签名">
            <p>跟你们说了多少遍了，工作期间要称植物！！</p>
          </el-descriptions-item>
          <el-descriptions-item label="考勤记录">
            <el-table :data="tableData" border stripe>
              <el-table-column prop="date" label="时间" align="center" width="180" />
              <el-table-column prop="state" label="打卡情况" align="center" width="180">
                <template #default="scope">
                  <el-tag :type="scope.row.state ? 'primary' : 'danger'">
                    {{ scope.row.state ? '已打卡' : '缺卡' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>
    </el-col>

    <el-col :lg="16" :md="24" :sm="24" :xs="24">
      <el-card header="修改信息" shadow="never" :style="isSmallerLg ? 'margin-top: 10px' : ''">
        <el-form ref="refForm" :model="form" :rules="rules" label-width="100px" label-position="right" style="max-width: 580px; margin: 0 auto;">
          <el-form-item label="用户名" prop="username" required>
            <el-input v-model="form.username" placeholder="请填写" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item label="性别" prop="sex" required>
            <el-radio v-model="form.sex" name="sex" :value="1" label="男" />
            <el-radio v-model="form.sex" name="sex" :value="2" label="女" />
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请填写" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item label="手机号" prop="mobile">
            <el-input v-model="form.mobile" placeholder="请填写" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item label="生日" prop="birthday">
            <el-date-picker
              v-model="form.birthday"
              type="date"
              placeholder="请选择"
              clearable
              :validate-event="validateEvent"
              style="width: 100%"
            />
          </el-form-item>
          <el-form-item class="btn-center" label="">
            <el-button type="primary" @click="handleSubmit">
              保存修改
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-col>
  </el-row>
</template>

<style scoped>
:deep(.btn-center .el-form-item__content) {
  justify-content: center;
}
</style>
