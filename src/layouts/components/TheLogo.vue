<script setup lang="ts">
import LottieLogo from '~/assets/lottie/lf20_sfiiilbf.json'
import { PROJECT_NAME } from '~/config/setting'

const themeStore = useThemeStore()
const router = useRouter()

function renderLottie() {
  // 不显示logo，不渲染
  if (!themeStore.settings.showLogo) return
  // 渲染前先销毁，防止重复渲染显示多个logo
  lottie.destroy('lottie-logo')
  useLottie({
    name: 'lottie-logo',
    containerId: '#lottie-logo',
    animationData: LottieLogo,
  })
}

onMounted(() => renderLottie())
onUpdated(() => renderLottie())
</script>

<template>
  <div class="the-logo" @click="router.push({ name: 'home' })">
    <div id="lottie-logo" class="logo" />
    <span v-if="!themeStore.collapseSide" class="logo-title">
      {{ PROJECT_NAME }}
    </span>
  </div>
</template>
