# Vitest 测试框架入门指南：API 详解与实践技巧

Vitest 是一款基于 Vite 的现代化 JavaScript 测试框架，它结合了 Jest 和 Mocha 等成熟框架的优点，并与 Vite 生态系统深度集成。本文将全面介绍 Vitest 的核心 API 和使用技巧，帮助您掌握这一高效的测试工具。

## 一、Vitest 基础 API 详解

### 1. test 和 it：测试用例定义

test 和 it 在功能上完全相同，都用于创建测试用例，区别仅在于风格：

```js
// Jest风格
test('加法函数应正确计算两数之和', () => {
  expect(add(1, 2)).toBe(3);
});

// BDD风格
it('应正确计算两数之和', () => {
  expect(add(1, 2)).toBe(3);
});
```

风格差异：

- it 源自 BDD(行为驱动开发)风格，常见于 Mocha 和 Jasmine 框架
- test 源自 Jest 框架风格，被认为可读性更高
- 团队开发中应统一使用其中一种风格

### 2. describe：测试套件

describe 用于创建包含多个测试用例的测试套件，可以将相关功能的测试分组管理：

```js
describe('TodoList功能测试', () => {
  describe('添加操作', () => {
    it('应能添加新的待办项', () => {
      // 测试代码
    });

    it('添加时应验证输入不为空', () => {
      // 测试代码
    });
  });

  describe('删除操作', () => {
    it('应能删除指定待办项', () => {
      // 测试代码
    });

    it('删除后列表长度应减少1', () => {
      // 测试代码
    });
  });
});
```

#### 优势：

- 结构化组织测试，增强可读性
- 支持通过.only/.skip 控制整组测试的执行
- 使测试代码更易于长期维护

### 3. expect：断言方法

expect 方法是 Vitest 的断言核心，提供多种匹配器验证测试结果：

#### toBe 用法

用于严格比较(===)基本类型值：

```js
expect(1).toBe(1); // 通过
expect('test').toBe('test'); // 通过
expect({}).toBe({}); // 失败，引用不同
```

#### toEqual 用法

用于对象比较，检查结构和值是否相同：

```js
expect({ name: 'vitest' }).toEqual({ name: 'vitest' }); // 通过
```

#### toBeTruthy 与 toBeFalsy

验证值是否为真/假：

```js
// 真值检测
expect(1).toBeTruthy();
expect('abc').toBeTruthy();

// 假值检测
expect(0).toBeFalsy();
expect('').toBeFalsy();
expect(null).toBeFalsy();
```

#### toContain 使用

检查数组或字符串是否包含特定元素：

```js
expect([1, 2, 3]).toContain(2);
expect('hello world').toContain('world');
```

#### toThrow 使用

验证函数是否抛出错误：

```js
// 注意：必须用函数包裹被测试代码
expect(() => {
  throw new Error('出错了');
}).toThrow();

// 验证错误信息
expect(() => {
  throw new Error('参数无效');
}).toThrow('参数无效');
```

### 4. setup 和 teardown：生命周期钩子

Vitest 提供四个钩子函数控制测试生命周期：

```js
import { beforeAll, beforeEach, afterEach, afterAll } from 'vitest';

describe('生命周期演示', () => {
  beforeAll(() => {
    // 所有测试开始前执行一次（如数据库连接）
    console.log('beforeAll');
  });

  beforeEach(() => {
    // 每个测试用例前执行（如重置测试状态）
    console.log('beforeEach');
    // 可以返回函数作为afterEach逻辑
    return () => {
      console.log('从beforeEach返回的清理函数');
    };
  });

  afterEach(() => {
    // 每个测试用例后执行（如清理测试数据）
    console.log('afterEach');
  });

  afterAll(() => {
    // 所有测试结束后执行一次（如关闭数据库连接）
    console.log('afterAll');
  });

  it('测试1', () => {
    console.log('执行测试1');
  });

  it('测试2', () => {
    console.log('执行测试2');
  });
});
```

执行顺序：

- 嵌套 describe 场景：外层 beforeEach → 内层 beforeEach → 测试用例 → 内层 afterEach → 外层 afterEach
- beforeEach 可通过 return 函数实现 afterEach 逻辑，保持上下文关联性

### 5. 测试过滤器：控制测试执行

#### only：聚焦测试

仅执行标记为 only 的测试：

```js
describe('用户功能', () => {
  it.only('用户登录功能', () => {
    // 只有这个测试会执行
  });

  it('用户注册功能', () => {
    // 这个测试会被跳过
  });
});
```

#### skip：跳过测试

跳过标记为 skip 的测试：

```js
describe('计算功能', () => {
  it('加法计算', () => {
    // 这个测试会执行
  });

  it.skip('乘法计算', () => {
    // 这个测试会被跳过
  });
});
```

#### todo：测试待办

标记计划实现的测试：

