<script lang="ts">
import * as echarts from 'echarts'
import { defineComponent, onMounted, ref } from 'vue'

export default defineComponent({
  setup() {
    const mainRef = ref()
    onMounted(() => {
      const chartDom = mainRef.value

      const myChart = echarts.init(chartDom)

      const option = {
        radar: {
          indicator: [
            { name: '进攻', max: 6500 },
            { name: '技巧', max: 16000 },
            { name: '力量', max: 30000 },
            { name: '速度', max: 38000 },
            { name: '体能', max: 52000 },
            { name: '防守', max: 25000 },
          ],
        },
        series: [
          {
            name: 'Budget vs spending',
            type: 'radar',
            data: [
              {
                value: [4200, 3000, 20000, 35000, 50000, 18000],
              },
              {
                value: [5000, 14000, 28000, 26000, 42000, 21000],
              },
            ],
          },
        ],
      }
      myChart.setOption(option)
    })
    return {
      mainRef,
    }
  },
})
</script>

<template>
  <div class="z-container">
    <el-row :gutter="10">
      <el-col :md="18" :sm="18" :xs="24">
        <el-row :gutter="10">
          <el-col :md="24">
            <el-card class="project-grids" shadow="never" style="border: none;">
              <template #header>
                最近更新
              </template>
              <el-row>
                <el-col :md="8">
                  <div class="project-grid">
                    <div class="project-grid-title">
                      <el-icon><i-ep-home-filled /></el-icon>
                      <a>upload</a>
                    </div>
                    <p class="project-grid-center">
                      新增 16794 条问题，16348 条已解决
                    </p>
                    <p class="project-grid-footer">
                      <a>文件上传</a>
                      <span>7天前</span>
                    </p>
                  </div>
                </el-col>
                <el-col :md="8">
                  <div class="project-grid">
                    <div class="project-grid-title">
                      <el-icon><i-ep-home-filled /></el-icon>
                      <a>upload</a>
                    </div>
                    <p class="project-grid-center">
                      新增 16637 条问题，16001 条已解决
                    </p>
                    <p class="project-grid-footer">
                      <a>文件上传</a>
                      <span>7天前</span>
                    </p>
                  </div>
                </el-col>
                <el-col :md="8">
                  <div class="project-grid">
                    <div class="project-grid-title">
                      <el-icon><i-ep-home-filled /></el-icon>
                      <a>upload</a>
                    </div>
                    <p class="project-grid-center">
                      新增 15612 条问题，13640 条已解决
                    </p>
                    <p class="project-grid-footer">
                      <a>文件上传</a>
                      <span>7天前</span>
                    </p>
                  </div>
                </el-col>
                <el-col :md="8">
                  <div class="project-grid">
                    <div class="project-grid-title">
                      <el-icon><i-ep-home-filled /></el-icon>
                      <a>upload</a>
                    </div>
                    <p class="project-grid-center">
                      新增 19531 条问题，13950 条已解决
                    </p>
                    <p class="project-grid-footer">
                      <a>文件上传</a>
                      <span>7天前</span>
                    </p>
                  </div>
                </el-col>
                <el-col :md="8">
                  <div class="project-grid">
                    <div class="project-grid-title">
                      <el-icon><i-ep-home-filled /></el-icon>
                      <a>upload</a>
                    </div>
                    <p class="project-grid-center">
                      新增 16366 条问题，17887 条已解决
                    </p>
                    <p class="project-grid-footer">
                      <a>文件上传</a>
                      <span>7天前</span>
                    </p>
                  </div>
                </el-col>
                <el-col :md="8">
                  <div class="project-grid">
                    <div class="project-grid-title">
                      <el-icon><i-ep-home-filled /></el-icon>
                      <a>upload</a>
                    </div>
                    <p class="project-grid-center">
                      新增 15893 条问题，17021 条已解决
                    </p>
                    <p class="project-grid-footer">
                      <a>文件上传</a>
                      <span>7天前</span>
                    </p>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </el-col>
          <el-col :md="24">
            <el-card shadow="never" style="border: none;">
              <template #header>
                最近动态
              </template>
              <dl>
                <dd class="dynamic">
                  <div class="layui-status-img">
                    <a href="javascript:;"><img></a>
                  </div>
                  <div>
                    <p>张三 在 <a href="javascript:;/vipclub/list/layuiadmin/">讨论区</a> 回答问题</p>
                    <span>几秒前</span>
                  </div>
                </dd>
                <dd class="dynamic">
                  <div class="layui-status-img">
                    <a href="javascript:;"><img></a>
                  </div>
                  <div>
                    <p>张三 在 <a href="javascript:;/vipclub/list/layuiadmin/">讨论区</a> 回答问题</p>
                    <span>几秒前</span>
                  </div>
                </dd>
                <dd class="dynamic">
                  <div class="layui-status-img">
                    <a href="javascript:;"><img></a>
                  </div>
                  <div>
                    <p>张三 在 <a href="javascript:;/vipclub/list/layuiadmin/">讨论区</a> 回答问题</p>
                    <span>几秒前</span>
                  </div>
                </dd>
                <dd class="dynamic">
                  <div class="layui-status-img">
                    <a href="javascript:;"><img></a>
                  </div>
                  <div>
                    <p>张三 在 <a href="javascript:;/vipclub/list/layuiadmin/">讨论区</a> 回答问题</p>
                    <span>几秒前</span>
                  </div>
                </dd>
              </dl>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
      <el-col :md="6" :sm="6" :xs="24">
        <el-row :gutter="10">
          <el-col :md="24">
            <el-card shadow="never" style="border: none;">
              <template #header>
                便捷导航
              </template>
              <div class="links">
                <a>操作一</a>
                <a>操作二</a>
                <a>操作三</a>
                <a>操作四</a>
                <a>操作五</a>
                <a>操作六</a>
                <a>操作七</a>
                <a>操作八</a>
              </div>
            </el-card>
          </el-col>
          <el-col :md="24">
            <el-card shadow="never" style="border: none;">
              <template #header>
                八卦新闻
              </template>
              <div id="main" ref="mainRef" />
            </el-card>
          </el-col>
          <el-col :md="24">
            <el-card shadow="never" style="border: none;">
              <template #header>
                产品动态
              </template>
              <div style="padding: 10px;">
                <a class="news">官网文档</a>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.project-grids .layui-card-body {
  padding: 0;
}

