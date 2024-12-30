<script setup lang="ts">
import { Operation } from '@element-plus/icons-vue'
import { objectHasContent } from '~/utils'

interface Emits {
  /** 分页改变事件 */
  (event: 'change', data: any): void
}

interface Column {
  /** 字段名 */
  title: string
  /** 字段key */
  key?: string
  /** 是否隐藏字段 */
  hide?: boolean
  [propName: string]: any
}

interface Page {
  /** 当前页码 */
  current: number
  /** 总条数 */
  total: number
  /** 每页条数 */
  limit: number
  /** 分页器布局 */
  layout?: string
  /** 切换每页条数 */
  limits?: number[]
  /** 只有一页时隐藏 */
  hideOnSinglePage?: boolean

  /** 分页器在table底部的对齐方式 */
  align?: 'left' | 'center' | 'right'
  [propName: string]: any
}

const props = withDefaults(defineProps<{
  /** 表格字段 */
  columns: Column[]
  /** 表格数据 */
  dataSource: any[]
  /** 默认工具栏 */
  defaultToolbar?: boolean
  /** 分页配置 */
  page?: Page
  /** 表格加载状态 */
  loading?: boolean
  /** 是否显示空数据图片 */
  emptyShow?: boolean
  /** 空数据描述文字 */
  emptyDescription?: string
}>(), {
  loading: false,
  emptyShow: true,
  emptyDescription: 'No Data',
  defaultToolbar: false,
})

const emit = defineEmits<Emits>()

const alignConvertMap = {
  left: 'start',
  center: 'center',
  right: 'end'
}
const localPage = ref({ ...props.page })
const tableColumns = ref([...props.columns])

// 计算分页位置
const pageAlign = computed(() => {
  if (props.page?.align) {
    return alignConvertMap[props.page.align] || 'start'
  }
  return 'start'
})

/** 分页改变事件 */
function changePage(currentPage: number, pageSize: number) {
  emit('change', {
    current: currentPage,
    limit: pageSize
  })
}

// 说明：element plus 不建议使用@change来监听分页数据改变，因为后期会删除
// 如果要监听 current-page 和 page-size 的改变，使用 v-model 双向绑定是个更好的选择。
if (objectHasContent(localPage.value)) {
  watch(() => [localPage.value!.current, localPage!.value.limit], ([current, limit]) => changePage(current, limit))
}

// 判断父组件是否有传page
if (props.page && objectHasContent(props.page)) {
  // 监听父组件传过来的page中的数据是否发生变化。
  watch(() => props.page, (page) => {
    // 发生变化，改变子组件的localPage
    localPage.value = { ...page }
  }, { deep: true })
}
</script>

<template>
  <div class="e-table">
    <!-- 表格工具栏 -->
    <div class="table-toolbar">
      <!-- 左侧自定义工具栏 -->
      <div v-if="$slots.toolbar" style="margin: 10px;">
        <slot name="toolbar" />
      </div>
      <div v-else />

      <!-- 右侧默认工具栏 -->
      <div v-if="defaultToolbar" class="defaultToolbar">
        <el-popover popper-class="e-table-popover" placement="bottom-end" :offset="1" :hide-after="0" :width="'auto'" trigger="click">
          <template #reference>
            <el-button :icon="Operation" size="small" />
          </template>
          <div style="width: 100%; max-height: 200px; overflow: auto;">
            <div v-for="(column, index) in tableColumns" :key="index">
              <el-checkbox :value="column.hide" :label="column.title" :checked="!column.hide" @change="column.hide = !column.hide" />
            </div>
          </div>
        </el-popover>
      </div>
    </div>

    <!-- 表格主体 -->
    <el-table v-loading="loading" element-loading-text="Loading..." class="table" :data="dataSource" v-bind="$attrs" border>
      <template v-for="(column, index) in tableColumns" :key="index">
        <el-table-column v-if="!column.hide" v-bind="column" :prop="column.key" :label="column.title">
          <template v-if="column.customSlot" #default="scope">
            <slot :name="column.customSlot" :row="scope.row" :scope="scope" :index="scope.$index" />
          </template>
        </el-table-column>
      </template>

      <template v-if="emptyShow" #empty>
        <el-empty :description="emptyDescription" />
      </template>
    </el-table>

    <!-- 表格分页 -->
    <div v-if="page" class="table-page" :style="{ justifyContent: pageAlign }">
      <el-pagination
        v-bind="localPage"
        v-model:current-page="localPage.current"
        v-model:page-size="localPage.limit"
        :total="localPage.total"
        :page-sizes="localPage.limits || [10, 20, 30, 40, 50]"
        :layout="localPage.layout || 'prev, pager, next, sizes, jumper, total'"
        :hide-on-single-page="localPage.hideOnSinglePage || false"
        :size="'small'"
        background
        class="page"
      />
    </div>
  </div>
</template>

<style scoped>
/** 表格工具栏样式 */
.table-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--el-border-color-lighter);
  border-bottom: none;
  background-color: var(--el-fill-color-light);
}

/** 表头样式 */
:deep(.el-table thead) {
  color: unset;
}
:deep(.el-table th.el-table__cell) {
  background-color: var(--el-fill-color-light);
}

/** 表格分页样式 */
.table-page {
  display: flex;
  align-items: center;
  border: 1px solid var(--el-border-color-lighter);
  border-top: none;
  user-select: none;
  -webkit-user-select: none;
}
.page {
  margin: 10px;
}

/** 默认工具栏按钮图标样式 */
:deep(.defaultToolbar .el-button--small) {
  margin: 10px;
  padding: 5px;
}

/** 表格loading区域添加 border 边框 */
:deep(.el-loading-mask) {
  border: 1px solid var(--el-border-color-lighter);
}

::-webkit-scrollbar {
  width: 8px;
}
</style>
