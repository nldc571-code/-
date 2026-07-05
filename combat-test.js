const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  const listeners = {};
  return {
    dataset: {}, disabled: false, textContent: "", innerHTML: "", className: "", title: "",
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    append() {}, appendChild() {},
    addEventListener(type, handler) { listeners[type] = handler; },
    click() { if (listeners.click) listeners.click(); },
  };
}

function setup() {
  const ids = ["resetBtn","roundResult","playerThrow","computerThrow","playerState","computerState","playerLocation","computerLocation","playerHp","computerHp","playerSkill","computerSkill","playerCard","computerCard","turnHint","actionHint","mapGrid","actions","logList"];
  const elements = Object.fromEntries(ids.map((id) => [`#${id}`, createElement()]));
  const throwButtons = ["rock", "scissors", "paper"].map((choice) => { const b = createElement(); b.dataset.throw = choice; return b; });
  const document = { querySelector: (s) => elements[s] || createElement(), querySelectorAll: (s) => s === ".throw-button" ? throwButtons : [], createElement };
  const context = { console, document, setTimeout(fn) { fn(); } };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("game.js", "utf8"), context);
  return { context, elements };
}

let env = setup();
vm.runInContext(`
state.actors.player.asleep = false;
state.actors.computer.asleep = false;
state.actors.player.location = "wild";
state.actors.computer.location = "wild";
state.phase = "action";
state.winner = "player";
render();
`, env.context);
env.elements["#computerCard"].click();
if (vm.runInContext("state.actors.computer.hp", env.context) !== 2) throw new Error("点击头像没有执行手刀攻击。")

env = setup();
vm.runInContext(`
state.actors.player.asleep = false;
state.actors.computer.asleep = false;
state.actors.player.inventory.knife = true;
state.actors.computer.inventory.shield = true;
state.actors.computer.inventory.shieldHp = 1;
state.actors.player.location = "wild";
state.actors.computer.location = "wild";
state.phase = "action";
state.winner = "player";
runAction("player", { id: "meleeAttack" });
`, env.context);
if (vm.runInContext("state.actors.computer.hp", env.context) !== 3) throw new Error("刀破盾时出现了溢出伤害。")
if (vm.runInContext("state.actors.computer.inventory.shield", env.context) !== false) throw new Error("刀没有破盾。")

env = setup();
vm.runInContext(`
state.actors.player.asleep = false;
state.actors.computer.asleep = false;
state.actors.player.location = "wild";
state.actors.computer.location = "wild";
state.actors.player.vehicle = "plane";
state.actors.computer.vehicle = "tank";
state.actors.computer.inventory.shield = true;
state.actors.computer.inventory.shieldHp = 1;
state.vehicles.plane.location = "wild";
state.vehicles.tank.location = "wild";
state.vehicles.tank.hp = 1;
state.phase = "action";
state.winner = "player";
runAction("player", { id: "vehicleAttack" });
`, env.context);
if (vm.runInContext("state.actors.computer.hp", env.context) !== 3) throw new Error("载具溢出伤害没有被盾完全吸收。")
if (vm.runInContext("state.actors.computer.inventory.shield", env.context) !== false) throw new Error("载具溢出没有破盾。")

env = setup();
vm.runInContext(`
state.actors.player.asleep = false;
state.actors.player.location = "armory";
state.actors.player.vehicle = "plane";
state.vehicles.plane.location = "armory";
state.phase = "action";
state.winner = "player";
`, env.context);
if (vm.runInContext("actionDefinitions.takeItem.canUse(state.actors.player, state.actors.computer, { item: 'knife' })", env.context) !== false) throw new Error("载具上仍然可以拿军火库物品。")

console.log("combat rule test passed");
