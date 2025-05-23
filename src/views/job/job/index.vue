<script setup lang="ts">
import type { SelectOption } from '~/types/extra/select'
import type { PageParam } from '~/types/global'
import type { JobClassListResult, JobQueryParam, QuartzJobDetailDTO } from '~/types/job/job'
import { convertCalendarWeek, convertIntervalUnit } from '~/utils/convert'
import { columns } from './columns'
import JobEdit from './components/job-edit.vue'
import JobSearchForm from './components/job-search.vue'

defineOptions({
  // 跟路由name保持一致
  name: 'job_index',
})

const { loading, setLoading } = useLoading(true)
const searchForm = ref()
// 表格数据
const dataSource = ref<QuartzJobDetailDTO[]>([])
// 表格工具栏配置
const defaultToolbar = ref<boolean>(true)
// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
})
// 是否显示编辑弹窗
const showEdit = ref(false)
// 当前需要编辑的任务
const current = ref<QuartzJobDetailDTO>()
// 默认分页查询参数
const pageParam: PageParam<JobQueryParam> = { page: 1, limit: 10, sort: 'id', order: 'desc' }
// 任务执行类列表数据
const jobClassOptions = ref<SelectOption[]>()

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<JobQueryParam>) {
  setLoading(true)
  try {
    // 分页查询
    const { success, data } = await pageJobApi({
      ...pageParam,
      ...param,
    })

    if (!success) return

    // 修改分页器的页码、数据总条数
    if (param && param.page) page.value.current = param.page
    page.value.total = Number(data!.count)

    // 表格数据赋值
    dataSource.value = data!.list as unknown as QuartzJobDetailDTO[]
  } catch {
  } finally {
    setLoading(false)
  }
}

/**
 * 获取任务执行类列表
 */
async function getJobClassList() {
  try {
    // 获取任务执行类列表
    const { success, data } = await queryJobClassListApi()
    if (!success) return

    // 回显
    jobClassOptions.value = data!.map((jobClass: JobClassListResult) => ({
      label: jobClass.description,
      value: jobClass.value,
    }))
  } catch {}
}

/** 分页事件 */
function changePage(data: any) {
  // 获取搜索组件查询条件
  const formModel = searchForm.value.formModel

  // 自定义分页查询参数
  const param = {
    ...{ model: formModel },
    ...pageParam,
    page: data.current,
    limit: data.limit,
  } as PageParam<JobQueryParam>

  // 获取表格数据
  fetchTableData(param)
}

/** 排序事件 */
function changeSort(data: any) {
  // 获取搜索组件查询条件
  const formModel = searchForm.value.formModel

  // 自定义分页查询参数
  const param = {
    ...{ model: formModel },
    ...{ page: page.value.current, limit: page.value.limit },
    sort: data.prop,
    order: data.order,
  } as PageParam<JobQueryParam>

  // 获取表格数据
  fetchTableData(param)
}

/** 表单搜索事件 */
function handleSearch(formModel: JobQueryParam) {
  // 自定义分页查询参数
  const param = {
    ...{ model: formModel },
    ...pageParam,
    page: 1,
  } as PageParam<JobQueryParam>

  // 获取表格数据
  fetchTableData(param)
}

/**
 * 时间解析
 *
 * 说明：
 * 将5,0,0,10,20,0 转换成 05:00:00-10:20:00
 * @param strProp2
 */
function timeParse(strProp2: string) {
  if (!strProp2) return ''

  // 5,0,0,1,2,3 => [5,0,0,1,2,3]
  const timeArr = strProp2.split(',')
  if (timeArr.length !== 6) return ''

  const startHour = timeArr[0].length < 2 ? `0${timeArr[0]}` : timeArr[0]
  const startMinute = timeArr[1].length < 2 ? `0${timeArr[1]}` : timeArr[1]
  const startSecond = timeArr[2].length < 2 ? `0${timeArr[2]}` : timeArr[2]
  const endHour = timeArr[3].length < 2 ? `0${timeArr[3]}` : timeArr[3]
  const endMinute = timeArr[4].length < 2 ? `0${timeArr[4]}` : timeArr[4]
  const endSecond = timeArr[5].length < 2 ? `0${timeArr[5]}` : timeArr[5]
  return `${startHour}:${startMinute}:${startSecond}-${endHour}:${endMinute}:${endSecond}`
}

/**
 * 打开编辑弹窗
 * @param row 需要编辑的用户数据。
 */
function openEditModal(row?: QuartzJobDetailDTO) {
  current.value = row
  showEdit.value = true
}

/** 处理：单体删除 */
async function handleDelete(jobName?: string) {
  if (!jobName) {
    toastError('任务名不能为空')
    return
  }

  confirmMsg('确定要删除这条数据吗？', {}, async () => {
    try {
      // 单体删除
      const { success, message } = await deleteJobApi({ jobName })
      if (!success) {
        toastError(message || '操作失败')
        return
      }

      toastSuccess(message || '操作成功')
      // 重新获取表格数据
      fetchTableData()
    } catch (err) {
      notifyError((err as Error).message, '错误')
    }
  })
}

