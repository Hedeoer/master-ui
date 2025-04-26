<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch, onUnmounted, nextTick } from 'vue';
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
  ElDivider,
  ElDrawer,
  ElRadio,
  ElRadioGroup,
  ElMessage,
} from 'element-plus';
import { Search, Position, Delete, Edit, Plus, Warning, Operation, Setting, InfoFilled, ArrowLeft } from '@element-plus/icons-vue';
import TableSetting from '../../components/TableSetting.vue';
import type { FormInstance, FormRules } from 'element-plus';
import { useRoute } from 'vue-router';
import { 
  fetchPortRulesByNodeId as apiFetchPortRulesByNodeId, 
  fetchNodeListApi,
  addPortRuleApi,
  updatePortRuleApi,
  deletePortRulesApi,
  type PortRule as ApiPortRule,
  type PortRuleSubmitParams
} from '~/api/agents/firewall';

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

// --- 刷新频率设置 ---
const refreshRate = ref('不刷新');
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 监听刷新频率变化
watch(refreshRate, (newRate) => {
  // 清除之前的定时器
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  
  // 如果选择了刷新频率，设置新的定时器
  if (newRate !== '不刷新') {
    const interval = parseInt(newRate) * 1000;
    refreshTimer = setInterval(() => {
      refreshData();
    }, interval);
  }
});

// 监听活动标签页变化
watch(activeTab, () => {
  // 如果设置了定时刷新，需要立即刷新一次当前标签页数据
  if (refreshRate.value !== '不刷新') {
    refreshData();
  }
});

// 组件卸载时清除定时器
onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
});

// 刷新数据方法
const refreshData = () => {
  // 先显示加载状态
  loading.value = true;
  
  // 捕获当前的筛选和分页状态
  const currentTab = activeTab.value;
  const currentPortPage = portPagination.currentPage;
  const currentPortSize = portPagination.pageSize;
  const currentPortStatus = portSearchStatus.value;
  const currentPortStrategy = portSearchStrategy.value;
  const currentPortQuery = portSearchQuery.value;
  const currentPortZone = portSearchZone.value;
  const currentPortFamily = portSearchFamily.value;
  
  const currentIPPage = ipPagination.currentPage;
  const currentIPStrategy = ipSearchStrategy.value;
  const currentIPQuery = ipSearchQuery.value;
  
  const currentForwardPage = forwardPagination.currentPage;
  const currentForwardQuery = forwardSearchQuery.value;
  
  // 根据当前活动标签页刷新对应数据
  if (currentTab === 'port') {
    // 检查当前是否有选中节点
    if (currentNodeId.value) {
      // 使用API获取端口规则数据
      fetchPortRulesByNodeId(currentNodeId.value)
        .then(() => {
          // 恢复筛选和分页状态
          portPagination.currentPage = currentPortPage;
          portPagination.pageSize = currentPortSize;
          portSearchStatus.value = currentPortStatus;
          portSearchStrategy.value = currentPortStrategy;
          portSearchQuery.value = currentPortQuery;
          portSearchZone.value = currentPortZone;
          portSearchFamily.value = currentPortFamily;
        })
        .finally(() => {
          loading.value = false;
        });
    } else {
      loading.value = false;
    }
  } else if (currentTab === 'ip') {
    // 模拟API调用延迟
    setTimeout(() => {
      try {
        // 重新获取IP规则数据
        const newData = [...ipRules.value];
        // 模拟数据变化
        if (newData.length > 0) {
          newData[0] = { ...newData[0], description: `允许特定主机访问 (刷新于 ${new Date().toLocaleTimeString()})` };
        }
        ipRules.value = newData;
        
        // 恢复筛选和分页状态
        ipPagination.currentPage = currentIPPage;
        ipSearchStrategy.value = currentIPStrategy;
        ipSearchQuery.value = currentIPQuery;
        
        loading.value = false;
      } catch (error) {
        console.error('刷新IP规则数据失败:', error);
        loading.value = false;
      }
    }, 500);
  } else if (currentTab === 'forward') {
    // 模拟API调用延迟
    setTimeout(() => {
      try {
        // 重新获取转发规则数据
        const newData = [...forwardRules.value];
        // 模拟数据变化
        if (newData.length > 0) {
          newData[0] = { ...newData[0], description: `转发Web流量 (刷新于 ${new Date().toLocaleTimeString()})` };
        }
        forwardRules.value = newData;
        
        // 恢复筛选和分页状态
        forwardPagination.currentPage = currentForwardPage;
        forwardSearchQuery.value = currentForwardQuery;
        
        loading.value = false;
      } catch (error) {
        console.error('刷新转发规则数据失败:', error);
        loading.value = false;
      }
    }, 500);
  }
};

