# 渲染器的设计

## 渲染器基础设计

<img src="/img/vue/渲染器的设计思维导图.webp" alt="渲染器的设计思维导图"  />

### renderer 和 render 的区别

renderer 渲染器，render 是渲染，渲染器的作用时将虚拟 dom 渲染成特定平台上的真实 dom

```javaScript
/**
    renderer渲染器
 */
function createRenderer(){
    /**
        render渲染函数
        vnode：是当前触发更新的虚拟节点vnode
        container: 是当前要将更新后的vnode挂载到的容器
    */
    function render(vnode, container){
          const render = (vnode, container) => {
            console.log("调用 patch")
            patch(null, vnode, container);
          };
    }
    return {
        render
    }
}
// 首次渲染
const renderer = createRenderer()
renderer.render(vnode,document.querySelector("#app"))
```

### Vue 如何区分不同平台的渲染

为了区分不同平台，所以通过 option 来得到各个平台上对于操作 dom 的 API
根据外部传递的配置项执行，因为这个 createElement 可以是渲染到网页的，也可以渲染 canvas 的，所以要渲染到哪里由外部传递的配置项决定，如果渲染到网页，那么 createElement 就是浏览器的 API，如果是 canvas 那么 createElement 就是 canvas 的 API

```javaScript
export function createRenderer(options) {
          const {
                    createElement: hostCreateElement,
                    setElementText: hostSetElementText,
                    patchProp: hostPatchProp,
                    insert: hostInsert,
                    remove: hostRemove,
                    setText: hostSetText,
                    createText: hostCreateText,
                } = options;

    /**
        render渲染函数
        vnode：是当前触发更新的虚拟节点vnode
        container: 是当前要将更新后的vnode挂载到的容器
    */
    function render(vnode, container){
          const render = (vnode, container) => {
            console.log("调用 patch")
            patch(null, vnode, container);
          };
    }

      return {
        render
    }
  }

```

### 更新的大致流程是什么？

render --> path --> 更新挂载
如果有子节点，继续递归 path 判断是否有更新

<span style='color:red'>响应式触发</span>(数据变化后触发组件更新) --> <span style='color:red'>重新 render 渲染 </span>(执行 render 函数生成新的虚拟 DOM)--> <span style='color:red'>差异对比 patch</span>(比较新旧虚拟 DOM，确定更新点) --><span style='color:red'>更新 DOM</span>(更新或挂载真实 DOM)--><span style='color:red'>递归子节点</span>(对子节点重复上述过程，直至完成全树更新)

## 属性处理机制

<img src="/img/vue/vue属性处理.webp" alt="vue属性处理" width=700  />

### Attribute 与 Property 的区别

attribute 是 HTML <span style='color:red'>标签</span>上的属性，例如 class、id 等

而 property 是<span style='color:red'>对象</span>上的属性，比如 calssName 是 dom 对象的 property 属性

如果 attribute 属性和 property 属性的名字一样，如 input 标签的 value，

```html
<input value="6666" />
```

如果给这个 value 设置一个值为 6666，那么 attribute 的 value 的值就为 6666，然后 property 也会被设置为 6666

我们是在标签上设置默认值的，所以设置的是 attribute 属性，然后 property 也有值了,说明在同名的情况下 attribute 属性值会决定 property 的初始值。

当我们通过浏览器对 input 标签进行输入的时候，此时 value 的值会改变，但是改变的是 property 的 value 属性，attribute 的 value 属性始终是 6666，这说明了 attribute 属性<span style='color:red'>一设定终生</span>，而 property 属性会更改

<span style='color:red'>总结</span>：attribute 和 property 属性是同名的情况下，attribute 的初始值就是 property 的初始值，attribute 一设定终生(一般在 HTML 源码中是不会修改的，除非调用 setAttribute 的情况下)，而 property 则可以后期通过视图修改

### Vue 标签属性的描述

使用 props 描述一个元素的属性

```javaScript
const vnode = {
    type:'div',
    // 使用props描述一个元素的属性
    props:{
        id: 'foo'
    },
    children:[
        {type:'p',children:"p标签内容"},
        {type:'p',children:"p标签内容"}
    ]
}
```

