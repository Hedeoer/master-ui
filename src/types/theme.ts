/** 主题设置 */
export interface ThemeSettings {
  /** 是否显示 Logo */
  showLogo: boolean
  /** 是否显示面包屑 */
  showBreadcrumb: boolean
  /** 是否显示多页签 */
  showTabs: boolean
  /** 是否显示页脚 */
  showFoot: boolean
  /** 宽度小于特定值时，是否自动折叠菜单 */
  autoCollapseSode: boolean

  /** 是否缓存多页签 */
  cacheTabs: boolean

  /** 菜单是否手风琴效果 */
  accordion: boolean
  /** 菜单主题是否相反 */
  sideThemeInverse: boolean

  /** 是否显示页面切换动画 */
  showAnimation: boolean
  /** 页面切换动画类型 */
  animationMode: 'fade-slide' | 'fade' | 'fade-bottom' | 'fade-scale' | 'zoom-fade' | 'zoom-out'
  /** 多页签样式 */
  tabTheme: '' | 'underpainting' | 'designer'

  /** 系统主色调 */
  primaryColor: string

  /** 页面主题的亮暗模式 */
  themeMode: 'light' | 'dark'

  /** 全局组件大小 */
  size: 'large' | 'default' | 'small'

  /** 按钮文字是否自动插入空格(仅当文本长度为 2 且所有字符均为中文时才生效) */
  autoInsertSpace: boolean
}

/** 多页签 */
export interface Tab {
  /** 菜单标题 */
  title: string
  /** 路由名 */
  name: string
  /** 菜单图标 */
  icon?: string
  /** 路由地址 */
  path: string
  /** 是否缓存 */
  keepAlive?: boolean
  /** 是否固定 */
  affix?: boolean
}
