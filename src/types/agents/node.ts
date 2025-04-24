/**
 * 节点信息
 */
export interface AgentNode {
  /** 节点ID */
  nodeId?: string
  /** 主机名 */
  nodeName?: string
  /** IP地址 */
  nodeIp?: string
  /** 节点状态 online/offline */
  nodeStatus?: string
  /** CPU利用率 */
  cpuUsage?: number
  /** 内存利用率 */
  memoryUsage?: number
  /** 磁盘利用率 */
  diskUsage?: number
  /** 客户端版本 */
  clientVersion?: string
  /** 最后心跳时间 */
  lastHeartbeat?: string
}

/**
 * 节点操作参数
 */
export interface NodeOperationParam {
  /** 节点ID */
  nodeId: string
  /** 操作类型 restart/stop */
  operation: string
}

/**
 * 刷新节点状态参数
 */
export interface NodeRefreshParam {
  /** 节点ID数组，为空表示刷新全部节点 */
  nodeIds: string[]
} 