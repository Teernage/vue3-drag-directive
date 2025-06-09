import type { App } from 'vue';
import { vDragList, registerDragList } from './directive';
import type {
  DragListItem,
  DragListUpdateDetail,
  DragListPluginOptions,
} from './types';

// 命名导出 - 确保这些导出存在
export { vDragList, registerDragList };
export { vDragList as dragListDirective };
export type { DragListItem, DragListUpdateDetail, DragListPluginOptions };

// 默认导出
const DragListPlugin = {
  install(app: App, options: DragListPluginOptions = {}) {
    const directiveName = options.name || 'drag-list';
    app.directive(directiveName, vDragList);
  },
};

export default DragListPlugin;
