<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue';
import {
  ElCard,
  ElTabs,
  ElTabPane,
  ElTable,
  ElTableColumn,
  ElButton,
  ElTag,
  ElSwitch,
  ElAlert,
  ElLink,
  ElIcon,
  ElSelect,
  ElOption,
  ElPagination,
  ElPopover,
  ElInput,
  ElDialog,
  ElForm,
  ElFormItem,
  ElMessageBox,
  ElDivider
} from 'element-plus';
import { Search, Position, Delete, Edit, Plus, Warning, Operation } from '@element-plus/icons-vue';

// 定义组件名称，与路由name保持一致
defineOptions({
  name: 'AgentFirewall',
});

// 活动标签页
const activeTab = ref('port');

// 加载状态
const loading = ref(false);

// --- 防火墙状态数据 ---
const firewallStatus = ref('running'); // 'running' 或 'not running'
const firewallName = ref('UFW');
const firewallVersion = ref('0.36.2');
const pingDisabled = ref(true);
const maskShow = ref(false);

// --- 定义类型接口 ---
interface PortRule {
  id: number;
  protocol: string;
  port: string;
  strategy: 'accept' | 'drop';
  address: string;
  description: string;
  usedStatus: string | null;
  usedPorts?: string[];
}

interface IPRule {
  id: number;
  address: string;
  strategy: 'accept' | 'drop';
  description: string;
}

interface ForwardRule {
  id: number;
  srcPort: string;
  dstPort: string;
  dstAddr: string;
  protocol: string;
  description: string;
}

// --- 模拟数据 ---
// 端口规则数据
const portRules = ref<PortRule[]>([
  { 
    id: 1, 
    protocol: 'TCP', 
    port: '22', 
    strategy: 'accept', 
    address: 'Anywhere', 
    description: 'SSH服务', 
    usedStatus: 'inUsed' 
  },
  { 
    id: 2, 
    protocol: 'TCP', 
    port: '80', 
    strategy: 'accept', 
    address: 'Anywhere', 
    description: 'HTTP服务', 
    usedStatus: 'inUsed' 
  },
  { 
    id: 3, 
    protocol: 'TCP', 
    port: '443', 
    strategy: 'accept', 
    address: 'Anywhere', 
    description: 'HTTPS服务', 
    usedStatus: 'inUsed' 
  },
  { 
    id: 4, 
    protocol: 'TCP/UDP', 
    port: '3000-4000', 
    strategy: 'accept', 
    address: '192.168.1.1', 
    description: '开发服务端口范围', 
    usedStatus: null 
  },
  { 
    id: 5, 
    protocol: 'UDP', 
    port: '53', 
    strategy: 'accept', 
    address: 'Anywhere', 
    description: 'DNS服务', 
    usedStatus: 'inUsed' 
  },
  { 
    id: 6, 
    protocol: 'TCP', 
    port: '8080-8090', 
    strategy: 'drop', 
    address: 'Anywhere', 
    description: '禁止访问的测试端口范围', 
    usedStatus: 'inUsed',
    usedPorts: ['8080', '8082', '8085'] 
  },
  { 
    id: 7, 
    protocol: 'TCP', 
    port: '25', 
    strategy: 'drop', 
    address: 'Anywhere', 
    description: '阻止SMTP', 
    usedStatus: null 
  },
  { 
    id: 8, 
    protocol: 'TCP', 
    port: '21', 
    strategy: 'drop', 
    address: 'Anywhere', 
    description: '阻止FTP', 
    usedStatus: null 
  },
  { 
    id: 9, 
    protocol: 'TCP', 
    port: '3389', 
    strategy: 'drop', 
    address: 'Anywhere', 
    description: '阻止远程桌面连接', 
    usedStatus: null 
  },
  { 
    id: 10, 
    protocol: 'TCP', 
    port: '5900-5910', 
    strategy: 'drop', 
    address: 'Anywhere', 
    description: '阻止VNC服务', 
    usedStatus: null 
  }
]);

