<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { SelectOption } from '~/types/extra/select'
import type {
  Calendar, DailyTime, DaysOfWeek,
  JobSaveOrUpdateParam, QuartzJobDetailDTO, ScheduleType,
  Simple,
} from '~/types/job/job'
import { cloneDeep } from '@pureadmin/utils'
import { convertCalendarWeek } from '~/utils/convert'
import CronSelect from './cron-select.vue'
import KvTable from './kv-table.vue'

const props = withDefaults(defineProps<{
  visible: boolean
  /** 任务执行类 */
  jobClassOptions?: SelectOption[]
  /** 修改时必传，任务信息 */
  data?: QuartzJobDetailDTO
}>(), {
  visible: false,
})

const emit = defineEmits<{
  (e: 'done'): void
  (e: 'update:visible', visible: boolean): void
}>()

const show = computed({
  get() {
    return props.visible
  },
  set(val: boolean) {
    emit('update:visible', val)
  },
})

// 设置为false,代表输入时不进行表单校验，只有提交时才进行表单校验
const validateEvent = ref<boolean>(false)

const refForm = ref()
const kvTable = ref()
// 是否修改弹窗
const isUpdate = ref(false)
// 时间范围
const timeRange = ref<string[]>(['00:00:00', '12:00:00'])
// 表单数据
const baseFormData = {
  jobName: '',
  jobDescription: undefined,
  jobClassName: '',
  jobParam: undefined,
  priority: 0,
  scheduleType: 'CRON' as ScheduleType,
  cron: '',
  calendar: {
    timeInterval: 1,
    unit: 'SECOND',
  } as Calendar,
  dailyTime: {
    type: 'EveryDay',
    daysOfWeek: [],
    timeInterval: 1,
    unit: undefined,
    startTime: undefined,
    endTime: undefined,
  } as DailyTime,
  simple: {
    unit: 'SECONDS',
    timeInterval: 1,
    repeatCount: undefined,
    repeatForever: false,
  } as Simple,
}
const form = reactive<JobSaveOrUpdateParam>({ ...baseFormData })
// 表单校验规则
const rules = ref<FormRules<JobSaveOrUpdateParam>>({
  jobName: { type: 'string', required: true, message: '任务名称不能为空' },
  jobClassName: { type: 'string', required: true, message: '任务执行类不能为空' },
  scheduleType: { type: 'string', required: true, message: '调度类型不能为空' },
})

/** 初始化表单数据 */
function initData() {
  if (props.data) {
    isUpdate.value = true
    const timeRangeArr = timeParse(props.data.strProp3)
    let weekArr = weekParse(props.data.strProp2)
    let dailyTimeUnit = props.data.strProp1

    form.jobName = props.data.jobName || ''
    form.jobDescription = props.data.jobDescription || ''
    form.jobClassName = props.data.jobClassName || ''
    form.jobParam = props.data.jobParam || ''
    form.priority = props.data.priority || 0

    // 设置调度类型
    form.scheduleType = props.data.triggerType || 'CRON'
    if (form.scheduleType !== 'DAILY_I') {
      weekArr = []
      dailyTimeUnit = ''
    }
    // 设置调度类型为CAL_INT时的参数
    form.calendar = {
      timeInterval: props.data.intProp1 || 1,
      unit: props.data.strProp1 || 'SECOND' as any,
    }
    // 设置调度类型为DAILY_TIME时的参数
    form.dailyTime = {
      type: 'DaysOfTheWeek',
      daysOfWeek: weekArr as unknown as DaysOfWeek[],
      timeInterval: props.data.intProp1 || 1,
      unit: dailyTimeUnit || 'SECOND' as any,
      startTime: timeRangeArr[0],
      endTime: timeRangeArr[1],
    }
    // 设置调度类型为SIMPLE时的参数
    form.simple = {
      unit: 'MILLISECONDS',
      timeInterval: props.data.simpleRepeatInterval || 1,
      repeatCount: props.data.simpleRepeatCount,
      repeatForever: props.data.simpleRepeatCount === -1,
    }
    // 设置调度类型为CRON时的参数
    form.cron = props.data.cron || ''

    // 初始化时间范围
    if (form.dailyTime.startTime) {
      timeRange.value[0] = form.dailyTime.startTime
    }
    if (form.dailyTime.endTime) {
      timeRange.value[1] = form.dailyTime.endTime
    }

    // 设置任务参数
    kvTable.value.setTableData(props.data.jobParam)
  } else {
    Object.assign(form, baseFormData)
    isUpdate.value = false
  }
}

/**
 * 时间解析
 *
 * 说明：
 * 将5,0,0,10,20,0 转换成 [05:00:00,10:20:00]
 * @param strProp2
 */
