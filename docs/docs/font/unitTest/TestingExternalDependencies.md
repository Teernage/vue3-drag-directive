# 处理外部依赖的 7 种测试策略

## 测试使用第三方库的代码

### 核心概念

第三方库测试的关键挑战：

- 不可控性：第三方库的行为我们无法控制
- 网络依赖：可能涉及真实的 HTTP 请求
- 测试隔离：避免测试受外部服务影响
- 接口变化：第三方库更新可能影响测试
- 调用第三方模块，比如调用了 axios，应该如何测试呢?

### 测试策略

调用第三方模块，比如调用了 axios，应该如何测试呢?

```js
import axios from 'axios';

interface User {
  name: string;
  age: number;
}

export async function doubleUserAge() {
  // 调用了第三方模块
  // const user: User = await axios("/user/1");
  // 对象  让你直接调用对象上的方法
  const user: User = await axios.get('/user/1');
  return user.age * 2;
}
```

测试用例：

```js
import { test, vi, expect } from 'vitest';
import { doubleUserAge } from './third-party-modules';
import axios from 'axios';
import { config } from './config';

vi.mock('axios');

test('第三方模式的处理 axios', async () => {
  // vi.mocked(axios).mockResolvedValue({ name: "xzx", age: 18 });
  vi.mocked(axios.get).mockResolvedValue({ name: 'xzx', age: 18 });

  const r = await doubleUserAge();

  expect(r).toBe(36);
});
```

1. Mocking Axios:

- 使用 vi.mock('axios') 来告诉 vitest mock Axios 库。
- 使用 vi.mocked(axios.get) 来指定 Axios 的 get 方法应该返回一个特定的值。
- 在本例中，我们使用 mockResolvedValueOnce 来确保该 mock 只会在一次调用后生效，这样可以测试多次调用时的行为。

2. 测试逻辑:

- 在测试中，我们首先 mock Axios 的 get 方法，使其返回一个特定的 JSON 对象。
- 然后调用 doubleUserAge 函数，并期望其返回值是用户年龄乘以 2，即 36。

## 测试使用对象的代码

### 核心概念

对象依赖测试的特点：

- 直接访问：可以直接修改对象属性
- 状态管理：需要注意测试间的状态污染
- 配置驱动：常用于功能开关和配置管理
- 运行时修改：可以在运行时动态改变行为

### 测试策略

当代码依赖配置对象时，我们可以直接修改对象属性进行测试。

例子：

```js
import { config } from './config';

export function tellAge() {
  if (config.allowTellAge) {
    return 18;
  }

  return '就不告诉你';
}
```

测试用例：

```js
import { it, expect, describe, vi } from 'vitest';
import { tellAge } from './use-object';
import { config } from './config';

describe('使用对象的形式', () => {
  it('allow ', () => {
    // given
    config.allowTellAge = true;

    // when
    const age = tellAge();

    // then
    expect(age).toBe(18);
  });
});
```

关键点：​​

- 直接修改配置对象属性
- 测试不同条件下的行为
- 测试完成后最好重置配置状态

## 测试类(Class)

### 核心概念

类测试的重点：

- 实例化测试：验证构造函数正确性
- 方法测试：测试公共方法的行为
- 状态测试：验证内部状态变化
- 边界测试：测试异常情况和边界值

### 测试策略

假设有一个类 User：

```js
// user.js
class User {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  getAge() {
    return this.age;
  }
}
```

测试用例

```js
// user.class.test.js
import { it, expect, describe } from 'vitest';
import { User } from './user';

describe('User类测试', () => {
  it('正确返回用户年龄', () => {
    // 1. 创建测试实例
    const user = new User('John Doe', 30);

    // 2. 测试方法
    expect(user.getAge()).toBe(30);
  });

  it('构造函数正确设置属性', () => {
    const user = new User('Alice', 25);
    expect(user.name).toBe('Alice');
    expect(user.age).toBe(25);
  });
});
```

关键点：​​

- 测试公共方法
- 验证构造函数是否正确初始化
- 可以测试边界情况和异常处理