// --- 定义类型接口 ---
interface PortRule extends ApiPortRule {}

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
    nodeId: '', 
    protocol: 'TCP', 
    port: '22', 
    strategy: 'accept', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: 'SSH服务', 
    usedStatus: 'inUsed',
    zone: 'public',
    family: 'ipv4',
    permanent: true
  },
  { 
    id: 2, 
    nodeId: '', 
    protocol: 'TCP', 
    port: '80', 
    strategy: 'accept', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: 'HTTP服务', 
    usedStatus: 'inUsed',
    zone: 'public',
    family: 'both',
    permanent: true
  },
  { 
    id: 3, 
    nodeId: '', 
    protocol: 'TCP', 
    port: '443', 
    strategy: 'accept', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: 'HTTPS服务', 
    usedStatus: 'inUsed',
    zone: 'public',
    family: 'both',
    permanent: true
  },
  { 
    id: 4, 
    nodeId: '', 
    protocol: 'TCP/UDP', 
    port: '3000-4000', 
    strategy: 'accept', 
    sourceType: 'specific',
    sourceAddress: '192.168.1.1',
    description: '开发服务端口范围', 
    usedStatus: null,
    zone: 'private',
    family: 'ipv4',
    permanent: false
  },
  { 
    id: 5, 
    nodeId: '', 
    protocol: 'UDP', 
    port: '53', 
    strategy: 'accept', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: 'DNS服务', 
    usedStatus: 'inUsed',
    zone: 'public',
    family: 'both',
    permanent: true
  },
  { 
    id: 6, 
    nodeId: '', 
    protocol: 'TCP', 
    port: '8080-8090', 
    strategy: 'drop', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: '禁止访问的测试端口范围', 
    usedStatus: 'inUsed',
    usedPorts: ['8080', '8082', '8085'],
    zone: 'internal',
    family: 'ipv4',
    permanent: true
  },
  { 
    id: 7, 
    nodeId: '', 
    protocol: 'TCP', 
    port: '25', 
    strategy: 'drop', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: '阻止SMTP', 
    usedStatus: null,
    zone: 'dmz',
    family: 'ipv6',
    permanent: true
  },
  { 
    id: 8, 
    nodeId: '', 
    protocol: 'TCP', 
    port: '21', 
    strategy: 'drop', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: '阻止FTP', 
    usedStatus: null,
    zone: 'dmz',
    family: 'ipv4',
    permanent: false
  },
  { 
    id: 9, 
    nodeId: '', 
    protocol: 'TCP', 
    port: '3389', 
    strategy: 'drop', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: '阻止远程桌面连接', 
    usedStatus: null,
    zone: 'private',
    family: 'both',
    permanent: true
  },
  { 
    id: 10, 
    nodeId: '', 
    protocol: 'TCP', 
    port: '5900-5910', 
    strategy: 'drop', 
    sourceType: 'any',
    sourceAddress: '0.0.0.0',
    description: '阻止VNC服务', 
    usedStatus: null,
    zone: 'internal',
    family: 'ipv6',
    permanent: false
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
const portSearchZone = ref('');
const portSearchFamily = ref('');

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
// 添加新的过滤方法
const applyPortFilter = () => {
  // 重置分页到第一页，避免筛选后分页问题
  portPagination.currentPage = 1;
};

// 过滤后的端口规则
const filteredPortRules = computed(() => {
  let result = [...portRules.value];
  
  // 按区域过滤
  if (portSearchZone.value) {
    result = result.filter(rule => rule.zone === portSearchZone.value);
  }
  
  // 按IP类型过滤
  if (portSearchFamily.value) {
    result = result.filter(rule => rule.family === portSearchFamily.value);
  }
  
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
      rule.zone.toLowerCase().includes(query) ||
      (rule.sourceType === 'specific' && rule.sourceAddress.toLowerCase().includes(query))
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
      // 防火墙启动后刷新数据
      refreshData();
    } else if (operation === 'stop') {
      firewallStatus.value = 'not running';
    } else if (operation === 'restart') {
      firewallStatus.value = 'running';
      // 防火墙重启后刷新数据
      refreshData();
    }
    loading.value = false;
  }, 1000);
};

const togglePing = () => {
  pingDisabled.value = !pingDisabled.value;
  
  // 提供视觉反馈
  ElMessageBox.alert(
    pingDisabled.value ? '已禁止Ping响应' : '已允许Ping响应', 
    '设置成功',
    { confirmButtonText: '确定' }
  );
};

// 端口规则弹框相关状态
const portRuleDrawerVisible = ref(false);
const portRuleFormRef = ref<FormInstance>();
const formMode = ref<'create' | 'edit'>('create');
const editingRuleId = ref<number | null>(null);
const forceRender = ref(0); // 用于强制渲染表单组件的计数器
const portRuleForm = reactive({
  protocol: 'tcp',
  port: '',
  sourceType: 'any',
  sourceAddress: '0.0.0.0',
  strategy: 'accept',
  zone: 'public',
  family: 'ipv4',
  permanent: true,
  description: ''
});

// 监听 sourceType 变化
watch(() => portRuleForm.sourceType, (newType) => {
  // 当类型变为 any 时，将 sourceAddress 设置为 0.0.0.0
  if (newType === 'any') {
    portRuleForm.sourceAddress = '0.0.0.0';
  } else if (newType === 'specific' && portRuleForm.sourceAddress === '0.0.0.0') {
    // 当类型变为 specific 且当前地址是 0.0.0.0 时，清空地址，便于用户输入
    portRuleForm.sourceAddress = '';
  }
});

