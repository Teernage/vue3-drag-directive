# Vue3 Drag Directive 文档

这是 Vue3 Drag Directive 的官方文档，使用 VitePress 构建。

## 本地开发

### 安装依赖

```bash
cd docs
npm install
```

### 启动开发服务器

```bash
npm run dev
```

这将启动一个本地开发服务器，通常在 `http://localhost:5173` 上可以访问。

### 构建文档

```bash
npm run build
```

构建后的静态文件将生成在 `.vitepress/dist` 目录中。

### 预览构建结果

```bash
npm run preview
```

## 部署

文档会通过 GitHub Actions 自动部署到 GitHub Pages。每当有代码推送到 `main` 分支时，都会触发部署流程。

你也可以在 GitHub 仓库的 Actions 标签页中手动触发部署。

## 文档结构

```
docs/
├── .vitepress/          # VitePress 配置
│   └── config.ts        # 主要配置文件
├── guide/               # 指南文档
│   ├── index.md         # 介绍
│   ├── getting-started.md  # 快速开始
│   ├── basic-usage.md   # 基础用法
│   └── advanced-usage.md  # 高级用法
├── components/          # 组件文档
│   └── index.md         # 拖拽列表组件
└── index.md             # 首页
```

## 贡献指南

1. 所有文档都使用 Markdown 格式编写
2. 图片应放在 `public` 目录下
3. 代码示例应确保可以正常运行
4. 提交前请确保文档能在本地正确构建和预览