# ⚡ 一个 Vue 自定义指令搞定丝滑拖拽列表，告别复杂组件封装

## 🌟 前言：为什么不用现成的拖拽库？

你有没有遇到过这种情况：产品经理突然跑过来说"这个列表能不能拖拽排序啊？就像 iPhone 桌面那样！"

这时候你可能会想：

- "用 Sortable.js 吧！" —— 但是包体积 20KB+，还要适配 Vue
- "Vue Draggable 很成熟啊！" —— 确实成熟，但依赖重，定制性差
- "Element Plus 的拖拽组件..." —— 样式耦合严重，难以定制

### 🤔 第三方库的痛点

- 🎨 **想要炫酷动画？** 库：不好意思，我只有基础款
- 📦 **包太大了吧？** 为了拖个列表，bundle 增加 50KB，就像买坦克送外卖
- 💄 **样式打架了** 库的 CSS 和你的 UI 框架各种冲突，改到怀疑人生
- 🔧 **业务逻辑复杂** 想加个权限判断？抱歉，请适配我的 API

### **自己写指令的好处**

- ⚡ **轻如鸿毛**：200 行代码搞定，比一张图片还小
- 🎭 **想咋动画咋动画**：FLIP、弹跳、渐变，你说了算
- 🎯 **完美契合业务**：权限、状态、回调，想怎么玩怎么玩

## 🛠️ 用法像吃泡面一样简单

```
<div
  v-drag-list="{ list: dataList, canDrag: true }"
  @drag-mode-start="onDragModeStart"
  @drag-mode-end="onDragModeEnd"
>
  <AddAppItem />
  <AppItem v-for="item in dataList" :data-id="item.id" />
</div>
```

**只要两步（比学会用筷子还容易）：**

1.  给容器加 `v-drag-list`，顺手把 `list` 数据和 `canDrag`（能不能拖）告诉它。

1.  每个拖拽元素要做三件事：

    1.  绑定 `data-id`，方便拖拽过程中根据 id 获取对应的数据（相当于给每个元素贴个身份证）
    1.  添加 `app-item` 类名，指令通过此类名识别可拖拽元素（就像给能拖的元素贴个"我能拖"的标签）
    1.  然后就没有然后了，坐等拖拽功能自动生效！

## 🧩 支持的配置和事件

- **list**：列表数据源，指令帮你排序。
- **canDrag**：能不能拖，支持业务自定义（比如搜索时禁止拖拽）。
- **drag-mode-start**：拖拽开始，列表进入“战斗模式”。
- **drag-mode-end**：拖拽结束，顺序变了，数据也带给你。

## 🏃♂️ 拖拽的交互体验

- **拖起来**：鼠标一按，列表项“腾空而起”，跟着鼠标走。
- **自动让位**：拖着拖着，其他小伙伴自动闪开，给你让道。
- **松手定乾坤**：一松鼠标，列表项稳稳落地，顺序自动调整。
- **数据同步**：你不用操心，新的顺序自动传给你。

## 🧑💻 实现思路揭秘（不怕你笑）

### 🚀 实现列表元素拖拽的前提

- 确保列表元素中有 draggable 属性，这样才能使用拖拽功能

```
<div draggable="true"></div>
```

- 元素需要绑定 dragstart、dragenter、dragend 三个事件，才可以实现一个拖拽流程

### 🏗️ 实现形式

**自定义指令**：为了尽量减少修改原有列表组件，增加组件可维护性，我将实现拖拽的功能逻辑封装成一条自定义指令

**事件委托**：实现拖拽的功能，本质上就是要每个元素实现拖拽事件，这样才能够实现拖拽功能，但是如果我们直接给所有的元素节点绑定事件的话会导致性能问题，所以我们采用事件委托的方式将事件绑定到元素节点的父元素上(即元素的父容器)，子元素通过冒泡的方式来触发拖拽事件

在 vue 的自定义指令中有一个 mounted 生命周期函数，在这里可以获取到绑定这条自定义指令的 dom 元素，因为我们是采用事件委托的方式，所以自定义指令是作用在列表最外层，所以我们获取到的是所有列表元素节点的父节点

然后我们给父节点绑定三个事件、分别是 dragstart、dragenter、dragend

### 🎪 事件处理

#### dragstart：

##### 坑点 1：透明度设置的时机问题