// 表单验证规则
const portRuleFormRules = reactive<FormRules>({
  protocol: [
    { required: true, message: '请选择协议', trigger: 'change' }
  ],
  port: [
    { required: true, message: '请输入端口', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (!value) {
          callback(new Error('端口不能为空'))
          return
        }
        
        const portPattern = /^(\d+(-\d+)?)(,\d+(-\d+)?)*$/
        if (!portPattern.test(value)) {
          callback(new Error('端口格式不正确'))
          return
        }
        
        const parts = value.split(',')
        for (const part of parts) {
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(Number)
            if (start > end) {
              callback(new Error('端口范围格式不正确'))
              return
            }
            if (start < 1 || end > 65535) {
              callback(new Error('端口值必须在1-65535之间'))
              return
            }
          } else {
            const port = Number(part)
            if (port < 1 || port > 65535) {
              callback(new Error('端口值必须在1-65535之间'))
              return
            }
          }
        }
        callback()
      },
      trigger: 'blur'
    }
  ],
  sourceAddress: [
    { 
      validator: (rule, value, callback) => {
        if (portRuleForm.sourceType === 'specific' && !value) {
          callback(new Error('请输入IP地址'))
          return
        }
        
        if (portRuleForm.sourceType === 'specific' && value) {
          // IP地址格式验证
          const ipAddresses = value.split(',')
          const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/
          const ipv6Pattern = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)$/
          
          for (const ip of ipAddresses) {
            const trimmedIp = ip.trim()
            // 检查IPv4
            if (ipv4Pattern.test(trimmedIp)) {
              // 验证IPv4地址值范围
              const parts = trimmedIp.split('/')
              const ipParts = parts[0].split('.')
              
              // 验证每个部分的值是否在0-255范围内
              for (const part of ipParts) {
                const num = parseInt(part, 10)
                if (num < 0 || num > 255) {
                  callback(new Error(`IP地址格式不正确: ${trimmedIp}`))
                  return
                }
              }
              
              // 如果有CIDR，验证范围
              if (parts.length > 1) {
                const cidr = parseInt(parts[1], 10)
                if (cidr < 0 || cidr > 32) {
                  callback(new Error(`CIDR格式不正确: ${trimmedIp}`))
                  return
                }
              }
              continue
            }
            
            // 检查IPv6
            if (ipv6Pattern.test(trimmedIp)) {
              continue
            }
            
            callback(new Error(`IP地址格式不正确: ${trimmedIp}`))
            return
          }
        }
        
        callback()
      },
      trigger: 'blur'
    }
  ],
  strategy: [
    { required: true, message: '请选择策略', trigger: 'change' }
  ],
  zone: [
    { required: true, message: '请选择区域', trigger: 'change' }
  ],
  family: [
    { required: true, message: '请选择IP类型', trigger: 'change' }
  ],
  description: [
    { max: 200, message: '描述不能超过200个字符', trigger: 'blur' }
  ]
})

// 创建端口规则
const createPortRule = () => {
  formMode.value = 'create';
  editingRuleId.value = null;
  resetPortRuleForm();
  portRuleDrawerVisible.value = true;
};

// 重置表单
const resetPortRuleForm = () => {
  if (portRuleFormRef.value) {
    portRuleFormRef.value.resetFields();
  }
  // 明确设置每个字段，避免使用Object.assign
  portRuleForm.protocol = 'tcp';
  portRuleForm.port = '';
  portRuleForm.sourceType = 'any';
  portRuleForm.sourceAddress = '0.0.0.0';
  portRuleForm.strategy = 'accept'; // 确保是字符串类型
  portRuleForm.zone = 'public';
  portRuleForm.family = 'ipv4';
  portRuleForm.permanent = true;
  portRuleForm.description = '';
};

// 添加端口规则 - 使用真实API
const addPortRule = async (ruleData: any): Promise<any> => {
  try {
    // 准备API需要的参数格式
    const params: PortRuleSubmitParams = {
      nodeId: currentNodeId.value,
      protocol: ruleData.protocol,
      port: ruleData.port,
      sourceType: ruleData.sourceType,
      sourceAddress: ruleData.sourceAddress, // 直接使用表单中的 sourceAddress
      strategy: ruleData.strategy,
      zone: ruleData.zone,
      family: ruleData.family,
      permanent: ruleData.permanent,
      description: ruleData.description || ''
    };
    
    // 调用真实API
    const { success, data, message } = await addPortRuleApi(params);
    
    if (success && data) {
      // 添加成功，刷新当前节点的端口规则列表
      await fetchPortRulesByNodeId(currentNodeId.value);
      
      return { success: true, data };
    } else {
      throw new Error(message || '添加端口规则失败');
    }
  } catch (error) {
    console.error('添加端口规则失败:', error);
    throw error;
  }
};

// 更新端口规则 - 使用真实API
const updatePortRule = async (ruleId: number, ruleData: any): Promise<any> => {
  try {
    // 准备API需要的参数格式
    const params: PortRuleSubmitParams = {
      nodeId: currentNodeId.value,
      protocol: ruleData.protocol,
      port: ruleData.port,
      sourceType: ruleData.sourceType,
      sourceAddress: ruleData.sourceAddress, // 直接使用表单中的 sourceAddress
      strategy: ruleData.strategy,
      zone: ruleData.zone,
      family: ruleData.family,
      permanent: ruleData.permanent,
      description: ruleData.description || ''
    };
    
    // 调用真实API
    const { success, data, message } = await updatePortRuleApi(ruleId, params);
    
    if (success && data) {
      // 更新成功，刷新当前节点的端口规则列表
      await fetchPortRulesByNodeId(currentNodeId.value);
      
      return { success: true, data };
    } else {
      throw new Error(message || '更新端口规则失败');
    }
  } catch (error) {
    console.error('更新端口规则失败:', error);
    throw error;
  }
};