## 测试常量

### 核心概念

常量测试的场景：

- 业务逻辑影响：常量直接影响程序行为
- 模块模拟：使用模块级别的 Mock
- 部分替换：只替换需要的常量，保留其他导出
- 配置切换：测试不同配置下的行为

### 测试策略

虽然常量通常不需要测试，但当它们影响业务逻辑时，我们可以使用模块模拟技术。

示例代码:

假设你有一个常量类 config：

config.js

```js
const config = {
  name: 'xzx',
  name: 18,
};

export default config;
```

```js
import { name } from './config';

export function tellName() {
  return name + '-hahaha';
}
```

测试用例:

```js
import { it, expect, describe, vi } from "vitest";
import { tellName } from "./use-variable";
import { name, gold } from "./config";

vi.mock("./config", async (importOriginal) => {
  const obj = await importOriginal() as any // 源文件的对象
  return { ...obj, name: "xiaohong" }; // 只改源文件的name值
});

describe("使用变量的形式", () => {
  it("tell name ", () => {
    console.log(gold);
    // when
    const name = tellName();

    // then
    expect(name).toBe("xiaohong-heiheihei");
  });
});
```

关键点：​​

- 使用 vi.mock 部分模拟模块
- 保留不需要修改的原始导出
- 可以测试常量在业务逻辑中的使用

## 环境变量测试详解

### 核心概念

环境变量是应用配置的核心，包括：

- 配置管理：API 地址、数据库连接等
- 环境区分：开发、测试、生产环境
- 功能开关：控制特定功能启用/禁用
- 敏感信息：密钥、认证信息等

### 测试策略

获取方式

```js
// Vite 项目
const apiUrl = import.meta.env.VITE_API_URL;
const mode = import.meta.env.MODE;

// Node.js 环境
const dbUrl = process.env.DATABASE_URL;
```

基础环境变量管理

```js
export class EnvironmentConfig {
  static getApiUrl() {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

  static isProduction() {
    return import.meta.env.PROD === true;
  }

  static getFeatureFlags() {
    return {
      enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
      maxRetries: parseInt(import.meta.env.VITE_MAX_RETRIES || '3', 10),
    };
  }
}
```

测试用例

```js
describe('环境变量测试', () => {
  beforeEach(() => {
    vi.unstubAllEnvs(); // 清除环境变量模拟
  });

  it('获取API URL', () => {
    vi.stubEnv('VITE_API_URL', 'https://api.production.com');
    expect(EnvironmentConfig.getApiUrl()).toBe('https://api.production.com');
  });

  it('使用默认值', () => {
    expect(EnvironmentConfig.getApiUrl()).toBe('http://localhost:3000/api');
  });

  it('解析功能开关', () => {
    vi.stubEnv('VITE_ENABLE_ANALYTICS', 'true');
    vi.stubEnv('VITE_MAX_RETRIES', '5');

    const flags = EnvironmentConfig.getFeatureFlags();
    expect(flags.enableAnalytics).toBe(true);
    expect(flags.maxRetries).toBe(5);
  });

  // 多环境配置测试
  it.each([
    ['development', 'http://dev.api.com', false],
    ['production', 'https://prod.api.com', true],
  ])('%s 环境配置', (env, apiUrl, isProd) => {
    vi.stubEnv('MODE', env);
    vi.stubEnv('VITE_API_URL', apiUrl);
    vi.stubEnv('PROD', isProd);

    expect(EnvironmentConfig.getApiUrl()).toBe(apiUrl);
    expect(EnvironmentConfig.isProduction()).toBe(isProd);
  });
});
```

环境变量验证器

```js
export class EnvironmentValidator {
  static parseBoolean(value, defaultValue = false) {
    if (!value) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  static parseInt(value, defaultValue = 0) {
    if (!value) return defaultValue;
    const parsed = parseInt(value, 10);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  static validateEnum(value, validValues, defaultValue) {
    return validValues.includes(value) ? value : defaultValue;
  }
}

// 测试验证器
describe('环境变量验证器', () => {
  it.each([
    ['true', true],
    ['false', false],
    [undefined, false],
  ])('解析布尔值 %s -> %s', (input, expected) => {
    expect(EnvironmentValidator.parseBoolean(input)).toBe(expected);
  });
});
```

