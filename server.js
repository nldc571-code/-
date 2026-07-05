const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const os = require("node:os");

const root = __dirname;
const port = Number(process.env.PORT || 8787);
const rooms = new Map();
const clients = new Map();

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function sendFile(res, urlPath) {
  const safePath = path.normalize(decodeURIComponent(urlPath.split("?")[0])).replace(/^([/\\])+/, "");
  const filePath = path.join(root, safePath || "index.html");
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": mime[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

function makeCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  do {
    code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  } while (rooms.has(code));
  return code;
}

function encodeFrame(text) {
  const payload = Buffer.from(text);
  if (payload.length < 126) {
    return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
  }
  if (payload.length < 65536) {
    const header = Buffer.alloc(4);
    header[0] = 0x81;
    header[1] = 126;
    header.writeUInt16BE(payload.length, 2);
    return Buffer.concat([header, payload]);
  }
  const header = Buffer.alloc(10);
  header[0] = 0x81;
  header[1] = 127;
  header.writeBigUInt64BE(BigInt(payload.length), 2);
  return Buffer.concat([header, payload]);
}

function decodeFrame(buffer) {
  const opcode = buffer[0] & 0x0f;
  if (opcode === 0x8) return null;
  let offset = 2;
  let length = buffer[1] & 0x7f;
  if (length === 126) {
    length = buffer.readUInt16BE(offset);
    offset += 2;
  } else if (length === 127) {
    length = Number(buffer.readBigUInt64BE(offset));
    offset += 8;
  }
  const masked = (buffer[1] & 0x80) !== 0;
  let mask;
  if (masked) {
    mask = buffer.subarray(offset, offset + 4);
    offset += 4;
  }
  const payload = buffer.subarray(offset, offset + length);
  if (!masked) return payload.toString("utf8");
  const unmasked = Buffer.alloc(payload.length);
  for (let i = 0; i < payload.length; i += 1) {
    unmasked[i] = payload[i] ^ mask[i % 4];
  }
  return unmasked.toString("utf8");
}

function sendJson(socket, data) {
  if (!socket.destroyed) socket.write(encodeFrame(JSON.stringify(data)));
}

function otherClient(socket) {
  const info = clients.get(socket);
  if (!info) return null;
  const room = rooms.get(info.code);
  if (!room) return null;
  return info.role === "host" ? room.guest : room.host;
}

function relay(socket, message) {
  const other = otherClient(socket);
  if (other) sendJson(other, message);
}

function removeClient(socket) {
  const info = clients.get(socket);
  if (!info) return;
  const room = rooms.get(info.code);
  if (room) {
    if (room.host === socket) room.host = null;
    if (room.guest === socket) room.guest = null;
    const other = room.host || room.guest;
    if (other) sendJson(other, { type: "error", message: "对方已断开" });
    if (!room.host && !room.guest) rooms.delete(info.code);
  }
  clients.delete(socket);
}

function handleMessage(socket, message) {
  if (message.type === "createRoom") {
    const code = makeCode();
    rooms.set(code, { host: socket, guest: null });
    clients.set(socket, { code, role: "host" });
    sendJson(socket, { type: "roomCreated", code });
    return;
  }

  if (message.type === "joinRoom") {
    const code = String(message.code || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room || !room.host) {
      sendJson(socket, { type: "error", message: "房间不存在" });
      return;
    }
    if (room.guest && room.guest !== socket) {
      sendJson(socket, { type: "error", message: "房间已满" });
      return;
    }
    room.guest = socket;
    clients.set(socket, { code, role: "guest" });
    sendJson(room.host, { type: "joined", code });
    sendJson(socket, { type: "joined", code });
    return;
  }

  relay(socket, message);
}

const server = http.createServer((req, res) => {
  if (req.url === "/") return sendFile(res, "/index.html");
  return sendFile(res, req.url);
});

server.on("upgrade", (req, socket) => {
  if (req.url !== "/ws") {
    socket.destroy();
    return;
  }
  const key = req.headers["sec-websocket-key"];
  const accept = crypto
    .createHash("sha1")
    .update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`)
    .digest("base64");
  socket.write(
    "HTTP/1.1 101 Switching Protocols\r\n" +
      "Upgrade: websocket\r\n" +
      "Connection: Upgrade\r\n" +
      `Sec-WebSocket-Accept: ${accept}\r\n\r\n`,
  );
  socket.on("data", (buffer) => {
    const text = decodeFrame(buffer);
    if (!text) return;
    try {
      handleMessage(socket, JSON.parse(text));
    } catch (error) {
      sendJson(socket, { type: "error", message: "消息格式错误" });
    }
  });
  socket.on("close", () => removeClient(socket));
  socket.on("error", () => removeClient(socket));
});

server.listen(port, "0.0.0.0", () => {
  const addresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((item) => item && item.family === "IPv4" && !item.internal)
    .map((item) => `http://${item.address}:${port}`);
  console.log(`Room server running at http://localhost:${port}`);
  addresses.forEach((address) => console.log(`LAN: ${address}`));
});