### Vue 中 pathProps 过程中 Attribute 与 Property 的区分

遍历 vnode 的 props 对象，然后在 dom 对象中读取这个 key 属性，如果存在说明是 dom 的 property 属性

```javaScript
function pathProps(){
        const dom = document.createElement(vnode.type)
        if(vnode.props){
        //    遍历props对象，然后在dom对象中读取这个key属性，如果存在说明是dom的property属性
            for(const key in vnode.props){
                if(key in dom){
                   // property属性
                } else {
                    // 是attribute属性
                }
            }
        }
}
```

我们检查每一个 vnode.props 中的属性，看看是否存在对应的 DOM Properties，如果存在，则优先设置 DOM Properties。同时，我们对布尔类型的 DOM Properties 做了值的矫正，即当要设置的值为空字符串时，将其矫正为布尔值 true。当然，如果 vnode.props 中的属性不具有对应的 DOM Properties，则仍然使用 setAttribute 函数完成属性的设置。

### Vue 给 DOM 绑定 Class 时优先使用 className 以提升性能

el.className 的性能比 setAttribute 高，所以 vue 给 dom 添加 class 就采用了 e.classname 进行设置，这样性能更好

## DOM 操作与事件处理

<img src="/img/vue/DOM操作与事件处理.webp" alt="DOM操作与事件处理" width=700  />

### 为什么 vue 中清空节点不使用 inneHTML = ''来清空容器 container 的内容？vue 采用什么方式清空的？

#### inneHTML = ''来清空的弊端

当一个节点被从 DOM 中移除时，该节点及其下属的子节点因为没有被引用所以会被垃圾回收机制回收，这意味着它们占用的内存会被释放。但是，事件监听器是与节点相关联的，如果在移除节点之前没有正确地移除事件监听器，那么这些事件监听器可能会继续存在，从而导致内存泄漏。因此，为了确保内存的正常释放和避免内存泄漏，我们通常需要在移除节点之前，手动移除与之相关的事件监听器。
正确的卸载方式是：根据 vnode 对象获取与其相关联的真实 DOM 元素，然后使用原生 DOM 操作方法将该 DOM 元素移除

#### vue 如何删除 dom 的

vue 是根据当前遍历到的虚拟节点，找到虚拟节点对应的 dom，然后清除掉该 dom 上的事件等，最后再通过父元素来清除自己 vnode.el.parent.removeChild(vnode.el)

```javaScript
function render(vnode, container) {
   if (vnode) {
        patch(container._vnode, vnode, container)
   }
   else {
        if (container._vnode) {
             // 根据 vnode 获取要卸载的真实 DOM 元素
             const el = container._vnode.el
             // 获取 el 的父元素
             const parent = el.parentNode
             // 调用 removeChild 移除元素
             if (parent) parent.removeChild(el)
       }
   }
        container._vnode = vnode
    }
```

要注意 dom 和事件监听器是两码事，dom 没被引用会被垃圾回收机制清理，但是事件监听器不会

### vue 在什么情况下才会进行新旧虚拟节点的匹配？

前后虚拟节点的类型要一致才进行新旧虚拟节点的匹配，如果是新 vnode 是 p,旧的是 div,那么就会删除旧的，挂载新的 p，即节点类型一致才进行 path(n1,n2)，如果不一致那就是 path(null,n2)，说明挂载 n2 的 dom，直接删除原有的 n1.el
用 createElement 来创建新的 n2.el

```javaScript
function patch(n1, n2, container) {
  // 如果 n1 存在，则对比 n1 和 n2 的类型
   if (n1 && n1.type !== n2.type) {
   // 如果新旧 vnode 的类型不同，则直接将旧 vnode 卸载
     unmount(n1)
     n1 = null
    }
    if (!n1) {
     mountElement(n2, container)
    } else {
      // 更新
    }
 }
```

### vue 中 path 分几种情况？

- TEXT 文本虚拟节点
- Fragment 虚拟节点
- processElement 元素虚拟节点
- processComponent 组件虚拟节点

在 vue 中，无论是用 template 模版编写的 dom，还是组件对象中编写的 render 方法，最终都会被转换成虚拟 dom，虚拟 dom 在更新时会进行新旧虚拟节点的比较，然后再更新到 dom 视图中

