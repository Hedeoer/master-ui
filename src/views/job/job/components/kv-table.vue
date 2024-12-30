<!--
组件名称：KV表格
说明：用于展示和编辑键值对的表格，在需要展示键值对的地方使用
用法：
```vue
<script setup lang="ts">
import KvTable from './kv-table.vue'

const kvTable = ref()
const kvParam = ref<string>('{"name":"张三", "age":18}')

function setData(param: string) {
  kvTable.value.setTableData(param)
}

function getData() {
  alert(kvTable.value.getTableData())
}
</script>

<template>
  <div>
    <KvTable ref="kvTable" />
    <button @click="setData(kvParam)">设置值</button>
    <button @click="getData()">取值</button>
  </div>
</template>
```
属性：
- height：表格高度  非必填   默认值：200px
- addBtnName：新增按钮的文字  非必填   默认值：添加参数
方法：
- getTableData：获取表格数据
- setTableData：设置表格数据
-->
<script setup lang="ts">
withDefaults(defineProps<{
  /** 表格高度 */
  height?: string | number
  /** 新增按钮的文字 */
  addBtnName?: string
}>(), {
  height: '200px',
  addBtnName: '添加参数',
})

// 自定义类型
interface Kv {
  id: number
  key: string
  value?: string | number
  valueType: string
}

// 表格字段
const columns = [
  {
    label: '键',
    prop: 'key',
    align: 'center',
    fixed: 'left',
    customSlot: 'key',
  },
  {
    label: '值',
    prop: 'value',
    align: 'center',
    customSlot: 'value',
  },
  {
    prop: 'operator',
    label: '操作',
    align: 'center',
    customSlot: 'operator',
    fixed: 'right',
  },
]

// 组件暴露的属性和方法
defineExpose({
  getTableData,
  setTableData,
})

// 表格数据
const dataSource = ref<Kv[]>([])

/** 获取数据. 父组件调用 */
function getTableData(): string {
  if (dataSource.value.length === 0) return ''
  let result = {}

  // 把 [{"key: "age", value: "123"}, {"key": "name", value: "tom"}]
  // 转换成 {"age": "123", "name": "tom"}
  dataSource.value
    .filter((item: Kv) => item.key !== '')
    .forEach((item: Kv) => {
      result = {
        ...result,
        ...{ [item.key]: item.value },
      }
    })
  return JSON.stringify(result)
}

/** 设置数据. 父组件调用 */
function setTableData(data?: string) {
  if (!data) return

  // {"age": "123", "name": "tom"}
  const parse = JSON.parse(data) as any

  // 处理 {} 的情况
  if (Object.keys(parse).length === 0) return

  // 把 {"age": "123", "name": "tom"}
  // 转换为[
  //   {"id": 1, "key": "age", "value": "123", "valueType": "string"}
  //   {"id": 2, "key": "name", "value": "tom", "valueType": "string"}
  // ]
  const tableData: Kv[] = new Array<Kv>()
  Object.entries(parse).forEach(([key, value], index: number) => {
    const valueType = typeof value === 'number' ? 'number' : 'string'
    tableData.push({
      id: index + 1,
      key,
      value,
      valueType,
    } as Kv)
  })

  // 表格赋值
  dataSource.value = tableData
}

/** 处理添加 */
function handleAdd() {
  dataSource.value.push({
    id: dataSource.value.length + 1,
    key: '',
    value: '',
    valueType: 'string',
  })
}

/** 处理删除 */
function handleDelete(row: Kv) {
  dataSource.value = dataSource.value.filter(item => item.id !== row.id)
}

/** 修改值类型 */
function changeValueType(row: Kv) {
  if (row.valueType === 'number') {
    row.valueType = 'string'
    row.value = ''
  } else {
    row.valueType = 'number'
    row.value = 0
  }
}

onMounted(() => {
  // 添加一条空白数据
  handleAdd()
})
</script>

<template>
  <div>
    <e-table :columns="columns" :data-source="dataSource" :height="height">
      <!-- key列 -->
      <template #key="{ row }">
        <el-input
          v-model:="row.key"
          placeholder="请填写key"
          @change="(value: string) => row.key = value"
        />
      </template>

      <!-- value列 -->
      <template #value="{ row }">
        <el-input
          v-if="row.valueType === 'string'"
          v-model:="row.value"
          placeholder="请填写value"
          @change="(value: string) => row.value = value"
        />
        <el-input-number
          v-if="row.valueType === 'number'"
          controls-position="right"
          style="width: 100%;"
          :model-value="row.value"
          @change="(value: any, _: any) => row.value = value as number"
        />
      </template>

      <!-- 操作列 -->
      <template #operator="{ row }">
        <el-button type="primary" size="small" @click="changeValueType(row)">
          {{ row.valueType === 'string' ? 'num' : 'str' }}
        </el-button>
        <el-button type="danger" size="small" @click="handleDelete(row)">
          删除
        </el-button>
      </template>
    </e-table>

    <!-- 新增按钮 -->
    <div style="margin-top: 10px">
      <el-button class="btn_dashed_line_primary" style="width: 100%;" @click="handleAdd">
        {{ addBtnName }}
      </el-button>
    </div>
  </div>
</template>
