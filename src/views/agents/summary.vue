<script setup lang="ts">
// 导入必要的类型和工具
import type { PageParam } from '~/types/global'
import type { AgentNode } from '~/types/agents/node'
import { pageNodeApi, refreshNodeStatusApi, operateNodeApi, getHostPublicKeyApi, checkAgentRunningStatusApi, type CheckAgentParams } from '~/api/agents/node'

// 定义组件名称，与路由name保持一致
defineOptions({
  name: 'agents_summary',
})

// 使用loading状态
const { loading, setLoading } = useLoading(true)

// 表格数据
const dataSource = ref<AgentNode[]>([])

// 刷新状态管理
interface RefreshState {
  status: 'pending' | 'refreshing' | 'success' | 'error'
  progress: number
}
const refreshStates = ref<Map<string, RefreshState>>(new Map())
const isRefreshing = ref(false)

// 更新节点刷新状态
function updateNodeRefreshState(nodeId: string, state: Partial<RefreshState>) {
  const currentState = refreshStates.value.get(nodeId) || { status: 'pending', progress: 0 }
  refreshStates.value.set(nodeId, { ...currentState, ...state })
}

// 重置所有节点刷新状态
function resetRefreshStates() {
  refreshStates.value.clear()
  dataSource.value.forEach(node => {
    if (node.nodeId) {
      refreshStates.value.set(node.nodeId, { status: 'pending', progress: 0 })
    }
  })
}

// 计算总体刷新进度
const totalRefreshProgress = computed(() => {
  if (refreshStates.value.size === 0) return 0
  const total = Array.from(refreshStates.value.values()).reduce((sum, state) => sum + state.progress, 0)
  return Math.round(total / refreshStates.value.size)
})

// 计算刷新状态
const refreshStatus = computed(() => {
  if (!isRefreshing.value) return 'idle'
  if (totalRefreshProgress.value === 100) return 'success'
  return 'refreshing'
})

// 排序状态管理
interface SortState {
  prop: string
  order: 'ascending' | 'descending' | null
}
const sortState = ref<SortState>({
  prop: '',
  order: null
})

// 排序后的数据
const sortedData = computed(() => {
  if (!sortState.value.prop || !sortState.value.order) {
    return dataSource.value
  }

  return [...dataSource.value].sort((a, b) => {
    const aValue = a[sortState.value.prop as keyof AgentNode]
    const bValue = b[sortState.value.prop as keyof AgentNode]

    // 处理数值类型
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortState.value.order === 'ascending' ? aValue - bValue : bValue - aValue
    }

    // 处理字符串类型
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortState.value.order === 'ascending' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    // 处理日期类型
    if (sortState.value.prop === 'lastHeartbeat') {
      const dateA = new Date(aValue as string).getTime()
      const dateB = new Date(bValue as string).getTime()
      return sortState.value.order === 'ascending' ? dateA - dateB : dateB - dateA
    }

    return 0
  })
})

// 分页后的数据
const paginatedData = computed(() => {
  const start = (page.value.current - 1) * page.value.limit
  const end = start + page.value.limit
  return sortedData.value.slice(start, end)
})

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
    const { success, data, message } = await pageNodeApi(param || { page: 1, limit: page.value.limit })
    
    if (success && data) {
      // 表格数据赋值
      dataSource.value = data.list || []
      // 更新总数
      page.value.total = dataSource.value.length
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
  page.value.current = data.current
  page.value.limit = data.limit
  // 更新总数
  page.value.total = sortedData.value.length
}

/** 排序事件 */
function changeSort(data: { prop: string; order: 'ascending' | 'descending' | null }) {
  sortState.value = {
    prop: data.prop,
    order: data.order
  }
}

