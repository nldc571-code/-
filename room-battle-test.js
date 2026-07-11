const fs = require("node:fs");
const vm = require("node:vm");
function createElement(){const listeners={};const children=[];let html="";const el={dataset:{},disabled:false,textContent:"",className:"",title:"",value:"",classList:{add(){},remove(){},toggle(){},contains(){return false}},append(...n){children.push(...n)},appendChild(n){children.push(n)},addEventListener(t,h){listeners[t]=h},click(){if(listeners.click)listeners.click()},get children(){return children},select(){},remove(){}};Object.defineProperty(el,"innerHTML",{get(){return html},set(v){html=v;children.length=0}});return el}
const ids=["resetBtn","roundResult","playerThrow","computerThrow","playerState","computerState","playerLocation","computerLocation","playerHp","computerHp","playerSkill","computerSkill","playerCard","computerCard","turnHint","actionHint","mapGrid","actions","logList","onlineStatus","hostBtn","joinBtn","applyCodeBtn","offlineBtn","localCode","remoteCode","startScreen","modeScreen","gameShell","roomShell","startGameBtn","modeBackBtn","singleModeBtn","teamModeBtn","chaosModeBtn","gameModeBtn","roomBackBtn","roomToHomeBtn","roomCreateBtn","roomJoinBtn","roomCopyBtn","roomAddBotBtn","roomStartBtn","roomLocalCode","roomRemoteCode","roomStatus","roomSlots","roomMap","roomMapLinks","roomMapHint","roomBattlePanel","roomBattleStatus","roomThrowButtons","roomActionButtons","roomBattleLog","roomModeLabel","roomTitle","roomHint","feedbackLayer"];
const elements=Object.fromEntries(ids.map(id=>[`#${id}`,createElement()]));
elements["#playerCard h2"]=createElement();elements["#computerCard h2"]=createElement();
const throwButtons=["rock","scissors","paper"].map(choice=>{const b=createElement();b.dataset.throw=choice;return b});
const document={querySelector:s=>elements[s]||createElement(),querySelectorAll:s=>s===".throw-button"?throwButtons:[],createElement};
const context={console,document,setTimeout(fn){fn()},window:{location:{hostname:"localhost",port:"8787"}},navigator:{clipboard:{writeText(){}}},WebSocket:{OPEN:1}};
vm.createContext(context);
vm.runInContext(fs.readFileSync("game.js","utf8"),context);
vm.runInContext(`
gameMode="room"; roomMode="team"; roomIsHost=true; roomPlayerId="p1";
roomState={code:"T123",mode:"team",maxPlayers:3,started:true,players:[
  {id:"p1",name:"房主",role:"host",team:"A",bot:false},
  {id:"p2",name:"队友",role:"guest",team:"A",bot:false},
  {id:"p3",name:"敌人",role:"guest",team:"B",bot:false}
]};
roomBattle=createRoomBattle(roomState);
getRoomPlayer("p2").inventory.knife=true;
roomBattle.throws={p1:"rock",p2:"rock",p3:"scissors"};
resolveRoomDuelIfReady();
`,context);
const queue=vm.runInContext("roomBattle.actionQueue",context);
if(queue[0]!=="p2") throw new Error("有刀玩家没有优先行动。")
if(vm.runInContext("roomBattle.phase",context)!=="action") throw new Error("多人出拳后没有进入行动阶段。")
vm.runInContext(`runRoomAction("p2", {id:"wake", label:"起床"});`,context);
if(vm.runInContext("getRoomPlayer('p2').asleep",context)!==false) throw new Error("多人行动没有生效。")

vm.runInContext(`
roomBattle=createRoomBattle(roomState);
roomPlayerId="";
ensureRoomPlayerId();
`, context);
if (vm.runInContext("roomPlayerId", context) !== "p1") throw new Error("房主没有被匹配为本地玩家。")

vm.runInContext(`
roomBattle=createRoomBattle(roomState);
roomBattle.throws={p1:"rock",p2:"scissors",p3:"paper"};
resolveRoomDuelIfReady();
`, context);
if (vm.runInContext("roomBattle.phase", context) !== "duel") throw new Error("三种拳同时出现时不应进入行动阶段。")
if (vm.runInContext("roomBattle.round", context) !== 2) throw new Error("三种拳平局后没有进入下一回合。")
if (!vm.runInContext("roomBattle.log[0].includes('锤子、剪刀、布同时出现')", context)) throw new Error("三种拳平局原因没有写入日志。")

