import type { ApiResult, PageParam, PageResult } from '~/types/global'
import type { AgentNode, NodeOperationParam, NodeRefreshParam } from '~/types/agents/node'
import { request } from '~/utils/request'

enum Api {
  Page = '/agents/node/page',
  Detail = '/agents/node/detail',
  Operation = '/agents/node/operation',
  Refresh = '/agents/node/refresh',
  PublicKey = '/agents/node/public-key',
  CheckAgent = '/agents/node/check-agent',
  Batch = '/agents/node/batch',
  Delete = '/agents/node/delete',
}

/**
 * 分页查询节点信息
 * @param param 查询参数
 * @returns 节点列表
 */
export function pageNodeApi(param: PageParam<AgentNode>) {
  return request.post<ApiResult<PageResult<AgentNode>>>(Api.Page, {
    data: param,
  })
}

/**
 * 获取节点详情
 * @param nodeId 节点ID
 * @returns 节点详情
 */
export function getNodeDetailApi(nodeId: string) {
  return request.get<ApiResult<AgentNode>>(`${Api.Detail}/${nodeId}`)
}

/**
 * 执行节点操作（重启/停止）
 * @param param 操作参数
 * @returns 操作结果
 */
export function operateNodeApi(param: NodeOperationParam) {
  return request.post<ApiResult<boolean>>(Api.Operation, { 
    data: param,
    repeatSubmit: false // 防止重复提交
  })
}

/**
 * 刷新节点状态
 * @param param 节点ID数组，为空表示刷新全部节点
 * @returns 刷新结果
 */
export function refreshNodeStatusApi(param: NodeRefreshParam) {
  return request.post<ApiResult<boolean>>(Api.Refresh, {
    data: param,
  })
}

/**
 * 获取主机公钥
 * @returns 公钥字符串
 */
export function getHostPublicKeyApi() {
  return request.get<ApiResult<string>>(Api.PublicKey)
}

/**
 * 客户端状态检查参数
 */
export interface CheckAgentParams {
  /** 客户端-用户名 */
  serverUserName: string
  /** 主机/IP */
  sshServerIpOrHostName: string
  /** 端口 */
  sshServerPort: number | string
  /** 公钥 */
  publicKey: string
}

/**
 * 检查客户端运行状态
 * @param params 客户端信息参数
 * @returns 检查结果
 */
export function checkAgentRunningStatusApi(params: CheckAgentParams) {
  return request.post<ApiResult<boolean>>(Api.CheckAgent, {
    data: params,
    repeatSubmit: false // 防止重复提交
  })
}

/**
 * 批量删除节点
 * @param nodeIds 节点ID数组
 * @returns 删除结果
 */
export function batchDeleteNodeApi(nodeIds: string[]) {
  return request.delete<ApiResult<boolean>>(Api.Batch, {
    data: nodeIds,
    repeatSubmit: false // 防止重复提交
  })
}

/**
 * 删除节点
 * @param nodeId 节点ID
 * @returns 删除结果
 */
export function deleteNodeApi(nodeId: string) {
  return request.delete<ApiResult<boolean>>(`${Api.Delete}/${nodeId}`)
} 