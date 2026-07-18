const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");

const port = 8792;
const server = spawn(process.execPath, ["server.js"], {
  env: { ...process.env, PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function openSocket() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
    const timer = setTimeout(() => reject(new Error("WebSocket connection timed out")), 4000);
    socket.addEventListener("open", () => { clearTimeout(timer); resolve(socket); }, { once: true });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("WebSocket connection failed")); }, { once: true });
  });
}

function nextMessage(socket, type) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for ${type}`)), 4000);
    const onMessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type !== type) return;
      clearTimeout(timer);
      socket.removeEventListener("message", onMessage);
      resolve(message);
    };
    socket.addEventListener("message", onMessage);
  });
}

(async () => {
  try {
    await delay(250);
    const host = await openSocket();
    const created = nextMessage(host, "roomCreated");
    const initialRoomUpdate = nextMessage(host, "roomUpdate");
    host.send(JSON.stringify({ type: "createRoom", mode: "team", character: "medic" }));
    const hostRoom = await created;
    await initialRoomUpdate;
    assert.equal(hostRoom.room.players[0].character, "medic", "房主角色没有写入房间");

    const guest = await openSocket();
    const joined = nextMessage(guest, "joined");
    const hostSawGuest = nextMessage(host, "roomUpdate");
    guest.send(JSON.stringify({ type: "joinRoom", code: hostRoom.code, character: "vanguard" }));
    const guestRoom = await joined;
    await hostSawGuest;
    assert.equal(guestRoom.room.players.find((player) => player.role === "guest").character, "vanguard", "加入者角色没有写入房间");

    const updated = nextMessage(host, "roomUpdate");
    host.send(JSON.stringify({ type: "addBot" }));
    const updatedRoom = await updated;
    assert.equal(updatedRoom.room.players.find((player) => player.role === "host").character, "medic", "房主角色同步丢失");
    assert.equal(updatedRoom.room.players.find((player) => player.role === "guest").character, "vanguard", "加入者角色同步丢失");
    const bot = updatedRoom.room.players.find((player) => player.bot);
    assert.ok(bot, "加入人机失败");


    const botRemoved = nextMessage(host, "roomUpdate");
    host.send(JSON.stringify({ type: "removeBot", playerId: bot.id }));
    const botRemovedRoom = await botRemoved;
    assert.equal(botRemovedRoom.room.players.some((player) => player.id === bot.id), false, "人机没有被删除");

    host.close();
    guest.close();
    console.log("online role selection test passed");
  } finally {
    server.kill();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});