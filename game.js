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
  engineer: { name: "工兵", icon: "▣", maxHp: 3 },
};

const bosses = {
  overlord: { name: "霸主", icon: "♛", maxHp: 12, skills: ["暴君横扫", "威慑怒吼", "霸主体魄"] },
  stalker: { name: "追猎者", icon: "◉", maxHp: 10, skills: ["追猎突袭", "致命追猎", "猎杀本能"] },
  magician: { name: "魔术师", icon: "✦", maxHp: 8, skills: ["瞬移", "卡牌疗愈", "改写结果", "魔术终幕"] },
};

function roleConfig(id) {
  return bosses[id] || characters[id] || characters.scout;
}

function roomMapConfig(mode = roomBattle?.mode || roomMode) {
  return roomMapConfigs[mode === "boss" ? "team" : mode] || roomMapConfigs.team;
}
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
let roomSkillMode = null;
let roomHealAmount = 1;
let roomMagicianEdits = {};
let roomLogOpen = false;
let roomDuelChoice = null;
let roomDuelTimer = null;
let roomDuelReveal = null;
let roomDuelRevealTimer = null;
let roomDuelRevealRound = null;
let roomActionReportTimer = null;
let roomBotTurnTimer = null;
let mobileBattlePanelMode = null;
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
  characterPreview: document.querySelector("#characterPreview"),
  characterName: document.querySelector("#characterName"),
  characterDescription: document.querySelector("#characterDescription"),
  characterSkills: document.querySelector("#characterSkills"),
  characterBackBtn: document.querySelector("#characterBackBtn"),
  characterStartBtn: document.querySelector("#characterStartBtn"),
  gameShell: document.querySelector("#gameShell"),
  roomShell: document.querySelector("#roomShell"),
  startGameBtn: document.querySelector("#startGameBtn"),
  modeBackBtn: document.querySelector("#modeBackBtn"),
  modeCurrent: document.querySelector("#modeCurrent"),
  singleModeBtn: document.querySelector("#singleModeBtn"),
  teamModeBtn: document.querySelector("#teamModeBtn"),
  bossModeBtn: document.querySelector("#bossModeBtn"),
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
  roomDuelScreen: document.querySelector("#roomDuelScreen"),
  roomBattleStatus: document.querySelector("#roomBattleStatus"),
  roomMetrics: document.querySelector("#roomMetrics"),
  roomSelfStatus: document.querySelector("#roomSelfStatus"),
  roomTeamA: document.querySelector("#roomTeamA"),
  roomTeamB: document.querySelector("#roomTeamB"),
  roomBossStatus: document.querySelector("#roomBossStatus"),
  roomSkillButtons: document.querySelector("#roomSkillButtons"),
  roomBossPanel: document.querySelector("#roomBossPanel"),
  roomSkillDialog: document.querySelector("#roomSkillDialog"),
  mobileBattleDock: document.querySelector("#mobileBattleDock"),
  mobileBattlePanel: document.querySelector("#mobileBattlePanel"),
  mobileBattlePanelBody: document.querySelector("#mobileBattlePanelBody"),
  mobileBattlePanelTitle: document.querySelector("#mobileBattlePanelTitle"),
  mobileBattlePanelClose: document.querySelector("#mobileBattlePanelClose"),
  roomThrowButtons: document.querySelector("#roomThrowButtons"),
  roomActionButtons: document.querySelector("#roomActionButtons"),
  roomBattleLog: document.querySelector("#roomBattleLog"),
  roomResultOverlay: document.querySelector("#roomResultOverlay"),
  roomResultTitle: document.querySelector("#roomResultTitle"),
  roomResultText: document.querySelector("#roomResultText"),
  roomReturnLobbyBtn: document.querySelector("#roomReturnLobbyBtn"),
  battleLogToggle: document.querySelector("#battleLogToggle"),
  battleLogHeaderBtn: document.querySelector("#battleLogHeaderBtn"),
  battleLogDialog: document.querySelector("#battleLogDialog"),
  battleLogDialogList: document.querySelector("#battleLogDialogList"),
  battleLogCloseBtn: document.querySelector("#battleLogCloseBtn"),
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
      const bossTarget = Boolean(target.boss || bosses[target.character]);
      target.hp = bossTarget ? Math.max(0, target.hp - 4) : 0;
      target.dead = target.hp === 0;
      if (target.dead) target.vehicle = null;
      actor.sniper.loaded = false;
      actor.sniper.chambered = false;
      actor.sniper.aimedTarget = null;
      actor.sniper.aimedLocation = null;
      actor.sniper.aimBroken = false;
      if (bossTarget && !target.dead) return `${actor.name}用狙击枪命中${target.name}，造成 4 点伤害；BOSS 没有被一枪射杀。`;
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
  const pickerPlayer = roomState?.players?.find((player) => player.id === roomPlayerId);
  const bossPicker = roomMode === "boss" && Boolean(pickerPlayer?.boss);
  const allowedCharacters = bossPicker ? ["overlord", "stalker", "magician"] : ["scout", "vanguard", "medic", "engineer"];
  if (!allowedCharacters.includes(selectedCharacter)) selectedCharacter = allowedCharacters[0];
  const character = roleConfig(selectedCharacter);
  const profiles = {
    scout: { description: "可快速抵达任意地图节点。", skills: ["被动：全图疾行", "生命：3"] },
    vanguard: { description: "近距离制造高额伤害。", skills: ["主动：强袭造成 2 点伤害", "生命：4"] },
    medic: { description: "为队友提供关键恢复。", skills: ["主动：战地急救", "生命：3"] },
    engineer: { description: "团队防御专家，可把护盾部署到关键队友身上。", skills: ["主动：应急壁垒（每局 2 次）", "被动：开局自带护盾", "生命：3"] },
    overlord: { description: "群体压制型 BOSS，擅长范围伤害和持续恢复。", skills: ["限定：暴君横扫", "主动：威慑怒吼", "被动：霸主体魄", "生命：12"] },
    stalker: { description: "单体追杀型 BOSS，能跨区锁定并斩杀残血目标。", skills: ["主动：追猎突袭", "限定：致命追猎", "被动：猎杀本能", "生命：10"] },
    magician: { description: "卡牌资源型 BOSS，以低血量开局换取位移、恢复和改写行动权。", skills: ["主动：瞬移 / 卡牌疗愈", "主动：改写结果", "限定：魔术终幕", "生命：4/8 · 卡牌：2/5"] },
  };
  const profile = profiles[selectedCharacter] || profiles.scout;
  els.characterButtons.forEach((button) => {
    const available = allowedCharacters.includes(button.dataset.character);
    button.hidden = !available;
    button.classList.toggle("hidden", !available);
    button.classList.toggle("selected", button.dataset.character === selectedCharacter);
  });
  if (els.characterSelected) els.characterSelected.textContent = `已选择：${character.icon} ${character.name}`;
  if (els.characterPreview) { els.characterPreview.src = `assets/characters/${selectedCharacter}.png`; els.characterPreview.alt = character.name; }
  if (els.characterName) els.characterName.textContent = `${character.icon} ${character.name}`;
  if (els.characterDescription) els.characterDescription.textContent = profile.description;
  if (els.characterSkills) els.characterSkills.innerHTML = profile.skills.map((skill) => `<li>${skill}</li>`).join("");
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
    closePeer();
    resetRoomRuntime();
    roomMode = mode;
    roomState = null;
    roomPlayerId = null;
    roomIsHost = true;
    gameMode = "room";
    updateRoomIntro();
    await openRoomSocket();
    sendNetwork({ type: "createRoom", mode: roomMode });
    setRoomStatus("正在自动创建房间...");
  }
}

function startSelectedMode() {
  if (selectedMode === "single") { startSingleMode(); return; }
  if (!roomState || !roomState.selectingCharacters) { showScreen("room"); return; }
  sendNetwork({ type: "setCharacter", character: selectedCharacter });
  setRoomStatus("角色已确认，等待其他玩家选择角色");
  showScreen("room");
}
function applySelectedCharacterToSingle() {
  const actor = state.actors.player;
  const character = characters[selectedCharacter] || characters.scout;
  actor.character = selectedCharacter;
  actor.skill = character.name;
  actor.maxHp = character.maxHp;
  actor.hp = character.maxHp;
  actor.inventory.shield = selectedCharacter === "engineer";
  actor.inventory.shieldHp = selectedCharacter === "engineer" ? 1 : 0;
}

function setRoomBattleVisible(active) {
  if (els.roomBattlePanel) els.roomBattlePanel.classList.toggle("hidden", !active);
  if (els.roomShell) els.roomShell.classList.toggle("battle-active", active);
  document.querySelectorAll(".lobby-only").forEach((node) => node.classList.toggle("hidden", active));
  if (els.roomBattleStatus) els.roomBattleStatus.textContent = active ? "战斗已开始。" : "等待房主开始房间。";
  if (els.battleLogHeaderBtn) els.battleLogHeaderBtn.classList.toggle("hidden", !active);
  if (!active) {
    setRoomBattleLogVisible(false);
    closeMobileBattlePanel();
    els.mobileBattleDock?.classList?.add("hidden");
  }
}

function setRoomBattleLogVisible(open) {
  roomLogOpen = Boolean(open && roomBattle);
  els.battleLogDialog?.classList?.toggle("hidden", !roomLogOpen);
  els.battleLogHeaderBtn?.setAttribute?.("aria-expanded", String(roomLogOpen));
  if (roomLogOpen) renderRoomBattleLogDialog();
}
function renderRoomBattleLogDialog() {
  if (!els.battleLogDialogList) return;
  els.battleLogDialogList.innerHTML = "";
  (roomBattle?.log || []).forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = entry;
    els.battleLogDialogList.appendChild(item);
  });
}
function setRoomDuelVisible(active) {
  if (els.roomDuelScreen) els.roomDuelScreen.classList.toggle("hidden", !active);
  if (els.roomShell) els.roomShell.classList.toggle("duel-active", active);
}

function startRoomDuelAnimation(choice) {
  const player = getRoomPlayer(roomPlayerId);
  if (!roomBattle || roomBattle.phase !== "duel" || !player || player.dead || roomBattle.throws[roomPlayerId] || roomDuelTimer) return;
  roomDuelChoice = choice;
  renderRoomDuelScreen();
  roomDuelTimer = setTimeout(() => {
    roomDuelTimer = null;
    roomDuelChoice = null;
    submitRoomThrow(choice);
  }, 1000);
}

function startRoomDuelReveal(outcome = "win") {
  if (!roomBattle?.lastThrows || roomDuelReveal || roomDuelRevealTimer) return;
  roomDuelRevealRound = roomBattle.round;
  roomDuelReveal = { round: roomBattle.round, stage: "windup", outcome };
  renderRoomBattle();
  roomDuelRevealTimer = setTimeout(() => {
    if (!roomDuelReveal || roomDuelReveal.round !== roomBattle?.round) return;
    roomDuelReveal.stage = "result";
    renderRoomBattle();
    roomDuelRevealTimer = setTimeout(() => {
      if (!roomDuelReveal || roomDuelReveal.round !== roomBattle?.round) return;
      const resolvedOutcome = roomDuelReveal.outcome;
      roomDuelReveal = null;
      roomDuelRevealTimer = null;
      if (resolvedOutcome === "tie") {
        roomDuelRevealRound = null;
        roomBattle.duelOutcome = null;
        roomBattle.tieReason = null;
      }
      if (roomIsHost && roomBattle?.magicianRpsOffer?.pendingReveal) {
        roomBattle.phase = "magicianChoice";
        roomBattle.magicianRpsOffer.pendingReveal = false;
        syncRoomBattle();
        const pendingMagician = getRoomPlayer(roomBattle.magicianRpsOffer.magicianId);
        if (pendingMagician?.bot) setTimeout(() => resolveMagicianRpsChoice(true, roomMagicianEdits), 500);
      }
      renderRoomBattle();
      maybeRunRoomBotTurn();
    }, roomDuelReveal.outcome === "tie" ? 1800 : 3000);
  }, 1000);
}

function renderRoomActionReport() {
  if (!els.roomDuelScreen || !roomBattle?.actionReport) return;
  els.roomDuelScreen.innerHTML = `<div class="duel-kicker">回合行动播报</div><h2>行动完成</h2><p class="duel-prompt result">下一位行动者即将开始</p><div class="duel-action-report"><span>战况播报</span><strong>${roomBattle.actionReport.text}</strong></div>`;
}

