// 全局已经引入了，所以这里不需要再次引入
// import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import type { ElMessageBoxOptions } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { ElIcon } from 'element-plus'

/** toast的其它参数 */
interface ToastOtherOptions {
  duration?: number // 显示时间
  grouping?: boolean // 是否分组显示
}

/** confirm的其它参数 */
interface ConfirmOtherOptions {
  draggable?: boolean // MessageBox 是否可拖放
  overflow?: boolean // MessageBox 拖动范围可以超出可视区
  roundButton?: boolean // 是否使用圆角按钮
}

/** notify的其它参数 */
interface NotifyOtherOptions {
  duration?: number // 显示时间
  type?: string // 'success' 'waring' 'info' 'error'
}

/**
 * 成功toast
 *
 * @param msg toast消息内容
 * @param duration toast显示时间
 */
export function toastSuccess(msg: string, duration: number = 3000) {
  toast('success', msg, { duration, grouping: true })
}

/**
 * 信息toast
 *
 * @param msg toast消息内容
 * @param duration toast显示时间
 */
export function toastInfo(msg: string, duration: number = 3000) {
  toast('', msg, { duration, grouping: true })
}

/**
 * 警告toast
 *
 * @param msg toast消息内容
 * @param duration toast显示时间
 */
export function toastWarn(msg: string, duration: number = 3000) {
  toast('warning', msg, { duration, grouping: true })
}

/**
 * 错误toast
 *
 * @param msg toast消息内容
 * @param duration toast显示时间
 */
export function toastError(msg: string, duration: number = 3000) {
  toast('error', msg, { duration, grouping: true })
}

/**
 * toast
 *
 * @param type toast类型
 * @param msg toast消息内容
 * @param ToastOtherOptions toast其它参数
 */
export function toast(type?: string, msg: string, { duration = 3000, grouping = false }: ToastOtherOptions) {
  ElMessage({
    type,
    message: msg,
    duration,
    grouping
  })
}

/**
 * 消息对话框
 *
 * @param msg 消息内容
 * @param confirmOtherOptions confirm其它参数
 * @param callback 确定按钮点击回调
 */
export function confirmMsg(msg: string, { draggable = true, overflow = true, roundButton = false }: ConfirmOtherOptions, callback: () => void) {
  ElMessageBox.confirm(msg, '提示', {
    draggable,
    overflow,
    roundButton,
    closeOnClickModal: false, // 是否可通过点击遮罩层关闭 MessageBox
    closeOnPressEscape: false, // 是否可通过按下 ESC 键关闭 MessageBox
  }).then(() => {
    callback()
  }).catch(() => { })
}

/**
 * 成功通知
 *
 * @param message 通知内容
 * @param title 通知标题
 * @param duration 通知显示时间
 */
export function notifySuccess(message: string, title: string = 'Success', duration: number = 3000) {
  notify(title, message, { duration, type: 'success' })
}

/**
 * 警告通知
 *
 * @param message 通知内容
 * @param title 通知标题
 * @param duration 通知显示时间
 */
export function notifyWarn(message: string, title: string = 'Warning', duration: number = 3000) {
  notify(title, message, { duration, type: 'warning' })
}

/**
 * 错误通知
 *
 * @param message 通知内容
 * @param title 通知标题
 * @param duration 通知显示时间
 */
export function notifyError(message: string, title: string = 'Error', duration: number = 3000) {
  notify(title, message, { duration, type: 'error' })
}

/**
 * info通知
 *
 * @param message 通知内容
 * @param title 通知标题
 * @param duration 通知显示时间
 */
export function notifyInfo(message: string, title: string = 'Info', duration: number = 3000) {
  notify(title, message, { duration, type: 'Info' })
}

/**
 * 通知
 *
 * @param title 通知标题
 * @param message 通知内容
 * @param NotifyOtherOptions 通知其它参数
 */
export function notify(title: string, message: string, { duration = 3000, type = '' }: NotifyOtherOptions) {
  ElNotification({
    title,
    message,
    duration,
    type
  })
}

/**
 * loading消息
 * @param msg 消息内容
 * @param callback
 */
export function loadingMsg(msg: string, callback: (close: () => void) => void) {
  // loading-box的样式在styles/rest.css中
  const options: ElMessageBoxOptions = {
    customClass: 'loading-box',
    showClose: false,
    showConfirmButton: false,
    closeOnClickModal: false,
    closeOnPressEscape: false,
    dangerouslyUseHTMLString: true,
    message: h('div', { style: 'display: flex; align-items: center; justify-content: center;' }, [
      h(ElIcon, { class: 'is-loading', style: 'font-size: 40px; font-weight: bold;' }, [
        h(Loading)
      ]),
      h('span', { style: 'margin-left: 10px;' }, `${msg}`)
    ])
  }

  // 弹出提示框
  ElMessageBox(options)

  // 回调
  callback(close)

  // 关闭提示框的方法
  function close() {
    // https://segmentfault.com/q/1010000043588767
    options.onVanish() // ElMessageBox.close()
  }
}
