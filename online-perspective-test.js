const fs = require("node:fs");
const vm = require("node:vm");
function createElement(){const listeners={};const children=[];return{dataset:{},disabled:false,textContent:"",innerHTML:"",className:"",title:"",value:"",classList:{toggle(){},add(){},remove(){},contains(){return false}},append(...n){children.push(...n)},appendChild(n){children.push(n)},addEventListener(t,h){listeners[t]=h},click(){if(listeners.click)listeners.click()},get children(){return children}}}
const ids=["resetBtn","roundResult","playerThrow","computerThrow","playerState","computerState","playerLocation","computerLocation","playerHp","computerHp","playerSkill","computerSkill","playerCard","computerCard","turnHint","actionHint","mapGrid","actions","logList","onlineStatus","hostBtn","joinBtn","applyCodeBtn","offlineBtn","localCode","remoteCode"];
const elements=Object.fromEntries(ids.map(id=>[`#${id}`,createElement()]));
elements["#playerCard h2"]=createElement();
elements["#computerCard h2"]=createElement();
const throwButtons=["rock","scissors","paper"].map(choice=>{const b=createElement();b.dataset.throw=choice;return b});
const document={querySelector:s=>elements[s]||createElement(),querySelectorAll:s=>s===".throw-button"?throwButtons:[],createElement};
const context={console,document,setTimeout(fn){fn()},window:{location:{hostname:"localhost",port:"8787"}},WebSocket:{OPEN:1}};
vm.createContext(context);
vm.runInContext(fs.readFileSync("game.js","utf8"),context);
vm.runInContext(`
gameMode="online";
localActorId="computer";
isHost=false;
state.actors.player.name="房主";
state.actors.computer.name="加入者";
state.actors.computer.asleep=false;
state.actors.computer.location="armory";
state.phase="action";
state.winner="computer";
render();
`,context);
if(elements["#playerCard h2"].textContent !== "你（加入者）") throw new Error("加入者没有显示在左边。")
if(elements["#computerCard h2"].textContent !== "对方（房主）") throw new Error("房主没有显示在右边。")
const actionsText=elements["#actions"].children.map(n=>n.innerHTML).join("\n");
if(!actionsText.includes("拿刀")) throw new Error("加入者赢后行动栏没有读取加入者自己的行动。")
console.log("online perspective test passed");