function timeParse(strProp2?: string) {
  if (!strProp2) return []

  // 5,0,0,1,2,3 => [5,0,0,1,2,3]
  const timeArr = strProp2.split(',')
  if (timeArr.length !== 6) return []

  const startHour = timeArr[0].length < 2 ? `0${timeArr[0]}` : timeArr[0]
  const startMinute = timeArr[1].length < 2 ? `0${timeArr[1]}` : timeArr[1]
  const startSecond = timeArr[2].length < 2 ? `0${timeArr[2]}` : timeArr[2]
  const endHour = timeArr[3].length < 2 ? `0${timeArr[3]}` : timeArr[3]
  const endMinute = timeArr[4].length < 2 ? `0${timeArr[4]}` : timeArr[4]
  const endSecond = timeArr[5].length < 2 ? `0${timeArr[5]}` : timeArr[5]
  return [`${startHour}:${startMinute}:${startSecond}`, `${endHour}:${endMinute}:${endSecond}`]
}

/**
 * 周解析
 * 说明：
 * 将1,2,3 转换成 ['SUNDAY', 'MONDAY', 'TUESDAY']
 * @param strProp1
 */
function weekParse(strProp1?: string) {
  if (!strProp1) return []

  const weekArr = strProp1.split(',')
  return weekArr.map((item) => {
    return convertCalendarWeek(item, false)
  })
}

/** 时间组件Change事件处理 */
function timeRangeChange() {
  form.dailyTime.startTime = timeRange.value[0]
  form.dailyTime.endTime = timeRange.value[1]
}

/** 关闭弹窗 */
function handleClose() {
  // 关闭弹窗
  show.value = false

  // 重置表单数据，并移除校验结果
  refForm.value?.resetFields()
}