```js
// 记录待实现的功能测试
test.todo('用户头像上传功能');
test.todo('用户资料编辑功能');
```

todo 的优势：

- 代替传统注释，形成可视化的任务列表
- 帮助开发者跟踪功能实现进度
- 在测试报告中明确显示待完成项

## 二、Vitest 运行模式与调试技巧

### watch 模式与 run 模式

#### watch 模式（默认）：

```json
{
  "scripts": {
    "test": "vitest"
  }
}
```

- 持续监听文件变化并自动重新执行测试
- 适合开发过程中实时查看测试结果
- 按 h 键可查看帮助，按 q 键可退出

有时候代码改了执行的还是缓存的，所以需要重新跑一下，所以建议测试还是使用下面的 run 模式

#### run 模式：

```json
{
  "scripts": {
    "test": "vitest run"
  }
}
```

- 执行完测试后立即退出，不会持续监听
- 适合 CI/CD 环境或需要一次性执行测试的场景
- 避免 watch 模式可能出现的更新延迟问题

### 测试筛选方法

#### 文件筛选：

```bash
vitest src/api/inject.spec.ts
```

#### 正则匹配：

```bash
vitest /api/
```

这些筛选方法在大型项目中特别有用，可将测试时间从几分钟缩短到几秒钟。

### 开发工具与效率提升

推荐使用 Jest Snippets 扩展，通过简写快速生成测试代码：

- 输入 desc → 生成 describe 块
- 输入 it → 生成 it 测试用例
- 输入 exp → 生成 expect 断言

## 三、测试驱动学习法

测试驱动学习（Test-Driven Learning）是一种通过编写测试用例来学习新 API 或框架的方法：

1. 为每个知识点创建独立的测试文件
2. 使用测试用例描述 API 的预期行为
3. 运行测试验证理解是否正确

示例：学习 TypeScript 类型系统

```ts
// types.test.ts
describe('TypeScript类型学习', () => {
  it('联合类型应正确工作', () => {
    type ID = number | string;
    const numId: ID = 123;
    const strId: ID = 'abc';

    expect(typeof numId).toBe('number');
    expect(typeof strId).toBe('string');
  });
});
```

这种方法的优势在于：

- 形成可执行的学习文档
- 方便后续复习和查阅
- 比传统笔记更直观有效

## 四、知识小结

| 知识点              | 核心内容                                                                                                                                    | 考试重点/易混淆点                                             | 难度系数 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- | -------- |
| test 与 it 的区别   | 功能相同但风格不同：<br>- test 来自 Jest 框架<br>- it 来自 BDD 行为驱动开发风格                                                             | 风格选择需统一;<br>不能混用 test/it                           | ⭐⭐     |
| describe 测试套件   | 用于组织多个测试用例：<br>- 支持嵌套结构<br>- 提供 skip/only 控制方法                                                                       | 嵌套层级控制;<br>建议不超过 2-3 层                            | ⭐⭐     |
| expect 断言方法     | 常用断言类型：<br>- toBe(严格相等)<br>- toEqual(对象比较)<br>- toBeTruthy/toBeFalsy(布尔值)<br>- toContain(包含检测)<br>- toThrow(错误检测) | toThrow 特殊用法;<br>需用函数包裹被测代码                     | ⭐⭐⭐   |
| setup/teardown 钩子 | 四阶段生命周期：<br>- beforeAll(全局初始化)<br>- beforeEach(用例级初始化)<br>- afterEach(用例级清理)<br>- afterAll(全局清理)                | 执行顺序理解;<br>beforeAll→beforeEach→test→afterEach→afterAll | ⭐⭐⭐⭐ |
| 测试过滤器          | 控制执行范围：<br>- only(仅执行标记用例)<br>- skip(跳过标记用例)<br>- todo(待办事项标记)                                                    | 调试技巧;<br>用 only 快速定位问题                             | ⭐⭐     |
| CLI 使用技巧        | 两种执行模式：<br>- watch(持续监听)<br>- run(单次执行)                                                                                      | watch 模式延迟问题;<br>建议开发时使用 run 模式                | ⭐       |
| 测试驱动学习法      | 通过可执行的测试案例学习 API：<br>- 每个知识点建立独立测试文件<br>- 形成可追溯的知识库                                                      | 知识沉淀方法;<br>类似 TS-TDL 学习体系                         | ⭐⭐⭐   |

## 总结

Vitest 是一个现代的前端测试工具，它用起来很简单，和 Vite 配合非常好，而且运行速度很快，让前端写测试变得更高效、更顺手。像测试驱动开发这种方法，其实不只是用在框架上，学其他新技术都可以试着用写测试的方式来掌握。

在真实项目里，团队最好统一用一种测试风格和命名方式，把测试代码结构整理清楚，这样别人也更容易看懂、维护起来也方便。只要在平时多练习，习惯把测试作为日常开发的一部分，大家的测试能力和代码质量都能得到提升。