/** 刷新节点状态 */
async function refreshNodeStatus() {
  if (isRefreshing.value) return
  
  isRefreshing.value = true
  resetRefreshStates()
  
  // 1. 从当前表格数据中提取所有节点ID
  const allNodeIds = dataSource.value
    .map(node => node.nodeId)
    .filter(id => id !== undefined) as string[]

  try {
    // 2. 将包含所有节点ID的数组传递给API
    const { success, message } = await refreshNodeStatusApi({ nodeIds: allNodeIds })
    
    if (success) {
      // 模拟进度更新
      for (const nodeId of allNodeIds) {
        updateNodeRefreshState(nodeId, { status: 'refreshing', progress: 0 })
        // 模拟进度更新
        for (let i = 0; i <= 100; i += 20) {
          await new Promise(resolve => setTimeout(resolve, 100))
          updateNodeRefreshState(nodeId, { progress: i })
        }
        updateNodeRefreshState(nodeId, { status: 'success', progress: 100 })
      }
      
      // 状态刷新成功后，重新获取表格数据以显示最新状态
      await fetchTableData()
      toastSuccess('刷新成功')
    } else {
      allNodeIds.forEach(nodeId => {
        updateNodeRefreshState(nodeId, { status: 'error', progress: 0 })
      })
      notifyError(message || '刷新失败')
    }
  } catch (error) {
    allNodeIds.forEach(nodeId => {
      updateNodeRefreshState(nodeId, { status: 'error', progress: 0 })
    })
    notifyError((error as Error).message || '刷新失败')
  } finally {
    setTimeout(() => {
      isRefreshing.value = false
      resetRefreshStates()
    }, 1000)
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

// 添加客户端弹窗相关状态
const addClientDialogVisible = ref(false)
const clientTab = ref('docker')
const clientForm = reactive({
  name: '',
  host: '',
  port: 45876,
  pubkey: 'ssh-ed25519 AAAAC3NzaC1ZDI1NTE5...'
})

// 获取主机公钥，带1小时缓存
async function getHostPublicKey(): Promise<string> {
  const CACHE_KEY = 'zeta_host_public_key'
  const CACHE_DURATION = 60 * 60 * 1000 // 1小时
  const now = Date.now()
  try {
    const cacheRaw = localStorage.getItem(CACHE_KEY)
    if (cacheRaw) {
      const cache = JSON.parse(cacheRaw)
      if (cache.publicKey && cache.timestamp && now - cache.timestamp < CACHE_DURATION) {
        return cache.publicKey
      }
    }
    // 发送网络请求
    const { code, data, message } = await getHostPublicKeyApi()
    if (code === 0 && typeof data === 'string' && !!data) {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ publicKey: data, timestamp: now }))
      return data
    } else {
      notifyError(message || '获取主机公钥失败')
      return ''
    }
  } catch (e) {
    notifyError('获取主机公钥异常')
    return ''
  }
}

// 打开添加客户端弹窗时，获取公钥
async function openAddClientDialog() {
  addClientDialogVisible.value = true
  clientForm.name = ''
  clientForm.host = ''
  clientForm.port = 45876
  clientForm.pubkey = ''
  const pubkey = await getHostPublicKey()
  if (pubkey) clientForm.pubkey = pubkey
}

function closeAddClientDialog() {
  addClientDialogVisible.value = false
}

function copyCommand() {
  const command: string = clientTab.value === 'docker' ? 'docker-compose.yml内容' : 'Linux安装命令内容'
  if ((window as any).navigator && (window as any).navigator.clipboard) {
    (window as any).navigator.clipboard.writeText(command)
    toastSuccess('命令已复制')
  } else {
    notifyError('当前浏览器不支持剪贴板操作')
  }
}

function copyPubkey() {
  if ((window as any).navigator && (window as any).navigator.clipboard) {
    (window as any).navigator.clipboard.writeText(clientForm.pubkey)
    toastSuccess('公钥已复制')
  } else {
    notifyError('当前浏览器不支持剪贴板操作')
  }
}

async function addClient() {
  // 添加客户端逻辑
  setLoading(true)
  try {
    // 构造请求参数
    const params: CheckAgentParams = {
      serverUserName: clientForm.name,
      sshServerIpOrHostName: clientForm.host,
      sshServerPort: clientForm.port,
      publicKey: clientForm.pubkey
    }
    
    // 发送检查请求
    const { code, message, data } = await checkAgentRunningStatusApi(params)
    
    if (code === 0) {
      // 成功情况
      toastSuccess(message || '客户端状态检查成功')
      closeAddClientDialog()
      // 刷新表格数据
      fetchTableData()
    } else {
      // 失败情况
      notifyError(message || '客户端状态检查失败')
    }
  } catch (error) {
    console.error('添加客户端异常:', error)
    notifyError('添加客户端异常')
  } finally {
    setLoading(false)
  }
}

const isClientFormValid = computed(() => {
  const portNum = Number(clientForm.port)
  return (
    !!clientForm.name &&
    !!clientForm.host &&
    !!clientForm.port &&
    !!clientForm.pubkey &&
    Number.isInteger(portNum) &&
    portNum >= 1024 &&
    portNum <= 65535
  )
})
</script>

