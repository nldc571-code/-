const throws = {
  rock: { name: "锤子", icon: "✊", beats: "scissors" },
  scissors: { name: "剪刀", icon: "✌", beats: "paper" },
  paper: { name: "布", icon: "✋", beats: "rock" },
};

const locations = {
  playerHome: { name: "玩家家里", note: "你的出生点" },
  computerHome: { name: "电脑家里", note: "对手的出生点" },
  armory: { name: "军火库", note: "刀、盾、狙击枪" },
  tankBase: { name: "坦克基地", note: "可上坦克" },
  airBase: { name: "飞机基地", note: "可上飞机" },
  wild: { name: "野外", note: "开阔交战区" },
};

const items = {
  knife: { name: "刀" },
  shield: { name: "盾" },
  sniper: { name: "狙击枪" },
};

const vehicles = {
  plane: { name: "飞机", base: "airBase", maxHp: 1, damage: 2 },
  tank: { name: "坦克", base: "tankBase", maxHp: 2, damage: 1 },
};

const sniperSteps = [
  { key: "loaded", action: "loadSniper", label: "装弹" },
  { key: "chambered", action: "chamberSniper", label: "上膛" },
  { key: "aimedTarget", action: "aimSniper", label: "瞄准" },
  { key: "readyToFire", action: "fireSniper", label: "发射" },
];

const initialActor = (id, name, location) => ({
  id,
  name,
  asleep: true,
  dead: false,
  hp: 3,
  maxHp: 3,
  location,
  vehicle: null,
  skill: null,
  inventory: {
    knife: false,
    shield: false,
    shieldHp: 0,
    sniper: false,
  },
  sniper: {
    loaded: false,
    chambered: false,
    aimedTarget: null,
    aimedLocation: null,
    aimBroken: false,
  },
});

const initialState = () => ({
  phase: "duel",
  winner: null,
  round: 1,
  playerThrow: null,
  computerThrow: null,
  message: "选择出拳，争夺行动权",
  gameOver: false,
  vehicles: {
    plane: { id: "plane", location: "airBase", hp: vehicles.plane.maxHp, destroyed: false },
    tank: { id: "tank", location: "tankBase", hp: vehicles.tank.maxHp, destroyed: false },
  },
  actors: {
    player: initialActor("player", "玩家", "playerHome"),
    computer: initialActor("computer", "电脑", "computerHome"),
  },
  log: ["游戏开始：双方都在自己家里睡觉。"],
});

let state = initialState();
let gameMode = "ai";
let localActorId = "player";
let isHost = false;
let peer = null;
let channel = null;
let pendingThrows = {};

const els = {
  resetBtn: document.querySelector("#resetBtn"),
  roundResult: document.querySelector("#roundResult"),
  playerThrow: document.querySelector("#playerThrow"),
  computerThrow: document.querySelector("#computerThrow"),
  playerName: document.querySelector("#playerCard h2"),
  computerName: document.querySelector("#computerCard h2"),
  playerState: document.querySelector("#playerState"),
  computerState: document.querySelector("#computerState"),
  playerLocation: document.querySelector("#playerLocation"),
  computerLocation: document.querySelector("#computerLocation"),
  playerHp: document.querySelector("#playerHp"),
  computerHp: document.querySelector("#computerHp"),
  playerSkill: document.querySelector("#playerSkill"),
  computerSkill: document.querySelector("#computerSkill"),
  playerCard: document.querySelector("#playerCard"),
  computerCard: document.querySelector("#computerCard"),
  turnHint: document.querySelector("#turnHint"),
  actionHint: document.querySelector("#actionHint"),
  mapGrid: document.querySelector("#mapGrid"),
  actions: document.querySelector("#actions"),
  logList: document.querySelector("#logList"),
  throwButtons: [...document.querySelectorAll(".throw-button")],
  onlineStatus: document.querySelector("#onlineStatus"),
  hostBtn: document.querySelector("#hostBtn"),
  joinBtn: document.querySelector("#joinBtn"),
  applyCodeBtn: document.querySelector("#applyCodeBtn"),
  offlineBtn: document.querySelector("#offlineBtn"),
  localCode: document.querySelector("#localCode"),
  remoteCode: document.querySelector("#remoteCode"),
};

const skillHooks = {
  beforeAction(_actor, _target, actionId, context) {
    return { actionId, context };
  },
  afterAction(_actor, _target, _actionId, _context) {},
};

function decideWinner(playerChoice, computerChoice) {
  if (playerChoice === computerChoice) return null;
  return throws[playerChoice].beats === computerChoice ? "player" : "computer";
}

function randomThrow() {
  const keys = Object.keys(throws);
  return keys[Math.floor(Math.random() * keys.length)];
}

function opponentOf(actorId) {
  return actorId === "player" ? state.actors.computer : state.actors.player;
}

function addLog(entry) {
  state.log.unshift(entry);
  state.log = state.log.slice(0, 22);
}

