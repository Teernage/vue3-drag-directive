# 策略模式

## 什么是策略模式？

策略模式（Strategy Pattern）是一种定义一系列算法的方法。从概念上看，这些算法完成的功能相同，但实现各不相同。通过将不同算法分别封装到独立的类中，并通过“策略上下文（Context）”根据运行时需求动态地选择合适的“策略类”来实现相同的功能。

举个简单例子：假设我们有一个支付系统，支持多种支付方式（支付宝、微信支付、信用卡支付等）。使用策略模式，我们可以把每种具体支付算法打包在单独的策略类中，统一对外提供支付接口，以便随时切换。

## 策略模式的实现原理

- 策略接口（Strategy Interface）：定义了算法的统一方法或接口。
- 具体策略（Concrete Strategy）：实现策略接口的不同算法类。
- 上下文（Context）：维护对某个策略对象的引用，并在合适的时机调用策略方法。

通过将不同策略独立封装，上下文可以在无需更改原有代码的情况下，灵活地组合和切换策略。

## 核心实现

下面以 TypeScript 代码示例演示策略模式的核心结构：

```typescript
// 策略接口
interface Strategy {
  calculate(price: number): number;
}

// 具体策略A：不打折
class NormalStrategy implements Strategy {
  calculate(price: number): number {
    return price;
  }
}

// 具体策略B：满 100 减 20
class DiscountStrategy implements Strategy {
  calculate(price: number): number {
    return price >= 100 ? price - 20 : price;
  }
}

// 具体策略C：打 8 折
class RebateStrategy implements Strategy {
  calculate(price: number): number {
    return price * 0.8;
  }
}

// 上下文：用于切换和执行策略
class PriceContext {
  private strategy: Strategy;

  constructor(strategy: Strategy) {
    this.strategy = strategy;
  }

  setStrategy(strategy: Strategy) {
    this.strategy = strategy;
  }

  getFinalPrice(price: number): number {
    return this.strategy.calculate(price);
  }
}
```

## 使用示例

假设在电商平台中，付款结算阶段需要根据用户选择的优惠方式来实时计算价格。演示代码如下：

```typescript
// 创建策略对象
const normalStrategy = new NormalStrategy();
const discountStrategy = new DiscountStrategy();
const rebateStrategy = new RebateStrategy();

// 创建上下文
const priceContext = new PriceContext(normalStrategy);

// 初始使用无折扣策略
console.log('最终价格:', priceContext.getFinalPrice(120)); // 输出 120

// 切换为满减策略
priceContext.setStrategy(discountStrategy);
console.log('最终价格:', priceContext.getFinalPrice(120)); // 输出 100

// 切换为打折策略
priceContext.setStrategy(rebateStrategy);
console.log('最终价格:', priceContext.getFinalPrice(120)); // 输出 96
```

## 优缺点

### 优点

- 易扩展：每种具体策略都封装在各自的类中，新增或更改策略轻松便捷。
- 职责单一：消除了冗长的 if-else 或 switch-case 语句，逻辑更清晰。
- 避免耦合：将算法独立于上下文环境，算法自由替换或复用。

### 缺点

- 对象数量增多：每一种算法需要多一个类，可能导致类爆炸。
- 策略选择成本：需要知道所有策略的差异，并选择合适策略。

## 总结

策略模式非常适合需要在运行时灵活切换算法的场景，比如多种优惠计算、多种排序策略、多种日志记录策略等。它很好地遵循了“开闭原则”，在增加新策略时无需修改已存在的上下文逻辑。

在实际开发中，如果面对大量“if-else 逻辑”或“switch-case 逻辑”，并且这些分支逻辑还能抽象为几种算法选项时，就可以考虑用策略模式来简化结构、降低耦合，让代码更灵活、更易维护。