const deletePortRule = (row: PortRule | null) => {
  // 如果row为null，则表示批量删除
  if (row === null && selectedPortRows.value.length === 0) {
    return; // 没有选中行，直接返回
  }
  
  const message = row 
    ? `确定要删除端口 ${row.port} 的规则吗？` 
    : `确定要删除选中的 ${selectedPortRows.value.length} 条规则吗？`;
  
  ElMessageBox.confirm(message, '删除确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 设置加载状态
    loading.value = true;
    
    try {
      // 准备要删除的ID数组
      const ids = row ? [row.id] : selectedPortRows.value.map(item => item.id);
      
      // 如果没有当前节点ID，则无法删除
      if (!currentNodeId.value) {
        throw new Error('未选择节点，无法删除规则');
      }
      
      // 调用真实的删除API
      await deletePortRulesApi(currentNodeId.value, ids);
      
      // 删除成功后刷新列表
      await fetchPortRulesByNodeId(currentNodeId.value);
      
      // 如果是批量删除，清空选择
      if (!row) {
        selectedPortRows.value = [];
      }
      
      // 提示成功
      ElMessage({
        type: 'success',
        message: row ? '删除端口规则成功' : '批量删除端口规则成功'
      });
      
      // 重置加载状态
      loading.value = false;
    } catch (error) {
      // 错误处理
      console.error('删除端口规则失败:', error);
      ElMessage({
        type: 'error',
        message: '删除端口规则失败，请重试'
      });
      
      // 重置加载状态
      loading.value = false;
    }
  }).catch(() => {
    // 取消删除，不做任何操作
  });
};

// 提交表单
const submitPortRuleForm = async () => {
  if (!portRuleFormRef.value) return;
  
  await portRuleFormRef.value.validate(async (valid, fields) => {
    if (valid) {
      // 设置加载状态
      loading.value = true;
      
      try {
        // 构建提交数据
        const ruleData = {
          ...portRuleForm
        };
        
        // 根据表单模式调用不同的API
        if (formMode.value === 'create') {
          // 调用API添加规则
          await addPortRule(ruleData);
          
          // 提示成功
          ElMessage({
            type: 'success',
            message: '端口规则创建成功'
          });
        } else {
          // 调用API更新规则
          if (editingRuleId.value === null) {
            throw new Error('未找到要更新的规则ID');
          }
          
          await updatePortRule(editingRuleId.value, ruleData);
          
          // 提示成功
          ElMessage({
            type: 'success',
            message: '端口规则更新成功'
          });
        }
        
        // 关闭抽屉
        portRuleDrawerVisible.value = false;
        
        // 重置表单
        resetPortRuleForm();
        
        // 重置加载状态
        loading.value = false;
      } catch (error) {
        // 错误处理
        console.error(formMode.value === 'create' ? '添加端口规则失败:' : '更新端口规则失败:', error);
        ElMessage({
          type: 'error',
          message: formMode.value === 'create' ? '添加端口规则失败，请重试' : '更新端口规则失败，请重试'
        });
        
        // 重置加载状态
        loading.value = false;
      }
    } else {
      console.error('表单验证失败:', fields);
    }
  });
};

// 取消表单
const cancelPortRuleForm = () => {
  portRuleDrawerVisible.value = false;
  resetPortRuleForm();
};

const editPortRule = (row: PortRule) => {
  // 1. 设置编辑模式和规则ID
  formMode.value = 'edit';
  editingRuleId.value = row.id;

  // 记录原始策略值和类型（便于调试）
  console.log('编辑 - 原始策略值:', row.strategy, '类型:', typeof row.strategy);

  // 2. 准备表单数据并确保策略值类型正确
  const formData = {
    protocol: row.protocol.toLowerCase(),
    port: row.port,
    sourceType: row.sourceType,
    sourceAddress: row.sourceAddress,
    strategy: row.strategy === 'drop' ? 'drop' : 'accept', // 确保是字符串
    zone: row.zone,
    family: row.family,
    permanent: row.permanent,
    description: row.description
  };

  // 3. 逐个设置表单值，确保响应式更新
  portRuleForm.protocol = formData.protocol;
  portRuleForm.port = formData.port;
  portRuleForm.sourceType = formData.sourceType;
  portRuleForm.sourceAddress = formData.sourceAddress;
  portRuleForm.strategy = formData.strategy;
  portRuleForm.zone = formData.zone;
  portRuleForm.family = formData.family;
  portRuleForm.permanent = formData.permanent;
  portRuleForm.description = formData.description;
  
  // 4. 更新渲染计数器强制视图刷新
  forceRender.value += 1;
  
  // 打印设置后的策略值（便于调试）
  console.log('编辑 - 设置后策略值:', portRuleForm.strategy, '类型:', typeof portRuleForm.strategy);
  
  // 5. 打开抽屉
  portRuleDrawerVisible.value = true;
};

// 监听防火墙状态变化
watch(() => firewallStatus.value, (newStatus) => {
  if (newStatus === 'running') {
    // 防火墙状态变为运行，确保界面更新
    maskShow.value = false;
  } else {
    // 防火墙状态变为停止，显示提示
    maskShow.value = true;
  }
});

// --- 节点相关数据 ---
const route = useRoute();
const currentNodeId = ref<string>('');
const currentNodeName = ref<string>('');
const currentNodeIp = ref<string>('');
const nodeList = ref<Array<{id: string, name: string, ip: string}>>([]);
// 添加新的状态来管理最近访问的节点
const recentNodes = ref<Array<{id: string, name: string, ip: string}>>([]);
const searchQuery = ref('');
const remoteLoading = ref(false);
const maxRecentNodes = 5; // 最多保存5个最近访问节点

// 从localStorage加载最近访问的节点
const loadRecentNodes = () => {
  try {
    const savedNodes = localStorage.getItem('firewall-recent-nodes');
    if (savedNodes) {
      recentNodes.value = JSON.parse(savedNodes);
    }
  } catch (error) {
    console.error('加载最近访问节点失败:', error);
  }
};

// 保存最近访问的节点到localStorage
const saveRecentNodes = () => {
  try {
    localStorage.setItem('firewall-recent-nodes', JSON.stringify(recentNodes.value));
  } catch (error) {
    console.error('保存最近访问节点失败:', error);
  }
};

