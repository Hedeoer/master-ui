<script setup lang="ts">
import type { SelectOption } from '~/types/extra/select'
import type { PageParam } from '~/types/global'
import type { SysLoginLog } from '~/types/system/loginLog'
import { columns } from './columns'
import LoginLogSearchForm from './components/login-log-search.vue'

defineOptions({
  // 跟路由name保持一致
  name: 'system_loginLog',
})

// 登录日志状态选项
const stateOptions: SelectOption[] = [
  { label: '登录成功', value: 'SUCCESS' },
  { label: '登录失败', value: 'FAIL' },
  { label: '密码不正确', value: 'ERROR_PWD' },
  { label: '注销登录', value: 'LOGOUT' },
]

const { loading, setLoading } = useLoading(true)
const searchForm = ref()
// 表格数据
const dataSource = ref<SysLoginLog[]>([])
// 表格工具栏配置
const defaultToolbar = ref<boolean>(true)
// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
})
// 默认分页查询参数
const pageParam: PageParam<SysLoginLog> = { page: 1, limit: 10, sort: 'id', order: 'desc' }

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<SysLoginLog>) {
  setLoading(true)
  try {
    // 分页查询
    const { success, data } = await pageLoginLogApi({
      ...pageParam,
      ...param,
    })

    if (!success) return

    // 修改分页器的页码、数据总条数
    if (param && param.page) page.value.current = param.page
    page.value.total = Number(data!.count)
    // 表格数据赋值
    dataSource.value = data!.list as unknown as SysLoginLog[]
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
  } as PageParam<SysLoginLog>

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
  } as PageParam<SysLoginLog>

  // 获取表格数据
  fetchTableData(param)
}

/** 表单搜索事件 */
function handleSearch(formModel: SysLoginLog) {
  // 自定义分页查询参数
  const param = {
    ...{ model: formModel },
    ...pageParam,
    page: 1,
  } as PageParam<SysLoginLog>

  // 获取表格数据
  fetchTableData(param)
}
</script>

<template>
  <div class="z-container">
    <!-- 表格搜索栏 -->
    <el-card shadow="never">
      <LoginLogSearchForm ref="searchForm" :state-options="stateOptions" @on-search="handleSearch" />
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
        <template #state="{ row }">
          <el-tag v-if="row.state === 'SUCCESS'" type="info" effect="plain">
            登录成功
          </el-tag>
          <el-tag v-else-if="row.state === 'LOGOUT'" effect="plain">
            注销登录
          </el-tag>
          <el-tag v-else-if="row.state === 'ERROR_PWD'" type="warning" effect="plain">
            密码不正确
          </el-tag>
          <el-tag v-else-if="row.state === 'FAIL'" type="danger" effect="plain">
            登录失败
          </el-tag>
        </template>
      </e-table>
    </div>
  </div>
</template>
