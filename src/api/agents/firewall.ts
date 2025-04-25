import type { ApiResult, PageParam, PageResult } from '~/types/global'
import type { AgentNode } from '~/types/agents/node'
import { request } from '~/utils/request'

/**
 * 防火墙端口规则接口
 */
export interface PortRule {
  id: number;
  protocol: string;
  port: string;
  strategy: 'accept' | 'drop';
  address: string;
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