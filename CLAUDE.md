# 项目记忆

## 执行规则

1. 严格按照 `docs/执行任务看板.md` 推进开发
2. **X.X 级任务**（如 0.1、1.2）完成后立即暂停，向用户汇报，等待指令
3. **X.X.X 级子任务**（如 0.1.1、0.1.2）在当前 X.X 组内连续执行，不停
4. 不得主动跳过 X.X 级任务

## 技术栈

- 后端：Java 17 + Spring Boot 3.x + Maven + MyBatis-Plus
- 前端：React 18 + TypeScript + Ant Design 5.x + Vite
- 数据库：MySQL 8.0
- 项目结构：Monorepo（server/ + client/）
