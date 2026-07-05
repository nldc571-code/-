# 锤子剪刀布生存战 在线正式版

## 本地运行

双击 `启动联机服务器.bat`，或者运行：

```bash
npm start
```

本机打开：

```text
http://localhost:8787
```

## 正式上线推荐：Render

1. 把整个项目上传到 GitHub。
2. 打开 https://render.com 并登录。
3. New + -> Web Service。
4. 选择这个 GitHub 仓库。
5. 配置：
   - Environment: Node
   - Build Command: 留空或使用 `npm install`
   - Start Command: `npm start`
6. 部署完成后，Render 会给你一个公网网址。
7. 两个人都打开这个公网网址。
8. 房主点“创建房间”，把 4 位房间码发给对方。
9. 对方输入房间码，点“加入房间”。

## 注意

- Vercel/Netlify 的普通静态部署不适合这个版本，因为联机需要 WebSocket 长连接。
- Render、Railway、Fly.io、自己买的服务器都可以。
- 如果部署到 HTTPS 网站，前端会自动使用 `wss://` 连接。