// The book map (v5) replaces every earlier course, assessment and PK record (user decision, 2026-10-26).
export const DATA_VERSION_KEY='organic-data-version',DATA_VERSION='5',PK_DATABASE='organic-reaction-pk-v1';
export const RESET_SIGNAL_KEY='organic-reset-generation';

// Explicit user reset; unlike the one-time migration, failures must reach the caller.
export async function resetBrowserData(storages,deleteDatabase){
 if(!Array.isArray(storages)||!storages.length||storages.some(s=>!s))throw new Error('無法存取瀏覽器儲存區，請允許此網站儲存資料後再試。');
 let areas;
 try{
  areas=storages.map(storage=>{
   const keys=[];
   for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith('organic-')&&key!==DATA_VERSION_KEY&&key!==RESET_SIGNAL_KEY)keys.push(key);}
   return {storage,keys};
  });
 }catch{throw new Error('無法存取瀏覽器儲存區，尚未清除紀錄。');}
 await deleteDatabase(PK_DATABASE);
 let failed=false;
 for(const {storage,keys} of areas)for(const key of keys){try{storage.removeItem(key);if(storage.getItem(key)!==null)failed=true;}catch{failed=true;}}
 if(failed)throw new Error('紀錄未能完整清除；請檢查此網站的儲存權限，再按確認清空重試。');
 try{storages[0].setItem(DATA_VERSION_KEY,DATA_VERSION);storages[0].setItem(RESET_SIGNAL_KEY,crypto.randomUUID());}
 catch{throw new Error('紀錄已移除，但無法保存重設狀態；請檢查儲存權限後重試。');}
}

export function clearLegacyData(storages,deleteDatabase=()=>{}){
 let local=null;try{local=storages[0];if(local.getItem(DATA_VERSION_KEY)===DATA_VERSION)return false;}catch{return false;}
 for(const s of storages){try{const keys=[];for(let i=0;i<s.length;i++){const k=s.key(i);if(k?.startsWith('organic-'))keys.push(k);}keys.forEach(k=>s.removeItem(k));}catch{}}
 try{deleteDatabase(PK_DATABASE);}catch{}
 try{local.setItem(DATA_VERSION_KEY,DATA_VERSION);}catch{}
 return true;
}
