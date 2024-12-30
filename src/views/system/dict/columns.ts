export const dictColumns = [
  {
    key: 'name',
    title: '字典名',
    align: 'center',
  },
  {
    key: 'code',
    title: '字典编码',
    align: 'center',
  },
]

export const dictItemColumns = [
  {
    title: '',
    type: 'selection',
    width: '50px',
    fixed: 'left',
  },
  {
    key: 'name',
    title: '字典项',
    align: 'center',
  },
  {
    key: 'value',
    title: '值',
    align: 'center',
  },
  {
    key: 'describe',
    title: '描述',
    align: 'left',
  },
  {
    key: 'sortValue',
    title: '排序',
    width: '100px',
    sortable: 'custom',
    align: 'center',
    fixed: 'right',
  },
  {
    key: 'operator',
    title: '操作',
    align: 'center',
    width: '140px',
    customSlot: 'operator',
    fixed: 'right',
  },
]
