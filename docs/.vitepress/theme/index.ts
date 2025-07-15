import DefaultTheme from 'vitepress/theme';
import Demo from '../components/Demo.vue';
import DragListPlugin from '../../../src';

// 导入示例组件
import DragListDemo from '../../../examples/vue-demo/src/components/DragList.vue';

// 导入样式
import './styles/index.css';

export default {
  ...DefaultTheme,
  enhanceApp({ app }) {
    // 注册演示容器组件
    app.component('Demo', Demo);

    // 注册示例组件
    app.component('DragListDemo', DragListDemo);

    // 注册拖拽指令
    app.use(DragListPlugin);
  },
};