function statusText(actor) {
  if (actor.dead) return "死亡";
  if (actor.asleep) return "睡觉中";
  if (actor.vehicle) return `${vehicles[actor.vehicle].name}上`;
  return "已起床";
}

function setStatusClass(el, actor) {
  el.classList.toggle("awake", !actor.asleep && !actor.dead);
  el.classList.toggle("dead", actor.dead);
}

function actorsInVehicle(vehicleId) {
  return Object.values(state.actors).filter((actor) => actor.vehicle === vehicleId && !actor.dead);
}

function isSameAttackSpace(actor, target) {
  if (actor.vehicle || target.vehicle) {
    return actor.vehicle && actor.vehicle === target.vehicle;
  }
  return actor.location === target.location;
}

function isSameLocation(actor, target) {
  return actor.location === target.location;
}

function invalidateAimsAt(actor) {
  Object.values(state.actors).forEach((other) => {
    if (other.id !== actor.id && other.sniper.aimedTarget === actor.id) {
      other.sniper.aimBroken = true;
    }
  });
}

function breakShield(target) {
  target.inventory.shield = false;
  target.inventory.shieldHp = 0;
}

function applyShieldedDamage(actor, target, amount, method) {
  if (target.inventory.shield) {
    breakShield(target);
    return `${actor.name}用${method}破坏了${target.name}的盾，伤害被盾完全挡住。`;
  }
  return applyDamage(actor, target, amount, method);
}

function applyDamage(actor, target, amount, method) {
  target.hp = Math.max(0, target.hp - amount);
  if (target.hp === 0) {
    target.dead = true;
    target.vehicle = null;
    return `${actor.name}用${method}杀死了${target.name}。`;
  }
  return `${actor.name}用${method}攻击${target.name}，${target.name}生命减少。`;
}

function resolveMeleeAttack(actor, target) {
  if (actor.inventory.knife) {
    return applyShieldedDamage(actor, target, 2, "刀");
  }

  if (target.inventory.shield) {
    return `${actor.name}手刀攻击${target.name}，但被盾挡住了。`;
  }
  return applyDamage(actor, target, 1, "手刀");
}

function explodeVehicle(vehicleId) {
  const vehicleName = vehicles[vehicleId].name;
  state.vehicles[vehicleId].destroyed = true;
  state.vehicles[vehicleId].hp = 0;
  actorsInVehicle(vehicleId).forEach((rider) => {
    rider.vehicle = null;
  });
  return `${vehicleName}爆炸了`;
}

function resolveVehicleAttack(actor, target) {
  const attackerVehicleId = actor.vehicle;
  const attackerVehicle = vehicles[attackerVehicleId];
  const attackerVehicleName = attackerVehicle.name;
  const damage = attackerVehicle.damage;

  if (target.vehicle && target.vehicle !== attackerVehicleId) {
    const targetVehicleId = target.vehicle;
    const targetVehicleState = state.vehicles[targetVehicleId];
    const targetVehicleName = vehicles[targetVehicleId].name;
    const oldHp = targetVehicleState.hp;
    const overflow = Math.max(0, damage - oldHp);
    targetVehicleState.hp = Math.max(0, oldHp - damage);

    if (targetVehicleState.hp === 0) {
      const explosion = explodeVehicle(targetVehicleId);
      if (overflow > 0) {
        const damageText = applyShieldedDamage(actor, target, overflow, `${attackerVehicleName}溢出伤害`);
        return `${actor.name}操纵${attackerVehicleName}攻击${targetVehicleName}，${explosion}，${damageText}`;
      }
      return `${actor.name}操纵${attackerVehicleName}摧毁了${targetVehicleName}，${explosion}。`;
    }

    return `${actor.name}操纵${attackerVehicleName}攻击${targetVehicleName}，${targetVehicleName}剩余 ${targetVehicleState.hp} 点血量。`;
  }

  return applyShieldedDamage(actor, target, damage, attackerVehicleName);
}

function canFireSniper(actor, target) {
  return (
    actor.inventory.sniper &&
    actor.sniper.loaded &&
    actor.sniper.chambered &&
    actor.sniper.aimedTarget === target.id &&
    actor.sniper.aimedLocation === target.location &&
    !actor.sniper.aimBroken
  );
}