**细节**：当我们拖拽开始的时候，浏览器会生成一个拖拽元素快照跟随鼠标，这就是拖拽效果，我们要实现元素拖拽起来的时候，当前拖拽的元素在列表中消失，所以我们需要在拖拽开始的时候给拖拽元素加上一个透明度为 0 的样式，但是这个时候会发现连拖拽效果也一起消失了，透明度都为 0，为什么？

**原因**：这是因为浏览器生成元素快照的时机是在 dragstart 事件回调代码执行完成后，但在 dragstart 事件结束之前(像当前事件回调这个宏任务中的一个微任务)，如果在 dragstart 事件回调中直接就设置透明度，那会导致原来的元素就设置成透明，当拖拽开始回调执行完之后生成快照，这时候的元素快照就是透明的，所以啥也看不见

**解决方式**：使用 setTimeout 来实现拖拽元素透明度的设置，因为 setTimeout 是一个宏任务，会在下一次事件循环中才执行，这样的话浏览器就可以生成快照再应用样式，就可以实现拖拽项从原列表消失，浮起并跟随鼠标

```
  // ❌ 错误做法：直接设置透明度
element.style.opacity = '0'  // 连拖拽效果都没了！

  function handleDragStart() {
     // ✅ 正确做法：延迟设置
    setTimeout(() => {
      element.style.opacity = '0'  // 完美！
    })
  }
```

##### 坑点 2：文本选择的干扰

**细节**: 当我们选中列表外的一些字体或者元素上的文字进行拖拽的时候，就会导致拖拽功能异常

**原因**：浏览器对可选中内容（如文字、图片）存在原生拖放行为，当用户点击元素时，浏览器会优先执行默认的文本选中或图片拖拽，导致跟自定义拖拽逻辑冲突。

**解决**: 在拖拽开始的时候对选中的文字进行去除

```
function handleDragStart(e) {
    clearSelection()
    ...
}

function clearSelection() {
  const selection = window.getSelection && window.getSelection()
  if (selection && selection.removeAllRanges) {
    selection.removeAllRanges()
  }
}
```

**细节**：拖拽时候的鼠标样式

```
e.dataTransfer.effectAllowed = 'move'
```

#### dragenter：

这个事件会在拖拽快照移动到其他元素身上的时候触发，我们将在这个事件中完成元素的位置更替

我们在拖拽开始的时候记录正在拖拽元素 dom，在 enter 事件中获取目标元素，然后判断二者在列表中的索引大小，如果拖拽元素的索引小于目标元素的索引，那么需要将拖拽元素插入到目标元素的后面，反之则插入到前面

```
  function handleDragEnter(e) {
    preventDefault(e)

    const target = e.target.closest('.app-item')

    if (!target || target === currentDragNode || target === el) {
      return
    }

    const children = Array.from(el.children)
    const sourceIndex = children.indexOf(currentDragNode)
    const targetIndex = children.indexOf(target)

    if (sourceIndex < targetIndex) {
      list.insertBefore(currentDragNode, target.nextElementSibling)
    } else {
      list.insertBefore(currentDragNode, target)
    }
  }
```

#### dragend:

这是一个拖拽操作的最后一环节，这时候我们获取拖拽结束后的列表数据

##### 坑点：默认事件的"捣乱"

**细节**：当我们从拖拽一个元素到其他位置放开鼠标，会发现元素不会马上移动到目标位置，而是会出现拖拽效果的快照先飞回元素原来的位置再到目标位置的一个动效 bug，为什么会这样？

**原因**：这是因为浏览器的元素默认不允许其他元素拖拽到自身，如果我们拖拽到其他元素身上，那么就会让我们"先回去"的样式即飞回去，然后再到目标位置(因为 dom 顺序改了，所以最终还是会到目标位置)。

**解决**: 取消默认事件，不仅要取消列表上的 dragenter 和 dragend 事件中的默认事件，还要取消全局 dragenter 和 dragend 的默认事件。

```
  function preventDefault(e) {
    e.preventDefault()
  }

  function handleDragEnter(e) {
     preventDefault(e)
  }

  function handleDragEnter(e) {
     preventDefault(e)
  }

 window.removeEventListener('dragenter', this.preventDefault)
 window.removeEventListener('dragover', this.preventDefault)
 window.removeEventListener('dragend', this.preventDefault)
```

### 🔄 指令更新

当列表数据更新的时候会触发 update 生命周期函数，在这里进行旧事件的销毁，事件的重新注册

##### 坑点：快速连续拖拽导致元素消失

