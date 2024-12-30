<!--
组件名：cron表达式生成
用法：
```vue
<script setup lang="ts">
import CronSelect from './cron-select.vue'

const cron = ref<string>('')
</script>

<template>
  <div>
    <cron-select v-model="cron" />
    {{ cron }}
  </div>
</template>
```
属性：
- modelValue: 绑定值        必填
- placeholder: 占位符       可选     默认值：'请填写'
- clearable: 是否允许清空   可选     默认值：false
事件：
- update:modelValue: 绑定值更新
-->
<script setup lang="ts">
import type { ApiResult } from '~/types/global'
import dayjs from 'dayjs'

const props = withDefaults(defineProps<{
  /** cron表达式 */
  modelValue?: string
  /** 占位符 */
  placeholder?: string
  /** 是否允许清空 */
  clearable?: boolean
  validateEvent?: boolean
}>(), {
  placeholder: '请填写',
  clearable: false,
  validateEvent: true
})

const emit = defineEmits(['update:modelValue'])

interface CronData {
  /** 秒 */
  second: string
  /** 分钟 */
  minute: string
  /** 小时 */
  hour: string
  /** 日 */
  day: string
  /** 月 */
  month: string
  /** 星期 */
  week: string
  /** 年 */
  year: string
}

interface CronDescription {
  cron: string
  description: string
}

const monthMap: Record<string, string> = {
  JAN: '1',
  FEB: '2',
  MAR: '3',
  APR: '4',
  MAY: '5',
  JUN: '6',
  JUL: '7',
  AUG: '8',
  SEP: '9',
  OCT: '10',
  NOV: '11',
  DEC: '12',
}

// quartz: 1=星期日、2=星期一、3=星期二、4=星期三、5=星期四、6=星期五、7=星期六
const weekMap: Record<string, string> = {
  SUN: '1',
  MON: '2',
  TUE: '3',
  WED: '4',
  THU: '5',
  FRI: '6',
  SAT: '7',
}

// cron 默认值
const cron = ref<CronData>({
  second: '*',
  minute: '*',
  hour: '*',
  day: '*',
  month: '*',
  week: '?',
  year: '',
})
// cron说明
const cronDescription = ref<CronDescription[]>([
  { cron: '0/2 * * * * ?', description: '每2秒触发一次' },
  { cron: '0 0/2 * * * ?', description: '每2分钟触发一次' },
  { cron: '0 0 10,14,16 * * ?', description: '每天10点、14点、16点触发' },
  { cron: '0 0/30 9-17 * * ?', description: '每天9点-17点，00分和30分触发' },
  { cron: '0 0 2 1 * ?', description: '每月1号的凌晨2点触发' },
  { cron: '0 0 2 1 1-2 ? *', description: '每年的1月1日和2月1日的凌晨2点触发' },
  { cron: '0 10,44 14 ? 3 WED', description: '每年3月的星期3的下午2:10和2:44触发' },
  { cron: '0 15 10 ? * MON-FRI', description: '周1至周5的上午10:15触发' },
  { cron: '0 15 10 L * ?', description: '每月最后一日的上午10:15触发' },
  { cron: '0 0 0 1 2/4 ?', description: '从2月1日开始，间隔4个月触发一次' },
  { cron: '0 15 10 L JAN-MAR ?', description: '每年从1月开始到3月结束，每月最后一天10:15触发' },
  { cron: '0 15 10 * * ? 2024', description: '2024年每天上午10:15触发' },
  { cron: '0 15 10 * * ? 2023-2024', description: '2023和2024这两年，每天10:15分触发' },
])
// tabId
const tabId = ref<string>('1')
// input框的值
const cronInput = ref<string>()

// 单选框：秒
const secondRadio = ref<string>('1')
// 单选框：分钟
const minuteRadio = ref<string>('1')
// 单选框：小时
const hourRadio = ref<string>('1')
// 单选框：日
const dayRadio = ref<string>('1')
// 单选框：月
const monthRadio = ref<string>('1')
// 单选框：年
const yearRadio = ref<string>('1')
// 单选框：周
const weekRadio = ref<string>('1')

// 复选框：秒
const secondCheckBox = ref<number[]>([])
// 复选框：分钟
const minuteCheckBox = ref<number[]>([])
// 复选框：小时
const hourCheckBox = ref<number[]>([])
// 复选框：日
const dayCheckBox = ref<number[]>([])
// 复选框：月
const monthCheckBox = ref<number[]>([])
// 复选框：周
const weekCheckBox = ref<number[]>([])

// cron执行结果-错误描述
const executeError = ref<string>('')
// cron执行结果-结果
const executeResult = ref<string[] | undefined>([])

/** 秒和分钟 范围 [0, ..., 59]  */
const secondAndMinuteRange = computed(() => {
  return Array.from(Array.from({ length: 60 }).keys()) as number[]
})
/** 小时 范围 [0, ..., 23]  */
const hourRange = computed(() => {
  return Array.from(Array.from({ length: 24 }).keys()) as number[]
})
/** 日 范围 [1, ..., 31]  */
const dayRange = computed(() => {
  return Array.from(Array.from({ length: 31 }).keys()).map(item => item + 1) as number[]
})
/** 月 范围 [1, ..., 12]  */
const monthRange = computed(() => {
  return Array.from(Array.from({ length: 12 }).keys()).map(item => item + 1) as number[]
})
/** 周 范围 [1, ..., 12]  */
const weekRange = computed(() => {
  return Array.from(Array.from({ length: 7 }).keys()).map(item => item + 1) as number[]
})
/** 今年 */
const nowYear = computed(() => {
  return dayjs().year()
})
/** 明年 */
const nextYear = computed(() => {
  return nowYear.value + 1
})

// 秒tab输入框
const secondStart0 = ref<number>(1)
const secondEnd0 = ref<number>(2)
const secondStart1 = ref<number>(0)
const secondEnd1 = ref<number>(1)