// IP规则数据
const ipRules = ref<IPRule[]>([
  { id: 1, address: '192.168.1.100', strategy: 'accept', description: '允许特定主机访问' },
  { id: 2, address: '192.168.1.0/24', strategy: 'accept', description: '允许局域网访问' },
  { id: 3, address: '10.0.0.0/8', strategy: 'drop', description: '禁止特定网段访问' },
  { id: 4, address: '1.2.3.4', strategy: 'drop', description: '已知恶意IP' },
  { id: 5, address: '5.6.7.8', strategy: 'drop', description: '已知恶意IP' },
  { id: 6, address: '172.16.0.0/16', strategy: 'accept', description: '允许开发网络访问' }
]);

// 端口转发规则数据
const forwardRules = ref<ForwardRule[]>([
  { id: 1, srcPort: '80', dstPort: '8080', dstAddr: '192.168.1.100', protocol: 'tcp', description: '转发Web流量' },
  { id: 2, srcPort: '443', dstPort: '8443', dstAddr: '192.168.1.100', protocol: 'tcp', description: '转发安全Web流量' },
  { id: 3, srcPort: '25', dstPort: '2525', dstAddr: '192.168.1.101', protocol: 'tcp', description: '转发邮件服务' },
  { id: 4, srcPort: '53', dstPort: '5353', dstAddr: '192.168.1.102', protocol: 'udp', description: 'DNS转发' },
  { id: 5, srcPort: '22', dstPort: '2222', dstAddr: '10.0.0.5', protocol: 'tcp', description: 'SSH转发' }
]);

// --- 查询和过滤参数 ---
// 端口规则过滤
const portSearchStatus = ref('');
const portSearchStrategy = ref('');
const portSearchQuery = ref('');

// IP规则过滤
const ipSearchStrategy = ref('');
const ipSearchQuery = ref('');

// 转发规则过滤
const forwardSearchQuery = ref('');

// --- 分页配置 ---
// 端口规则分页
const portPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => filteredPortRules.value.length)
});

// IP规则分页
const ipPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => filteredIPRules.value.length)
});

// 转发规则分页
const forwardPagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: computed(() => filteredForwardRules.value.length)
});

// --- 已选择行 ---
const selectedPortRows = ref<PortRule[]>([]);
const selectedIPRows = ref<IPRule[]>([]);
const selectedForwardRows = ref<ForwardRule[]>([]);

// --- 计算属性：过滤后的规则 ---
// 过滤后的端口规则
const filteredPortRules = computed(() => {
  let result = [...portRules.value];
  
  // 按状态过滤
  if (portSearchStatus.value) {
    if (portSearchStatus.value === 'used') {
      result = result.filter(rule => rule.usedStatus !== null);
    } else if (portSearchStatus.value === 'free') {
      result = result.filter(rule => rule.usedStatus === null);
    }
  }
  
  // 按策略过滤
  if (portSearchStrategy.value) {
    result = result.filter(rule => rule.strategy === portSearchStrategy.value);
  }
  
  // 按搜索词过滤
  if (portSearchQuery.value) {
    const query = portSearchQuery.value.toLowerCase();
    result = result.filter(rule => 
      rule.port.toLowerCase().includes(query) ||
      rule.protocol.toLowerCase().includes(query) ||
      rule.description.toLowerCase().includes(query) ||
      (rule.address && rule.address.toLowerCase().includes(query))
    );
  }
  
  return result;
});

// 过滤后的IP规则
const filteredIPRules = computed(() => {
  let result = [...ipRules.value];
  
  // 按策略过滤
  if (ipSearchStrategy.value) {
    result = result.filter(rule => rule.strategy === ipSearchStrategy.value);
  }
  
  // 按搜索词过滤
  if (ipSearchQuery.value) {
    const query = ipSearchQuery.value.toLowerCase();
    result = result.filter(rule => 
      rule.address.toLowerCase().includes(query) ||
      rule.description.toLowerCase().includes(query)
    );
  }
  
  return result;
});

// 过滤后的转发规则
const filteredForwardRules = computed(() => {
  let result = [...forwardRules.value];
  
  // 按搜索词过滤
  if (forwardSearchQuery.value) {
    const query = forwardSearchQuery.value.toLowerCase();
    result = result.filter(rule => 
      rule.srcPort.toLowerCase().includes(query) ||
      rule.dstPort.toLowerCase().includes(query) ||
      rule.dstAddr.toLowerCase().includes(query) ||
      rule.protocol.toLowerCase().includes(query) ||
      rule.description.toLowerCase().includes(query)
    );
  }
  
  return result;
});

