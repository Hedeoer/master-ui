<script setup lang="ts">
import defaultAvatar from '~/assets/default-avatar.jpg'
import { LOGIN_ROUTE, USER_PROFILE_ROUTE } from '~/types/router'
import PasswordModal from './PasswordModal.vue'

const router = useRouter()
const userStore = useUserStore()
const avatar = computed(() => userStore.info?.avatar || defaultAvatar)
// 是否显示"修改密码"弹窗
const showModal = ref(false)

/**
 * 注销登录
 *
 * 说明：
 * 如果是修改密码，不需要调用注销登录接口，因为后端已经进行了注销登录操作。
 * @param request 是否要调用注销登录接口。
 */
async function logout(request = true) {
  if (request) {
    const { success, message } = await logoutApi()
    if (!success) {
      toastError(message || '操作失败')
      return
    }
  }

  notify('登出成功', '记得回来~', { duration: 1000 })
  userStore
    .logout()
    .then(() => router.push(LOGIN_ROUTE))
}
</script>

<template>
  <div>
    <el-dropdown>
      <div class="avatar">
        <el-avatar :src="avatar" size="small" style="margin-right: 4px;" />
        {{ userStore.info?.username }}
      </div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item @click="router.push(USER_PROFILE_ROUTE)">
            <el-icon><i-ep-user /></el-icon>
            用户信息
          </el-dropdown-item>
          <el-dropdown-item @click="showModal = true">
            <el-icon><i-ep-hide /></el-icon>
            修改密码
          </el-dropdown-item>
          <el-dropdown-item divided @click="logout">
            <el-icon><i-mdi-logout /></el-icon>
            注销登录
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <!-- 修改密码弹窗 -->
    <PasswordModal v-model:visible="showModal" @done="logout(false)" />
  </div>
</template>

<style scoped>
.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
}

/** 去除下拉菜单边框 */
:deep(.el-tooltip__trigger:focus-visible) {
  outline: none;
}
</style>
