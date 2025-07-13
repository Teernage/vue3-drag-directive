# 装饰器模式

## 什么是装饰器模式？

装饰器模式是一种结构型设计模式，它允许向一个现有的对象添加新的功能，同时又不改变其结构。这种模式创建了一个装饰类，用来包装原有的类，并在保持类方法签名完整性的前提下，提供了额外的功能。

### 生活中的例子

加入你买了一部基础款手机：

- 你可以给它套上保护壳（一个装饰器）- 增加了防摔功能
- 再贴上钢化膜（另一个装饰器）- 增加了防刮功能
- 再加上指环支架（又一个装饰器）- 增加了支撑功能

## 用装饰器模式解决了什么问题？

- 动态扩展功能：需要给某个对象增加功能，但又不想修改它。
- 按需组合功能：可以像“搭积木”一样，把不同功能组合起来。

## 示例代码

### JavaScript 实现

```js
// 定义一个基础咖啡组件
class Coffee {
  getCost() {
    return 5; // 基础咖啡价格：5元
  }

  getDescription() {
    return '普通咖啡';
  }
}

// 装饰器基类 - 所有装饰器的父类
class CoffeeDecorator {
  constructor(coffee) {
    this.coffee = coffee; // 保存被装饰的对象引用
  }

  getCost() {
    return this.coffee.getCost(); // 默认实现是委托给被装饰对象
  }

  getDescription() {
    return this.coffee.getDescription(); // 默认实现是委托给被装饰对象
  }
}

// 具体装饰器：牛奶
class MilkDecorator extends CoffeeDecorator {
  constructor(coffee) {
    super(coffee);
  }

  getCost() {
    return this.coffee.getCost() + 2; // 增加牛奶的价格：2元
  }

  getDescription() {
    return this.coffee.getDescription() + '，加牛奶';
  }
}

// 具体装饰器：糖
class SugarDecorator extends CoffeeDecorator {
  constructor(coffee) {
    super(coffee);
  }

  getCost() {
    return this.coffee.getCost() + 1; // 增加糖的价格：1元
  }

  getDescription() {
    return this.coffee.getDescription() + '，加糖';
  }
}

// 具体装饰器：巧克力
class ChocolateDecorator extends CoffeeDecorator {
  constructor(coffee) {
    super(coffee);
  }

  getCost() {
    return this.coffee.getCost() + 3; // 增加巧克力的价格：3元
  }

  getDescription() {
    return this.coffee.getDescription() + '，加巧克力';
  }
}

// 客户端代码
function clientCode() {
  // 创建一个基础咖啡
  let simpleCoffee = new Coffee();
  console.log(
    `${simpleCoffee.getDescription()} 价格: ${simpleCoffee.getCost()}元`
  );

  // 加牛奶
  let milkCoffee = new MilkDecorator(simpleCoffee);
  console.log(`${milkCoffee.getDescription()} 价格: ${milkCoffee.getCost()}元`);

  // 加牛奶和糖
  let sweetMilkCoffee = new SugarDecorator(milkCoffee);
  console.log(
    `${sweetMilkCoffee.getDescription()} 价格: ${sweetMilkCoffee.getCost()}元`
  );

  // 加牛奶、糖和巧克力
  let ultimateCoffee = new ChocolateDecorator(sweetMilkCoffee);
  console.log(
    `${ultimateCoffee.getDescription()} 价格: ${ultimateCoffee.getCost()}元`
  );

  // 也可以直接创建一个加糖的咖啡
  let sugarCoffee = new SugarDecorator(new Coffee());
  console.log(
    `${sugarCoffee.getDescription()} 价格: ${sugarCoffee.getCost()}元`
  );
}

clientCode();
// 输出:
// 普通咖啡 价格: 5元
// 普通咖啡，加牛奶 价格: 7元
// 普通咖啡，加牛奶，加糖 价格: 8元
// 普通咖啡，加牛奶，加糖，加巧克力 价格: 11元
// 普通咖啡，加糖 价格: 6元
```

