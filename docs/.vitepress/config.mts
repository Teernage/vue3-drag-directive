import { defineConfigWithTheme } from 'vitepress';
import escookConfig from '@escook/vitepress-theme/config';

export default defineConfigWithTheme({
  extends: escookConfig,
  title: '不一样的少年~',
  base: '/blog/',
  appearance: 'dark',
  head: [['link', { rel: 'icon', href: '/blog/img/icon.svg' }]],
  themeConfig: {
    musicBall: {
      src: '/blog/mp3/永远同在.mp3',
      autoplay: true,
      loop: true,
    },
    nav: [
      { text: '首页', link: '/' },
      { text: '浏览器工作原理', link: '/docs/font/HowBrowsersWork/history' },
    ],

    sidebar: {
      '/': [
        {
          text: '浏览器工作原理',
          items: [
            {
              text: '浏览器视角:页面是如何从 0 到 1 加载的',
              link: '/docs/font/HowBrowsersWork/pageLoading',
            },
          ],
        },
      ],
      '/docs/font/HowBrowsersWork': [
        {
          text: '浏览器工作原理',
          items: [
            {
              text: '浏览器进化史',
              link: '/docs/font/HowBrowsersWork/history',
            },
            {
              text: '浏览器视角:页面是如何从 0 到 1 加载的',
              link: '/docs/font/HowBrowsersWork/pageLoading',
            },
            { text: '网络', link: '/docs/font/HowBrowsersWork/newtWork' },
            {
              text: '浏览器缓存',
              link: '/docs/font/HowBrowsersWork/browserCache',
            },
            {
              text: '浏览器中的js执行机制',
              link: '/docs/font/HowBrowsersWork/JsExecutionMechanism',
            },
            { text: 'v8工作原理', link: '/docs/font/HowBrowsersWork/v8' },
            {
              text: '消息队列和事件循环',
              link: '/docs/font/HowBrowsersWork/eventQuene',
            },
            {
              text: '分层和合成机制',
              link: '/docs/font/HowBrowsersWork/layeredComposition',
            },
            {
              text: '浏览器渲染帧',
              link: '/docs/font/HowBrowsersWork/renderingFrames',
            },
            {
              text: '浏览器分配渲染进程的机制',
              link: '/docs/font/HowBrowsersWork/allocation',
            },
            {
              text: '页面性能优化',
              link: '/docs/font/HowBrowsersWork/performanceOptimization',
            },
            {
              text: 'Chrome开发者工具',
              link: '/docs/font/HowBrowsersWork/chromeDeveloperTools',
            },
            {
              text: '浏览器安全',
              link: '/docs/font/HowBrowsersWork/BrowserSecurity',
            },
            {
              text: '插件进程的本质与Service Worker 的运行机制',
              link: '/docs/font/HowBrowsersWork/chromeExtensionProcessAndSw',
            },
          ],
        },
      ],
      '/docs/font/v8': [
        {
          text: 'v8引擎',
          items: [
            { text: '设计思想', link: '/docs/font/v8/designIdea' },
            { text: '编译流水--运行环境', link: '/docs/font/v8/runtime' },
            { text: '编译流水--代码执行过程', link: '/docs/font/v8/codeExecutionProcess' },
            { text: '编译流水--v8解析编译', link: '/docs/font/v8/parsingCompilation' },
            { text: '编译流水--v8对象结构与优化', link: '/docs/font/v8/objectOptimization' },
            { text: '事件循环和垃圾回收', link: '/docs/font/v8/eventLoopAndGarbageCollection' },
          ],
        },
      ],
      '/docs/font/vue': [
        {
          text: 'vue框架原理分析',
          items: [
            { text: '权衡的艺术', link: '/docs/font/vue/artOfBalance' },
            { text: '框架设计的核心要素', link: '/docs/font/vue/frameworkCore' },
            { text: 'vue3设计思路', link: '/docs/font/vue/designConcept' },
            { text: '响应式系统', link: '/docs/font/vue/reactiveSystem' },
            { text: '非原始值的响应式方案', link: '/docs/font/vue/nonPrimitiveReactive' },
            { text: '原始值的响应式方案', link: '/docs/font/vue/primitiveReactive' },
            { text: '渲染器', link: '/docs/font/vue/renderer' },
            { text: 'diff算法', link: '/docs/font/vue/diff' },
            { text: '组件化', link: '/docs/font/vue/componentization' },
            { text: '编译器', link: '/docs/font/vue/compiler' },
            { text: '编译优化', link: '/docs/font/vue/compilerOptimization' },
            { text: '服务端渲染', link: '/docs/font/vue/ssr' },

          ],
        },
      ],
      '/docs/font/frontendEngineering': [
        {
          text: '前端工程化',
          items: [
            { text: '脚手架', link: '/docs/font/frontendEngineering/cli' },
            { text: 'gitlab CI/CD', link: '/docs/font/frontendEngineering/cicd' },
          ],
        },
      ],
      '/docs/font/designPattern': [
        {
          text: '前端工程化',
          items: [
            { text: '设计模式简介', link: '/docs/font/designPattern/introduction' },
            { text: '工厂模式', link: '/docs/font/designPattern/factory' },
            { text: '单例模式', link: '/docs/font/designPattern/singleton' },
            { text: '发布订阅模式', link: '/docs/font/designPattern/pubSub' },
            { text: '策略模式', link: '/docs/font/designPattern/strategy' },
            { text: '代理模式', link: '/docs/font/designPattern/proxy' },
            { text: '迭代器模式', link: '/docs/font/designPattern/Iterator' },
            { text: '外观模式', link: '/docs/font/designPattern/facade' },
            { text: '中介者模式', link: '/docs/font/designPattern/mediator' },
            { text: '访问者模式', link: '/docs/font/designPattern/visitor' },
            { text: '适配器模式', link: '/docs/font/designPattern/adapter' },
            { text: '责任链模式', link: '/docs/font/designPattern/chainOfResponsibility' },
            { text: '命令模式', link: '/docs/font/designPattern/command' },
            { text: '装饰器模式', link: '/docs/font/designPattern/decorator' },
            { text: 'vue3中的设计模式', link: '/docs/font/designPattern/design-patterns-in-vue3' },
          ],
        },
      ],
      '/docs/font/FrontEndFullLinkOptimization': [{
        text: '前端全链路优化',
        items: [
          { text: '理论基础', link: '/docs/font/FrontEndFullLinkOptimization/TheoreticalBasis' },
          { text: '全链路数据模型设计', link: '/docs/font/FrontEndFullLinkOptimization/MinimumFieldPrinciple' },
        ]
      }],
      '/docs/font/unitTest': [{
        text: '单元测试',
        items: [
          { text: 'API详解与实践技巧', link: '/docs/font/unitTest/ApiExplanation' },
          { text: 'vitest的调试技巧', link: '/docs/font/unitTest/DebugMode' },
          { text: '输入和模拟数据', link: '/docs/font/unitTest/InputsAndMocking' },
          { text: '外部依赖测试策略', link: '/docs/font/unitTest/TestingExternalDependencies' },
          { text: '状态验证和行为验证', link: '/docs/font/unitTest/BehaviorVsStateVerification' },
          { text: '异步测试', link: '/docs/font/unitTest/VitestAsynchronousTestingPractice' },

        ]
      }],
      '/docs/font/techMusings': [{
        text: '开发沉思',
        items: [
          { text: '多标签切换同步', link: '/docs/font/techMusings/MultiTabSwitchingSynchronization' },
          { text: '一条指令搞定丝滑拖拽列表', link: '/docs/font/techMusings/SmoothDragDropDirective' },
          { text: 'will-change的性能优化陷阱', link: '/docs/font/techMusings/WillChangPerformanceIssues' },
          { text: '浏览器插件实现多标签页数据同步机制', link: '/docs/font/techMusings/CrossTabSyncManager' },
          { text: '一套队列机制+多级兜底全搞定前端图片组件', link: '/docs/font/techMusings/ImageComponentSolution' },

        ]
      }],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' },
    ],
  },
});
