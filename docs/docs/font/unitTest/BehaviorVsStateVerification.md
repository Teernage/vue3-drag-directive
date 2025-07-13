# 测试中的行为验证与状态验证：何时使用哪种验证方式？

每个前端开发者在写测试时都会遇到这个选择题。就像你怀疑室友偷吃了你的薯片：

- 状态验证：直接看薯片袋子还剩多少（关注结果）
- 行为验证：安装摄像头看谁动了薯片（关注过程）

## 状态验证：简单粗暴的"看结果"派

### 什么是状态验证？

人话翻译：不管你怎么做的，我只看最后的结果对不对。

就像你妈问你："作业写完了吗？" 她不关心你是抄的还是自己写的，只要作业本上有字就行。

```js
// 银行账户例子 - 最好理解的状态验证
class BankAccount {
  constructor(money = 0) {
    this.money = money; // 余额
  }

  deposit(amount) {
    if (amount > 0) {
      this.money += amount; // 存钱
    }
  }

  withdraw(amount) {
    if (amount > 0 && amount <= this.money) {
      this.money -= amount; // 取钱
      return true;
    }
    return false; // 余额不足，取钱失败
  }

  getBalance() {
    return this.money;
  }
}

// 状态验证测试 - 关注最终结果
describe('银行账户测试 - 我只看余额对不对', () => {
  it('存100块钱后，余额应该增加100', () => {
    const account = new BankAccount(500); // 开户存500

    account.deposit(100); // 存100

    // 看结果：余额应该是600
    expect(account.getBalance()).toBe(600);
    // 我不关心你内部怎么加的，反正最后要是600就对了
  });

  it('取300块钱后，余额应该减少300', () => {
    const account = new BankAccount(500);

    const success = account.withdraw(300);

    // 验证操作成功 + 余额正确
    expect(success).toBe(true);
    expect(account.getBalance()).toBe(200);
    // 简单明了：能取出来，而且余额对
  });

  it('余额不够时，取钱应该失败', () => {
    const account = new BankAccount(100); // 只有100块

    const success = account.withdraw(200); // 想取200

    expect(success).toBe(false); // 肯定取不出来
    expect(account.getBalance()).toBe(100); // 余额不变
  });
});
```

状态验证的优点：

- 😄 简单直接，一目了然
- 💪 测试稳定，不容易因为代码重构而挂掉
- 🎯 关注用户真正关心的结果

## 行为验证：严格的"盯过程"派

### 什么是行为验证？

人话翻译：我不仅要看结果，还要看你是怎么做的，跟谁说话了，说了什么。

就像严格的老师，不仅要看你答案对不对，还要看你解题步骤，用了哪些公式。

```js
// 用户注册例子 - 需要验证交互过程
class EmailService {
  async sendWelcomeEmail(email, name) {
    // 发邮件的具体实现（我们测试时会模拟这个）
    console.log(`给 ${email} 发欢迎邮件...`);
  }
}

class UserDatabase {
  async saveUser(userData) {
    // 保存用户到数据库（我们测试时会模拟这个）
    console.log('保存用户到数据库...');
    return { id: 123, ...userData };
  }
}

class UserRegistration {
  constructor(emailService, database) {
    this.emailService = emailService;
    this.database = database;
  }

  async registerUser(userData) {
    // 1. 先保存用户
    const user = await this.database.saveUser(userData);

    // 2. 再发欢迎邮件
    await this.emailService.sendWelcomeEmail(user.email, user.name);

    return user;
  }
}

// 行为验证测试 - 关注交互过程
describe('用户注册 - 我要盯着你每一步', () => {
  it('注册用户时必须保存数据并发邮件', async () => {
    // 创建测试替身（演员）
    const fakeEmailService = {
      sendWelcomeEmail: vi.fn().mockResolvedValue(), // 假装发邮件
    };

    const fakeDatabase = {
      saveUser: vi.fn().mockResolvedValue({
        // 假装保存用户
        id: 123,
        name: '张三',
        email: 'zhangsan@example.com',
      }),
    };

    const registration = new UserRegistration(fakeEmailService, fakeDatabase);

    // 执行注册
    await registration.registerUser({
      name: '张三',
      email: 'zhangsan@example.com',
    });

    // 行为验证 - 检查交互是否正确
    expect(fakeDatabase.saveUser).toHaveBeenCalledTimes(1); // 必须调用1次保存
    expect(fakeEmailService.sendWelcomeEmail).toHaveBeenCalledTimes(1); // 必须发1次邮件
    expect(fakeEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
      'zhangsan@example.com',
      '张三'
    ); // 邮件内容必须正确
  });
});
```

