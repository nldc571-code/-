const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  const listeners = {};
  const children = [];
  return {
    dataset: {},
    disabled: false,
    textContent: "",
    innerHTML: "",
    className: "",
    title: "",
    value: "",
    classList: {
      toggle() {},
      add() {},
      remove() {},
      contains() { return false; },
    },
    append(...nodes) { children.push(...nodes); },
    appendChild(node) { children.push(node); },
    addEventListener(type, handler) { listeners[type] = handler; },
    click() { if (listeners.click) listeners.click(); },
    get children() { return children; },
  };
}

const ids = [
  "resetBtn", "roundResult", "playerThrow", "computerThrow", "playerState", "computerState",
  "playerLocation", "computerLocation", "playerHp", "computerHp", "playerSkill", "computerSkill",
  "playerCard", "computerCard", "turnHint", "actionHint", "mapGrid", "actions", "logList",
  "onlineStatus", "hostBtn", "joinBtn", "applyCodeBtn", "offlineBtn", "localCode", "remoteCode",
];
const elements = Object.fromEntries(ids.map((id) => [`#${id}`, createElement()]));
elements["#playerCard h2"] = createElement();
elements["#computerCard h2"] = createElement();
const throwButtons = ["rock", "scissors", "paper"].map((choice) => {
  const button = createElement();
  button.dataset.throw = choice;
  return button;
});
const document = {
  querySelector: (selector) => elements[selector] || createElement(),
  querySelectorAll: (selector) => selector === ".throw-button" ? throwButtons : [],
  createElement,
};
const context = {
  console,
  document,
  setTimeout(fn) { fn(); },
  window: { location: { hostname: "localhost", port: "8787" } },
  WebSocket: { OPEN: 1 },
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("game.js", "utf8"), context);
vm.runInContext(`
gameMode = "online";
isHost = true;
localActorId = "player";
state = initialState();
applyOnlineActorNames();
render();
handleNetworkMessage({ type: "throw", actorId: "computer", choice: "scissors" });
`, context);

if (vm.runInContext("state.computerThrow", context) !== null) {
  throw new Error("对方先出拳时，具体拳型被写进了公开状态。");
}
if (elements["#computerThrow"].textContent !== "对方：已出拳") {
  throw new Error(`对方先出拳时界面不应显示具体拳型，当前为：${elements["#computerThrow"].textContent}`);
}

vm.runInContext(`
handleOnlineThrow("rock");
`, context);

if (vm.runInContext("state.playerThrow", context) !== "rock") throw new Error("双方出拳后没有揭晓房主拳型。");
if (vm.runInContext("state.computerThrow", context) !== "scissors") throw new Error("双方出拳后没有揭晓加入者拳型。");
if (vm.runInContext("state.winner", context) !== "player") throw new Error("双方出拳后没有正确进入房主行动回合。");

console.log("online fairness test passed");