vm.runInContext(`
roomBattle=createRoomBattle(roomState);
const host=getRoomPlayer("p1");
const teammate=getRoomPlayer("p2");
const enemy=getRoomPlayer("p3");
host.asleep=false; teammate.asleep=false; enemy.asleep=false;
host.hp=1;
host.location=teammate.location=enemy.location="wild";
roomBattle.phase="action";
roomBattle.actionQueue=["p3","p1","p2"];
roomBattle.currentActorId="p3";
runRoomAction("p3", {id:"attack", targetId:"p1", label:"攻击房主"});
`, context);
if (vm.runInContext("getRoomPlayer('p1').dead", context) !== true) throw new Error("房主没有被判定为阵亡。")
if (vm.runInContext("roomBattle.currentActorId", context) !== "p2") throw new Error("房主阵亡后没有跳过其行动队列。")
if (vm.runInContext("roomBattle.gameOver", context) !== false) throw new Error("房主阵亡后不应直接结束游戏。")
if (!vm.runInContext("roomBattle.log[0].includes('被淘汰')", context)) throw new Error("玩家被淘汰时没有清晰的战斗日志。")

vm.runInContext(`
roomBattle=createRoomBattle({code:"X777",mode:"team",maxPlayers:3,players:[
  {id:"p1",name:"侦察",role:"host",team:"A",bot:false,character:"scout"},
  {id:"p2",name:"医疗",role:"guest",team:"A",bot:false,character:"medic"},
  {id:"p3",name:"先锋",role:"guest",team:"B",bot:false,character:"vanguard"}
]});
const scout=getRoomPlayer("p1");
const medic=getRoomPlayer("p2");
const vanguard=getRoomPlayer("p3");
scout.asleep=false;
roomBattle.phase="action"; roomBattle.currentActorId="p1"; roomBattle.actionQueue=["p1"];
`, context);
if (vm.runInContext("getRoomPlayer('p3').maxHp", context) !== 4) throw new Error("先锋没有获得额外生命上限。")
if (!vm.runInContext("getRoomActions('p1').some(action => action.to === 'airBase')", context)) throw new Error("侦察兵不能疾行到任意地图节点。")
vm.runInContext(`
medic.asleep=false; medic.hp=1; medic.inventory.medkit=true;
roomBattle.phase="action"; roomBattle.currentActorId="p2"; roomBattle.actionQueue=["p2"];
runRoomAction("p2", {id:"useMedkit", label:"使用医疗包"});
`, context);
if (vm.runInContext("getRoomPlayer('p2').hp", context) !== 2) throw new Error("医疗兵使用医疗包没有恢复 2 点生命。")
vm.runInContext(`
roomBattle=createRoomBattle({code:"X778",mode:"team",maxPlayers:3,players:[
  {id:"p1",name:"侦察",role:"host",team:"A",bot:false,character:"scout"},
  {id:"p2",name:"医疗",role:"guest",team:"A",bot:false,character:"medic"},
  {id:"p3",name:"先锋",role:"guest",team:"B",bot:false,character:"vanguard"}
]});
const smokeTarget=getRoomPlayer("p1");
const smokeAttacker=getRoomPlayer("p3");
smokeTarget.asleep=false; smokeAttacker.asleep=false;
smokeTarget.location=smokeAttacker.location="wild";
smokeTarget.smoke=true;
roomBattle.phase="action"; roomBattle.currentActorId="p3"; roomBattle.actionQueue=["p3"];
runRoomAction("p3", {id:"attack", targetId:"p1", label:"攻击侦察"});
`, context);
if (vm.runInContext("getRoomPlayer('p1').hp", context) !== 3 || vm.runInContext("getRoomPlayer('p1').smoke", context) !== false) throw new Error("烟雾弹没有挡住一次攻击。")

