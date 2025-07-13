# Vitest 异步测试实战：驯服 Promise 和 setTimeout 这两只野兽 🦁

## 前言：异步测试，程序员的噩梦？

异步编程就像是在玩杂技——你得同时抛接好几个球，还要确保它们不会砸到你的脑袋。而测试异步代码？那就是在杂技表演时还要闭着眼睛！😵‍💫

今天我们就来学学如何用 Vitest 这把"驯兽鞭"，把 Promise 和 setTimeout 这两只调皮的野兽收拾得服服帖帖。

## 一、基础 Promise 测试：从小白兔开始 🐰

### 1.1 最简单的 Promise（连我奶奶都会）

先从最温顺的小白兔开始：

```javascript
// index.js - 这个 Promise 乖得像只小绵羊
export function fetchUserData() {
  return new Promise((resolve, reject) => {
    resolve('1'); // 秒回，比微信还快
  });
}
```

测试它就像撸猫一样简单：

```javascript
// index.test.js
import { vi, it, expect, describe } from 'vitest';
import { fetchUserData } from './index';

describe('Promise', () => {
  it('normal', async () => {
    const result = await fetchUserData();
    expect(result).toBe('1');
    // 看！多简单，连 await 都不会反抗
  });
});
```

**划重点：**

- `async/await` 是你的好朋友，别忘了它们
- 测试函数必须标记为 `async`，不然就像开车不系安全带 🚗

### 1.2 Promise 链式调用：俄罗斯套娃的噩梦

现实项目中的 Promise 链就像俄罗斯套娃，一层套一层，让人头大：

```javascript
// view.js - 这个类有点调皮
export class View {
  count: number = 1;

  render() {
    // 看这个 Promise 链，像不像多米诺骨牌？
    Promise.resolve()
      .then(() => {
        this.count = 2; // 第一张牌倒了
      })
      .then(() => {
        this.count = 3; // 第二张牌也倒了
      });
  }
}
```

测试这货需要点技巧，不然你就等着被坑：

首先得安装这个神奇的小工具：

```bash
# npm 用户
npm install --save-dev flush-promises

# yarn 用户
yarn add -D flush-promises

# pnpm 用户
pnpm add -D flush-promises

```

flushPromises 会等待前面所有的 promise 完成后才往下执行

```javascript
// view.test.js
import { it, expect, describe } from 'vitest';
import { View } from './view';
import flushPromises from 'flush-promises';

describe('View', () => {
  it('should change count', async () => {
    const view = new View();
    view.render();

    // 🎯 关键来了！等等，让子弹飞一会儿
    await flushPromises();

    expect(view.count).toBe(3);
  });
});
```

**为什么需要 `flushPromises`？让我用人话解释：**

```javascript
describe('Promise 的小脾气', () => {
  it('❌ 新手常犯的错误（别学我）', () => {
    const view = new View();
    view.render();

    // 这时候 Promise 还在偷懒，count 还是 1
    expect(view.count).toBe(1); // 测试通过了，但这是假象！
    console.log('我以为我赢了，其实我输得很彻底 😭');
  });

  it('✅ 正确的做法（学我这样）', async () => {
    const view = new View();
    view.render();

    // 等待所有 Promise 执行完毕，就像等红绿灯
    await flushPromises();

    expect(view.count).toBe(3); // 现在才是真正的胜利！
    console.log('这才是真正的王者 👑');
  });
});
```

**`flushPromises` 的作用：**

- 它会等待所有微任务（microtask）执行完毕
- 就像给 Promise 链一个"全部执行完毕"的信号
- 没有它，你的测试就像在考试时交白卷 📝

## 二、setTimeout 测试：时间管理大师的秘密武器 ⏰

### 2.1 基础 setTimeout：等待是一种煎熬

```javascript
// index.js - 这个函数有拖延症
export function delay(time: number) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('ok');
    }, time);
  });
}
```

如果按常规方法测试，你的测试套件会跑得比蜗牛还慢：

```javascript
// ❌ 慢得让人怀疑人生的测试
describe('慢如蜗牛的测试', () => {
  it('等待 1 秒，我都能泡杯茶了', async () => {
    const result = await delay(1000);
    expect(result).toBe('ok');
    // 真的要等 1 秒！时间就是金钱啊！💰
  });
});
```

### 2.2 Mock 时间：我是时间的主人！

用 Vitest 的假时间，你就是时间的主宰：

```javascript
// index.test.js - 时间管理大师版本
import { vi, it, expect, describe } from 'vitest';
import { delay } from './index';

describe('Promise', () => {
  it('delay', async () => {
    // 🎭 戴上时间面具，我就是时间之神
    vi.useFakeTimers();

    // 启动定时器，但不等待
    const result = delay(100);

    // 时间快进！就像遥控器的快进键
    vi.advanceTimersToNextTimer();

    // 现在检查结果
    expect(result).resolves.toBe('ok');
    // 瞬间完成！比闪电侠还快 ⚡
  });
});
```

**关键技巧解析：**

1. **`vi.useFakeTimers()`** - 开启时间控制模式

   ```javascript
   vi.useFakeTimers(); // 我现在是时间的主人！
   ```