// 分钟tab输入框
const minuteStart0 = ref<number>(1)
const minuteEnd0 = ref<number>(2)
const minuteStart1 = ref<number>(0)
const minuteEnd1 = ref<number>(1)

// 小时tab输入框
const hourStart0 = ref<number>(0)
const hourEnd0 = ref<number>(2)
const hourStart1 = ref<number>(0)
const hourEnd1 = ref<number>(1)

// 日tab输入框
const dayStart0 = ref<number>(1)
const dayEnd0 = ref<number>(2)
const dayStart1 = ref<number>(1)
const dayEnd1 = ref<number>(1)
const dayStart2 = ref<number>(1)

// 月tab输入框
const monthStart0 = ref<number>(1)
const monthEnd0 = ref<number>(2)
const monthStart1 = ref<number>(1)
const monthEnd1 = ref<number>(1)

// 周tab输入框
const weekStart0 = ref<number>(2)
const weekEnd0 = ref<number>(3)
const weekStart1 = ref<number>(2)
const weekEnd1 = ref<number>(1)
const weekStart2 = ref<number>(2)
const weekEnd2 = ref<number>(1)
const weekStart3 = ref<number>(2)

// 年tab输入框
const yearStart0 = ref<number>(nowYear.value)
const yearEnd0 = ref<number>(nextYear.value)

