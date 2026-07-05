const fs = require("node:fs");
const vm = require("node:vm");
function createElement(){const listeners={};return{dataset:{},disabled:false,textContent:"",innerHTML:"",className:"",title:"",value:"",classList:{toggle(){},add(){},remove(){},contains(){return false}},append(){},appendChild(){},addEventListener(t,h){listeners[t]=h},click(){if(listeners.click)listeners.click()}}}
const ids=["resetBtn","roundResult","playerThrow","computerThrow","playerState","computerState","playerLocation","computerLocation","playerHp","computerHp","playerSkill","computerSkill","playerCard","computerCard","turnHint","actionHint","mapGrid","actions","logList","onlineStatus","hostBtn","joinBtn","applyCodeBtn","offlineBtn","localCode","remoteCode"];
const elements=Object.fromEntries(ids.map(id=>[`#${id}`,createElement()]));
const throwButtons=["rock","scissors","paper"].map(choice=>{const b=createElement();b.dataset.throw=choice;return b});
const document={querySelector:s=>elements[s]||createElement(),querySelectorAll:s=>s===".throw-button"?throwButtons:[],createElement};
const context={console,document,setTimeout(fn){fn()},btoa:s=>Buffer.from(s,"binary").toString("base64"),atob:s=>Buffer.from(s,"base64").toString("binary")};
vm.createContext(context);
vm.runInContext(fs.readFileSync("game.js","utf8"),context);
vm.runInContext(`
state.actors.player.asleep=false;
state.actors.computer.asleep=false;
state.actors.player.inventory.shield=true;
state.actors.player.inventory.shieldHp=1;
state.actors.player.location="wild";
state.actors.computer.location="wild";
state.phase="action";
state.winner="computer";
`,context);
const action=vm.runInContext("chooseComputerAction()",context);
if(!action || action.id === "meleeAttack") throw new Error("电脑仍然会无刀手刀打盾。")
if(action.destination !== "armory") throw new Error("电脑没有优先去军火库找刀。")
console.log("ai test passed");