const actionDefinitions = {
  wake: {
    canUse(actor) {
      return actor.asleep;
    },
    perform(actor) {
      actor.asleep = false;
      return `${actor.name}起床了，可以开始移动和攻击。`;
    },
  },
  move: {
    canUse(actor, _target, context) {
      return !actor.asleep && !actor.vehicle && actor.location !== context.destination;
    },
    perform(actor, _target, context) {
      actor.location = context.destination;
      invalidateAimsAt(actor);
      return `${actor.name}前往${locations[context.destination].name}。`;
    },
  },
  takeItem: {
    canUse(actor, _target, context) {
      return !actor.asleep && !actor.vehicle && actor.location === "armory" && !actor.inventory[context.item];
    },
    perform(actor, _target, context) {
      actor.inventory[context.item] = true;
      if (context.item === "shield") actor.inventory.shieldHp = 1;
      return `${actor.name}在军火库拿取了${items[context.item].name}。`;
    },
  },
  meleeAttack: {
    canUse(actor, target) {
      return !actor.asleep && !target.dead && isSameAttackSpace(actor, target);
    },
    perform(actor, target) {
      return resolveMeleeAttack(actor, target);
    },
  },
  boardVehicle: {
    canUse(actor, _target, context) {
      const vehicle = state.vehicles[context.vehicle];
      return !actor.asleep && !actor.vehicle && !vehicle.destroyed && actor.location === vehicle.location;
    },
    perform(actor, _target, context) {
      actor.vehicle = context.vehicle;
      return `${actor.name}上了${vehicles[context.vehicle].name}。`;
    },
  },
  leaveVehicle: {
    canUse(actor) {
      return !actor.asleep && Boolean(actor.vehicle);
    },
    perform(actor) {
      const vehicleName = vehicles[actor.vehicle].name;
      actor.vehicle = null;
      return `${actor.name}离开了${vehicleName}。`;
    },
  },
  driveVehicle: {
    canUse(actor, _target, context) {
      return !actor.asleep && actor.vehicle && !state.vehicles[actor.vehicle].destroyed && actor.location !== context.destination;
    },
    perform(actor, _target, context) {
      const vehicleId = actor.vehicle;
      const vehicleName = vehicles[vehicleId].name;
      state.vehicles[vehicleId].location = context.destination;
      actorsInVehicle(vehicleId).forEach((rider) => {
        rider.location = context.destination;
        invalidateAimsAt(rider);
      });
      return `${actor.name}驾驶${vehicleName}前往${locations[context.destination].name}。`;
    },
  },
  vehicleAttack: {
    canUse(actor, target) {
      return !actor.asleep && actor.vehicle && !state.vehicles[actor.vehicle].destroyed && !target.dead && actor.vehicle !== target.vehicle && isSameLocation(actor, target);
    },
    perform(actor, target) {
      return resolveVehicleAttack(actor, target);
    },
  },
  loadSniper: {
    canUse(actor) {
      return !actor.asleep && actor.inventory.sniper && !actor.sniper.loaded;
    },
    perform(actor) {
      actor.sniper.loaded = true;
      return `${actor.name}给狙击枪装弹。`;
    },
  },
  chamberSniper: {
    canUse(actor) {
      return !actor.asleep && actor.inventory.sniper && actor.sniper.loaded && !actor.sniper.chambered;
    },
    perform(actor) {
      actor.sniper.chambered = true;
      return `${actor.name}给狙击枪上膛。`;
    },
  },
  aimSniper: {
    canUse(actor, target) {
      return !actor.asleep && actor.inventory.sniper && actor.sniper.loaded && actor.sniper.chambered && !target.dead;
    },
    perform(actor, target) {
      actor.sniper.aimedTarget = target.id;
      actor.sniper.aimedLocation = target.location;
      actor.sniper.aimBroken = false;
      return `${actor.name}瞄准了${target.name}所在的${locations[target.location].name}。`;
    },
  },
  fireSniper: {
    canUse(actor, target) {
      return !actor.asleep && !target.dead && canFireSniper(actor, target);
    },
    perform(actor, target) {
      target.hp = 0;
      target.dead = true;
      target.vehicle = null;
      actor.sniper.loaded = false;
      actor.sniper.chambered = false;
      actor.sniper.aimedTarget = null;
      actor.sniper.aimedLocation = null;
      actor.sniper.aimBroken = false;
      return `${actor.name}开枪射杀了${target.name}。`;
    },
  },
};

function getAvailableActions(actorId) {
  const actor = state.actors[actorId];
  const target = opponentOf(actorId);

  if (state.phase !== "action" || state.winner !== actorId || actor.dead || state.gameOver) {
    return [];
  }

  if (actionDefinitions.wake.canUse(actor, target, {})) {
    return [{ id: "wake" }];
  }

  const actions = [];

  if (actionDefinitions.meleeAttack.canUse(actor, target, {})) {
    actions.push({ id: "meleeAttack" });
  }

  if (actionDefinitions.vehicleAttack.canUse(actor, target, {})) {
    actions.push({ id: "vehicleAttack" });
  }

  if (actionDefinitions.fireSniper.canUse(actor, target, {})) {
    actions.push({ id: "fireSniper" });
  }

  sniperSteps.forEach((step) => {
    if (step.action !== "fireSniper" && actionDefinitions[step.action].canUse(actor, target, {})) {
      actions.push({ id: step.action });
    }
  });

  Object.keys(items).forEach((item) => {
    if (actionDefinitions.takeItem.canUse(actor, target, { item })) {
      actions.push({ id: "takeItem", item });
    }
  });

  Object.keys(vehicles).forEach((vehicle) => {
    if (actionDefinitions.boardVehicle.canUse(actor, target, { vehicle })) {
      actions.push({ id: "boardVehicle", vehicle });
    }
  });

  if (actionDefinitions.leaveVehicle.canUse(actor, target, {})) {
    actions.push({ id: "leaveVehicle" });
  }

  const moveAction = actor.vehicle ? "driveVehicle" : "move";
  Object.keys(locations)
    .filter((locationId) => locationId !== actor.location)
    .forEach((destination) => {
      if (actionDefinitions[moveAction].canUse(actor, target, { destination })) {
        actions.push({ id: moveAction, destination });
      }
    });

  return actions;
}

