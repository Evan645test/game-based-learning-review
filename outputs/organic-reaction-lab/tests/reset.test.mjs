import test from 'node:test';
import assert from 'node:assert/strict';
import * as data from '../legacy-data.js';

class StorageArea {
 constructor(entries={}){this.values=new Map(Object.entries(entries));}
 get length(){return this.values.size;}
 key(index){return [...this.values.keys()][index]??null;}
 getItem(key){return this.values.get(key)??null;}
 setItem(key,value){this.values.set(key,String(value));}
 removeItem(key){this.values.delete(key);}
}

test('清空只移除本工具的課程、草稿、評量、觀看與舊紀錄，保留其他網站資料',async()=>{
 assert.equal(typeof data.resetBrowserData,'function','提供明確的學習紀錄清空操作');
 const local=new StorageArea({'organic-data-version':'3','organic-path-v3':'progress','organic-assessment-v3:draft':'draft','organic-assessment-v3:attempt:a':'exam','organic-demo-view-v3:sn2':'view','organic-course-v1':'old','unrelated':'keep'}),session=new StorageArea({'organic-pk-v1:x':'old','unrelated-session':'keep'}),deleted=[];
 await data.resetBrowserData([local,session],async name=>deleted.push(name));
 assert.deepEqual(deleted,[data.PK_DATABASE]);
 for(const key of ['organic-path-v3','organic-assessment-v3:draft','organic-assessment-v3:attempt:a','organic-demo-view-v3:sn2','organic-course-v1'])assert.equal(local.getItem(key),null,key);
 assert.equal(local.getItem('unrelated'),'keep');assert.equal(session.getItem('unrelated-session'),'keep');assert.equal(session.getItem('organic-pk-v1:x'),null);
 assert.equal(local.getItem(data.DATA_VERSION_KEY),data.DATA_VERSION);assert.ok(local.getItem(data.RESET_SIGNAL_KEY));
});

test('資料庫被其他頁面占用時不先刪除課程紀錄，也不發出清空完成通知',async()=>{
 assert.equal(typeof data.resetBrowserData,'function');
 const local=new StorageArea({'organic-path-v3':'progress'}),session=new StorageArea();
 await assert.rejects(data.resetBrowserData([local,session],async()=>{throw new Error('請關閉其他分頁');}),/其他分頁/);
 assert.equal(local.getItem('organic-path-v3'),'progress');assert.equal(local.getItem(data.RESET_SIGNAL_KEY),null);
});

test('儲存區讀取或刪除受阻時回報失敗，不宣稱已清空',async()=>{
 assert.equal(typeof data.resetBrowserData,'function');
 const local=new StorageArea({'organic-path-v3':'progress'}),session=new StorageArea();local.removeItem=()=>{throw new Error('denied');};
 await assert.rejects(data.resetBrowserData([local,session],async()=>{}),/未能完整清除/);
 assert.equal(local.getItem('organic-path-v3'),'progress');assert.equal(local.getItem(data.RESET_SIGNAL_KEY),null);
 await assert.rejects(data.resetBrowserData([],async()=>{}),/無法存取/);
});
