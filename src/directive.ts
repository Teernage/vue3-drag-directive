import { Flip } from '@/util/flip';
import { isEqual } from 'radash';

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

    const { list, canDrag = true, dragItemClass = 'app-item' } = binding.value;

    if (canDrag) {
      setChildrenDraggable(el, true);
      initDragList(el, list, dragItemClass);
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
    if (el._isDragging) return;

    // 检查数据是否发生变化
    const { list, canDrag, dragItemClass = 'app-item' } = binding.value;

    // 如果数据有变化
    if (!isEqual(binding.value, binding.oldValue)) {
      // 卸载拖拽列表
      unmountDragList(el);

      if (canDrag) {
        // 启用拖拽
        setChildrenDraggable(el, true);
        initDragList(el, list, dragItemClass);
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
 */
function initDragList(el, data, dragItemClass) {
  let currentDragNode = null;
  const list = el;
  let flip;

  function handleDragStart(e) {
    // 清除所有文本选区：
    // 1. 防止拖拽过程中出现文字选区残留，造成视觉干扰
    // 2. 避免在拖拽操作时误触发文本复制/拖动行为
    // 3. 解决浏览器在拖拽元素和文本选区同时存在时的行为冲突
    // (测试案例：当拖拽开始时如果存在文本选区，会导致拖拽图标显示异常)
    clearSelection();
    const target = e.target;

    if (!target || !target.classList.contains(dragItemClass)) return;

    el.dispatchEvent(
      new CustomEvent('drag-mode-start', {
        detail: { isDragging: true },
      })
    );

    el._isDragging = true;

    flip = new Flip(el.children, 0.5, DRAGGING_CLASS);
    setTimeout(() => {
      target.classList.add(DRAGGING_CLASS);
    });

    e.dataTransfer.effectAllowed = 'move';
    currentDragNode = target;
  }

  function handleDragEnter(e) {
    preventDefault(e);

    const target = e.target.closest(`.${dragItemClass}`);

    if (!target || target === currentDragNode || target === el) {
      return;
    }

    const children = Array.from(el.children);
    const sourceIndex = children.indexOf(currentDragNode);
    const targetIndex = children.indexOf(target);

    if (sourceIndex < targetIndex) {
      list.insertBefore(currentDragNode, target.nextElementSibling);
    } else {
      list.insertBefore(currentDragNode, target);
    }
    flip.play();
  }

  function handleDragEnd(e) {
    preventDefault(e);
    currentDragNode.classList.remove(DRAGGING_CLASS);

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
              (item) => item.id === currentDragNode.dataset.id
            ) || null,
        },
      })
    );

    el._isDragging = false;
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
  globalDragEvents.add();

  // 保存事件处理函数引用以便卸载时移除
  el._dragListHandlers = {
    handleDragStart,
    handleDragEnter,
    handleDragEnd,
    preventDefault,
  };
}

/**
 * 移除拖拽列表的事件监听器
 *
 * @param el HTML元素，表示拖拽列表的容器
 */
function unmountDragList(el) {
  if (!el._dragListHandlers) return; // 没有事件处理器就直接返回

  const { handleDragStart, handleDragEnter, handleDragEnd, preventDefault } =
    el._dragListHandlers;

  // 移除元素事件
  el.removeEventListener('dragstart', handleDragStart);
  el.removeEventListener('dragenter', handleDragEnter);
  el.removeEventListener('dragend', handleDragEnd);
  el.removeEventListener('dragover', preventDefault);
  el.removeEventListener('drop', preventDefault);

  // 使用全局事件系统移除全局事件
  globalDragEvents.remove();

  // 移除 draggable 属性
  setChildrenDraggable(el, false);
  el._isDragging = false;

  delete el._dragListHandlers;
}

/**
 * 设置元素的子元素是否可以拖动
 *
 * @param el 要设置子元素拖动属性的父元素
 * @param value 子元素是否可以拖动，true 表示可以拖动，false 表示不可以拖动
 */
function setChildrenDraggable(el, value) {
  if (!el || !el.children) return;
  Array.from(el.children).forEach((child: HTMLDivElement) => {
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
  // 内嵌的CSS样式 - 使用你提供的样式
  const DRAGGING_STYLES = `
  .${DRAGGING_CLASS} {
    opacity: 0;
    background-color: transparent;
  }
  .${DRAGGING_CLASS} * {
    opacity: 0 !important;
    visibility: hidden !important;
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
