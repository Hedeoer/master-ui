<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { LoginParam } from '~/types/login'
import { Key, Unlock, User } from '@element-plus/icons-vue'
import { cloneDeep } from '@pureadmin/utils'
import loginBg from '~/assets/images/login-bg.png'
import LottieLogo from '~/assets/lottie/lf20_sfiiilbf.json'
import LottieBanner from '~/assets/lottie/lf20_uv2O8HvO2x.json'
import { PROJECT_NAME } from '~/config/setting'
import { HOME_ROUTE } from '~/types/router'

const { loading, setLoading } = useLoading(false)
const router = useRouter()
const refForm = ref()
const verifyCode = ref<string>('')
const verifyCodeMaxLength = ref<number>(5)
const loginForm = reactive<LoginParam>({
  account: 'zetaAdmin',
  password: 'admin',
  code: '',
  key: '',
  remember: true,
})
// 表单校验规则
const rules = ref<FormRules<LoginParam>>({
  account: { type: 'string', required: true, message: '账号不能为空' },
  password: { type: 'string', required: true, message: '密码不能为空' },
  code: { type: 'string', required: true, message: '验证码不能为空' }
})

/** 设置记住登录 */
function setRemember(value: boolean) {
  loginForm.remember = value
}
/** 改变验证码 */
async function changeVerifyCode() {
  const { success, message, data } = await captchaApi()
  if (!success) {
    toastError(message || '获取验证码失败')
    return
  }
  verifyCode.value = data?.base64 || ''
  loginForm.code = data?.text || ''
  loginForm.key = data?.key || ''
}

/** 提交表单数据 */
function handleSubmit() {
  // 如果登录按钮正在loading。不再次执行登录
  if (loading.value) return

  // 表单校验
  refForm.value.validate(async (isValidate: boolean, _errors: any) => {
    if (!isValidate) return

    setLoading(true)
    try {
      // 登录
      await loginApi({ ...cloneDeep(loginForm) })
      // 路由跳转
      const { from, ...othersQuery } = router.currentRoute.value.query
      router.push({
        path: (from as string) || HOME_ROUTE,
        query: {
          ...othersQuery,
        },
      })
      // 登录成功提示
      notifySuccess('欢迎回来~', '登录成功', 1000)
    } catch (err) {
      toastError((err as Error).message || '登录失败')
    } finally {
      setLoading(false)
    }
  })
}

onMounted(() => {
  // 渲染banner
  useLottie({
    name: 'banner',
    containerId: '#banner',
    animationData: LottieBanner,
  })

  // 渲染logo
  useLottie({
    name: 'logo',
    containerId: '#logo',
    animationData: LottieLogo,
  })

  // 获取验证码
  changeVerifyCode()
})
</script>

<template>
  <div class="select-none">
    <img :src="loginBg" class="wave">
    <div class="login-container">
      <div class="img">
        <div id="banner" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <div id="logo" class="logo" />
          <h2 class="outline-none">
            {{ PROJECT_NAME }}
          </h2>

          <el-form ref="refForm" :model="loginForm" :rules="rules" size="large">
            <el-form-item prop="account" label-width="0" required>
              <el-input v-model="loginForm.account" placeholder="请输入账号" clearable :prefix-icon="User" />
            </el-form-item>

            <el-form-item prop="password" label-width="0" required>
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                show-password
                clearable
                :prefix-icon="Unlock"
              />
            </el-form-item>

            <el-form-item prop="code" label-width="0" required>
              <el-input
                v-model="loginForm.code"
                placeholder="请输入验证码"
                :maxlength="verifyCodeMaxLength"
                clearable
                :prefix-icon="Key"
              >
                <template #append>
                  <img class="verifyCode" :src="verifyCode" @click="changeVerifyCode">
                </template>
              </el-input>
            </el-form-item>

            <el-space :size="16" direction="vertical" fill wrap>
              <div class="login-form-password-actions">
                <el-checkbox
                  v-model="loginForm.remember"
                  :value="true"
                  label="记住登录"
                  @change="(value: string | number | boolean) => setRemember(value as boolean)"
                />
                <el-button type="primary" link>忘记密码</el-button>
              </div>
              <el-button type="primary" :loading="loading" @click="handleSubmit">
                登录
              </el-button>
            </el-space>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("./login.css");

:deep(.el-input-group__append, .el-input-group__prepend){
  padding: 0;
  padding-right: 1px;
}
</style>