### Vitest 的行为验证三剑客

#### vi.fn() - 万能替身演员

作用：创建一个假函数，能记住被调用的所有细节

```js
describe('vi.fn() - 记忆超群的演员', () => {
  it('能记住所有表演细节', () => {
    const mockActor = vi.fn(); // 创建一个演员

    // 让演员表演几场戏
    mockActor('第一场戏', '台词A');
    mockActor('第二场戏');
    mockActor('第三场戏', '台词B', '台词C');

    // 检查演员的表演记录
    expect(mockActor).toHaveBeenCalledTimes(3); // 演了3场戏
    expect(mockActor).toHaveBeenNthCalledWith(1, '第一场戏', '台词A'); // 第1场戏的台词
    expect(mockActor).toHaveBeenLastCalledWith('第三场戏', '台词B', '台词C'); // 最后一场戏
  });

  it('还能提前准备台词', () => {
    const mockActor = vi
      .fn()
      .mockReturnValueOnce('第一次回答') // 第一次被问时说这个
      .mockReturnValueOnce('第二次回答') // 第二次被问时说这个
      .mockReturnValue('默认回答'); // 之后都说这个

    expect(mockActor()).toBe('第一次回答');
    expect(mockActor()).toBe('第二次回答');
    expect(mockActor()).toBe('默认回答');
    expect(mockActor()).toBe('默认回答'); // 还是默认回答
  });
});
```

#### vi.spyOn() - 专业监听器

作用：监听现有对象的方法，既能看到原来的表演，也能临时换台词。

```js
// 文件管理例子
import fs from 'fs';

class FileManager {
  saveData(filename, data) {
    fs.writeFileSync(filename, JSON.stringify(data));
    return '保存成功';
  }

  loadData(filename) {
    if (fs.existsSync(filename)) {
      const content = fs.readFileSync(filename, 'utf8');
      return JSON.parse(content);
    }
    return null;
  }
}

describe('FileManager - vi.spyOn监听文件操作', () => {
  let fileManager;
  let writeFileSpy;
  let readFileSpy;
  let existsSpy;

  beforeEach(() => {
    fileManager = new FileManager();
    // 安装监听器（不影响原功能，只是在旁边偷听）
    writeFileSpy = vi.spyOn(fs, 'writeFileSync').mockImplementation(() => {
      // 假装写文件，实际什么都不做
    });
    readFileSpy = vi
      .spyOn(fs, 'readFileSync')
      .mockReturnValue('{"name":"测试数据"}');
    existsSpy = vi.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks(); // 撤掉所有监听器
  });

  it('保存数据时应该正确调用文件系统', () => {
    const testData = { name: '用户数据', age: 25 };

    fileManager.saveData('user.json', testData);

    // 检查监听器记录的信息
    expect(writeFileSpy).toHaveBeenCalledTimes(1);
    expect(writeFileSpy).toHaveBeenCalledWith(
      'user.json',
      JSON.stringify(testData)
    );
  });

  it('加载数据时应该先检查文件是否存在', () => {
    fileManager.loadData('user.json');

    // 验证调用顺序和参数
    expect(existsSpy).toHaveBeenCalledWith('user.json');
    expect(readFileSpy).toHaveBeenCalledWith('user.json', 'utf8');
  });
});
```

#### vi.mock() - 整个剧组替换

作用：把整个第三方库都换成假的，完全控制。

```js
// API客户端例子
import axios from 'axios';

// 把整个axios都换成假的
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

class ApiClient {
  async getUser(userId) {
    try {
      const response = await axios.get(`/api/users/${userId}`);
      return response.data;
    } catch (error) {
      throw new Error(`获取用户失败: ${error.message}`);
    }
  }

  async updateUser(userId, data) {
    const response = await axios.put(`/api/users/${userId}`, data);
    return response.data;
  }
}

describe('ApiClient - 用假axios测试', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
    vi.clearAllMocks(); // 清理之前的记录
  });

  it('成功获取用户信息', async () => {
    const mockUserData = { id: 1, name: '张三', email: 'zhangsan@example.com' };
    mockedAxios.get.mockResolvedValue({ data: mockUserData });

    const user = await apiClient.getUser(1);

    // 验证API调用
    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith('/api/users/1');

    // 验证返回结果
    expect(user).toEqual(mockUserData);
  });

  it('处理网络错误', async () => {
    mockedAxios.get.mockRejectedValue(new Error('网络连接失败'));

    await expect(apiClient.getUser(1)).rejects.toThrow(
      '获取用户失败: 网络连接失败'
    );

    expect(mockedAxios.get).toHaveBeenCalledTimes(1);
  });
});
```

