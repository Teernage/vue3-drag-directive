import { Flip } from './util/flip';
import { isEqual } from './util';

const DRAGGING_CLASS = 'vue-drag-list-directive__dragging';

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
    e.preventDefault();
  },
  add() {
    if (this.count === 0) {
      window.addEventListener('dragenter', this.preventDefault, false);
      window.addEventListener('dragover', this.preventDefault, false);
      window.addEventListener('dragend', this.preventDefault, false);
    }
    this.count++;
  },
  remove() {
    this.count--;
    if (this.count === 0) {
      window.removeEventListener('dragenter', this.preventDefault);
      window.removeEventListener('dragover', this.preventDefault);
      window.removeEventListener('dragend', this.preventDefault);
    }
  },
};

// 全局变量 跟踪当前正在拖拽的列表ID
let currentDraggingListId = null;

export const vDragList = {
  /**
   * 在组件挂载时调用，初始化拖拽列表
   *
   * @param el 挂载的DOM元素
   * @param binding Vue指令的绑定值
   */
  mounted(el, binding) {
    // 注入CSS样式
    injectStyles();

    const {
      list,
      canDrag = true,
      dragItemClass = 'app-item',
      dragHandleClass,
    } = binding.value;

    if (canDrag) {
      setChildrenDraggable(el, true);
      clearDraggingClass(el);
      initDragList(el, list, dragItemClass, dragHandleClass);
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
    // 此时去除拖拽样式（如透明度）时找不到正确的元素，没法去除dragging样式，所以表现为元素"被拖没了"。
    // 加 if (el._isDragging) return，可以避免拖拽中重新初始化，保证状态正确。
    if (el._isDragging) return;
    clearDraggingClass(el);

    // 检查数据是否发生变化
    const {
      list,
      canDrag,
      dragItemClass = 'app-item',
      dragHandleClass,
    } = binding.value;

    // 如果数据有变化
    if (!isEqual(binding.value, binding.oldValue)) {
      // 卸载拖拽列表
      unmountDragList(el);

      if (canDrag) {
        // 启用拖拽
        setChildrenDraggable(el, true);
        initDragList(el, list, dragItemClass, dragHandleClass);
      } else {
        // 禁用拖拽，确保显示禁止图标
        setChildrenDraggable(el, false);
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
    unmountDragList(el);
  },
};

/**
 * 清除当前文档中的文本选择区域
 */
function clearSelection() {
  const selection = window.getSelection && window.getSelection();
  if (selection && selection.removeAllRanges) {
    selection.removeAllRanges();
  }
}

/**
 * 初始化拖拽列表功能
 *
 * @param el 拖拽列表的根元素
 * @param data 列表项的数据
 * @param dragItemClass 可拖拽项的类名
 */
function initDragList(el, data, dragItemClass, dragHandleClass) {
  el.currentDragNode = null;
  const list = el;
  list._isDragAllowed = false;

  let flip;
  // 生成一个唯一的ID，用于标识这个拖拽列表
  const listId = `drag-list-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  // 设置拖拽列表的唯一ID
  el.dataset.dragListId = listId;

  function handleDragStart(e) {
    const target = e.target;

    if (!isCurrentListEvent(e, listId)) {
      return;
    }

    if (shouldPreventDragStart(el._isDragAllowed, dragHandleClass)) {
      e.preventDefault();
      return;
    }

    // 清除所有文本选区
    // 1. 防止拖拽过程中出现文字选区残留，造成视觉干扰
    // 2. 避免在拖拽操作时误触发文本复制/拖动行为
    // 3. 解决浏览器在拖拽元素和文本选区同时存在时的行为冲突
    // (测试案例：当拖拽开始时如果存在文本选区，会导致拖拽图标显示异常)
    clearSelection();

    el.dispatchEvent(
      new CustomEvent('drag-mode-start', {
        detail: { isDragging: true },
      })
    );

    // 设置当前正在拖拽的列表ID
    currentDraggingListId = listId;
    el._isDragging = true;

    flip = new Flip(el.children, 0.5, DRAGGING_CLASS);

    // 获取拖拽项
    const dragItem = target.closest(`.${dragItemClass}`);
    setTimeout(() => {
      // 当我们对一个元素快速完成多次拖拽时，会出现最后一次拖完之后，拖拽元素消失不见了的现象，这是快速连续拖拽导致的时序问题：当最后一次拖拽已结束(dragEnd已执行)，但其dragStart中的定时器延时回调仍在宏队列中时，执行回调的时候若不检查状态，会错误应用拖拽样式DRAGGING_CLASS导致元素视觉上"消失"，所以要应用拖拽样式前要判断当前拖拽流程是否还在进行
      if (el._isDragging) {
        dragItem.classList.add(DRAGGING_CLASS);
      }
    });

    e.dataTransfer.effectAllowed = 'move';
    el.currentDragNode = dragItem;
  }

  function handleDragEnter(e) {
    preventDefault(e);

    // 如果有拖拽正在进行，并且不是当前列表，则忽略
    if (isNotCurrentListDragging(listId)) {
      return;
    }

    const target = e.target.closest(`.${dragItemClass}`);

    if (!target || target === el.currentDragNode || target === el) {
      return;
    }

    const children = Array.from(el.children);
    const sourceIndex = children.indexOf(el.currentDragNode);
    const targetIndex = children.indexOf(target);

    if (sourceIndex < targetIndex) {
      list.insertBefore(el.currentDragNode, target.nextElementSibling);
    } else {
      list.insertBefore(el.currentDragNode, target);
    }
    flip.play();
  }

  function handleDragEnd(e) {
    preventDefault(e);

    if (el.currentDragNode) {
      el.currentDragNode.classList.remove(DRAGGING_CLASS);

      const updatedData = Array.from(el.children)
        .filter(
          (child: HTMLDivElement) =>
            !!child && !!child.dataset && !!child.dataset.id
        )
        .map((child: HTMLDivElement) => {
          return data.find((i) => String(i.id) === String(child.dataset.id));
        })
        .filter((item) => !!item); // 这里明确过滤掉 undefined/null

      el.dispatchEvent(
        new CustomEvent('drag-mode-end', {
          detail: {
            updatedData,
            draggedItemData:
              updatedData.find(
                (item) => item.id === el.currentDragNode.dataset.id
              ) || null,
          },
        })
      );
    }

    el._isDragging = false;
    el._actualClickTarget = null;
    el._isDragAllowed = false;
  }

  /**
   * 处理鼠标按下事件
   *
   * @param e 鼠标事件对象
   */
  function handleMouseDown(e) {
    if (!isCurrentListEvent(e, listId)) {
      return;
    }

    // 记录实际点击的元素
    el._actualClickTarget = e.target;

    // 判断是否配置了拖拽手柄模式
    if (
      isDragHandleMode(dragHandleClass) &&
      !isInvalidDragTarget(e.target, el, dragItemClass)
    ) {
      const isHandle = isDragHandle(e.target, dragHandleClass);
      console.log(`isHandle: ${isHandle}`);
      el._isDragAllowed = isHandle;
    }
  }

  function preventDefault(e) {
    e.preventDefault();
  }

  // 添加事件监听
  el.addEventListener('dragstart', handleDragStart);
  el.addEventListener('dragenter', handleDragEnter);
  el.addEventListener('dragend', handleDragEnd);
  el.addEventListener('dragover', preventDefault);
  el.addEventListener('drop', preventDefault);
  el.addEventListener('mousedown', handleMouseDown);

  // 使用全局事件系统添加全局事件
  globalDragEvents.add();

  // 保存事件处理函数引用以便卸载时移除
  el._dragListHandlers = {
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    preventDefault,
    handleMouseDown,
  };
}

/**
 * 移除拖拽列表的事件监听器
 *
 * @param el HTML元素，表示拖拽列表的容器
 */
function unmountDragList(el) {
  if (!el._dragListHandlers || el._isDragging) return; // 没有事件处理器就直接返回

  const {
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    preventDefault,
    handleMouseDown,
  } = el._dragListHandlers;

  // 移除元素事件
  if (handleMouseDown) {
    el.removeEventListener('mousedown', handleMouseDown);
  }
  el.removeEventListener('dragstart', handleDragStart);
  el.removeEventListener('dragenter', handleDragEnter);
  el.removeEventListener('dragend', handleDragEnd);
  el.removeEventListener('dragover', preventDefault);
  el.removeEventListener('drop', preventDefault);

  // 使用全局事件系统移除全局事件
  globalDragEvents.remove();

  // 在卸载前清除所有拖拽样式
  clearDraggingClass(el);

  // 移除 draggable 属性
  setChildrenDraggable(el, false);
  el._isDragging = false;

  delete el._dragListHandlers;
  delete el._actualClickTarget;
  delete el._isDragAllowed;
}

function clearDraggingClass(el) {
  if (el.children) {
    Array.from(el.children).forEach((child: HTMLElement) => {
      if (child.classList && child.classList.contains(DRAGGING_CLASS)) {
        child.classList.remove(DRAGGING_CLASS);
      }
    });
  }
}

/**
 * 设置元素的子元素是否可以拖动
 *
 * @param el 要设置子元素拖动属性的父元素
 * @param value 子元素是否可以拖动，true 表示可以拖动，false 表示不可以拖动
 */
function setChildrenDraggable(el, value) {
  if (!el || !el.children) return;

  Array.from(el.children).forEach((child: HTMLElement) => {
    // 只对有 data-id 的元素设置 draggable
    if (child.hasAttribute('data-id')) {
      if (value) {
        child.setAttribute('draggable', 'true');
      } else {
        child.removeAttribute('draggable');
      }
    }
  });
}

/**
 * 注入CSS样式到页面
 */
function injectStyles() {
  // 内嵌的CSS样式
  const DRAGGING_STYLES = `
  /* 被拖拽元素的样式 */
  .${DRAGGING_CLASS} {
    opacity: 0;
    background-color: transparent;
  } 
  `;

  // 检查是否已经注入过样式
  if (document.getElementById('drag-list-styles')) {
    return;
  }

  const styleElement = document.createElement('style');
  styleElement.id = 'drag-list-styles';
  styleElement.textContent = DRAGGING_STYLES;
  document.head.appendChild(styleElement);
}

// 全局注册
export function registerDragList(app) {
  app.directive('drag-list', vDragList);
}

/**
 * 判断给定的元素是否是拖拽句柄
 *
 * @param element 需要判断的元素
 * @param dragHandleClass 拖拽句柄的类名
 * @returns 如果元素是拖拽句柄，则返回 true；否则返回 false
 */
function isDragHandle(element, dragHandleClass) {
  return element.closest(`.${dragHandleClass}`) !== null;
}

/**
 * 判断是否为拖拽手柄模式
 *
 * @param dragHandleClass 拖拽手柄的类名
 * @returns 如果dragHandleClass不为undefined，则返回true，否则返回false
 */
function isDragHandleMode(dragHandleClass) {
  return dragHandleClass !== undefined;
}

function shouldPreventDragStart(isDragAllowed, dragHandleClass) {
  return isDragAllowed === false && isDragHandleMode(dragHandleClass);
}

/**
 * 判断当前事件是否属于指定列表的事件
 *
 * @param e 事件对象
 * @param listId 指定列表的ID
 * @returns 如果当前事件属于指定列表的事件，则返回true；否则返回false
 */
function isCurrentListEvent(e, listId) {
  if (!e.target) return false;

  const eventList = e.target.closest('[data-drag-list-id]');
  if (!eventList) return false;

  return eventList.dataset.dragListId === listId;
}

/**
 * 判断当前拖拽的列表ID是否与传入的列表ID相同。
 *
 * @param listId 要检查的列表ID
 * @returns 如果当前拖拽的列表ID与传入的列表ID不同，则返回true；否则返回false
 */
function isNotCurrentListDragging(listId) {
  return currentDraggingListId && currentDraggingListId !== listId;
}

/**
 * 防止点击子列表空白区域或非拖拽项时，父列表把子列表容器当成拖拽项
 *
 * 阻止条件：
 * 1. 点击容器本身 (e.target === el) - 点击空白区域
 * 2. 未找到拖拽项目 (!dragItem) - 点击不可拖拽的子元素
 *
 * 典型场景：
 * - 嵌套列表：点击子列表空白处时，防止父列表误把子容器当作拖拽项
 * - 混合内容：点击非拖拽元素时，防止触发意外的拖拽行为，点击子列表非拖拽项会冒泡杯外层列表的拖拽事件捕获到
 *
 * 只有明确点击到可拖拽项目时，才允许继续执行拖拽逻辑
 */
function isInvalidDragTarget(target, containerEl, dragItemClass) {
  const dragItem = target && target.closest(`.${dragItemClass}`);
  return target === containerEl || !dragItem;
}
