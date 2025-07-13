# Vitest 单元测试：输入和 Mock 技术

写单元测试时，你是不是遇到过这样的困扰：测试今天通过了，明天就莫名其妙地失败了？很可能是因为你的代码依赖了一些"不听话"的外部数据。今天我们就来聊聊如何驯服这些捣蛋的间接输入。

## 直接输入和间接输入分别是什么？

想象你在做菜，有两种获取食材的方式：

直接输入：你直接把食材拿在手里传给厨师

```js
function cookDish(ingredient) {
  // ingredient 就是直接输入
  return `美味的${ingredient}料理`;
}
```

间接输入：厨师需要去冰箱、菜市场或者找其他人要食材

```js
function cookDish() {
  const ingredient = getFromFridge(); // 这就是间接输入
  return `美味的${ingredient}料理`;
}
```

在编程中，间接输入就像是：

- 从网上获取天气数据
- 从数据库查询用户信息
- 读取配置文件
- 调用其他系统的接口

### 间接输入的麻烦事

间接输入麻烦就像是：你想测试厨师的手艺，但每次食材都不一样。今天冰箱里是鸡蛋，明天可能是土豆，后天可能啥都没有！

```js
// 有问题的测试
function getUserGreeting(userId) {
  const user = getUserFromDatabase(userId); // 数据库里的数据可能变化
  return `Hello ${user.name}!`;
}

test('应该返回问候语', () => {
  const result = getUserGreeting(1);
  expect(result).toBe('Hello 小明!'); // 如果数据库里用户名改了怎么办？
});
```

这种测试就是"脆弱测试"——就像玻璃一样，轻轻一碰就碎。

## Mock：给你一个假的替身

Mock 就像是给你的代码找了个"替身演员"。真正的演员可能今天心情不好、明天生病了，但替身演员永远按剧本演出。

### 基础 Mock：vi.mock

```js
import { vi } from 'vitest';

// 告诉测试框架："嘿，用这个假的替代真的数据库查询"
vi.mock('./database', () => ({
  getUserFromDatabase: vi.fn(() => ({ name: '小明' })), // 永远返回小明
}));

test('应该返回问候语', () => {
  const result = getUserGreeting(1);
  expect(result).toBe('Hello 小明!'); // 现在结果可预测了！
});
```

就像是说：“不管真实数据库里有什么，我的测试中永远假装有个叫小明的用户。”

### 高级技巧：vi.doMock

有时候你需要更灵活的控制，就像导演说：“这场戏需要一个高个子演员，下场戏需要一个矮个子演员。

```js
describe('不同用户的测试', () => {
  test('VIP用户应该有特殊问候', async () => {
    // 这场戏的演员是VIP用户
    vi.doMock('./database', () => ({
      getUserFromDatabase: vi.fn(() => ({ name: '王总', isVip: true })),
    }));

    const { getUserGreeting } = await import('./greeting');
    const result = getUserGreeting(1);
    expect(result).toBe('尊敬的王总，欢迎回来！');
  });

  test('普通用户应该有普通问候', async () => {
    // 这场戏的演员是普通用户
    vi.doMock('./database', () => ({
      getUserFromDatabase: vi.fn(() => ({ name: '小李', isVip: false })),
    }));

    const { getUserGreeting } = await import('./greeting');
    const result = getUserGreeting(1);
    expect(result).toBe('Hello 小李!');
  });
});
```

### 处理异步情况：等等，数据还在路上

现实中很多数据需要时间获取，就像网购要等快递一样：

```js
// 模拟网络请求
async function getWeatherGreeting(city) {
  const weather = await fetchWeatherFromAPI(city); // 需要等待
  return `今天${city}的天气是${weather.condition}`;
}

// 测试异步间接输入
test('应该显示天气信息', async () => {
  vi.doMock('./weatherAPI', () => ({
    fetchWeatherFromAPI: vi.fn(
      () => Promise.resolve({ condition: '晴天' }) // 假装API返回晴天
    ),
  }));

  const { getWeatherGreeting } = await import('./weather');
  const result = await getWeatherGreeting('北京'); // 记得用 await
  expect(result).toBe('今天北京的天气是晴天');
});
```

## 实用小贴士

1. 保持测试环境干净

```js
beforeEach(() => {
  vi.resetModules(); // 每次测试前清理，就像每场戏前重置舞台
});
```

2. 选择合适的 Mock 方式

- vi.mock：适合整个测试文件都用同样的假数据
- vi.doMock：适合每个测试需要不同的假数据

3. 让测试更易懂

```js
// 好的做法：给假数据起有意义的名字
const mockUserData = { name: '测试用户', age: 25 };
vi.fn(() => mockUserData);

// 不好的做法：直接写死数据
vi.fn(() => ({ name: 'test', age: 25 }));
```

## 总结：

- 🎭 替身演员：替代不可控的外部依赖
- 🎬 导演控制：你决定"演员"说什么、做什么
- 🔄 重复演出：每次测试都能得到相同的结果
- ⚡ 快速响应：不需要真的去网络请求或查数据库

通过合理使用 Mock，你的测试会变得：

- 更稳定（不会因为外部数据变化而失败）
- 更快速（不需要真实的网络请求）
- 更可控（你说了算！）