// 添加节点到最近访问列表
const addToRecentNodes = (nodeId: string) => {
  const node = nodeList.value.find(n => n.id === nodeId);
  if (!node) return;

  // 如果节点已经在列表中，先移除它
  const existingIndex = recentNodes.value.findIndex(n => n.id === nodeId);
  if (existingIndex !== -1) {
    recentNodes.value.splice(existingIndex, 1);
  }

  // 在列表开头添加节点
  recentNodes.value.unshift(node);

  // 如果超过最大数量，移除最后一个
  if (recentNodes.value.length > maxRecentNodes) {
    recentNodes.value.pop();
  }

  // 保存到localStorage
  saveRecentNodes();
};

// 远程搜索节点
const remoteSearchNodes = (query: string) => {
  if (query) {
    remoteLoading.value = true;
    searchQuery.value = query;
    
    // 模拟搜索延迟
    setTimeout(() => {
      remoteLoading.value = false;
    }, 200);
  } else {
    searchQuery.value = '';
  }
};

// 计算过滤后的节点列表
const filteredNodeList = computed(() => {
  if (!searchQuery.value) return nodeList.value;
  
  const loweredQuery = searchQuery.value.toLowerCase();
  return nodeList.value.filter(node => 
    node.id.toLowerCase().includes(loweredQuery) || 
    node.name.toLowerCase().includes(loweredQuery) || 
    node.ip.toLowerCase().includes(loweredQuery)
  );
});

// 加载节点列表（模拟）
const fetchNodeList = async (): Promise<any> => {
  try {
    // 设置加载状态
    loading.value = true;
    
    // 调用真实API获取节点列表
    const { success, data, message } = await fetchNodeListApi();
    
    if (success && data) {
      // 将API返回的节点数据适配为本地格式
        nodeList.value = data.map(node => ({
        id: node.nodeId || '',
        name: node.nodeName || '',
        ip: node.nodeIp || ''
      }));
      return { success: true, data: nodeList.value };
    } else {
      // 处理API请求失败情况
      ElMessage.error(message || '获取节点列表失败');
      return { success: false, message };
    }
  } catch (error) {
    // 处理异常情况
    console.error('获取节点列表失败:', error);
    ElMessage.error('获取节点列表失败');
    return { success: false, message: (error as Error).message };
  } finally {
    // 重置加载状态
    loading.value = false;
  }
};

// 设置当前节点
const setCurrentNode = (nodeId: string) => {
  const node = nodeList.value.find(n => n.id === nodeId);
  if (node) {
    currentNodeId.value = node.id;
    currentNodeName.value = node.name;
    currentNodeIp.value = node.ip;
  }
};

// 根据节点ID获取端口规则（模拟API）
const fetchPortRulesByNodeId = (nodeId: string): Promise<any> => {
  return new Promise((resolve) => {
    // 记录当前的分页和筛选状态
    const currentPage = portPagination.currentPage;
    const currentSize = portPagination.pageSize;
    
    // 设置加载状态
    loading.value = true;
    
    // 调用真实API
    apiFetchPortRulesByNodeId(nodeId)
      .then(({ success, data, message }) => {
        if (success && data) {
          // 更新数据
          portRules.value = data;
          
          // 恢复分页状态
          portPagination.currentPage = currentPage;
          portPagination.pageSize = currentSize;
          
          resolve({ success: true, data });
        } else {
          // 显示错误信息
          ElMessage.error(message || '获取端口规则失败');
          resolve({ success: false, message });
        }
      })
      .catch((error) => {
        console.error('获取端口规则失败:', error);
        ElMessage.error('获取端口规则失败');
        resolve({ success: false, message: error.message });
      })
      .finally(() => {
        // 重置加载状态
        loading.value = false;
      });
  });
};

// 根据节点ID获取IP规则（模拟API）
const fetchIpRulesByNodeId = (nodeId: string): Promise<any> => {
  return new Promise((resolve) => {
    // 记录当前的分页和筛选状态
    const currentPage = ipPagination.currentPage;
    const currentSize = ipPagination.pageSize;
    
    // 设置加载状态
    loading.value = true;
    
    setTimeout(() => {
      // 模拟不同节点有不同数据
      let rules: IPRule[] = [];
      
      if (nodeId === 'node1') {
        rules = [
          { id: 1, address: '192.168.1.100', strategy: 'accept' as 'accept' | 'drop', description: '允许特定主机访问' },
          { id: 2, address: '192.168.1.0/24', strategy: 'accept' as 'accept' | 'drop', description: '允许局域网访问' },
          // 其他已有样例数据...
        ];
      } else if (nodeId === 'node2') {
        rules = [
          { id: 1, address: '10.0.0.1', strategy: 'accept' as 'accept' | 'drop', description: '允许管理主机' },
          { id: 2, address: '10.0.0.0/24', strategy: 'drop' as 'accept' | 'drop', description: '拒绝其他主机' },
        ];
      } else if (nodeId === 'node3') {
        rules = [
          { id: 1, address: '172.16.1.1', strategy: 'accept' as 'accept' | 'drop', description: '允许开发主机' },
          { id: 2, address: '172.16.0.0/16', strategy: 'drop' as 'accept' | 'drop', description: '拒绝开发网段' },
        ];
      } else {
        // 默认数据
        rules = [
          { id: 1, address: '192.168.1.1', strategy: 'accept' as 'accept' | 'drop', description: '默认允许网关' },
        ];
      }
      
      // 更新数据
      ipRules.value = rules;
      
      // 恢复分页状态
      ipPagination.currentPage = currentPage;
      ipPagination.pageSize = currentSize;
      
      // 重置加载状态
      loading.value = false;
      
      resolve({ success: true, data: rules });
    }, 600);
  });
};

