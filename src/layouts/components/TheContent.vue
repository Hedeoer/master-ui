<script setup lang="ts">
const themeStore = useThemeStore()
// const tabStore = useTabStore() // Temporarily comment out
const animateName = computed(() => (themeStore.settings.showAnimation
  ? themeStore.settings.animationMode
  : undefined))
// 计算keepAlive路由
// const keepAliveRoute = computed(() => tabStore.cachedTabNames ?? []) // Temporarily comment out
</script>

<template>
  <RouterView v-slot="{ Component, route }">
    <Transition :name="animateName" mode="out-in" appear>
      <!-- <KeepAlive :include="keepAliveRoute" :max="10"> -->
        <component :is="Component" :key="route.path" />
      <!-- </KeepAlive> -->
    </Transition>
  </RouterView>
</template>