**细节**: 当我们快速连续拖拽时，就会导致元素消失，为什么？

**原因**：第一次拖拽结束后，数据还没更新，用户又迅速开始了第二次拖拽。第二次拖拽开始之后，这时自定义指令的 updated 才被触发，卸载了旧事件并重新初始化，导致第二次拖拽结束之后找不到拖拽的 dom(被初始化了), 所以没法给拖拽元素去除拖拽样式(透明度为 0)，所以就会导致元素消失了

**解决**: 在拖拽进行中的时候，阻止指令的更新操作

```
// 问题：拖拽过程中指令更新会重置状态
async updated(el, binding) {
  if (el._isDragging) return  // 拖拽中不允许更新！
  // ....
}
```

## 🎬 元素列表结构的动画处理：FLIP

采用的是 flip 动画思想：设置改变列表结构的动画

- **First**：元素初始时的具体信息
- **Last**：元素结束时的位置信息
- **Invert**：倒置。虽然元素到了结束时的节点位置，但是视觉上我们并没有看到，此时要设计让元素动画从 First 通过动画的方式变换到 Last，刚好我们又记录了动画的开始和结束信息，因此我们可以利用自己熟悉的动画方式来完成 Invert
- **Play**：动画开始执行。在代码上通常 Invert 表示传参，Play 表示具体的动画执行。

**First 的记录时机**：给列表注册事件的时候记录每个 dom 的初始位置 **Last 的记录时机**：在 enter 事件的时候中记录整个列表中所有 dom 的位置 **Invert 执行时机在记录 last 之后**：所有 dom 的 first 起始位置和最后的位置相减得到 dis 值，给每个 dom 赋值上

```
dom.style.transform = `translate(${deltaX}px, ${deltaY}px)`
```

之后，所有的位置都会回到 fist 初始位置

**Play 执行时机在 invert 的下一帧**，让所有 dom 设置上

```
this.dom.style.transition = `transform ${this.durationTime}`
this.dom.style.transform = 'none'
```

这样所有的 dom 就会从上一帧的初始位置在 this.durationTime 时间内运动到目标位置。

**FLIP 动画的核心**是：虽然 DOM 结构的变化（如元素插入到列表末尾）是即时完成的，但通过在不同渲染帧中处理视觉效果（先用 transform 保持视觉位置，再移除 transform 产生动画），让浏览器能渲染出元素从原位置到新位置的平滑过渡效果，这就是 FLIP (First-Last-Invert-Play) 技术。

**注意点**：在进行 FLIP 动画时，要对非拖拽元素（即正在执行 FLIP 动画的元素）设置 pointer-events: none（即不能响应事件）。这样可以防止在拖拽过程中，其他运动中的元素在正在拖拽元素下方移动，从而触发 dragenter、dragover 等拖拽事件。这种触发可能导致动画效果的重新播放，从而引发卡顿现象。通过禁用这些元素的事件响应，可以提升拖拽动画的流畅性。

## 💻 完整自定义指令代码：

