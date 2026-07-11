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
const roomMapConfigs = {
  team: {
    hint: "红队房间和蓝队房间都通军火库；红队通坦克基地，蓝队通飞机基地；坦克和飞机通野外，野外通军火库。",
    nodes: {
      redHome: { name: "红队房间", note: "红队出生点，队友同房间开始", className: "home-a", pos: "r1c1" },
      armory: { name: "军火库", note: "地图中心，刀、盾、狙击枪争夺点", className: "armory", pos: "r1c2" },
      blueHome: { name: "蓝队房间", note: "蓝队出生点，队友同房间开始", className: "home-b", pos: "r1c3" },
      tankBase: { name: "坦克基地", note: "红队侧载具点，可进入野外", className: "vehicle", pos: "r2c1" },
      wild: { name: "野外", note: "坦克、飞机、军火库之间的交战区", className: "wild", pos: "r2c2" },
      airBase: { name: "飞机基地", note: "蓝队侧载具点，可进入野外", className: "vehicle", pos: "r2c3" },
      medBay: { name: "医疗站", note: "医疗包补给点", className: "medbay", pos: "r3c1" },
      radar: { name: "雷达站", note: "烟雾弹补给点", className: "radar", pos: "r3c3" },
    },
    edges: [
      ["redHome", "armory"],
      ["blueHome", "armory"],
      ["redHome", "tankBase"],
      ["blueHome", "airBase"],
      ["tankBase", "wild"],
      ["airBase", "wild"],
      ["wild", "armory"],
      ["tankBase", "medBay"],
      ["medBay", "wild"],
      ["airBase", "radar"],
      ["radar", "wild"],
    ],
  },
  chaos: {
    hint: "五名玩家各自为战，所有出生点通野外；野外连接军火库、坦克基地和飞机基地。",
    nodes: {
      homeRing: { name: "五个出生房间", note: "每名玩家单独出生，互不结盟", className: "wild", pos: "r1c2" },
      wild: { name: "野外", note: "乱战中心交战区", className: "wild", pos: "r2c2" },
      armory: { name: "军火库", note: "刀、盾、狙击枪争夺点", className: "armory", pos: "r3c2" },
      tankBase: { name: "坦克基地", note: "可上坦克", className: "vehicle", pos: "r2c1" },
      airBase: { name: "飞机基地", note: "可上飞机", className: "vehicle", pos: "r2c3" },
      medBay: { name: "医疗站", note: "医疗包补给点", className: "medbay", pos: "r3c1" },
      radar: { name: "雷达站", note: "烟雾弹补给点", className: "radar", pos: "r3c3" },
    },
    edges: [
      ["homeRing", "wild"],
      ["wild", "armory"],
      ["tankBase", "medBay"],
      ["medBay", "wild"],
      ["airBase", "radar"],
      ["radar", "wild"],
      ["wild", "tankBase"],
      ["wild", "airBase"],
      ["wild", "medBay"],
      ["wild", "radar"],
    ],
  },
};

const items = {
  knife: { name: "刀" },
  shield: { name: "盾" },
  sniper: { name: "狙击枪" },
  medkit: { name: "医疗包" },
  smoke: { name: "烟雾弹" },
  rocket: { name: "火箭筒" },
};

