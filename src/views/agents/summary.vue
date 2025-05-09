<script setup lang="ts">
// 导入必要的类型和工具
import type { PageParam } from '~/types/global'
import type { AgentNode } from '~/types/agents/node'
import { pageNodeApi, refreshNodeStatusApi, operateNodeApi } from '~/api/agents/node'

// 定义组件名称，与路由name保持一致
defineOptions({
  name: 'agents_summary',
})

// 使用loading状态
const { loading, setLoading } = useLoading(true)

// 表格数据
const dataSource = ref<AgentNode[]>([])

// 表格分页器配置
const page = ref({
  total: 0,
  limit: 10,
  current: 1,
})

// 表格工具栏配置
const defaultToolbar = ref(true)

// 表格列定义
const columns = [
  {
    title: '#',
    type: 'index',
    width: '50px',
    fixed: 'left',
  },
  {
    key: 'nodeId',
    title: '节点ID',
    minWidth: '120px',
    sortable: 'custom',
    showOverflowTooltip: true,
    align: 'center',
  },
  {
    key: 'nodeName',
    title: '主机名',
    minWidth: '150px',
    showOverflowTooltip: true,
    align: 'center',
  },
  {
    key: 'nodeIp',
    title: 'IP地址',
    minWidth: '120px',
    align: 'center',
  },
  {
    key: 'nodeStatus',
    title: '状态',
    width: '100px',
    align: 'center',
    customSlot: 'nodeStatus',
  },
  {
    key: 'cpuUsage',
    title: 'CPU利用率',
    width: '120px',
    sortable: 'custom',
    align: 'center',
    customSlot: 'cpuUsage',
  },
  {
    key: 'memoryUsage',
    title: '内存利用率',
    width: '120px',
    sortable: 'custom',
    align: 'center',
    customSlot: 'memoryUsage',
  },
  {
    key: 'diskUsage',
    title: '磁盘利用率',
    width: '120px',
    sortable: 'custom',
    align: 'center',
    customSlot: 'diskUsage',
  },
  {
    key: 'clientVersion',
    title: '客户端版本',
    width: '120px',
    sortable: 'custom',
    align: 'center',
  },
  {
    key: 'lastHeartbeat',
    title: '最后心跳时间',
    width: '180px',
    sortable: 'custom',
    align: 'center',
  },
  {
    key: 'operator',
    title: '操作',
    width: '100px',
    align: 'center',
    customSlot: 'operator',
    fixed: 'right',
  },
]

/**
 * 获取表格数据
 * @param param 自定义分页查询参数
 */
async function fetchTableData(param?: PageParam<AgentNode>) {
  setLoading(true)
  try {
    // 调用API获取数据
    const { success, data, message } = await pageNodeApi(param || { page: page.value.current, limit: page.value.limit })
    
    if (success && data) {
      // 修改分页器数据
      if (param && param.page) page.value.current = param.page
      page.value.total = Number(data.count || 0)
      // 表格数据赋值
      dataSource.value = data.list || []
    } else {
      notifyError(message || '获取节点列表失败')
    }
  } catch (error) {
    console.error(error)
    notifyError((error as Error).message || '获取节点列表失败')
  } finally {
    setLoading(false)
  }
}

// 初始加载数据
fetchTableData()

/** 分页事件 */
function changePage(data: any) {
  const param = {
    page: data.current,
    limit: data.limit,
  }
  fetchTableData(param)
}

/** 排序事件 */
function changeSort(data: any) {
  const param = {
    page: page.value.current,
    limit: page.value.limit,
    sort: data.prop,
    order: data.order,
  }
  fetchTableData(param)
}

/** 刷新节点状态 */
async function refreshNodeStatus() {
  // 1. 从当前表格数据中提取所有节点ID
  const allNodeIds = dataSource.value
    .map(node => node.nodeId) // 提取 nodeId
    .filter(id => id !== undefined) as string[]; // 过滤掉可能存在的 undefined 值并断言类型

  try {
    // 2. 将包含所有节点ID的数组传递给API
    const { success, message } = await refreshNodeStatusApi({ nodeIds: allNodeIds });
    if (success) {
      // 状态刷新成功后，重新获取表格数据以显示最新状态
      fetchTableData();
      toastSuccess('刷新成功');
    } else {
      notifyError(message || '刷新失败');
    }
  } catch (error) {
    notifyError((error as Error).message || '刷新失败');
  }
}