/** cron输入框值改变 */
function cronInputChange(value: string) {
  cronInput.value = value
  emit('update:modelValue', value)
  setCron(value)
}
/** 单选框切换：秒 */
function secondRadioChange(current: string) {
  switch (current) {
    case '1':
      cron.value.second = '*'
      break
    case '2':
      cron.value.second = `${secondStart0.value}-${secondEnd0.value}`
      break
    case '3':
      cron.value.second = `${secondStart1.value}/${secondEnd1.value}`
      break
    case '4':
      if (secondCheckBox.value.length === 0) {
        cron.value.second = '*'
        return
      }
      cron.value.second = secondCheckBox.value.map(item => item).join(',')
      break
    default:
      return
  }

  // input框赋值
  cronInput.value = cronDataToString(cron.value)
}
/** 单选框切换：分钟 */
function minuteRadioChange(current: string) {
  switch (current) {
    case '1':
      cron.value.minute = '*'
      break
    case '2':
      cron.value.minute = `${minuteStart0.value}-${minuteEnd0.value}`
      break
    case '3':
      cron.value.minute = `${minuteStart1.value}/${minuteEnd1.value}`
      break
    case '4':
      if (minuteCheckBox.value.length === 0) {
        cron.value.minute = '*'
        return
      }
      cron.value.minute = minuteCheckBox.value.map(item => item).join(',')
      break
    default:
      return
  }

  /** 修改了分钟的设置，将秒的值设置成0 */
  if (cron.value.minute !== '*') {
    // 秒
    if (cron.value.second === '*') {
      secondCheckBox.value = [0]
      secondRadio.value = '4'
    }
  }

  // input框赋值
  cronInput.value = cronDataToString(cron.value)
}
/** 单选框切换：小时 */
function hourRadioChange(current: string) {
  switch (current) {
    case '1':
      cron.value.hour = '*'
      break
    case '2':
      cron.value.hour = `${hourStart0.value}-${hourEnd0.value}`
      break
    case '3':
      cron.value.hour = `${hourStart1.value}/${hourEnd1.value}`
      break
    case '4':
      if (hourCheckBox.value.length === 0) {
        cron.value.hour = '*'
        return
      }
      cron.value.hour = hourCheckBox.value.map(item => item).join(',')
      break
    default:
      return
  }

  /** 修改了小时的设置，将秒、分的值设置成0 */
  if (cron.value.hour !== '*') {
    // 秒
    if (cron.value.second === '*') {
      secondCheckBox.value = [0]
      secondRadio.value = '4'
    }
    // 分
    if (cron.value.minute === '*') {
      minuteCheckBox.value = [0]
      minuteRadio.value = '4'
    }
  }

  // input框赋值
  cronInput.value = cronDataToString(cron.value)
}
/** 单选框切换：日 */
function dayRadioChange(current: string) {
  switch (current) {
    case '1':
      cron.value.day = '*'
      break
    case '2':
      cron.value.day = '?'
      break
    case '3':
      cron.value.day = `${dayStart0.value}-${dayEnd0.value}`
      break
    case '4':
      cron.value.day = `${dayStart1.value}/${dayEnd1.value}`
      break
    case '5':
      cron.value.day = `${dayStart2.value}W`
      break
    case '6':
      cron.value.day = 'L'
      break
    case '7':
      if (dayCheckBox.value.length === 0) {
        cron.value.day = '*'
        return
      }
      cron.value.day = dayCheckBox.value.map(item => item).join(',')
      break
    default:
      return
  }

  /** 修改了日的设置，将秒、分、时的值设置成0 */
  if (cron.value.day !== '*' && cron.value.day !== '?') {
    // 秒
    if (cron.value.second === '*') {
      secondCheckBox.value = [0]
      secondRadio.value = '4'
    }
    // 分
    if (cron.value.minute === '*') {
      minuteCheckBox.value = [0]
      minuteRadio.value = '4'
    }
    // 时
    if (cron.value.hour === '*') {
      hourCheckBox.value = [0]
      hourRadio.value = '4'
    }
  }

  /**
   * cron表达式详解：
   * 问号(?)只能用在DayofMonth和DayofWeek两个域，
   * 由于指定日期(DayofMonth)和指定星期(DayofWeek)存在冲突，
   * 所以当指定了日期(DayofMonth)后（包括每天*），星期(DayofWeek)必须使用问号(?)，
   * 同理，指定星期(DayofWeek)后，日期(DayofMonth)必须使用问号(?)。
   */
  // 指定了日期，且指定了星期，将星期设置为?
  if (cron.value.day !== '?' && cron.value.week !== '?') {
    weekChange('2')
  }
  // 不指定日期，且不指定星期，将星期设置为1
  else if (cron.value.day === '?' && cron.value.week === '?') {
    weekCheckBox.value = [1]
    weekChange('7')
  }

  // input框赋值
  cronInput.value = cronDataToString(cron.value)
}
/** 单选框切换：月 */
function monthRadioChange(current: string) {
  switch (current) {
    case '1':
      cron.value.month = '*'
      break
    case '2':
      cron.value.month = `${monthStart0.value}-${monthEnd0.value}`
      break
    case '3':
      cron.value.month = `${monthStart1.value}/${monthEnd1.value}`
      break
    case '4':
      if (monthCheckBox.value.length === 0) {
        cron.value.month = '*'
        return
      }
      cron.value.month = monthCheckBox.value.map(item => item).join(',')
      break
    default:
      return
  }

  /** 修改了月的设置，将秒、分、时的值设置成0 */
  if (cron.value.month !== '*') {
    // 秒
    if (cron.value.second === '*') {
      secondCheckBox.value = [0]
      secondRadio.value = '4'
    }
    // 分
    if (cron.value.minute === '*') {
      minuteCheckBox.value = [0]
      minuteRadio.value = '4'
    }
    // 时
    if (cron.value.hour === '*') {
      hourCheckBox.value = [0]
      hourRadio.value = '4'
    }
    // 日
    if (cron.value.day === '*') {
      dayCheckBox.value = [1]
      dayRadio.value = '7'
    }
  }

  /**
   * cron表达式详解：
   * 问号(?)只能用在DayofMonth和DayofWeek两个域，
   * 由于指定日期(DayofMonth)和指定星期(DayofWeek)存在冲突，
   * 所以当指定了日期(DayofMonth)后（包括每天*），星期(DayofWeek)必须使用问号(?)，
   * 同理，指定星期(DayofWeek)后，日期(DayofMonth)必须使用问号(?)。
   */
  // 指定了日期，且指定了星期，将星期设置为?
  if (cron.value.day !== '?' && cron.value.week !== '?') {
    weekChange('2')
  }
  // 不指定日期，且不指定星期，将星期设置为1
  else if (cron.value.day === '?' && cron.value.week === '?') {
    weekCheckBox.value = [1]
    weekChange('7')
  }

  // input框赋值
  cronInput.value = cronDataToString(cron.value)
}
/** 单选框切换：周 */
function weekRadioChange(current: string) {
  switch (current) {
    case '1':
      cron.value.week = '*'
      break
    case '2':
      cron.value.week = '?'
      break
    case '3':
      cron.value.week = `${weekStart0.value}-${weekEnd0.value}`
      break
    case '4':
      cron.value.week = `${weekStart1.value}/${weekEnd1.value}`
      break
    case '5':
      cron.value.week = `${weekStart2.value}#${weekEnd2.value}`
      break
    case '6':
      cron.value.week = `${weekStart3.value}L`
      break
    case '7':
      if (weekCheckBox.value.length === 0) {
        cron.value.week = '?'
        return
      }
      cron.value.week = weekCheckBox.value.map(item => item).join(',')
      break
    default:
      return
  }

  /** 修改了周的设置，将秒、分、时的值设置成0 */
  if (cron.value.week !== '*' && cron.value.week !== '?') {
    // 秒
    if (cron.value.second === '*') {
      secondCheckBox.value = [0]
      secondRadio.value = '4'
    }
    // 分
    if (cron.value.minute === '*') {
      minuteCheckBox.value = [0]
      minuteRadio.value = '4'
    }
    // 时
    if (cron.value.hour === '*') {
      hourCheckBox.value = [0]
      hourRadio.value = '4'
    }
  }

  /**
   * cron表达式详解：
   * 问号(?)只能用在DayofMonth和DayofWeek两个域，
   * 由于指定日期(DayofMonth)和指定星期(DayofWeek)存在冲突，
   * 所以当指定了日期(DayofMonth)后（包括每天*），星期(DayofWeek)必须使用问号(?)，
   * 同理，指定星期(DayofWeek)后，日期(DayofMonth)必须使用问号(?)。
   */
  // 指定了星期，且指定了日期，将日期设置为?
  if (cron.value.week !== '?' && cron.value.week !== '?') {
    dayChange('2')
  }
  // 不指定星期，且不指定日期，将日期设置为1
  else if (cron.value.day === '?' && cron.value.week === '?') {
    dayCheckBox.value = [1]
    dayChange('7')
  }

  // input框赋值
  cronInput.value = cronDataToString(cron.value)
}
/** 单选框切换：年 */
function yearRadioChange(current: string) {
  switch (current) {
    case '1':
      cron.value.year = ''
      break
    case '2':
      cron.value.year = '*'
      break
    case '3':
      cron.value.year = `${yearStart0.value}-${yearEnd0.value}`
      break
    default:
      return
  }

  /**
   * cron表达式详解：
   * 问号(?)只能用在DayofMonth和DayofWeek两个域，
   * 由于指定日期(DayofMonth)和指定星期(DayofWeek)存在冲突，
   * 所以当指定了日期(DayofMonth)后（包括每天*），星期(DayofWeek)必须使用问号(?)，
   * 同理，指定星期(DayofWeek)后，日期(DayofMonth)必须使用问号(?)。
   */
  // 指定了星期，且指定了日期，将日期设置为?
  if (cron.value.week !== '?' && cron.value.week !== '?') {
    dayChange('2')
  }
  // 不指定星期，且不指定日期，将日期设置为1
  else if (cron.value.day === '?' && cron.value.week === '?') {
    dayCheckBox.value = [1]
  }

  // input框赋值
  cronInput.value = cronDataToString(cron.value)
}

