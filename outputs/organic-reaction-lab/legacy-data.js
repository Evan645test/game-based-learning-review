// The progressive path replaces every earlier course, assessment and PK record (user decision, 2026-10-26).
export const DATA_VERSION_KEY='organic-data-version',DATA_VERSION='3',PK_DATABASE='organic-reaction-pk-v1';
export function clearLegacyData(storages,deleteDatabase=()=>{}){
 let local=null;try{local=storages[0];if(local.getItem(DATA_VERSION_KEY)===DATA_VERSION)return false;}catch{return false;}
 for(const s of storages){try{const keys=[];for(let i=0;i<s.length;i++){const k=s.key(i);if(k?.startsWith('organic-'))keys.push(k);}keys.forEach(k=>s.removeItem(k));}catch{}}
 try{deleteDatabase(PK_DATABASE);}catch{}
 try{local.setItem(DATA_VERSION_KEY,DATA_VERSION);}catch{}
 return true;
}
