// 响应式
export const breakpoints = useBreakpoints({
  xs: '320px',
  sm: '640px',
  md: '1024px',
  lg: '1280px',
  xl: '1536px',
  xxl: '1920px',
})

export const isMobile = breakpoints.smaller('sm')
export const isPC = breakpoints.greaterOrEqual('sm')
export const isXs = breakpoints.smaller('sm')
export const isSmallerMd = breakpoints.smaller('md')
export const isSmallerLg = breakpoints.smaller('lg')

// 系统当前主题色
export const primaryColor = useThemeStoreHook().settings.primaryColor

/** 计算card高度 */
export function useCardHeight() {
  const themeStore = useThemeStoreHook()

  // 计算 card 高度
  const height = computed(() => {
    // 有页脚，需要减去页脚高度
    if (themeStore.settings.showFoot) {
      return 'calc(100vh - var(--layout-nav-height) - var(--layout-tab-height) - var(--layout-footer-height) - 22px)'
    }
    return 'calc(100vh - var(--layout-nav-height) - var(--layout-tab-height) - 22px)'
  })

  return {
    height,
  }
}