<template>
  <div class="z-container">
    <div class="z-table-box">
      <div class="z-table-toolbar-opt" style="display: flex; justify-content: flex-end; align-items: center; gap: 12px; margin-bottom: 10px;">
        <el-button type="primary" :loading="isRefreshing" :disabled="isRefreshing" @click="refreshNodeStatus">
          <el-icon><i-ep-refresh /></el-icon>
          刷新状态
        </el-button>
        <el-button type="primary" @click="openAddClientDialog" icon="el-icon-plus">+ 添加客户端</el-button>
      </div>
      <e-table
        :loading="loading"
        :page="page"
        :columns="columns"
        :data-source="paginatedData"
        :default-toolbar="defaultToolbar"
        height="500px"
        @change="changePage"
        @sort-change="changeSort"
      >
        <!-- 工具栏 -->
        <template #toolbar>
          <div v-if="isRefreshing" class="refresh-progress">
            <el-progress 
              :percentage="totalRefreshProgress"
              :status="refreshStatus === 'success' ? 'success' : ''"
              :stroke-width="10"
            />
          </div>
        </template>
        <!-- 节点状态 -->
        <template #nodeStatus="{ row }">
          <div class="node-status">
            <el-tag :type="row.nodeStatus === 'online' ? 'success' : 'danger'">
              {{ row.nodeStatus === 'online' ? '在线' : '离线' }}
            </el-tag>
            <div v-if="isRefreshing && row.nodeId" class="refresh-indicator">
              <el-progress
                v-if="refreshStates.get(row.nodeId)?.status === 'refreshing'"
                :percentage="refreshStates.get(row.nodeId)?.progress || 0"
                :stroke-width="4"
                :show-text="false"
              />
              <el-icon v-else-if="refreshStates.get(row.nodeId)?.status === 'success'" class="success-icon">
                <i-ep-check />
              </el-icon>
              <el-icon v-else-if="refreshStates.get(row.nodeId)?.status === 'error'" class="error-icon">
                <i-ep-close />
              </el-icon>
            </div>
          </div>
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
    <!-- 添加客户端弹窗 -->
    <el-dialog v-model="addClientDialogVisible" title="添加新客户端" width="400px" :close-on-click-modal="false" @close="closeAddClientDialog">
      <el-tabs v-model="clientTab" stretch>
        <el-tab-pane label="Docker" name="docker"></el-tab-pane>
        <el-tab-pane label="二进制" name="binary"></el-tab-pane>
      </el-tabs>
      <div style="margin-bottom: 8px; color: #888; font-size: 13px;">
        必须在系统上运行客户端之后才能连接。复制下面的 <span v-if="clientTab==='docker'">docker-compose.yml</span><span v-else>客户端安装命令</span>。
      </div>
      <el-form :model="clientForm" label-width="120px" style="margin-top: 8px;">
        <el-form-item label="客户端-用户名">
          <el-input v-model="clientForm.name" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="主机/IP">
          <el-input v-model="clientForm.host" placeholder="请输入主机或IP地址" />
        </el-form-item>
        <el-form-item label="端口">
          <el-input v-model="clientForm.port" placeholder="请输入端口" />
        </el-form-item>
        <el-form-item label="公钥">
          <el-input v-model="clientForm.pubkey" readonly suffix-icon="el-icon-document-copy" @click="copyPubkey" />
        </el-form-item>
      </el-form>
      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
        <el-button @click="copyCommand" plain :disabled="!isClientFormValid">
          复制{{ clientTab==='docker' ? 'docker compose' : 'Linux安装命令' }}
        </el-button>
        <el-button type="primary" @click="addClient" :disabled="!isClientFormValid">添加客户端</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* 如果需要自定义样式，可以在这里添加 */
.el-progress {
  width: 100%;
  margin: 0;
}

.refresh-progress {
  margin-top: 10px;
  width: 200px;
}

.node-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.refresh-indicator {
  width: 40px;
  height: 4px;
  position: relative;
}

.success-icon {
  color: var(--el-color-success);
  font-size: 16px;
}

.error-icon {
  color: var(--el-color-danger);
  font-size: 16px;
}

/* 添加刷新动画 */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.el-icon.is-loading {
  animation: spin 1s linear infinite;
}
</style>
