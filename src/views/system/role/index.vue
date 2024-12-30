<script setup lang="ts">
import type { PageParam } from '~/types/global'
import type { SysRole } from '~/types/system/role'
import { columns } from './columns'
import RoleEdit from './components/role-edit.vue'
import roleMenuEdit from './components/role-menu-edit.vue'
import RoleSearchForm from './components/role-search.vue'

defineOptions({
  // 跟路由name保持一致
  name: 'system_role',
})

const { loading, setLoading } = useLoading(true)
const searchForm = ref()
// 表格数据
const dataSource = ref<SysRole[]>([])
// 表格选中数据的key
const selectedKeys = ref<string[]>([])
// 表格工具栏配置
const defaultToolbar = ref<boolean>(true)// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
})
// 是否显示"新增/编辑"弹窗
const showEdit = ref(false)
// 是否显示“分配权限”弹窗
const showEditRoleMenu = ref(false)
// 当前需要编辑的角色
const current = ref<SysRole>()
// 当前需要分配权限的角色id
const roleId = ref<string>('')
// 默认分页查询参数
const pageParam: PageParam<SysRole> = { page: 1, limit: 10, sort: 'id', order: 'desc' }

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<SysRole>) {
  setLoading(true)
  try {
    // 分页查询
    const { success, data } = await pageRoleApi({
      ...pageParam,
      ...param,
    })

    if (!success) return

    // 修改分页器的页码、数据总条数
    if (param && param.page) page.value.current = param.page
    page.value.total = Number(data!.count)
    // 表格数据赋值
    dataSource.value = data!.list as unknown as SysRole[]
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
  } as PageParam<SysRole>

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
  } as PageParam<SysRole>

  // 获取表格数据
  fetchTableData(param)
}

/** 表格多选事件 */
function changeSelection(data: SysRole[] | undefined) {
  if (!data) return

  selectedKeys.value = data.map(item => item.id as string)
}

/** 表单搜索事件 */
function handleSearch(formModel: SysRole) {
  // 自定义分页查询参数
  const param = {
    ...{ model: formModel },
    ...pageParam,
    page: 1,
  } as PageParam<SysRole>

  // 获取表格数据
  fetchTableData(param)
}

/**
 * 打开编辑弹窗
 * @param row 需要编辑的数据。可以为空，新增的时候不需要传
 */
function openEditModal(row?: SysRole) {
  current.value = row
  showEdit.value = true
}

/**
 * 打开分配权限弹窗
 * @param row
 */
function openEditRoleMenuModal(row: SysRole) {
  roleId.value = row.id!
  showEditRoleMenu.value = true
}

/** 处理单体删除 */
function handleDelete(id: string) {
  if (!id) {
    toastWarn('请选择角色')
    return
  }

  confirmMsg('确定要删除这条数据吗？', {}, async () => {
    try {
      // 单体删除
      const { success, message } = await deleteRoleApi(id)
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
    toastWarn('请选择角色')
    return
  }

  confirmMsg('确定要删除这些数据吗？', {}, async () => {
    try {
      // 批量删除
      const { success, message } = await batchDeleteRoleApi(ids)
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
      <RoleSearchForm ref="searchForm" @on-search="handleSearch" />
    </el-card>

    <!-- 数据表格 -->
    <div class="z-table-box">
      <e-table
        v-model:selected-keys="selectedKeys"
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
            v-any-permission="['sys:role:add', 'sys:role:save']"
            type="primary"
            @click="openEditModal()"
          >
            <el-icon><i-ep-plus /></el-icon>
            新增
          </el-button>
          <el-button
            v-permission="'sys:role:delete'"
            type="danger"
            @click="handleBatchDelete"
          >
            <el-icon><i-ep-delete /></el-icon>
            删除
          </el-button>
        </template>

        <!-- 操作列 -->
        <template #operator="{ row }">
          <e-action-group size="small">
            <el-button
              v-any-permission="['sys:role:edit', 'sys:role:update']"
              size="small"
              type="primary"
              @click="openEditModal(row)"
            >
              编辑
            </el-button>
            <el-button
              v-permission="'sys:role:delete'"
              size="small"
              type="danger"
              @click="handleDelete(row.id)"
            >
              删除
            </el-button>
            <!-- 折叠区域 -->
            <template #dropdown>
              <div
                v-any-permission="['sys:role:edit', 'sys:role:update']"
                @click="openEditRoleMenuModal(row)"
              >
                分配权限
              </div>
            </template>
          </e-action-group>
        </template>
      </e-table>
    </div>

    <!-- 弹窗 -->
    <RoleEdit v-model:visible="showEdit" :data="current" @done="fetchTableData" />
    <roleMenuEdit v-model:visible="showEditRoleMenu" :role-id="roleId" />
  </div>
</template>