vm.runInContext(`
roomBattle=createRoomBattle({code:"X779",mode:"team",maxPlayers:3,players:[
  {id:"p1",name:"Scout",role:"host",team:"A",bot:false,character:"scout"},
  {id:"p2",name:"Medic",role:"guest",team:"A",bot:false,character:"medic"},
  {id:"p3",name:"Vanguard",role:"guest",team:"B",bot:false,character:"vanguard"},
  {id:"p4",name:"Ally",role:"guest",team:"B",bot:false,character:"scout"}
]});
const pulseTarget=getRoomPlayer("p1");
const pulseVanguard=getRoomPlayer("p3");
const pulseAlly=getRoomPlayer("p4");
pulseTarget.asleep=false; pulseVanguard.asleep=false; pulseAlly.asleep=false;
pulseTarget.location=pulseAlly.location="armory"; pulseVanguard.location="wild";
roomBattle.phase="action"; roomBattle.currentActorId="p3"; roomBattle.actionQueue=["p3","p4"];
runRoomAction("p3", getRoomActions("p3").find((action) => action.id === "vanguardPulse"));
`, context);
if (vm.runInContext("getRoomPlayer('p3').vanguardPulseUsed", context) !== true || vm.runInContext("getRoomPlayer('p3').vanguardPulseArmed", context) !== true) throw new Error("Vanguard pulse did not arm.");
if (vm.runInContext("getRoomPlayer('p1').hp", context) !== 3) throw new Error("Vanguard pulse fired too early.");
vm.runInContext("triggerVanguardPulses();", context);
if (vm.runInContext("getRoomPlayer('p1').hp", context) !== 1 || vm.runInContext("getRoomPlayer('p4').hp", context) !== 1) throw new Error("Vanguard pulse did not hit every adjacent player.");

vm.runInContext(`
roomBattle=createRoomBattle({code:"X780",mode:"team",maxPlayers:3,players:[
  {id:"p1",name:"Scout",role:"host",team:"A",bot:false,character:"scout"},
  {id:"p2",name:"Medic",role:"guest",team:"A",bot:false,character:"medic"},
  {id:"p3",name:"Vanguard",role:"guest",team:"B",bot:false,character:"vanguard"}
]});
const aidTarget=getRoomPlayer("p1");
const aidMedic=getRoomPlayer("p2");
aidTarget.asleep=false; aidMedic.asleep=false;
aidTarget.hp=1; aidTarget.location="wild"; aidMedic.location="redHome";
roomBattle.phase="action"; roomBattle.currentActorId="p2"; roomBattle.actionQueue=["p2"];
runRoomAction("p2", getRoomActions("p2").find((action) => action.id === "medicHeal" && action.targetId === "p1"));
`, context);
if (vm.runInContext("getRoomPlayer('p1').hp", context) !== 2) throw new Error("Medic remote heal did not restore one health.");

vm.runInContext(`
roomBattle=createRoomBattle({code:"X781",mode:"team",maxPlayers:3,players:[
  {id:"p1",name:"Scout",role:"host",team:"A",bot:false,character:"scout"},
  {id:"p2",name:"Medic",role:"guest",team:"A",bot:false,character:"medic"},
  {id:"p3",name:"Vanguard",role:"guest",team:"B",bot:false,character:"vanguard"}
]});
const kitScout=getRoomPlayer("p1");
const kitMedic=getRoomPlayer("p2");
kitScout.asleep=false; kitMedic.asleep=false; kitScout.location=kitMedic.location="medBay";
roomBattle.phase="action"; roomBattle.currentActorId="p2"; roomBattle.actionQueue=["p2"];
runRoomAction("p2", getRoomActions("p2").find((action) => action.id === "take" && action.item === "medkit"));
roomBattle.phase="action"; roomBattle.currentActorId="p2";
`, context);
if (vm.runInContext("getRoomPlayer('p2').inventory.medkit", context) !== 2 || vm.runInContext("getRoomPlayer('p2').medkitTaken", context) !== 2) throw new Error("Medic did not receive the second medkit.");
if (vm.runInContext("getRoomActions('p2').some(action => action.id === 'take' && action.item === 'medkit')", context)) throw new Error("Medic exceeded the two-medkit cap.");
vm.runInContext(`
roomBattle.phase="action"; roomBattle.currentActorId="p1"; roomBattle.actionQueue=["p1"];
kitScout.medkitTaken=1;
`, context);
if (vm.runInContext("getRoomActions('p1').some(action => action.id === 'take' && action.item === 'medkit')", context)) throw new Error("A normal player exceeded the one-medkit cap.");

console.log("room battle test passed");