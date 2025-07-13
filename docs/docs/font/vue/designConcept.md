# vue3 设计思路

<img src="/img/vue/vue3设计思路.webp" alt="vue3设计思路"  />

1. 描述 UI 的方式：

- 声明式模板描述：使用 HTML 模板语法。
- 命令式 render 函数：通过 JavaScript 函数描述 UI。

2. 初始渲染器：

- 本质是通过 createRenderer 函数创建的 renderer 对象。
- renderer 对象包含一个 render 函数，用于将虚拟 DOM 挂载到实际 DOM 元素上。

3. 组件的本质：

- Vue 组件是 DOM 元素的封装。

4. 模板的工作原理：

- 模板通过编译(compilation)转化为虚拟 DOM。

## Vue 组件中 render 函数与 template 的关系及其虚拟 DOM 挂载机制

### vue 组件中编写 render 函数是否意味着不用编写 template 模板了？render 函数生成的虚拟 dom 树是挂载到哪的？

当我们在 Vue 组件中手写 render 函数并返回虚拟节点时，实际上我们是在定义组件的渲染输出，这意味着我们可以不用编写 template 模板。render 函数生成的虚拟 DOM 最终会被渲染到与该组件关联的 DOM 节点下。 在 Vue 中，每个组件实例都有一个挂载点，也就是组件被插入到 DOM 树中的位置。通常，这个挂载点是在组件被创建时指定的，例如使用 mount 方法时传入的选择器或 DOM 元素。
以下是 Vue 3 中组件挂载的一个简化的源码流程，展示了如何将组件的渲染结果挂载到 DOM 上：

```javaScript
import { createApp, h } from 'vue';
const App = {
    render() {
        // 使用 h 函数创建虚拟 DOM
       return h('div', 'Hello, Vue!');
   }
 }
    // 创建应用实例，并将其挂载到页面上的某个元素
    createApp(App).mount('#app');
```

在上面的代码中，createApp 函数用于创建一个 Vue 应用实例，App 组件的 render 函数返回了一个虚拟 DOM，然后 mount 方法将该应用实例挂载到页面上 #app 元素下。 在 Vue 的内部实现中，当调用 mount 方法时，Vue 会创建一个渲染器（renderer），这个渲染器负责将虚拟 DOM 转换为真实 DOM，并将其挂载到指定的挂载点。以下是一个非常简化的版本，展示了渲染器如何工作：

```javaScript
function mountComponent(container) {
 // 创建虚拟 DOM
  const vnode = this.render();
    // 渲染虚拟 DOM 到真实 DOM
  const renderer = createRenderer();
      renderer.render(vnode, container);
  }

  function createRenderer() {
   return {
     render(vnode, container) {
         // ...将 vnode 转换为真实 DOM，并挂载到 container 下
           }
     }
   }
```

在 Vue 的源码中，这个过程由渲染器的 render 方法和挂载逻辑更复杂地处理，涉及虚拟 DOM 的 patch 算法、组件的生命周期管理等。但核心思想是，render 函数返回的虚拟 DOM 树会被渲染器转换并挂载到组件的挂载点。
