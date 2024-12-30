<script lang="ts" setup>
interface Color {
  name: string
  value: string
}
const props = defineProps<{
  modelValue: string
}>()

const emits = defineEmits(['update:modelValue'])
const options: Color[] = [
  { name: '主题色一', value: '#1890ff' },
  { name: '主题色二', value: '#5f80c7' },
  { name: '主题色三', value: '#faad14' },
  { name: '主题色四', value: '#f5686f' },
  { name: '主题色五', value: '#9266f9' },
  { name: '主题色六', value: '#33cc99' },
  { name: '主题色七', value: '#32a2d4' },
]
// 设置主题色
const { changeTheme } = useElementPlusTheme(props.modelValue)

/**
 * 颜色修改
 * @param color 主题色
 */
const handlerChange = function (color: string) {
  changeTheme(color)
  emits('update:modelValue', color)
}
</script>

<template>
  <div class="color-list">
    <template v-for="(option, index) in options" :key="index">
      <el-tooltip :content="option.name" position="bottom" :show-after="200">
        <span :style="{ background: option.value }" @click="handlerChange(option.value)">
          <el-icon v-if="option.value === modelValue" class="icon"><i-ep-check /></el-icon>
        </span>
      </el-tooltip>
    </template>
  </div>
</template>

<style>
.color-list {
  display: flex;
}

.color-list span {
  text-align: center;
  width: 24px;
  height: 24px;
  line-height: 24px;
  margin-left: 14px;
  border-radius: 2px;
  box-shadow: 0 1px 2px 0 rgb(0 0 0 / 15%);
  color: white;
}

.color-list .icon {
  width: 24px;
  height:24px;
}
</style>