/** 秒tab中的组件change事件 */
function secondChange(radioValue: string) {
  // 设置radio选中
  secondRadio.value = radioValue
  // 重新计算cron
  secondRadioChange(radioValue)
}
/** 分钟tab中的组件change事件 */
function minuteChange(radioValue: string) {
  // 设置radio选中
  minuteRadio.value = radioValue
  // 重新计算cron
  minuteRadioChange(radioValue)
}
/** 小时tab中的组件change事件 */
function hourChange(radioValue: string) {
  // 设置radio选中
  hourRadio.value = radioValue
  // 重新计算cron
  hourRadioChange(radioValue)
}
/** 天tab中的组件change事件 */
function dayChange(radioValue: string) {
  // 设置radio选中
  dayRadio.value = radioValue
  // 重新计算cron
  dayRadioChange(radioValue)
}
/** 月tab中的组件change事件 */
function monthChange(radioValue: string) {
  // 设置radio选中
  monthRadio.value = radioValue
  // 重新计算cron
  monthRadioChange(radioValue)
}
/** 周tab中的组件change事件 */
function weekChange(radioValue: string) {
  // 设置radio选中
  weekRadio.value = radioValue
  // 重新计算cron
  weekRadioChange(radioValue)
}
/** 年tab中的组件change事件 */
function yearChange(radioValue: string) {
  // 设置radio选中
  yearRadio.value = radioValue
  // 重新计算cron
  yearRadioChange(radioValue)
}

/** 设置cron */
function setCron(cronStr: string) {
  if (!cronStr || cronStr.length === 0 || cronStr.trim().length === 0) {
    cron.value = {
      second: '*',
      minute: '*',
      hour: '*',
      day: '*',
      month: '*',
      week: '?',
      year: '',
    }
  } else {
    const strarr = cronStr.split(' ')
    cron.value = {
      second: strarr[0] ? strarr[0] : '*',
      minute: strarr[1] ? strarr[1] : '*',
      hour: strarr[2] ? strarr[2] : '*',
      day: strarr[3] ? strarr[3] : '*',
      month: strarr[4] ? strarr[4] : '*',
      week: strarr[5] ? strarr[5] : '?',
      year: strarr[6] ? strarr[6] : '',
    }
  }

  // radio数据回显
  radioRender()
}

/** 回显radio数据 */
function radioRender() {
  // 渲染秒tab里的radio
  secondRadioRender()
  // 渲染分钟tab里的radio
  minuteRadioRender()
  // 渲染小时tab里的radio
  hourRadioRender()
  // 渲染天tab里的radio
  dayRadioRender()
  // 渲染月tab里的radio
  monthRadioRender()
  // 渲染周tab里的radio
  weekRadioRender()
  // 渲染年tab里的radio
  yearRadioRender()
}

