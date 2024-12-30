<script setup lang="ts">
import type { SchemaItem } from './components/interface'
import Descriptions from './components/descriptions.vue'
import { pkgJson } from './model'

defineOptions({
  // 跟路由name保持一致
  name: 'about',
})

const { dependencies, devDependencies, name, version } = pkgJson

/** 生成环境依赖 */
const schema: SchemaItem[] = dependencies?.map(item => ({
  label: item.name,
  value: item.version,
})) || []

/** 开发环境依赖 */
const devSchema: SchemaItem[] = devDependencies?.map(item => ({
  label: item.name,
  value: item.version,
})) || []

/** 项目信息 */
const infoSchema: SchemaItem[] = [
  {
    label: '版本',
    value: version,
  },
  {
    label: '最后编译时间',
    value: PROJECT_BUILD_TIME,
  },
  {
    label: '预览地址',
    value: '无',
  },
  {
    label: '文档地址',
    value: '<a href="https://gitee.com/xia5800/zeta-web-element/tree/master/_docs" target="_blank" style="color:#409EFF">_docs</a>',
  },
  {
    label: 'github',
    value: '<a href="https://github.com/xia5800/zeta-web-element" target="_blank" style="color:#409EFF">https://github.com/xia5800/zeta-web-element</a>',
  },
  {
    label: 'gitee',
    value: '<a href="https://gitee.com/xia5800/zeta-web-element" target="_blank" style="color:#409EFF">https://gitee.com/xia5800/zeta-web-element</a>',
  },
  {
    label: '开源许可',
    value: 'MIT',
  },
]
</script>

<template>
  <div class="z-container z-user-select-none">
    <el-card shadow="never">
      <p class="header-title">
        关于
      </p>
      <p class="header-describe">
        {{ name }} 是一个基于Vue3、Vite5、Pinia、TypeScript、ElementPlus 开发的前端脚手架项目。
        本项目只提供了一个最基础的RBAC用户角色权限功能。不像其它开源项目那样大而全，本项目相当精简
      </p>
    </el-card>

    <el-card header="项目信息" shadow="never">
      <Descriptions :schema-item="infoSchema" :column="4" />
    </el-card>

    <el-card header="生产环境依赖" shadow="never">
      <Descriptions :schema-item="schema" :column="4" />
    </el-card>

    <el-card header="开发环境依赖" shadow="never">
      <Descriptions :schema-item="devSchema" :column="4" />
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
