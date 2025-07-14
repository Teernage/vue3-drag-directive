import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import dts from 'rollup-plugin-dts';

// terser 配置 - 提取为常量以避免重复
const terserOptions = {
  compress: {
    pure_getters: true,
    unsafe: true,
    unsafe_comps: true,
    drop_console: true,
    passes: 2, // 多次压缩可以进一步减小体积
  },
  mangle: true, // 混淆变量名
  format: {
    comments: false, // 去掉注释
  },
};

export default [
  // 构建 JavaScript 文件配置
  {
    input: 'src/index.ts',
    output: [
      // ESM 格式 - 压缩版本
      {
        file: 'dist/index.esm.min.js',
        format: 'es',
        plugins: [terser(terserOptions)],
      },
      // // CommonJS 格式 - 压缩
      // {
      //   file: 'dist/index.cjs.js',
      //   format: 'cjs',
      //   exports: 'named',
      //   plugins: [terser(terserOptions)],
      // },
      // // UMD 格式 - 压缩
      // // {
      // //   file: 'dist/index.umd.min.js',
      // //   format: 'umd',
      // //   name: 'VueDragList',
      // //   globals: {
      // //     vue: 'Vue',
      // //   },
      // //   plugins: [terser(terserOptions)],
      // // },
    ],
    external: ['vue'],
    plugins: [
      nodeResolve(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: false,
        // 启用 removeComments 以减少体积
        compilerOptions: {
          removeComments: true,
        },
      }),
    ],
    // 添加 treeshake 配置以更积极地移除未使用的代码
    treeshake: {
      moduleSideEffects: false,
      propertyReadSideEffects: false,
      tryCatchDeoptimization: false,
    },
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
];

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