const characters = {
  scout: { name: "侦察兵", icon: "◎", maxHp: 3 },
  vanguard: { name: "先锋", icon: "◆", maxHp: 4 },
  medic: { name: "医疗兵", icon: "+", maxHp: 3 },
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
let roomMode = "team";
let roomState = null;
let roomPlayerId = null;
let roomIsHost = false;
let roomBattle = null;
let roomSkillTargeting = null;
let selectedCharacter = "scout";
let selectedMode = "single";

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
  startScreen: document.querySelector("#startScreen"),
  modeScreen: document.querySelector("#modeScreen"),
  characterScreen: document.querySelector("#characterScreen"),
  characterTitle: document.querySelector("#characterTitle"),
  characterModeLabel: document.querySelector("#characterModeLabel"),
  characterHint: document.querySelector("#characterHint"),
  characterSelected: document.querySelector("#characterSelected"),
  characterBackBtn: document.querySelector("#characterBackBtn"),
  characterStartBtn: document.querySelector("#characterStartBtn"),
  gameShell: document.querySelector("#gameShell"),
  roomShell: document.querySelector("#roomShell"),
  startGameBtn: document.querySelector("#startGameBtn"),
  modeBackBtn: document.querySelector("#modeBackBtn"),
  modeCurrent: document.querySelector("#modeCurrent"),
  singleModeBtn: document.querySelector("#singleModeBtn"),
  teamModeBtn: document.querySelector("#teamModeBtn"),
  chaosModeBtn: document.querySelector("#chaosModeBtn"),
  gameModeBtn: document.querySelector("#gameModeBtn"),
  roomBackBtn: document.querySelector("#roomBackBtn"),
  roomToHomeBtn: document.querySelector("#roomToHomeBtn"),
  roomCreateBtn: document.querySelector("#roomCreateBtn"),
  roomJoinBtn: document.querySelector("#roomJoinBtn"),
  roomCopyBtn: document.querySelector("#roomCopyBtn"),
  roomAddBotBtn: document.querySelector("#roomAddBotBtn"),
  roomStartBtn: document.querySelector("#roomStartBtn"),
  roomLocalCode: document.querySelector("#roomLocalCode"),
  roomRemoteCode: document.querySelector("#roomRemoteCode"),
  roomStatus: document.querySelector("#roomStatus"),
  roomSlots: document.querySelector("#roomSlots"),
  roomMap: document.querySelector("#roomMap"),
  roomMapLinks: document.querySelector("#roomMapLinks"),
  roomMapHint: document.querySelector("#roomMapHint"),
  roomBattlePanel: document.querySelector("#roomBattlePanel"),
  roomBattleStatus: document.querySelector("#roomBattleStatus"),
  roomMetrics: document.querySelector("#roomMetrics"),
  roomSelfStatus: document.querySelector("#roomSelfStatus"),
  roomThrowButtons: document.querySelector("#roomThrowButtons"),
  roomActionButtons: document.querySelector("#roomActionButtons"),
  roomBattleLog: document.querySelector("#roomBattleLog"),
  roomModeLabel: document.querySelector("#roomModeLabel"),
  roomTitle: document.querySelector("#roomTitle"),
  roomHint: document.querySelector("#roomHint"),
  feedbackLayer: document.querySelector("#feedbackLayer"),
  characterButtons: [...document.querySelectorAll("[data-character]")],
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

function healthBarMarkup(actor) {
  const hearts = Array.from({ length: actor.maxHp }, (_unused, index) => `<img class="health-heart${index < actor.hp ? " active" : ""}" src="assets/ui/health-heart.png" alt="" />`).join("");
  return `<span class="health-bar" aria-label="生命 ${actor.hp}/${actor.maxHp}">${hearts}</span><small class="health-number">${actor.hp}/${actor.maxHp}</small>`;
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
  const feedback = feedbackForAction(entry, actionId);
  const targetId = target.id;
  skillHooks.afterAction(actor, target, actionId, context);
  addLog(entry);
  finishAction(actor, target);
  render();
  if (feedback) triggerFeedback(feedback.kind, feedback.text, targetId);
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

function setRoomStatus(text) {
  if (els.roomStatus) els.roomStatus.textContent = text;
}

function showScreen(screen) {
  const map = {
    start: els.startScreen,
    mode: els.modeScreen,
    character: els.characterScreen,
    game: els.gameShell,
    room: els.roomShell,
  };
  Object.values(map).forEach((node) => node && node.classList.add("hidden"));
  if (map[screen]) map[screen].classList.remove("hidden");
}

function renderCharacterPicker() {
  const character = characters[selectedCharacter] || characters.scout;
  els.characterButtons.forEach((button) => {
    button.classList.toggle("selected", button.dataset.character === selectedCharacter);
  });
  if (els.characterSelected) els.characterSelected.textContent = `已选择：${character.icon} ${character.name}`;
}

async function openCharacterSelect(mode) {
  selectedMode = mode;
  const modeName = mode === "single" ? "单人模式" : mode === "team" ? "3v3 阵营模式" : "五人乱战模式";
  if (els.modeCurrent) els.modeCurrent.textContent = modeName;
  if (els.characterModeLabel) els.characterModeLabel.textContent = modeName;
  if (els.characterTitle) els.characterTitle.textContent = "选择你的角色";
  if (els.characterHint) els.characterHint.textContent = mode === "single"
    ? "角色档案会带入你的单人战场。"
    : "角色会同步给房间里的所有玩家。";
  if (els.characterStartBtn) {
    els.characterStartBtn.disabled = mode !== "single";
    els.characterStartBtn.textContent = mode === "single" ? "确认角色并进入单人战场" : "正在创建房间...";
  }
  renderCharacterPicker();
  showScreen("character");
  if (mode !== "single") {
    roomMode = mode;
    roomState = null;
    roomPlayerId = null;
    roomIsHost = true;
    closePeer();
    gameMode = "room";
    updateRoomIntro();
    await openRoomSocket();
    sendNetwork({ type: "createRoom", mode: roomMode, character: selectedCharacter });
    setRoomStatus("正在自动创建房间...");
  }
}

function startSelectedMode() {
  if (selectedMode === "single") {
    startSingleMode();
    return;
  }
  if (!roomState) {
    setRoomStatus("房间仍在创建，请稍候");
    return;
  }
  updateRoomIntro();
  setRoomBattleVisible(false);
  renderRoomLobby();
  showScreen("room");
}

function applySelectedCharacterToSingle() {
  const actor = state.actors.player;
  const character = characters[selectedCharacter] || characters.scout;
  actor.character = selectedCharacter;
  actor.skill = character.name;
  actor.maxHp = character.maxHp;
  actor.hp = character.maxHp;
}

function setRoomBattleVisible(active) {
  if (els.roomBattlePanel) els.roomBattlePanel.classList.toggle("hidden", !active);
  if (els.roomShell) els.roomShell.classList.toggle("battle-active", active);
  document.querySelectorAll(".lobby-only").forEach((node) => node.classList.toggle("hidden", active));
  if (els.roomBattleStatus) {
    els.roomBattleStatus.textContent = active ? "战斗已开始。" : "等待房主开始房间";
  }
}
function roomModeName(mode = roomMode) {
  return mode === "team" ? "阵营模式" : "乱战模式";
}

function roomCapacity(mode = roomMode) {
  return mode === "team" ? 6 : 5;
}

function updateRoomIntro() {
  if (els.roomModeLabel) els.roomModeLabel.textContent = roomModeName();
  if (els.roomTitle) els.roomTitle.textContent = roomMode === "team" ? "3v3 阵营房间" : "五人乱战房间";
  if (els.roomHint) {
    els.roomHint.textContent = roomMode === "team" ? "最多 3v3，房主可以加入人机补位。" : "最多 5 人，各自为战，房主可以加入人机。";
  }
  if (els.roomMapHint) els.roomMapHint.textContent = "";
}

function startSingleMode() {
  closePeer();
  gameMode = "ai";
  isHost = false;
  localActorId = "player";
  state = initialState();
  applySelectedCharacterToSingle();
  pendingThrows = {};
  if (els.localCode) els.localCode.value = "";
  if (els.remoteCode) els.remoteCode.value = "";
  setOnlineStatus("单机：对战电脑");
  showScreen("game");
  render();
}

function openModeRoom(mode) {
  roomMode = mode;
  roomState = null;
  roomPlayerId = null;
  roomIsHost = false;
  closePeer();
  gameMode = "room";
  updateRoomIntro();
  if (els.roomLocalCode) els.roomLocalCode.value = "";
  if (els.roomRemoteCode) els.roomRemoteCode.value = "";
  setRoomStatus("先创建房间，或输入房间码加入。");
  setRoomBattleVisible(false);
  renderRoomLobby();
  showScreen("room");
}

async function createModeRoom() {
  closePeer();
  gameMode = "room";
  roomIsHost = true;
  roomState = null;
  await openRoomSocket();
  sendNetwork({ type: "createRoom", mode: roomMode, character: selectedCharacter });
  setRoomStatus("正在创建房间...");
  renderRoomLobby();
}

async function joinModeRoom() {
  const code = els.roomRemoteCode.value.trim().toUpperCase();
  if (!code) {
    setRoomStatus("请输入房间码");
    return;
  }
  closePeer();
  gameMode = "room";
  roomIsHost = false;
  await openRoomSocket();
  sendNetwork({ type: "joinRoom", code, character: selectedCharacter });
  setRoomStatus(`正在加入房间 ${code}...`);
  renderRoomLobby();
}

async function copyModeRoomCode() {
  const code = els.roomLocalCode.value.trim();
  if (!code) {
    setRoomStatus("还没有房间码");
    return;
  }
  try {
    await navigator.clipboard.writeText(code);
    setRoomStatus(`已复制房间码 ${code}`);
  } catch (_error) {
    els.roomLocalCode.select();
    setRoomStatus("已选中房间码，可以手动复制");
  }
}

function removeRoomBot(playerId) {
  if (!roomIsHost || !playerId) return;
  sendNetwork({ type: "removeBot", playerId });
}

function addRoomBot() {
  if (!roomIsHost) {
    setRoomStatus("只有房主可以加入人机");
    return;
  }
  sendNetwork({ type: "addBot" });
}

function startModeRoom() {
  if (!roomIsHost) {
    setRoomStatus("等待房主开始房间");
    return;
  }
  roomBattle = createRoomBattle(roomState || fallbackRoom(els.roomLocalCode.value.trim() || "ROOM"));
  sendNetwork({ type: "startRoom", battle: roomBattle });
  applyRoomState({ ...(roomState || fallbackRoom(els.roomLocalCode.value.trim() || "ROOM")), started: true });
  renderRoomBattle();
}

function roomPlayerLabel(player) {
  if (player.id === roomPlayerId) return `${player.name}（你）`;
  return player.name;
}

function roomHomeForPlayer(player, index) {
  if (roomMode === "team") return player.team === "B" ? "blueHome" : "redHome";
  return "homeRing";
}

function ensureRoomPlayerId() {
  if (!roomBattle?.players?.length) return;
  if (roomPlayerId && roomBattle.players.some((player) => player.id === roomPlayerId && !player.bot)) return;
  const preferred = roomIsHost
    ? roomBattle.players.find((player) => player.role === "host" && !player.bot)
    : roomBattle.players.find((player) => !player.bot);
  roomPlayerId = preferred?.id || roomBattle.players.find((player) => !player.bot)?.id || roomPlayerId;
}

function createRoomBattle(room) {
  const players = (room?.players || []).map((player, index) => ({
    ...player,
    character: characters[player.character] ? player.character : "scout",
    hp: characters[player.character]?.maxHp || 3,
    maxHp: characters[player.character]?.maxHp || 3,
    asleep: true,
    dead: false,
    location: roomHomeForPlayer(player, index),
    inventory: { knife: false, shield: false, shieldHp: 0, sniper: false, medkit: player.character === "medic" ? 1 : 0, smoke: false, rocket: false },
    medkitTaken: player.character === "medic" ? 1 : 0,
    vanguardPulseArmed: false,
    vanguardPulseUsed: false,
    smoke: false,
    roleUsed: false,
  }));
  const battle = {
    mode: room?.mode || roomMode,
    round: 1,
    phase: "duel",
    message: "第 1 回合：所有存活玩家出拳争夺行动权",
    players,
    throws: {},
    actionQueue: [],
    currentActorId: null,
    gameOver: false,
    winnerText: "",
    supplyDrop: null,
    log: ["战斗开始：所有玩家都在出生房间睡觉。"],
  };
  if (!roomPlayerId && players.some((player) => !player.bot)) {
    roomPlayerId = (roomIsHost ? players.find((player) => player.role === "host" && !player.bot) : players.find((player) => !player.bot))?.id || roomPlayerId;
  }
  return battle;
}

function roomAlivePlayers() {
  return roomBattle ? roomBattle.players.filter((player) => !player.dead) : [];
}

function getRoomPlayer(id) {
  return roomBattle?.players.find((player) => player.id === id) || null;
}

function isRoomEnemy(actor, target) {
  if (!actor || !target || actor.id === target.id || target.dead) return false;
  if (roomBattle.mode === "team") return actor.team !== target.team;
  return true;
}

function roomConnectedLocations(location) {
  const config = roomMapConfigs[roomBattle?.mode || roomMode];
  return config.edges
    .filter(([from, to]) => from === location || to === location)
    .map(([from, to]) => (from === location ? to : from));
}

function roomLocationName(id) {
  return roomMapConfigs[roomBattle?.mode || roomMode].nodes[id]?.name || id;
}
function roomThrowBadge(player) {
  if (!roomBattle || !player) return "";
  const currentChoice = roomBattle.throws?.[player.id];
  const previousChoice = roomBattle.lastThrows?.[player.id];
  if (currentChoice) {
    const canReveal = roomBattle.phase !== "duel" || player.id === roomPlayerId;
    return canReveal ? `${throws[currentChoice].name} ${throws[currentChoice].icon}` : "已出拳";
  }
  if (roomBattle.phase === "duel" && previousChoice) {
    return `上轮 ${throws[previousChoice].name} ${throws[previousChoice].icon}`;
  }
  return player.dead ? "已阵亡" : "未出拳";
}

function roomThrowClass(player) {
  if (!roomBattle || !player) return "";
  if (roomBattle.throws?.[player.id]) return "on";
  if (roomBattle.lastThrows?.[player.id]) return "past";
  return "";
}
function flashRoomPlayer(playerId, kind = "hit") {
  if (!els.roomSlots?.children || !playerId) return;
  const card = [...els.roomSlots.children].find((node) => node.dataset?.playerId === playerId);
  const className = kind === "attack" ? "attack-flash" : "hit-flash";
  if (!card?.classList) return;
  card.classList.remove(className);
  void card.offsetWidth;
  card.classList.add(className);
  setTimeout(() => card.classList.remove(className), 560);
}

function feedbackForRoomAttack(entry) {
  if (entry.includes("烟雾")) return { kind: "smoke", text: "烟雾挡住了攻击！" };
  if (entry.includes("被淘汰")) return { kind: "eliminated", text: "玩家被淘汰！" };
  if (entry.includes("盾")) return { kind: "shield", text: "盾挡住了！" };
  if (entry.includes("造成")) return { kind: "hit", text: entry.includes("2 点") ? "重击命中！" : "受到攻击！" };
  return { kind: "hit", text: "攻击命中！" };
}

function roomAddLog(text) {
  if (!roomBattle) return;
  roomBattle.log.unshift(text);
  roomBattle.log = roomBattle.log.slice(0, 28);
}

function syncRoomBattle() {
  if (gameMode === "room" && roomIsHost && roomBattle) {
    sendNetwork({ type: "roomBattleState", battle: roomBattle });
  }
}

function compareRoomThrows(a, b) {
  if (a === b) return 0;
  if (throws[a]?.beats === b) return -1;
  if (throws[b]?.beats === a) return 1;
  return 0;
}

function resolveRoomDuelIfReady() {
  if (!roomIsHost || !roomBattle || roomBattle.phase !== "duel" || roomBattle.gameOver) return;
  const alive = roomAlivePlayers();
  alive.filter((player) => player.bot && !roomBattle.throws[player.id]).forEach((player) => {
    roomBattle.throws[player.id] = randomThrow();
  });
  if (alive.some((player) => !roomBattle.throws[player.id])) return;

  roomBattle.lastThrows = { ...roomBattle.throws };
  const choices = [...new Set(alive.map((player) => roomBattle.throws[player.id]))];
  if (choices.length !== 2) {
    const reason = choices.length === 3 ? "锤子、剪刀、布同时出现" : "所有人出拳相同";
    roomBattle.message = `第 ${roomBattle.round} 回合平局：${reason}`;
    roomAddLog(`第 ${roomBattle.round} 回合平局：${reason}，重新出拳。`);
    triggerFeedback("tie", "平局！重新出拳");
    roomBattle.round += 1;
    roomBattle.throws = {};
    syncRoomBattle();
    renderRoomBattle();
    return;
  }

  const winningChoice = throws[choices[0]].beats === choices[1] ? choices[0] : choices[1];
  const queue = alive
    .filter((player) => roomBattle.throws[player.id] === winningChoice)
    .sort((a, b) => {
      const knifeDiff = Number(Boolean(b.inventory.knife)) - Number(Boolean(a.inventory.knife));
      if (knifeDiff) return knifeDiff;
      const throwDiff = compareRoomThrows(roomBattle.throws[a.id], roomBattle.throws[b.id]);
      if (throwDiff) return throwDiff;
      return roomBattle.players.findIndex((player) => player.id === a.id) - roomBattle.players.findIndex((player) => player.id === b.id);
    });

  roomBattle.phase = "action";
  roomBattle.actionQueue = queue.map((player) => player.id);
  roomBattle.currentActorId = roomBattle.actionQueue[0] || null;
  roomBattle.message = `第 ${roomBattle.round} 回合：${queue.map((player) => player.name).join("、")} 获得行动权`;
  roomAddLog(`行动队列：${queue.map((player) => `${player.name}${player.inventory.knife ? "（刀优先）" : ""}`).join(" → ")}`);
  triggerFeedback("win", `${queue.map((player) => player.name).join("、")} 赢得行动权！`);
  syncRoomBattle();
  renderRoomBattle();
  maybeRunRoomBotTurn();
}

function spawnRoomSupplyDrop() {
  if (!roomBattle || roomBattle.supplyDrop?.opened) return;
  const locations = roomBattle.mode === "team" ? ["wild", "medBay", "radar"] : ["wild", "armory", "medBay", "radar"];
  const item = ["medkit", "smoke", "shield", "rocket", "rocket"][Math.floor(Math.random() * 5)];
  roomBattle.supplyDrop = { location: locations[Math.floor(Math.random() * locations.length)], item, opened: false };
  roomAddLog(`战场空投落在${roomLocationName(roomBattle.supplyDrop.location)}：${items[item].name}。`);
}

function roomWinText() {
  const alive = roomAlivePlayers();
  if (roomBattle.mode === "team") {
    const teams = [...new Set(alive.map((player) => player.team))];
    if (teams.length === 1) return teams[0] === "A" ? "红队获胜" : "蓝队获胜";
    return "";
  }
  if (alive.length === 1) return `${alive[0].name} 获胜`;
  return "";
}

function finishRoomAction() {
  const winner = roomWinText();
  if (winner) {
    roomBattle.gameOver = true;
    roomBattle.phase = "gameOver";
    roomBattle.winnerText = winner;
    roomBattle.message = winner;
    roomAddLog(winner);
    syncRoomBattle();
    renderRoomBattle();
    return;
  }

  roomBattle.actionQueue.shift();
  // An eliminated player may have been waiting later in this round's queue.
  // Remove them before selecting the next actor so the battle cannot stall.
  roomBattle.actionQueue = roomBattle.actionQueue.filter((id) => !getRoomPlayer(id)?.dead);
  if (roomBattle.actionQueue.length) {
    roomBattle.currentActorId = roomBattle.actionQueue[0];
    roomBattle.message = `轮到 ${getRoomPlayer(roomBattle.currentActorId).name} 行动`;
  } else {
    roomBattle.round += 1;
    roomBattle.phase = "duel";
    roomBattle.currentActorId = null;
    roomBattle.throws = {};
    triggerVanguardPulses();
    if (roomWinText()) {
      roomBattle.gameOver = true;
      roomBattle.phase = "gameOver";
      roomBattle.winnerText = roomWinText();
      roomBattle.message = roomBattle.winnerText;
      roomAddLog(roomBattle.winnerText);
    }
    if (roomBattle.round % 3 === 0) spawnRoomSupplyDrop();
    roomBattle.message = roomBattle.supplyDrop && !roomBattle.supplyDrop.opened
      ? `第 ${roomBattle.round} 回合：空投已落在${roomLocationName(roomBattle.supplyDrop.location)}`
      : `第 ${roomBattle.round} 回合：所有存活玩家重新出拳`;
  }
  syncRoomBattle();
  renderRoomBattle();
  maybeRunRoomBotTurn();
}

function applyVanguardPulseDamage(actor, target) {
  if (target.smoke) { target.smoke = false; return `${target.name} 的烟雾弹挡住了震荡波。`; }
  if (target.inventory.shield) { target.inventory.shield = false; target.inventory.shieldHp = 0; return `${target.name} 的盾挡住了震荡波。`; }
  target.hp = Math.max(0, target.hp - 2);
  if (target.hp === 0) target.dead = true;
  return `${actor.name} 的震荡波命中 ${target.name}，造成 2 点伤害。${target.dead ? ` ${target.name} 被淘汰！` : ""}`;
}

function triggerVanguardPulses() {
  roomBattle.players.filter((actor) => actor.vanguardPulseArmed && !actor.dead).forEach((actor) => {
    actor.vanguardPulseArmed = false;
    const nearby = roomConnectedLocations(actor.location);
    roomBattle.players.filter((target) => !target.dead && nearby.includes(target.location)).forEach((target) => {
      const entry = applyVanguardPulseDamage(actor, target);
      roomAddLog(entry);
    });
  });
}

function medkitLimit(player) {
  return player.character === "medic" ? 2 : 1;
}

function roomRoleSkillLabel(player) {
  if (player.character === "vanguard") return player.vanguardPulseUsed ? "震荡波已使用" : player.vanguardPulseArmed ? "震荡波待触发" : "震荡波可用";
  if (player.character === "medic") return "远程急救可用";
  return "疾行常驻";
}

function useRoomRoleSkill(actor, target) {
  actor.roleUsed = true;
  if (actor.character === "medic") {
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + 2);
    return `${actor.name} 对 ${target.name} 施放战地急救，恢复了 ${target.hp - before} 点生命。`;
  }
  if (target.smoke) {
    target.smoke = false;
    return `${target.name} 的烟雾弹生效，${actor.name} 的强袭落空。`;
  }
  if (target.inventory.shield) return `${actor.name} 发动强袭，但被 ${target.name} 的盾挡住。`;
  target.hp = Math.max(0, target.hp - 2);
  if (target.hp === 0) target.dead = true;
  return `${actor.name} 发动强袭，造成 2 点伤害。${target.dead ? ` ${target.name} 被淘汰！` : ""}`;
}

function damageRoomTarget(actor, target) {
  if (target.smoke) {
    target.smoke = false;
    return `${target.name} 的烟雾弹生效，${actor.name} 的攻击落空。`;
  }
  if (actor.inventory.knife) {
    if (target.inventory.shield) {
      target.inventory.shield = false;
      target.inventory.shieldHp = 0;
      return `${actor.name} 用刀破坏了 ${target.name} 的盾，伤害被盾挡住。`;
    }
    target.hp = Math.max(0, target.hp - 2);
    if (target.hp === 0) target.dead = true;
    return `${actor.name} 用刀攻击 ${target.name}，造成 2 点伤害。${target.dead ? ` ${target.name} 被淘汰！` : ""}`;
  }
  if (target.inventory.shield) return `${actor.name} 手刀攻击 ${target.name}，但被盾挡住。`;
  target.hp = Math.max(0, target.hp - 1);
  if (target.hp === 0) target.dead = true;
  return `${actor.name} 手刀攻击 ${target.name}，造成 1 点伤害。${target.dead ? ` ${target.name} 被淘汰！` : ""}`;
}

function fireRoomRocket(actor, target) {
  actor.inventory.rocket = false;
  if (target.inventory.shield) {
    target.inventory.shield = false;
    target.inventory.shieldHp = 0;
    return `${actor.name} 发射火箭筒，${target.name} 的盾完全挡住了爆炸。`;
  }
  target.hp = Math.max(0, target.hp - 3);
  if (target.hp === 0) target.dead = true;
  return `${actor.name} 发射火箭筒远程轰击 ${target.name}，造成 3 点伤害。${target.dead ? ` ${target.name} 被淘汰！` : ""}`;
}

function getRoomActions(actorId) {
  const actor = getRoomPlayer(actorId);
  if (!roomBattle || !actor || actor.dead || roomBattle.phase !== "action" || roomBattle.currentActorId !== actorId) return [];
  if (actor.asleep) return [{ id: "wake", label: "起床" }];
  const actions = [];
  const mapNodes = Object.keys(roomMapConfigs[roomBattle.mode].nodes);
  const destinations = actor.character === "scout"
    ? mapNodes.filter((to) => to !== actor.location)
    : roomConnectedLocations(actor.location);
  destinations.forEach((to) => actions.push({
    id: "move",
    to,
    label: `${actor.character === "scout" ? "疾行去" : "去"}${roomLocationName(to)}`,
  }));
  if (actor.location === "armory") {
    ["knife", "shield", "sniper"].forEach((item) => {
      const data = items[item];
      if (!actor.inventory[item]) actions.push({ id: "take", item, label: `拿${data.name}` });
    });
  }
  if (actor.location === "medBay" && actor.medkitTaken < medkitLimit(actor)) actions.push({ id: "take", item: "medkit", label: "拿医疗包" });
  if (actor.location === "radar" && !actor.inventory.smoke) actions.push({ id: "take", item: "smoke", label: "拿烟雾弹" });
  if (actor.inventory.medkit > 0 && actor.hp < actor.maxHp) actions.push({ id: "useMedkit", label: "使用医疗包" });
  if (actor.inventory.smoke && !actor.smoke) actions.push({ id: "useSmoke", label: "释放烟雾弹" });
  if (roomBattle.supplyDrop && !roomBattle.supplyDrop.opened && roomBattle.supplyDrop.location === actor.location && (roomBattle.supplyDrop.item !== "medkit" || actor.medkitTaken < medkitLimit(actor))) {
    actions.push({ id: "takeSupply", label: `拿空投${items[roomBattle.supplyDrop.item].name}` });
  }
  const nearbyEnemies = roomBattle.players.filter((target) => isRoomEnemy(actor, target) && target.location === actor.location);
  if (actor.inventory.rocket) {
    roomBattle.players.filter((target) => isRoomEnemy(actor, target)).forEach((target) => {
      actions.push({ id: "fireRocket", targetId: target.id, label: `火箭轰击${target.name}` });
    });
  }
  if (actor.character === "vanguard" && !actor.vanguardPulseUsed && !actor.vanguardPulseArmed) {
    actions.push({ id: "vanguardPulse", label: "启动震荡波" });
  }
  if (actor.character === "medic") {
    roomBattle.players
      .filter((target) => !target.dead && target.team === actor.team && target.hp < target.maxHp)
      .forEach((target) => actions.push({ id: "medicHeal", targetId: target.id, label: `远程急救${target.name}` }));
  }
  nearbyEnemies.forEach((target) => actions.push({ id: "attack", targetId: target.id, label: `攻击${target.name}` }));
  return actions;
}

function runRoomAction(actorId, action) {
  if (!roomBattle) return;
  if (!roomIsHost) {
    sendNetwork({ type: "roomAction", actorId, action });
    return;
  }
  const actor = getRoomPlayer(actorId);
  if (!actor || actor.dead || roomBattle.currentActorId !== actorId) return;
  const available = getRoomActions(actorId).some((item) => JSON.stringify(item) === JSON.stringify(action));
  if (!available) return;

  let entry = "";
  if (action.id === "wake") {
    actor.asleep = false;
    entry = `${actor.name} 起床了。`;
  } else if (action.id === "move") {
    actor.location = action.to;
    entry = `${actor.name} 前往 ${roomLocationName(action.to)}。`;
  } else if (action.id === "take") {
    if (action.item === "medkit") {
      actor.inventory.medkit += 1;
      actor.medkitTaken += 1;
    } else {
      actor.inventory[action.item] = true;
    }
    if (action.item === "shield") actor.inventory.shieldHp = 1;
    entry = `${actor.name} 拿到了 ${items[action.item].name}。`;
  } else if (action.id === "useMedkit") {
    const restored = 1;
    const before = actor.hp;
    actor.hp = Math.min(actor.maxHp, actor.hp + restored);
    actor.inventory.medkit -= 1;
    entry = `${actor.name} 使用医疗包，恢复了 ${actor.hp - before} 点生命。`;
  } else if (action.id === "useSmoke") {
    actor.inventory.smoke = false;
    actor.smoke = true;
    entry = `${actor.name} 释放了烟雾弹，下一次受到的攻击会落空。`;
  } else if (action.id === "fireRocket") {
    const target = getRoomPlayer(action.targetId);
    if (!target || !isRoomEnemy(actor, target)) return;
    entry = fireRoomRocket(actor, target);
    triggerFeedback("attack", `${actor.name} 发射火箭筒！`, actor.id);
    const rocketFeedback = feedbackForRoomAttack(entry);
    triggerFeedback(rocketFeedback.kind, entry.includes("盾") ? "盾挡住了火箭！" : "火箭命中！", target.id);
  } else if (action.id === "takeSupply") {
    const drop = roomBattle.supplyDrop;
    if (!drop || drop.opened || drop.location !== actor.location) return;
    if (drop.item === "medkit") {
      if (actor.medkitTaken >= medkitLimit(actor)) return;
      actor.inventory.medkit += 1;
      actor.medkitTaken += 1;
    } else {
      actor.inventory[drop.item] = true;
    }
    if (drop.item === "shield") actor.inventory.shieldHp = 1;
    drop.opened = true;
    entry = `${actor.name} 拿到了空投：${items[drop.item].name}。`;
  } else if (action.id === "vanguardPulse") {
    if (actor.character !== "vanguard" || actor.vanguardPulseUsed) return;
    actor.vanguardPulseUsed = true;
    actor.vanguardPulseArmed = true;
    entry = `${actor.name} 启动震荡波：下一回合会攻击相邻地区的所有人。`;
    triggerFeedback("win", "震荡波已就绪！", actor.id);
  } else if (action.id === "medicHeal") {
    const target = getRoomPlayer(action.targetId);
    if (!target || target.dead || actor.character !== "medic" || target.team !== actor.team || target.hp >= target.maxHp) return;
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + 1);
    entry = `${actor.name} 远程急救 ${target.name}，恢复了 ${target.hp - before} 点生命。`;
    triggerFeedback("shield", "远程急救生效！", target.id);
  } else if (action.id === "attack") {
    const target = getRoomPlayer(action.targetId);
    if (!target || target.location !== actor.location || !isRoomEnemy(actor, target)) return;
    entry = damageRoomTarget(actor, target);
    triggerFeedback("attack", `${actor.name} 发动攻击！`, actor.id);
    const resultFeedback = feedbackForRoomAttack(entry);
    triggerFeedback(resultFeedback.kind, resultFeedback.text, target.id);
  }
  roomAddLog(entry);
  finishRoomAction();
}