## 全局变量和 Window 对象测试详解

### 核心概念

浏览器全局对象包括：

- Navigator：浏览器信息和功能检测
- Location：URL 相关操作
- Storage：localStorage、sessionStorage
- Console：日志输出

### 测试策略

```js
export class BrowserDetector {
  static isMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    return /android|iphone|ipad/i.test(userAgent);
  }

  static getLanguage() {
    return navigator.language || 'en-US';
  }

  static isOnline() {
    return navigator.onLine;
  }
}

export class UrlManager {
  static getCurrentUrl() {
    return window.location.href;
  }

  static getQueryParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name);
  }
}
```

测试用例

```js
describe('全局变量测试 - Vitest 官方API', () => {
  afterEach(() => {
    vi.unstubAllGlobals(); // 清理所有全局变量模拟
  });

  describe('Navigator 对象测试', () => {
    it('检测移动设备', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_5_1)',
        language: 'zh-CN',
        onLine: true,
      });

      expect(BrowserDetector.isMobile()).toBe(true);
      expect(BrowserDetector.getLanguage()).toBe('zh-CN');
      expect(BrowserDetector.isOnline()).toBe(true);
    });

    it('检测桌面设备', () => {
      vi.stubGlobal('navigator', {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
        language: 'en-US',
      });

      expect(BrowserDetector.isMobile()).toBe(false);
      expect(BrowserDetector.getLanguage()).toBe('en-US');
    });
  });

  describe('Location 对象测试', () => {
    it('获取URL信息', () => {
      vi.stubGlobal('location', {
        href: 'https://example.com/path?param=value#section',
        search: '?param=value',
      });

      expect(UrlManager.getCurrentUrl()).toBe(
        'https://example.com/path?param=value#section'
      );
      expect(UrlManager.getQueryParam('param')).toBe('value');
    });

    it('处理无查询参数的情况', () => {
      vi.stubGlobal('location', {
        href: 'https://example.com/',
        search: '',
      });

      expect(UrlManager.getQueryParam('nonexistent')).toBe(null);
    });
  });
});
```

## 间接层和依赖注入测试详解

### 核心概念

依赖注入解决的问题：

- 控制反转：对象不自己创建依赖
- 接口隔离：依赖抽象而非具体实现
- 可测试性：便于注入 mock 对象,减少模块间直接依赖

### 测试策略

#### 控制反转：对象不自己创建依赖

❌ 问题代码（紧耦合）：

```js
// 用户组件自己创建依赖
class UserProfile {
  constructor(userId) {
    this.userId = userId;
    // 组件内部直接创建依赖 - 紧耦合
    this.apiClient = new ApiClient('https://api.example.com');
    this.logger = new ConsoleLogger();
    this.storage = new LocalStorageManager();
  }

  async loadUser() {
    this.logger.log('Loading user...');
    const user = await this.apiClient.get(`/users/${this.userId}`);
    this.storage.set('currentUser', user);
    return user;
  }
}

// 测试困难 - 无法控制依赖
test('用户加载', () => {
  const profile = new UserProfile(1);
  // 😱 实际会发送真实的HTTP请求！
  // 😱 会使用真实的localStorage！
  // 😱 会输出真实的console日志！
});
```

✅ 解决方案（控制反转）：

```js
// 依赖从外部注入
class UserProfile {
  constructor(userId, apiClient, logger, storage) {
    this.userId = userId;
    this.apiClient = apiClient; // 外部注入
    this.logger = logger; // 外部注入
    this.storage = storage; // 外部注入
  }

  async loadUser() {
    this.logger.log('Loading user...');
    const user = await this.apiClient.get(`/users/${this.userId}`);
    this.storage.set('currentUser', user);
    return user;
  }
}

// 测试简单 - 完全控制依赖
test('用户加载', async () => {
  const mockApiClient = {
    get: vi.fn().mockResolvedValue({ id: 1, name: 'John' }),
  };
  const mockLogger = { log: vi.fn() };
  const mockStorage = { set: vi.fn() };

  const profile = new UserProfile(1, mockApiClient, mockLogger, mockStorage);
  const user = await profile.loadUser();

  expect(user.name).toBe('John');
  expect(mockLogger.log).toHaveBeenCalledWith('Loading user...');
});
```

