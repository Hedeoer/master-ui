<script setup lang="ts">
import type { TreeData } from '~/types/extra/tree'
import { filterCheckedMenuId, toTreeData } from '../../menu/utils'

const props = withDefaults(defineProps<{
  visible: boolean
  /** 当前编辑的角色id */
  roleId: string
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

const treeRef = ref()
// 树选中项（只在初始化用） ps: el-tree获取选中项，不会返回半选中的菜单id。
const checkedKeys = ref<string[]>([])
// 树数据
const treeData = ref<TreeData[]>([] as TreeData[])

/** 初始化弹窗数据 */
async function initData() {
  try {
    // 获取树数据
    const { success, message, data } = await listRoleMenuApi(props.roleId)
    if (!success) {
      toastError(message || '获取数据失败')
      return
    }

    // 赋值
    treeData.value = toTreeData(data, true)
    checkedKeys.value = filterCheckedMenuId(data)
  } catch (e) {
    notifyError((e as Error).message, '错误')
  }
}

/** 关闭弹窗 */
function handleClose() {
  // 初始化数据
  checkedKeys.value = []
  treeData.value = []
  // 关闭弹窗
  show.value = false
}

/** 表单提交 */
async function handleSubmit() {
  // 获取半选中项和选中的id
  const halfCheckedKeys = treeRef.value.getHalfCheckedKeys()
  const checkedKeys = treeRef.value.getCheckedKeys()

  // 拼接得到所有的菜单id
  const menuIds = checkedKeys.concat(halfCheckedKeys)

  try {
    // 修改角色菜单关联关系
    const { success, message } = await updateRoleMenuApi({
      roleId: props.roleId,
      menuIds,
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭弹窗
    handleClose()
    emit('done')
  } catch (e) {
    notifyError((e as Error).message, '错误')
  }
}

watch(
  () => props.visible,
  (visible: boolean) => {
    if (visible) {
      // 初始化弹窗数据
      initData()
    }
  },
)
</script>

<template>
  <el-dialog
    v-model="show"
    width="300px"
    title="分配权限"
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

    <el-tree
      ref="treeRef"
      :data="treeData"
      :default-checked-keys="checkedKeys"
      node-key="id"
      :render-after-expand="false"
      default-expand-all
      show-checkbox
      class="role-menu-tree"
    />
  </el-dialog>
</template>

<style scoped>
.role-menu-tree {
  height: 500px;
  max-height: 500px;
  overflow-y: auto;
}
.role-menu-tree::-webkit-scrollbar {
  width: 8px;
}
</style>