function chooseRoomBotAction(actorId) {
  const actions = getRoomActions(actorId);
  if (!actions.length) return null;
  const actor = getRoomPlayer(actorId);
  const sensibleAttack = actions.find((action) => {
    if (action.id !== "attack") return false;
    const target = getRoomPlayer(action.targetId);
    return !target?.inventory.shield || actor.inventory.knife;
  });
  return (
    actions.find((action) => action.id === "wake") ||
    actions.find((action) => action.id === "medicHeal") ||
    actions.find((action) => action.id === "vanguardPulse") ||
    actions.find((action) => action.id === "fireRocket") ||
    sensibleAttack ||
    actions.find((action) => action.id === "take" && action.item === "knife") ||
    actions.find((action) => action.id === "take" && action.item === "shield") ||
    actions.find((action) => action.id === "take") ||
    actions.find((action) => action.to === "armory") ||
    actions.find((action) => {
      const enemies = roomBattle.players.filter((target) => isRoomEnemy(actor, target) && !target.dead);
      return enemies.some((target) => target.location === action.to);
    }) ||
    actions[0]
  );
}

function maybeRunRoomBotTurn() {
  if (!roomIsHost || !roomBattle || roomBattle.phase !== "action") return;
  const actor = getRoomPlayer(roomBattle.currentActorId);
  if (!actor?.bot) return;
  setTimeout(() => {
    const action = chooseRoomBotAction(actor.id);
    if (action) runRoomAction(actor.id, action);
  }, 450);
}

