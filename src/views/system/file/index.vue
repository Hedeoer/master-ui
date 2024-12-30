<script setup lang="ts">
import type { PageParam } from '~/types/global'
import type { SysFile } from '~/types/system/file'
import { bytesToMB } from '~/utils/convert'
import { columns } from './columns'
import FileSearchForm from './components/file-search.vue'
import FileUploadModal from './components/file-upload.vue'

defineOptions({
  // 跟路由name保持一致
  name: 'system_file',
})

const { loading, setLoading } = useLoading(true)
const searchForm = ref()
// 表格数据
const dataSource = ref<SysFile[]>([])
// 表格选中数据的key
const selectedKeys = ref<string[]>([])
// 表格工具栏配置
const defaultToolbar = ref<boolean>(true)// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
})
// 是否显示"文件上传"弹窗
const showUpload = ref(false)
// 默认分页查询参数
const pageParam: PageParam<SysFile> = { page: 1, limit: 10, sort: 'id', order: 'desc' }

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<SysFile>) {
  setLoading(true)
  try {
    // 分页查询
    const { success, data } = await pageFileApi({
      ...pageParam,
      ...param,
    })

    if (!success) return

    // 修改分页器的页码、数据总条数
    if (param && param.page) page.value.current = param.page
    page.value.total = Number(data!.count)
    // 表格数据赋值
    dataSource.value = data!.list as unknown as SysFile[]
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
  } as PageParam<SysFile>

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
  } as PageParam<SysFile>

  // 获取表格数据
  fetchTableData(param)
}

/** 表格多选事件 */
function changeSelection(data: SysFile[] | undefined) {
  if (!data) return

  selectedKeys.value = data.map(item => item.id as string)
}

/** 表单搜索事件 */
function handleSearch(formModel: SysFile) {
  // 自定义分页查询参数
  const param = {
    ...{ model: formModel },
    ...pageParam,
    page: 1,
  } as PageParam<SysFile>

  // 获取表格数据
  fetchTableData(param)
}

/**
 * 打开上传弹窗
 */
function openUploadModal() {
  showUpload.value = true
}

/** 处理单体删除 */
function handleDelete(id: string) {
  if (!id) {
    toastWarn('请选择用户')
    return
  }

  confirmMsg('确定要删除这条数据吗？', {}, async () => {
    try {
      // 单体删除
      const { success, message } = await deleteFileApi(id)
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

/** 处理批量删除 */
async function handleBatchDelete() {
  // 参数校验
  const ids = selectedKeys.value
  if (ids.length === 0) {
    toastWarn('请选择文件')
    return
  }

  confirmMsg('确定要删除这些文件吗？', {}, async () => {
    try {
      // 批量删除
      const { success, message } = await batchDeleteFileApi(ids)
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
</script>

<template>
  <div class="z-container">
    <!-- 表格搜索栏 -->
    <el-card shadow="never">
      <FileSearchForm ref="searchForm" @on-search="handleSearch" />
    </el-card>

    <!-- 数据表格 -->
    <div class="z-table-box">
      <e-table
        :loading="loading"
        :page="page"
        :columns="columns"
        :data-source="dataSource"
        :default-toolbar="defaultToolbar"
        height="500px"
        @change="changePage"
        @sort-change="changeSort"
        @selection-change="changeSelection"
      >
        <!-- 工具栏 -->
        <template #toolbar>
          <el-button
            v-any-permission="['sys:file:add', 'sys:user:save']"
            type="primary"
            @click="openUploadModal"
          >
            <el-icon><i-ep-upload-filled /></el-icon>
            上传
          </el-button>
          <el-button
            v-permission="'sys:file:delete'"
            type="danger"
            @click="handleBatchDelete"
          >
            <el-icon><i-ep-delete /></el-icon>
            删除
          </el-button>
        </template>

        <!-- 操作列 -->
        <template #operator="{ row }">
          <el-button
            v-permission="'sys:user:delete'"
            size="small"
            type="danger"
            @click="handleDelete(row.id)"
          >
            删除
          </el-button>
        </template>

        <template #path="{ row }">
          <el-link
            :href="row.url ? row.url : 'javascript:void(0)'"
            type="primary"
            target="_blank"
          >
            {{ row.path }}
          </el-link>
        </template>

        <!-- 文件大小列 -->
        <template #size="{ row }">
          {{ bytesToMB(row.size).toFixed(2) }}MB
        </template>
      </e-table>
    </div>

    <!-- 弹窗 -->
    <FileUploadModal v-model:visible="showUpload" @done="fetchTableData" />
  </div>
</template>