## 何时用哪种验证？（决策树）

### 🎯 优先使用状态验证

#### 场景：能看到明显结果变化的情况

✅ 购物车例子 - 状态验证完美适用

```js
class ShoppingCart {
  constructor() {
    this.items = [];
  }

  addItem(product, quantity = 1) {
    const existingItem = this.items.find(
      (item) => item.product.id === product.id
    );
    if (existingItem) {
      existingItem.quantity += quantity; // 商品已存在，增加数量
    } else {
      this.items.push({ product, quantity }); // 新商品
    }
  }

  getTotal() {
    return this.items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  }

  getItemCount() {
    return this.items.reduce((count, item) => count + item.quantity, 0);
  }
}

describe('购物车 - 用状态验证就够了', () => {
  it('加商品后，总价和数量都要正确', () => {
    const cart = new ShoppingCart();
    const laptop = { id: 1, name: '笔记本', price: 5000 };
    const mouse = { id: 2, name: '鼠标', price: 100 };

    cart.addItem(laptop, 1); // 买1台笔记本
    cart.addItem(mouse, 2); // 买2个鼠标
    cart.addItem(laptop, 1); // 再买1台笔记本

    // 直接看结果，简单明了
    expect(cart.getItemCount()).toBe(4); // 总共4件商品
    expect(cart.getTotal()).toBe(10200); // 总价10200元
    // 不需要关心内部怎么计算的，结果对就行
  });
});
```

### 🕵️ 必须使用行为验证的场景

#### 场景 1 看不到状态变化（副作用操作）

日志记录器 - 只有副作用，没有状态变化

```js
class Logger {
  constructor(writer) {
    this.writer = writer; // 写入器（可能是文件、网络等）
  }

  logError(message, error) {
    // 写日志，但是没有返回值，也看不到状态变化
    this.writer.write(`[ERROR] ${message}`, error);
  }

  logInfo(message) {
    this.writer.write(`[INFO] ${message}`);
  }
}

describe('日志记录器 - 必须用行为验证', () => {
  it('记录错误日志时应该调用写入器', () => {
    const mockWriter = { write: vi.fn() }; // 创建假的写入器
    const logger = new Logger(mockWriter);
    const error = new Error('出错了');

    logger.logError('系统崩溃', error);

    // 只能通过行为验证，因为看不到任何状态变化
    expect(mockWriter.write).toHaveBeenCalledWith('[ERROR] 系统崩溃', error);
  });
});
```

#### 场景 2：验证与外部系统的交互

支付处理器 - 涉及多个外部系统

```js
class PaymentProcessor {
  constructor(paymentGateway, emailService, smsService) {
    this.paymentGateway = paymentGateway; // 支付网关
    this.emailService = emailService; // 邮件服务
    this.smsService = smsService; // 短信服务
  }

  async processPayment(order) {
    try {
      // 1. 调用支付网关
      const result = await this.paymentGateway.charge(
        order.amount,
        order.paymentMethod
      );

      // 2. 发送成功邮件
      await this.emailService.sendPaymentSuccess(
        order.customerEmail,
        result.transactionId
      );

      // 3. 发送成功短信
      await this.smsService.sendPaymentSuccess(
        order.customerPhone,
        order.amount
      );

      return result;
    } catch (error) {
      // 4. 发送失败通知
      await this.emailService.sendPaymentFailure(
        order.customerEmail,
        error.message
      );
      throw error;
    }
  }
}

describe('支付处理器 - 复杂交互验证', () => {
  it('支付成功时应该发送所有通知', async () => {
    // 准备所有假服务
    const mockPaymentGateway = {
      charge: vi.fn().mockResolvedValue({
        transactionId: 'tx_12345',
        status: 'success',
      }),
    };
    const mockEmailService = {
      sendPaymentSuccess: vi.fn().mockResolvedValue(),
      sendPaymentFailure: vi.fn().mockResolvedValue(),
    };
    const mockSmsService = {
      sendPaymentSuccess: vi.fn().mockResolvedValue(),
    };

    const processor = new PaymentProcessor(
      mockPaymentGateway,
      mockEmailService,
      mockSmsService
    );

    const order = {
      amount: 100,
      paymentMethod: 'credit_card',
      customerEmail: 'user@example.com',
      customerPhone: '13800138000',
    };

    await processor.processPayment(order);

    // 验证所有交互都正确进行
    expect(mockPaymentGateway.charge).toHaveBeenCalledWith(100, 'credit_card');
    expect(mockEmailService.sendPaymentSuccess).toHaveBeenCalledWith(
      'user@example.com',
      'tx_12345'
    );
    expect(mockSmsService.sendPaymentSuccess).toHaveBeenCalledWith(
      '13800138000',
      100
    );
    expect(mockEmailService.sendPaymentFailure).not.toHaveBeenCalled();
  });
});
```