### TypeScript 实现

```ts
// 定义咖啡接口
interface ICoffee {
  getCost(): number;
  getDescription(): string;
}

// 具体组件：基础咖啡
class BasicCoffee implements ICoffee {
  public getCost(): number {
    return 5; // 基础咖啡价格：5元
  }

  public getDescription(): string {
    return '普通咖啡';
  }
}

// 装饰器函数：加牛奶
function MilkDecorator<T extends new (...args: any[]) => ICoffee>(Base: T) {
  return class extends Base {
    public getCost(): number {
      return super.getCost() + 2; // 牛奶增加2元
    }

    public getDescription(): string {
      return `${super.getDescription()}，加牛奶`;
    }
  };
}

// 装饰器函数：加糖
function SugarDecorator<T extends new (...args: any[]) => ICoffee>(Base: T) {
  return class extends Base {
    public getCost(): number {
      return super.getCost() + 1; // 糖增加1元
    }

    public getDescription(): string {
      return `${super.getDescription()}，加糖`;
    }
  };
}

// 装饰器函数：加巧克力
function ChocolateDecorator<T extends new (...args: any[]) => ICoffee>(
  Base: T
) {
  return class extends Base {
    public getCost(): number {
      return super.getCost() + 3; // 巧克力增加3元
    }

    public getDescription(): string {
      return `${super.getDescription()}，加巧克力`;
    }
  };
}

// 使用装饰器组合功能
@ChocolateDecorator
@SugarDecorator
@MilkDecorator
class FancyCoffee extends BasicCoffee {}

// 客户端代码
function clientCode() {
  const basicCoffee = new BasicCoffee();
  console.log(
    `${basicCoffee.getDescription()} 价格: ${basicCoffee.getCost()}元`
  );

  const fancyCoffee = new FancyCoffee();
  console.log(
    `${fancyCoffee.getDescription()} 价格: ${fancyCoffee.getCost()}元`
  );
}

clientCode();
// 输出：
// 普通咖啡 价格: 5元
// 普通咖啡，加牛奶，加糖，加巧克力 价格: 11元
```

### 示例代码分析

#### JavaScript 实现分析

1. 基础组件（Coffee）:

- 定义了基础咖啡类，包含 getCost()和 getDescription()两个方法
- 这是我们要装饰的原始对象，提供了默认的行为（普通咖啡，价格 5 元）

2. 装饰器基类（CoffeeDecorator）:

- 装饰器的基础类，持有对被装饰对象的引用
- 实现了与被装饰对象相同的接口，使得装饰器可以取代原始对象
- 默认实现是将所有操作委托给被装饰对象，不添加任何行为

3. 具体装饰器（MilkDecorator, SugarDecorator, ChocolateDecorator）:

- 继承自装饰器基类
- 在原始功能基础上添加新的行为：
  -- MilkDecorator: 增加 2 元成本并在描述中添加"加牛奶"
  -- SugarDecorator: 增加 1 元成本并在描述中添加"加糖"
  -- ChocolateDecorator: 增加 3 元成本并在描述中添加"加巧克力"

4. 客户端代码:

- 首先创建基础咖啡对象
- 然后用不同的装饰器包装这个对象，每次包装都添加新的功能
- 装饰器可以嵌套使用，形成装饰器链，最终结果包含所有装饰器添加的功能
- 注意每个装饰后的对象仍然是一个"咖啡"，遵循接口的一致性

#### TypeScript 实现分析

1. MilkDecorator 执行并返回新类

- 输入：BasicCoffee
- 输出：一个新的类（MilkCoffee），在 BasicCoffee 的功能上增加了牛奶的逻辑。
- MilkDecorator 的执行结果类似于：