#### 接口隔离：依赖抽象而非具体实现

❌ 问题代码（依赖具体实现）：

```js
// 购物车直接依赖具体的支付实现
class ShoppingCart {
  constructor() {
    this.items = [];
    // 直接依赖支付宝 - 难以扩展
    this.paymentService = new AlipayService();
  }

  async checkout() {
    const total = this.calculateTotal();
    // 只能用支付宝支付
    return await this.paymentService.pay(total);
  }
}

class AlipayService {
  async pay(amount) {
    // 支付宝支付逻辑
    return { status: 'success', method: 'alipay' };
  }
}
```

✅ 解决方案（接口隔离）：

```js
// 定义支付接口
class PaymentInterface {
  async pay(amount) {
    throw new Error('Must implement pay method');
  }
}

// 具体支付实现
class AlipayService extends PaymentInterface {
  async pay(amount) {
    console.log(`支付宝支付: ¥${amount}`);
    return { status: 'success', method: 'alipay', amount };
  }
}

class WechatPayService extends PaymentInterface {
  async pay(amount) {
    console.log(`微信支付: ¥${amount}`);
    return { status: 'success', method: 'wechat', amount };
  }
}

class CreditCardService extends PaymentInterface {
  async pay(amount) {
    console.log(`信用卡支付: ¥${amount}`);
    return { status: 'success', method: 'credit-card', amount };
  }
}

// 购物车依赖抽象接口
class ShoppingCart {
  constructor(paymentService) {
    this.items = [];
    this.paymentService = paymentService; // 依赖抽象接口
  }

  addItem(item) {
    this.items.push(item);
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }

  async checkout() {
    const total = this.calculateTotal();
    return await this.paymentService.pay(total);
  }
}

// 测试 - 可以注入任何支付方式
describe('购物车支付测试', () => {
  it('支持不同支付方式', async () => {
    const items = [
      { name: '商品1', price: 100 },
      { name: '商品2', price: 200 },
    ];

    // 测试支付宝
    const alipayCart = new ShoppingCart(new AlipayService());
    items.forEach((item) => alipayCart.addItem(item));
    const alipayResult = await alipayCart.checkout();
    expect(alipayResult.method).toBe('alipay');

    // 测试微信支付
    const wechatCart = new ShoppingCart(new WechatPayService());
    items.forEach((item) => wechatCart.addItem(item));
    const wechatResult = await wechatCart.checkout();
    expect(wechatResult.method).toBe('wechat');
  });
});
```

#### 可测试性：便于注入 mock 对象

❌ 问题代码（难以测试）：

```js
// 文件上传组件 - 难以测试
class FileUploader {
  constructor() {
    this.uploadUrl = 'https://api.example.com/upload';
  }

  async uploadFile(file) {
    // 直接使用fetch - 测试时会发送真实请求
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(this.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Upload failed');
    }

    return await response.json();
  }
}

// 测试困难
test('文件上传', async () => {
  const uploader = new FileUploader();
  const file = new File(['content'], 'test.txt');

  // 😱 这会发送真实的HTTP请求！
  // 😱 需要模拟整个fetch API！
  const result = await uploader.uploadFile(file);
});
```

✅ 解决方案（可测试）：