/** 渲染秒tab里的radio */
function secondRadioRender() {
  const second = cron.value.second
  secondCheckBox.value = []

  if (second === '*') {
    secondRadio.value = '1'
  }
  else if (second.includes('-')) {
    const secondArry = second.split('-')
    if (secondArry.length === 2) {
      const secondStart_num = Number.parseInt(secondArry[0])
      const secondEnd_num = Number.parseInt(secondArry[1])
      secondStart0.value = Number.isNaN(secondStart_num) ? 1 : secondStart_num
      secondEnd0.value = Number.isNaN(secondEnd_num) ? 2 : secondEnd_num
    }
    secondRadio.value = '2'
  }
  else if (second.includes('/')) {
    const secondArry = second.split('/')
    if (secondArry.length === 2) {
      const secondStart_num = Number.parseInt(secondArry[0])
      const secondEnd_num = Number.parseInt(secondArry[1])
      secondStart1.value = Number.isNaN(secondStart_num) ? 0 : secondStart_num
      secondEnd1.value = Number.isNaN(secondEnd_num) ? 1 : secondEnd_num
    }
    secondRadio.value = '3'
  }
  else {
    // 处理 0 or 0,1,2,3 的情况
    const secondArry = second.split(',')
    if (secondArry.length > 0) {
      secondCheckBox.value = secondArry.map((item: string) => Number.parseInt(item))
    }
    secondRadio.value = '4'
  }
}
/** 渲染分钟tab里的radio */
function minuteRadioRender() {
  const minute = cron.value.minute
  minuteCheckBox.value = []

  if (minute === '*') {
    minuteRadio.value = '1'
  }
  else if (minute.includes('-')) {
    const minuteArry = minute.split('-')
    if (minuteArry.length === 2) {
      const minuteStart_num = Number.parseInt(minuteArry[0])
      const minuteEnd_num = Number.parseInt(minuteArry[1])
      minuteStart0.value = Number.isNaN(minuteStart_num) ? 1 : minuteStart_num
      minuteEnd0.value = Number.isNaN(minuteEnd_num) ? 2 : minuteEnd_num
    }
    minuteRadio.value = '2'
  }
  else if (minute.includes('/')) {
    const minuteArry = minute.split('/')
    if (minuteArry.length === 2) {
      const minuteStart_num = Number.parseInt(minuteArry[0])
      const minuteEnd_num = Number.parseInt(minuteArry[1])
      minuteStart1.value = Number.isNaN(minuteStart_num) ? 0 : minuteStart_num
      minuteEnd1.value = Number.isNaN(minuteEnd_num) ? 1 : minuteEnd_num
    }
    minuteRadio.value = '3'
  }
  else {
    // 处理 0 or 0,1,2,3 的情况
    const minuteArry = minute.split(',')
    if (minuteArry.length > 0) {
      minuteCheckBox.value = minuteArry.map((item: string) => Number.parseInt(item))
    }
    minuteRadio.value = '4'
  }
}
/** 渲染小时tab里的radio */
function hourRadioRender() {
  const hour = cron.value.hour
  hourCheckBox.value = []

  if (hour === '*') {
    hourRadio.value = '1'
  }
  else if (hour.includes('-')) {
    const hourArry = hour.split('-')
    if (hourArry.length === 2) {
      const hourStart_num = Number.parseInt(hourArry[0])
      const hourEnd_num = Number.parseInt(hourArry[1])
      hourStart0.value = Number.isNaN(hourStart_num) ? 0 : hourStart_num
      hourEnd0.value = Number.isNaN(hourEnd_num) ? 2 : hourEnd_num
    }
    hourRadio.value = '2'
  }
  else if (hour.includes('/')) {
    const hourArry = hour.split('/')
    if (hourArry.length === 2) {
      const hourStart_num = Number.parseInt(hourArry[0])
      const hourEnd_num = Number.parseInt(hourArry[1])
      hourStart1.value = Number.isNaN(hourStart_num) ? 0 : hourStart_num
      hourEnd1.value = Number.isNaN(hourEnd_num) ? 1 : hourEnd_num
    }
    hourRadio.value = '3'
  }
  else {
    // 处理 0 or 0,1,2,3 的情况
    const hourArry = hour.split(',')
    if (hourArry.length > 0) {
      hourCheckBox.value = hourArry.map((item: string) => Number.parseInt(item))
    }
    hourRadio.value = '4'
  }
}
/** 渲染天tab里的radio */
function dayRadioRender() {
  const day = cron.value.day
  dayCheckBox.value = []
  if (day === '*') {
    dayRadio.value = '1'
  }
  else if (day === '?') {
    dayRadio.value = '2'
  }
  else if (day.includes('-')) {
    const dayArry = day.split('-')
    if (dayArry.length === 2) {
      const dayStart_num = Number.parseInt(dayArry[0])
      const dayEnd_num = Number.parseInt(dayArry[1])
      dayStart0.value = Number.isNaN(dayStart_num) ? 1 : dayStart_num
      dayEnd0.value = Number.isNaN(dayEnd_num) ? 2 : dayEnd_num
    }
    dayRadio.value = '3'
  }
  else if (day.includes('/')) {
    const dayArry = day.split('/')
    if (dayArry.length === 2) {
      const dayStart_num = Number.parseInt(dayArry[0])
      const dayEnd_num = Number.parseInt(dayArry[1])
      dayStart1.value = Number.isNaN(dayStart_num) ? 1 : dayStart_num
      dayEnd1.value = Number.isNaN(dayEnd_num) ? 1 : dayEnd_num
    }
    dayRadio.value = '4'
  }
  else if (day.includes('W')) {
    const dayArry = day.split('W')
    if (dayArry.length === 1) {
      const dayStart_num = Number.parseInt(dayArry[0])
      dayStart2.value = Number.isNaN(dayStart_num) ? 1 : dayStart_num
    }
    dayRadio.value = '5'
  }
  else if (day === 'L') {
    dayRadio.value = '6'
  }
  else {
    // 处理 0 or 0,1,2,3 的情况
    const dayArry = day.split(',')
    if (dayArry.length > 0) {
      dayCheckBox.value = dayArry.map((item: string) => Number.parseInt(item))
    }
    dayRadio.value = '7'
  }
}
/** 渲染月tab里的radio */
function monthRadioRender() {
  const month = cron.value.month
  monthCheckBox.value = []

  if (month === '*') {
    monthRadio.value = '1'
  }
  else if (month.includes('-')) {
    const monthArry = month.split('-')
    if (monthArry.length === 2) {
      // 处理月份。 英文 -> 数字
      const monthStart_num = monthMap[monthArry[0]] ? Number.parseInt(monthMap[monthArry[0]]) : Number.parseInt(monthArry[0])
      const monthEnd_num = monthMap[monthArry[1]] ? Number.parseInt(monthMap[monthArry[1]]) : Number.parseInt(monthArry[1])
      monthStart0.value = Number.isNaN(monthStart_num) ? 1 : monthStart_num
      monthEnd0.value = Number.isNaN(monthEnd_num) ? 2 : monthEnd_num
    }
    monthRadio.value = '2'
  }
  else if (month.includes('/')) {
    const monthArry = month.split('/')
    if (monthArry.length === 2) {
      // 处理月份。 英文 -> 数字
      const monthStart_num = monthMap[monthArry[0]] ? Number.parseInt(monthMap[monthArry[0]]) : Number.parseInt(monthArry[0])
      const monthEnd_num = monthMap[monthArry[1]] ? Number.parseInt(monthMap[monthArry[1]]) : Number.parseInt(monthArry[1])
      monthStart1.value = Number.isNaN(monthStart_num) ? 1 : monthStart_num
      monthEnd1.value = Number.isNaN(monthEnd_num) ? 1 : monthEnd_num
    }
    monthRadio.value = '3'
  }
  else {
    // 处理 0 or 0,1,2,3 的情况
    const monthArry = month.split(',')
    if (monthArry.length > 0) {
      // 处理月份。 英文 -> 数字
      const numberMonthArry = monthArry.map((item: string) => {
        return monthMap[item] ? Number.parseInt(monthMap[item]) : Number.parseInt(item)
      })
      monthCheckBox.value = numberMonthArry
    }
    monthRadio.value = '4'
  }
}
/** 渲染周tab里的radio */
function weekRadioRender() {
  const week = cron.value.week
  weekCheckBox.value = []

  if (week === '*') {
    weekRadio.value = '1'
  }
  else if (week === '?') {
    weekRadio.value = '2'
  }
  else if (week.includes('-')) {
    const weekArry = week.split('-')
    if (weekArry.length === 2) {
      // 处理周。 英文 -> 数字
      const weekStart_num = weekMap[weekArry[0]] ? Number.parseInt(weekMap[weekArry[0]]) : Number.parseInt(weekArry[0])
      const weekEnd_num = weekMap[weekArry[1]] ? Number.parseInt(weekMap[weekArry[1]]) : Number.parseInt(weekArry[1])
      weekStart0.value = Number.isNaN(weekStart_num) ? 1 : weekStart_num
      weekEnd0.value = Number.isNaN(weekEnd_num) ? 2 : weekEnd_num
    }
    weekRadio.value = '3'
  }
  else if (week.includes('/')) {
    const weekArry = week.split('/')
    if (weekArry.length === 2) {
      // 处理周。 英文 -> 数字
      const weekStart_num = weekMap[weekArry[0]] ? Number.parseInt(weekMap[weekArry[0]]) : Number.parseInt(weekArry[0])
      const weekEnd_num = Number.parseInt(weekArry[1]) // 特殊判断：weekEnd1的取值范围是1-n天，而不是周几
      weekStart1.value = Number.isNaN(weekStart_num) ? 1 : weekStart_num
      weekEnd1.value = Number.isNaN(weekEnd_num) ? 1 : weekEnd_num
    }
    weekRadio.value = '4'
  }
  else if (week.includes('#')) {
    const weekArry = week.split('#')
    if (weekArry.length === 2) {
      // 处理周。 英文 -> 数字
      const weekStart_num = weekMap[weekArry[0]] ? Number.parseInt(weekMap[weekArry[0]]) : Number.parseInt(weekArry[0])
      const weekEnd_num = Number.parseInt(weekArry[1]) // 特殊判断：weekEnd2的取值范围是1-4周，而不是周几
      weekStart2.value = Number.isNaN(weekStart_num) ? 1 : weekStart_num
      weekEnd2.value = Number.isNaN(weekEnd_num) ? 1 : weekEnd_num
    }
    weekRadio.value = '5'
  }
  else if (week.includes('L')) {
    const weekArry = week.split('L')
    if (weekArry.length === 1) {
      // 处理周。 英文 -> 数字
      const weekStart_num = weekMap[weekArry[0]] ? Number.parseInt(weekMap[weekArry[0]]) : Number.parseInt(weekArry[0])
      weekStart3.value = Number.isNaN(weekStart_num) ? 1 : weekStart_num
    }
    weekRadio.value = '6'
  }
  else {
    // 处理 0 or 0,1,2,3 的情况
    const weekArry = week.split(',')
    if (weekArry.length > 0) {
      // 处理周。 英文 -> 数字
      const numberWeekArry = weekArry.map((item: string) => {
        return weekMap[item] ? Number.parseInt(weekMap[item]) : Number.parseInt(item)
      })
      weekCheckBox.value = numberWeekArry
    }
    weekRadio.value = '7'
  }
}
/** 渲染年tab里的radio */
function yearRadioRender() {
  const year = cron.value.year
  if (!year) {
    yearRadio.value = '1'
  }
  else if (year === '*') {
    yearRadio.value = '2'
  }
  else if (year.includes('-')) {
    const yearArry = year.split('-')
    if (yearArry.length === 2) {
      const yearStart_num = Number.parseInt(yearArry[0])
      const yearEnd_num = Number.parseInt(yearArry[1])
      yearStart0.value = Number.isNaN(yearStart_num) ? nowYear.value : yearStart_num
      yearEnd0.value = Number.isNaN(yearEnd_num) ? nextYear.value : yearEnd_num
    }
    yearRadio.value = '3'
  }
}

