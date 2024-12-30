<script setup lang="ts">
import type { SysMenu } from '~/types/system/menu'
import { Icon } from '@iconify/vue'
import MenuEdit from './components/menu-edit.vue'

defineOptions({
  // 跟路由name保持一致
  name: 'system_menu',
})
// 计算卡片高度
const { height } = useCardHeight()
// 计算表格高度
const tableHeight = computed(() => {
  return `calc(${height.value} - 60px)`
})

const { loading, setLoading } = useLoading(true)
const tableRef = ref()
// 表格数据
const dataSource = ref<SysMenu[]>([])
// 表格树展开、收起
const expand = ref<boolean>(false)
// 是否显示编辑弹窗
const showEdit = ref(false)
// 当前需要编辑的菜单
const current = ref<SysMenu>()
// 子级菜单的parentId
const pid = ref<string>('')
// 子级菜单的path
const parentPath = ref<string>('')

/**
 * 获取表格数据
 * @param sysMenu 自定义分页查询参数
 */
async function fetchTableData(sysMenu?: SysMenu) {
  setLoading(true)
  try {
    // 树查询
    const { success, data } = await menuTreeApi({
      ...sysMenu,
    })

    if (!success) return

    // 表格数据赋值
    dataSource.value = data! as unknown as SysMenu[]
  } catch {
  } finally {
    setLoading(false)
  }
}
fetchTableData()

/**
 * 打开编辑弹窗
 * @param row 需要编辑的菜单数据。可以为空，新增的时候不需要传
 */
function openEditModal(row?: SysMenu) {
  current.value = row

  // 初始化
  pid.value = ''
  parentPath.value = ''
  showEdit.value = true
}

/**
 * 打开新增子级弹窗
 * @param row 需要新增子级菜单的菜单数据。
 */
function openAddModal(row: SysMenu) {
  // 子级的parentId即为当前菜单的id
  pid.value = row.id || ''
  // 子级的path即为当前菜单的path
  parentPath.value = row.path || ''

  // 初始化
  current.value = undefined
  showEdit.value = true
}

/** 处理单体删除 */
function handleDelete(id: string) {
  if (!id) {
    toastWarn('请选择菜单')
    return
  }

  confirmMsg('确定要删除这条数据吗？', {}, async () => {
    try {
      // 单体删除
      const { success, message } = await deleteMenuApi(id)
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

/** 处理展开折叠 */
async function handleExpand() {
  expand.value = !expand.value
  nextTick(() => {
    dataSource.value.forEach((item) => {
      tableRef.value?.toggleRowExpansion(item, expand.value)
    })
  })
}

/** 处理行点击 */
function handleRowClick(row: any, _column: any, _event: Event) {
  tableRef.value?.toggleRowExpansion(row)
}
</script>

<template>
  <div class="z-container">
    <div class="z-table-box" :style="{ height }">
      <div style="margin-bottom: 10px;">
        <el-button
          v-any-permission="['sys:menu:add', 'sys:menu:save']"
          type="primary"
          @click="openEditModal()"
        >
          <el-icon><i-ep-plus /></el-icon>
          新增
        </el-button>
        <el-button
          v-permission="'sys:menu:view'"
          type="danger"
          @click="handleExpand"
        >
          {{ expand ? '收起' : '展开' }}
        </el-button>
      </div>

      <!-- 树形表格 -->
      <el-table
        ref="tableRef"
        v-loading="loading"
        :default-expand-all="expand"
        row-key="id"
        :data="dataSource"
        border
        stripe
        :style="{ height: tableHeight }"
        @row-click="handleRowClick"
      >
        <el-table-column prop="label" label="菜单名称" width="200px">
          <template #default="scope">
            <span>
              <Icon v-if="scope.row.icon && scope.row.type === 'MENU'" :icon="scope.row.icon" style="margin-right: 4px;" />
              {{ scope.row.label }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="path" label="路由地址" show-overflow-tooltip />
        <el-table-column prop="component" label="组件路径" show-overflow-tooltip />
        <el-table-column prop="authority" label="权限标识" show-overflow-tooltip />
        <el-table-column prop="sortValue" label="排序" width="100px" align="center" />
        <el-table-column prop="hide" label="是否隐藏" width="100px" align="center">
          <template #default="scope">{{ scope.row.hide ? '是' : '否' }}</template>
        </el-table-column>
        <el-table-column prop="type" label="类型" width="100px" align="center">
          <template #default="scope">
            <el-tag v-if="scope.row.type === 'MENU'" effect="plain">
              菜单
            </el-tag>
            <el-tag v-else type="warning" effect="plain">
              按钮
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180px" align="center" />
        <el-table-column prop="operator" label="操作" width="180px" align="center" fixed="right">
          <template #default="scope">
            <!-- 加@click.stop阻止事件冒泡，触发行点击事件 -->
            <e-action-group size="small" @click.stop>
              <el-button
                v-any-permission="['sys:menu:edit', 'sys:menu:update']"
                type="primary"
                size="small"
                @click="openEditModal(scope.row)"
              >
                编辑
              </el-button>
              <el-button
                v-permission="'sys:menu:delete'"
                size="small"
                type="danger"
                @click="handleDelete(scope.row.id)"
              >
                删除
              </el-button>
              <template #dropdown>
                <div
                  v-any-permission="['sys:menu:add', 'sys:menu:save']"
                  @click="openAddModal(scope.row)"
                >
                  新增子级
                </div>
              </template>
            </e-action-group>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 弹窗 -->
    <MenuEdit v-model:visible="showEdit" :pid="pid" :p-path="parentPath" :data="current" @done="fetchTableData" />
  </div>
</template>

<style scoped>
/** 表头样式 */
:deep(.el-table thead) {
  color: unset;
}
:deep(.el-table th.el-table__cell) {
  background-color: var(--el-fill-color-light);
}
</style>
