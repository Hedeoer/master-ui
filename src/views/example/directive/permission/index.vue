<script setup lang="ts">
const useStore = useUserStore()
</script>

<template>
  <div class="z-container">
    <el-card shadow="never">
      <p class="header-title">
        权限指令
      </p>
      <p class="header-describe">
        表单页用于向用户收集或验证信息，基础表单常见于数据项较少的表单场景。表单域标签也可支持响应式.
      </p>
    </el-card>

    <el-card header="我的权限" shadow="never">
      {{ useStore.permissions }}
    </el-card>

    <el-card header="我的按钮" shadow="never">
      <el-space>
        <el-button v-permission="['sys:user:save']" type="primary">
          新增
        </el-button>
        <el-button v-permission="['sys:user:update']" type="warning">
          编辑
        </el-button>
        <el-button v-permission="['sys:user:delete']" type="danger">
          删除
        </el-button>
        <el-button v-permission="['sys:user:import']">
          导入
        </el-button>
        <el-button v-permission="['sys:user:export']">
          导出
        </el-button>
      </el-space>
    </el-card>
  </div>
</template>

<style scoped>
.header-title {
  font-size: 20px;
  font-weight: 500;
  margin-top: 12px;
  margin-bottom: 20px;
}

.header-describe {
  font-size: 14px;
  margin-bottom: 12px;
}
</style>
