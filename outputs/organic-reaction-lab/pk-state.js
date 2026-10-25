import {EXIT_QUESTIONS,COURSE_CASES} from './course-content.js';

export function createRoom(id, size = 3) {
  if (!/^[A-Z0-9]{6,12}$/.test(id) || !Number.isInteger(size) || size < 1 || size > 6) throw new Error('房間或隊伍人數不符。');
  return {version:1,id,size,round:0,phase:'lobby',revision:0,seats:['A','B'].flatMap(team=>Array.from({length:size},(_,i)=>`${team}${i+1}`)),seen:{},individual:{},consensus:{},corrections:{},exits:{},createdAt:new Date().toISOString()};
}

export function transition(room, action) {
  if (!validRoom(room)) throw new Error('房間資料損毀，請返回教室建立新房間；原紀錄仍保留。');
  const r=structuredClone(room),n=r.round;
  const need=(ok,message)=>{if(!ok)throw new Error(message);};
  const phase=p=>need(r.phase===p,'目前階段不能執行這個動作，請等待教師。');
  const report=()=>{
    need(action.report&&Number.isFinite(action.report.score)&&action.report.score>=0&&action.report.score<=100,'提交的分數資料不符。');
    need(JSON.stringify(action.report).length<=100000,'作答內容過長。');
    return {...structuredClone(action.report),submittedAt:new Date().toISOString()};
  };
  switch(action.type){
    case 'start':phase('lobby');r.phase='demo';break;
    case 'seen':phase('demo');need(r.seats.includes(action.seat),'座位不存在。');(r.seen[n]||={})[action.seat]=true;break;
    case 'individual':phase('demo');need(r.seats.every(s=>r.seen[n]?.[s]),'請等所有學生看完示範並確認。');r.phase='individual';break;
    case 'submit':{
      phase('individual');need(r.seats.includes(action.seat),'座位不存在。');
      const bucket=r.individual[n]||={};if(bucket[action.seat])return room;
      bucket[action.seat]=report();break;
    }
    case 'consensus':phase('individual');need(r.seats.every(s=>r.individual[n]?.[s]),'請等所有學生提交個人首次答案。');r.phase='consensus';break;
    case 'team':{
      phase('consensus');need(['A1','B1'].includes(action.seat),'由各隊 1 號代表提交共識。');
      const team=action.seat[0],bucket=r.consensus[n]||={};if(bucket[team])return room;
      bucket[team]=report();break;
    }
    case 'reveal':phase('consensus');need(['A','B'].every(t=>r.consensus[n]?.[t]),'兩隊都提交共識後才能揭曉。');r.phase='reveal';break;
    case 'correct':need(['reveal','finished'].includes(r.phase),'揭曉後才能保存修正。');need(r.seats.includes(action.seat),'座位不存在。');(r.corrections[n]||={})[action.seat]=report();break;
    case 'next':phase('reveal');if(n===5)r.phase='finished';else{r.round++;r.phase='demo';}break;
    case 'exit':{
      phase('finished');need(r.seats.includes(action.seat),'座位不存在。');r.exits ||= {};if(r.exits[action.seat])return room;
      need(action.answers&&EXIT_QUESTIONS.every((q,i)=>Number.isInteger(action.answers[i])&&action.answers[i]>=0&&action.answers[i]<q.options.length),'出口題尚未完成。');
      r.exits[action.seat]={answers:structuredClone(action.answers),score:EXIT_QUESTIONS.filter((q,i)=>q.answer===action.answers[i]).length,time:new Date().toISOString()};break;
    }
    default:throw new Error('不支援的教室動作。');
  }
  r.revision++;return r;
}

export function validRoom(r){
  return Boolean(r&&r.version===1&&/^[A-Z0-9]{6,12}$/.test(r.id)&&Number.isInteger(r.size)&&r.size>=1&&r.size<=6&&Number.isInteger(r.round)&&r.round>=0&&r.round<6&&['lobby','demo','individual','consensus','reveal','finished'].includes(r.phase)&&Number.isInteger(r.revision)&&Array.isArray(r.seats)&&r.seats.join(',')===['A','B'].flatMap(t=>Array.from({length:r.size},(_,i)=>`${t}${i+1}`)).join(',')&&['seen','individual','consensus','corrections'].every(k=>r[k]&&typeof r[k]==='object'&&!Array.isArray(r[k])));
}

export function teamScore(room,round,team){
  const seats=room.seats.filter(s=>s[0]===team),individual=seats.map(s=>room.individual[round]?.[s]);
  const consensus=room.consensus[round]?.[team];
  if(individual.some(s=>!s)||!consensus)return null;
  const average=individual.reduce((sum,r)=>sum+r.score,0)/seats.length;
  return {individual:average,consensus:consensus.score,total:Math.round((average*.6+consensus.score*.4)*100)/100};
}

export function roomTotals(room){
  const last=room.phase==='reveal'||room.phase==='finished'?room.round:room.round-1;
  return ['A','B'].map(team=>({team,total:Math.round(Array.from({length:last+1},(_,i)=>teamScore(room,i,team)?.total||0).reduce((a,b)=>a+b,0)*100)/100}));
}

