# 📋 小计划 - 孩子周计划助手

AI 帮你为孩子制定每周计划，每日打卡养成好习惯。

## 功能

- **AI 智能规划**: 描述孩子的作息习惯，AI 自动生成合理的周计划
- **每日打卡**: 完成任务打个勾，星星鼓励，养成好习惯
- **进度可见**: 每周完成情况一目了然，家长轻松追踪
- **孩子管理**: 支持多个孩子，每个孩子独立计划

## 技术栈

- **框架**: Next.js 16 (App Router)
- **语言**: TypeScript
- **认证**: NextAuth.js (Auth.js)
- **数据库**: Vercel KV (Redis)
- **AI**: DeepSeek API
- **样式**: Tailwind CSS v4 + 自定义组件

## 快速开始

### 1. 配置环境变量

复制 `.env.example` 为 `.env.local`：

```bash
cp .env.example .env.local
```

在 [Vercel Dashboard](https://vercel.com) 创建 KV 数据库，获取连接信息填入。

在 [DeepSeek Platform](https://platform.deepseek.com) 注册获取 API Key。

生成 AUTH_SECRET：

```bash
openssl rand -base64 32
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

## 部署到 Vercel

1. 将代码推送到 GitHub 仓库
2. 在 [vercel.com](https://vercel.com) 导入仓库
3. 在项目设置中配置环境变量
4. 创建 Vercel KV 数据库并关联
5. 部署即可

## 使用流程

1. 注册账号 → 2. 添加孩子（填写信息、描述作息）
3. 输入本周安排 → AI 生成周计划
4. 每天打卡完成任务 → 查看进度
