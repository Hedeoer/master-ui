import type { NavigationGuardNext, RouteLocationNormalized, Router, RouteRecordRaw } from 'vue-router'
import type { UserMenu } from '~/types/login'
import NProgress from 'nprogress'
import { PROJECT_NAME, WHITE_LIST } from '~/config/setting'
import { HOME_ROUTE, LOGIN_ROUTE } from '~/types/router'
import { getToken } from '~/utils/token'
import { menuToRoute } from './router-helper'

NProgress.configure({
  // 动画方式
  easing: 'ease',
  // 递增进度条的速度
  speed: 500,
  // 是否显示加载ico
  showSpinner: false,
  // 自动递增间隔
  trickleSpeed: 200,
})

/**
 * 创建路由守卫
 * @param router vue-router路由实例
 */
export function createRouterGuard(router: Router) {
  /**
   * 前置路由守卫
   *
   * @param to RouteLocationNormalized 即将要进入的目标
   * @param from RouteLocationNormalized 当前导航正要离开的路由
   * @param next NavigationGuardNext
   * @return 返回false取消当前导航
   */
  router.beforeEach(async (to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
    NProgress.start()
    // 是否未登录
    const notLogin = !getToken()
    // 是否需要登录
    const needLogin = !WHITE_LIST.includes(to.path)

    // 未登录，前往白名单地址
    if (notLogin && !needLogin) {
      return next()
    }

    // 未登录，前往需要登录的地址
    if (notLogin && needLogin) {
      if (to.path !== LOGIN_ROUTE) {
        toastError('登录状态已过期')
      }
      return next({
        path: LOGIN_ROUTE,
        query: to.path === HOME_ROUTE ? {} : { from: to.path },
      })
    }

    // 已登录，前往登录地址
    if (!notLogin && to.path === LOGIN_ROUTE) {
      return next(HOME_ROUTE)
    }

    // 已登录，需要重新加载动态路由
    const userStore = useUserStore()
    if (!userStore.info) {
      const { menus } = await userStore.fetchUserInfo()
      if (menus && menus.length > 0) {
        // 用户菜单转换成 vue-router 的路由
        const dynamicRoutes = menuToRoute(menus as UserMenu[]);
        // 逐个添加转换后的顶级路由
        dynamicRoutes.forEach((route) => {
          try {
            // 检查路由是否已存在 (确保 route.name 存在且不为空)
            if (route.name && !router.hasRoute(route.name)) { 
               router.addRoute(route);
               console.log(`【Router Guard】动态添加路由: ${String(route.name)}`);
            } else if (!route.name) {
               console.warn(`【Router Guard】路由缺少 name 属性，无法添加:`, route);
            } else {
               console.warn(`【Router Guard】路由已存在，跳过添加: ${String(route.name)}`);
               // 可选：如果需要更新，可以在这里 removeRoute + addRoute
            }
          } catch (error) {
             console.error(`【Router Guard】添加路由失败: ${String(route.name)}`, error);
          }
        });
      }
      // 确保在添加完所有路由后才进行重定向
      return next(to.fullPath)
    }
    // 如果用户信息已存在，则直接放行
    return next()
  })

  /**
   * 后置路由钩子
   *
   * @param to RouteLocationNormalized 即将要进入的目标
   * @param from RouteLocationNormalized 当前导航正要离开的路由
   */
  router.afterEach((to: RouteLocationNormalized, _from: RouteLocationNormalized) => {
    useTitle(to.meta?.title as string ?? PROJECT_NAME)

    if (NProgress.isStarted()) {
      setTimeout(() => {
        NProgress.done(true)
      }, 200)
    }

    // 移除对防火墙页面的特殊处理，因为已通过组件内部生命周期正确处理资源清理
    // 检测从防火墙页面离开的情况
    // if (_from.path === '/agents/firewall' && to.path !== '/agents/firewall') {
    //   console.log('【全局守卫】检测到从防火墙页面离开，将在导航后刷新');
    //   setTimeout(() => {
    //     window.location.reload();
    //   }, 100);
    // }
  })
}