const KEY='organic-pk-v1:';
function validateStored(value){
 if(!validRoom(value)||typeof value.createdAt!=='string')throw new Error('房間格式不符；原資料保留，請建立新房間。');
 for(const key of ['individual','consensus','corrections'])for(const[index,bucket]of Object.entries(value[key])){
  const c=COURSE_CASES[Number(index)];if(!c||!bucket||typeof bucket!=='object')throw new Error('回合紀錄格式不符；原資料保留。');
  for(const report of Object.values(bucket))if(!report||!Number.isFinite(report.score)||!report.dimensions||!report.evidence?.answers||!c.questions.every((q,i)=>Number.isInteger(report.evidence.answers[i])&&report.evidence.answers[i]>=0&&report.evidence.answers[i]<q.options.length))throw new Error('作答紀錄不完整；原資料保留，請建立新教室。');
 }
 return value;
}

// Compatibility mirror for older preview rooms. New mutations use IndexedDB only.
export function readRoom(id){
 const raw=localStorage.getItem(KEY+id);if(!raw)return null;
 let value;try{value=JSON.parse(raw);}catch{throw new Error('房間資料無法讀取；原紀錄保留，請建立新房間。');}
 return validateStored(value);
}
let databasePromise=null;
function database(){
 if(databasePromise)return databasePromise;
 databasePromise=new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(new Error('此瀏覽器無法使用本機教室資料庫，請允許網站儲存後重試。'));return;}
  const request=indexedDB.open('organic-reaction-pk-v1',1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('rooms'))request.result.createObjectStore('rooms',{keyPath:'id'});};
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();databasePromise=null;};resolve(db);};
  request.onerror=()=>{databasePromise=null;reject(new Error('無法開啟本機教室資料庫，請允許網站儲存後重試。'));};
  request.onblocked=()=>{databasePromise=null;reject(new Error('資料庫更新被舊分頁阻擋，請關閉舊版教室後重試。'));};
 });
 return databasePromise;
}
function storageAvailable(){
 try{localStorage.setItem(KEY+'probe','1');localStorage.removeItem(KEY+'probe');}
 catch{throw new Error('本機儲存不可用或空間不足；提交未完成，請保留分頁並允許網站儲存後重試。');}
}
function publish(room){
 // The mirror and notification are expendable; the transaction is authoritative.
 try{localStorage.setItem(KEY+room.id,JSON.stringify(room));}catch{}
 if(typeof BroadcastChannel!=='undefined'){const channel=new BroadcastChannel('organic-pk-v1');channel.postMessage({id:room.id,revision:room.revision});channel.close();}
}
export async function loadRoom(id){
 const db=await database();
 const stored=await new Promise((resolve,reject)=>{const tx=db.transaction('rooms','readonly'),request=tx.objectStore('rooms').get(id);request.onsuccess=()=>resolve(request.result||null);request.onerror=()=>reject(new Error('無法讀取教室紀錄，請重試。'));});
 if(stored)return validateStored(stored);
 const legacy=readRoom(id);if(!legacy)return null;
 // Migrate an existing local preview room once, under the same transaction lock.
 return new Promise((resolve,reject)=>{const tx=db.transaction('rooms','readwrite'),store=tx.objectStore('rooms'),request=store.get(id);let room;
  request.onsuccess=()=>{room=request.result||legacy;if(!request.result)store.put(room);};tx.oncomplete=()=>resolve(validateStored(room));tx.onerror=tx.onabort=()=>reject(new Error('無法接續舊教室，原資料仍保留。'));
 });
}
export async function listRooms(){
 const db=await database(),stored=await new Promise((resolve,reject)=>{const tx=db.transaction('rooms','readonly'),request=tx.objectStore('rooms').getAll();request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error('無法讀取教室清單。'));});
 const rooms=new Map(stored.filter(validRoom).map(r=>[r.id,r]));
 for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i);if(!key.startsWith(KEY)||key===KEY+'probe')continue;const id=key.slice(KEY.length);if(rooms.has(id))continue;try{const legacy=readRoom(id);if(legacy)rooms.set(id,legacy);}catch{}}
 return [...rooms.values()].sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
}
export async function writeRoom(id,action,{size=3,create=false}={}){
 storageAvailable();const db=await database();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('rooms','readwrite'),store=tx.objectStore('rooms'),request=store.get(id);let result,failure;
  request.onsuccess=()=>{
   try{
    const current=request.result||readRoom(id);
    if(create){if(current)throw new Error('房間代碼已存在，請重試。');result=createRoom(id,size);}
    else{if(!current)throw new Error('找不到房間，請由教師重新開啟。');result=transition(current,action);}
    store.put(result);
   }catch(error){failure=error;tx.abort();}
  };
  tx.oncomplete=()=>{publish(result);resolve(result);};
  tx.onerror=tx.onabort=()=>reject(failure||new Error('教室資料交易未完成，請保留分頁並重試；首次紀錄不會重複計分。'));
 });
}