// 定义操作类型映射
type OperationType = 'restart' | 'stop' | 'detail'
const operations: Record<OperationType, string> = {
  restart: '重启',
  stop: '停止',
  detail: '查看详情',
}

/** 处理节点操作 */
function handleNodeOperation(type: OperationType, nodeId: string) {
  if (type === 'detail') {
    // 实现查看节点详情的逻辑
    // 可以使用弹窗或路由跳转
    notifyInfo(`查看节点 ${nodeId} 详情`)
    return
  }
  
  // 确认操作
  confirmMsg(`确定要${operations[type]}节点 ${nodeId} 吗？`, {}, async () => {
    try {
      // 调用API执行操作
      const { success, message } = await operateNodeApi({ 
        nodeId, 
        operation: type 
      })
      
      if (success) {
        toastSuccess(`${operations[type]}操作已发送`)
        // 重新获取表格数据
        fetchTableData()
      } else {
        notifyError(message || `${operations[type]}操作失败`)
      }
    } catch (err) {
      notifyError((err as Error).message, '错误')
    }
  })
}
</script>

<template>
  <div class="z-container">
    <div class="z-table-box">
      <e-table
        :loading="loading"
        :page="page"
        :columns="columns"
        :data-source="dataSource"
        :default-toolbar="defaultToolbar"
        height="500px"
        @change="changePage"
        @sort-change="changeSort"
      >
        <!-- 工具栏 -->
        <template #toolbar>
          <el-button
            type="primary"
            @click="refreshNodeStatus"
          >
            <el-icon><i-ep-refresh /></el-icon>
            刷新状态
          </el-button>
        </template>
        <!-- 节点状态 -->
        <template #nodeStatus="{ row }">
          <el-tag :type="row.nodeStatus === 'online' ? 'success' : 'danger'">
            {{ row.nodeStatus === 'online' ? '在线' : '离线' }}
          </el-tag>
        </template>
        <!-- CPU利用率 -->
        <template #cpuUsage="{ row }">
          <el-progress
            :percentage="row.cpuUsage"
            :color="(percentage) => (percentage > 90 ? '#F56C6C' : percentage > 80 ? '#E6A23C' : '#67C23A')"
            :stroke-width="10"
            :show-text="true"
          />
        </template>
        <!-- 内存利用率 -->
        <template #memoryUsage="{ row }">
          <el-progress
            :percentage="row.memoryUsage"
            :color="(percentage) => (percentage > 90 ? '#F56C6C' : percentage > 80 ? '#E6A23C' : '#67C23A')"
            :stroke-width="10"
            :show-text="true"
          />
        </template>
        <!-- 磁盘利用率 -->
        <template #diskUsage="{ row }">
          <el-progress
            :percentage="row.diskUsage"
            :color="(percentage) => (percentage > 90 ? '#F56C6C' : percentage > 80 ? '#E6A23C' : '#67C23A')"
            :stroke-width="10"
            :show-text="true"
          />
        </template>
        <!-- 操作列 -->
        <template #operator="{ row }">
          <el-dropdown>
            <el-button size="small" type="primary">
              <span>操作</span>
              <el-icon class="el-icon--right"><i-ep-arrow-down /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleNodeOperation('detail', row.nodeId)">
                  <el-icon><i-ep-view /></el-icon> 详情
                </el-dropdown-item>
                <el-dropdown-item 
                  :disabled="row.nodeStatus !== 'online'"
                  @click="handleNodeOperation('restart', row.nodeId)"
                >
                  <el-icon><i-ep-refresh-right /></el-icon> 重启
                </el-dropdown-item>
                <el-dropdown-item 
                  :disabled="row.nodeStatus !== 'online'"
                  @click="handleNodeOperation('stop', row.nodeId)"
                >
                  <el-icon><i-ep-turn-off /></el-icon> 停止
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </e-table>
    </div>
  </div>
</template>

<style scoped>
/* 如果需要自定义样式，可以在这里添加 */
.el-progress {
  width: 100%;
  margin: 0;
}
</style>
