<script setup lang="ts">
import type { SelectOption } from '~/types/extra/select'
import type { PageParam } from '~/types/global'
import type { SysOptLog } from '~/types/system/optLog'
import { columns } from './columns'
import OptLogSearchForm from './components/opt-log-search.vue'
import OptLogViewModel from './components/opt-log-view.vue'

defineOptions({
  // 跟路由name保持一致
  name: 'SystemOptLog',
})

// 操作类型选项
const typeOptions: SelectOption[] = [
  { label: '操作', value: 'OPERATION' },
  { label: '异常', value: 'EXCEPTION' },
]

const { loading, setLoading } = useLoading(true)
const searchForm = ref()
// 表格数据
const dataSource = ref<SysOptLog[]>([])
// 表格工具栏配置
const defaultToolbar = ref<boolean>(true)// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
})
// 是否显示"新增/编辑"弹窗
const showEdit = ref(false)
// 当前需要查看的日志
const current = ref<string>()
// 默认分页查询参数
const pageParam: PageParam<SysOptLog> = { page: 1, limit: 10, sort: 'id', order: 'desc' }

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<SysOptLog>) {
  setLoading(true)
  try {
    // 分页查询
    const { success, data } = await pageOptLogApi({
      ...pageParam,
      ...param,
    })

    if (!success) return

    // 修改分页器的页码、数据总条数
    if (param && param.page) page.value.current = param.page
    page.value.total = Number(data!.count)
    // 表格数据赋值
    dataSource.value = data!.list as unknown as SysOptLog[]
  } catch {
  } finally {
    setLoading(false)
  }
}
fetchTableData()

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
  } as PageParam<SysOptLog>

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
  } as PageParam<SysOptLog>

  // 获取表格数据
  fetchTableData(param)
}

/** 表单搜索事件 */
function handleSearch(formModel: SysOptLog) {
  // 自定义分页查询参数
  const param = {
    ...{ model: formModel },
    ...pageParam,
    page: 1,
  } as PageParam<SysOptLog>

  // 获取表格数据
  fetchTableData(param)
}

/**
 * 打开详情弹窗
 * @param id
 */
function openViewModal(id: string) {
  current.value = id
  showEdit.value = true
}
</script>

<template>
  <div class="z-container">
    <!-- 表格搜索栏 -->
    <el-card shadow="never">
      <OptLogSearchForm ref="searchForm" :type-options="typeOptions" @on-search="handleSearch" />
    </el-card>

    <!-- 数据表格 -->
    <div class="z-table-box">
      <e-table
        :loading="loading"
        :page="page"
        :columns="columns"
        :data-source="dataSource"
        :default-toolbar="defaultToolbar"
        table-layout="auto"
        height="480px"
        @change="changePage"
        @sort-change="changeSort"
      >
        <!-- 操作列 -->
        <template #operator="{ row }">
          <el-button
            size="small"
            type="primary"
            @click="openViewModal(row.id)"
          >
            查看
          </el-button>
        </template>

        <!-- 操作类型列 -->
        <template #type="{ row }">
          <el-tag v-if="row.type === 'OPERATION'" type="info" effect="plain">
            操作
          </el-tag>
          <el-tag v-else type="warning" effect="plain">
            异常
          </el-tag>
        </template>

        <!-- 消耗时间列 -->
        <template #spendTime="{ row }">
          {{ row.spendTime }}ms
        </template>
      </e-table>
    </div>

    <!-- 弹窗 -->
    <OptLogViewModel v-model:visible="showEdit" :type-options="typeOptions" :data="current" @done="fetchTableData" />
  </div>
</template>