function renderRoomMagicianThrowEditor() {
  if (!els.roomDuelScreen || !roomBattle?.magicianRpsOffer) return;
  const offer = roomBattle.magicianRpsOffer;
  const localIsMagician = roomPlayerId === offer.magicianId;
  const alive = roomAlivePlayers();
  const options = Object.entries(throws).map(([key, data]) => `<option value="${key}">${data.name} ${data.icon}</option>`).join("");
  const rows = alive.map((player) => {
    const own = player.id === offer.magicianId;
    const editable = localIsMagician;
    return `<label class="magician-throw-row"><span>${player.name}${own ? "（你）" : ""}</span><select data-player-id="${player.id}" ${editable ? "" : "disabled"}>${options}</select></label>`;
  }).join("");
  els.roomDuelScreen.innerHTML = `<div class="duel-kicker">第 ${roomBattle.round} 回合 · 魔术师改写</div><h2>改写本轮出拳结果</h2><p class="duel-prompt result">你可以同时修改自己和其他玩家的出拳；确认改写消耗 2 张卡牌，并立即重新计算行动顺序。</p><div class="magician-throw-editor">${rows}</div><div class="duel-choice-buttons"></div>`;
  alive.forEach((player) => {
    const select = els.roomDuelScreen.querySelector?.(`select[data-player-id="${player.id}"]`);
    if (!select) return;
    select.value = roomMagicianEdits[player.id] || offer.throws[player.id];
    select.addEventListener("change", () => { roomMagicianEdits[player.id] = select.value; });
  });
  const choices = els.roomDuelScreen.querySelector?.(".duel-choice-buttons");
  if (choices && localIsMagician) {
    const confirm = document.createElement("button");
    confirm.type = "button";
    confirm.className = "duel-choice-button ready";
    confirm.textContent = "确认改写（-2 卡）";
    confirm.addEventListener("click", () => resolveMagicianRpsChoice(true, roomMagicianEdits));
    choices.appendChild(confirm);
    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "duel-choice-button";
    cancel.textContent = "保持原结果";
    cancel.addEventListener("click", () => resolveMagicianRpsChoice(false, roomMagicianEdits));
    choices.appendChild(cancel);
  }
}
function roomActionActorLabel(actor) {
  const role = roleConfig(actor?.character).name;
  const name = actor?.name || "未知玩家";
  if (roomBattle?.mode === "boss") return `${actor.boss ? "BOSS" : "生存者"} ${role}（${name}）`;
  if (roomBattle?.mode === "team") return `${actor.team === "A" ? "红队" : "蓝队"} ${role}（${name}）`;
  return `${role}（${name}）`;
}

function roomActionNarration(actor, entry) {
  const identity = roomActionActorLabel(actor);
  const name = actor?.name || "";
  return name && entry.startsWith(name) ? `${identity}${entry.slice(name.length).trimStart()}` : `${identity}：${entry}`;
}
function showRoomActionReport(entry) {
  if (!roomBattle) return;
  roomBattle.actionReport = { text: entry, round: roomBattle.round };
  syncRoomBattle();
  renderRoomBattle();
  scheduleRoomActionReportCompletion(entry);
}

function scheduleRoomActionReportCompletion(entry) {
  if (!roomIsHost || !roomBattle?.actionReport || roomActionReportTimer) return;
  roomActionReportTimer = setTimeout(() => {
    if (!roomBattle?.actionReport || roomBattle.actionReport.text !== entry) return;
    roomBattle.actionReport = null;
    roomActionReportTimer = null;
    finishRoomAction();
  }, 1800);
}