function submitRoomThrow(choice) {
  if (!roomBattle || roomBattle.phase !== "duel" || roomBattle.gameOver) return;
  const actor = getRoomPlayer(roomPlayerId);
  if (!actor || actor.dead || actor.bot) return;
  roomBattle.throws[roomPlayerId] = choice;
  if (roomIsHost) {
    resolveRoomDuelIfReady();
    syncRoomBattle();
    renderRoomBattle();
  } else {
    sendNetwork({ type: "roomThrow", actorId: roomPlayerId, choice });
    renderRoomBattle();
  }
}

function activateRoomSkill(skill) {
  const actor = getRoomPlayer(roomPlayerId);
  if (!actor || actor.dead || roomBattle?.currentActorId !== actor.id || roomBattle?.phase !== "action") return;
  if (skill === "vanguard") {
    const action = getRoomActions(actor.id).find((item) => item.id === "vanguardPulse");
    if (action) runRoomAction(actor.id, action);
    return;
  }
  const healable = getRoomActions(actor.id).some((item) => item.id === "medicHeal");
  if (!healable) return;
  roomSkillTargeting = "medic";
  roomBattle.message = "远程急救：点击一名受伤队友的角色卡";
  renderRoomBattle();
}

function renderRoomSelfStatus() {
  if (!els.roomSelfStatus || !roomBattle) return;
  const player = getRoomPlayer(roomPlayerId);
  if (!player) return;
  const character = characters[player.character] || characters.scout;
  const portrait = `assets/characters/${player.character || "scout"}.png`;
  els.roomSelfStatus.innerHTML = `<img class="self-status-portrait" src="${portrait}" alt="${character.name}" /><div class="self-status-main"><span>我的状态</span><strong>${roomPlayerLabel(player)}</strong><small>${character.icon} ${character.name} · ${roomRoleSkillLabel(player)}</small>${healthBarMarkup(player)}</div><div class="self-status-detail"><b>${roomLocationName(player.location)}</b><small>${player.dead ? "已淘汰" : player.asleep ? "睡觉中" : "已起床"}</small><div><i class="${player.inventory.knife ? "on" : ""}">刀</i><i class="${player.inventory.shield ? "on" : ""}">盾</i><i class="${player.inventory.sniper ? "on" : ""}">狙</i><i class="${player.inventory.medkit ? "on" : ""}">医${player.inventory.medkit}</i><i class="${player.inventory.smoke || player.smoke ? "on" : ""}">烟</i><i class="${player.inventory.rocket ? "on" : ""}">炮</i></div></div>`;
  if (player.character === "vanguard" || player.character === "medic") {
    const button = document.createElement("button");
    button.className = "self-skill-button";
    button.type = "button";
    button.disabled = player.dead || player.asleep || roomBattle.phase !== "action" || roomBattle.currentActorId !== player.id || (player.character === "vanguard" && player.vanguardPulseUsed);
    button.textContent = player.character === "vanguard" ? (player.vanguardPulseUsed ? "限定技已用" : "限定技：震荡波") : "主动技：远程急救";
    button.addEventListener("click", () => activateRoomSkill(player.character));
    els.roomSelfStatus.appendChild(button);
  }
}