function finishAction(actor, target) {
  if (target.dead) {
    state.gameOver = true;
    state.phase = "gameOver";
    state.message = `${actor.name}获胜`;
    addLog(`${actor.name}赢得了这场生存战。`);
    return;
  }

  state.round += 1;
  state.phase = "duel";
  state.winner = null;
  state.playerThrow = null;
  state.computerThrow = null;
  state.message = `第 ${state.round} 回合：继续猜拳`;
}

function runAction(actorId, action) {
  if (state.gameOver) return;

  const actor = state.actors[actorId];
  const target = opponentOf(actorId);
  const hookResult = skillHooks.beforeAction(actor, target, action.id, { ...action });
  const actionId = hookResult.actionId;
  const context = hookResult.context;
  const definition = actionDefinitions[actionId];

  if (!definition || !definition.canUse(actor, target, context)) return;

  const entry = definition.perform(actor, target, context);
  skillHooks.afterAction(actor, target, actionId, context);
  addLog(entry);
  finishAction(actor, target);
  render();
  syncStateToGuest();
}


function runLocalAction(actorId, action) {
  if (gameMode === "online" && !isHost) {
    sendNetwork({ type: "action", actorId, action });
    state.message = "已发送行动，等待房主同步";
    render();
    return;
  }
  runAction(actorId, action);
}

function applyOnlineActorNames() {
  if (gameMode !== "online") return;
  state.actors.player.name = "房主";
  state.actors.computer.name = "加入者";
  if (state.log.length === 1 && state.log[0].includes("双方都在自己家里睡觉")) {
    state.log[0] = "游戏开始：房主和加入者都在自己家里睡觉。";
  }
}
function setOnlineStatus(text) {
  if (els.onlineStatus) els.onlineStatus.textContent = text;
}

function setThrowForActor(actorId, choice) {
  if (actorId === "player") state.playerThrow = choice;
  if (actorId === "computer") state.computerThrow = choice;
}

function roomServerUrl() {
  if (!window.location.hostname) return "ws://localhost:8787/ws";
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

function sendNetwork(message) {
  if (channel && channel.readyState === WebSocket.OPEN) {
    channel.send(JSON.stringify(message));
  }
}

function syncStateToGuest() {
  if (gameMode === "online" && isHost) {
    sendNetwork({ type: "state", state });
  }
}

function closePeer() {
  if (channel) channel.close();
  channel = null;
  peer = null;
  pendingThrows = {};
}

function attachRoomSocket(socket) {
  channel = socket;
  channel.onmessage = (event) => handleNetworkMessage(JSON.parse(event.data));
  channel.onclose = () => setOnlineStatus("联机断开");
  channel.onerror = () => setOnlineStatus("连接房间服务器失败");
}

function openRoomSocket() {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(roomServerUrl());
    attachRoomSocket(socket);
    socket.onopen = () => resolve(socket);
    socket.onerror = () => reject(new Error("无法连接房间服务器"));
  });
}

async function createRoom() {
  closePeer();
  gameMode = "online";
  isHost = true;
  localActorId = "player";
  state = initialState();
  applyOnlineActorNames();
  await openRoomSocket();
  sendNetwork({ type: "createRoom" });
  setOnlineStatus("正在创建房间...");
  render();
}

async function joinRoom() {
  const code = els.remoteCode.value.trim().toUpperCase();
  if (!code) {
    setOnlineStatus("请输入房间码");
    return;
  }
  closePeer();
  gameMode = "online";
  isHost = false;
  localActorId = "computer";
  state = initialState();
  applyOnlineActorNames();
  await openRoomSocket();
  sendNetwork({ type: "joinRoom", code });
  setOnlineStatus(`正在加入房间 ${code}...`);
  render();
}

async function applyRemoteCode() {
  const code = els.localCode.value.trim();
  if (!code) {
    setOnlineStatus("还没有房间码");
    return;
  }
  try {
    await navigator.clipboard.writeText(code);
    setOnlineStatus(`已复制房间码 ${code}`);
  } catch (_error) {
    els.localCode.select();
    setOnlineStatus("已选中房间码，可以手动复制");
  }
}

