<script setup lang="ts">
import NotFoundSvg from '~/assets/images/404.svg'

const router = useRouter()
const route = useRoute()

// 计算card高度
const { height } = useCardHeight()

/** 刷新 */
function reloadPage() {
  router.push({
    path: `/redirect${unref(route).fullPath}`,
  })
}
</script>

<template>
  <el-card class="card" shadow="never" :style="{ height }">
    <el-empty :image="NotFoundSvg" :image-size="360" description="页面不存在或加载失败">
      <el-space>
        <el-button @click="reloadPage">
          刷新
        </el-button>
        <el-button type="primary" @click="router.back()">
          返回
        </el-button>
      </el-space>
    </el-empty>
  </el-card>
</template>

<style scoped>
.card {
  display: flex;
  justify-content: center;
  align-items: center;
}

/** 由于网上找的404svg图片下方空白太大，所以调整description位置 */
:deep(.el-empty__description) {
  position: relative;
  top: -68px;
}
:deep(.el-empty__description p) {
  font-size: 16px;
}
/** 由于网上找的404svg图片下方空白太大，所以调整自定义button位置 */
:deep(.el-empty__bottom) {
  position: relative;
  top: -68px;
}
</style>
