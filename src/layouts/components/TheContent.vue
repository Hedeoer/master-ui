<script setup lang="ts">
import ErrorBoundary from '../../components/ErrorBoundary.vue'
const themeStore = useThemeStore()
const tabStore = useTabStore() // 取消注释，启用tabStore
const animateName = computed(() => (themeStore.settings.showAnimation
  ? themeStore.settings.animationMode
  : undefined))
// 计算keepAlive路由
const keepAliveRoute = computed(() => {
  const routes = tabStore.cachedTabNames ?? []
  // 增加调试信息
  console.log('【TheContent】KeepAlive包含的路由:', routes)
  
  return routes
})
</script>

<template>
  <ErrorBoundary>
    <!-- 添加注释，说明这里的配置 -->
    <!-- 
      Router View with KeepAlive cache
      组件匹配规则：
      1. 组件名必须与路由名匹配
      2. 组件必须通过defineOptions设置name
      3. 路由meta中的keepAlive必须为true
     -->
    <RouterView v-slot="{ Component, route }">
      <Transition :name="animateName" mode="out-in" appear>
        <KeepAlive :include="keepAliveRoute" :max="10">
          <component :is="Component" :key="route.path" />
        </KeepAlive>
      </Transition>
    </RouterView>
    
    <!-- 增加调试信息，可在生产环境移除 -->
    <div v-if="false" style="position:fixed; bottom:5px; right:5px; z-index:9999; background:rgba(0,0,0,0.7); color:white; padding:10px; font-size:12px; border-radius:4px; max-width:300px;">
      <div>当前缓存路由: {{ keepAliveRoute.join(', ') || '无' }}</div>
    </div>
  </ErrorBoundary>
</template>
