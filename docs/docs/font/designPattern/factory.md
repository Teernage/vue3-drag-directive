# 工厂模式应用 ---> 模态框

## 目录

1. [项目概述](#项目概述)
2. [实现原理](#实现原理)
3. [代码结构](#代码结构)
4. [核心实现](#核心实现)
5. [使用示例](#使用示例)

## 项目概述

### 功能描述

实现了一个基于工厂模式的模态框系统，支持三种不同状态（成功、警告、错误）的模态框创建和展示，当用户通过点击不同状态的按钮时，可以切换到不同的模态框状态。

### 特点

- 使用工厂模式统一管理模态框的创建
- 支持三种状态切换
- 可扩展的模态框类型
- 统一的样式管理
- 继承式的功能扩展

## 实现原理

基于工厂模式的模态框系统设计，整体采用了分层继承的结构。其中 Modal 作为基类定义了模态框的基本属性（status）和公共方法（className 获取、状态检查、信息输出），三个子类 SuccessModal、WarningModal 和 ErrorModal 分别继承自 Modal 基类并实现了各自特定的标题处理和信息输出功能。而 ModalFactory 工厂类则作为统一的对象创建管理者，通过 create 方法根据传入的标题和状态参数，实例化相应类型的模态框对象，并负责处理 DOM 操作，实现了对象创建和使用的解耦，使得整个系统更易于维护和扩展。

### 类图结构

<img src="/img/designPattern/工厂模式应用类图.webp" width='600px' alt="工厂模式应用类图"  />

### 核心思想

1. **基类抽象**：使用 `Modal` 基类定义公共接口和属性
2. **工厂封装**：通过 `ModalFactory` 统一管理模态框实例的创建
3. **状态管理**：使用类名动态控制模态框样式
4. **继承扩展**：不同类型的模态框通过继承实现个性化功能

## 代码结构

### 核心类

1. **Modal（基类）**

   - 定义公共接口和属性
   - 提供状态检查方法
   - 实现基础的信息输出

2. **具体 Modal 类**

   - SuccessModal：成功状态
   - WarningModal：警告状态
   - ErrorModal：错误状态

3. **ModalFactory**
   - 负责创建具体的 Modal 实例
   - 管理 DOM 操作
   - 处理状态切换

## 核心实现

### Modal 基类

```javascript
class Modal {
  constructor(status) {
    this.status = status;
  }
  get className() {
    let classStr = 'modal';
    switch (this.status) {
      case ModalTypes.SUCCESS:
        classStr += ' ' + ModalClassName.SUCCESS;
        break;
      case ModalTypes.WARNING:
        classStr += ' ' + ModalClassName.WARNING;
        break;
      case ModalTypes.ERROR:
        classStr += ' ' + ModalClassName.ERROR;
        break;
      default:
        break;
    }
    return classStr;
  }

  /**
   * 检查给定的状态值是否存在于指定的类型中。
   *
   * @param types 类型对象，其值为字符串数组或单个字符串。
   * @param status 需要检查的状态值。
   * @returns 如果状态值存在于类型中，则返回 true；否则返回 false。
   */
  static checkStatusIsExist(types, status) {
    for (let key in types) {
      if (types[key] === status) {
        return true;
      }
    }
    return false;
  }

  /**
   * 输出信息到控制台
   *
   * @param {string} info 信息内容
   */
  static outputInfo(info) {
    console.log(info);
  }
}
```

### 具体 Modal 类

```js
// 成功模态框
class SuccessModal extends Modal {
  constructor(title) {
    super(ModalTypes.SUCCESS);
    this.title = '成功: ' + title;
  }
}

// 警告模态框
class WarningModal extends Modal {
  constructor(title) {
    super(ModalTypes.WARNING);
    this.title = '警告: ' + title;
  }

  outputInfo(info) {
    Modal.outputInfo('告警提示 ' + info);
  }
}

// 错误模态框
class ErrorModal extends Modal {
  constructor(title) {
    super(ModalTypes.ERROR);
    this.title = '错误: ' + title;
  }
  outputInfo(info) {
    Modal.outputInfo('错误提示 ' + info);
  }
}
```

### 工厂类实现

```javascript
class ModalFactory {
  constructor(dom) {
    this.dom = dom;
  }

  /**
   * 创建一个模态框
   *
   * @param {string} title 模态框的标题
   * @param {ModalTypes} status 模态框的状态，可以是 ModalTypes.SUCCESS, ModalTypes.WARNING, ModalTypes.ERROR
   */
  create(title, status) {
    const statusIsExit = Modal.checkStatusIsExist(ModalTypes, status);
    if (!statusIsExit) {
      throw new Error('modal types is not exist');
    }

    const dom = this.dom;
    let modal = null;
    switch (status) {
      case ModalTypes.SUCCESS:
        modal = new SuccessModal(title);
        break;
      case ModalTypes.WARNING:
        modal = new WarningModal(title);
        break;
      case ModalTypes.ERROR:
        modal = new ErrorModal(title);
        break;
      default:
        break;
    }
    dom.getElementsByTagName('header')[0].innerText = modal.title;
    dom.className = modal.className;

    return modal;
  }
}
```

## 使用示例

### HTML 结构

```html
<div class="wrapper">
  <div class="modal error">
    <header>Modal</header>
  </div>
  <div class="btn-group">
    <button data-status="S">成功模态框</button>
    <button data-status="W">警告模态框</button>
    <button data-status="E">失败模态框</button>
  </div>
</div>
```

### 初始化和使用

```javascript
const oModal = document.getElementsByClassName('modal')[0];
const oBtnGroup = document.getElementsByClassName('btn-group')[0];

const modalFactory = new ModalFactory(oModal);

console.log(modalFactory);

/**
 * 为按钮组绑定点击事件处理函数
 *
 * 为页面中的按钮组元素绑定点击事件处理函数 handleBtnClick。
 * 当按钮组中的任意按钮被点击时，将触发 handleBtnClick 函数。
 */
function bindEvent() {
  oBtnGroup.addEventListener('click', handleBtnClick, false);
}

/**
 * 处理按钮点击事件
 *
 * @param {MouseEvent} e 事件对象
 */
function handleBtnClick(e) {
  console.log(e.target);
  const target = e.target;
  const tagName = target.tagName.toLowerCase();

  if (tagName === 'button') {
    const status = target.dataset.status; // 获取按钮状态

    const modal = modalFactory.create('这是一个工厂模式的应用场景', status);

    if (status == ModalTypes.WARNING) {
      modal.outputInfo('告警提示信息');
    }
  }
}
```
