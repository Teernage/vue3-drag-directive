# 以"最少字段原则"设计全链路数据模型

## 前言

在前端开发过程中，经常遇到这样的场景：如何在大量日志记录与存储成本之间找到平衡点？如何设计一套能够快速定位问题且资源消耗最优的日志系统？本文将介绍一种基于"最少字段原则"的前端全链路日志数据结构设计方法，构建高效实用的监控系统。

## 最少字段原则

什么是"最少字段原则"？简单来说，就是在设计日志数据结构时，只记录那些确实能帮助我们快速发现和定位问题的字段，避免过度设计导致的资源浪费。这不仅能降低日志量和存储成本，还能提高问题定位的效率。

## 基础数据结构设计

基础数据类型是全链路日志中的通用数据，也是其他指标数据类型必备的字段。我们将基础数据分为五大类，共计 17 个属性字段：

1. 基本日志信息

```ts
type BaseTrace = {
  traceId: string;
  type: TraceTypes;
  createdAt: string;
  updatedAt: string;
};
```

这四个字段是链路日志的必要数据：

- traceId：链路日志的唯一标识，采用 UUID 生成法确保唯一性
- type：日志类型，采用 TraceTypes 枚举定义
- createdAt/updatedAt：创建和更新时间，用于判断用户页面停留时间 （用户进入页面时立即创建，页面卸载前最后更新一次）

```ts
enum TraceTypes {
  PAGE_VIEW = 'PageView',
  EVENT = 'EVENT',
  PERF = 'Perf',
  RESOURCE = 'Resource',
  ACTION = 'Action',
  FETCH = 'Fetch',
  CODE_ERROR = 'CodeError',
  CONSOLE = 'Console',
  CUSTOMER = 'Customer',
}
```

2. 浏览器信息

```ts
enum BrowserType {
  MOBILE = 'mobile',
  PC = 'pc',
  WEBVIEW = 'webview',
  MINI_PROGRAM = 'miniProgram',
}

type BaseBrowserTrace = {
  ua: string;
  bt: BrowserType;
};
```

这两个字段帮助我们快速判断用户的访问场景：

- ua：UserAgent，用于判断用户使用的浏览器环境
- bt：BrowserType，预定义的浏览器类型枚举

3. 页面信息

```ts
type BasePageTrace = {
  pid: string;
  title?: string;
  url: string;
};
```

这些字段帮助我们定位问题发生的具体页面：

- pid：pageId 的简写，页面 ID，用于关联同一次页面访问的所有链路日志

  现在的前端项目都是基于 Vue 或 React 技术栈，最终的效果大部分都是 SPA 单页面。也就是说，用户使用我们的前端产品页面时，通常都是加载页面一次后就不会加载第二次了，页面的切换都是采用静态路由方式进行的。而 pid 的设计方案是从用户输入网址访问页面加载成功后，直到下一次重新刷新页面前，这个时间周期范围内，只生成一次 UUID 值。我们试想想，假设用户访问前端页面时，经过多次的交互，产生了多条链路日志，那如果我们要了解这个用户的所有链路日志，该怎么查询呢？pid 就是为这种场景来设计的，它能帮助我们快速查询某个用户当前访问一次前端页面时的所有链路日志，从而帮助前端同学判断用户在使用前端页面过程中有没有异常。

- title：页面标题（可选）
- url：页面 URL，用于定位问题页面

4. 用户信息

```ts
type BaseUserTrace = {
  fpId: string;
  uid?: string | number;
  userName?: string;
  email?: string;
};
```

用户相关信息字段：

- fpId：指纹 ID，用于关联同一用户的登录前后操作日志
- uid/userName/email：用户标识（均为可选）

5. 业务信息

```ts
enum TraceLevelType {
  error = 'error',
  warn = 'warn',
  info = 'info',
  debug = 'debug',
}

enum TraceClientTypes {
  ANDROID_H5 = 'android',
  IOS_H5 = 'ios',
  PC_H5 = 'pc',
  BROWSER_H5 = 'browser',
}

type BaseAppTrace = {
  appId: string;
  appName?: string;
  clientType: TraceClientTypes;
  level: TraceLevelType;
};
```

业务相关字段：

- appId：应用 ID，区分不同前端项目
- appName：应用名称（可选）
- clientType：客户端类型
- level：问题级别

### 组合基础数据类型

将以上五种类型组合成最终的基础数据类型：

```ts
type BaseTraceInfo = BaseTrace &
  BaseBrowserTrace &
  BaseUserTrace &
  BaseAppTrace &
  BasePageTrace;
```

### 数据结构使用示例

```js
const exampleBaseData: BaseTraceInfo = {
  traceId: '0bdf6c8e-25c8-427d-847a-9950318a2e14',
  level: TraceLevelType.warn,
  type: TraceTypes.ACTION,
  ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  bt: BrowserType.MOBILE,
  fpId: 'c77a37f4',
  uid: 1002,
  appId: 'geekbang-app',
  clientType: TraceClientTypes.iOS_H5,
  pid: '088c8a92-5a24-4144-9c37-310848c397e1',
  url: 'https://time.geekbang.org/',
  createdAt: '',
  updatedAt: '',
};
```

## 实际应用场景

### 场景一：定位用户报错问题

假设用户反馈在报名页面点击按钮无响应。通过查看链路日志，我们发现：

1. 通过 bt 字段看到用户是在小程序中打开的页面
2. 通过 ua 字段确认不是在微信内打开
3. 问题定位：小程序环境下功能有 bug (看 bt 字段（浏览器类型）：日志显示用户的操作发生在小程序环境中。进一步通过 ua 字段（UserAgent）：确认问题不是发生在普通浏览器或者微信内浏览器中，而是特定的小程序环境。)

### 场景二：追踪用户行为链路

某用户在使用过程中遇到问题，我们需要分析其操作流程：

1. 通过 pid 字段找到用户当次访问的所有链路日志
2. 通过 fpId 关联用户登录前后的所有操作
3. 通过 createdAt 和 updatedAt 分析用户停留时间
4. 通过 type 字段筛选不同类型的日志（如 ACTION、FETCH 等）
5. 最终完整还原用户操作链路，定位问题根源

## 结论与思考

设计前端全链路日志数据结构时，"最少字段原则"是一个值得遵循的指导思想。17 个基础字段基本能覆盖大多数场景下的问题定位需求，但具体业务场景可能需要适当扩展。

在设计过程中，始终记住一点：日志字段的设计应当以解决问题为导向，而非仅仅是记录异常。过度设计不仅会增加存储成本，还可能使真正重要的信息被大量无用数据淹没。
