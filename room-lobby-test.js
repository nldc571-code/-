const fs = require("node:fs");
const vm = require("node:vm");

function createElement() {
  const listeners = {};
  const children = [];
  let html = "";
  const element = {
    dataset: {}, disabled: false, textContent: "", className: "", title: "", value: "",
    classList: { add(){}, remove(){}, toggle(){}, contains(){ return false; } },
    append(...nodes){ children.push(...nodes); }, appendChild(node){ children.push(node); },
    addEventListener(type, handler){ listeners[type] = handler; }, click(){ if (listeners.click) listeners.click(); },
    get children(){ return children; }, select(){}, remove(){},
  };
  Object.defineProperty(element, "innerHTML", {
    get(){ return html; },
    set(value){ html = value; children.length = 0; },
  });
  return element;
}

const ids = [
  "resetBtn", "roundResult", "playerThrow", "computerThrow", "playerState", "computerState",
  "playerLocation", "computerLocation", "playerHp", "computerHp", "playerSkill", "computerSkill",
  "playerCard", "computerCard", "turnHint", "actionHint", "mapGrid", "actions", "logList",
  "onlineStatus", "hostBtn", "joinBtn", "applyCodeBtn", "offlineBtn", "localCode", "remoteCode",
  "startScreen", "modeScreen", "gameShell", "roomShell", "startGameBtn", "modeBackBtn", "singleModeBtn",
  "teamModeBtn", "chaosModeBtn", "gameModeBtn", "roomBackBtn", "roomToHomeBtn", "roomCreateBtn",
  "roomJoinBtn", "roomCopyBtn", "roomAddBotBtn", "roomStartBtn", "roomLocalCode", "roomRemoteCode",
  "roomStatus", "roomSlots", "roomMap", "roomMapHint", "roomModeLabel", "roomTitle", "roomHint", "feedbackLayer",
];
const elements = Object.fromEntries(ids.map((id) => [`#${id}`, createElement()]));
elements["#playerCard h2"] = createElement();
elements["#computerCard h2"] = createElement();
const throwButtons = ["rock", "scissors", "paper"].map((choice) => { const button = createElement(); button.dataset.throw = choice; return button; });
const document = { querySelector: (selector) => elements[selector] || createElement(), querySelectorAll: (selector) => selector === ".throw-button" ? throwButtons : [], createElement };
const context = { console, document, setTimeout(fn){ fn(); }, window: { location: { hostname: "localhost", port: "8787" } }, navigator: { clipboard: { writeText(){} } }, WebSocket: { OPEN: 1 } };

vm.createContext(context);
vm.runInContext(fs.readFileSync("game.js", "utf8"), context);
vm.runInContext(`
openModeRoom("team");
applyRoomState({
  code: "ABCD",
  mode: "team",
  maxPlayers: 6,
  started: false,
  players: [
    { id: "p1", name: "房主", role: "host", team: "A", bot: false },
    { id: "bot1", name: "人机 2", role: "bot", team: "B", bot: true }
  ]
});
roomPlayerId = "p1";
renderRoomLobby();
`, context);

if (elements["#roomTitle"].textContent !== "3v3 阵营房间") throw new Error("阵营房间标题错误。")
if (elements["#roomLocalCode"].value !== "ABCD") throw new Error("房间码没有显示。")
if (elements["#roomSlots"].children.length !== 6) throw new Error("阵营模式不是 6 个槽位。")
const slotText = elements["#roomSlots"].children.map((node) => node.innerHTML).join("\n");
if (!slotText.includes("人机 2")) throw new Error("人机槽位没有显示。")

const teamEdges = vm.runInContext("roomMapConfigs.team.edges.map(edge => edge.join('-')).sort()", context);
const expectedEdges = [
  "airBase-wild",
  "blueHome-airBase",
  "blueHome-armory",
  "redHome-armory",
  "redHome-tankBase",
  "tankBase-wild",
  "wild-armory",
  "tankBase-medBay",
  "medBay-wild",
  "airBase-radar",
  "radar-wild",
].sort();
if (JSON.stringify(teamEdges) !== JSON.stringify(expectedEdges)) {
  throw new Error(`阵营地图连接关系错误：${teamEdges.join(",")}`);
}
if (elements["#roomMapHint"].textContent.trim() !== "") throw new Error("阵营地图说明文字没有被删除。")
if (elements["#roomMap"].children.filter((node) => node.className.includes("room-map-node")).length !== 8) throw new Error("阵营地图节点数量不是 8。")
const mapText = elements["#roomMap"].children.filter((node) => node.className.includes("room-map-node")).map((node) => node.innerHTML).join("\n");
for (const word of ["红队房间", "蓝队房间", "军火库", "坦克基地", "飞机基地", "野外", "医疗站", "雷达站"]) {
  if (!mapText.includes(word)) throw new Error(`阵营地图没有显示 ${word}`);
}

vm.runInContext(`openModeRoom("chaos");`, context);
if (elements["#roomTitle"].textContent !== "五人乱战房间") throw new Error("乱战房间标题错误。")
if (elements["#roomSlots"].children.length !== 5) throw new Error("乱战模式不是 5 个槽位。")

console.log("room lobby test passed");