function renderRoomBattle() {
  if (!roomBattle) return;
  ensureRoomPlayerId();
  setRoomBattleVisible(true);
  renderRoomSelfStatus();
  renderRoomMap();
  renderRoomLobby();
  if (els.roomBattleStatus) els.roomBattleStatus.textContent = roomBattle.message;
  if (els.roomMetrics) {
    const alive = roomAlivePlayers().length;
    const drop = roomBattle.supplyDrop && !roomBattle.supplyDrop.opened
      ? `空投：${roomLocationName(roomBattle.supplyDrop.location)}`
      : roomBattle.round % 3 === 2 ? "下一回合有空投" : "战场平稳";
    els.roomMetrics.innerHTML = `<span>回合 ${roomBattle.round}</span><span>存活 ${alive}</span><span>${drop}</span>`;
  }
  if (els.roomThrowButtons) {
    els.roomThrowButtons.innerHTML = "";
    Object.entries(throws).forEach(([choice, data]) => {
      const button = document.createElement("button");
      button.className = "room-throw-button";
      button.type = "button";
      button.textContent = `${data.name} ${data.icon}`;
      button.classList.toggle("selected", roomBattle.throws[roomPlayerId] === choice);
      button.disabled = roomBattle.phase !== "duel" || Boolean(roomBattle.throws[roomPlayerId]) || getRoomPlayer(roomPlayerId)?.dead;
      button.addEventListener("click", () => submitRoomThrow(choice));
      els.roomThrowButtons.appendChild(button);
    });
  }
  if (els.roomActionButtons) {
    els.roomActionButtons.innerHTML = "";
    const localActor = getRoomPlayer(roomPlayerId);
    const actions = getRoomActions(roomPlayerId).filter((action) => !["vanguardPulse", "medicHeal"].includes(action.id) && !(localActor?.character === "scout" && action.id === "move"));
    if (!actions.length) {
      const disabled = document.createElement("button");
      disabled.className = "room-action-button";
      disabled.disabled = true;
      disabled.textContent = roomBattle.phase === "action" ? "等待其他玩家行动" : "先出拳争夺行动权";
      els.roomActionButtons.appendChild(disabled);
    } else {
      actions.forEach((action) => {
        const button = document.createElement("button");
        button.className = "room-action-button primary";
        button.type = "button";
        button.textContent = action.label;
        button.addEventListener("click", () => runRoomAction(roomPlayerId, action));
        els.roomActionButtons.appendChild(button);
      });
    }
  }
  if (els.roomBattleLog) {
    els.roomBattleLog.innerHTML = "";
    roomBattle.log.forEach((entry) => {
      const item = document.createElement("li");
      item.textContent = entry;
      els.roomBattleLog.appendChild(item);
    });
  }
}
function linkedRoomNames(config, nodeId) {
  return config.edges
    .filter(([from, to]) => from === nodeId || to === nodeId)
    .map(([from, to]) => config.nodes[from === nodeId ? to : from].name);
}

