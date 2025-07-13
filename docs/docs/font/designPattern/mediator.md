# 中介者模式

## 什么是中介者模式 ?

- 在中介者模式中，中介者（Mediator）包装了一系列对象相互作用的方式，使得这些对象不必直接相互作用，而是由中介者协调它们之间的交互，从而使它们可以松散偶合。当某些对象之间的作用发生改变时，不会立即影响其他的一些对象之间的作用，保证这些作用可以彼此独立的变化。
- 中介者模式和观察者模式有一定的相似性，都是一对多的关系，也都是集中式通信，不同的是中介者模式是处理同级对象之间的交互，而观察者模式是处理 Observer 和 Subject 之间的交互。中介者模式有些像婚恋中介，相亲对象刚开始并不能直接交流，而是要通过中介去筛选匹配再决定谁和谁见面。

## 场景

### 购物车需求选择

例如购物车需求，存在商品选择表单、颜色选择表单、购买数量表单等等，都会触发 change 事件，那么可以通过中介者来转发处理这些事件，实现各个事件间的解耦，仅仅维护中介者对象即可。

```js
var goods = {
  //手机库存
  'red|32G': 3,
  'red|64G': 1,
  'blue|32G': 7,
  'blue|32G': 6,
};
//中介者
var mediator = (function () {
  var colorSelect = document.getElementById('colorSelect');
  var memorySelect = document.getElementById('memorySelect');
  var numSelect = document.getElementById('numSelect');
  return {
    changed: function (obj) {
      switch (obj) {
        case colorSelect:
          //TODO
          break;
        case memorySelect:
          //TODO
          break;
        case numSelect:
          //TODO
          break;
      }
    },
  };
})();
colorSelect.onchange = function () {
  mediator.changed(this);
};
memorySelect.onchange = function () {
  mediator.changed(this);
};
numSelect.onchange = function () {
  mediator.changed(this);
};
```

### 聊天室里

#### 聊天室成员类：

```js
function Member(name) {
  this.name = name;
  this.chatroom = null;
}

Member.prototype = {
  // 发送消息
  send: function (message, toMember) {
    this.chatroom.send(message, this, toMember);
  },
  // 接收消息
  receive: function (message, fromMember) {
    console.log(`${fromMember.name} to ${this.name}: ${message}`);
  },
};
```

#### 聊天室类：

```js
function Chatroom() {
  this.members = {};
}

Chatroom.prototype = {
  // 增加成员
  addMember: function (member) {
    this.members[member.name] = member;
    member.chatroom = this;
  },
  // 发送消息
  send: function (message, fromMember, toMember) {
    toMember.receive(message, fromMember);
  },
};
```

#### 测试一下：

```js
const chatroom = new Chatroom();
const bruce = new Member('bruce');
const frank = new Member('frank');

chatroom.addMember(bruce);
chatroom.addMember(frank);

bruce.send('Hey frank', frank);

//输出：bruce to frank: hello frank
```

## 优缺点

### 优点

- 使各对象之间耦合松散，而且可以独立地改变它们之间的交互
- 中介者和对象一对多的关系取代了对象之间的网状多对多的关系
- 如果对象之间的复杂耦合度导致维护很困难，而且耦合度随项目变化增速很快，就需要中介者重构代码

### 缺点

系统中会新增一个中介者对象，因为对象之间交互的复杂性，转移成了中介者对象的复杂性，使得中介者对象经常是巨大的。中介者对象自身往往就是一个难以维护的对象。

## 中介者模式与发布订阅模式的区别

### 交互方式

- 中介者模式：对象之间通过中介者进行直接的交互，所有的交互逻辑集中在中介者中。
- 发布订阅模式：发布者与订阅者之间是松散耦合的，发布者并不知道谁在订阅其消息，通知是通过事件机制实现的。

### 适用场景

- 中介者模式：适合处理复杂的对象交互，尤其是多个对象之间的相互作用需要协调的场景。
- 发布订阅模式：适合简单的事件通知场景，通常用于一对多或多对一的消息传递。

### 耦合程度

- 中介者模式：对象之间的交互通过中介者进行，降低了对象之间的直接依赖。
- 发布订阅模式：发布者与订阅者之间没有直接依赖关系，订阅者可以自由添加或移除。

## 总结

中介者模式通过引入中介者对象来管理对象之间的交互，降低了耦合度，增强了系统的灵活性和可维护性。然而，设计时需要注意中介者的复杂性，确保其不会成为系统的负担。