function goOffline() {
  closePeer();
  gameMode = "ai";
  isHost = false;
  localActorId = "player";
  state = initialState();
  if (els.localCode) els.localCode.value = "";
  if (els.remoteCode) els.remoteCode.value = "";
  setOnlineStatus("单机：对战电脑");
  render();
}

function handleNetworkMessage(message) {
  if (message.type === "roomCreated") {
    els.localCode.value = message.code;
    setOnlineStatus(`房间 ${message.code}：等待对方加入`);
    return;
  }

  if (message.type === "joined") {
    if (!els.localCode.value) els.localCode.value = message.code;
    setOnlineStatus(isHost ? `房间 ${message.code}：对方已加入` : `已加入房间 ${message.code}`);
    if (isHost) syncStateToGuest();
    return;
  }

  if (message.type === "error") {
    setOnlineStatus(message.message || "联机错误");
    return;
  }

  if (message.type === "state") {
    pendingThrows = {};
    state = message.state;
    render();
    return;
  }

  if (!isHost) return;

  if (message.type === "throw") {
    pendingThrows[message.actorId] = message.choice;
    state.message = pendingThrows[localActorId] ? "双方已出拳，正在判定" : "对方已出拳，等待你出拳";
    tryResolveOnlineDuel();
    render();
    return;
  }

  if (message.type === "action" && message.actorId === state.winner) {
    runAction(message.actorId, message.action);
    return;
  }

  if (message.type === "resetRequest") {
    state = initialState();
    applyOnlineActorNames();
    pendingThrows = {};
    render();
    syncStateToGuest();
  }
}

function handleOnlineThrow(choice) {
  if (state.phase !== "duel" || state.gameOver) return;
  pendingThrows[localActorId] = choice;

  if (!isHost) {
    state.message = "已出拳，等待房主判定";
    sendNetwork({ type: "throw", actorId: localActorId, choice });
    render();
    return;
  }

  state.message = "等待对方出拳";
  tryResolveOnlineDuel();
  render();
}

function tryResolveOnlineDuel() {
  if (!isHost || !pendingThrows.player || !pendingThrows.computer) return;
  const playerChoice = pendingThrows.player;
  const computerChoice = pendingThrows.computer;
  const winner = decideWinner(playerChoice, computerChoice);
  state.playerThrow = playerChoice;
  state.computerThrow = computerChoice;
  pendingThrows = {};

  if (!winner) {
    state.message = "平局，无人行动";
    addLog(`第 ${state.round} 回合平局：双方都出了${throws[playerChoice].name}。`);
    state.round += 1;
    syncStateToGuest();
    setTimeout(() => {
      if (gameMode === "online" && isHost && state.phase === "duel" && !state.gameOver) {
        state.message = `第 ${state.round} 回合：继续猜拳`;
        state.playerThrow = null;
        state.computerThrow = null;
        render();
        syncStateToGuest();
      }
    }, 750);
    return;
  }

  state.winner = winner;
  state.phase = "action";
  const winnerName = winner === "player" ? "房主" : "加入者";
  state.message = `${winnerName}赢了，获得行动权`;
  addLog(
    `第 ${state.round} 回合：房主出${throws[playerChoice].name}，加入者出${throws[computerChoice].name}，${winnerName}获得行动权。`,
  );
  syncStateToGuest();
}
function chooseComputerAction() {
  const actor = state.actors.computer;
  const target = state.actors.player;
  const options = getAvailableActions("computer");

  if (options.length === 0) return null;
  if (actor.asleep) return { id: "wake" };

  const findOption = (id) => options.find((action) => action.id === id);
  const moveTo = (destination) => options.find((action) => action.destination === destination);
  const targetHasShield = target.inventory.shield;
  const hasKnife = actor.inventory.knife;

  const instantAttack = findOption("fireSniper");
  if (instantAttack) return instantAttack;

  if (targetHasShield && !hasKnife) {
    if (actor.location === "armory" && !actor.vehicle) {
      return actor.inventory.knife ? null : { id: "takeItem", item: "knife" };
    }

    const vehicleAttack = findOption("vehicleAttack");
    if (vehicleAttack) return vehicleAttack;

    const sniperPrep = ["loadSniper", "chamberSniper", "aimSniper"]
      .map(findOption)
      .find(Boolean);
    if (actor.inventory.sniper && sniperPrep) return sniperPrep;

    const toArmory = moveTo("armory");
    if (toArmory) return toArmory;
  }

  const vehicleAttack = findOption("vehicleAttack");
  if (vehicleAttack) return vehicleAttack;

  const melee = findOption("meleeAttack");
  if (melee && (!targetHasShield || hasKnife)) return melee;

  if (actor.location === "armory" && !actor.vehicle) {
    const wanted = ["knife", "shield", "sniper"].find((item) => !actor.inventory[item]);
    if (wanted) return { id: "takeItem", item: wanted };
  }

  const sniperPrep = ["loadSniper", "chamberSniper", "aimSniper"]
    .map(findOption)
    .find(Boolean);
  if (sniperPrep && Math.random() < 0.72) return sniperPrep;

  const board = findOption("boardVehicle");
  if (board && Math.random() < 0.45) return board;

  if (!actor.inventory.knife || !actor.inventory.shield) {
    const toArmory = moveTo("armory");
    if (toArmory) return toArmory;
  }

  if (!target.asleep && actor.location !== target.location && Math.random() < 0.74) {
    const chase = moveTo(target.location);
    if (chase) return chase;
  }

  return options.filter((action) => action.id !== "meleeAttack")[0] || options[0];
}

