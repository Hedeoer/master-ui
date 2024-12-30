<script setup lang="ts">
import type { FormRules } from 'element-plus'
import type { SysMenu, SysMenuSaveParam, SysMenuUpdateParam } from '~/types/system/menu'
import { cloneDeep } from '@pureadmin/utils'
import { BLANK_LAYOUT_NAME, FRAME_VIEW_NAME } from '~/types/router'
import { filterMenu, toTreeData } from '../utils'

const props = withDefaults(defineProps<{
  visible: boolean
  /** 新增子级菜单时必传，父级菜单id */
  pid: string
  /** 新增子级菜单时必传，父级菜单path */
  pPath: string
  /** 修改时必传，菜单基本数据 */
  data?: SysMenu
}>(), {
  visible: false,
  pPath: '',
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

// 设置为false,代表输入时不进行表单校验，只有提交时才进行表单校验
const validateEvent = ref<boolean>(false)

const refForm = ref()
// 是否修改弹窗
const isUpdate = ref(false)
// 表单数据
const baseFormData = {
  id: undefined,
  parentId: '0',
  label: '',
  sortValue: 0,
  name: '',
  path: '',
  component: '',
  redirect: undefined,
  icon: '',
  type: 'MENU',
  hide: false,
  keepAlive: false,
  href: undefined,
  frameSrc: undefined,
} as SysMenu
const form = reactive<SysMenu>({ ...baseFormData })
// treeSelect默认选中的值
const parentId = ref<string>(props.pid)
// 父级菜单的路由路径
const parentPath = ref<string>(props.pPath)
// 表单校验规则
const rules = ref<FormRules<any>>({
  label: { type: 'string', required: true, message: '菜单名称不能为空' },
  type: { type: 'string', required: true, message: '菜单类型不能为空' },
})
// 菜单树数据
const menuTreeData = ref<any[]>([])
// 菜单api数据
const menuApiData = ref<SysMenu[]>([])
// 菜单打开方式。1：组件， 2：内链， 3：外链
const openType = ref<string>('1')

/** 获取菜单树数据 */
async function getMenuTreeData() {
  try {
    // 查询菜单树。排除掉按钮
    const { success, message, data } = await menuTreeApi()
    if (!success) {
      toastError(message || '获取菜单列表失败')
      return
    }
    menuApiData.value = data || []

    // 回显, 在返回结果外面再包裹一层父级
    menuTreeData.value = [{
      id: '0',
      value: '0',
      lable: '父级',
      field: '',
      children: toTreeData(data),
    }]
    // 如果不是新增子级菜单（即；新增、修改菜单），给treeSelect设置默认值
    if (!props.pid) {
      parentId.value = isUpdate.value ? form.parentId as string : '0'
    } else {
      parentId.value = props.pid
    }
  } catch (err) {
    notifyError((err as Error).message, '错误')
  }
}

/** 处理树值改变事件 ps:因为这里是单选，所以值的类型是string */
function treeChangeHandler(value: string) {
  const menu = filterMenu(menuApiData.value, value)
  if (!menu) return

  parentPath.value = menu.path || ''
}

/** 初始化表单数据 */
function initData() {
  if (props.data) {
    isUpdate.value = true
    Object.assign(form, props.data)

    // 计算openType
    if (form.href) openType.value = '2'
    if (form.frameSrc) openType.value = '3'
  } else {
    isUpdate.value = false
    Object.assign(form, baseFormData)
    if (props.pPath) parentPath.value = props.pPath
  }
}

/** 关闭弹窗 */
function handleClose() {
  // 关闭弹窗
  show.value = false
  // 重置表单数据，并移除校验结果
  refForm.value?.resetFields()
  parentId.value = ''
  parentPath.value = ''
}

/** 处理待提交数据 */
function handlerSubmitData(model: SysMenu) {
  // 处理上级菜单id。
  if (!model.parentId) {
    model.parentId = '0'
  } else {
    model.parentId = parentId.value
  }

  // 处理组件路径、内链、外链地址
  switch (openType.value) {
    case '1': // 组件打开
      model.href = ''
      model.frameSrc = ''
      break
    case '2': // 内链打开
      model.component = FRAME_VIEW_NAME
      model.href = ''
      break
    case '3': // 外链打开
      model.component = ''
      model.frameSrc = ''
      break
  }

  // 处理菜单图标。 说明：如果是按钮，没有打开方式、图标、frameSrc、href
  if (model.type === 'RESOURCE') {
    model.icon = ''
    model.path = ''
  }
}

/** 保存数据 */
async function saveData(model: SysMenu, close: () => void) {
  try {
    // 计算path
    if (parentPath.value && model.type === 'MENU') model.path = parentPath.value + (model.path || '')

    // 新增菜单
    const { success, message } = await addMenuApi({
      ...model as SysMenuSaveParam,
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭loading
    close()
    // 关闭弹窗
    handleClose()
  } catch (e) {
    close()
    notifyError((e as Error).message, '错误')
  }
}

/** 修改数据 */
async function updateData(model: SysMenu, close: () => void) {
  try {
    // 修改菜单数据
    const { success, message } = await updateMenuApi({
      ...model as SysMenuUpdateParam,
    })
    if (!success) {
      toastError(message || '操作失败')
      return
    }

    toastSuccess(message || '操作成功')
    // 关闭loading
    close()
    // 关闭弹窗
    handleClose()
  } catch (e) {
    close()
    notifyError((e as Error).message, '错误')
  }
}

/** 表单提交 */
function handleSubmit() {
  refForm.value.validate((isValidate: boolean, _errors: any) => {
    if (!isValidate) return
    const model = cloneDeep(form)

    // 提交前，数据处理
    handlerSubmitData(model)

    loadingMsg('正在提交数据...', async (close) => {
      isUpdate.value
        ? await updateData(model, close)
        : await saveData(model, close)
      emit('done')
    })
  })
}

/** 菜单类型，单选按钮切换事件处理 */
function handleMenuTypeChange(current: string) {
  // 如果是按钮，没有打开方式、路由地址、组件路径、图标、frameSrc、href
  if (current === 'RESOURCE') {
    form.icon = ''
    form.frameSrc = ''
    form.href = ''
    form.path = ''
    // 打开方式重置为组件打开
    openType.value = '1'
    form.component = ''
  }
}

/** 打开方式，单选按钮切换事件处理 */
function handleOpenTypeChange(current: string) {
  // 如果选中的是内链打开
  if (current === '2') {
    form.component = FRAME_VIEW_NAME
    return
  }

  if (current === '3') {
    form.component = BLANK_LAYOUT_NAME
    return
  }

  // 如果是组件打开
  form.component = ''
}

watch(
  () => props.visible,
  (visible: boolean) => {
    if (visible) {
      // 初始化弹窗数据
      initData()
      // 获取菜单树数据
      getMenuTreeData()
    }
  },
)
</script>

<template>
  <el-dialog
    v-model="show"
    width="900px"
    :title="isUpdate ? '编辑' : '新增'"
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

    <el-form ref="refForm" :model="form" :rules="rules" label-width="100px">
      <el-row>
        <!-- 左 -->
        <el-col :md="12">
          <el-form-item label="上级菜单" prop="parentId" required>
            <!-- 修改或添加下级菜单时，不可编辑 -->
            <el-tree-select
              v-model="parentId"
              node-key="id"
              :data="menuTreeData"
              :disabled="isUpdate || pid !== '0'"
              @change="(value: string) => treeChangeHandler(value)"
            />
          </el-form-item>
          <el-form-item label="菜单名称" prop="label" required>
            <el-input v-model="form.label" placeholder="请填写" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item prop="name">
            <template #label>
              <div style="display: flex; align-items: center;">
                路由名称
                <el-tooltip content="Vue Router的路由标识，需要唯一值。建议用英文命名">
                  <el-icon><i-ep-info-filled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-input
              v-model="form.name"
              placeholder="请填写"
              :disabled="form.type === 'RESOURCE'"
              clearable
              :validate-event="validateEvent"
            />
          </el-form-item>
          <el-form-item prop="path">
            <template #label>
              <div style="display: flex; align-items: center;">
                路由地址
                <!-- 如果是子级路由，需要拼接父级路由 -->
                <el-tooltip
                  :content="parentId
                    ? '如果是子级路由，需要拼接父级路由'
                    : '如果菜单类型是按钮，路由地址可以不用填写'
                  "
                >
                  <el-icon><i-ep-info-filled /></el-icon>
                </el-tooltip>
              </div>
            </template>

            <el-input
              v-model="form.path"
              placeholder="请填写"
              clearable
              :disabled="form.type === 'RESOURCE'"
              :validate-event="validateEvent"
            >
              <template v-if="parentPath" #prepend>
                {{ parentPath }}
              </template>
            </el-input>
          </el-form-item>
          <el-form-item prop="component">
            <template #label>
              <div style="display: flex; align-items: center;">
                组件路径
                <el-tooltip content="如果新增的菜单是层级菜单，组件路径可以不用填写">
                  <el-icon><i-ep-info-filled /></el-icon>
                </el-tooltip>
              </div>
            </template>

            <el-input
              v-model="form.component"
              placeholder="请填写"
              clearable
              :disabled="form.type === 'RESOURCE' || openType === '2' || openType === '3'"
              :validate-event="validateEvent"
            />
          </el-form-item>
          <el-form-item prop="redirect">
            <template #label>
              <div style="display: flex; align-items: center;">
                重定向地址
                <el-tooltip content="影响面包屑点击之后，跳转到哪个路由地址">
                  <el-icon><i-ep-info-filled /></el-icon>
                </el-tooltip>
              </div>
            </template>

            <el-input
              v-model="form.redirect"
              placeholder="请填写"
              clearable
              :disabled="form.type === 'RESOURCE' || openType === '2' || openType === '3'"
              :validate-event="validateEvent"
            />
          </el-form-item>
          <el-form-item label="权限标识" prop="authority">
            <template #label>
              <div style="display: flex; align-items: center;">
                权限标识
                <el-tooltip content="菜单类型为'菜单'时,权限标识不需要填写">
                  <el-icon><i-ep-info-filled /></el-icon>
                </el-tooltip>
              </div>
            </template>

            <el-input
              v-model="form.authority"
              placeholder="请填写"
              clearable
              :disabled="form.type === 'MENU'"
              :validate-event="validateEvent"
            />
          </el-form-item>
        </el-col>
        <!-- 右 -->
        <el-col :md="12">
          <el-form-item label="菜单类型" prop="type" required>
            <el-radio-group
              v-model="form.type"
              name="type"
              :disabled="isUpdate"
              @change="(current: string) => handleMenuTypeChange(current)"
            >
              <el-radio value="MENU" label="菜单" />
              <el-radio value="RESOURCE" label="按钮" />
            </el-radio-group>
          </el-form-item>
          <el-form-item label="打开方式" prop="openType">
            <!-- 影响到 外链,内链输入框的显示与隐藏 -->
            <el-radio-group
              v-model="openType"
              name="type"
              :disabled="form.type === 'RESOURCE'"
              @change="(current: string) => handleOpenTypeChange(current)"
            >
              <el-radio value="1" label="组件" />
              <el-radio value="2" label="内链" />
              <el-radio value="3" label="外链" />
            </el-radio-group>
          </el-form-item>
          <el-form-item v-if="openType === '2'" label="内链地址" prop="frameSrc">
            <el-input v-model="form.frameSrc" placeholder="请填写" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item v-if="openType === '3'" label="外链地址" prop="href">
            <el-input v-model="form.href" placeholder="请填写" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item label="菜单图标" prop="icon">
            <el-input v-model="form.icon" :disabled="form.type === 'RESOURCE'" clearable :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item label="排序" prop="sortValue">
            <el-input-number v-model="form.sortValue" position="right" :min="0" :validate-event="validateEvent" />
          </el-form-item>
          <el-form-item prop="hide" class="switch-fix">
            <template #label>
              <div style="display: flex; align-items: center;">
                是否隐藏
                <el-tooltip content="如果隐藏，则不会出现在左侧菜单栏">
                  <el-icon><i-ep-info-filled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-switch
              v-model="form.hide"
              inline-prompt
              active-text="是"
              inactive-text="否"
              :validate-event="validateEvent"
            />
          </el-form-item>
          <el-form-item prop="keepAlive">
            <template #label>
              <div style="display: flex; align-items: center;">
                keepAlive
                <el-tooltip content="页面缓存，需要搭配路由name使用">
                  <el-icon><i-ep-info-filled /></el-icon>
                </el-tooltip>
              </div>
            </template>
            <el-switch
              v-model="form.keepAlive"
              inline-prompt
              active-text="是"
              inactive-text="否"
              :validate-event="validateEvent"
            />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </el-dialog>
</template>