// --- 分页后的规则列表 ---
// 分页后的端口规则
const paginatedPortRules = computed(() => {
  const start = (portPagination.currentPage - 1) * portPagination.pageSize;
  const end = start + portPagination.pageSize;
  return filteredPortRules.value.slice(start, end);
});

// 分页后的IP规则
const paginatedIPRules = computed(() => {
  const start = (ipPagination.currentPage - 1) * ipPagination.pageSize;
  const end = start + ipPagination.pageSize;
  return filteredIPRules.value.slice(start, end);
});

// 分页后的转发规则
const paginatedForwardRules = computed(() => {
  const start = (forwardPagination.currentPage - 1) * forwardPagination.pageSize;
  const end = start + forwardPagination.pageSize;
  return filteredForwardRules.value.slice(start, end);
});

// --- 防火墙基本操作方法 ---
const operateFirewall = (operation: string) => {
  loading.value = true;
  // 模拟操作延迟
  setTimeout(() => {
    if (operation === 'start') {
      firewallStatus.value = 'running';
    } else if (operation === 'stop') {
      firewallStatus.value = 'not running';
    } else if (operation === 'restart') {
      firewallStatus.value = 'running';
    }
    loading.value = false;
  }, 1000);
};

const togglePing = () => {
  pingDisabled.value = !pingDisabled.value;
};

// 初始化
onMounted(() => {
  // 模拟加载数据
  loading.value = true;
  setTimeout(() => {
    loading.value = false;
  }, 500);
});
</script>

