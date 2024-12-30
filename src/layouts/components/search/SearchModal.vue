<script setup lang="ts">
import type { OptionsItem } from './interfaces'
import type { UserMenu } from '~/types/login'
import { Search } from '@element-plus/icons-vue'
import { cloneDeep } from '@pureadmin/utils'
import SearchResult from './SearchResult.vue'

const props = withDefaults(defineProps<{
  /** 弹窗显隐 */
  value: boolean
}>(), {
  value: false,
})
const emit = defineEmits(['update:value'])

const router = useRouter()
const keyword = ref('')
const activePath = ref('')
const inputRef = ref()
const resultOptions = shallowRef([] as UserMenu[])

/** 菜单树形结构 */
const menusData = computed(() => (cloneDeep(useUserStore().menus)))

/** 弹窗显示隐藏 */
const show = computed({
  get() {
    return props.value
  },
  set(val: boolean) {
    emit('update:value', val)
  },
})

/** 关闭弹窗 */
function handleClose() {
  show.value = false
  /** 延时处理防止用户看到某些操作 */
  setTimeout(() => {
    resultOptions.value = []
    keyword.value = ''
  }, 200)
}

/** 将菜单树形结构扁平化为一维数组，用于菜单查询 */
function flatTree(arr: UserMenu[]) {
  const res: any[] = []
  const deep = (arr: UserMenu[]) => {
    arr.forEach((item: UserMenu) => {
      res.push(item)
      item.children && deep(item.children)
    })
  }
  deep(arr)
  return res
}
const flatMenusData = flatTree(menusData.value)

/** 菜单搜索 */
function search() {
  resultOptions.value = flatMenusData.filter(
    menu =>
      keyword.value
      && menu.meta?.title
        .toLocaleLowerCase()
        .includes(keyword.value.toLocaleLowerCase().trim()),
  )
  if (resultOptions.value?.length > 0) {
    activePath.value = resultOptions.value[0].path || ''
  } else {
    activePath.value = ''
  }
}
/** 搜索防抖处理 */
const handleSearch = useDebounceFn(search, 300)

/** key up */
function handleUp() {
  inputRef.value?.blur()
  const { length } = resultOptions.value
  if (length === 0) return
  const index = resultOptions.value.findIndex(
    item => item.path === activePath.value,
  )
  if (index === 0) {
    activePath.value = resultOptions.value[length - 1].path || ''
  } else {
    activePath.value = resultOptions.value[index - 1].path || ''
  }
}

/** key down */
function handleDown() {
  inputRef.value?.blur()
  const { length } = resultOptions.value
  if (length === 0) return
  const index = resultOptions.value.findIndex(
    item => item.path === activePath.value,
  )
  if (index + 1 === length) {
    activePath.value = resultOptions.value[0].path || ''
  } else {
    activePath.value = resultOptions.value[index + 1].path || ''
  }
}

/** key enter */
function handleEnter() {
  const { length } = resultOptions.value
  if (length === 0 || activePath.value === '') return
  router.push(activePath.value)
  handleClose()
}

onKeyStroke('Enter', handleEnter)
onKeyStroke('ArrowUp', handleUp)
onKeyStroke('ArrowDown', handleDown)
</script>

<template>
  <el-dialog
    v-model="show"
    width="600px"
    title="菜单搜索"
    :show-close="false"
    destroy-on-close
    @before-close="handleClose"
  >
    <!-- 搜索框 -->
    <el-input
      ref="inputRef"
      v-model="keyword"
      autofocus
      clearable
      type="text"
      :prefix-icon="Search"
      @input="handleSearch"
    />

    <!-- 搜索结果容器 -->
    <div class="search-result-container">
      <el-empty v-if="resultOptions.length === 0" description="暂无搜索结果" />
      <SearchResult
        v-else
        v-model:value="activePath"
        :options="resultOptions as OptionsItem[]"
        @click="handleEnter"
      />
    </div>
  </el-dialog>
</template>

<style scoped>
:deep(.el-input__inner) {
  height: 40px;
  line-height: 40px;
}

.search-result-container {
  margin-top: 10px;
}
</style>
