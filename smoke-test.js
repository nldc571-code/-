const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  const listeners = {};
  const classes = new Set();
  return {
    dataset: {},
    disabled: false,
    textContent: "",
    innerHTML: "",
    className: "",
    classList: {
      add(name) {
        classes.add(name);
      },
      remove(name) {
        classes.delete(name);
      },
      toggle(name, force) {
        if (force) classes.add(name);
        else classes.delete(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
    append() {},
    appendChild() {},
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    click() {
      if (listeners.click) listeners.click();
    },
  };
}

const ids = [
  "resetBtn",
  "roundResult",
  "playerThrow",
  "computerThrow",
  "playerState",
  "computerState",
  "playerLocation",
  "computerLocation",
  "playerHp",
  "computerHp",
  "playerSkill",
  "computerSkill",
  "playerCard",
  "computerCard",
  "turnHint",
  "actionHint",
  "mapGrid",
  "actions",
  "logList",
];

const elements = Object.fromEntries(ids.map((id) => [`#${id}`, createElement()]));
const throwButtons = ["rock", "scissors", "paper"].map((choice) => {
  const button = createElement();
  button.dataset.throw = choice;
  return button;
});

const document = {
  querySelector(selector) {
    return elements[selector] || createElement();
  },
  querySelectorAll(selector) {
    return selector === ".throw-button" ? throwButtons : [];
  },
  createElement,
};

const context = {
  console,
  document,
  setTimeout(handler) {
    handler();
  },
};

vm.createContext(context);
vm.runInContext(fs.readFileSync("game.js", "utf8"), context);
throwButtons[0].click();

if (!elements["#roundResult"].textContent) {
  throw new Error("回合结果没有渲染。");
}

if (!elements["#playerHp"].textContent.includes("3")) {
  throw new Error("玩家生命没有渲染。");
}

console.log("smoke test passed");
