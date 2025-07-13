# 命令模式

## 什么是命令模式 ?

将请求封装为独立对象，允许通过参数化方法调用不同请求，支持请求的队列化、日志记录、撤销/重做等操作。

核心目标：解耦调用者与执行者。

## 示例代码

```js
// 命令绑定函数：将命令对象绑定到按钮的点击事件
function setCommand(button, command) {
  button.onclick = function () {
    command.execute();
  };
}

// 接收者：实际执行操作的对象
const MenuBar = {
  refresh: function () {
    console.log('刷新');
  },
};

// 刷新命令：封装刷新操作的命令对象
// @param receiver - 接收者对象
function RefreshMenuBarCommand(receiver) {
  return {
    execute: function () {
      receiver.refresh(); // 调用接收者的方法执行实际操作
    },
  };
}

// 另一个接收者：处理子菜单相关操作
const SubMenu = {
  add: function () {
    console.log('添加');
  },
  del: function () {
    console.log('删除');
  },
};

// 添加子菜单命令
// @param receiver - 接收者对象
function AddSubMenuCommand(receiver) {
  return {
    execute: function () {
      receiver.add(); // 调用接收者的添加方法
    },
  };
}

// 删除子菜单命令
// @param receiver - 接收者对象
function DelSubMenuCommand(receiver) {
  return {
    execute: function () {
      receiver.del(); // 调用接收者的删除方法
    },
  };
}

// 创建具体的命令对象
const refreshMenuBarCommand = RefreshMenuBarCommand(MenuBar);
const addSubMenuCommand = AddSubMenuCommand(SubMenu);
const delSubMenuCommand = DelSubMenuCommand(SubMenu);

// 将命令对象绑定到具体的按钮上
setCommand(button1, refreshMenuBarCommand); // 绑定刷新命令
setCommand(button2, addSubMenuCommand); // 绑定添加命令
setCommand(button3, delSubMenuCommand); // 绑定删除命令
```

### 示例代码分析

1. 命令绑定函数：

setCommand 函数将命令对象绑定到按钮的点击事件上，使得按钮点击时可以执行对应的命令。

2. 接收者

MenuBar 和 SubMenu 作为接收者，负责实际的业务逻辑操作，如刷新、添加和删除菜单项。

3. 命令对象

RefreshMenuBarCommand、AddSubMenuCommand 和 DelSubMenuCommand 是具体的命令对象，它们封装了对接收者方法的调用。

4. 命令的创建与绑定

创建具体的命令对象后，通过 setCommand 函数将它们绑定到相应的按钮上，实现了用户界面与业务逻辑的解耦。

## 场景

- 菜单和按钮操作：通过命令模式，点击事件与具体的业务逻辑解耦，便于实现撤销和重做功能。
- 队列请求处理：可以将多个命令存储在队列中，方便管理和执行。
- 宏命令场景：多个命令可以组合成一个宏命令，批量执行相关操作。
- 多人协作开发：命令对象作为接口规范，促进团队间的并行开发，降低沟通成本。

## 优缺点

### 优点

- 解耦调用者和执行者，使得二者独立变化。(多人协作开发时，可以独立修改调用者和执行者而不影响对方)
- 可以将命令对象存储在队列中，实现宏命令（组合多个命令）。
- 支持撤销/重做操作。

### 缺点

- 如果命令过多，会导致系统复杂度增加。
- 命令模式会增加系统的理解难度。

## 总结

命令模式是一种灵活且强大的设计模式，尤其适合用于需要将行为参数化的场景，但使用时需要权衡其带来的复杂度增加是否值得。