/** 保存数据 */
async function saveData(model: JobSaveOrUpdateParam, close: () => void) {
  try {
    // 创建任务
    const { success, message } = await addJobApi({
      ...cloneDeep(model) as JobSaveOrUpdateParam,
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭弹窗
    handleClose()
    // 关闭loading
    close()
  } catch (e) {
    toastError((e as Error).message)
  }
}

/** 修改数据 */
async function updateData(model: JobSaveOrUpdateParam, close: () => void) {
  try {
    // 修改任务
    const { success, message } = await updateJobApi({
      ...cloneDeep(model) as JobSaveOrUpdateParam,
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭弹窗
    handleClose()
    // 关闭loading
    close()
  } catch (e) {
    toastError((e as Error).message)
  }
}

/** 表单提交 */
function handleSubmit() {
  refForm.value.validate(async (isValidate: boolean, _errors: any) => {
    if (!isValidate) return
    const model = cloneDeep(form)

    // 获取任务参数
    model.jobParam = kvTable.value.getTableData()

    loadingMsg('正在提交数据...', async (close) => {
      try {
        isUpdate.value
          ? await updateData(model, close)
          : await saveData(model, close)
        emit('done')
      } catch {}
    })
  })
}

watch(
  () => props.visible,
  (visible: boolean) => {
    if (visible) {
      nextTick(() => {
        // 初始化弹窗数据
        initData()
      })
    }
  },
)
</script>

<template>
  <el-dialog
    v-model="show"
    :title="isUpdate ? '编辑' : '新增'"
    draggable
    destroy-on-close
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    @before-close="handleClose"
  >
    <template #footer>
      <el-space>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSubmit">提交</el-button>
      </el-space>
    </template>

    <el-form ref="refForm" :model="form" :rules="rules" label-width="100px" style="max-height: 400px; overflow-y: auto;">
      <el-divider content-position="left">基本配置</el-divider>
      <el-row ::gutter="15">
        <!-- 左 -->
        <el-col :md="12">
          <el-form-item label="任务名称" prop="jobName" required>
            <el-input v-model="form.jobName" placeholder="请填写" clearable :disabled="isUpdate" :validate-event="validateEvent" />
          </el-form-item>
        </el-col>
        <!-- 右 -->
        <el-col :md="12" style="padding-left: 25px;">
          <el-form-item label="触发器优先级" prop="priority">
            <el-input-number v-model="form.priority" placeholder="请填写" clearable :validate-event="validateEvent" />
          </el-form-item>
        </el-col>
        <!-- 下 -->
        <el-col :md="24">
          <el-form-item label="任务描述" prop="jobDescription">
            <el-input v-model="form.jobDescription" type="textarea" placeholder="请填写" clearable resize="none" :validate-event="validateEvent" />
          </el-form-item>
        </el-col>
      </el-row>

      <el-divider content-position="left">调度配置</el-divider>
      <el-form-item label="调度类型" prop="jobClassName" required>
        <el-select v-model="form.scheduleType" placeholder="请选择" clearable :validate-event="validateEvent">
          <el-option value="CRON" label="CRON" />
          <el-option value="CAL_INT" label="CAL_INT" />
          <el-option value="DAILY_I" label="DAILY_I" />
          <el-option value="SIMPLE" label="SIMPLE" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'CRON'" label="cron表达式" prop="cron" :required="form.scheduleType === 'CRON'">
        <CronSelect v-model="form.cron" placeholder="请填写" clearable :validate-event="validateEvent" />
      </el-form-item>

      <el-form-item v-if="form.scheduleType === 'CAL_INT'" label="间隔单位" prop="calendar.unit" :required="form.scheduleType === 'CAL_INT'">
        <el-select v-model="form.calendar.unit" placeholder="请选择" clearable :validate-event="validateEvent">
          <el-option value="MILLISECOND" label="毫秒" />
          <el-option value="SECOND" label="秒" />
          <el-option value="MINUTE" label="分钟" />
          <el-option value="HOUR" label="小时" />
          <el-option value="DAY" label="日" />
          <el-option value="WEEK" label="周" />
          <el-option value="MONTH" label="月" />
          <el-option value="YEAR" label="年" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'CAL_INT'" label="间隔时间" prop="calendar.timeInterval" :required="form.scheduleType === 'CAL_INT'">
        <el-input-number v-model="form.calendar.timeInterval" :min="1" placeholder="请填写" clearable :validate-event="validateEvent" />
      </el-form-item>

      <el-form-item v-if="form.scheduleType === 'DAILY_I'" label="执行类型" prop="dailyTime.type" :required="form.scheduleType === 'DAILY_I'">
        <el-select v-model="form.dailyTime.type" placeholder="请选择" clearable :validate-event="validateEvent">
          <el-option value="EveryDay" label="每天" />
          <el-option value="MondayThroughFriday" label="周一至周五" />
          <el-option value="SaturdayAndSunday" label="周六和周日" />
          <el-option value="DaysOfTheWeek" label="自定义" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'DAILY_I'" label="间隔单位" prop="dailyTime.unit">
        <el-select v-model="form.dailyTime.unit" placeholder="请选择" clearable :validate-event="validateEvent">
          <el-option value="SECOND" label="秒" />
          <el-option value="MINUTE" label="分钟" />
          <el-option value="HOUR" label="小时" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'DAILY_I'" label="间隔时间" prop="dailyTime.timeInterval">
        <el-input-number v-model="form.dailyTime.timeInterval" :min="1" placeholder="请填写" clearable :validate-event="validateEvent" />
      </el-form-item>
      <el-form-item
        v-if="form.scheduleType === 'DAILY_I' && form.dailyTime.type === 'DaysOfTheWeek'"
        label="周" prop="dailyTime.daysOfWeek"
        :required="form.scheduleType === 'DAILY_I' && form.dailyTime.type === 'DaysOfTheWeek'"
      >
        <el-select v-model="form.dailyTime.daysOfWeek" placeholder="请选择" multiple clearable :validate-event="validateEvent">
          <el-option value="SUNDAY" label="周日" />
          <el-option value="MONDAY" label="周一" />
          <el-option value="TUESDAY" label="周二" />
          <el-option value="WEDNESDAY" label="周三" />
          <el-option value="THURSDAY" label="周四" />
          <el-option value="FRIDAY" label="周五" />
          <el-option value="SATURDAY" label="周六" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'DAILY_I'" label="时间" prop="dailyTime.startTime">
        <el-time-picker v-model="timeRange" editable is-range range-separator="至" start-placeholder="开始时间" end-placeholder="结束时间" @change="timeRangeChange" />
      </el-form-item>

      <el-form-item v-if="form.scheduleType === 'SIMPLE'" label="间隔单位" prop="simple.unit" :required="form.scheduleType === 'SIMPLE'">
        <el-select v-model="form.simple.unit" placeholder="请选择" clearable :validate-event="validateEvent">
          <el-option value="MILLISECONDS" label="毫秒" />
          <el-option value="SECOND" label="秒" />
          <el-option value="MINUTE" label="分钟" />
          <el-option value="HOUR" label="小时" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'SIMPLE'" label="间隔时间" prop="simple.timeInterval" :required="form.scheduleType === 'SIMPLE'">
        <el-input-number v-model="form.simple.timeInterval" :min="1" placeholder="请填写" clearable :validate-event="validateEvent" />
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'SIMPLE'" label="重复次数" prop="simple.repeatCount">
        <el-input-number v-model="form.simple.repeatCount" placeholder="请填写" clearable :validate-event="validateEvent" />
      </el-form-item>
      <el-form-item v-if="form.scheduleType === 'SIMPLE'" label="是否重复执行" prop="simple.repeatForever">
        <el-radio v-model="form.simple.repeatForever" name="repeatForever" :value="true" label="是" @change="form.simple.repeatCount = -1" />
        <el-radio v-model="form.simple.repeatForever" name="repeatForever" :value="false" label="否" />
      </el-form-item>

      <el-divider content-position="left">任务配置</el-divider>
      <el-form-item label="任务执行类" prop="jobClassName" required>
        <el-select v-model="form.jobClassName" placeholder="请选择" clearable :validate-event="validateEvent">
          <template v-for="jobClass in jobClassOptions" :key="jobClass.value">
            <el-option :value="jobClass.value" :label="jobClass.label" />
          </template>
        </el-select>
      </el-form-item>
      <el-form-item prop="jobParam">
        <template #label>
          <div style="display: flex; align-items: center;">
            任务参数
            <el-tooltip content="重复的键其值将会覆盖">
              <el-icon><i-ep-info-filled /></el-icon>
            </el-tooltip>
          </div>
        </template>
        <KvTable ref="kvTable" style="width: 100%; border-radius: var(--el-border-radius-base);" />
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 0;
}
</style>