### 常见坑点与避坑指南

#### 坑点 1：过度使用行为验证（测试实现细节）

```js
// ❌ 错误示例：测试内部实现
class Calculator {
  add(a, b) {
    return this.performAddition(a, b); // 内部方法
  }

  performAddition(a, b) {
    return a + b;
  }
}

// ❌ 这是错误的做法
describe('计算器 - 错误的测试方式', () => {
  it('加法时应该调用内部方法', () => {
    const calculator = new Calculator();
    const spy = vi.spyOn(calculator, 'performAddition');

    calculator.add(2, 3);

    // 🚨 测试了实现细节，很脆弱
    expect(spy).toHaveBeenCalledWith(2, 3);
    // 如果重构代码，这个测试就会挂
  });
});

// ✅ 正确的做法
describe('计算器 - 正确的测试方式', () => {
  it('加法应该返回正确结果', () => {
    const calculator = new Calculator();

    const result = calculator.add(2, 3);

    // ✅ 测试行为而非实现
    expect(result).toBe(5);
    // 只要结果对，内部怎么实现都无所谓
  });
});
```

#### 坑点 2：模拟不必要的东西

```js
// ❌ 过度模拟
describe('用户信息显示 - 过度模拟的例子', () => {
  it('显示用户名', () => {
    // 🚨 简单对象不需要模拟
    const mockUser = {
      getName: vi.fn().mockReturnValue('张三'),
      getAge: vi.fn().mockReturnValue(25),
    };

    const name = mockUser.getName();
    expect(name).toBe('张三');
    // 这完全是多此一举
  });
});

// ✅ 简单直接的做法
describe('用户信息显示 - 简单做法', () => {
  it('显示用户名', () => {
    // ✅ 简单对象直接使用
    const user = {
      name: '张三',
      age: 25,
    };

    expect(user.name).toBe('张三');
    // 简单明了，没有不必要的复杂性
  });
});
```

#### 坑点 3：忘记清理 Mock

```js
describe('API测试 - 清理Mock的重要性', () => {
  let apiClient;

  beforeEach(() => {
    apiClient = new ApiClient();
    // ✅ 每次测试前清理
    vi.clearAllMocks();
  });

  afterEach(() => {
    // ✅ 每次测试后也要清理
    vi.restoreAllMocks();
  });

  it('第一个测试', async () => {
    mockedAxios.get.mockResolvedValue({ data: { id: 1 } });
    // ... 测试逻辑
  });

  it('第二个测试', async () => {
    // 如果不清理，可能受到第一个测试的影响
    mockedAxios.get.mockResolvedValue({ data: { id: 2 } });
    // ... 测试逻辑
  });
});
```

### 实战决策流程图

开始写测试  
 ↓  
能直接看到结果变化吗？  
 ↓ 是  
用状态验证 ✅  
 ↓ 否  
涉及外部系统交互吗？  
 ↓ 是  
用行为验证 ✅  
 ↓ 否  
有副作用但无返回值吗？  
 ↓ 是  
用行为验证 ✅  
 ↓ 否  
你在测试内部实现吗？  
 ↓ 是  
重新思考测试设计 🤔

## 总结：测试界的生存法则

🏆 黄金法则

1. 状态优先：能用状态验证就别用行为验证
2. 交互必验：涉及外部依赖必须用行为验证
3. 避免过度：不要测试实现细节
4. 保持简单：测试应该比被测代码更简单

🎯 选择指南
| 场景 | 推荐方法 | 原因 |  
|------|----------|------|  
| 计算、转换、业务逻辑 | 状态验证 | 结果可观察，测试稳定 |  
| API 调用、数据库操作 | 行为验证 | 外部依赖，需要模拟 |  
| 日志、通知、邮件 | 行为验证 | 副作用操作，无状态变化 |  
| 简单工具函数 | 状态验证 | 纯函数，输入输出明确 |

记住这个口诀：

- 状态看结果，行为看过程
- 能用状态就状态，必须行为才行为
- 测试接口不测实现，模拟依赖不模拟简单 （意思：关心最终结果和外部依赖的交互，不测试内部的实现；只模拟真正的外部依赖（API、数据库、文件系统等），不要模拟简单的对象或值）
