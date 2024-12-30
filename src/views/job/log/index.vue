<script setup lang="ts">
import type { SelectOption } from '~/types/extra/select'
import type { PageParam } from '~/types/global'
import type { JobClassListResult } from '~/types/job/job'
import type { TaskLog, TaskLogDTO } from '~/types/job/taskLog'
import { columns } from './columns'
import JobLogSearchForm from './components/job-log-search.vue'

defineOptions({
  // 跟路由name保持一致
  name: 'job_log',
})

// 任务日志类型选项
const typeOptions: SelectOption[] = [
  { label: '执行成功', value: 'SUCCESS' },
  { label: '执行异常', value: 'EXCEPTION' },
]

const { loading, setLoading } = useLoading(true)
const searchForm = ref()
// 表格数据
const dataSource = ref<TaskLogDTO[]>([])
// 表格选中数据的key
const selectedKeys = ref<string[]>([])
// 表格工具栏配置
const defaultToolbar = ref<boolean>(true)// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
})
// 默认分页查询参数
const pageParam: PageParam<TaskLog> = { page: 1, limit: 10, sort: 'id', order: 'desc' }
// 任务执行类列表数据
const jobClassOptions = ref<SelectOption[]>()

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<TaskLog>) {
  setLoading(true)
  try {
    // 分页查询
    const { success, data } = await pageTaskLogApi({
      ...pageParam,
      ...param,
    })

    if (!success) return

    // 修改分页器的页码、数据总条数
    if (param && param.page) page.value.current = param.page
    page.value.total = Number(data!.count)
    // 表格数据赋值
    dataSource.value = data!.list as unknown as TaskLogDTO[]
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
  } as PageParam<TaskLog>

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
  } as PageParam<TaskLog>

  // 获取表格数据
  fetchTableData(param)
}

/** 表格多选事件 */
function changeSelection(data: TaskLog[] | undefined) {
  if (!data) return

  selectedKeys.value = data.map(item => item.id as string)
}

/** 表单搜索事件 */
function handleSearch(formModel: TaskLog) {
  // 自定义分页查询参数
  const param = {
    ...{ model: formModel },
    ...pageParam,
    page: 1,
  } as PageParam<TaskLog>

  // 获取表格数据
  fetchTableData(param)
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
      <JobLogSearchForm
        ref="searchForm"
        :type-options="typeOptions"
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
        @selection-change="changeSelection"
      >
        <!-- 日志类型列 -->
        <template #type="{ row }">
          <el-tag v-if="row.type === 'SUCCESS'" type="info" effect="plain">
            执行成功
          </el-tag>
          <el-tag v-else-if="row.type === 'EXCEPTION'" type="danger" effect="plain">
            执行异常
          </el-tag>
        </template>

        <!-- 耗时列 -->
        <template #spendTime="{ row }">
          {{ row.spendTime }}ms
        </template>

        <!-- 任务执行类列 -->
        <template #jobClass="{ row }">
          <el-tag v-if="jobClassOptions" type="info">
            {{ jobClassOptions?.find(state => state.value === row.jobClassName)?.label }}
          </el-tag>
        </template>

        <!-- 执行情况列 -->
        <template #result="{ row }">
          {{ row.type === 'SUCCESS' ? row.result : row.exception }}
        </template>"
      </e-table>
    </div>
  </div>
</template>