function resumeRoomActionReportCompletion() {
  const report = roomBattle?.actionReport;
  if (report) scheduleRoomActionReportCompletion(report.text);
}
function renderRoomDuelScreen() {
  if (!els.roomDuelScreen || !roomBattle) return;
  const player = getRoomPlayer(roomPlayerId);
  if (roomBattle.phase === "magicianChoice" && roomBattle.magicianRpsOffer) {
    const magician = getRoomPlayer(roomBattle.magicianRpsOffer.magicianId);
    const isMagician = player?.id === magician?.id;
    els.roomDuelScreen.innerHTML = `<div class="duel-kicker">第 ${roomBattle.round} 回合 · 原始结果已揭晓</div><h2>是否改写本轮出拳结果？</h2><p class="duel-prompt result">${isMagician ? "可同时修改自己和其他玩家的出拳，确认后重新计算行动顺序。" : `等待 ${magician?.name || "魔术师"} 决定是否改写本轮出拳结果…`}</p><div class="duel-choice-buttons"></div>`;
    const buttons = els.roomDuelScreen.querySelector?.(".duel-choice-buttons");
    if (buttons && isMagician) {
      [["edit", "改写本轮出拳结果（-2 卡）"], ["keep", "保持原结果"]].forEach(([action, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `duel-choice-button${action !== "keep" ? " ready" : ""}`;
        button.disabled = action !== "keep" && (magician.cards || 0) < 2;
        button.textContent = label;
        button.addEventListener("click", () => {
          if (action === "keep") return resolveMagicianRpsChoice(false, roomMagicianEdits);
          roomMagicianEdits = { ...roomBattle.magicianRpsOffer.throws };
          renderRoomMagicianThrowEditor();
        });
        buttons.appendChild(button);
      });
    }
    return;
  }
  if (roomBattle.phase === "magicianTeleportChoice" && roomBattle.magicianTeleportOffer) {
    const magician = getRoomPlayer(roomBattle.magicianTeleportOffer.magicianId);
    const isMagician = player?.id === magician?.id;
    els.roomDuelScreen.innerHTML = `<div class="duel-kicker">第 ${roomBattle.round} 回合 · 行动权已分配</div><h2>是否使用瞬移？</h2><p class="duel-prompt result">${isMagician ? "你未获得行动权，可消耗 1 张卡牌瞬移到任意其他地点；瞬移不消耗行动机会。" : `等待 ${magician?.name || "魔术师"} 决定是否使用瞬移…`}</p><div class="duel-choice-buttons"></div>`;
    const buttons = els.roomDuelScreen.querySelector?.(".duel-choice-buttons");
    if (buttons && isMagician) {
      [["use", "使用瞬移（-1 卡）"], ["skip", "暂不瞬移"]].forEach(([action, label]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = `duel-choice-button${action === "use" ? " ready" : ""}`;
        button.textContent = label;
        button.addEventListener("click", () => resolveMagicianTeleportChoice(action === "use"));
        buttons.appendChild(button);
      });
    }
    return;
  }
  const hasThrown = Boolean(roomBattle.throws[roomPlayerId]);
  const isReveal = Boolean(roomDuelReveal);
  const isResult = roomDuelReveal?.stage === "result";
  const isTie = roomDuelReveal?.outcome === "tie";
  const canThrow = player && !player.dead && !player.bot && !hasThrown && !roomDuelTimer && !isReveal;
  const chosen = roomDuelChoice || roomBattle.throws[roomPlayerId];
  const winners = isResult && !isTie ? new Set(roomBattle.actionQueue || []) : new Set();
  const alive = roomAlivePlayers();
  const winnerNames = isResult ? alive.filter((item) => winners.has(item.id)).map((item) => item.name).join("、") : "";
  const prompt = isReveal
    ? isResult ? isTie ? `平局！${roomBattle.tieReason || "本回合重新猜拳"}` : `${winnerNames || "胜者"} 获得行动权！` : "所有玩家正在前摇出拳…"
    : player?.dead ? "你已被淘汰，本回合无需出拳" : hasThrown ? "已出拳，等待其他玩家…" : chosen ? "拳势已出，等待判定…" : "选择拳型，争夺本回合行动权";
  const hands = alive.map((item, index) => {
    const choice = isResult ? roomBattle.lastThrows?.[item.id] : item.id === roomPlayerId ? chosen : null;
    const isWinner = winners.has(item.id);
    const hand = choice ? throws[choice].icon : "✊";
    const label = isResult && choice ? throws[choice].name : "蓄力中";
    return `<article class="duel-player-hand${isWinner ? " winner" : ""}" style="--hand-delay:${index * 90}ms">${isWinner ? `<em class="duel-winner-badge">胜者</em>` : ""}<span>${roomPlayerLabel(item)}</span><b>${hand}</b><small>${label}</small></article>`;
  }).join("");

  els.roomDuelScreen.innerHTML = `
    <div class="duel-kicker">第 ${roomBattle.round} 回合 · 行动权争夺</div>
    <h2 class="${isResult && isTie ? "duel-tie-title" : ""}">${isResult ? isTie ? "平局" : "胜负揭晓" : "猜拳对决"}</h2>
    <p class="duel-prompt${isResult ? " result" : ""}">${prompt}</p>
    <div class="duel-stage duel-player-stage${isReveal ? " is-animating" : ""}${isResult ? " is-revealed" : ""}">${hands}</div>
    ${isResult ? `<div class="duel-result-banner${isTie ? " tie-result-banner" : ""}">${isTie ? "平局，重新猜拳" : `${winnerNames || "胜者"} 获得行动权`}</div>` : ""}
    <div class="duel-choice-buttons"></div>
  `;

  const choices = els.roomDuelScreen.querySelector?.(".duel-choice-buttons");
  if (!choices || isReveal) return;
  Object.entries(throws).forEach(([choice, data]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "duel-choice-button";
    button.disabled = !canThrow;
    button.innerHTML = `<strong>${data.icon}</strong><span>${data.name}</span>`;
    button.addEventListener("click", () => startRoomDuelAnimation(choice));
    choices.appendChild(button);
  });
}
function roomModeName(mode = roomMode) {
  return mode === "boss" ? "BOSS 对战" : mode === "team" ? "阵营模式" : "乱战模式";
}

function roomCapacity(mode = roomMode) {
  return mode === "team" ? 6 : 5;
}

function updateRoomIntro() {
  if (els.roomModeLabel) els.roomModeLabel.textContent = roomModeName();
  if (els.roomTitle) els.roomTitle.textContent = roomMode === "boss" ? "BOSS 对战房间" : roomMode === "team" ? "3v3 阵营房间" : "五人乱战房间";
  if (els.roomHint) {
    els.roomHint.textContent = roomMode === "boss" ? "房主分配 1 名 BOSS 和生存者；BOSS 对抗最多 4 名生存者。" : roomMode === "team" ? "最多 3v3，房主可以加入人机补位。" : "最多 5 人，各自为战，房主可以加入人机。";
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

function clearRoomTransientState() {
  [roomDuelTimer, roomDuelRevealTimer, roomActionReportTimer, roomBotTurnTimer].forEach((timer) => {
    if (timer && typeof clearTimeout === "function") clearTimeout(timer);
  });
  roomDuelChoice = null;
  roomDuelTimer = null;
  roomDuelReveal = null;
  roomDuelRevealTimer = null;
  roomDuelRevealRound = null;
  roomActionReportTimer = null;
  roomBotTurnTimer = null;
  roomSkillTargeting = null;
  roomSkillMode = null;
  roomHealAmount = 1;
  roomMagicianEdits = {};
  if (els.roomSkillDialog) {
    els.roomSkillDialog.classList.add("hidden");
    els.roomSkillDialog.innerHTML = "";
  }
  setRoomDuelVisible(false);
}

function resetRoomRuntime() {
  clearRoomTransientState();
  roomBattle = null;
  setRoomBattleLogVisible(false);
  els.roomBattlePanel?.classList?.remove("boss-layout", "local-survivor", "team-operator-layout", "log-open");
}
function openModeRoom(mode) {
  closePeer();
  resetRoomRuntime();
  roomMode = mode;
  roomState = null;
  roomPlayerId = null;
  roomIsHost = false;
  gameMode = "room";
  updateRoomIntro();
  if (els.roomLocalCode) els.roomLocalCode.value = "";
  if (els.roomRemoteCode) els.roomRemoteCode.value = "";
  setRoomStatus("先创建房间，或输入房间码加入。");
  setRoomBattleVisible(false);
  renderRoomLobby();
  showScreen("room");
}
async function enterRoomMode(mode) {
  openModeRoom(mode);
  await createModeRoom();
}
async function createModeRoom() {
  closePeer();
  resetRoomRuntime();
  gameMode = "room";
  roomIsHost = true;
  roomState = null;
  roomPlayerId = "pending-host";
  applyRoomState(fallbackRoom("", roomPlayerId));
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
  resetRoomRuntime();
  gameMode = "room";
  roomIsHost = false;
  roomState = null;
  roomPlayerId = "pending-guest";
  await openRoomSocket();
  sendNetwork({ type: "joinRoom", code, mode: roomMode, character: selectedCharacter });
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
  if (!roomState?.code) {
    setRoomStatus("正在创建房间，请稍候");
    return;
  }
  sendNetwork({ type: "addBot" });
}function assignRoomPlayer(playerId, assignment) {
  if (!roomIsHost || !playerId) return;
  sendNetwork({ type: "assignPlayer", playerId, assignment });
}

function startModeRoom() {
  if (!roomIsHost) {
    setRoomStatus("等待房主开始房间");
    return;
  }
  if (!roomState?.code) {
    setRoomStatus("正在创建房间，请稍候");
    return;
  }
  sendNetwork({ type: "startRoom" });
  setRoomStatus("正在等待服务器确认开始...");
}

function roomPlayerLabel(player) {
  if (player.id === roomPlayerId) return `${player.name}（你）`;
  return player.name;
}

function roomHomeForPlayer(player, index) {
  const activeMode = roomBattle?.mode || roomMode;
  if (activeMode === "team" || activeMode === "boss") return player.team === "B" ? "blueHome" : "redHome";
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
  const players = (room?.players || []).map((player, index) => {
    const boss = Boolean(player.boss);
    const character = boss ? (bosses[player.character] ? player.character : "overlord") : (characters[player.character] ? player.character : "scout");
    const profile = boss ? bosses[character] : characters[character];
    return {
      ...player,
      boss,
      character,
      hp: boss ? (character === "magician" ? 4 : profile.maxHp) : profile.maxHp,
      maxHp: profile.maxHp,
      asleep: true,
      dead: false,
      location: roomHomeForPlayer(player, index),
      inventory: { knife: false, shield: character === "engineer", shieldHp: character === "engineer" ? 1 : 0, sniper: false, medkit: character === "medic" ? 1 : 0, smoke: false, rocket: false },
      medkitTaken: character === "medic" ? 1 : 0,
      engineerBarriersRemaining: character === "engineer" ? 2 : 0,
      vanguardPulseArmed: false,
      vanguardPulseUsed: false,
      vanguardPulseResolveRound: null,
      smoke: false,
      roleUsed: false,
      bossSkillUsed: false,
      bossRoarReadyRound: 1,
      stalkerPounceReadyRound: 1,
      stalkerHuntUsed: false,
      cards: character === "magician" ? 2 : 0,
      magicianTeleportReadyRound: 1,
      magicianHealReadyRound: 1,
      magicianRpsUsedRound: 0,
      magicianUltimateUsed: false,
      magicianSleepRounds: 0,
    };
  });
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
  if (roomBattle.mode === "team" || roomBattle.mode === "boss") return actor.team !== target.team;
  return true;
}

function roomConnectedLocations(location) {
  const config = roomMapConfig(roomBattle?.mode || roomMode);
  return config.edges
    .filter(([from, to]) => from === location || to === location)
    .map(([from, to]) => (from === location ? to : from));
}

function roomLocationName(id) {
  return roomMapConfig(roomBattle?.mode || roomMode).nodes[id]?.name || id;
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

function renderRoomActionBulletin() {
  if (!els.roomActionBulletin) return;
  const broadcast = roomBattle?.actionBroadcast;
  const visible = Boolean(broadcast?.text) && !roomBattle?.gameOver;
  els.roomActionBulletin.classList.toggle("hidden", !visible);
  if (!visible) return;
  els.roomActionBulletin.innerHTML = `<span>${broadcast.title || "战况播报"}</span><strong>${broadcast.text}</strong>`;
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

function roomActionQueueMessage(queue, changedByMagician = false) {
  return `第 ${roomBattle.round} 回合：${queue.map((player) => player.name).join("、")} 获得行动权${changedByMagician ? "（魔术师改写）" : ""}`;
}

function startRoomActionQueue(queue, changedByMagician = false) {
  roomBattle.magicianTeleportOffer = null;
  roomBattle.phase = "action";
  roomBattle.actionQueue = queue.map((player) => player.id);
  roomBattle.currentActorId = roomBattle.actionQueue[0] || null;
  roomBattle.message = roomActionQueueMessage(queue, changedByMagician);
  roomBattle.actionBroadcast = { title: changedByMagician ? "猜拳结果已改写" : "行动权已确定", text: roomBattle.message };
  roomAddLog(`行动队列：${queue.map((player) => player.name).join(" → ")}`);
  triggerFeedback("win", `${queue.map((player) => player.name).join("、")} 获得行动权！`);
  syncRoomBattle();
  renderRoomBattle();
  maybeRunRoomBotTurn();
}

function magicianCanTeleportAfterAllocation(magician, queueIds = []) {
  return Boolean(
    roomBattle && magician?.character === "magician" && !magician.dead && !magician.asleep &&
    !queueIds.includes(magician.id) && (magician.cards || 0) >= 1 &&
    magicianTeleportCooldown(magician) === 0 &&
    Object.keys(roomMapConfig(roomBattle.mode).nodes).some((to) => to !== magician.location)
  );
}

function resumeRoomActionQueue() {
  if (!roomBattle) return;
  const offer = roomBattle.magicianTeleportOffer;
  const queue = (roomBattle.actionQueue || []).map((id) => getRoomPlayer(id)).filter((player) => player && !player.dead);
  const changedByMagician = Boolean(offer?.changedByMagician);
  startRoomActionQueue(queue, changedByMagician);
}

function resolveMagicianTeleportChoice(useSkill) {
  if (!roomBattle?.magicianTeleportOffer) return;
  if (!roomIsHost) {
    sendNetwork({ type: "magicianTeleportChoice", actorId: roomPlayerId, useSkill: Boolean(useSkill) });
    return;
  }
  const offer = roomBattle.magicianTeleportOffer;
  const magician = getRoomPlayer(offer.magicianId);
  const canUse = Boolean(useSkill && magicianCanTeleportAfterAllocation(magician, roomBattle.actionQueue || []));
  if (!canUse) {
    if (magician && !magician.dead) roomAddLog(`${magician.name} 放弃了本轮行动权结算后的瞬移机会。`);
    resumeRoomActionQueue();
    return;
  }
  roomBattle.phase = "magicianTeleportTarget";
  roomBattle.currentActorId = null;
  roomBattle.message = `${magician.name} 正在选择瞬移地点；此技能不消耗行动机会。`;
  roomBattle.actionBroadcast = null;
  syncRoomBattle();
  renderRoomBattle();
  if (magician.bot) {
    setTimeout(() => {
      if (roomBattle?.phase !== "magicianTeleportTarget" || roomBattle.magicianTeleportOffer?.magicianId !== magician.id) return;
      const action = getMagicianTeleportActions(magician.id)[0];
      if (action) runRoomAction(magician.id, action);
      else resumeRoomActionQueue();
    }, 500);
  }
}

function finalizeRoomDuelQueue(queueIds, changedByMagician = false) {
  const queue = queueIds.map((id) => getRoomPlayer(id)).filter((player) => player && !player.dead);
  roomBattle.magicianRpsOffer = null;
  roomBattle.magicianTeleportOffer = null;
  const magician = roomAlivePlayers().find((player) => player.character === "magician");
  if (magicianCanTeleportAfterAllocation(magician, queue.map((player) => player.id))) {
    const actionMessage = roomActionQueueMessage(queue, changedByMagician);
    roomBattle.phase = "magicianTeleportChoice";
    roomBattle.actionQueue = queue.map((player) => player.id);
    roomBattle.currentActorId = null;
    roomBattle.magicianTeleportOffer = { magicianId: magician.id, changedByMagician, actionMessage };
    roomBattle.message = `${actionMessage}；${magician.name} 未获得行动权，可在行动开始前决定是否瞬移。`;
    roomBattle.actionBroadcast = { title: changedByMagician ? "猜拳结果已改写" : "行动权已确定", text: actionMessage };
    roomAddLog(`行动队列：${queue.map((player) => player.name).join(" → ")}`);
    triggerFeedback("win", `${queue.map((player) => player.name).join("、")} 获得行动权！`);
    syncRoomBattle();
    renderRoomBattle();
    if (magician.bot) setTimeout(() => resolveMagicianTeleportChoice(true), 500);
    return;
  }
  startRoomActionQueue(queue, changedByMagician);
}
function resolveMagicianRpsChoice(useSkill, edits = roomMagicianEdits) {
  if (!roomBattle?.magicianRpsOffer) return;
  if (!roomIsHost) {
    sendNetwork({ type: "magicianRpsChoice", actorId: roomPlayerId, useSkill: Boolean(useSkill), edits });
    return;
  }
  const offer = roomBattle.magicianRpsOffer;
  const magician = getRoomPlayer(offer.magicianId);
  if (!magician || magician.dead) return finalizeRoomDuelQueue(offer.originalQueue);
  const canUse = useSkill && (magician.cards || 0) >= 2 && magician.magicianRpsUsedRound !== roomBattle.round;
  if (canUse) {
    magician.cards -= 2;
    magician.magicianRpsUsedRound = roomBattle.round;
    const changedThrows = { ...offer.throws, ...edits };
    roomBattle.lastThrows = changedThrows;
    const changedChoices = [...new Set(Object.values(changedThrows))];
    if (changedChoices.length !== 2) {
      roomBattle.cardsAwardedThisRound = false;
      roomBattle.message = "改写后的结果仍为平局，本回合不推进且不获得卡牌。";
      roomBattle.phase = "duel";
      roomBattle.throws = {};
      roomBattle.magicianRpsOffer = null;
      syncRoomBattle();
      renderRoomBattle();
      return;
    }
    const changedWinningChoice = throws[changedChoices[0]].beats === changedChoices[1] ? changedChoices[0] : changedChoices[1];
    const changedQueue = roomAlivePlayers().filter((player) => changedThrows[player.id] === changedWinningChoice).sort((a, b) => roomBattle.players.findIndex((p) => p.id === a.id) - roomBattle.players.findIndex((p) => p.id === b.id)).map((player) => player.id);
    roomAddLog(`${magician.name} 消耗 2 张卡牌发动改写结果，将自己变为本轮优先行动者。`);
    finalizeRoomDuelQueue(changedQueue, true);
  } else {
    finalizeRoomDuelQueue(offer.originalQueue);
  }
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
    roomBattle.duelOutcome = "tie";
    roomBattle.tieReason = reason;
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

  const magician = alive.find((player) => player.character === "magician" && (player.cards || 0) >= 2 && player.magicianRpsUsedRound !== roomBattle.round);
  if (magician) {
    // Preserve the original winning queue while its result is shown; the magician
    // may still replace it after the reveal, but the result cards need this now.
    roomBattle.phase = "action";
    roomBattle.actionQueue = queue.map((player) => player.id);
    roomBattle.currentActorId = roomBattle.actionQueue[0] || null;
    roomBattle.magicianRpsOffer = {
      magicianId: magician.id,
      originalQueue: queue.map((player) => player.id),
      throws: { ...roomBattle.lastThrows },
      pendingReveal: true
    };
    roomMagicianEdits = { ...roomBattle.lastThrows };
  
    roomBattle.message = `${magician.name} 的原始猜拳结果已揭晓，等待其决定是否改写`;
    syncRoomBattle();
    renderRoomBattle();
    return;
  }
  finalizeRoomDuelQueue(queue.map((player) => player.id));
}

function spawnRoomSupplyDrop() {
  if (!roomBattle || roomBattle.supplyDrop?.opened) return;
  const locations = roomBattle.mode === "team" ? ["wild", "medBay", "radar"] : ["wild", "armory", "medBay", "radar"];
  const item = ["medkit", "smoke", "shield", "rocket", "rocket"][Math.floor(Math.random() * 5)];
  roomBattle.supplyDrop = { location: locations[Math.floor(Math.random() * locations.length)], item, opened: false };
  roomAddLog(`战场空投落在${roomLocationName(roomBattle.supplyDrop.location)}：${items[item].name}。`);
}

function roomResultForLocalPlayer() {
  const player = getRoomPlayer(roomPlayerId);
  if (!roomBattle || !player) return "LOSE";
  if (roomBattle.mode === "team") {
    const winningTeam = roomBattle.winnerText.startsWith("红队") ? "A" : roomBattle.winnerText.startsWith("蓝队") ? "B" : null;
    return player.team === winningTeam ? "WIN" : "LOSE";
  }
  return roomBattle.winnerText.startsWith(player.name) ? "WIN" : "LOSE";
}

function renderRoomResult() {
  if (!els.roomResultOverlay) return;
  const complete = Boolean(roomBattle?.gameOver);
  els.roomResultOverlay.classList.toggle("hidden", !complete);
  if (!complete) return;
  const result = roomResultForLocalPlayer();
  if (els.roomResultTitle) {
    els.roomResultTitle.textContent = result;
    els.roomResultTitle.classList.toggle("lose", result === "LOSE");
  }
  if (els.roomResultText) els.roomResultText.textContent = roomBattle.winnerText || "战斗结束";
}

function returnRoomToLobby() {
  if (!roomBattle?.gameOver) return;
  sendNetwork({ type: "returnToLobby" });
  if (els.roomReturnLobbyBtn) {
    els.roomReturnLobbyBtn.disabled = true;
    els.roomReturnLobbyBtn.textContent = "正在返回房间...";
  }
}
function roomWinText() {
  const alive = roomAlivePlayers();
  if (roomBattle.mode === "boss") {
    const boss = alive.find((player) => player.boss);
    const survivors = alive.filter((player) => !player.boss);
    if (!boss) return "生存者获胜";
    if (!survivors.length) return "BOSS获胜";
    return "";
  }
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

  const finishedActor = getRoomPlayer(roomBattle.currentActorId);
  if (finishedActor?.magicianExtraActionPending > 0) {
    finishedActor.magicianExtraActionPending -= 1;
  } else if (finishedActor?.magicianSleepAfterExtra) {
    finishedActor.magicianSleepAfterExtra = false;
    finishedActor.asleep = true;
    finishedActor.magicianSleepRounds = 1;
    roomAddLog(`${finishedActor.name} 在额外行动后进入休眠。`);
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
    if ((roomBattle.round - 1) % 2 === 0) {
      roomBattle.players.filter((player) => player.character === "magician" && !player.dead).forEach((player) => {
        const gained = addMagicianCards(player, 1);
        if (gained) roomAddLog(`${player.name} 的被动技生效，获得 1 张卡牌（${player.cards}/5）。`);
      });
    }
    roomBattle.players.filter((player) => player.character === "overlord" && !player.dead && player.hp < player.maxHp).forEach((player) => {
      player.hp = Math.min(player.maxHp, player.hp + 1);
      roomAddLog(`${player.name} 的被动技“霸主体魄”生效，回复 1 点生命。`);
    });
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
  roomBattle.players.filter((actor) => actor.vanguardPulseArmed && (actor.vanguardPulseResolveRound || roomBattle.round) <= roomBattle.round).forEach((actor) => {
    actor.vanguardPulseArmed = false;
    actor.vanguardPulseResolveRound = null;
    if (actor.dead) {
      roomAddLog(actor.name + " 的震荡波失效。");
      return;
    }
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

function bossRoarCooldown(player) {
  return Math.max(0, (player.bossRoarReadyRound || 1) - (roomBattle?.round || 1));
}

function stalkerPounceCooldown(player) {
  return Math.max(0, (player.stalkerPounceReadyRound || 1) - (roomBattle?.round || 1));
}

function magicianTeleportCooldown(player) {
  return Math.max(0, (player.magicianTeleportReadyRound || 1) - (roomBattle?.round || 1));
}

function magicianHealCooldown(player) {
  return Math.max(0, (player.magicianHealReadyRound || 1) - (roomBattle?.round || 1));
}

function addMagicianCards(player, amount) {
  if (player?.character !== "magician" || amount <= 0) return 0;
  const before = player.cards || 0;
  player.cards = Math.min(5, before + amount);
  return player.cards - before;
}

function roomRoleSkillLabel(player) {
  if (player.character === "overlord") return `横扫${player.bossSkillUsed ? "已用" : "可用"} · 怒吼${bossRoarCooldown(player) ? `冷却${bossRoarCooldown(player)}` : "可用"} · 体魄回血`;
  if (player.character === "stalker") return `突袭${stalkerPounceCooldown(player) ? `冷却${stalkerPounceCooldown(player)}` : "可用"} · 致命追猎${player.stalkerHuntUsed ? "已用" : "可用"} · 半血增伤`;
  if (player.character === "magician") return `卡牌 ${player.cards || 0}/5 · 瞬移 · 疗愈 · 改写 · 终幕`;
  if (player.character === "vanguard") return player.vanguardPulseUsed ? "震荡波已使用" : player.vanguardPulseArmed ? "震荡波待触发" : "震荡波可用";
  if (player.character === "medic") return "远程急救可用";
  if (player.character === "engineer") return `应急壁垒 ${player.engineerBarriersRemaining || 0}/2`;
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

function getMagicianTeleportActions(actorId) {
  const actor = getRoomPlayer(actorId);
  const isCurrentAction = roomBattle?.phase === "action" && roomBattle.currentActorId === actorId;
  const isAllocationTargeting = roomBattle?.phase === "magicianTeleportTarget" && roomBattle.magicianTeleportOffer?.magicianId === actorId;
  if (!roomBattle || !actor || actor.dead || actor.asleep || actor.character !== "magician" || !isCurrentAction && !isAllocationTargeting || (actor.cards || 0) < 1 || magicianTeleportCooldown(actor) > 0) return [];
  return Object.keys(roomMapConfig(roomBattle.mode).nodes)
    .filter((to) => to !== actor.location)
    .map((to) => ({ id: "magicianTeleport", to, label: `瞬移到${roomLocationName(to)}（-1 卡，不耗行动）` }));
}
function getRoomActions(actorId) {
  const actor = getRoomPlayer(actorId);
  if (!roomBattle || !actor || actor.dead || roomBattle.phase !== "action" || roomBattle.currentActorId !== actorId) return [];
  if (actor.asleep) return [{ id: "wake", label: "起床" }];
  const actions = [];
  const mapNodes = Object.keys(roomMapConfig(roomBattle.mode).nodes);
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
  if (actor.inventory.sniper) {
    roomBattle.players.filter((target) => isRoomEnemy(actor, target)).forEach((target) => actions.push({ id: "fireSniper", targetId: target.id, label: `狙击${target.name}（4 伤害）` }));
  }
  if (actor.inventory.rocket) {
    roomBattle.players.filter((target) => isRoomEnemy(actor, target)).forEach((target) => {
      actions.push({ id: "fireRocket", targetId: target.id, label: `火箭轰击${target.name}` });
    });
  }
  if (actor.character === "overlord" && !actor.bossSkillUsed && nearbyEnemies.length) {
    actions.push({ id: "bossSweep", label: "发动暴君横扫" });
  }
  const adjacentEnemies = roomBattle.players.filter((target) => isRoomEnemy(actor, target) && roomConnectedLocations(actor.location).includes(target.location));
  if (actor.character === "overlord" && bossRoarCooldown(actor) === 0 && adjacentEnemies.length) {
    actions.push({ id: "bossRoar", label: "发动威慑怒吼" });
  }
  if (actor.character === "stalker" && stalkerPounceCooldown(actor) === 0) {
    adjacentEnemies.forEach((target) => actions.push({ id: "stalkerPounce", targetId: target.id, label: `追猎突袭${target.name}` }));
  }
  if (actor.character === "stalker" && !actor.stalkerHuntUsed) {
    roomBattle.players.filter((target) => isRoomEnemy(actor, target)).forEach((target) => actions.push({ id: "stalkerHunt", targetId: target.id, label: `致命追猎${target.name}` }));
  }
  if (actor.character === "magician") {
    actions.push(...getMagicianTeleportActions(actorId));
    if ((actor.cards || 0) >= 1 && actor.hp < actor.maxHp && magicianHealCooldown(actor) === 0) {
      const maxSpend = Math.min(actor.cards, actor.maxHp - actor.hp);
      for (let cardCount = 1; cardCount <= maxSpend; cardCount += 1) actions.push({ id: "magicianHeal", cards: cardCount, label: `卡牌疗愈 ${cardCount} 点（-${cardCount} 卡）` });
    }
    if ((actor.cards || 0) >= 4 && !actor.magicianUltimateUsed) {
      roomBattle.players.filter((target) => isRoomEnemy(actor, target)).forEach((target) => actions.push({ id: "magicianUltimate", targetId: target.id, label: `魔术终幕：轰击${target.name}（-4 卡）` }));
    }
  }
  if (actor.character === "vanguard" && !actor.vanguardPulseUsed && !actor.vanguardPulseArmed) {
    actions.push({ id: "vanguardPulse", label: "启动震荡波" });
  }
  if (actor.character === "medic") {
    roomBattle.players
      .filter((target) => !target.dead && target.team === actor.team && target.hp < target.maxHp)
      .forEach((target) => actions.push({ id: "medicHeal", targetId: target.id, label: `远程急救${target.name}` }));
  }
  if (actor.character === "engineer" && (actor.engineerBarriersRemaining || 0) > 0) {
    roomBattle.players
      .filter((target) => !target.dead && target.team === actor.team && !target.inventory.shield)
      .forEach((target) => actions.push({ id: "engineerBarrier", targetId: target.id, label: `部署应急壁垒给${target.name}` }));
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
  const isAllocationTeleport = action?.id === "magicianTeleport" && roomBattle.phase === "magicianTeleportTarget" && roomBattle.magicianTeleportOffer?.magicianId === actorId;
  if (!actor || actor.dead || !isAllocationTeleport && roomBattle.currentActorId !== actorId) return;
  const availableActions = isAllocationTeleport ? getMagicianTeleportActions(actorId) : getRoomActions(actorId);
  const available = availableActions.some((item) => JSON.stringify(item) === JSON.stringify(action));
  if (!available) return;

  const deadBefore = new Set(roomBattle.players.filter((player) => player.dead).map((player) => player.id));
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
    const restored = actor.character === "medic" ? 2 : 1;
    const before = actor.hp;
    actor.hp = Math.min(actor.maxHp, actor.hp + restored);
    actor.inventory.medkit -= 1;
    entry = `${actor.name} 使用医疗包，恢复了 ${actor.hp - before} 点生命。`;
  } else if (action.id === "useSmoke") {
    actor.inventory.smoke = false;
    actor.smoke = true;
    entry = `${actor.name} 释放了烟雾弹，下一次受到的攻击会落空。`;
  } else if (action.id === "fireSniper") {
    const target = getRoomPlayer(action.targetId);
    if (!target || !actor.inventory.sniper || !isRoomEnemy(actor, target)) return;
    actor.inventory.sniper = false;
    const damage = target.boss ? 4 : target.hp;
    target.hp = Math.max(0, target.hp - damage);
    if (target.hp === 0) target.dead = true;
    entry = target.boss && !target.dead
      ? `${actor.name} 发射狙击枪命中 BOSS ${target.name}，造成 4 点伤害；BOSS 未被一枪射杀。`
      : `${actor.name} 发射狙击枪击中了 ${target.name}，造成 ${damage} 点伤害${target.dead ? "并淘汰目标" : ""}。`;
    triggerFeedback("attack", "狙击命中！", actor.id);
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
} else if (action.id === "bossSweep") {
    if (!actor.boss || actor.bossSkillUsed) return;
    const targets = roomBattle.players.filter((target) => isRoomEnemy(actor, target) && target.location === actor.location);
    if (!targets.length) return;
    actor.bossSkillUsed = true;
    const results = targets.map((target) => {
      if (target.smoke) { target.smoke = false; return `${target.name} 的烟雾挡住了横扫`; }
      if (target.inventory.shield) { target.inventory.shield = false; target.inventory.shieldHp = 0; return `${target.name} 的盾挡住了横扫`; }
      target.hp = Math.max(0, target.hp - 2);
      if (target.hp === 0) target.dead = true;
      triggerFeedback("hit", "BOSS 横扫命中！", target.id);
      return `${target.name} 受到 2 点伤害${target.dead ? "并被淘汰" : ""}`;
    });
    entry = `${actor.name} 发动暴君横扫：${results.join("；")}。`;
    triggerFeedback("attack", "暴君横扫！", actor.id);
} else if (action.id === "bossRoar") {
    if (!actor.boss || bossRoarCooldown(actor) > 0) return;
    const targets = roomBattle.players.filter((target) => isRoomEnemy(actor, target) && roomConnectedLocations(actor.location).includes(target.location));
    if (!targets.length) return;
    actor.bossRoarReadyRound = roomBattle.round + 2;
    const results = targets.map((target) => {
      if (target.smoke) { target.smoke = false; return `${target.name} 的烟雾挡住了怒吼`; }
      if (target.inventory.shield) { target.inventory.shield = false; target.inventory.shieldHp = 0; return `${target.name} 的盾挡住了怒吼`; }
      target.hp = Math.max(0, target.hp - 1);
      if (target.hp === 0) target.dead = true;
      triggerFeedback("hit", "BOSS 怒吼命中！", target.id);
      return `${target.name} 受到 1 点伤害${target.dead ? "并被淘汰" : ""}`;
    });
    entry = `${actor.name} 发动威慑怒吼：${results.join("；")}。`;
    triggerFeedback("attack", "威慑怒吼！", actor.id);
  } else if (action.id === "magicianTeleport") {
    if (actor.character !== "magician" || (actor.cards || 0) < 1 || magicianTeleportCooldown(actor) > 0 || !roomMapConfig(roomBattle.mode).nodes[action.to]) return;
    actor.cards -= 1;
    actor.location = action.to;
    actor.magicianTeleportReadyRound = roomBattle.round + 1;
    entry = `${actor.name} 消耗 1 张卡牌瞬移到 ${roomLocationName(action.to)}，不消耗行动机会。`;
    roomBattle.actionBroadcast = { title: "魔术师技能", text: entry };
    roomAddLog(entry);
    if (isAllocationTeleport) {
      roomSkillMode = null;
      roomSkillTargeting = null;
      resumeRoomActionQueue();
      return;
    }
    syncRoomBattle();
    renderRoomBattle();
    return;
  } else if (action.id === "magicianHeal") {
    const spend = Number(action.cards);
    if (actor.character !== "magician" || !Number.isInteger(spend) || spend < 1 || spend > (actor.cards || 0) || magicianHealCooldown(actor) > 0 || actor.hp >= actor.maxHp) return;
    const before = actor.hp;
    actor.cards -= spend;
    actor.hp = Math.min(actor.maxHp, actor.hp + spend);
    actor.magicianHealReadyRound = roomBattle.round + 1;
    entry = `${actor.name} 消耗 ${spend} 张卡牌疗愈，恢复 ${actor.hp - before} 点生命。`;
    triggerFeedback("shield", "卡牌疗愈！", actor.id);
  } else if (action.id === "magicianUltimate") {
    const target = getRoomPlayer(action.targetId);
    if (!target || actor.character !== "magician" || actor.magicianUltimateUsed || (actor.cards || 0) < 4 || !isRoomEnemy(actor, target)) return;
    actor.cards -= 4;
    actor.magicianUltimateUsed = true;
    target.hp = Math.max(0, target.hp - 4);
    if (target.hp === 0) target.dead = true;
    actor.magicianExtraActionPending = 1;
    actor.magicianSleepAfterExtra = true;
    const extras = roomAlivePlayers().filter((player) => player.id !== actor.id).map((player) => player.id);
    roomBattle.actionQueue.splice(1, 0, actor.id);
    roomBattle.actionQueue.push(...extras);
    entry = `${actor.name} 消耗本次行动机会与 4 张卡牌发动魔术终幕，对 ${target.name} 造成 4 点伤害${target.dead ? "并淘汰目标" : ""}；随后获得一次额外行动，其余玩家也获得一次行动。随后魔术师将休眠一回合。`;
    triggerFeedback("attack", "魔术终幕！", actor.id);
  } else if (action.id === "vanguardPulse") {
    if (actor.character !== "vanguard" || actor.vanguardPulseUsed) return;
    actor.vanguardPulseUsed = true;
    actor.vanguardPulseArmed = true;
    actor.vanguardPulseResolveRound = roomBattle.round + 2;
    entry = actor.name + " 启动震荡波：下一回合的全部行动结束后，会攻击相邻地区的所有人。";
    triggerFeedback("win", "震荡波已就绪！", actor.id);
  } else if (action.id === "medicHeal") {
    const target = getRoomPlayer(action.targetId);
    if (!target || target.dead || actor.character !== "medic" || actor.inventory.medkit <= 0 || actor.medicHealsRemaining <= 0 || target.team !== actor.team || target.hp >= target.maxHp) return;
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + 2);
    actor.inventory.medkit -= 1;
    actor.medicHealsRemaining -= 1;
    entry = `${actor.name} 消耗本次行动机会远程急救 ${target.name}，恢复了 ${target.hp - before} 点生命。`;
    triggerFeedback("shield", "远程急救生效！", target.id);
  } else if (action.id === "engineerBarrier") {
    const target = getRoomPlayer(action.targetId);
    if (!target || target.dead || actor.character !== "engineer" || (actor.engineerBarriersRemaining || 0) <= 0 || target.team !== actor.team || target.inventory.shield) return;
    actor.engineerBarriersRemaining -= 1;
    target.inventory.shield = true;
    target.inventory.shieldHp = 1;
    entry = `${actor.name} 消耗本次行动机会，为 ${target.name} 部署了应急壁垒。`;
    triggerFeedback("shield", "应急壁垒已部署！", target.id);
  } else if (action.id === "stalkerPounce") {
    const target = getRoomPlayer(action.targetId);
    if (!target || actor.character !== "stalker" || stalkerPounceCooldown(actor) > 0 || !roomConnectedLocations(actor.location).includes(target.location) || !isRoomEnemy(actor, target)) return;
    actor.stalkerPounceReadyRound = roomBattle.round + 2;
    actor.location = target.location;
    const bonus = target.hp <= Math.ceil(target.maxHp / 2) ? 1 : 0;
    target.hp = Math.max(0, target.hp - (2 + bonus));
    if (target.hp === 0) target.dead = true;
    entry = `${actor.name} 发动追猎突袭，跃入 ${roomLocationName(target.location)}，造成 ${2 + bonus} 点伤害${bonus ? "（猎杀本能 +1）" : ""}${target.dead ? "并淘汰目标" : ""}。`;
    triggerFeedback("attack", "追猎突袭！", actor.id);
  } else if (action.id === "stalkerHunt") {
    const target = getRoomPlayer(action.targetId);
    if (!target || actor.character !== "stalker" || actor.stalkerHuntUsed || !isRoomEnemy(actor, target)) return;
    actor.stalkerHuntUsed = true;
    actor.location = target.location;
    const bonus = target.hp <= Math.ceil(target.maxHp / 2) ? 1 : 0;
    target.smoke = false;
    target.inventory.shield = false;
    target.inventory.shieldHp = 0;
    target.hp = Math.max(0, target.hp - (3 + bonus));
    if (target.hp === 0) target.dead = true;
    entry = `${actor.name} 发动致命追猎，无视距离锁定 ${target.name}，造成 ${3 + bonus} 点伤害${bonus ? "（猎杀本能 +1）" : ""}${target.dead ? "并淘汰目标" : ""}。`;
    triggerFeedback("attack", "致命追猎！", actor.id);
  } else if (action.id === "attack") {
    const target = getRoomPlayer(action.targetId);
    if (!target || target.location !== actor.location || !isRoomEnemy(actor, target)) return;
    entry = damageRoomTarget(actor, target);
    triggerFeedback("attack", `${actor.name} 发动攻击！`, actor.id);
    const resultFeedback = feedbackForRoomAttack(entry);
    triggerFeedback(resultFeedback.kind, resultFeedback.text, target.id);
  }
  const newKills = roomBattle.players.filter((player) => player.dead && !deadBefore.has(player.id));
  if (actor.character === "magician" && newKills.length) {
    const gained = addMagicianCards(actor, newKills.length * 2);
    if (gained) entry += ` 击杀奖励：获得 ${gained} 张卡牌（${actor.cards}/5）。`;
  }
  const narratedEntry = roomActionNarration(actor, entry);
  roomBattle.actionBroadcast = { title: "行动播报", text: narratedEntry };
  roomAddLog(narratedEntry);
  showRoomActionReport(narratedEntry);
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
  const vanguardPulse = actions.find((action) => action.id === "vanguardPulse");
  const vanguardCanHit = Boolean(vanguardPulse && roomBattle.players.some((target) => isRoomEnemy(actor, target) && !target.dead && roomConnectedLocations(actor.location).includes(target.location)));
  return (
    actions.find((action) => action.id === "wake") ||
    actions.find((action) => action.id === "bossSweep") ||
    actions.find((action) => action.id === "bossRoar") ||
    actions.find((action) => action.id === "medicHeal") ||
    actions.find((action) => action.id === "fireRocket") ||
    sensibleAttack ||
    (vanguardCanHit ? vanguardPulse : null) ||
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

function skipRoomBotAction(actor) {
  const entry = `${actor.name} 没有可用行动，自动结束本回合。`;
  roomBattle.actionBroadcast = { title: "行动播报", text: entry };
  roomAddLog(entry);
  showRoomActionReport(entry);
}

function maybeRunRoomBotTurn() {
  if (!roomIsHost || !roomBattle || roomBattle.phase !== "action" || roomDuelReveal || roomBotTurnTimer) return;
  const actor = getRoomPlayer(roomBattle.currentActorId);
  if (!actor?.bot) return;
  const actorId = actor.id;
  roomBotTurnTimer = setTimeout(() => {
    roomBotTurnTimer = null;
    if (!roomIsHost || !roomBattle || roomBattle.phase !== "action" || roomBattle.currentActorId !== actorId) return;
    const currentActor = getRoomPlayer(actorId);
    if (!currentActor?.bot) return;
    const action = chooseRoomBotAction(actorId);
    if (action) runRoomAction(actorId, action);
    else skipRoomBotAction(currentActor);
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
  const actions = getRoomActions(actor.id);
  if (skill === "medic") {
    if (!actor.inventory.medkit || !actor.medicHealsRemaining || !actions.some((item) => item.id === "medicHeal")) return;
    roomSkillTargeting = "medic";
    roomBattle.message = "远程急救：点击一名受伤队友的角色卡";
    renderRoomBattle();
    return;
  }
  const actionId = skill === "bossSweep" ? "bossSweep" : skill === "bossRoar" ? "bossRoar" : "vanguardPulse";
  const action = actions.find((item) => item.id === actionId);
  if (action) runRoomAction(actor.id, action);
}

function closeRoomSkillDialog() {
  roomSkillMode = null;
  roomHealAmount = 1;
  if (els.roomSkillDialog) {
    els.roomSkillDialog.classList.add("hidden");
    els.roomSkillDialog.innerHTML = "";
  }
  if (roomBattle) renderRoomBattle();
}

function openMagicianHealDialog(player) {
  const maxSpend = Math.min(player.cards || 0, player.maxHp - player.hp);
  if (!els.roomSkillDialog || maxSpend < 1) return;
  roomSkillMode = "magicianHeal";
  roomHealAmount = Math.min(roomHealAmount, maxSpend);
  els.roomSkillDialog.classList.remove("hidden");
  els.roomSkillDialog.innerHTML = `<div class="skill-dialog-card"><strong>卡牌疗愈</strong><p>选择消耗卡牌数量，1 张卡回复 1 点生命。</p><div class="heal-counter"><button type="button" data-heal="minus">−</button><b data-heal-value>${roomHealAmount}</b><button type="button" data-heal="plus">＋</button></div><small>卡牌：${player.cards}/5 · 生命：${player.hp}/${player.maxHp}</small><div><button type="button" class="confirm-skill" data-heal="confirm">确认使用</button><button type="button" class="cancel-skill" data-heal="cancel">取消</button></div></div>`;
  els.roomSkillDialog.querySelectorAll?.("[data-heal]").forEach((button) => button.addEventListener("click", () => {
    const action = button.dataset.heal;
    if (action === "minus") roomHealAmount = Math.max(1, roomHealAmount - 1);
    if (action === "plus") roomHealAmount = Math.min(maxSpend, roomHealAmount + 1);
    if (action === "cancel") return closeRoomSkillDialog();
    if (action === "confirm") {
      const healAction = getRoomActions(player.id).find((item) => item.id === "magicianHeal" && item.cards === roomHealAmount);
      if (healAction) { closeRoomSkillDialog(); runRoomAction(player.id, healAction); }
      return;
    }
    const value = els.roomSkillDialog.querySelector?.("[data-heal-value]");
    if (value) value.textContent = String(roomHealAmount);
  }));
}

function activateRoleSkill(skill) {
  const player = getRoomPlayer(roomPlayerId);
  if (!player || player.dead || player.asleep || roomBattle?.phase !== "action" || roomBattle.currentActorId !== player.id) return;
  if (player.character === "magician") {
    if (skill === "magicianTeleport") { roomSkillTargeting = null; roomSkillMode = "magicianTeleport"; roomBattle.message = "瞬移：点击地图上的目标地点"; renderRoomBattle(); return; }
    if (skill === "magicianHeal") { openMagicianHealDialog(player); return; }
    if (skill === "magicianUltimate") { roomSkillTargeting = null; roomSkillMode = "magicianUltimate"; roomBattle.message = "魔术终幕：点击一名生存者作为目标"; renderRoomBattle(); return; }
  }
  if (skill === "medic") { roomSkillMode = null; roomSkillTargeting = "medic"; roomBattle.message = "远程急救：点击一名受伤队友"; renderRoomBattle(); return; }
  if (skill === "engineerBarrier") { roomSkillMode = null; roomSkillTargeting = "engineerBarrier"; roomBattle.message = "应急壁垒：点击一名未持盾的同队角色"; renderRoomBattle(); return; }
  if (skill === "stalkerPounce" || skill === "stalkerHunt") { roomSkillTargeting = null; roomSkillMode = skill; roomBattle.message = `${skill === "stalkerPounce" ? "追猎突袭" : "致命追猎"}：点击一名可选目标`; renderRoomBattle(); return; }
  const actions = getRoomActions(player.id);
  const actionId = skill === "bossSweep" ? "bossSweep" : skill === "bossRoar" ? "bossRoar" : skill === "vanguardPulse" ? "vanguardPulse" : null;
  const action = actionId ? actions.find((item) => item.id === actionId) : null;
  if (action) runRoomAction(player.id, action);
}

function renderRoomSkillButtons() {
  if (!roomBattle) return;
  const player = getRoomPlayer(roomPlayerId);
  if (!player) return;
  const sidebarTarget = ["boss", "team"].includes(roomBattle.mode) ? els.roomSkillButtons : null;
  const cardTarget = els.roomSelfStatus?.querySelector?.(".self-status-skills");
  const target = sidebarTarget || cardTarget || els.roomSkillButtons;
  if (!target) return;
  if (els.roomSkillButtons && target !== els.roomSkillButtons) els.roomSkillButtons.innerHTML = "";
  target.innerHTML = "";
  const actions = getRoomActions(player.id);
  const canAct = !player.dead && !player.asleep && roomBattle.phase === "action" && roomBattle.currentActorId === player.id;
  const add = (label, skill, ready, description) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `room-skill-card${ready ? " ready" : " unavailable"}`;
    button.setAttribute?.("aria-disabled", String(!ready));
    button.textContent = label;
    button.title = description;
    button.dataset.tooltip = description;
    button.addEventListener("click", () => { if (ready) activateRoleSkill(skill); });
    target.appendChild(button);
  };
  if (player.character === "magician") {
    add("主动技·瞬移", "magicianTeleport", canAct && (player.cards || 0) >= 1 && magicianTeleportCooldown(player) === 0, "消耗 1 张卡牌，点击地图任意其他地点瞬移；不消耗行动机会。");
    add("主动技·卡牌疗愈", "magicianHeal", canAct && (player.cards || 0) >= 1 && player.hp < player.maxHp && magicianHealCooldown(player) === 0, "消耗任意张卡牌，回复等同于消耗卡牌数的生命；点击后用加减号选择数量。");
    add("主动技·改写结果", "magicianRps", Boolean(roomBattle.magicianRpsOffer?.magicianId === player.id) && (player.cards || 0) >= 2, "猜拳结果揭晓后消耗 2 张卡牌，可以修改自己和其他玩家的出拳结果。");
    add(player.magicianUltimateUsed ? "限定技·魔术终幕（已用）" : "限定技·魔术终幕", "magicianUltimate", canAct && !player.magicianUltimateUsed && (player.cards || 0) >= 4 && actions.some((item) => item.id === "magicianUltimate"), "消耗本次行动机会与 4 张卡牌，对一名玩家造成 4 点伤害；随后获得额外行动，之后休眠一回合，其他玩家各获得额外行动。");
  } else if (player.character === "overlord") {
    add(player.bossSkillUsed ? "限定技·暴君横扫（已用）" : "限定技·暴君横扫", "bossSweep", canAct && actions.some((item) => item.id === "bossSweep"), "对同地点所有生存者造成 2 点伤害；每局限用一次。");
    add("主动技·威慑怒吼", "bossRoar", canAct && actions.some((item) => item.id === "bossRoar"), "对相邻地点所有生存者造成 1 点伤害，冷却 2 回合。");
  } else if (player.character === "stalker") {
    add("主动技·追猎突袭", "stalkerPounce", canAct && actions.some((item) => item.id === "stalkerPounce"), "点击相邻地点的目标，跃迁并造成 2 点伤害；半血目标额外受到 1 点。");
    add(player.stalkerHuntUsed ? "限定技·致命追猎（已用）" : "限定技·致命追猎", "stalkerHunt", canAct && actions.some((item) => item.id === "stalkerHunt"), "无视距离锁定一名目标，清除烟雾和护盾并造成 3 点伤害；每局限用一次。");
  } else if (player.character === "vanguard") {
    add(player.vanguardPulseUsed ? "限定技·震荡波（已用）" : "限定技·震荡波", "vanguardPulse", canAct && actions.some((item) => item.id === "vanguardPulse"), "启动后在下一回合攻击相邻地区的所有敌人，造成 2 点伤害。");
  } else if (player.character === "medic") {
    add(`主动技·远程急救（${player.medicHealsRemaining || 0}/2）`, "medic", canAct && actions.some((item) => item.id === "medicHeal"), "点击一名受伤队友，为其回复 2 点生命并消耗 1 个医疗包及本次行动机会。");
  } else if (player.character === "scout") {
    add("被动技·疾行", "scoutPassive", false, "移动时可以直接前往地图任意地点，无需沿连接线移动。");
  } else if (player.character === "engineer") {
    add(`主动技·应急壁垒（${player.engineerBarriersRemaining || 0}/2）`, "engineerBarrier", canAct && actions.some((item) => item.id === "engineerBarrier"), "每局可用 2 次：点击一名未持盾的同队角色，为其部署可抵挡一次攻击的护盾；消耗本次行动机会。")
  }
}
function renderRoomSelfStatus() {
  if (!els.roomSelfStatus || !roomBattle) return;
  const player = getRoomPlayer(roomPlayerId);
  if (!player) return;
  const character = player.character ? roleConfig(player.character) : { icon: "○", name: "未选择角色" };
  const portrait = `assets/characters/${player.character || (player.boss ? "overlord" : "scout")}.png`;
  const compactOperatorLayout = roomBattle.mode === "team" || (roomBattle.mode === "boss" && !player.boss);
  if (compactOperatorLayout && els.roomBossStatus) {
    els.roomSelfStatus.classList.remove("local-boss");
    els.roomSelfStatus.innerHTML = "";
    els.roomBossStatus.innerHTML = `<article class="operator-status-card${roomBattle.currentActorId === player.id ? " active-turn" : ""}"><img src="${portrait}" alt="${character.name}" /><div><span>操作者 · 生存者</span><strong>${roomPlayerLabel(player)}</strong><small>${character.icon} ${character.name} · ${player.dead ? "已淘汰" : player.asleep ? "睡眠中" : "已起床"}</small>${healthBarMarkup(player)}<small class="operator-location">${roomLocationName(player.location)}</small>${roomCompactInventory(player)}</div></article>`;
    return;
  }
  els.roomSelfStatus.classList.toggle("local-boss", Boolean(player.boss));
  els.roomSelfStatus.innerHTML = `<img class="self-status-portrait" src="${portrait}" alt="${character.name}" /><div class="self-status-main"><span>操作角色</span><strong>${roomPlayerLabel(player)}</strong><small>${character.icon} ${character.name} · ${roomRoleSkillLabel(player)}</small>${healthBarMarkup(player)}</div><div class="self-status-detail"><b>${roomLocationName(player.location)}</b><small>${player.dead ? "已淘汰" : player.asleep ? "睡觉中" : "已起床"}</small><div><i class="${player.inventory.knife ? "on" : ""}">刀</i><i class="${player.inventory.shield ? "on" : ""}">盾</i><i class="${player.inventory.sniper ? "on" : ""}">狙</i><i class="${player.inventory.medkit ? "on" : ""}">医${player.inventory.medkit}</i><i class="${player.inventory.smoke || player.smoke ? "on" : ""}">烟</i><i class="${player.inventory.rocket ? "on" : ""}">炮</i></div></div><div class="self-status-skills" aria-label="角色技能"></div>`;
}
function roomCompactInventory(player) {
  const inventory = player.inventory || {};
  const chip = (label, active) => `<i class="team-item${active ? " on" : ""}">${label}</i>`;
  return `<div class="team-inventory">${chip("刀", inventory.knife)}${chip("盾", inventory.shield)}${chip("狙", inventory.sniper)}${chip(`医${inventory.medkit || 0}`, inventory.medkit)}${chip("烟", inventory.smoke || player.smoke)}${chip("炮", inventory.rocket)}</div>`;
}

function roomBossSkillMarkup(player) {
  if (!player.boss) return "";
  if (player.character === "magician") {
    const teleportCooldown = magicianTeleportCooldown(player);
    const healCooldown = magicianHealCooldown(player);
    return `<div class="team-boss-skills"><b>魔术师技能 · 卡牌 ${player.cards || 0}/5</b><span>主动技·瞬移：${teleportCooldown ? `冷却 ${teleportCooldown} 回合` : (player.cards || 0) >= 1 ? "可用" : "缺少卡牌"}</span><span>主动技·卡牌疗愈：${healCooldown ? `冷却 ${healCooldown} 回合` : (player.cards || 0) >= 1 ? "可用" : "缺少卡牌"}</span><span>主动技·改写结果：猜拳后消耗 2 卡</span><span>限定技·魔术终幕：${player.magicianUltimateUsed ? "已用" : (player.cards || 0) >= 4 ? "可用" : "需要 4 卡"}</span><span>被动：每两回合 +1 卡，击杀 +2 卡</span></div>`;
  }
  if (player.character === "stalker") {
    const pounceCooldown = stalkerPounceCooldown(player);
    return `<div class="team-boss-skills"><b>追猎者技能</b><span>主动技·追猎突袭：${pounceCooldown ? `冷却 ${pounceCooldown} 回合` : "可用"}</span><span>限定技·致命追猎：${player.stalkerHuntUsed ? "已用" : "可用"}</span><span>被动技·猎杀本能：半血目标增伤 1 点</span></div>`;
  }
  const roarCooldown = bossRoarCooldown(player);
  return `<div class="team-boss-skills"><b>霸主技能</b><span>限定技·暴君横扫：${player.bossSkillUsed ? "已用" : "可用"}</span><span>主动技·威慑怒吼：${roarCooldown ? `冷却 ${roarCooldown} 回合` : "可用"}</span><span>被动技·霸主体魄：每轮回复 1 点生命</span></div>`;
}
function roomTargetedSkillAction(target) {
  const actor = getRoomPlayer(roomPlayerId);
  if (!actor || !target || actor.dead || roomBattle?.phase !== "action" || roomBattle.currentActorId !== actor.id) return null;
  const skill = roomSkillTargeting === "medic" ? "medicHeal" : roomSkillTargeting === "engineerBarrier" ? "engineerBarrier" : roomSkillMode;
  if (!new Set(["medicHeal", "engineerBarrier", "magicianUltimate", "stalkerPounce", "stalkerHunt"]).has(skill)) return null;
  return getRoomActions(actor.id).find((action) => action.id === skill && action.targetId === target.id) || null;
}

function applyRoomSkillTargetCard(card, target) {
  const action = roomTargetedSkillAction(target);
  if (!action || !card) return false;
  const labels = {
    medicHeal: "远程急救：点击为该队友治疗",
    magicianUltimate: "魔术终幕：点击锁定该生存者",
    engineerBarrier: "应急壁垒：点击为该同队角色部署护盾",
    stalkerPounce: "追猎突袭：点击跃迁并攻击该目标",
    stalkerHunt: "致命追猎：点击锁定该目标"
  };
  card.classList.add("skill-target", `skill-target-${action.id}`);
  card.title = labels[action.id] || "点击使用技能";
  card.addEventListener("click", () => {
    roomSkillMode = null;
    roomSkillTargeting = null;
    runRoomAction(roomPlayerId, action);
    if (!roomIsHost) renderRoomBattle();
  });
  return true;
}
function renderBattleTeamStatuses() {
  if (!roomBattle || !els.roomTeamA || !els.roomTeamB) return;
  const bossMode = roomBattle.mode === "boss";
  const localPlayer = getRoomPlayer(roomPlayerId);
  const survivorOperatorView = bossMode && Boolean(localPlayer) && !localPlayer.boss;
  const strip = els.roomTeamA.parentElement?.parentElement;
  if (strip) strip.classList.toggle("boss-roster", bossMode);
  const leftTitle = els.roomTeamA.parentElement?.querySelector("strong");
  const rightTitle = els.roomTeamB.parentElement?.querySelector("strong");
  if (leftTitle) leftTitle.textContent = bossMode ? "BOSS" : "红队";
  if (rightTitle) rightTitle.textContent = bossMode ? "生存者" : "蓝队";
  els.roomTeamA.innerHTML = "";
  els.roomTeamB.innerHTML = "";
  if (els.roomBossStatus) els.roomBossStatus.innerHTML = "";
  roomBattle.players
    .filter((player) => !player.dead)
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
    .forEach((player) => {
      const character = player.character ? roleConfig(player.character) : { icon: "○", name: "未选择角色" };
      const portrait = `assets/characters/${player.character || (player.boss ? "overlord" : "scout")}.png`;
      const card = document.createElement("article");
      card.className = `team-status-card${bossMode && player.boss ? " boss-card" : ""}${roomBattle.currentActorId === player.id ? " active-turn" : ""}`;
      card.innerHTML = `<img src="${portrait}" alt="${character.name}" /><div><strong>${roomPlayerLabel(player)}</strong><small>${character.icon} ${character.name} · ${player.dead ? "已淘汰" : player.asleep ? "睡觉中" : "已起床"}</small>${bossMode && player.boss ? `<div class="boss-health"><span style="width:${Math.round((player.hp / player.maxHp) * 100)}%"></span></div><small>${player.hp}/${player.maxHp}</small>` : healthBarMarkup(player)}${roomCompactInventory(player)}</div>`;
      const target = bossMode ? (player.boss ? (survivorOperatorView ? els.roomTeamA : (els.roomBossStatus || els.roomTeamA)) : els.roomTeamB) : (player.team === "A" ? els.roomTeamA : els.roomTeamB);
      if (false && player.id === roomPlayerId && player.character === "overlord") {
        const skillActions = document.createElement("div");
        skillActions.className = "team-boss-actions";
        const available = getRoomActions(player.id);
        const canAct = !player.dead && !player.asleep && roomBattle.phase === "action" && roomBattle.currentActorId === player.id;
        const roarCooldown = bossRoarCooldown(player);
        [["bossSweep", "限定技：暴君横扫", player.bossSkillUsed], ["bossRoar", roarCooldown ? `主动技：威慑怒吼（冷却 ${roarCooldown}）` : "主动技：威慑怒吼", false]].forEach(([skill, label, used]) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "self-skill-button";
          const ready = !used && canAct && available.some((action) => action.id === skill);
          button.disabled = !ready;
          button.classList.toggle("ready", ready);
          button.textContent = used ? `${label}（已用）` : label;
          button.addEventListener("click", () => activateRoomSkill(skill));
          skillActions.appendChild(button);
        });
        card.appendChild(skillActions);
      }
      applyRoomSkillTargetCard(card, player);
      target.appendChild?.(card);

    });
}
function renderRoomBattle() {
  if (!roomBattle) return;
  ensureRoomPlayerId();
  els.roomBattlePanel?.classList?.toggle("boss-layout", roomBattle.mode === "boss");
  const localBattlePlayer = getRoomPlayer(roomPlayerId);
  els.roomBattlePanel?.classList?.toggle("local-survivor", roomBattle.mode === "boss" && Boolean(localBattlePlayer) && !localBattlePlayer.boss);
  els.roomBattlePanel?.classList?.toggle("team-operator-layout", roomBattle.mode === "team" && Boolean(localBattlePlayer));
  setRoomBattleVisible(true);
  resumeRoomActionReportCompletion();
  if (roomBattle.phase === "action" && roomBattle.lastThrows && !roomDuelReveal && roomDuelRevealRound !== roomBattle.round) startRoomDuelReveal("win");
  if (roomBattle.phase === "duel" && roomBattle.duelOutcome === "tie" && !roomDuelReveal && roomDuelRevealRound !== roomBattle.round) startRoomDuelReveal("tie");
  const isDuelPhase = (["duel", "magicianChoice", "magicianTeleportChoice"].includes(roomBattle.phase) && !roomBattle.gameOver) || Boolean(roomDuelReveal) || Boolean(roomBattle.actionReport);
  setRoomDuelVisible(isDuelPhase);
  if (isMobileBattleViewport() && roomBattle.phase === "magicianTeleportTarget" && roomBattle.magicianTeleportOffer?.magicianId === roomPlayerId) {
    mobileBattlePanelMode = "map";
  }
  renderMobileBattleDock();
  renderMobileBattlePanel();
  renderRoomLobby();
  renderRoomResult();
  renderRoomActionBulletin();
  if (isDuelPhase) {
    if (roomBattle.actionReport) renderRoomActionReport();
    else renderRoomDuelScreen();
    return;
  }
  renderBattleTeamStatuses();
  renderRoomSelfStatus();
  renderRoomMap();  if (els.roomBattleStatus) els.roomBattleStatus.textContent = roomBattle.message;
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
  renderRoomSkillButtons();
  if (els.roomActionButtons) {
    els.roomActionButtons.innerHTML = "";
    const localActor = getRoomPlayer(roomPlayerId);
    const skillIds = new Set(["bossSweep", "bossRoar", "stalkerPounce", "stalkerHunt", "magicianTeleport", "magicianHeal", "magicianRps", "magicianUltimate", "vanguardPulse", "medicHeal", "engineerBarrier"]);
    const actions = getRoomActions(roomPlayerId).filter((action) => !skillIds.has(action.id) && !(localActor?.character === "scout" && action.id === "move"));
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
  }  if (els.roomBattleLog) {
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

function edgeDirection(fromNode, toNode) {
  const from = String(fromNode?.pos || "").match(/^r(\d+)c(\d+)$/);
  const to = String(toNode?.pos || "").match(/^r(\d+)c(\d+)$/);
  if (!from || !to) return "edge-horizontal";
  return from[2] === to[2] ? "edge-vertical" : "edge-horizontal";
}

function renderRoomMap() {
  if (!els.roomMap) return;
  const config = roomMapConfig(roomBattle?.mode || roomMode);
  els.roomMap.innerHTML = "";
  const activeMode = roomBattle?.mode || roomMode;
  const teleportTargeting = roomSkillMode === "magicianTeleport" || (roomBattle?.phase === "magicianTeleportTarget" && roomBattle.magicianTeleportOffer?.magicianId === roomPlayerId);
  els.roomMap.className = `battle-map-layout ${activeMode}-map${teleportTargeting ? " teleport-targeting" : ""}`;
  if (els.roomMapLinks) els.roomMapLinks.innerHTML = "";

  const lines = document.createElement("div");
  lines.className = "map-lines";
  config.edges.forEach(([from, to]) => {
    const line = document.createElement("span");
    line.className = `map-connector ${edgeClass(from, to)} ${edgeDirection(config.nodes[from], config.nodes[to])}`;
    lines.appendChild(line);
  });
  els.roomMap.appendChild(lines);

  Object.entries(config.nodes).forEach(([id, node]) => {
    const card = document.createElement("article");
    const occupants = (roomBattle?.players || []).filter((player) => player.location === id);
    card.className = `room-map-node ${node.className} pos-${node.pos}`;
    card.dataset.node = id;
    const localActor = getRoomPlayer(roomPlayerId);
    if (teleportTargeting && localActor?.character === "magician") {
      card.classList.add("skill-target", "teleport-highlight");
      const teleportAction = getMagicianTeleportActions(roomPlayerId).find((action) => action.id === "magicianTeleport" && action.to === id);
      if (teleportAction) {
        card.title = `点击瞬移到${node.name}`;
        card.addEventListener("click", () => { closeRoomSkillDialog(); runRoomAction(roomPlayerId, teleportAction); });
      } else {
        card.classList.add("current-teleport-location");
        card.title = "当前位置";
      }
    }
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
    const teamHome = id === "redHome" ? "red" : id === "blueHome" ? "blue" : null;
    if (card.setAttribute) card.setAttribute("aria-label", node.name);
    card.innerHTML = teamHome ? `<span class="map-team-box ${teamHome}" aria-hidden="true"></span><strong>${node.name}</strong>` : `<strong>${node.name}</strong>`;
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
function isMobileBattleViewport() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(max-width: 700px)").matches;
}

function mobileRoleName(player) {
  const role = roleConfig(player?.character);
  return `${role.icon} ${role.name}`;
}

function createMobileBattleButton(label, className, handler, disabled = false) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.disabled = disabled;
  if (!disabled) button.addEventListener("click", handler);
  return button;
}

function closeMobileBattlePanel(cancelTargeting = false) {
  if (cancelTargeting) {
    roomSkillTargeting = null;
    roomSkillMode = null;
  }
  mobileBattlePanelMode = null;
  els.mobileBattlePanel?.classList?.add("hidden");
  if (els.mobileBattlePanelBody) els.mobileBattlePanelBody.innerHTML = "";
}

function openMobileBattlePanel(mode) {
  if (!isMobileBattleViewport() || !roomBattle) return;
  mobileBattlePanelMode = mode;
  renderMobileBattlePanel();
}

function renderMobileBattleDock() {
  const active = Boolean(isMobileBattleViewport() && gameMode === "room" && roomBattle && !roomBattle.gameOver);
  els.mobileBattleDock?.classList?.toggle("hidden", !active);
  if (!active) closeMobileBattlePanel();
}

function appendMobilePlayerStatus(container, player) {
  const card = document.createElement("article");
  card.className = `mobile-player-status${player.id === roomPlayerId ? " local" : ""}${player.dead ? " dead" : ""}`;
  const title = document.createElement("strong");
  title.textContent = roomPlayerLabel(player);
  const role = document.createElement("span");
  role.textContent = `${player.boss ? "BOSS · " : ""}${mobileRoleName(player)} · ${player.hp}/${player.maxHp}`;
  const detail = document.createElement("small");
  detail.textContent = `${roomLocationName(player.location)} · ${player.dead ? "已淘汰" : player.asleep ? "睡眠中" : "已起床"}`;
  card.append(title, role, detail);
  container.appendChild(card);
}

function renderMobileStatusPanel(body) {
  const heading = document.createElement("p");
  heading.className = "mobile-panel-note";
  heading.textContent = roomBattle.message;
  body.appendChild(heading);
  const list = document.createElement("div");
  list.className = "mobile-player-status-list";
  roomBattle.players.filter((player) => !player.dead).forEach((player) => appendMobilePlayerStatus(list, player));
  body.appendChild(list);
}

function mobileSkillActionIds() {
  return new Set(["bossSweep", "bossRoar", "stalkerPounce", "stalkerHunt", "magicianTeleport", "magicianHeal", "magicianRps", "magicianUltimate", "vanguardPulse", "medicHeal", "engineerBarrier"]);
}

function renderMobileActionPanel(body) {
  const player = getRoomPlayer(roomPlayerId);
  const actions = player ? getRoomActions(player.id).filter((action) => !mobileSkillActionIds().has(action.id)) : [];
  const note = document.createElement("p");
  note.className = "mobile-panel-note";
  note.textContent = actions.length ? "选择一项行动。执行后会自动回到战斗播报。" : "当前没有可执行的普通行动。";
  body.appendChild(note);
  const list = document.createElement("div");
  list.className = "mobile-action-list";
  actions.forEach((action) => list.appendChild(createMobileBattleButton(action.label, "mobile-action-button", () => {
    closeMobileBattlePanel();
    runRoomAction(player.id, action);
  })));
  if (!actions.length) list.appendChild(createMobileBattleButton("等待其他玩家行动", "mobile-action-button unavailable", () => {}, true));
  body.appendChild(list);
}

function mobileMapAction(player, nodeId) {
  if (!player) return null;
  const teleportTargeting = roomSkillMode === "magicianTeleport" || (roomBattle?.phase === "magicianTeleportTarget" && roomBattle.magicianTeleportOffer?.magicianId === player.id);
  if (teleportTargeting) return getMagicianTeleportActions(player.id).find((action) => action.to === nodeId) || null;
  if (player.character === "scout") return getRoomActions(player.id).find((action) => action.id === "move" && action.to === nodeId) || null;
  return null;
}

function renderMobileMapPanel(body) {
  const player = getRoomPlayer(roomPlayerId);
  const config = roomMapConfig(roomBattle.mode);
  const note = document.createElement("p");
  note.className = "mobile-panel-note";
  const teleportTargeting = roomSkillMode === "magicianTeleport" || (roomBattle?.phase === "magicianTeleportTarget" && roomBattle.magicianTeleportOffer?.magicianId === player?.id);
  note.textContent = teleportTargeting ? "瞬移目标：点击任意高亮地点。" : "地图使用连接关系标注；侦察兵可直接点击目的地疾行。";
  body.appendChild(note);
  const map = document.createElement("div");
  map.className = "mobile-map-grid";
  Object.entries(config.nodes).forEach(([id, node]) => {
    const action = mobileMapAction(player, id);
    const nodeButton = createMobileBattleButton(node.name, `mobile-map-node ${node.className}${action ? " actionable" : ""}${teleportTargeting ? " teleport-choice" : ""}`, () => {
      if (!action) return;
      roomSkillMode = null;
      closeMobileBattlePanel();
      runRoomAction(player.id, action);
    }, !action && teleportTargeting);
    const links = linkedRoomNames(config, id);
    const connection = document.createElement("small");
    connection.textContent = `连接：${links.join(" · ") || "无"}`;
    const occupants = (roomBattle.players || []).filter((entry) => entry.location === id && !entry.dead);
    const occupancy = document.createElement("span");
    occupancy.textContent = occupants.length ? occupants.map((entry) => entry.id === roomPlayerId ? "你" : entry.name).join(" · ") : "无人";
    nodeButton.append(connection, occupancy);
    map.appendChild(nodeButton);
  });
  body.appendChild(map);
}

function targetedMobileActions(player) {
  const skill = roomSkillTargeting === "medic" ? "medicHeal" : roomSkillTargeting === "engineerBarrier" ? "engineerBarrier" : roomSkillMode;
  const supported = new Set(["medicHeal", "engineerBarrier", "magicianUltimate", "stalkerPounce", "stalkerHunt"]);
  if (!player || !supported.has(skill)) return [];
  return getRoomActions(player.id).filter((action) => action.id === skill);
}

function renderMobileTargetPanel(body) {
  const player = getRoomPlayer(roomPlayerId);
  const actions = targetedMobileActions(player);
  const note = document.createElement("p");
  note.className = "mobile-panel-note";
  note.textContent = actions.length ? "选择目标。目标卡会直接执行当前技能。" : "当前没有符合条件的目标。";
  body.appendChild(note);
  const list = document.createElement("div");
  list.className = "mobile-action-list";
  actions.forEach((action) => {
    const target = getRoomPlayer(action.targetId);
    list.appendChild(createMobileBattleButton(`${action.label} · ${target?.hp || 0}/${target?.maxHp || 0}`, "mobile-action-button skill", () => {
      roomSkillTargeting = null;
      roomSkillMode = null;
      closeMobileBattlePanel();
      runRoomAction(player.id, action);
    }));
  });
  if (!actions.length) list.appendChild(createMobileBattleButton("暂无可选目标", "mobile-action-button unavailable", () => {}, true));
  body.appendChild(list);
}

function useMobileRoleSkill(skill) {
  activateRoleSkill(skill);
  if (roomSkillMode === "magicianTeleport") {
    openMobileBattlePanel("map");
  } else if (roomSkillTargeting || new Set(["magicianUltimate", "stalkerPounce", "stalkerHunt"]).has(roomSkillMode)) {
    openMobileBattlePanel("targets");
  } else {
    closeMobileBattlePanel();
  }
}

function renderMobileSkillPanel(body) {
  const player = getRoomPlayer(roomPlayerId);
  const canAct = Boolean(player && !player.dead && !player.asleep && roomBattle.phase === "action" && roomBattle.currentActorId === player.id);
  const actions = player ? getRoomActions(player.id) : [];
  const list = document.createElement("div");
  list.className = "mobile-action-list";
  const add = (label, skill, actionId) => {
    const ready = canAct && actions.some((action) => action.id === actionId);
    list.appendChild(createMobileBattleButton(label, `mobile-action-button skill${ready ? " ready" : " unavailable"}`, () => useMobileRoleSkill(skill), !ready));
  };
  if (!player) return;
  if (player.character === "overlord") {
    add("限定技 · 暴君横扫", "bossSweep", "bossSweep");
    add("主动技 · 威慑怒吼", "bossRoar", "bossRoar");
  } else if (player.character === "stalker") {
    add("主动技 · 追猎突袭", "stalkerPounce", "stalkerPounce");
    add("限定技 · 致命追猎", "stalkerHunt", "stalkerHunt");
  } else if (player.character === "magician") {
    add("主动技 · 瞬移", "magicianTeleport", "magicianTeleport");
    add("主动技 · 卡牌疗愈", "magicianHeal", "magicianHeal");
    add("限定技 · 魔术终幕", "magicianUltimate", "magicianUltimate");
  } else if (player.character === "vanguard") {
    add(player.vanguardPulseUsed ? "限定技 · 震荡波（已用）" : "限定技 · 震荡波", "vanguardPulse", "vanguardPulse");
  } else if (player.character === "medic") {
    add("主动技 · 远程急救", "medic", "medicHeal");
  } else if (player.character === "engineer") {
    add("主动技 · 应急壁垒", "engineerBarrier", "engineerBarrier");
  } else {
    list.appendChild(createMobileBattleButton("被动技 · 疾行（地图中点击任意地点）", "mobile-action-button unavailable", () => {}, true));
  }
  const note = document.createElement("p");
  note.className = "mobile-panel-note";
  note.textContent = canAct ? "金色按钮可立即使用；需要目标的技能会打开目标选择。" : "当前不是你的行动回合，技能将在获得行动权后可用。";
  body.append(note, list);
}

function renderMobileBattlePanel() {
  const panel = els.mobileBattlePanel;
  const body = els.mobileBattlePanelBody;
  if (!panel || !body || !isMobileBattleViewport() || !roomBattle || !mobileBattlePanelMode) {
    panel?.classList?.add("hidden");
    return;
  }
  const titles = { status: "战场状态", map: "战术地图", actions: "行动选择", skills: "角色技能", targets: "选择技能目标" };
  if (els.mobileBattlePanelTitle) els.mobileBattlePanelTitle.textContent = titles[mobileBattlePanelMode] || "战斗操作";
  body.innerHTML = "";
  panel.classList.remove("hidden");
  if (mobileBattlePanelMode === "status") renderMobileStatusPanel(body);
  if (mobileBattlePanelMode === "map") renderMobileMapPanel(body);
  if (mobileBattlePanelMode === "actions") renderMobileActionPanel(body);
  if (mobileBattlePanelMode === "skills") renderMobileSkillPanel(body);
  if (mobileBattlePanelMode === "targets") renderMobileTargetPanel(body);
}
function renderRoomLobby() {
  renderRoomMap();
  if (!els.roomSlots) return;
  els.roomSlots.innerHTML = "";
  const activeBattle = roomState?.started ? roomBattle : null;
  const players = activeBattle?.players || roomState?.players || [];
  const max = roomState?.maxPlayers || roomCapacity();
  // Your detailed state stays in the dedicated top panel during battle.
  const visiblePlayers = activeBattle ? players.filter((player) => player.id !== roomPlayerId).sort((a, b) => String(a.team || "Z").localeCompare(String(b.team || "Z"))) : players;
  const slotCount = activeBattle ? visiblePlayers.length : max;
  for (let index = 0; index < slotCount; index += 1) {
    const player = visiblePlayers[index];
    const slot = document.createElement("article");
    const teamClass = player?.team === "A" ? "team-a" : player?.team === "B" ? "team-b" : "";
    const wonRound = Boolean(roomBattle?.phase === "action" && player && roomBattle.actionQueue.includes(player.id));
    slot.className = `slot-card ${player ? teamClass : "empty"}${player?.dead ? " dead" : ""}${wonRound ? " round-winner" : ""}${roomBattle?.currentActorId === player?.id ? " active-turn" : ""}`;
    if (player) slot.dataset.playerId = player.id;
    if (player) {
      const activeMode = roomBattle?.mode || roomState?.mode;
      const team = activeMode === "team" ? (player.team === "A" ? "红队" : "蓝队") : activeMode === "boss" ? (player.boss ? "BOSS" : "生存者") : "乱战";
      const character = player.character ? roleConfig(player.character) : { icon: "○", name: "未选择角色" };
      if (activeBattle) {
        const portrait = `assets/characters/${player.character || (player.boss ? "overlord" : "scout")}.png`;
        slot.innerHTML = `<img class="slot-portrait" src="${portrait}" alt="${character.name}" /><div class="slot-card-content"><span class="slot-team-badge ${teamClass || "free-for-all"}">${team}</span><div class="slot-throw ${roomThrowClass(player)}">${roomThrowBadge(player)}</div><strong>${roomPlayerLabel(player)}</strong><small>${character.icon} ${character.name} · ${roomRoleSkillLabel(player)} · ${team} · ${player.bot ? "人机" : player.role === "host" ? "房主" : "玩家"} · ${player.dead ? "死亡" : player.asleep ? "睡觉中" : "已起床"}</small><div class="slot-stats"><span class="slot-chip hp-chip">${healthBarMarkup(player)}</span><span class="slot-chip">${roomLocationName(player.location)}</span><span class="slot-chip ${player.inventory.knife ? "on" : ""}">刀</span><span class="slot-chip ${player.inventory.shield ? "on" : ""}">盾</span><span class="slot-chip ${player.inventory.sniper ? "on" : ""}">狙</span><span class="slot-chip ${player.inventory.medkit ? "on" : ""}">医</span><span class="slot-chip ${player.inventory.smoke || player.smoke ? "on" : ""}">烟</span><span class="slot-chip ${player.inventory.rocket ? "on" : ""}">炮</span></div></div>`;
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
        }        if (!activeBattle && roomIsHost && (activeMode === "boss" || activeMode === "team")) {
          const assignment = document.createElement("select");
          assignment.className = "slot-assignment";
          assignment.setAttribute("aria-label", `设置 ${player.name} 的身份`);
          const choices = activeMode === "boss"
            ? [{ value: "survivor", label: "生存者" }, { value: "boss", label: "BOSS" }]
            : [{ value: "A", label: "红队" }, { value: "B", label: "蓝队" }];
          choices.forEach((choice) => {
            const option = document.createElement("option");
            option.value = choice.value;
            option.textContent = choice.label;
            assignment.appendChild(option);
          });
          assignment.value = activeMode === "boss" ? (player.boss ? "boss" : "survivor") : player.team || "A";
          assignment.addEventListener("change", () => assignRoomPlayer(player.id, assignment.value));
          slot.appendChild(assignment);
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
        team: roomMode === "team" ? "A" : roomMode === "boss" ? "A" : null,
        boss: false,
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
  const activeChannel = channel;
  channel = null;
  peer = null;
  pendingThrows = {};
  if (activeChannel) {
    activeChannel.onmessage = null;
    activeChannel.onclose = null;
    activeChannel.onerror = null;
    activeChannel.close();
  }
}

function attachRoomSocket(socket) {
  channel = socket;
  socket.onmessage = (event) => { if (channel === socket) handleNetworkMessage(JSON.parse(event.data)); };
  socket.onclose = () => { if (channel === socket) (gameMode === "room" ? setRoomStatus("房间连接断开") : setOnlineStatus("联机断开")); };
  socket.onerror = () => { if (channel === socket) (gameMode === "room" ? setRoomStatus("连接房间服务器失败") : setOnlineStatus("连接房间服务器失败")); };
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

  if (gameMode === "room" && message.type === "roomCharacterSelection") {
    applyRoomState(message.room);
    selectedMode = roomMode;
    const player = message.room.players.find((entry) => entry.id === roomPlayerId);
    selectedCharacter = player && player.boss ? (bosses[player.character] ? player.character : "overlord") : "scout";
    if (els.characterModeLabel) els.characterModeLabel.textContent = roomModeName();
    if (els.characterTitle) els.characterTitle.textContent = "选择你的角色";
    if (els.characterHint) els.characterHint.textContent = player && player.boss ? "你是 BOSS，可以选择霸主或追猎者。" : "选择角色并确认，等待其他玩家准备。";
    if (els.characterStartBtn) { els.characterStartBtn.disabled = false; els.characterStartBtn.textContent = "确认角色"; }
    renderCharacterPicker();
    showScreen("character");
    return;
  }

  if (gameMode === "room" && message.type === "roomCharactersReady") {
    applyRoomState(message.room);
    if (roomIsHost) {
      roomBattle = createRoomBattle(message.room);
      sendNetwork({ type: "startRoom", battle: roomBattle });
    }
    return;
  }

  if (gameMode === "room" && message.type === "roomStarted") {
    roomBattle = message.battle || createRoomBattle(message.room);
    applyRoomState(message.room);
    setRoomStatus("房间已开始，进入战斗界面。");
    renderRoomBattle();
    return;
  }

  if (gameMode === "room" && message.type === "roomReturnedToLobby") {
    roomBattle = null;
    roomSkillTargeting = null;
    setRoomBattleLogVisible(false);
    els.roomBattlePanel?.classList?.remove("log-open");
    applyRoomState(message.room);
    setRoomStatus("战斗结束，已返回原房间。房主可直接开始下一局。");
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

  if (gameMode === "room" && message.type === "magicianRpsChoice") {
    if (roomIsHost && roomBattle?.magicianRpsOffer?.magicianId === message.actorId) resolveMagicianRpsChoice(Boolean(message.useSkill), message.edits || {});
    return;
  }

  if (gameMode === "room" && message.type === "magicianTeleportChoice") {
    if (roomIsHost && roomBattle?.magicianTeleportOffer?.magicianId === message.actorId) resolveMagicianTeleportChoice(Boolean(message.useSkill));
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
  selectedCharacter = roleConfig(button.dataset.character) ? button.dataset.character : "scout";
  if (gameMode === "room" && roomState && !roomState.started) sendNetwork({ type: "setCharacter", character: selectedCharacter });
  renderCharacterPicker();
}));
els.singleModeBtn.addEventListener("click", startSingleMode);
els.teamModeBtn.addEventListener("click", () => enterRoomMode("team").catch((error) => setRoomStatus(`创建房间失败：${error.message}`)));
els.bossModeBtn?.addEventListener("click", () => enterRoomMode("boss").catch((error) => setRoomStatus(`创建房间失败：${error.message}`)));
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
els.roomStartBtn.addEventListener("click", startModeRoom);
els.roomReturnLobbyBtn?.addEventListener("click", returnRoomToLobby);
els.battleLogHeaderBtn?.addEventListener("click", () => setRoomBattleLogVisible(true));
els.battleLogCloseBtn?.addEventListener("click", () => setRoomBattleLogVisible(false));
els.battleLogDialog?.addEventListener("click", (event) => { if (event.target === els.battleLogDialog) setRoomBattleLogVisible(false); });
els.mobileBattleDock?.querySelectorAll?.("[data-mobile-panel]").forEach((button) => {
  button.addEventListener("click", () => openMobileBattlePanel(button.dataset.mobilePanel));
});
els.mobileBattlePanelClose?.addEventListener("click", () => closeMobileBattlePanel(true));
els.mobileBattlePanel?.addEventListener("click", (event) => {
  if (event.target === els.mobileBattlePanel) closeMobileBattlePanel(true);
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
if (typeof navigator !== "undefined" && navigator.serviceWorker && typeof window !== "undefined" && window.addEventListener) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}