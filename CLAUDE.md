# 项目记忆

## 执行规则

1. 严格按照 `docs/执行任务看板.md` 推进开发
2. **X.X 级任务**（如 0.1、1.2）完成后立即暂停，向用户汇报，等待指令
3. **X.X.X 级子任务**（如 0.1.1、0.1.2）在当前 X.X 组内连续执行，不停
4. 不得主动跳过 X.X 级任务

## 服务验证原则

**启动 dev server 后必须做 HTTP 健康检查，不能用 `lsof` 判断服务可用。**
`lsof` 查到端口被占用 ≠ 服务已就绪。正确做法：

1. 启动服务后 `sleep 2-3` 等待初始化
2. 用 `curl -s -o /dev/null -w "%{http_code}" http://localhost:<port>/` 验证 HTTP 200
3. 返回 200 才算真正跑起来，才能向用户说"服务就绪"
4. 若超时或非 200，检查日志、重试，或在汇报中明确说明当前状态

## 技术栈

- 后端：Java 17 + Spring Boot 3.x + Maven + MyBatis-Plus
- 前端：React 18 + TypeScript + Ant Design 5.x + Vite
- 数据库：MySQL 8.0
- 项目结构：Monorepo（server/ + client/）