/** cron数据转字符串 */
function cronDataToString(cron: CronData) {
  return `${cron.second} ${cron.minute} ${cron.hour} ${cron.day} ${cron.month} ${cron.week} ${cron.year}`
}

/** 运行cron表达式 */
function cronExecute(cron: string) {
  if (!cron) {
    executeResult.value = []
    executeError.value = ''
    return
  }

  cron = cron.trim()

  // 获取下次执行时间
  nextTriggerTimeApi({ cron })
    .then((res: ApiResult<string[]>) => {
      const success = res.success
      const data = res.data
      if (!success) {
        executeError.value = 'cron表达式错误'
        executeResult.value = []
        return
      }

      executeResult.value = data
    })
    .catch((e) => {
      console.error(e)
    })
}

watch(
  () => props.modelValue,
  (cronStr) => {
    if (cronStr) {
      cronInput.value = cronStr
      // tab数据回显
      setCron(cronStr)
    }
  },
)
watch(
  () => cronInput.value,
  () => {
    emit('update:modelValue', cronInput.value)
  },
)
</script>

<template>
  <div style="width: 100%">
    <el-dropdown
      placement="bottom" popper-class="cron-dropdown" style="width: 100%;" :max-height="'300px'" :auto-fit-width="true" :update-at-scroll="true" :auto-fit-position="true" :popper-options="{
        modifiers: [
          {
            name: 'offset',
            options: {
              offset: [0, 0],
            },
          },
        ],
      }"
      @visible-change="(val) => { val ? '' : cronInput = cronDataToString(cron) }"
    >
      <el-input v-model="cronInput" :placeholder="placeholder" :clearable="clearable" :validate-event="validateEvent" @change="cronInputChange" @clear="() => cronInputChange('')" />
      <template #dropdown>
        <div class="content">
          <el-tabs v-model="tabId" type="border-card">
            <!-- 秒 tab -->
            <el-tab-pane name="1" label="秒">
              <el-radio-group v-model="secondRadio" name="second" @change="(val: any) => secondRadioChange(val as string)">
                <div><el-radio value="1">每秒 允许的通配符[, - * /]</el-radio></div>
                <div>
                  <el-radio value="2">
                    周期 从
                    <input v-model="secondStart0" type="number" :min="0" :max="59" @change="secondChange('2')">
                    秒开始 -
                    <input v-model="secondEnd0" type="number" :min="0" :max="59" @change="secondChange('2')">
                    秒结束
                  </el-radio>
                </div>
                <div>
                  <el-radio value="3">
                    从
                    <input v-model="secondStart1" type="number" :min="0" :max="59" @change="secondChange('3')">
                    秒开始，每
                    <input v-model="secondEnd1" type="number" :min="0" :max="59" @change="secondChange('3')">
                    秒执行一次
                  </el-radio>
                </div>
                <div><el-radio value="4">指定</el-radio></div>
                <div style="margin-left: 5px;">
                  <el-checkbox-group v-model="secondCheckBox">
                    <el-checkbox v-for="item in secondAndMinuteRange" :key="item" name="second_num" skin="primary" :value="item">{{ item < 10 ? `0${item}` : item }}</el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-radio-group>
            </el-tab-pane>

            <!-- 分钟 tab -->
            <el-tab-pane name="2" label="分钟">
              <el-radio-group v-model="minuteRadio" name="minute" @change="(val: any) => minuteRadioChange(val as string)">
                <div><el-radio value="1">分钟 允许的通配符[, - * /]</el-radio></div>
                <div>
                  <el-radio value="2">
                    周期 从
                    <input v-model="minuteStart0" type="number" :min="0" :max="59" @change="minuteChange('2')">
                    分钟开始 -
                    <input v-model="minuteEnd0" type="number" :min="0" :max="59" @change="minuteChange('2')">
                    分钟结束
                  </el-radio>
                </div>
                <div>
                  <el-radio value="3">
                    从
                    <input v-model="minuteStart1" type="number" :min="0" :max="59" @change="minuteChange('3')">
                    分钟开始，每
                    <input v-model="minuteEnd1" type="number" :min="0" :max="59" @change="minuteChange('3')">
                    分钟执行一次
                  </el-radio>
                </div>
                <div><el-radio value="4">指定</el-radio></div>
                <div style="margin-left: 5px;">
                  <el-checkbox-group v-model="minuteCheckBox">
                    <el-checkbox v-for="item in secondAndMinuteRange" :key="item" name="minute_num" skin="primary" :value="item">{{ item < 10 ? `0${item}` : item }}</el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-radio-group>
            </el-tab-pane>

            <!-- 小时 tab -->
            <el-tab-pane name="3" label="小时">
              <el-radio-group v-model="hourRadio" name="hour" @change="(val: any) => hourRadioChange(val as string)">
                <div><el-radio value="1">小时 允许的通配符[, - * /]</el-radio></div>
                <div>
                  <el-radio value="2">
                    周期 从
                    <input v-model="hourStart0" type="number" :min="0" :max="23" @change="hourChange('2')">
                    时开始 -
                    <input v-model="hourEnd0" type="number" :min="0" :max="23" @change="hourChange('2')">
                    时结束
                  </el-radio>
                </div>
                <div>
                  <el-radio value="3">
                    从
                    <input v-model="hourStart1" type="number" :min="0" :max="23" @change="hourChange('3')">
                    小时开始，每
                    <input v-model="hourEnd1" type="number" :min="0" @change="hourChange('3')">
                    小时执行一次
                  </el-radio>
                </div>
                <div><el-radio value="4">指定</el-radio></div>
                <div style="margin-left: 5px;">
                  <el-checkbox-group v-model="hourCheckBox">
                    <el-checkbox v-for="item in hourRange" :key="item" name="hour_num" skin="primary" :value="item">{{ item < 10 ? `0${item}` : item }}</el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-radio-group>
            </el-tab-pane>

            <!-- 日 tab -->
            <el-tab-pane name="4" label="日">
              <el-radio-group v-model="dayRadio" name="day" @change="(val: any) => dayRadioChange(val as string)">
                <div><el-radio value="1">日 允许的通配符[, - * ? / L W]</el-radio></div>
                <div><el-radio value="2">不指定</el-radio></div>
                <div>
                  <el-radio value="3">
                    周期 从
                    <input v-model="dayStart0" type="number" :min="1" :max="31" @change="dayChange('3')">
                    日开始 -
                    <input v-model="dayEnd0" type="number" :min="1" :max="31" @change="dayChange('3')">
                    日结束
                  </el-radio>
                </div>
                <div>
                  <el-radio value="4">
                    从
                    <input v-model="dayStart1" type="number" :min="1" :max="31" @change="dayChange('4')">
                    日开始，每
                    <input v-model="dayEnd1" type="number" :min="1" :max="31" @change="dayChange('4')">
                    日执行一次
                  </el-radio>
                </div>
                <div>
                  <el-radio value="5">
                    每月
                    <input v-model="dayStart2" type="number" :min="1" :max="31">
                    号最近的那个工作日
                  </el-radio>
                </div>
                <div><el-radio value="6">每月最后一天</el-radio></div>
                <div><el-radio value="7">指定</el-radio></div>
                <div style="margin-left: 5px;">
                  <el-checkbox-group v-model="dayCheckBox">
                    <el-checkbox v-for="item in dayRange" :key="item" name="day_num" skin="primary" :value="item">{{ item < 10 ? `0${item}` : item }}</el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-radio-group>
            </el-tab-pane>

            <!-- 月 tab -->
            <el-tab-pane name="5" label="月">
              <el-radio-group v-model="monthRadio" name="month" @change="(val: any) => monthRadioChange(val as string)">
                <div><el-radio value="1">月 允许的通配符[, - * /]</el-radio></div>
                <div>
                  <el-radio value="2">
                    周期 从
                    <input v-model="monthStart0" type="number" :min="1" :max="12" @change="monthChange('3')">
                    月开始 -
                    <input v-model="monthEnd0" type="number" :min="1" :max="12" @change="monthChange('3')">
                    月结束
                  </el-radio>
                </div>
                <div>
                  <el-radio value="3">
                    从
                    <input v-model="monthStart1" type="number" :min="1" :max="12" @change="monthChange('4')">
                    月开始，每
                    <input v-model="monthEnd1" type="number" :min="1" :max="12" @change="monthChange('4')">
                    月执行一次
                  </el-radio>
                </div>
                <div><el-radio value="4">指定</el-radio></div>
                <div style="margin-left: 5px;">
                  <el-checkbox-group v-model="monthCheckBox">
                    <el-checkbox v-for="item in monthRange" :key="item" name="month_num" skin="primary" :value="item">{{ item < 10 ? `0${item}` : item }}</el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-radio-group>
            </el-tab-pane>

            <!-- 周 tab -->
            <el-tab-pane name="6" label="周">
              <el-radio-group v-model="weekRadio" name="week" @change="(val: any) => weekRadioChange(val as string)">
                <div><el-radio value="1">周 允许的通配符[, - * ? / L #]</el-radio></div>
                <div><el-radio value="2">不指定</el-radio></div>
                <div>
                  <el-radio value="3">
                    周期 从星期
                    <input v-model="weekStart0" type="number" :min="1" :max="7" @change="weekChange('3')">
                    开始 - 星期
                    <input v-model="weekEnd0" type="number" :min="1" :max="7" @change="weekChange('3')">
                    结束
                  </el-radio>
                </div>
                <div>
                  <el-radio value="4">
                    从星期
                    <input v-model="weekStart1" type="number" :min="1" :max="7" @change="weekChange('4')">
                    开始，间隔
                    <input v-model="weekEnd1" type="number" :min="1" @change="weekChange('4')">
                    天执行一次
                  </el-radio>
                </div>
                <div>
                  <el-radio value="5">
                    <!-- 6#3：表示第3周的星期5 -->
                    第
                    <input v-model="weekEnd2" type="number" :min="1" :max="4" @change="weekChange('5')">
                    周 的星期
                    <input v-model="weekStart2" type="number" :min="1" :max="7" @change="weekChange('5')">
                    （7=星期六，1=星期日，以此类推）
                  </el-radio>
                </div>
                <div>
                  <el-radio value="6">
                    本月最后一个星期
                    <input v-model="weekStart3" type="number" :min="1" :max="7" @change="weekChange('6')">
                  </el-radio>
                </div>
                <div><el-radio value="7">指定</el-radio></div>
                <div style="margin-left: 5px;">
                  <el-checkbox-group v-model="weekCheckBox">
                    <el-checkbox v-for="item in weekRange" :key="item" name="week_num" skin="primary" :value="item">{{ item }}</el-checkbox>
                  </el-checkbox-group>
                </div>
              </el-radio-group>
            </el-tab-pane>

            <!-- 年 tab -->
            <el-tab-pane name="7" label="年">
              <el-radio-group v-model="yearRadio" name="year" @change="(val: any) => yearRadioChange(val as string)">
                <div><el-radio value="1">不指定 允许的通配符[, - * /] 非必填</el-radio></div>
                <div><el-radio value="2">每年</el-radio></div>
                <div>
                  <el-radio value="3">
                    周期 从
                    <input v-model="yearStart0" type="number" :min="1970" @change="yearChange('3')">
                    年开始 -
                    <input v-model="yearEnd0" type="number" :min="1970" @change="yearChange('3')">
                    年结束
                  </el-radio>
                </div>
              </el-radio-group>
            </el-tab-pane>

            <!-- 说明 tab -->
            <el-tab-pane name="8">
              <template #label>
                <div style="color: var(--el-color-primary)">
                  说明
                </div>
              </template>
              <div class="tab-item">
                <p class="title">常用cron表达式例子:</p>
                <div class="item-content">
                  <p v-for="item in cronDescription" :key="item.cron" class="container">
                    <span @click="() => { setCron(item.cron); cronExecute(item.cron) }">{{ item.cron }}</span>
                    <span>{{ item.description }}</span>
                  </p>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>

          <div class="preview-container">
            <table class="cron-table">
              <thead>
                <tr>
                  <th>秒</th>
                  <th>分</th>
                  <th>时</th>
                  <th>日</th>
                  <th>月</th>
                  <th>周</th>
                  <th>年</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ cron.second }}</td>
                  <td>{{ cron.minute }}</td>
                  <td>{{ cron.hour }}</td>
                  <td>{{ cron.day }}</td>
                  <td>{{ cron.month }}</td>
                  <td>{{ cron.week }}</td>
                  <td>{{ cron.year }}</td>
                </tr>
              </tbody>
            </table>
            <p class="preview-title">
              最近几次运行时间:
              <el-button type="primary" size="small" style="margin-left: 5px;" @click="cronExecute(cronDataToString(cron))">
                获取
              </el-button>
            </p>
            <div v-if="executeError !== ''">
              <span class="error">{{ executeError }}</span>
            </div>
            <div class="preview">
              <div v-for="item in executeResult" :key="item">{{ item }}</div>
            </div>
          </div>
        </div>
      </template>
    </el-dropdown>
  </div>