function playDuel(playerChoice) {
  if (gameMode === "online") {
    handleOnlineThrow(playerChoice);
    return;
  }
  if (state.phase !== "duel" || state.gameOver) return;

  const computerChoice = randomThrow();
  const winner = decideWinner(playerChoice, computerChoice);
  state.playerThrow = playerChoice;
  state.computerThrow = computerChoice;

  if (!winner) {
    state.message = "平局，无人行动";
    addLog(`第 ${state.round} 回合平局：双方都出了${throws[playerChoice].name}。`);
    state.round += 1;
    setTimeout(() => {
      if (state.phase === "duel" && !state.gameOver) {
        state.message = `第 ${state.round} 回合：继续猜拳`;
        state.playerThrow = null;
        state.computerThrow = null;
        render();
      }
    }, 750);
  } else {
    state.winner = winner;
    state.phase = "action";
    const winnerName = winner === "player" ? "你" : "电脑";
    state.message = `${winnerName}赢了，获得行动权`;
    addLog(
      `第 ${state.round} 回合：你出${throws[playerChoice].name}，电脑出${
        throws[computerChoice].name
      }，${winnerName}获得行动权。`,
    );

    if (winner === "computer") {
      render();
      setTimeout(() => {
        const action = chooseComputerAction();
        if (action) runAction("computer", action);
      }, 700);
      return;
    }
  }

  render();
}

function renderMap() {
  els.mapGrid.innerHTML = "";
  Object.entries(locations).forEach(([id, location]) => {
    const tile = document.createElement("article");
    tile.className = "map-tile";
    const moveAction = getPlayerMoveAction(id);
    tile.classList.toggle("movable", Boolean(moveAction));
    tile.title = moveAction ? "点击移动到这里" : "";
    tile.addEventListener("click", () => handleMapTileClick(id));

    const title = document.createElement("div");
    title.className = "map-title";
    title.textContent = location.name;

    const note = document.createElement("small");
    note.textContent = location.note;

    const occupants = document.createElement("div");
    occupants.className = "occupants";

    Object.values(state.vehicles)
      .filter((vehicle) => vehicle.location === id && !vehicle.destroyed)
      .forEach((vehicle) => {
        const token = document.createElement("span");
        token.className = "token vehicle";
        token.textContent = `${vehicles[vehicle.id].name} ${vehicle.hp}/${vehicles[vehicle.id].maxHp} ${actorsInVehicle(vehicle.id).length}人`;
        occupants.appendChild(token);
      });

    Object.values(state.actors)
      .filter((actor) => actor.location === id && !actor.dead)
      .forEach((actor) => {
        const token = document.createElement("span");
        token.className = `token ${actor.id}`;
        token.textContent =
          gameMode === "online" ? actorDisplayName(actor.id) : actor.id === "player" ? "你" : "电脑";
        if (actor.vehicle) token.textContent += `/${vehicles[actor.vehicle].name}`;
        occupants.appendChild(token);
      });

    tile.append(title, note, occupants);
    els.mapGrid.appendChild(tile);
  });
}

function actorDisplayName(actorId) {
  if (gameMode === "online") return actorId === "player" ? "房主" : "加入者";
  return actorId === "player" ? "玩家" : "电脑";
}

function localSideIds() {
  const left = gameMode === "online" ? localActorId : "player";
  return { left, right: opponentOf(left).id };
}

function sideThrowText(actorId, leftSide) {
  const choice = actorId === "player" ? state.playerThrow : state.computerThrow;
  const pendingChoice = gameMode === "online" && state.phase === "duel" ? pendingThrows[actorId] : null;
  const label = leftSide ? "你" : gameMode === "online" ? "对方" : "电脑";
  if (choice) return `${label}：${throws[choice].name}`;
  return pendingChoice ? `${label}：已出拳` : `${label}：未出拳`;
}

function actingName(actorId) {
  if (gameMode === "online") return actorId === localActorId ? "你" : "对方";
  return actorId === "player" ? "你" : "电脑";
}
function isAttackAction(actionId) {
  return actionId === "fireSniper" || actionId === "vehicleAttack" || actionId === "meleeAttack";
}