```
import { Flip } from '@/util/flip'
import { isEqual } from 'radash'

const DRAGGING_CLASS = 'dragging'

/**
 * 全局事件处理系统
 *
 * 由于全局事件监听器（window上的事件）会影响整个页面，
 * 当页面上有多个拖拽列表时，需要协调它们对全局事件的使用。
 *
 * 这个系统使用引用计数方式，跟踪有多少个活动的拖拽列表，
 * 只有当所有列表都不需要拖拽功能时，才会移除全局事件监听器。
 */
const globalDragEvents = {
  count: 0,
  preventDefault(e) {
    e.preventDefault()
  },
  add() {
    if (this.count === 0) {
      window.addEventListener('dragenter', this.preventDefault, false)
      window.addEventListener('dragover', this.preventDefault, false)
      window.addEventListener('dragend', this.preventDefault, false)
    }
    this.count++
  },
  remove() {
    this.count--
    if (this.count === 0) {
      window.removeEventListener('dragenter', this.preventDefault)
      window.removeEventListener('dragover', this.preventDefault)
      window.removeEventListener('dragend', this.preventDefault)
    }
  }
}

export const vDragList = {
  /**
   * 在组件挂载时调用，初始化拖拽列表
   *
   * @param el 挂载的DOM元素
   * @param binding Vue指令的绑定值
   */
  mounted(el, binding) {
    const { list, canDrag = true } = binding.value

    if (canDrag) {
      setChildrenDraggable(el, true)
      initDragList(el, list)
    }
  },

  /**
   * 当数据更新时触发的回调函数
   *
   * @param el DOM 元素
   * @param binding Vue 指令绑定对象
   */
  async updated(el, binding) {
    // 拖拽过程中，不执行更新逻辑，否则快速连续拖拽会导致元素消失。
    // 现象本质：第一次拖拽结束后，数据还没更新，用户又开始了第二次拖拽。
    // 第二次拖拽开始之后，这时自定义指令的 updated 才被触发，卸载了旧事件并重新初始化，currentDragNode 被重置为 null。
    // 第二次拖拽结束时，触发的是新的事件处理器，但由于没有经过 start事件，currentDragNode 还是 null。
    // 此时去除拖拽样式（如透明度）时找不到正确的元素，没法去除dragging样式，所以表现为元素“被拖没了”。
    // 加 if (el._isDragging) return，可以避免拖拽中重新初始化，保证状态正确。
    if (el._isDragging) return

    // 检查数据是否发生变化
    const { list, canDrag } = binding.value

    // 如果数据有变化
    if (!isEqual(binding.value, binding.oldValue)) {
      // 卸载拖拽列表
      unmountDragList(el)

      if (canDrag) {
        // 启用拖拽
        setChildrenDraggable(el, true)
        initDragList(el, list)
      } else {
        // 禁用拖拽，确保显示禁止图标
        setChildrenDraggable(el, false)
        // 不重新添加全局事件监听器
      }
    }
  },

  /**
   * 卸载组件时调用的方法，用于移除拖拽列表的事件监听器
   *
   * @param el 需要卸载的DOM元素
   */
  unmounted(el) {
    unmountDragList(el)
  }
}

/**
 * 清除当前文档中的文本选择区域
 */
function clearSelection() {
  const selection = window.getSelection && window.getSelection()
  if (selection && selection.removeAllRanges) {
    selection.removeAllRanges()
  }
}

/**
 * 初始化拖拽列表功能
 *
 * @param el 拖拽列表的根元素
 * @param data 列表项的数据
 */
function initDragList(el, data) {
  let currentDragNode = null
  const list = el
  let flip

  function handleDragStart(e) {
    // 清除所有文本选区：
    // 1. 防止拖拽过程中出现文字选区残留，造成视觉干扰
    // 2. 避免在拖拽操作时误触发文本复制/拖动行为
    // 3. 解决浏览器在拖拽元素和文本选区同时存在时的行为冲突
    // (测试案例：当拖拽开始时如果存在文本选区，会导致拖拽图标显示异常)
    clearSelection()
    const target = e.target

    if (!target || !target.classList.contains('app-item')) return

    console.log('handleDragStart', target)

    el.dispatchEvent(
      new CustomEvent('drag-mode-start', {
        detail: { isDragging: true }
      })
    )

    el._isDragging = true

    flip = new Flip(el.children, 0.5, DRAGGING_CLASS)
    setTimeout(() => {
      target.classList.add(DRAGGING_CLASS)
    })

    e.dataTransfer.effectAllowed = 'move'
    currentDragNode = target
  }

  function handleDragEnter(e) {
    preventDefault(e)

    const target = e.target.closest('.app-item')

    if (!target || target === currentDragNode || target === el) {
      return
    }

    const children = Array.from(el.children)
    const sourceIndex = children.indexOf(currentDragNode)
    const targetIndex = children.indexOf(target)

    if (sourceIndex < targetIndex) {
      list.insertBefore(currentDragNode, target.nextElementSibling)
    } else {
      list.insertBefore(currentDragNode, target)
    }
    flip.play()
  }

  function handleDragEnd(e) {
    preventDefault(e)
    currentDragNode.classList.remove(DRAGGING_CLASS)

    const updatedData = Array.from(el.children)
      .filter((child: HTMLDivElement) => !!child && !!child.dataset && !!child.dataset.id)
      .map((child: HTMLDivElement) => {
        return data.find((i) => String(i.id) === String(child.dataset.id))
      })
      .filter((item) => !!item) // 这里明确过滤掉 undefined/null

    el.dispatchEvent(
      new CustomEvent('drag-mode-end', {
        detail: {
          updatedData,
          draggedItemData: updatedData.find((item) => item.id === currentDragNode.dataset.id) || null
        }
      })
    )

    el._isDragging = false
  }

  function preventDefault(e) {
    e.preventDefault()
  }

  // 添加事件监听
  el.addEventListener('dragstart', handleDragStart)
  el.addEventListener('dragenter', handleDragEnter)
  el.addEventListener('dragend', handleDragEnd)
  el.addEventListener('dragover', preventDefault)
  el.addEventListener('drop', preventDefault)

  /**
   * 使用全局事件系统添加全局事件
   *
   * 为什么需要全局事件：
   * 1. 拖拽过程中，鼠标可能会离开拖拽容器，进入页面其他区域
   * 2. 如果只在容器元素上阻止默认事件，当鼠标移到容器外时，
   *    浏览器会恢复默认行为，显示"禁止"图标或中断拖拽
   * 3. 在window上阻止默认事件，确保无论鼠标拖到页面哪里，
   *    拖拽行为都保持一致，不会被浏览器默认行为干扰
   *
   * 这解决了拖拽过程中的常见bug：
   * - 拖拽时鼠标离开容器导致拖拽中断
   * - 拖拽过程中出现"禁止"图标
   * - 拖拽过程中页面闪烁
   */
  globalDragEvents.add()

  // 保存事件处理函数引用以便卸载时移除
  el._dragListHandlers = {
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    preventDefault
  }
}

/**
 * 移除拖拽列表的事件监听器
 *
 * @param el HTML元素，表示拖拽列表的容器
 */
function unmountDragList(el) {
  if (!el._dragListHandlers) return // 没有事件处理器就直接返回

  const { handleDragStart, handleDragEnter, handleDragEnd, preventDefault } = el._dragListHandlers

  // 移除元素事件
  el.removeEventListener('dragstart', handleDragStart)
  el.removeEventListener('dragenter', handleDragEnter)
  el.removeEventListener('dragend', handleDragEnd)
  el.removeEventListener('dragover', preventDefault)
  el.removeEventListener('drop', preventDefault)

  // 使用全局事件系统移除全局事件
  globalDragEvents.remove()

  // 移除 draggable 属性
  setChildrenDraggable(el, false)
  el._isDragging = false

  delete el._dragListHandlers
}

/**
 * 设置元素的子元素是否可以拖动
 *
 * @param el 要设置子元素拖动属性的父元素
 * @param value 子元素是否可以拖动，true 表示可以拖动，false 表示不可以拖动
 */
function setChildrenDraggable(el, value) {
  if (!el || !el.children) return
  Array.from(el.children).forEach((child: HTMLDivElement) => {
    // 只对有 data-id 的元素设置 draggable
    if (child.hasAttribute('data-id')) {
      if (value) {
        child.setAttribute('draggable', 'true')
      } else {
        child.removeAttribute('draggable')
      }
    }
  })
}

// 全局注册
export function registerDragList(app) {
  app.directive('drag-list', vDragList)
}
```

