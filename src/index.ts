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

// CDN 全局挂载 - 用于 script 标签直接引用
// if (typeof window !== 'undefined' && window.Vue) {
//   // 挂载到全局对象
//   (window as any).VueDragList = {
//     DragListPlugin,
//     vDragList,
//     registerDragList,
//     // 便于直接使用
//     install: DragListPlugin.install,
//   };

//   // 自动安装（如果检测到 Vue 全局对象）
//   if ((window as any).Vue.createApp) {
//     // Vue 3
//     const { createApp } = (window as any).Vue;
//     const originalCreateApp = createApp;
//     (window as any).Vue.createApp = function (...args: any[]) {
//       const app = originalCreateApp(...args);
//       if (!(window as any).__vueDragListInstalled) {
//         app.use(DragListPlugin);
//         (window as any).__vueDragListInstalled = true;
//       }
//       return app;
//     };
//   }
// }
