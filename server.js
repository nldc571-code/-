const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const os = require("node:os");

const root = __dirname;
const port = Number(process.env.PORT || 8787);
const rooms = new Map();
const clients = new Map();
const characterIds = ["scout", "vanguard", "medic", "engineer"];
const bossIds = ["overlord", "stalker", "magician"];

function characterFor(value) {
  return characterIds.includes(value) ? value : "scout";
}

const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
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

function roomCapacity(mode) {
  if (mode === "team") return 6;
  if (mode === "chaos") return 5;
  if (mode === "boss") return 5;
  return 2;
}

function publicRoom(room) {
  return {
    code: room.code,
    mode: room.mode,
    maxPlayers: room.maxPlayers,
    started: room.started,
    selectingCharacters: Boolean(room.selectingCharacters),
    players: room.players.map((player) => ({
      id: player.id,
      name: player.name,
      role: player.role,
      team: player.team,
      bot: Boolean(player.bot),
      character: player.character || "scout",
      boss: Boolean(player.boss),
      connected: !player.bot && !player.socket.destroyed,
    })),
  };
}

function encodeFrame(text) {
  const payload = Buffer.from(text);
  if (payload.length < 126) return Buffer.concat([Buffer.from([0x81, payload.length]), payload]);
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
  for (let i = 0; i < payload.length; i += 1) unmasked[i] = payload[i] ^ mask[i % 4];
  return unmasked.toString("utf8");
}

function sendJson(socket, data) {
  if (!socket.destroyed) socket.write(encodeFrame(JSON.stringify(data)));
}

function broadcastRoom(room, message, exceptSocket = null) {
  room.players.forEach((player) => {
    if (!player.bot && player.socket !== exceptSocket) sendJson(player.socket, message);
  });
}

function broadcastLobby(room) {
  broadcastRoom(room, { type: "roomUpdate", room: publicRoom(room) });
}

function clientRoom(socket) {
  const info = clients.get(socket);
  return info ? rooms.get(info.code) : null;
}

function relay(socket, message) {
  const room = clientRoom(socket);
  if (!room) return;
  broadcastRoom(room, message, socket);
}

function nextTeam(room) {
  if (room.mode !== "team") return null;
  const red = room.players.filter((player) => player.team === "A").length;
  const blue = room.players.filter((player) => player.team === "B").length;
  return red <= blue ? "A" : "B";
}

function addPlayer(room, socket, role, bot = false, character = "scout") {
  const index = room.players.length + 1;
  const wantsBoss = false;
  const player = {
    id: bot ? `bot-${Date.now()}-${index}` : crypto.randomUUID(),
    socket,
    role,
    bot,
    boss: wantsBoss,
    character: characterFor(character),
    characterSelected: false,
    name: bot ? `人机 ${index}` : role === "host" ? "房主" : `玩家 ${index}`,
    team: room.mode === "boss" ? (wantsBoss ? "B" : "A") : nextTeam(room),
  };
  room.players.push(player);
  if (!bot) clients.set(socket, { code: room.code, role, playerId: player.id });
  return player;
}

function removeClient(socket) {
  const info = clients.get(socket);
  if (!info) return;
  const room = rooms.get(info.code);
  if (room) {
    room.players = room.players.filter((player) => player.bot || player.socket !== socket);
    const hostGone = info.role === "host";
    const firstHuman = room.players.find((player) => !player.bot);
    if (hostGone && firstHuman) {
      firstHuman.role = "host";
      firstHuman.name = "房主";
      const firstInfo = clients.get(firstHuman.socket);
      if (firstInfo) firstInfo.role = "host";
      sendJson(firstHuman.socket, { type: "hostChanged" });
    }
    if (room.players.some((player) => !player.bot)) {
      broadcastRoom(room, { type: "error", message: "有玩家断开了连接" }, socket);
      broadcastLobby(room);
    } else {
      rooms.delete(info.code);
    }
  }
  clients.delete(socket);
}