function isMoveAction(actionId) {
  return actionId === "move" || actionId === "driveVehicle";
}

function getPlayerMoveAction(destination) {
  if (state.phase !== "action" || state.winner !== localActorId || state.gameOver) return null;
  const actor = state.actors[localActorId];
  const target = opponentOf(localActorId);
  const actionId = actor.vehicle ? "driveVehicle" : "move";
  const context = { destination };
  return actionDefinitions[actionId].canUse(actor, target, context) ? { id: actionId, destination } : null;
}

function handleMapTileClick(destination) {
  const action = getPlayerMoveAction(destination);
  if (action) {
    runLocalAction(localActorId, action);
    return;
  }
  if (state.phase === "action" && state.winner === localActorId && !state.gameOver) {
    state.message = "现在不能移动到那里";
    render();
  }
}

function getBestPlayerAttackAction() {
  if (state.phase !== "action" || state.winner !== localActorId || state.gameOver) return null;
  const actor = state.actors[localActorId];
  const target = opponentOf(localActorId);
  const priority = ["fireSniper", "vehicleAttack", "meleeAttack"];
  const actionId = priority.find((id) => actionDefinitions[id].canUse(actor, target, {}));
  return actionId ? { id: actionId } : null;
}

function handleTargetCardClick(targetId) {
  const localActor = state.actors[localActorId];
  const target = opponentOf(localActorId);
  if (!localActor || !target || targetId !== target.id) return;

  const action = getBestPlayerAttackAction();
  if (action) {
    runLocalAction(localActorId, action);
    return;
  }

  const moveAction = getPlayerMoveAction(target.location);
  if (moveAction) {
    runLocalAction(localActorId, moveAction);
    return;
  }

  if (state.phase === "action" && state.winner === localActorId && !state.gameOver) {
    state.message = "现在攻击不到对方";
    render();
  }
}
function actionLabel(action) {
  if (action.id === "wake") return ["起床", "从睡觉状态进入行动状态"];
  if (action.id === "meleeAttack") return ["近战攻击", "手刀会被盾挡住；刀可破盾"];
  if (action.id === "vehicleAttack") return ["载具攻击", "飞机伤害2，坦克伤害1；先打载具再溢出"];
  if (action.id === "takeItem") return [`拿${items[action.item].name}`, "军火库物品，拿到后状态亮起"];
  if (action.id === "boardVehicle") return [`上${vehicles[action.vehicle].name}`, "同地点即可登上，人数不限"];
  if (action.id === "leaveVehicle") return ["下载具", "留在当前地点"];
  if (action.id === "driveVehicle") return [`驾驶去${locations[action.destination].name}`, "载具和车上所有人一起移动"];
  if (action.id === "loadSniper") return ["狙击枪装弹", "第 1 个狙击行动点"];
  if (action.id === "chamberSniper") return ["狙击枪上膛", "第 2 个狙击行动点"];
  if (action.id === "aimSniper") return ["瞄准对方", "目标换位置后需要重新瞄准"];
  if (action.id === "fireSniper") return ["发射狙击枪", "远程射杀已瞄准目标"];
  return [`去${locations[action.destination].name}`, "移动到这个地点"];
}

function renderActions() {
  els.actions.innerHTML = "";
  const attackAction = getBestPlayerAttackAction();
  const options = getAvailableActions(localActorId).filter((action) => !isAttackAction(action.id) && !isMoveAction(action.id));

  if (state.gameOver) {
    els.actionHint.textContent = "游戏结束";
  } else if (state.phase === "duel") {
    els.actionHint.textContent = "先赢下锤子剪刀布";
  } else if (state.winner !== localActorId) {
    els.actionHint.textContent = gameMode === "online" ? "等待对方行动" : "电脑正在行动";
  } else {
    els.actionHint.textContent = attackAction
      ? "可攻击时点对方头像"
      : options.length
        ? "选择特殊行动；移动点地图"
        : "移动点地图，追人点头像";
  }

  if (!options.length) {
    const disabled = document.createElement("button");
    disabled.className = "action-button";
    disabled.type = "button";
    disabled.disabled = true;
    disabled.innerHTML = attackAction
      ? "<strong>点对方头像</strong><small>执行当前可用攻击</small>"
      : "<strong>等待行动权</strong><small>胜者才能行动</small>";
    els.actions.appendChild(disabled);
    return;
  }

  options.forEach((action) => {
    const [title, detail] = actionLabel(action);
    const button = document.createElement("button");
    button.className = "action-button";
    button.type = "button";
    button.innerHTML = `<strong>${title}</strong><small>${detail}</small>`;
    button.addEventListener("click", () => runLocalAction(localActorId, action));
    els.actions.appendChild(button);
  });
}