<template>
  <div class="firewall-container" v-loading="loading">
    <!-- 防火墙状态信息 -->
    <div class="app-status mb-4">
      <el-card>
        <div class="flex w-full flex-col gap-4 md:flex-row">
          <div class="flex flex-wrap gap-4">
            <el-tag effect="dark" type="success">{{ firewallName }}</el-tag>
            <el-tag round v-if="firewallStatus === 'running'" type="success">
              运行中
            </el-tag>
            <el-tag round v-if="firewallStatus === 'not running'" type="info">
              已停止
            </el-tag>
            <el-tag>版本: {{ firewallVersion }}</el-tag>
          </div>
          <div class="mt-0.5">
            <el-button type="primary" v-if="firewallStatus === 'running'" @click="operateFirewall('stop')" link>
              停止
            </el-button>
            <el-button type="primary" v-if="firewallStatus === 'not running'" @click="operateFirewall('start')" link>
              启动
            </el-button>
            <el-divider direction="vertical" />
            <el-button type="primary" @click="operateFirewall('restart')" link>
              重启
            </el-button>
            <el-divider direction="vertical" />
            <el-button type="primary" link>禁止Ping</el-button>
            <el-switch size="small" class="ml-2" v-model="pingDisabled" @change="togglePing" />
          </div>
        </div>
      </el-card>
    </div>

    <!-- 主内容区域，当防火墙未运行时添加遮罩 -->
    <div :class="{ mask: firewallStatus !== 'running' }">
      <!-- 选项卡导航 -->
      <el-tabs v-model="activeTab" class="mb-4">
        <el-tab-pane label="端口规则" name="port">
          <!-- 端口规则内容 -->
          <el-card class="mb-4">
            <!-- 顶部提示 -->
            <el-alert type="info" :closable="false" class="mb-4">
              <template #default>
                <span class="flx-align-center">
                  <span>防火墙端口规则管理, 用于控制入站/出站流量</span>
                  <el-link style="font-size: 12px; margin-left: 5px" :icon="Position" type="primary">
                    查看文档
                  </el-link>
                </span>
              </template>
            </el-alert>

            <!-- 搜索过滤区 -->
            <div class="flx-align-center mb-4">
              <el-select v-model="portSearchStatus" clearable class="p-w-200">
                <template #prefix>状态</template>
                <el-option label="全部" value=""></el-option>
                <el-option label="未使用" value="free"></el-option>
                <el-option label="已使用" value="used"></el-option>
              </el-select>
              <el-select v-model="portSearchStrategy" clearable class="p-w-200 ml-2">
                <template #prefix>策略</template>
                <el-option label="全部" value=""></el-option>
                <el-option label="允许" value="accept"></el-option>
                <el-option label="拒绝" value="drop"></el-option>
              </el-select>
              <el-input
                v-model="portSearchQuery"
                placeholder="搜索端口、协议、描述..."
                class="p-w-200 ml-2"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <!-- 工具栏 -->
            <div class="flex justify-between gap-2 flex-wrap sm:flex-row mb-4">
              <div class="flex flex-wrap gap-3">
                <el-button type="primary" icon="Plus">
                  创建端口规则
                </el-button>
                <el-button :disabled="selectedPortRows.length === 0" icon="Delete" plain>
                  删除
                </el-button>
              </div>
            </div>

            <!-- 表格 -->
            <el-table
              :data="paginatedPortRules"
              @selection-change="(val) => selectedPortRows = val"
              border
              style="width: 100%"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="协议" prop="protocol" width="100" />
              <el-table-column label="端口" prop="port" width="120" />
              <el-table-column label="状态" width="150">
                <template #default="{ row }">
                  <div v-if="row.port.includes('-') && row.usedStatus">
                    <el-tag type="info" class="mt-1">
                      已使用 * {{ row.usedPorts?.length || 0 }}
                    </el-tag>
                    <el-popover placement="right" :width="250" v-if="row.usedPorts?.length">
                      <template #default>
                        <ul>
                          <li v-for="(item, index) in row.usedPorts" :key="index">{{ item }}</li>
                        </ul>
                      </template>
                      <template #reference>
                        <el-icon class="svg-icon"><Operation /></el-icon>
                      </template>
                    </el-popover>
                  </div>
                  <div v-else>
                    <el-tag type="info" v-if="row.usedStatus">已使用</el-tag>
                    <el-tag type="success" v-else>未使用</el-tag>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="策略" width="120">
                <template #default="{ row }">
                  <el-button v-if="row.strategy === 'accept'" link type="success">
                    允许
                  </el-button>
                  <el-button v-else link type="danger">
                    拒绝
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="地址" width="150">
                <template #default="{ row }">
                  <span v-if="row.address && row.address !== 'Anywhere'">{{ row.address }}</span>
                  <span v-else>任意地址</span>
                </template>
              </el-table-column>
              <el-table-column label="描述" prop="description" min-width="180" show-overflow-tooltip />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" icon="Edit" size="small">编辑</el-button>
                  <el-button link type="danger" icon="Delete" size="small">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="flex justify-end mt-4">
              <el-pagination
                v-model:current-page="portPagination.currentPage"
                v-model:page-size="portPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="portPagination.total"
                background
              />
            </div>
          </el-card>
        </el-tab-pane>
        <el-tab-pane label="端口转发" name="forward">
          <!-- 端口转发内容 -->
          <el-card class="mb-4">
            <!-- 顶部提示 -->
            <el-alert type="info" :closable="false" class="mb-4">
              <template #default>
                <span class="flx-align-center">
                  <span>端口转发规则管理，用于将外部流量转发到内部服务</span>
                  <el-link style="font-size: 12px; margin-left: 5px" :icon="Position" type="primary">
                    查看文档
                  </el-link>
                </span>
              </template>
            </el-alert>

            <!-- 搜索过滤区 -->
            <div class="flx-align-center mb-4">
              <el-input
                v-model="forwardSearchQuery"
                placeholder="搜索源端口、目标端口、地址..."
                class="p-w-200"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <!-- 工具栏 -->
            <div class="flex justify-between gap-2 flex-wrap sm:flex-row mb-4">
              <div class="flex flex-wrap gap-3">
                <el-button type="primary" icon="Plus">
                  创建转发规则
                </el-button>
                <el-button :disabled="selectedForwardRows.length === 0" icon="Delete" plain>
                  删除
                </el-button>
              </div>
            </div>

            <!-- 表格 -->
            <el-table
              :data="paginatedForwardRules"
              @selection-change="(val) => selectedForwardRows = val"
              border
              style="width: 100%"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="协议" prop="protocol" width="100" />
              <el-table-column label="源端口" prop="srcPort" width="100" />
              <el-table-column label="目标端口" prop="dstPort" width="100" />
              <el-table-column label="目标地址" prop="dstAddr" min-width="150" />
              <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" icon="Edit" size="small">编辑</el-button>
                  <el-button link type="danger" icon="Delete" size="small">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="flex justify-end mt-4">
              <el-pagination
                v-model:current-page="forwardPagination.currentPage"
                v-model:page-size="forwardPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="forwardPagination.total"
                background
              />
            </div>
          </el-card>
        </el-tab-pane>
        <el-tab-pane label="IP规则" name="ip">
          <!-- IP规则内容 -->
          <el-card class="mb-4">
            <!-- 顶部提示 -->
            <el-alert type="info" :closable="false" class="mb-4">
              <template #default>
                <span class="flx-align-center">
                  <span>IP规则管理，用于控制特定IP或网段访问</span>
                  <el-link style="font-size: 12px; margin-left: 5px" :icon="Position" type="primary">
                    查看文档
                  </el-link>
                </span>
              </template>
            </el-alert>

            <!-- 搜索过滤区 -->
            <div class="flx-align-center mb-4">
              <el-select v-model="ipSearchStrategy" clearable class="p-w-200">
                <template #prefix>策略</template>
                <el-option label="全部" value=""></el-option>
                <el-option label="允许" value="accept"></el-option>
                <el-option label="拒绝" value="drop"></el-option>
              </el-select>
              <el-input
                v-model="ipSearchQuery"
                placeholder="搜索IP地址、描述..."
                class="p-w-200 ml-2"
                clearable
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>

            <!-- 工具栏 -->
            <div class="flex justify-between gap-2 flex-wrap sm:flex-row mb-4">
              <div class="flex flex-wrap gap-3">
                <el-button type="primary" icon="Plus">
                  创建IP规则
                </el-button>
                <el-button :disabled="selectedIPRows.length === 0" icon="Delete" plain>
                  删除
                </el-button>
              </div>
            </div>

            <!-- 表格 -->
            <el-table
              :data="paginatedIPRules"
              @selection-change="(val) => selectedIPRows = val"
              border
              style="width: 100%"
            >
              <el-table-column type="selection" width="55" />
              <el-table-column label="地址" prop="address" min-width="200" />
              <el-table-column label="策略" width="120">
                <template #default="{ row }">
                  <el-button v-if="row.strategy === 'accept'" link type="success">
                    允许
                  </el-button>
                  <el-button v-else link type="danger">
                    拒绝
                  </el-button>
                </template>
              </el-table-column>
              <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" icon="Edit" size="small">编辑</el-button>
                  <el-button link type="danger" icon="Delete" size="small">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <!-- 分页 -->
            <div class="flex justify-end mt-4">
              <el-pagination
                v-model:current-page="ipPagination.currentPage"
                v-model:page-size="ipPagination.pageSize"
                :page-sizes="[10, 20, 50, 100]"
                layout="total, sizes, prev, pager, next, jumper"
                :total="ipPagination.total"
                background
              />
            </div>
          </el-card>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 如果防火墙未运行，显示提示卡片 -->
      <el-card v-if="firewallStatus !== 'running' && maskShow" class="mask-prompt mb-4">
        <span>防火墙未启动</span>
      </el-card>
    </div>
  </div>
</template>

<style scoped>
.firewall-container {
  width: 100%;
}
.mb-4 {
  margin-bottom: 1rem;
}
.ml-2 {
  margin-left: 0.5rem;
}
.mt-4 {
  margin-top: 1rem;
}
.p-w-200 {
  width: 200px;
}
.mask {
  opacity: 0.6;
  pointer-events: none;
}
.flx-align-center {
  display: flex;
  align-items: center;
}
.svg-icon {
  margin-left: 0.25rem;
  cursor: pointer;
}
.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.justify-end {
  justify-content: flex-end;
}
.gap-2 {
  gap: 0.5rem;
}
.flex-wrap {
  flex-wrap: wrap;
}
.gap-3 {
  gap: 0.75rem;
}
.w-full {
  width: 100%;
}
.mt-0\.5 {
  margin-top: 0.125rem;
}
.mask-prompt {
  text-align: center;
  padding: 1rem;
  background-color: #fef0f0;
  color: #f56c6c;
}
@media (min-width: 768px) {
  .md\:flex-row {
    flex-direction: row;
  }
}
</style> 