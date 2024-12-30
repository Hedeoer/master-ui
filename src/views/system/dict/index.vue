<script setup lang="ts">
import type { PageParam } from '~/types/global'
import type { SysDict } from '~/types/system/dict'
import { dictColumns } from './columns'
import DictEditModel from './components/dict-edit.vue'
import DictItemTable from './components/dict-item-table.vue'

defineOptions({
  // 跟路由name保持一致
  name: 'system_dict',
})
// 计算卡片高度
const { height } = useCardHeight()
// 计算表格高度
const tableHeight = computed(() => {
  return `calc(${height.value} - 110px)`
})

const { loading, setLoading } = useLoading(true)
const tableRef = ref()
// 表格数据
const dataSource = ref<SysDict[]>([])
// 表格选中数据的key,即: dictId
const selectedKey = ref('')
// 表格工具栏配置
const defaultToolbar = ref<boolean>(false)
// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
  layout: 'prev,pager,next,total',
})
// 是否显示"新增/编辑"弹窗
const showEdit = ref(false)
// 当前需要编辑的字典
const current = ref<SysDict>()
// 默认分页查询参数
const pageParam: PageParam<SysDict> = { page: 1, limit: 10, sort: 'id', order: 'desc' }

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<SysDict>) {
  setLoading(true)
  try {
    // 分页查询
    const { success, data } = await pageDictApi({
      ...pageParam,
      ...param,
    })

    if (!success) return

    // 修改分页器的页码、数据总条数
    if (param && param.page) page.value.current = param.page
    page.value.total = Number(data!.count)
    // 表格数据赋值
    dataSource.value = data!.list as unknown as SysDict[]
    // 清空选中的数据
    selectedKey.value = ''

    // 默认选中表格第一条数据
    // if (!selectedKey.value && dataSource.value.length) {
    //   selectedKey.value = dataSource.value[0].id!
    //   // 表格设置当前选中的行， ps:不知道为啥没有选中行的特效
    //   tableRef.value!.setCurrentRow(dataSource.value[0])
    // }
  } catch {
  } finally {
    setLoading(false)
  }
}
fetchTableData()

/** 表格行单击事件处理 */
function rowClick(row: SysDict | undefined) {
  if (!row) return
  selectedKey.value = row.id!
}

/** 分页事件 */
function changePage(data: any) {
  // 自定义分页查询参数
  const param = {
    ...pageParam,
    page: data.current,
    limit: data.limit,
  } as PageParam<SysDict>

  // 获取表格数据
  fetchTableData(param)
}

/**
 * 打开编辑弹窗
 * @param isUpdate 是否是编辑弹窗 默认false，即：打开新增弹窗
 */
function openEditModal(isUpdate = false) {
  // 如果是新增
  if (!isUpdate) {
    // fix bug 解决“点击编辑字典，关闭弹窗后点击再次新增字典会有默认值”问题  --by gcc
    // 清空当前需要编辑的字典
    current.value = undefined
    showEdit.value = true
    return
  }

  // 如果是编辑
  const key = selectedKey.value
  if (!key) {
    toastWarn('请选择要编辑的字典')
    return
  }

  // 查找当前需要编辑的字典
  current.value = dataSource.value.find(row => row.id === key)
  showEdit.value = true
}

/** 处理单体删除 */
async function handleDelete() {
  // 参数校验
  const id = selectedKey.value
  if (!id) {
    toastWarn('请选择要删除的数据')
    return
  }

  confirmMsg('确定要删除这条数据吗？', {}, async () => {
    try {
      // 批量删除
      const { success, message } = await deleteDictApi(id)
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
    <el-row :gutter="8">
      <el-col :lg="6" :md="10" :sm="24" :xs="24">
        <!-- 数据表格 -->
        <div class="z-table-box" :style="{ height }">
          <div style="margin-bottom: 10px;">
            <el-button
              v-any-permission="['sys:role:add', 'sys:role:save']"
              type="primary"
              @click="openEditModal()"
            >
              <el-icon><i-ep-plus /></el-icon>
              新增
            </el-button>
            <el-button
              v-any-permission="['sys:dict:edit', 'sys:dict:update']"
              type="warning"
              @click="openEditModal(true)"
            >
              <el-icon><i-ep-edit /></el-icon>
              编辑
            </el-button>
            <el-button
              v-permission="'sys:dict:delete'"
              type="danger"
              @click="handleDelete"
            >
              <el-icon><i-ep-delete /></el-icon>
              删除
            </el-button>
          </div>
          <e-table
            ref="tableRef"
            :loading="loading"
            :page="page"
            :columns="dictColumns"
            :data-source="dataSource"
            :default-toolbar="defaultToolbar"
            :style="{ height: tableHeight }"
            highlight-current-row
            @change="changePage"
            @current-change="rowClick"
          />
        </div>
      </el-col>
      <el-col :lg="18" :md="14" :sm="24" :xs="24">
        <DictItemTable :dict-id="selectedKey" />
      </el-col>
    </el-row>

    <!-- 编辑弹窗 -->
    <DictEditModel v-model:visible="showEdit" :data="current" @done="fetchTableData" />
  </div>
</template>

<style scoped>
.z-table-box {
  min-width: 160px;
}
</style>
