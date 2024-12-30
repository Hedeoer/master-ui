/**
 * 树
 */
export interface TreeData {
  /** 树id */
  id: string
  /** 值 */
  value: string
  /** 树标题 */
  label: string
  /** 图标 */
  field: string
  /** 是否展开 */
  isLeaf: boolean
  /** 子树 */
  children?: TreeData[]
  /** 是否禁用 */
  disabled?: boolean
}
