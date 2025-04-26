import type { ApiResult, PageParam, PageResult } from '~/types/global'
import type { AgentNode } from '~/types/agents/node'
import { request } from '~/utils/request'

/**
 * 防火墙端口规则接口
 */
export interface PortRule {
  id: number;
  nodeId: string;
  protocol: string;
  port: string;
  strategy: 'accept' | 'drop';
  sourceType: string;
  sourceAddress: string;
  description: string;
  usedStatus: string | null;
  usedPorts?: string[];
  zone: string;
  family: 'ipv4' | 'ipv6' | 'both';
  permanent: boolean;
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