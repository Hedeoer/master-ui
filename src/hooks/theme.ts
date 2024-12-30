/**
 * 说明：
 * 从[https://gitee.com/cheerwhy/use-element-plus-theme]项目抄过来的
 */

// 变量前缀
const PRE = '--el-color-primary'
// 浅色变量前缀
const PRE_LIGHT = `${PRE}-light`
// 深色变量前缀
const PRE_DARK = `${PRE}-dark`
// 色阶
const Levels = [3, 5, 7, 8, 9]

// 白色
const WHITE = '#FFFFFF'
// 黑色
const BLACK = '#000000'

const html = document.documentElement

/**
 * 混合颜色
 * @param color1 颜色1
 * @param color2 颜色2
 * @param weight 权重
 */
function mix(color1: string, color2: string, weight: number) {
  weight = Math.max(Math.min(Number(weight), 1), 0)

  const parseColor = (color: string): [number, number, number] => {
    const r = Number.parseInt(color.substring(1, 3), 16)
    const g = Number.parseInt(color.substring(3, 5), 16)
    const b = Number.parseInt(color.substring(5, 7), 16)
    return [r, g, b]
  }
  const [r1, g1, b1] = parseColor(color1)
  const [r2, g2, b2] = parseColor(color2)

  const mixChannel = (c1: number, c2: number, w: number): string => {
    const mixed = Math.round(c1 * (1 - w) + c2 * w)
    return mixed.toString(16).padStart(2, '0')
  }

  const r = mixChannel(r1, r2, weight)
  const g = mixChannel(g1, g2, weight)
  const b = mixChannel(b1, b2, weight)

  return `#${r}${g}${b}`
}

/**
 * 更换颜色的方法
 * @param color 颜色
 */
function changeTheme(color?: string | null) {
  if (!color) {
    console.warn('未获取到颜色的值')
    return
  }

  // 设置主要颜色变量 --el-color-primary
  html.style.setProperty(PRE, color)

  // 循环设置色阶颜色
  // --el-color-primary-light-${level}
  Levels.forEach((level) => {
    html.style.setProperty(`${PRE_LIGHT}-${level}`, mix(color, WHITE, level * 0.1))
  })

  // 设置主要暗色
  // --el-color-primary-dark-2
  const dark = mix(color, BLACK, 0.2)
  html.style.setProperty(`${PRE_DARK}-2`, dark)
}

/**
 * 动态设置主题色
 * @param color
 */
export function useElementPlusTheme(color?: string) {
  onBeforeMount(() => {
    changeTheme(color)
  })

  return {
    changeTheme
  }
}