```ts
class MilkCoffee extends BasicCoffee {
  public getCost(): number {
    return super.getCost() + 2;
  }

  public getDescription(): string {
    return `${super.getDescription()}，加牛奶`;
  }
}
```

2. SugarDecorator 执行并返回新类

- 输入：MilkCoffee（上一步返回的类）
- 输出：一个新的类（SugarMilkCoffee），在 MilkCoffee 的功能上增加了糖的逻辑。
- SugarDecorator 的执行结果类似于：

```ts
class SugarMilkCoffee extends MilkCoffee {
  public getCost(): number {
    return super.getCost() + 1;
  }

  public getDescription(): string {
    return `${super.getDescription()}，加糖`;
  }
}
```

3. ChocolateDecorator 执行并返回新类

- 输入：SugarMilkCoffee（上一步返回的类）
- 输出：一个新的类（ChocolateSugarMilkCoffee），在 SugarMilkCoffee 的功能上增加了巧克力的逻辑。
- ChocolateDecorator 的执行结果类似于：

```ts
class ChocolateSugarMilkCoffee extends SugarMilkCoffee {
  public getCost(): number {
    return super.getCost() + 3;
  }

  public getDescription(): string {
    return `${super.getDescription()}，加巧克力`;
  }
}
```

最终，FancyCoffee 就是 ChocolateSugarMilkCoffee。

4. 客户端代码的执行过程：

```ts
const fancyCoffee = new FancyCoffee();
console.log(`${fancyCoffee.getDescription()} 价格: ${fancyCoffee.getCost()}元`);
```

FancyCoffee 类调用时，它的行为如下：

1. 调用 getCost：

- 先执行 ChocolateDecorator 的逻辑，增加 3 元。
- 再执行 SugarDecorator 的逻辑，增加 1 元。
- 最后执行 MilkDecorator 的逻辑，增加 2 元。
- 基础咖啡的价格是 5 元，所以总价是：5 + 2 + 1 + 3 = 11 元。

2. 调用 getDescription：

- 最先加上巧克力的描述：普通咖啡，加牛奶，加糖，加巧克力。

输出结果为：

```
普通咖啡，加牛奶，加糖，加巧克力 价格: 11 元
```

#### 装饰器的执行顺序详解

1. 装饰器本身的执行顺序：按照声明顺序，从下到上依次执行。

- MilkDecorator -> SugarDecorator -> ChocolateDecorator

2. 包装后的调用顺序：因为每个装饰器都依赖被装饰类的 super，所以从内到外逐层调用。

- 运行时调用顺序为：MilkDecorator -> SugarDecorator -> ChocolateDecorator（从里到外）。

## 场景

- 图形界面扩展：比如给按钮加阴影、加边框、加颜色。
- 动态功能组合：比如咖啡加配料（牛奶、糖、巧克力等）。
- 日志记录和监控：在不改动原始代码的情况下，额外记录日志或性能数据。
- 权限控制：动态检查用户是否有权限使用某个功能。

## 优缺点

### 优点

1. 不改原代码就能加新功能 - 就像不改变手机就能增加新功能
2. 可任意组合功能 - 想加糖就加糖，想加奶就加奶，随你搭配
3. 每个装饰器专注做一件事 - 奶只负责加奶，糖只负责加糖，职责清晰

### 缺点

- 对象变多了 - 每加一种配料就多一个对象，系统变复杂
- 层层嵌套不好调试 - 当问题发生时，不容易知道是哪一层出了问题
- 代码看起来可能复杂 - 特别是传统实现方式，多层嵌套看着眼花

### 什么时候用？

- 需要动态给对象添加功能时
- 有很多可选功能需要自由组合时
- 不方便用继承来扩展功能时（继承会造成类爆炸）

## 总结

装饰器模式就是一种"开放封闭"的实现：对扩展开放（可以随时添加新装饰器），对修改封闭（不需要改变原有代码）。可以灵活地"装饰"对象，扩展新能力！