</template>

<style scoped>
.content {
  width: 600px;
  padding: 10px;
  overflow: auto;
}
.tab-item {
  max-height: 230px;
}

.title {
  font-size: 14px;
  font-weight: bold;
  margin-bottom: 0;
}

.item-content {
  height: 200px;
  overflow: auto;
}
.item-content::-webkit-scrollbar {
  width: 0;
}

.container {
  display: flex;
  height: 10px;
  font-size: 14px;
}
.container span:first-child {
  flex: 0 0 35%;
  color: var(--el-color-primary);
  cursor: pointer;
}
.container span:last-child {
  flex: 1;
}

.preview-container {
  margin-top: 5px;
}

.cron-table {
  border-collapse: collapse;
  width: 100%;
  margin-bottom: 5px;
}
.cron-table th, td {
  border: 1px solid var(--el-border-color);
  padding: 8px;
  text-align: center;
}

.preview-title {
  margin-bottom: 5px;
  font-weight: bold
}

.preview {
  display: flex;
  flex-wrap: wrap;
  padding-left: 10px;
  line-height: 18px;
  height: 54px;
}

.preview div {
  flex: 1 0 50%;
}

.error {
  font-size: 14px;
  color: var(--el-color-danger);
}

/** tab样式修改 */
:deep(.el-tabs--border-card>.el-tabs__content) {
  padding: 0;
  padding-left: 8px;
}

/** radio样式修改 */
.el-radio-group {
  display: block;
  padding: 8px 0;
}
.el-radio {
  height: 20px;
}

/** 数字输入框样式修改 */
input[type=number] {
  width: 62px;
  height: 20px;
  line-height: 20px;
  text-align: center;
  display: inline-block;
  border: 1px solid var(--el-border-color);
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
}

/** checkbox样式修改 */
.el-checkbox {
  height: 20px;
  margin-right: 10px;
}
:deep(.el-checkbox > .el-checkbox__label) {
  padding-left: 4px;
}
</style>
