import DefaultTheme from 'vitepress/theme';
import Demo from '../components/Demo.vue';
import DragListPlugin from 'vue3-drag-directive';

// 导入示例组件
import DragListDemo from '../components/examples/DragList.vue';
import NestedListsDemo from '../components/examples/NestedLists.vue';
import CustomDragHandle from '../components/examples/CustomDragHandle.vue';

// 导入样式
import './styles/index.css';

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // 注册演示容器组件
    app.component('Demo', Demo);

    // 注册示例组件
    app.component('DragListDemo', DragListDemo);

    app.component('NestedListsDemo', NestedListsDemo);

    app.component('CustomDragHandle', CustomDragHandle);
    // 注册拖拽指令
    app.use(DragListPlugin);
  },
};