function edgeClass(from, to) {
  return `edge-${[from, to].sort().join("-")}`;
}

function renderRoomMap() {
  if (!els.roomMap) return;
  const config = roomMapConfigs[roomMode];
  els.roomMap.innerHTML = "";
  els.roomMap.className = `battle-map-layout ${roomMode}-map`;
  if (els.roomMapLinks) els.roomMapLinks.innerHTML = "";

  const lines = document.createElement("div");
  lines.className = "map-lines";
  config.edges.forEach(([from, to]) => {
    const line = document.createElement("span");
    line.className = `map-connector ${edgeClass(from, to)}`;
    lines.appendChild(line);
  });
  els.roomMap.appendChild(lines);

  Object.entries(config.nodes).forEach(([id, node]) => {
    const card = document.createElement("article");
    const occupants = (roomBattle?.players || []).filter((player) => player.location === id);
    card.className = `room-map-node ${node.className} pos-${node.pos}`;
    card.dataset.node = id;
    const localActor = getRoomPlayer(roomPlayerId);
    const directMove = localActor?.character === "scout"
      ? getRoomActions(roomPlayerId).find((action) => action.id === "move" && action.to === id)
      : null;
    if (directMove) {
      card.classList.add("reachable");
      card.title = `点击疾行到${node.name}`;
      card.addEventListener("click", () => runRoomAction(roomPlayerId, directMove));
      card.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") runRoomAction(roomPlayerId, directMove);
      });
    }
    card.innerHTML = `<strong>${node.name}</strong>`;
    if (roomBattle?.supplyDrop && !roomBattle.supplyDrop.opened && roomBattle.supplyDrop.location === id) {
      const drop = document.createElement("span");
      drop.className = "supply-marker";
      drop.textContent = `空投 ${items[roomBattle.supplyDrop.item].name}`;
      card.appendChild(drop);
    }
    if (occupants.length) {
      const list = document.createElement("div");
      list.className = "map-occupants";
      occupants.forEach((player) => {
        const chip = document.createElement("span");
        const teamClass = player.team === "A" ? "team-a" : player.team === "B" ? "team-b" : "";
        chip.className = `map-token ${teamClass}${player.id === roomPlayerId ? " you" : ""}${player.dead ? " dead" : ""}`;
        chip.textContent = player.id === roomPlayerId ? "你" : player.name;
        list.appendChild(chip);
      });
      card.appendChild(list);
    }
    els.roomMap.appendChild(card);
  });
}
function renderRoomLobby() {
  renderRoomMap();
  if (!els.roomSlots) return;
  els.roomSlots.innerHTML = "";
  const players = roomBattle?.players || roomState?.players || [];
  const max = roomState?.maxPlayers || roomCapacity();
  for (let index = 0; index < max; index += 1) {
    const player = players[index];
    const slot = document.createElement("article");
    const teamClass = player?.team === "A" ? "team-a" : player?.team === "B" ? "team-b" : "";
    const wonRound = Boolean(roomBattle?.phase === "action" && player && roomBattle.actionQueue.includes(player.id));
    slot.className = `slot-card ${player ? teamClass : "empty"}${player?.dead ? " dead" : ""}${wonRound ? " round-winner" : ""}${roomBattle?.currentActorId === player?.id ? " active-turn" : ""}`;
    if (player) slot.dataset.playerId = player.id;
    if (player) {
      const team = (roomBattle?.mode || roomState?.mode) === "team" ? (player.team === "A" ? "红队" : "蓝队") : "乱战";
      const character = characters[player.character] || characters.scout;
      if (roomBattle) {
        slot.innerHTML = `<div class="slot-throw ${roomThrowClass(player)}">${roomThrowBadge(player)}</div><strong>${roomPlayerLabel(player)}</strong><small>${character.icon} ${character.name} · ${roomRoleSkillLabel(player)} · ${team} · ${player.bot ? "人机" : player.role === "host" ? "房主" : "玩家"} · ${player.dead ? "死亡" : player.asleep ? "睡觉中" : "已起床"}</small><div class="slot-stats"><span class="slot-chip hp-chip">${healthBarMarkup(player)}</span><span class="slot-chip">${roomLocationName(player.location)}</span><span class="slot-chip ${player.inventory.knife ? "on" : ""}">刀</span><span class="slot-chip ${player.inventory.shield ? "on" : ""}">盾</span><span class="slot-chip ${player.inventory.sniper ? "on" : ""}">狙</span><span class="slot-chip ${player.inventory.medkit ? "on" : ""}">医</span><span class="slot-chip ${player.inventory.smoke || player.smoke ? "on" : ""}">烟</span><span class="slot-chip ${player.inventory.rocket ? "on" : ""}">炮</span></div>`;
      } else {
        slot.innerHTML = `<strong>${roomPlayerLabel(player)}</strong><small>${character.icon} ${character.name} · ${team} · ${player.bot ? "人机" : player.role === "host" ? "房主" : "玩家"}</small>`;
        if (player.bot && roomIsHost) {
          const remove = document.createElement("button");
          remove.className = "bot-remove";
          remove.type = "button";
          remove.textContent = "×";
          remove.title = `删除${player.name}`;
          if (remove.setAttribute) remove.setAttribute("aria-label", `删除${player.name}`);
          remove.addEventListener("click", () => removeRoomBot(player.id));
          slot.appendChild(remove);
        }
      }
    } else {
      slot.innerHTML = `<strong>空位 ${index + 1}</strong><small>${roomMode === "team" ? "等待玩家或人机" : "等待加入"}</small>`;
    }
    if (player && roomSkillTargeting === "medic" && player.team === getRoomPlayer(roomPlayerId)?.team && !player.dead && player.hp < player.maxHp) {
      slot.classList.add("skill-target");
      slot.addEventListener("click", () => {
        const action = getRoomActions(roomPlayerId).find((item) => item.id === "medicHeal" && item.targetId === player.id);
        if (!action) return;
        roomSkillTargeting = null;
        runRoomAction(roomPlayerId, action);
      });
    }
    els.roomSlots.appendChild(slot);
  }
}