/** 处理：暂停/恢复 */
async function pauseOrResume(triggerState: string, jobName: string) {
  if (triggerState === 'PAUSED') {
    try {
      // 恢复任务
      const { success, message } = await resumeJobApi({ jobName })
      if (!success) {
        toastError(message || '操作失败')
        return
      }

      toastSuccess(message || '操作成功')
      // 重新获取表格数据
      fetchTableData()
    } catch { }
  } else {
    try {
      // 暂停任务
      const { success, message } = await pauseJobApi({ jobName })
      if (!success) {
        toastError(message || '操作失败')
        return
      }

      toastSuccess(message || '操作成功')
      // 重新获取表格数据
      fetchTableData()
    } catch { }
  }
}

/** 处理：立即运行一次 */
async function handlerRunOnce(jobName: string, jobParam?: string) {
  try {
    const { success, message } = await runOnceJobApi({ jobName, jobParam })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 重新获取表格数据
    fetchTableData()
  } catch { }
}

onMounted(() => {
  // 获取任务执行类列表
  getJobClassList()
  // 获取表格数据
  fetchTableData()
})
</script>

<template>
  <div class="z-container">
    <!-- 表格搜索栏 -->
    <el-card shadow="never">
      <JobSearchForm
        ref="searchForm"
        :job-class-options="jobClassOptions"
        @on-search="handleSearch"
      />
    </el-card>

    <!-- 数据表格 -->
    <div class="z-table-box">
      <e-table
        :loading="loading"
        :page="page"
        :columns="columns"
        :data-source="dataSource"
        :default-toolbar="defaultToolbar"
        height="480px"
        @change="changePage"
        @sort-change="changeSort"
      >
        <!-- 工具栏 -->
        <template #toolbar>
          <el-button
            v-any-permission="['task:add', 'task:save']"
            type="primary"
            @click="openEditModal()"
          >
            <el-icon><i-ep-plus /></el-icon>
            新增
          </el-button>
        </template>

        <!-- 操作列 -->
        <template #operator="{ row }">
          <e-action-group size="small">
            <el-button
              v-any-permission="['task:edit', 'task:update']"
              size="small"
              type="primary"
              @click="openEditModal(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'task:delete'"
              size="small"
              type="danger"
              @click="handleDelete(row.jobName)"
            >
              删除
            </el-button>

            <!-- 折叠区域 -->
            <template #dropdown>
              <!-- 暂停、恢复 -->
              <div
                v-any-permission="['task:edit', 'task:update']"
                @click="pauseOrResume(row.triggerState, row.jobName)"
              >
                <span v-if="row.triggerState === 'PAUSED'">恢复</span>
                <span v-else>暂停</span>
              </div>

              <!-- 立即运行一次 -->
              <div
                v-any-permission="['task:edit', 'task:update']"
                @click="handlerRunOnce(row.jobName, row.jobParam)"
              >
                立即运行一次
              </div>
            </template>
          </e-action-group>
        </template>

        <!-- 触发器状态列 -->
        <template #triggerState="{ row }">
          <el-tag v-if="row.triggerState === 'NORMAL'" type="primary" effect="plain">
            运行
          </el-tag>
          <el-tag v-else-if="row.triggerState === 'PAUSED'" type="warning" effect="plain">
            暂停
          </el-tag>
          <el-tag v-else-if="row.triggerState === 'COMPLETE'" type="primary" effect="plain">
            完成
          </el-tag>
          <el-tag v-else-if="row.triggerState === 'ERROR'" type="danger" effect="plain">
            出错
          </el-tag>
          <el-tag v-else-if="row.triggerState === 'BLOCKED'" type="warning" effect="plain">
            阻塞
          </el-tag>
          <el-tag v-else type="danger" effect="plain">
            无效
          </el-tag>
        </template>

        <!-- 触发器类型 -->
        <template #triggerType="{ row }">
          <div v-if="row.triggerType === 'CRON'">
            <div class="trigger-type-title">Cron:</div>
            <div class="trigger-type-content">{{ row.cron }}</div>
          </div>
          <div v-if="row.triggerType === 'CAL_INT'">
            <div class="trigger-type-title">Calendar:</div>
            <div class="trigger-type-content">每{{ convertIntervalUnit(row.strProp1) }}触发{{ row.intProp1 }}次</div>
          </div>
          <div v-if="row.triggerType === 'DAILY_I'">
            <div class="trigger-type-title">DailyTime:</div>
            <div class="trigger-type-content">每周{{ row.strProp2.split(',').map((item: string) => convertCalendarWeek(item)).join('、') }}，{{ timeParse(row.strProp3) || '00:00:00' }}执行，每{{ row.intProp1 }}{{ convertIntervalUnit(row.strProp1) }}触发一次</div>
          </div>
          <div v-if="row.triggerType === 'SIMPLE'">
            <div class="trigger-type-title">Simple:</div>
            <div class="trigger-type-content">
              每{{ row.simpleRepeatInterval }}毫秒触发{{ row.simpleRepeatCount === -1 ? '一' : row.simpleRepeatCount }}次
              <span v-if="row.simpleRepeatCount === -1">，一直重复</span>
            </div>
          </div>
        </template>

        <!-- 任务执行类列 -->
        <template #jobClass="{ row }">
          {{ jobClassOptions?.find(state => state.value === row.jobClassName)?.label }}
        </template>
      </e-table>
    </div>

    <!-- 弹窗 -->
    <JobEdit v-model:visible="showEdit" :data="current" :job-class-options="jobClassOptions" @done="fetchTableData" />
  </div>
</template>

<style scoped>
.trigger-type-title {
  width: 70px;
  font-weight: bold;
  display: inline-block;
}

.trigger-type-content {
  margin-left: 10px;
  display: inline-block;
}
</style>