.project-grid {
  padding: 14px;
  background-color: var(--el-color-info-light-9);
  margin: 10px;
}
.dark {
  background-color: #009b8e0d;
}

.project-grid .project-grid-title i {
  margin-right: 10px;
  font-size: 24px;
  color: var(--el-color-primary);
}

.project-grid .project-grid-title a {
  line-height: 24px;
  font-size: 16px;
  vertical-align: top;
}

.project-grid .project-grid-center {
  height: 22px;
  line-height: 22px;
  margin-bottom: 6px;
  overflow: hidden;
}

.project-grid .project-grid-footer {
  position: relative;
}

.project-grid .project-grid-footer a {
  color: #777;
  font-size: 12px;
  text-overflow: ellipsis;
  word-break: break-all;
}

.project-grid .project-grid-footer span {
  color: #ccc;
  font-size: 12px;
  position: absolute;
  right: 0;
}

.dynamic {
  padding: 8px 0;
  border-bottom: 1px solid var(--el-border-color-light);
  display: -webkit-flex;
  display: flex;
}
.dynamic p {
  margin: 2px 0;
}

.dynamic .layui-status-img {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: var(--el-color-primary);
  margin-right: 15px;
}

.dynamic a {
  color: #01aaed;
}

.dynamic span {
  color: #bbb;
  font-size: 12px;
}

.links {
  padding: 10px;
  text-align: center;
}

.links a {
  width: 25%;
  font-size: 14px;
  margin-top: 8px;
  margin-bottom: 8px;
  display: inline-block;
}

.news {
  display: block;
  line-height: 60px;
  text-align: center;
  background-color: var(--el-color-primary);
  color: #fff !important;
  margin-bottom: 10px;
}

#main {
  height: 300px;
  width: 100%;
}

:deep(.el-card__body) {
  padding: 0;
}
</style>
