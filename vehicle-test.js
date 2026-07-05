const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  const listeners = {};
  return {
    dataset: {}, disabled: false, textContent: "", innerHTML: "", className: "",
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    append() {}, appendChild() {},
    addEventListener(type, handler) { listeners[type] = handler; },
    click() { if (listeners.click) listeners.click(); },
  };
}

const ids = ["resetBtn","roundResult","playerThrow","computerThrow","playerState","computerState","playerLocation","computerLocation","playerHp","computerHp","playerSkill","computerSkill","playerCard","computerCard","turnHint","actionHint","mapGrid","actions","logList"];
const elements = Object.fromEntries(ids.map((id) => [`#${id}`, createElement()]));
const throwButtons = ["rock", "scissors", "paper"].map((choice) => { const b = createElement(); b.dataset.throw = choice; return b; });
const document = { querySelector: (s) => elements[s] || createElement(), querySelectorAll: (s) => s === ".throw-button" ? throwButtons : [], createElement };
const context = { console, document, setTimeout(fn) { fn(); } };
vm.createContext(context);
vm.runInContext(fs.readFileSync("game.js", "utf8"), context);

vm.runInContext(`
state.actors.player.asleep = false;
state.actors.computer.asleep = false;
state.actors.player.location = "wild";
state.actors.computer.location = "wild";
state.actors.player.vehicle = "plane";
state.actors.computer.vehicle = "tank";
state.vehicles.plane.location = "wild";
state.vehicles.tank.location = "wild";
state.vehicles.tank.hp = 1;
state.phase = "action";
state.winner = "player";
runAction("player", { id: "vehicleAttack" });
`, context);

if (vm.runInContext("state.vehicles.tank.hp", context) !== 0) throw new Error("飞机没有摧毁残血坦克。")
if (vm.runInContext("state.actors.computer.hp", context) !== 2) throw new Error("溢出伤害没有扣到玩家身上。")
if (vm.runInContext("state.actors.computer.vehicle", context) !== null) throw new Error("坦克爆炸后玩家仍在载具上。")
console.log("vehicle rule test passed");
