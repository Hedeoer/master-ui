import type { ApiResult, PageParam, PageResult } from '~/types/global'
import type { AgentNode, NodeOperationParam, NodeRefreshParam } from '~/types/agents/node'
import { request } from '~/utils/request'

enum Api {
  Page = '/agents/node/page',
  Detail = '/agents/node/detail',
  Operation = '/agents/node/operation',
  Refresh = '/agents/node/refresh',
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