// 根据节点ID获取端口转发规则（模拟API）
const fetchForwardRulesByNodeId = (nodeId: string): Promise<any> => {
  return new Promise((resolve) => {
    // 记录当前的分页和筛选状态
    const currentPage = forwardPagination.currentPage;
    const currentSize = forwardPagination.pageSize;
    
    // 设置加载状态
    loading.value = true;
    
    setTimeout(() => {
      // 模拟不同节点有不同数据
      let rules = [];
      
      if (nodeId === 'node1') {
        rules = [
          { id: 1, srcPort: '80', dstPort: '8080', dstAddr: '192.168.1.100', protocol: 'tcp', description: '转发Web流量' },
          { id: 2, srcPort: '443', dstPort: '8443', dstAddr: '192.168.1.100', protocol: 'tcp', description: '转发安全Web流量' },
          // ... 保留其他已有样例数据 ...
        ];
      } else if (nodeId === 'node2') {
        rules = [
          { id: 1, srcPort: '3306', dstPort: '13306', dstAddr: '192.168.10.10', protocol: 'tcp', description: '转发MySQL流量' },
          { id: 2, srcPort: '5432', dstPort: '15432', dstAddr: '192.168.10.11', protocol: 'tcp', description: '转发PostgreSQL流量' },
        ];
      } else if (nodeId === 'node3') {
        rules = [
          { id: 1, srcPort: '27017', dstPort: '37017', dstAddr: '192.168.20.10', protocol: 'tcp', description: '转发MongoDB流量' },
          { id: 2, srcPort: '6379', dstPort: '16379', dstAddr: '192.168.20.11', protocol: 'tcp', description: '转发Redis流量' },
        ];
      } else {
        // 默认数据
        rules = [
          { id: 1, srcPort: '22', dstPort: '2222', dstAddr: '10.0.0.1', protocol: 'tcp', description: '默认SSH转发' },
        ];
      }
      
      // 更新数据
      forwardRules.value = rules;
      
      // 恢复分页状态
      forwardPagination.currentPage = currentPage;
      forwardPagination.pageSize = currentSize;
      
      // 重置加载状态
      loading.value = false;
      
      resolve({ success: true, data: rules });
    }, 600);
  });
};

// 加载指定节点的数据
const loadNodeData = async (nodeId: string) => {
  setCurrentNode(nodeId);
  
  // 添加到最近访问
  addToRecentNodes(nodeId);
  
  // 根据当前标签加载不同类型的数据
  if (activeTab.value === 'port') {
    await fetchPortRulesByNodeId(nodeId);
  } else if (activeTab.value === 'ip') {
    await fetchIpRulesByNodeId(nodeId);
  } else if (activeTab.value === 'forward') {
    await fetchForwardRulesByNodeId(nodeId);
  }
};

// 监听标签页变化，加载对应数据
watch(activeTab, (newTab) => {
  if (currentNodeId.value) {
    if (newTab === 'port') {
      fetchPortRulesByNodeId(currentNodeId.value);
    } else if (newTab === 'ip') {
      fetchIpRulesByNodeId(currentNodeId.value);
    } else if (newTab === 'forward') {
      fetchForwardRulesByNodeId(currentNodeId.value);
    }
  }
  
  // 如果设置了定时刷新，仍然保留原有逻辑
  if (refreshRate.value !== '不刷新') {
    refreshData();
  }
});

