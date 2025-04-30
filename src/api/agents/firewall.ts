import type { ApiResult, PageParam, PageResult } from '~/types/global'
import type { AgentNode } from '~/types/agents/node'
import { request } from '~/utils/request'

/**
 * 防火墙端口规则接口
 */
export interface PortRule {
  /**
   * 规则ID，唯一标识
   */
  id: number;

  /**
   * 节点ID，表示规则所属的节点
   * 格式通常为字符串UUID或自定义标识符
   */
  nodeId: string;

  /**
   * 协议类型
   * 可能的值: "TCP", "UDP", "TCP/UDP"
   */
  protocol: string;

  /**
   * 端口或端口范围
   * 格式:
   * - 单个端口: "80"
   * - 端口范围: "8080-8090"
   * - 多个端口: "80,443,8080"
   */
  port: string;

  /**
   * 策略类型
   * - "accept": 允许
   * - "drop": 拒绝
   */
  strategy: 'accept' | 'drop';

  /**
   * 来源类型
   * - "any": 所有IP
   * - "specific": 指定IP
   */
  sourceType: string;

  /**
   * 来源地址
   * - 当sourceType为"any"时，通常为"0.0.0.0"
   * - 当sourceType为"specific"时，可以是具体IP或IP范围
   * 格式:
   * - 单个IP: "192.168.1.1"
   * - IP范围: "192.168.1.0/24"
   * - 多个IP: "192.168.1.1,192.168.1.2"
   */
  sourceAddress: string;

  /**
   * 规则描述
   * 用户自定义的规则说明文本
   */
  description: string;

  /**
   * 端口使用状态
   * - "inUsed": 已使用
   * - "notUsed": 未使用
   */
  usedStatus: string | null;

  /**
   * 已使用的端口列表
   * 仅当端口为范围或多个端口且有部分被使用时存在
   * 例如: ["8080", "8085"] 表示在范围中这些端口已被使用
   */
  usedPorts?: string[];

  /**
   * 防火墙区域
   * 可能的值:
   * - "public": 公共区域
   * - "private": 私有区域
   * - "internal": 内部区域
   * - "dmz": DMZ区域
   */
  zone: string;

  /**
   * IP类型
   * - "ipv4": 仅IPv4
   * - "ipv6": 仅IPv6
   * - "both": 同时支持IPv4和IPv6
   */
  family: 'ipv4' | 'ipv6' | 'both';

  /**
   * 是否永久生效
   * - true: 规则永久有效
   * - false: 规则临时有效，系统重启后会失效
   */
  permanent: boolean;

  /**
   * 端口使用详情
   * 记录每个已使用端口的详细信息，包括进程名称、PID等
   * 对齐后端返回字段
   */
  portUsageDetails?: Array<{
    id: string;
    createTime: string | null;
    createdBy: string | null;
    updateTime: string | null;
    updatedBy: string | null;
    agentId: string;
    protocol: string;
    portNumber: number;
    processName: string;
    processId: number;
    commandLine: string;
    listenAddress: string;
  }>;
}

/**
 * 防火墙状态信息接口
 */
export interface FirewallStatus {
  /**
   * 防火墙运行状态
   * - "running": 运行中
   * - "not running": 已停止
   */
  status: 'running' | 'not running';
  
  /**
   * 防火墙名称
   * 如: "UFW", "Firewalld", "IPTables"等
   */
  name: string;
  
  /**
   * 防火墙版本号
   */
  version: string;
  
  /**
   * Ping响应状态
   * - "Enable": 允许Ping
   * - "Disable": 禁止Ping
   */
  pingStatus: 'Enable' | 'Disable';
}

/**
 * 防火墙API路径
 */