### 🎬 flip 文件：

```
export const Flip = (function () {
  // 正在拖拽的元素类名
  let DRAGGING_CLASS: string = 'dragging'

  class FlipDom {
    private dom: HTMLElement // 要执行 FLIP 动画的 DOM 元素
    private durationTime: string // 动画持续时间
    private firstPosition: { x: number; y: number } // 元素的初始位置
    private lastPosition: { x: number; y: number } // 元素的最终位置
    private isPlaying: boolean // 标记动画是否正在播放

    /**
     * 构造函数
     *
     * @param dom 需要操作的 DOM 元素
     * @param duration 动画持续时间，可以是数字（秒）或字符串（例如 '1s'、'0.5s'），默认为 0.5 秒
     */
    constructor(dom: HTMLElement, duration: number | string = 0.5) {
      this.dom = dom
      this.durationTime = typeof duration === 'number' ? `${duration}s` : duration
      this.firstPosition = this.getDomPosition()
      this.lastPosition = { x: 0, y: 0 }
      this.isPlaying = false
    }

    /**
     * 获取DOM元素的位置
     *
     * @returns 包含x和y坐标的对象
     */
    private getDomPosition(): { x: number; y: number } {
      const rect = this.dom.getBoundingClientRect()
      return { x: rect.left, y: rect.top }
    }

    /**
     * 记录当前dom初始位置
     *
     */
    public recordFirst(): void {
      const firstPosition = this.getDomPosition()
      this.firstPosition.x = firstPosition.x
      this.firstPosition.y = firstPosition.y
    }

    /**
     * 记录DOM最后的位置
     */
    public recordLast(): void {
      const lastPosition = this.getDomPosition()
      this.lastPosition.x = lastPosition.x
      this.lastPosition.y = lastPosition.y
    }

    /**
     * 反转元素位置
     *
     * @returns 是否成功反转
     */
    private invert(): boolean {
      const deltaX = this.firstPosition.x! - this.lastPosition.x!
      const deltaY = this.firstPosition.y! - this.lastPosition.y!

      if (deltaX === 0 && deltaY === 0) {
        return false
      }
      this.dom.style.transition = 'none'
      this.dom.style.transform = `translate(${deltaX}px, ${deltaY}px)`
      // 对于非拖拽元素(即正在进行FLIP动画的元素)设置 pointer-events: none
      // 这样可以防止在拖拽过程中,其他正在运动的元素触发 dragenter/dragover 等拖拽相关事件
      if (!this.dom.classList.contains(DRAGGING_CLASS)) {
        this.dom.style.pointerEvents = 'none'
      }
      return true
    }

    /**
     * 播放当前dom的动画
     *
     * @returns 返回一个Promise对象，当动画播放完毕后resolve
     */
    public play(): Promise<void> {
      return new Promise((resolve) => {
        if (this.isPlaying) {
          resolve()
          return
        }

        this.isPlaying = true

        this.recordLast()
        const isInverted: boolean = this.invert()

        if (isInverted === false) {
          this.reset()
          resolve()
          return
        }

        /**
         invert 函数将元素从目标位置移动回其原始位置。
         使用 raf 函数确保在下一帧中取消 transform 位移。
         如果在同一帧中处理，浏览器会立即应用最终状态，
         导致元素跳到结束位置，而没有预期的动画效果。
         */
        raf(() => {
          this.dom.style.transition = `transform ${this.durationTime}`
          this.dom.style.transform = 'none'

          const onComplete = () => {
            this.reset()
            this.recordFirst()
            resolve()
          }
          /*
           'transitionend' 事件是在过渡动画完成后触发的。
           事件监听器是在当前帧注册的,而过渡动画是在下一帧执行的。
           所以我们可以监听 'transitionend' 事件,来检测过渡动画何时完成
          */
          this.dom.addEventListener('transitionend', onComplete, { once: true })
        })
      })
    }

    /**
     * 重置
     *
     * 将 DOM 元素的 pointerEvents、transition 和 transform 样式属性重置为空字符串，
     * 并将 isPlaying 属性设置为 false，表示当前dom的动画已停止播放。
     */
    reset() {
      this.dom.style.pointerEvents = ''
      this.dom.style.transition = ''
      this.dom.style.transform = ''
      this.isPlaying = false
    }
  }

  class Flip {
    private flipDoms: Set<FlipDom>
    public isAnimating: boolean

    /**
     * 构造函数
     *
     * @param doms DOM元素数组
     * @param duration 动画持续时间，可以为数字或字符串（如"0.5s"），默认为0.5秒
     * @param draggingClass 可选参数，拖动时的CSS类名
     */
    constructor(doms: HTMLElement[], duration: number | string = 0.5, draggingClass?: string) {
      this.flipDoms = new Set([...doms].map((it) => new FlipDom(it, duration)))
      if (draggingClass) {
        DRAGGING_CLASS = draggingClass
      }
      this.isAnimating = false
    }

    /**
     * 播放动画。
     *
     * @returns 无返回值，返回一个 Promise 对象，该对象在动画播放完成时解析。
     */
    public async play(): Promise<void> {
      this.isAnimating = true
      // 同时播放所有dom的动画，就会形成一个元素结构的动画播放效果，即flip动画
      const promises = [...this.flipDoms].map((flipDom) => flipDom.play())
      await Promise.all(promises)
      this.isAnimating = false
    }
  }

  return Flip
})()

/**
 * 使用 requestAnimationFrame 方法在下一帧执行回调函数
 *
 * @param callBack 要执行的回调函数
 */
function raf(callBack: () => void): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(callBack)
  })
}
```

## 🎉 总结

这个自定义拖拽指令就像一个贴心的小助手：

- 📦 **轻量级**：几百行代码搞定
- 🎨 **可定制**：想要什么动画效果，随你折腾
- 🚀 **高性能**：事件委托 + FLIP 动画，丝滑如德芙
- 🛡️ **稳定性**：各种边界情况都考虑到了，不会"掉链子"
