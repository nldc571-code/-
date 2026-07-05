const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  const listeners = {};
  const children = [];
  return {
    dataset: {}, disabled: false, textContent: "", innerHTML: "", className: "", title: "",
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    append(...nodes) { children.push(...nodes); },
    appendChild(node) { children.push(node); },
    addEventListener(type, handler) { listeners[type] = handler; },
    click() { if (listeners.click) listeners.click(); },
    get children() { return children; },
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

const env = setup();
vm.runInContext(`
state.actors.player.asleep = false;
state.actors.computer.asleep = false;
state.actors.player.location = "playerHome";
state.actors.computer.location = "wild";
state.phase = "action";
state.winner = "player";
render();
`, env.context);
env.elements["#computerCard"].click();
if (vm.runInContext("state.actors.player.location", env.context) !== "wild") throw new Error("点击头像没有移动到对方身边。")

const env2 = setup();
vm.runInContext(`
state.actors.player.asleep = false;
state.actors.computer.asleep = false;
state.actors.player.location = "playerHome";
state.actors.computer.location = "wild";
state.phase = "action";
state.winner = "player";
render();
`, env2.context);
const actionText = env2.elements["#actions"].children.map((node) => node.innerHTML).join("\n");
if (actionText.includes("去野外") || actionText.includes("驾驶去")) throw new Error("移动仍然显示在行动栏。")

vm.runInContext(`
state.actors.player.location = "playerHome";
state.phase = "action";
state.winner = "player";
handleMapTileClick("armory");
`, env2.context);
if (vm.runInContext("state.actors.player.location", env2.context) !== "armory") throw new Error("点击地图没有移动。")
console.log("movement click test passed");
