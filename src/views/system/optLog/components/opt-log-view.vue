<script setup lang="ts">
import type { SelectOption } from '~/types/extra/select'
import type { SysOptLog } from '~/types/system/optLog'

const props = withDefaults(defineProps<{
  visible: boolean
  /** 操作类型选项 */
  typeOptions: SelectOption[]
  /** 操作日志id */
  data?: string
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

const refForm = ref()
// 表单数据
const baseFormData = {
  id: '',
  type: undefined,
  description: '',
  url: '',
  httpMethod: '',
  classPath: '',
  params: '',
  result: '',
  exception: '',
  spendTime: '',
  os: '',
  device: '',
  browser: '',
  ip: '',
  ipRegion: '',
  createTime: '',
  userName: '',
}
const form = reactive<SysOptLog>({ ...baseFormData })

/** 获取操作日志详情 */
async function getOptLogInfo(id: string) {
  try {
    // 单体查询
    const { success, message, data } = await getOptLogApi(id)
    if (!success) {
      toastError(message || '获取数据失败')
      return
    }

    // 设置表单的值
    Object.assign(form, data)

    // 获取修改人
    const resp = await getUserApi(data!.createdBy!)
    if (!resp.success) return
    form.userName = resp.data?.username
  } catch (e) {
    notifyError((e as Error).message, '错误')
  }
}

/** 初始化表单数据 */
function initData() {
  if (props.data) {
    getOptLogInfo(props.data)
  } else {
    Object.assign(form, baseFormData)
  }
}

/** 关闭弹窗 */
function handleClose() {
  // 关闭弹窗
  show.value = false
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
    title="详情"
    draggable
    destroy-on-close
    :close-on-press-escape="false"
    :close-on-click-modal="false"
    @before-close="handleClose"
  >
    <el-form ref="refForm" :model="form" label-width="100px" style="padding: 10px">
      <el-row>
        <!-- 基本信息 -->
        <el-col :md="12">
          <el-form-item class="text-center" label="操作人:" prop="userName">
            {{ form.userName }}
          </el-form-item>
          <el-form-item class="text-center" label="操作时间:" prop="createTime">
            {{ form.createTime }}
          </el-form-item>
          <el-form-item class="text-center" label="请求方式:" prop="httpMethod">
            <el-tag type="warning" effect="plain">{{ form.httpMethod }}</el-tag>
          </el-form-item>
          <el-form-item class="text-center" label="请求耗时:" prop="spendTime">
            {{ form.spendTime }}ms
          </el-form-item>
          <el-form-item class="text-center" label="操作类型:" prop="type">
            {{ typeOptions.find(type => type.value === form.type)?.label }}
          </el-form-item>
        </el-col>
        <el-col :md="12">
          <el-form-item class="text-center" label="ip地址:" prop="ip">
            {{ form.ip }}
          </el-form-item>
          <el-form-item class="text-center" label="操作系统:" prop="os">
            {{ form.os }}
          </el-form-item>
          <el-form-item class="text-center" label="设备名称:" prop="device">
            {{ form.device }}
          </el-form-item>
          <el-form-item class="text-center" label="浏览器类型:" prop="browser">
            {{ form.browser }}
          </el-form-item>
          <el-form-item class="text-center" label="操作描述:" prop="ipRegion">
            {{ form.description }}
          </el-form-item>
        </el-col>

        <el-divider style="margin: 5px;" />
        <!-- 接口方法信息 -->
        <el-col :md="24">
          <el-form-item class="text-center" label="请求地址:" prop="url">
            {{ form.url }}
          </el-form-item>
          <el-form-item class="text-center" label="调用方法:" prop="classPath">
            {{ form.classPath }}
          </el-form-item>
          <el-form-item label="请求参数:" prop="params">
            <el-input v-model="form.params" type="textarea" resize="none" :autosize="{ minRows: 2, maxRows: 6 }" disabled />
          </el-form-item>
          <el-form-item label="返回结果:" prop="result">
            <el-input v-model="form.result" type="textarea" resize="none" :autosize="{ minRows: 2, maxRows: 6 }" disabled />
          </el-form-item>
          <el-form-item label="异常描述:" prop="exception">
            <el-input v-model="form.exception" type="textarea" resize="none" :autosize="{ minRows: 2, maxRows: 6 }" disabled />
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>
  </el-dialog>
</template>