2. **`vi.advanceTimersToNextTimer()`** - 跳到下一个定时器

   ```javascript
   // 不管你设置多长时间，我一键跳过！
   vi.advanceTimersToNextTimer();
   ```

3. **`expect().resolves.toBe()`** - 测试 Promise 的最终结果
   ```javascript
   // 不用 await，直接测试 Promise 会 resolve 成什么
   expect(promise).resolves.toBe('expected value');
   ```

### 2.3 更多时间控制技巧

```javascript
describe('时间管理大师的进阶技能', () => {
  beforeEach(() => {
    vi.useFakeTimers(); // 每次测试前都要戴上时间面具
  });

  afterEach(() => {
    vi.useRealTimers(); // 测试后记得摘下面具，回到现实
  });

  it('精确控制时间流逝', async () => {
    const promise1 = delay(100);
    const promise2 = delay(200);

    // 只过 100ms
    vi.advanceTimersByTime(100);
    await expect(promise1).resolves.toBe('ok');

    // 再过 100ms，总共 200ms
    vi.advanceTimersByTime(100);
    await expect(promise2).resolves.toBe('ok');

    console.log('时间在我手中就像橡皮泥 🕰️');
  });

  it('一键清空所有定时器', async () => {
    const promises = [delay(1000), delay(2000), delay(5000)];

    // 🚀 核弹级操作：一键清空所有定时器
    vi.runAllTimers();

    // 所有 Promise 都应该 resolve
    for (const promise of promises) {
      await expect(promise).resolves.toBe('ok');
    }

    console.log('定时器？在我面前都是弟弟！💪');
  });
});
```

## 三、常见陷阱及避坑指南 🕳️

### 3.1 陷阱博物馆

```javascript
describe('常见陷阱博物馆', () => {
  it('❌ 陷阱1：忘记 await', async () => {
    // 新手经常犯的错误
    const promise = fetchUserData(); // 忘记 await
    expect(promise).toBe('1'); // 这会失败！Promise 对象不等于字符串

    // 正确做法
    const result = await fetchUserData();
    expect(result).toBe('1');
  });

  it('❌ 陷阱2：假时间忘记清理', () => {
    vi.useFakeTimers();
    // ... 测试代码 ...
    // 如果忘记 vi.useRealTimers()，会影响其他测试！
  });

  it('❌ 陷阱3：Promise 链没等完', () => {
    const view = new View();
    view.render();

    // 没有 await flushPromises()
    expect(view.count).toBe(1); // 还没执行完呢！
  });
});
```

### 3.2 最佳实践

```javascript
describe('最佳实践指南', () => {
  // ✅ 推荐：使用 beforeEach 和 afterEach
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks(); // 顺便清理所有 mock
  });

  it('✅ 完美的异步测试', async () => {
    // 1. 设置场景
    const view = new View();
    const delayPromise = delay(1000);

    // 2. 触发异步操作
    view.render();

    // 3. 控制时间流逝
    vi.advanceTimersByTime(1000);

    // 4. 等待所有异步操作完成
    await flushPromises();
    await expect(delayPromise).resolves.toBe('ok');

    // 5. 验证结果
    expect(view.count).toBe(3);

    console.log('这就是完美的异步测试！✨');
  });
});
```

## 四、实战技巧总结 📚

### 4.1 Promise 测试口诀

```
Promise 测试三字经：
- async 标记不能忘
- await 等待要用上
- flushPromises 清空忙
```

### 4.2 setTimeout 测试心法

```
setTimeout 测试心法：
- useFakeTimers 开启神功
- advanceTimersToNextTimer 时光飞行
- runAllTimers 一键清空
- useRealTimers 回到现实
```

### 4.3 工具箱清单

| 工具                            | 用途              | 使用场景          |
| ------------------------------- | ----------------- | ----------------- |
| `async/await`                   | 等待 Promise      | 所有 Promise 测试 |
| `flushPromises`                 | 清空微任务队列    | Promise 链测试    |
| `vi.useFakeTimers()`            | 开启假时间        | setTimeout 测试   |
| `vi.advanceTimersToNextTimer()` | 跳到下一个定时器  | 单个定时器测试    |
| `vi.advanceTimersByTime(ms)`    | 精确推进时间      | 多个定时器测试    |
| `vi.runAllTimers()`             | 执行所有定时器    | 批量定时器测试    |
| `expect().resolves.toBe()`      | 测试 Promise 结果 | 不想用 await 时   |

## 五、总结：异步测试的武林秘籍 🥋

异步测试就像是在驯服两只野兽：

- **Promise** 这只狡猾的狐狸，喜欢躲在微任务队列里偷偷执行
- **setTimeout** 这只懒惰的熊，总是要睡一觉才干活

掌握了 Vitest 的这些技巧，你就是异步测试界的驯兽师！

**最后的忠告：**

- 测试不是为了证明代码没有 bug
- 而是为了在 bug 搞砸生产环境之前抓住它们！🐛
- 记住：**好的测试就像保险，你希望永远用不到，但没有它你会睡不着觉** 😴

---

**P.S.** 如果你的测试还是红的，别慌，深呼吸，检查一下是不是忘记了 `await` 或者 `flushPromises`。异步测试就像学骑自行车，摔几次就会了！🚴‍♂️