function fallbackRoom(code, playerId = roomPlayerId) {
  return {
    code,
    mode: roomMode,
    maxPlayers: roomCapacity(),
    started: false,
    players: [
      {
        id: playerId || "local-host",
        name: roomIsHost ? "房主" : "玩家 1",
        role: roomIsHost ? "host" : "guest",
        team: roomMode === "team" ? "A" : null,
        bot: false,
        connected: true,
      },
    ],
  };
}

function applyRoomState(room) {
  if (!room) return;
  roomState = room;
  if (room?.mode && room.mode !== "duel") roomMode = room.mode;
  updateRoomIntro();
  if (els.roomLocalCode && room?.code) els.roomLocalCode.value = room.code;
  setRoomBattleVisible(Boolean(room.started));
  renderRoomLobby();
}

function triggerFeedback(kind, text, targetId) {
  if (els.feedbackLayer && els.feedbackLayer.appendChild) {
    const pop = document.createElement("div");
    pop.className = `feedback-pop ${kind}`;
    pop.textContent = text;
    els.feedbackLayer.appendChild(pop);
    setTimeout(() => {
      if (pop.remove) pop.remove();
    }, 1200);
  }

  if (kind === "tie" && els.roundResult?.classList) {
    els.roundResult.classList.remove("tie-flash");
    void els.roundResult.offsetWidth;
    els.roundResult.classList.add("tie-flash");
  }

  if (targetId) {
    const { left, right } = localSideIds();
    const card = targetId === left ? els.playerCard : targetId === right ? els.computerCard : null;
    const className = kind === "attack" ? "attack-flash" : "hit-flash";
    if (card?.classList) {
      card.classList.remove(className);
      void card.offsetWidth;
      card.classList.add(className);
      setTimeout(() => card.classList.remove(className), 560);
    }
    flashRoomPlayer(targetId, kind);
  }
}