enum Api {
  PortRules = '/agents/firewall/port-rules',
  IpRules = '/agents/firewall/ip-rules',
  ForwardRules = '/agents/firewall/forward-rules',
  Status = '/agents/firewall/status',
  Operation = '/agents/firewall/operation',
  NodeList = '/agents/firewall/nodes',
  AddPortRule = '/agents/firewall/port-rule',
  UpdatePortRule = '/agents/firewall/port-rule',
  DeletePortRules = '/agents/firewall/port-rules/delete',
}

/**
 * 获取所有防火墙节点
 * @returns 节点列表
 */
export function fetchNodeListApi() {
  return request.get<ApiResult<AgentNode[]>>(Api.NodeList)
}

/**
 * 获取指定节点的端口规则
 * @param nodeId 节点ID
 * @returns 端口规则列表
 */
export function fetchPortRulesByNodeId(nodeId: string) {
  return request.get<ApiResult<PortRule[]>>(`${Api.PortRules}/${nodeId}`)
}

/**
 * 端口规则提交参数接口
 */
export interface PortRuleSubmitParams {
  nodeId: string;        // 节点ID
  protocol: string;      // 协议类型，如tcp, udp
  port: string;          // 端口号或端口范围
  sourceType: string;    // 来源类型：any或specific
  sourceAddress?: string; // 指定来源地址，当sourceType为specific时必填，sourceType为any时,sourceAddress为0.0.0.0
  strategy: 'accept' | 'drop'; // 策略，接受或拒绝
  zone: string;          // 区域，如public, private, internal, dmz
  family: 'ipv4' | 'ipv6' | 'both'; // IP类型
  permanent: boolean;    // 是否永久生效
  description?: string;  // 描述信息
}

/**
 * 添加端口规则
 * @param params 端口规则参数
 * @returns 添加结果，包含新添加的规则ID
 */
export function addPortRuleApi(params: PortRuleSubmitParams) {
  return request.post<ApiResult<{ id: number }>>(Api.AddPortRule, {
    data: params,
    repeatSubmit: false // 防止重复提交
  })
}

/**
 * 更新端口规则
 * @param ruleId 规则ID
 * @param params 更新的规则数据
 * @returns 更新结果
 */
export function updatePortRuleApi(ruleId: number, params: PortRuleSubmitParams) {
  return request.put<ApiResult<boolean>>(`${Api.UpdatePortRule}/${ruleId}`, {
    data: params,
    repeatSubmit: false // 防止重复提交
  })
}

/**
 * 删除端口规则
 * @param nodeId 节点ID
 * @param ruleIds 规则ID数组
 * @returns 删除结果
 */
export function deletePortRulesApi(nodeId: string, ruleIds: number[]) {
  return request.post<ApiResult<boolean>>(Api.DeletePortRules, {
    data: {
      nodeId,
      ruleIds
    },
    repeatSubmit: false // 防止重复提交
  })
}

/**
 * 获取防火墙状态信息
 * @param nodeId 节点ID
 * @returns 防火墙状态信息
 */
export function fetchFirewallStatusApi(nodeId: string) {
  return request.get<ApiResult<FirewallStatus>>(`${Api.Status}/${nodeId}`)
}

/**
 * 操作防火墙
 * @param nodeId 节点ID
 * @param operation 操作类型，"start"、"stop"、"restart"
 * @returns 操作结果
 */
export function operateFirewallApi(nodeId: string, operation: 'start' | 'stop' | 'restart') {
  return request.post<ApiResult<boolean>>(Api.Operation, {
    data: { 
      nodeId,
      operation 
    },
    repeatSubmit: false // 防止重复提交
  })
}

/**
 * 设置Ping响应状态
 * @param nodeId 节点ID
 * @param pingStatus Ping响应状态，"Enable" 允许，"Disable" 禁止
 * @returns 操作结果
 */
export function setPingStatusApi(nodeId: string, pingStatus: 'Enable' | 'Disable') {
  return request.post<ApiResult<boolean>>(`${Api.Operation}/ping`, {
    data: { 
      nodeId,
      pingStatus 
    },
    repeatSubmit: false // 防止重复提交
  })
} 