在 Vue 的更新过程中，虚拟节点的类型 type 会决定如何处理它们。根据虚拟节点的类型（文本节点、组件、元素节点等），Vue 会采取不同的处理方式。例如，对于元素节点，Vue 会使用 diff 算法来确定 DOM 上需要进行哪些元素的更改。

在更新过程中，Vue 会对新旧虚拟节点进行比较，并根据差异进行相应的 DOM 操作，以确保 DOM 能够正确地反映新的虚拟节点状态。这个过程确保了 Vue 的高效更新和渲染。

总的来说：无论是模板还是组件，最终都会被转换成虚拟 DOM，然后进行比较和更新。Diff 算法主要用于处理元素类型的差异，以确定实际 DOM 上需要哪些进行更改。

```javaScript
function patch(
    n1,
    n2,
    container = null,
    anchor = null,
    parentComponent = null
  ) {

    // 如果新旧虚拟节点的type类型不一致，那么删除旧的，直接挂载新的n2.el
    if (n1.type !== n2.type) {
      hostRemove(n1.el)
      n1 = null
    }
    // 基于 n2 的类型来判断
    // 因为 n2 是新的 vnode
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      // 其中还有几个类型比如： static fragment comment
      case Fragment:
        processFragment(n1, n2, container);
        break;
      default:
        // 这里就基于 shapeFlag 来处理
        if (shapeFlag & ShapeFlags.ELEMENT) {
          console.log("处理 element");
          processElement(n1, n2, container, anchor, parentComponent);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          console.log("处理 component");
          processComponent(n1, n2, container, parentComponent);
        }
    }
  }
```

### vue 中如何注册事件的？用了什么来存储事件具柄？

```javaScript
const vnode = {
    type:'div',
    // 使用props描述一个元素的属性
    props:{
        onClick: ()=>{
            console.log('点击事件')
        }
    },
    children:[
        {type:'p',children:"p标签内容"},
        {type:'p',children:"p标签内容"}
    ]
}

const div = document.createElement(vnode.type)
div.addEventListener('click',()=>{
      console.log('点击事件')
})
```

就是读取 vnode 中的 props 的时候，发现 props 中属性是以 on 开头的，那么就用正则表达式将事件名截取下来，然后用 addEventListener 来注册事件。
但是如果我们频繁的修改事件回调的话，会导致频繁操作 addEventListener 和 removeEventListene,会带来一定的性能开销，vue 使用一个 invoke 对象来存储事件回调，key 就是事件名，value 就是事件回调，然后用 addEventListener 来对 invoke 对象上的 key 作为事件名，value 属性值来绑定事件回调，当事件名对应的回调函数更新时，我们只需要修改 invoke 对象上的属性值即可,这样就不用频繁操作 addEventListener 和 removeEventListene 了

invoke 对象的 key 属性值可以是一个回调函数，也可以是一个数组，一个回调代表着当前事件只是注册了一遍，而一个数组代表着注册了多次，因为 addEventListener 可以给事件注册多次，如点击事件

这个 invoke 对象不是放在全局下，而是作为当前虚拟节点对应的 dom 的属性下，即 `vnode.el.invoke = {...}`

<span style='color:red'>本质</span>：直接改事件句柄，事件句柄作为 vnode 的对象属性，所以每次只需要修改这个对象即可，这个对象的内存地址始终不变，不需要频繁的移除事件和重绑事件

## 虚拟节点的 children 子节点

<img src="/img/vue/虚拟节点子节点类型思维导图.webp" alt="虚拟节点子节点类型思维导图" width=600  />

一个虚拟节点的 children 子节点有几种情况？

3 种情况

1.  没有子节点

```javaScript
vnode = {
    type:'div',
    children: null
}
```

2.  子节点为文本节点

```javaScript
vnode = {
    type:'div',
    children: "Some Text"
}
```

3. 子节点为多种节点混合组合， 使用数组表示

```javaScript
vnode = {
    type:'div',
    children: [
        {
         type:'p',
         children: "Some Text"
        },
        {
         type:TEXT,
         children: "Some Text"
        }
    ]
}
```