function feedbackForAction(entry, actionId) {
  if (entry.includes("被盾挡住") || entry.includes("盾完全挡住")) return { kind: "shield", text: "盾挡住了！" };
  if (["meleeAttack", "vehicleAttack", "fireSniper"].includes(actionId)) return { kind: "hit", text: entry.includes("杀死") || entry.includes("射杀") ? "致命一击！" : "受到攻击！" };
  return null;
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
  channel.onclose = () => (gameMode === "room" ? setRoomStatus("房间连接断开") : setOnlineStatus("联机断开"));
  channel.onerror = () => (gameMode === "room" ? setRoomStatus("连接房间服务器失败") : setOnlineStatus("连接房间服务器失败"));
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
  sendNetwork({ type: "createRoom", mode: "duel" });
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
  sendNetwork({ type: "joinRoom", code, character: selectedCharacter });
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
  if (gameMode === "room" && message.type === "roomCreated") {
    roomIsHost = true;
    roomPlayerId = message.playerId || "local-host";
    applyRoomState(message.room || fallbackRoom(message.code, roomPlayerId));
    setRoomStatus(`房间 ${message.code}：等待玩家加入`);
    if (selectedMode !== "single" && els.characterStartBtn) {
      els.characterStartBtn.disabled = false;
      els.characterStartBtn.textContent = "确认角色并进入房间";
      if (els.characterHint) els.characterHint.textContent = `房间 ${message.code} 已创建，选择角色后进入大厅。`;
    }
    return;
  }

  if (gameMode === "room" && message.type === "joined") {
    roomPlayerId = message.playerId || roomPlayerId || "local-player";
    applyRoomState(message.room || fallbackRoom(message.code, roomPlayerId));
    setRoomStatus(roomIsHost ? `房间 ${message.code}：有玩家加入` : `已加入房间 ${message.code}`);
    return;
  }

  if (gameMode === "room" && message.type === "roomUpdate") {
    applyRoomState(message.room);
    setRoomStatus(`房间 ${message.room.code}：${message.room.players.length}/${message.room.maxPlayers}`);
    return;
  }

  if (gameMode === "room" && message.type === "roomStarted") {
    roomBattle = message.battle || createRoomBattle(message.room);
    applyRoomState(message.room);
    setRoomStatus("房间已开始，进入战斗界面。");
    renderRoomBattle();
    return;
  }

  if (gameMode === "room" && message.type === "roomBattleState") {
    roomBattle = message.battle;
    renderRoomBattle();
    return;
  }

  if (gameMode === "room" && message.type === "roomThrow") {
    if (roomIsHost && roomBattle) {
      roomBattle.throws[message.actorId] = message.choice;
      resolveRoomDuelIfReady();
      syncRoomBattle();
      renderRoomBattle();
    }
    return;
  }

  if (gameMode === "room" && message.type === "roomAction") {
    if (roomIsHost) runRoomAction(message.actorId, message.action);
    return;
  }
  if (gameMode === "room" && message.type === "hostChanged") {
    roomIsHost = true;
    setRoomStatus("你现在是房主");
    return;
  }

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
    if (gameMode === "room") setRoomStatus(message.message || "房间错误");
    else setOnlineStatus(message.message || "联机错误");
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
    triggerFeedback("tie", "平局！无人行动");
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
    triggerFeedback("tie", "平局！无人行动");
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
  els.playerHp.innerHTML = healthBarMarkup(leftActor);
  els.computerHp.innerHTML = healthBarMarkup(rightActor);
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

els.startGameBtn.addEventListener("click", () => showScreen("mode"));
els.modeBackBtn.addEventListener("click", () => showScreen("start"));
els.characterButtons.forEach((button) => button.addEventListener("click", () => {
  selectedCharacter = characters[button.dataset.character] ? button.dataset.character : "scout";
  if (gameMode === "room" && roomState && !roomState.started) sendNetwork({ type: "setCharacter", character: selectedCharacter });
  renderCharacterPicker();
}));
els.singleModeBtn.addEventListener("click", () => openCharacterSelect("single").catch((error) => setRoomStatus(`创建房间失败：${error.message}`)));
els.teamModeBtn.addEventListener("click", () => openCharacterSelect("team").catch((error) => setRoomStatus(`创建房间失败：${error.message}`)));
els.chaosModeBtn?.addEventListener("click", () => openCharacterSelect("chaos").catch((error) => setRoomStatus(`创建房间失败：${error.message}`)));
els.characterBackBtn.addEventListener("click", () => showScreen("mode"));
els.characterStartBtn.addEventListener("click", startSelectedMode);
els.gameModeBtn.addEventListener("click", () => {
  closePeer();
  showScreen("mode");
});
els.roomBackBtn.addEventListener("click", () => {
  closePeer();
  showScreen("mode");
});
els.roomToHomeBtn.addEventListener("click", () => {
  closePeer();
  showScreen("start");
});
els.roomCreateBtn?.addEventListener("click", () => createModeRoom().catch((error) => setRoomStatus(`创建失败：${error.message}`)));
els.roomJoinBtn.addEventListener("click", () => joinModeRoom().catch((error) => setRoomStatus(`加入失败：${error.message}`)));
els.roomCopyBtn.addEventListener("click", () => copyModeRoomCode());
els.roomAddBotBtn.addEventListener("click", addRoomBot);
els.roomStartBtn.addEventListener("click", startModeRoom);els.playerCard.addEventListener("click", () => handleTargetCardClick(localSideIds().left));
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
if (typeof navigator !== "undefined" && navigator.serviceWorker && typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}