// 修改初始化
onMounted(async () => {
  // 先设置加载状态
  loading.value = true;
  
  try {
    // 1. 获取节点列表
    await fetchNodeList();
    
    // 2. 加载最近访问的节点
    loadRecentNodes();
    
    // 3. 确定初始节点ID
    let initialNodeId = '';
    
    // 检查URL参数中是否有nodeId
    if (route.query.nodeId) {
      initialNodeId = route.query.nodeId as string;
    } else if (recentNodes.value.length > 0) {
      // 如果有最近访问的节点，使用第一个
      initialNodeId = recentNodes.value[0].id;
    } else if (nodeList.value.length > 0) {
      // 如果没有，则使用第一个节点
      initialNodeId = nodeList.value[0].id;
    }
    
    // 4. 加载节点数据
    if (initialNodeId) {
      await loadNodeData(initialNodeId);
    }
  } catch (error) {
    console.error('初始化失败:', error);
    ElMessage({
      type: 'error',
      message: '加载数据失败，请刷新页面重试'
    });
  } finally {
    loading.value = false;
  }
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

    <!-- 节点信息和选择器 -->
    <div class="node-info mb-4">
      <el-card>
        <div class="flex justify-between items-center">
          <div class="flex items-center gap-4">
            <el-tag type="info">节点ID: {{ currentNodeId }}</el-tag>
            <el-tag type="info">主机名: {{ currentNodeName }}</el-tag>
            <el-tag type="info">IP地址: {{ currentNodeIp }}</el-tag>
          </div>
          <div style="width: 280px">
            <el-select 
              v-model="currentNodeId" 
              placeholder="搜索节点" 
              style="width: 100%"
              filterable
              remote
              reserve-keyword
              :remote-method="remoteSearchNodes"
              :loading="remoteLoading"
              @change="loadNodeData"
              clearable
            >
              <template v-if="recentNodes.length > 0">
                <el-option-group label="最近访问">
                  <el-option
                    v-for="node in recentNodes"
                    :key="`recent-${node.id}`"
                    :label="`${node.name} (${node.ip})`"
                    :value="node.id"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ node.name }}</span>
                      <el-tag size="small" type="info">{{ node.ip }}</el-tag>
                    </div>
                  </el-option>
                </el-option-group>
                <el-divider style="margin: 5px 0" />
              </template>
              
              <el-option-group label="所有节点">
                <el-option
                  v-for="node in filteredNodeList"
                  :key="node.id"
                  :label="`${node.name} (${node.ip})`"
                  :value="node.id"
                >
                  <div class="flex items-center justify-between">
                    <span>{{ node.name }}</span>
                    <el-tag size="small" type="info">{{ node.ip }}</el-tag>
                  </div>
                </el-option>
              </el-option-group>
            </el-select>
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
              <el-select v-model="portSearchZone" @change="applyPortFilter" clearable class="p-w-150">
                <template #prefix>区域</template>
                <el-option label="全部" value=""></el-option>
                <el-option label="公共" value="public"></el-option>
                <el-option label="私有" value="private"></el-option>
                <el-option label="内部" value="internal"></el-option>
                <el-option label="DMZ" value="dmz"></el-option>
              </el-select>
              <el-select v-model="portSearchFamily" @change="applyPortFilter" clearable class="p-w-150 ml-2">
                <template #prefix>IP类型</template>
                <el-option label="全部" value=""></el-option>
                <el-option label="IPv4" value="ipv4"></el-option>
                <el-option label="IPv6" value="ipv6"></el-option>
                <el-option label="IPv4/IPv6" value="both"></el-option>
              </el-select>
              <el-select v-model="portSearchStatus" @change="applyPortFilter" clearable class="p-w-150 ml-2">
                <template #prefix>状态</template>
                <el-option label="全部" value=""></el-option>
                <el-option label="未使用" value="free"></el-option>
                <el-option label="已使用" value="used"></el-option>
              </el-select>
              <el-select v-model="portSearchStrategy" @change="applyPortFilter" clearable class="p-w-150 ml-2">
                <template #prefix>策略</template>
                <el-option label="全部" value=""></el-option>
                <el-option label="允许" value="accept"></el-option>
                <el-option label="拒绝" value="drop"></el-option>
              </el-select>
              <el-input
                v-model="portSearchQuery"
                @input="applyPortFilter"
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
                <el-button type="primary" :icon="Plus" @click="createPortRule">
                  创建端口规则
                </el-button>
                <el-button :disabled="selectedPortRows.length === 0" :icon="Delete" plain @click="deletePortRule(null)">
                  删除
                </el-button>
              </div>
              <div class="flex flex-wrap gap-3">
                <TableSetting v-model:refreshRate="refreshRate" />
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
              <el-table-column label="区域" prop="zone" width="100">
                <template #default="{ row }">
                  <el-tag effect="plain">{{ row.zone }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="IP类型" prop="family" width="100">
                <template #default="{ row }">
                  <el-tag type="info" v-if="row.family === 'ipv4'">IPv4</el-tag>
                  <el-tag type="success" v-else-if="row.family === 'ipv6'">IPv6</el-tag>
                  <el-tag type="warning" v-else-if="row.family === 'both'">IPv4/IPv6</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="协议" prop="protocol" width="100" />
              <el-table-column label="端口" prop="port" width="120" />
              <el-table-column label="状态" width="150">
                <template #default="{ row }">
                  <div v-if="row.port.includes('-') && row.usedStatus" class="status-with-info">
                    <el-tag type="info" class="mt-1">
                      已使用 * {{ row.usedPorts?.length || 0 }}
                    </el-tag>
                    <el-popover placement="right" :width="250" v-if="row.usedPorts?.length" trigger="hover">
                      <template #default>
                        <div class="used-ports-list">
                          <div class="used-ports-list-title">已使用端口:</div>
                          <div class="used-ports-list-content">
                            <el-tag v-for="(item, index) in row.usedPorts" :key="index" size="small" class="used-port-tag">
                              {{ item }}
                            </el-tag>
                          </div>
                        </div>
                      </template>
                      <template #reference>
                        <el-icon class="info-icon"><InfoFilled /></el-icon>
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
                  <span v-if="row.sourceType === 'specific'">{{ row.sourceAddress }}</span>
                  <span v-else-if="row.sourceType === 'any' && row.sourceAddress === '0.0.0.0'">any</span>
                  <span v-else>{{ row.sourceAddress }}</span>
                </template>
              </el-table-column>
              <el-table-column label="描述" prop="description" min-width="180" show-overflow-tooltip />
              <el-table-column label="操作" width="150" fixed="right">
                <template #default="{ row }">
                  <el-button link type="primary" :icon="Edit" size="small" @click="editPortRule(row)">编辑</el-button>
                  <el-button link type="danger" :icon="Delete" size="small" @click="deletePortRule(row)">删除</el-button>
                </template>
              </el-table-column>
              <el-table-column label="持久化" width="80" align="center">
                <template #default="{ row }">
                  <el-tag type="success" v-if="row.permanent">是</el-tag>
                  <el-tag type="info" v-else>否</el-tag>
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
              <div class="flex flex-wrap gap-3">
                <TableSetting v-model:refreshRate="refreshRate" />
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
              <div class="flex flex-wrap gap-3">
                <TableSetting v-model:refreshRate="refreshRate" />
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

    <!-- 端口规则创建弹框 -->
    <el-drawer
      v-model="portRuleDrawerVisible"
      :title="formMode === 'create' ? '创建规则' : '编辑规则'"
      size="500px"
      :before-close="cancelPortRuleForm"
      :show-close="false"
      destroy-on-close
    >
      <template #header>
        <div class="drawer-header">
          <el-icon @click="cancelPortRuleForm" class="drawer-back-icon"><ArrowLeft /></el-icon>
          <span class="drawer-title">{{ formMode === 'create' ? '创建规则' : '编辑规则' }}</span>
        </div>
      </template>
      <el-form 
        ref="portRuleFormRef" 
        :model="portRuleForm" 
        :rules="portRuleFormRules"
        label-width="80px"
        class="port-rule-form"
      >
        <el-form-item label="协议" prop="protocol">
          <el-select v-model="portRuleForm.protocol" class="w-full">
            <el-option label="TCP" value="tcp"></el-option>
            <el-option label="UDP" value="udp"></el-option>
            <el-option label="TCP/UDP" value="TCP/UDP"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model="portRuleForm.port" placeholder="请输入端口" :disabled="formMode === 'edit'"></el-input>
          <div class="form-tips" v-if="formMode === 'create'">
            <div>多个端口，如：8080,8081</div>
            <div>范围端口，如：8080-8089</div>
          </div>
        </el-form-item>
        <el-form-item label="来源" prop="sourceType">
          <el-radio-group v-model="portRuleForm.sourceType">
            <el-radio label="any">所有 IP</el-radio>
            <el-radio label="specific">指定 IP</el-radio>
          </el-radio-group>
          <el-input 
            v-if="portRuleForm.sourceType === 'specific'" 
            v-model="portRuleForm.sourceAddress" 
            placeholder="请输入IP地址"
            class="mt-2 w-full"
          ></el-input>
          <div v-if="portRuleForm.sourceType === 'specific'" class="form-tips">
            <div>支持输入 IP 或 IP 范围，如：172.16.10.11 或 172.16.0.0/24</div>
            <div>多个 IP 或 IP 段请用","隔开：172.16.10.11,172.16.0.0/24</div>
          </div>
        </el-form-item>
        <el-form-item label="策略" prop="strategy">
          <div class="custom-radio-group">
            <div class="custom-radio" :class="{ 'is-active': portRuleForm.strategy === 'accept' }">
              <input
                type="radio"
                id="strategy-accept"
                name="strategy"
                value="accept"
                v-model="portRuleForm.strategy"
                @change="forceRender += 1"
              />
              <label for="strategy-accept">允许</label>
            </div>
            <div class="custom-radio" :class="{ 'is-active': portRuleForm.strategy === 'drop' }">
              <input
                type="radio"
                id="strategy-drop"
                name="strategy"
                value="drop"
                v-model="portRuleForm.strategy"
                @change="forceRender += 1"
              />
              <label for="strategy-drop">拒绝</label>
            </div>
          </div>
        </el-form-item>
        <el-form-item label="区域" prop="zone">
          <el-select v-model="portRuleForm.zone" class="w-full">
            <el-option label="公共区域" value="public"></el-option>
            <el-option label="私有区域" value="private"></el-option>
            <el-option label="内部区域" value="internal"></el-option>
            <el-option label="DMZ区域" value="dmz"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="IP类型" prop="family">
          <el-select v-model="portRuleForm.family" class="w-full">
            <el-option label="IPv4" value="ipv4"></el-option>
            <el-option label="IPv6" value="ipv6"></el-option>
            <el-option label="IPv4/IPv6" value="both"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="持久化" prop="permanent">
          <el-switch v-model="portRuleForm.permanent"></el-switch>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="portRuleForm.description" 
            type="textarea" 
            placeholder="请输入描述信息"
            :rows="3"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="drawer-footer">
          <el-button @click="cancelPortRuleForm">取消</el-button>
          <el-button type="primary" @click="submitPortRuleForm">确认</el-button>
        </div>
      </template>
    </el-drawer>
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
.p-w-150 {
  width: 150px;
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
.info-icon {
  margin-left: 6px;
  cursor: pointer;
  font-size: 16px;
  color: #409eff;
  transition: color 0.2s;
}
.info-icon:hover {
  color: #66b1ff;
}
.status-with-info {
  display: flex;
  align-items: center;
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
.used-ports-list {
  padding: 5px;
}
.used-ports-list-title {
  font-weight: bold;
  margin-bottom: 10px;
  border-bottom: 1px solid #eee;
  padding-bottom: 5px;
}
.used-ports-list-content {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}
.used-port-tag {
  margin: 3px;
}
/* 增强型选择器样式 */
.el-select-dropdown__item {
  padding: 0 15px;
}
.el-option-group__title {
  font-size: 12px;
  font-weight: bold;
  color: #909399;
  padding: 10px 15px 5px;
}
.items-center {
  align-items: center;
}
.justify-between {
  justify-content: space-between;
}
.el-divider--horizontal {
  margin: 8px 0;
}
@media (min-width: 768px) {
  .md\:flex-row {
    flex-direction: row;
  }
}
/* 自定义单选按钮样式 */
.custom-radio-group {
  display: flex;
  align-items: center;
}
.custom-radio {
  position: relative;
  margin-right: 30px;
  display: flex;
  align-items: center;
  cursor: pointer;
}
.custom-radio input[type="radio"] {
  opacity: 0;
  position: absolute;
}
.custom-radio label {
  position: relative;
  padding-left: 25px;
  cursor: pointer;
  line-height: 1;
  font-weight: 500;
}
.custom-radio label:before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  width: 14px;
  height: 14px;
  border: 1px solid #dcdfe6;
  border-radius: 50%;
  background-color: #fff;
  transition: all 0.15s;
}
.custom-radio.is-active label:before {
  border-color: #409eff;
  background-color: #409eff;
}
.custom-radio.is-active label:after {
  content: "";
  position: absolute;
  left: 4px;
  top: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #fff;
}
</style> 