```js
// 可测试的文件上传组件
class FileUploader {
  constructor(httpClient, progressCallback = null) {
    this.httpClient = httpClient;
    this.progressCallback = progressCallback;
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
      this.progressCallback?.(0);

      const result = await this.httpClient.post('/upload', formData, {
        onUploadProgress: (progress) => {
          this.progressCallback?.((progress.loaded / progress.total) * 100);
        },
      });

      this.progressCallback?.(100);
      return result;
    } catch (error) {
      throw new Error(`Upload failed: ${error.message}`);
    }
  }
}

// HTTP客户端接口
class HttpClient {
  async post(url, data, config = {}) {
    throw new Error('Must implement post method');
  }
}

// 真实实现
class AxiosHttpClient extends HttpClient {
  async post(url, data, config = {}) {
    const response = await axios.post(url, data, config);
    return response.data;
  }
}

// 测试简单明了
describe('文件上传测试', () => {
  it('成功上传文件', async () => {
    const mockHttpClient = {
      post: vi.fn().mockImplementation(async (url, data, config) => {
        // 模拟上传进度回调
        if (config?.onUploadProgress) {
          // 模拟渐进式上传进度
          config.onUploadProgress({ loaded: 0, total: 100 });
          config.onUploadProgress({ loaded: 30, total: 100 });
          config.onUploadProgress({ loaded: 70, total: 100 });
          config.onUploadProgress({ loaded: 100, total: 100 });
        }

        // 返回上传结果
        return {
          fileId: '123',
          url: 'https://cdn.example.com/file123.jpg',
        };
      }),
    };

    const progressMock = vi.fn();
    const uploader = new FileUploader(mockHttpClient, progressMock);
    const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });

    const result = await uploader.uploadFile(file);

    // 验证返回结果
    expect(result.fileId).toBe('123');
    expect(mockHttpClient.post).toHaveBeenCalledWith(
      '/upload',
      expect.any(FormData),
      expect.objectContaining({
        onUploadProgress: expect.any(Function),
      })
    );
    // 验证进度回调被正确调用
    expect(progressMock).toHaveBeenCalledTimes(6); // 0 + 4次模拟进度 + 100
    expect(progressMock).toHaveBeenNthCalledWith(1, 0); // 开始
    expect(progressMock).toHaveBeenNthCalledWith(2, 0); // 0%
    expect(progressMock).toHaveBeenNthCalledWith(3, 30); // 30%
    expect(progressMock).toHaveBeenNthCalledWith(4, 70); // 70%
    expect(progressMock).toHaveBeenNthCalledWith(5, 100); // 100%
    expect(progressMock).toHaveBeenNthCalledWith(6, 100); // 完成
  });

  it('处理上传失败', async () => {
    const mockHttpClient = {
      post: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    const uploader = new FileUploader(mockHttpClient);
    const file = new File(['content'], 'test.txt');

    await expect(uploader.uploadFile(file)).rejects.toThrow(
      'Upload failed: Network error'
    );
  });
});
```

## 总结

## 测试方法对比表

| 间接输入类型  | 核心技巧     | 主要 API                               | 适用场景                 | 注意事项                                       |
| ------------- | ------------ | -------------------------------------- | ------------------------ | ---------------------------------------------- |
| **第三方库**  | 模拟整个模块 | `vi.mock`, `vi.mocked`                 | axios、lodash 等外部库   | 验证调用参数和次数                             |
| **配置对象**  | 直接修改属性 | 属性赋值                               | 功能开关、配置管理       | 测试后重置状态                                 |
| **类(Class)** | 依赖注入     | 构造函数注入                           | 业务服务类、工具类       | 测试公共接口，避免测试私有方法                 |
| **常量**      | 部分模块模拟 | `vi.mock`部分模拟                      | 配置常量、枚举值         | 保留其他导出不变                               |
| **环境变量**  | 环境变量模拟 | `vi.stubEnv`, `vi.unstubAllEnvs`       | 多环境配置、功能开关     | 测试后清理，验证默认值                         |
| **全局变量**  | 全局变量模拟 | `vi.stubGlobal`, `vi.unstubAllGlobals` | 浏览器 API、Window 对象  | 优先官方 API，复杂场景用 Object.defineProperty |
| **依赖注入**  | 控制反转容器 | DI 容器模式                            | 复杂依赖关系、企业级应用 | 单例 vs 瞬态，接口隔离                         |
