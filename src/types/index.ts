// 拖拽列表项的基础接口
export interface DragListItem {
  id: string | number;
  [key: string]: any;
}

// 拖拽更新事件的详情
export interface DragListUpdateDetail {
  updatedData: DragListItem[];
  draggedItemData: DragListItem | null;
}

// 插件安装选项
export interface DragListPluginOptions {
  name?: string; // 自定义指令名称，默认为 'drag-list'
}