function handleMessage(socket, message) {
  if (message.type === "createRoom") {
    const mode = ["duel", "team", "chaos", "boss"].includes(message.mode) ? message.mode : "duel";
    const code = makeCode();
    const room = { code, mode, maxPlayers: roomCapacity(mode), players: [], started: false, selectingCharacters: false };
    rooms.set(code, room);
    addPlayer(room, socket, "host", false, message.character);
    sendJson(socket, { type: "roomCreated", code, mode, playerId: clients.get(socket).playerId, room: publicRoom(room) });
    broadcastLobby(room);
    return;
  }

  if (message.type === "joinRoom") {
    const code = String(message.code || "").trim().toUpperCase();
    const room = rooms.get(code);
    if (!room) {
      sendJson(socket, { type: "error", message: "房间不存在" });
      return;
    }
    if (message.mode && message.mode !== room.mode) {
      sendJson(socket, { type: "error", message: "房间模式不匹配，请从相同模式加入" });
      return;
    }
    if (room.started) {
      sendJson(socket, { type: "error", message: "房间已经开始" });
      return;
    }
    if (room.players.length >= room.maxPlayers) {
      sendJson(socket, { type: "error", message: "房间已满" });
      return;
    }
    const player = addPlayer(room, socket, "guest", false, message.character);
    sendJson(socket, { type: "joined", code, mode: room.mode, playerId: player.id, room: publicRoom(room) });
    broadcastRoom(room, { type: "joined", code, mode: room.mode, room: publicRoom(room) }, socket);
    broadcastLobby(room);
    return;
  }

  if (message.type === "addBot") {
    const room = clientRoom(socket);
    const info = clients.get(socket);
    if (!room || info.role !== "host") return;
    if (room.players.length >= room.maxPlayers) {
      sendJson(socket, { type: "error", message: "房间已满，不能再加人机" });
      return;
    }
    addPlayer(room, null, "bot", true);
    broadcastLobby(room);
    return;
  }

  if (message.type === "removeBot") {
    const room = clientRoom(socket);
    const info = clients.get(socket);
    if (!room || info.role !== "host" || room.started) return;
    const before = room.players.length;
    room.players = room.players.filter((player) => !(player.bot && player.id === message.playerId));
    if (room.players.length !== before) broadcastLobby(room);
    return;
  }

  if (message.type === "setCharacter") {
    const room = clientRoom(socket);
    const info = clients.get(socket);
    if (!room || !info || room.started || !room.selectingCharacters) return;
    const player = room.players.find((entry) => entry.id === info.playerId);
    if (!player) return;
    player.character = room.mode === "boss" && player.boss ? (bossIds.includes(message.character) ? message.character : "overlord") : characterFor(message.character);
    player.characterSelected = true;
    broadcastLobby(room);
    if (room.players.every((entry) => entry.bot || entry.characterSelected)) broadcastRoom(room, { type: "roomCharactersReady", room: publicRoom(room) });
    return;
  }

  if (message.type === "assignPlayer") {
    const room = clientRoom(socket);
    const info = clients.get(socket);
    if (!room || !info || info.role !== "host" || room.started) return;
    const player = room.players.find((entry) => entry.id === message.playerId);
    if (!player) return;
    if (room.mode === "boss") {
      const isBoss = message.assignment === "boss";
      if (isBoss && room.players.some((entry) => entry.id !== player.id && entry.boss)) {
        sendJson(socket, { type: "error", message: "本房间已经有一名 BOSS" });
        return;
      }
      player.boss = isBoss;
      player.team = isBoss ? "B" : "A";
      player.character = isBoss ? (bossIds.includes(player.character) ? player.character : "overlord") : characterFor(player.character);
    } else if (room.mode === "team" && ["A", "B"].includes(message.assignment)) {
      player.team = message.assignment;
    } else {
      return;
    }
    broadcastLobby(room);
    return;
  }

  if (message.type === "returnToLobby") {
    const room = clientRoom(socket);
    if (!room || !room.started) return;
    room.started = false;
    room.battle = null;
    broadcastRoom(room, { type: "roomReturnedToLobby", room: publicRoom(room) });
    return;
  }
  if (message.type === "startRoom") {
    const room = clientRoom(socket);
    const info = clients.get(socket);
    if (!room || info.role !== "host") return;
    if (!room.selectingCharacters) {
      if (room.mode === "boss") {
        const bossCount = room.players.filter((player) => player.boss).length;
        if (bossCount !== 1 || room.players.length < 2) {
          sendJson(socket, { type: "error", message: "BOSS 战需要恰好 1 名 BOSS 和至少 1 名生存者" });
          return;
        }
      }
      room.selectingCharacters = true;
      room.players.forEach((player, index) => { player.characterSelected = Boolean(player.bot); player.character = player.bot ? (player.boss ? bossIds[index % bossIds.length] : characterIds[index % characterIds.length]) : null; });
      broadcastRoom(room, { type: "roomCharacterSelection", room: publicRoom(room) });
      return;
    }
    if (!room.players.every((player) => player.bot || player.characterSelected)) {
      sendJson(socket, { type: "error", message: "请等待所有玩家确认角色" });
      return;
    }
    room.selectingCharacters = false;
    room.started = true;
    room.battle = message.battle || null;
    broadcastRoom(room, { type: "roomStarted", room: publicRoom(room), battle: room.battle });
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
  const accept = crypto.createHash("sha1").update(`${key}258EAFA5-E914-47DA-95CA-C5AB0DC85B11`).digest("base64");
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