function sniperText(actor) {
  if (!actor.inventory.sniper) return "狙未持有";
  if (canFireSniper(actor, opponentOf(actor.id))) return "狙可发射";
  if (actor.sniper.aimedTarget && actor.sniper.aimBroken) return "狙需重瞄";
  if (actor.sniper.aimedTarget) return "狙已瞄准";
  if (actor.sniper.chambered) return "狙已上膛";
  if (actor.sniper.loaded) return "狙已装弹";
  return "狙未装弹";
}

function renderStatusChips(actor, el) {
  const chips = [
    ["knife", "刀", actor.inventory.knife],
    ["shield", "盾", actor.inventory.shield],
    ["sniper", "狙", actor.inventory.sniper],
    ["vehicle", actor.vehicle ? vehicles[actor.vehicle].name : "载具", Boolean(actor.vehicle)],
  ];

  el.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "status-chips";

  chips.forEach(([key, label, active]) => {
    const chip = document.createElement("span");
    chip.className = `item-chip ${key}${active ? " active" : ""}`;
    chip.textContent = label;
    wrap.appendChild(chip);
  });

  const sniper = document.createElement("span");
  sniper.className = `item-chip sniper-state${actor.inventory.sniper ? " active" : ""}`;
  sniper.textContent = sniperText(actor);
  wrap.appendChild(sniper);
  el.appendChild(wrap);
}

function renderLog() {
  els.logList.innerHTML = "";
  state.log.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    els.logList.appendChild(item);
  });
}

function render() {
  const { left, right } = localSideIds();
  const leftActor = state.actors[left];
  const rightActor = state.actors[right];

  els.roundResult.textContent = state.message;
  els.playerThrow.textContent = sideThrowText(left, true);
  els.computerThrow.textContent = sideThrowText(right, false);

  els.playerName.textContent = gameMode === "online" ? `你（${actorDisplayName(left)}）` : "你";
  els.computerName.textContent = gameMode === "online" ? `对方（${actorDisplayName(right)}）` : "对手";

  els.playerState.textContent = statusText(leftActor);
  els.computerState.textContent = statusText(rightActor);
  setStatusClass(els.playerState, leftActor);
  setStatusClass(els.computerState, rightActor);

  els.playerLocation.textContent = locations[leftActor.location].name;
  els.computerLocation.textContent = locations[rightActor.location].name;
  els.playerHp.textContent = `${leftActor.hp} / ${leftActor.maxHp}`;
  els.computerHp.textContent = `${rightActor.hp} / ${rightActor.maxHp}`;
  renderStatusChips(leftActor, els.playerSkill);
  renderStatusChips(rightActor, els.computerSkill);

  els.playerCard.classList.toggle("active", state.winner === left);
  els.computerCard.classList.toggle("active", state.winner === right);
  const localTarget = opponentOf(localActorId);
  const targetCard = localTarget.id === left ? els.playerCard : els.computerCard;
  const otherCard = targetCard === els.playerCard ? els.computerCard : els.playerCard;
  targetCard.classList.toggle("attackable", Boolean(getBestPlayerAttackAction() || getPlayerMoveAction(localTarget.location)));
  targetCard.title = getBestPlayerAttackAction()
    ? "点击攻击对方"
    : getPlayerMoveAction(localTarget.location)
      ? "点击移动到对方身边"
      : "";
  otherCard.classList.toggle("attackable", false);
  otherCard.title = "";
  els.turnHint.textContent =
    state.phase === "action" ? `${actingName(state.winner)}正在行动` : "赢下猜拳后才能行动";

  els.throwButtons.forEach((button) => {
    const choice = button.dataset.throw;
    const revealedLocalThrow = localActorId === "player" ? state.playerThrow : state.computerThrow;
    const localThrow = pendingThrows[localActorId] || revealedLocalThrow;
    button.classList.toggle("selected", localThrow === choice);
    button.disabled = state.phase !== "duel" || state.gameOver;
  });

  renderMap();
  renderActions();
  renderLog();
}

els.throwButtons.forEach((button) => {
  button.addEventListener("click", () => playDuel(button.dataset.throw));
});

els.playerCard.addEventListener("click", () => handleTargetCardClick(localSideIds().left));
els.computerCard.addEventListener("click", () => handleTargetCardClick(localSideIds().right));
els.hostBtn.addEventListener("click", () => createRoom().catch((error) => setOnlineStatus(`创建失败：${error.message}`)));
els.joinBtn.addEventListener("click", () => joinRoom().catch((error) => setOnlineStatus(`加入失败：${error.message}`)));
els.applyCodeBtn.addEventListener("click", () => applyRemoteCode().catch((error) => setOnlineStatus(`连接失败：${error.message}`)));
els.offlineBtn.addEventListener("click", goOffline);

els.resetBtn.addEventListener("click", () => {
  if (gameMode === "online" && !isHost) {
    sendNetwork({ type: "resetRequest" });
    state.message = "已请求房主重新开始";
    render();
    return;
  }
  state = initialState();
  applyOnlineActorNames();
  pendingThrows = {};
  render();
  syncStateToGuest();
});

render();