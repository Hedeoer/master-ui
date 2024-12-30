<script setup lang="ts">
import type { PageParam } from '~/types/global'
import type { SysDictItem } from '~/types/system/dictItem'
import { dictItemColumns } from '../columns'
import DictItemEdit from './dict-item-edit.vue'

defineOptions({
  name: 'SysDictItem',
})

const props = defineProps<{
  /** 字典id */
  dictId?: string
}>()

// 计算卡片高度
const { height } = useCardHeight()
// 计算表格高度
const tableHeight = computed(() => {
  return `calc(${height.value} - 110px)`
})

// 表格数据
const dataSource = ref<SysDictItem[]>([])
// 表格选中数据的key
const selectedKeys = ref<string[]>([])
// 表格工具栏配置
const defaultToolbar = ref<boolean>(false)
// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
})
// 是否显示"新增/编辑"弹窗
const showEdit = ref(false)
// 当前需要编辑的字典
const current = ref<SysDictItem>()
// 默认分页查询参数
const pageParam: PageParam<SysDictItem> = { page: 1, limit: 10, sort: 'sortValue', order: 'desc' }
// 表格搜索参数
const searchForm = reactive({
  name: '',
  dictId: props.dictId,
})

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<SysDictItem>) {
  // 如果没有字典id，则不获取表格数据
  if (!props.dictId) return

  try {
    // 分页查询
    const { success, data } = await pageDictItemApi({
      model: { dictId: props.dictId! } as SysDictItem,
      ...pageParam,
      ...param,
    })

    if (!success) return

    // 修改分页器的页码、数据总条数
    if (param && param.page) page.value.current = param.page
    page.value.total = Number(data!.count)
    // 表格数据赋值
    dataSource.value = data!.list as unknown as SysDictItem[]
  } catch {}
}

/** 分页事件 */
function changePage(data: any) {
  // 自定义分页查询参数
  const param = {
    ...{ model: searchForm },
    ...pageParam,
    page: data.current,
    limit: data.limit,
  } as PageParam<SysDictItem>

  // 获取表格数据
  fetchTableData(param)
}

/** 排序事件 */
function changeSort(data: any) {
  // 自定义分页查询参数
  const param = {
    ...{ model: searchForm },
    ...{ page: page.value.current, limit: page.value.limit },
    sort: data.prop,
    order: data.order,
  } as PageParam<SysDictItem>

  // 获取表格数据
  fetchTableData(param)
}

/** 表格多选事件 */
function changeSelection(data: SysDictItem[] | undefined) {
  if (!data) return

  selectedKeys.value = data.map(item => item.id as string)
}

/** 表格搜索事件处理 */
function handleSearch() {
  // 判断是否有字典id
  if (!props.dictId) {
    toastWarn('请先选择字典')
    return
  }

  // 查询条件携带字典id
  searchForm.dictId = props.dictId

  // 自定义分页查询参数
  const param = {
    ...{ model: searchForm },
    ...pageParam,
    page: 1,
  } as PageParam<SysDictItem>

  // 获取表格数据
  fetchTableData(param)
}

/**
 * 打开编辑弹窗
 * @param row
 */
function openEditModal(row?: SysDictItem) {
  // 判断是否有字典id
  if (!props.dictId) {
    toastWarn('请先选择字典')
    return
  }

  current.value = row
  showEdit.value = true
}

/** 处理单体删除 */
function handleDelete(id: string) {
  if (!id) {
    toastWarn('请选择字典项')
    return
  }

  confirmMsg('确定要删除这条数据吗？', {}, async () => {
    try {
      // 单体删除
      const { success, message } = await deleteDictItemApi(id)
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
    toastWarn('请选择字典项')
    return
  }

  confirmMsg('确定要删除这些数据吗？', {}, async () => {
    try {
      // 批量删除
      const { success, message } = await batchDeleteDictItemApi(ids)
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

// 监听字典id的值
watch(
  () => props.dictId,
  () => {
    // 发生变化才获取表格数据
    fetchTableData()
  },
)
</script>

<template>
  <div class="z-table-box" :style="{ height }">
    <div style="margin-bottom: 10px">
      <el-input
        v-model="searchForm.name"
        placeholder="输入关键字搜索"
        clearable
        style="width: 200px; margin-right: 10px;"
      />
      <el-button @click="handleSearch">
        <el-icon><i-ep-search /></el-icon>
        查询
      </el-button>

      <el-button
        v-any-permission="['sys:dictItem:add', 'sys:dictItem:save']"
        type="primary"
        @click="openEditModal()"
      >
        <el-icon><i-ep-plus /></el-icon>
        新增
      </el-button>
      <el-button
        v-permission="'sys:dictItem:delete'"
        type="danger"
        @click="handleBatchDelete"
      >
        <el-icon><i-ep-delete /></el-icon>
        删除
      </el-button>
    </div>
    <e-table
      v-model:selected-keys="selectedKeys"
      :page="page"
      :columns="dictItemColumns"
      :data-source="dataSource"
      :default-toolbar="defaultToolbar"
      :style="{ height: tableHeight }"
      @change="changePage"
      @sort-change="changeSort"
      @selection-change="changeSelection"
    >
      <!-- 操作列 -->
      <template #operator="{ row }">
        <el-button
          v-any-permission="['sys:dictItem:edit', 'sys:dictItem:update']"
          size="small"
          type="primary"
          @click="openEditModal(row)"
        >
          编辑
        </el-button>
        <el-button
          v-permission="'sys:dictItem:delete'"
          size="small"
          type="danger"
          @click="handleDelete(row.id)"
        >
          删除
        </el-button>
      </template>
    </e-table>

    <DictItemEdit v-model:visible="showEdit" :dict-id="dictId" :data="current" @done="fetchTableData" />
  </div>
</template>
