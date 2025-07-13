# 访问者模式

## 什么是访问者模式 ?

访问者模式 是一种将算法与对象结构分离的设计模式，通俗点讲就是：访问者模式让我们能够在不改变一个对象结构的前提下能够给该对象增加新的逻辑，新增的逻辑保存在一个独立的访问者对象中。访问者模式常用于拓展一些第三方的库和工具。

## 示例代码

```js
// 访问者
class Visitor {
  constructor() {}
  visitConcreteElement(ConcreteElement) {
    ConcreteElement.operation();
  }
}
// 元素类
class ConcreteElement {
  constructor() {}
  operation() {
    console.log('ConcreteElement.operation invoked');
  }
  accept(visitor) {
    visitor.visitConcreteElement(this);
  }
}
// client
let visitor = new Visitor();
let element = new ConcreteElement();
element.accept(visitor);
```

### 访问者模式的实现有以下几个要素：

- Visitor Object：访问者对象，拥有一个 visit()方法
- Receiving Object：接收对象，拥有一个 accept() 方法
- visit(receivingObj)：用于 Visitor 接收一个 Receiving Object
- accept(visitor)：用于 Receving Object 接收一个 Visitor，并通过调用 Visitor 的 visit() 为其提供获取 Receiving Object 数据的能力

### 简单的代码实现如下：

#### Receiving Object

```js
function Employee(name, salary) {
  this.name = name;
  this.salary = salary;
}

Employee.prototype = {
  getSalary: function () {
    return this.salary;
  },
  setSalary: function (salary) {
    this.salary = salary;
  },
  accept: function (visitor) {
    visitor.visit(this);
  },
};
```

#### Visitor Object

```js
function Visitor() {}

Visitor.prototype = {
  visit: function (employee) {
    console.log(`员工姓名: ${employee.name}, 薪水: ${employee.getSalary()}`);
  },
};
```

#### 验证

```js
const employee = new Employee('bruce', 1000);
const visitor = new Visitor();
employee.accept(visitor); // 员工姓名: bruce, 薪水: 1000
```

## 场景

- 对象结构中对象对应的类很少改变，但经常需要在此对象结构上定义新的操作
- 需要对一个对象结构中的对象进行很多不同的并且不相关的操作，而需要避免让这些操作"污染"这些对象的类，也不希望在增加新操作时修改这些类。

## 优缺点

### 优点

- 符合单一职责原则
- 优秀的扩展性
- 灵活性

### 缺点

- 具体元素对访问者公布细节，违反了迪米特原则（迪米特原则（最少知识原则）要求一个对象应该对其他对象有最少的了解。）如上例子，访问者需要了解员工的太多内部细节，这违反了迪米特原则。理想情况下，访问者应该只知道必要的接口。
- 违反了依赖倒置原则，依赖了具体类（如上例子中的 Visitor 类直接依赖于 Employee 类的具体实现），没有依赖抽象。
- 具体元素变更比较困难 (当需要添加新的元素类型时，所有现有的访问者都需要更新：)

## 总结

访问者模式是一种强大的设计模式，适用于需要在不修改对象结构的情况下扩展功能的场景。然而，它也带来了对对象内部实现的依赖，可能导致维护上的困难。因此，在使用时需要权衡其优缺点。
