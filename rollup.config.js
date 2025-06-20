import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

export default defineConfig([
  // 构建 JavaScript 文件配置
  {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        exports: 'named',
      },
      {
        file: 'dist/index.esm.js',
        format: 'es',
      },
      // 🆕 添加 UMD 格式 - CDN 使用必需
      {
        file: 'dist/index.umd.js',
        format: 'umd',
        name: 'VueDragList', // 全局变量名，要和你代码中的一致
        globals: {
          vue: 'Vue', // Vue 的全局变量名
        },
      },
      // 🆕 添加压缩版本的 UMD
      {
        file: 'dist/index.umd.min.js',
        format: 'umd',
        name: 'VueDragList',
        globals: {
          vue: 'Vue',
        },
        plugins: [
          terser({
            compress: {
              drop_console: true, // 去掉console
              pure_funcs: ['console.log'], // 删除所有console.log
            },
            mangle: true, // 混淆变量名
            format: {
              comments: false, // 去掉注释
            },
          }),
        ],
      },
    ],
    external: ['vue'],
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
      }),
      // 🔧 只对非 UMD 格式应用 terser
      // UMD 压缩版本在 output 中单独配置
    ],
  },

  // 构建 TypeScript 类型声明文件配置
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    external: ['vue'],
    plugins: [dts()],
  },
]);

/*
🎯 构建结果：
dist/
├── index.esm.js        // ES Module 版本 - 现代前端项目
├── index.cjs.js        // CommonJS 版本 - Node.js 环境
├── index.umd.js        // UMD 版本 - CDN 使用
├── index.umd.min.js    // UMD 压缩版本 - 生产环境 CDN
└── index.d.ts          // TypeScript 类型声明

📦 对应 package.json 配置：
{
"main": "dist/index.cjs.js",
"module": "dist/index.esm.js",
"browser": "dist/index.umd.js",
"types": "dist/index.d.ts",
"exports": {
  ".": {
    "import": "./dist/index.esm.js",
    "require": "./dist/index.cjs.js",
    "browser": "./dist/index.umd.js",
    "types": "./dist/index.d.ts"
  }
},
"files": ["dist"]
}

🌐 CDN 使用示例：
<script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
<script src="https://unpkg.com/your-package/dist/index.umd.min.js"></script>
*/
