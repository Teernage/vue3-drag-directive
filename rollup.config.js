import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

export default defineConfig([
  // 构建 JavaScript 文件配置
  {
    input: 'src/index.ts', // 入口文件
    output: [
      {
        file: 'dist/index.cjs.js', // CommonJS 格式输出文件
        format: 'cjs', // 输出格式为 CommonJS
        exports: 'named', // 重要：确保命名导出正确处理
        sourcemap: true, // 生成 source map 文件
      },
      {
        file: 'dist/index.esm.js', // ES Module 格式输出文件
        format: 'es', // 输出格式为 ES Module
        sourcemap: true, // 生成 source map 文件
      },
    ],
    external: ['vue'], // 将 Vue 标记为外部依赖，不打包进最终文件
    plugins: [
      nodeResolve(), // 解析 node_modules 中的模块
      typescript({
        tsconfig: './tsconfig.json', // 指定 TypeScript 配置文件
        declaration: false, // 不在这里生成类型声明文件，由单独的配置处理
        sourceMap: true, // 生成 TypeScript source map
      }),
      terser({
        compress: {
          drop_console: true, // 移除所有 console.* 调用
          drop_debugger: true, // 移除 debugger 语句
          // 或者更精细的控制
          pure_funcs: ['console.log', 'console.info', 'console.debug'], // 只移除指定的函数
        },
      }),
    ],
  },
  // 构建 TypeScript 类型声明文件配置
  {
    input: 'src/index.ts', // 入口文件
    output: {
      file: 'dist/index.d.ts', // 类型声明文件输出路径
      format: 'es', // 输出格式
    },
    external: ['vue'], // 将 Vue 标记为外部依赖
    plugins: [
      dts(), // 生成 TypeScript 类型声明文件
    ],
  },
]);

/*
构建结果：
dist/
├── index.esm.js    // ES Module 版本 - 现代前端项目使用
├── index.cjs.js    // CommonJS 版本 - Node.js 环境使用  
└── index.d.ts      // TypeScript 类型声明 - 提供类型支持

使用场景：
1. 现代前端项目：import MyLib from 'my-lib' → 使用 index.esm.js
2. Node.js 项目：const MyLib = require('my-lib') → 使用 index.cjs.js
3. TypeScript 项目：自动获得完整的类型支持

对应 package.json 配置：
{
  "main": "dist/index.cjs.js",    // Node.js 默认入口
  "module": "dist/index.esm.js",  // ES Module 入口
  "types": "dist/index.d.ts",     // TypeScript 类型声明
  "files": ["dist"]               // 发布时包含的文件
}
*/
