import {mountLearningPath,pathSnapshot,PATH_KEY} from './learning-path.js';
import {createAssessmentStore} from './assessment-store.js';
import {mountAssessment} from './assessment.js';
import {glossaryHTML} from './terminology.js';
import {clearLegacyData,resetBrowserData,RESET_SIGNAL_KEY} from './legacy-data.js';

const main=document.querySelector('#course-main'),notice=document.querySelector('#course-notice');
const artMotionKey='organic-art-motion-v1',reducedArtMotion=matchMedia('(prefers-reduced-motion: reduce)');
let artMotionPaused=false;
try{artMotionPaused=localStorage.getItem(artMotionKey)==='paused';}catch{}
function syncArtMotion(){
 const paused=artMotionPaused||reducedArtMotion.matches;document.body.dataset.artMotion=paused?'paused':'running';
 document.querySelectorAll('button[data-art-motion]').forEach(b=>{b.setAttribute('aria-pressed',String(!paused));b.setAttribute('aria-label',reducedArtMotion.matches?'已依系統設定減少環境動態':`${paused?'開啟':'暫停'}環境動態`);b.disabled=reducedArtMotion.matches;const label=b.querySelector('span');if(label)label.textContent=reducedArtMotion.matches?'減少動態':`動態：${paused?'關':'開'}`;});
}
syncArtMotion();reducedArtMotion.addEventListener('change',syncArtMotion);
document.addEventListener('click',e=>{
 if(!e.target.closest?.('button[data-art-motion]')||reducedArtMotion.matches)return;
 artMotionPaused=!artMotionPaused;try{localStorage.setItem(artMotionKey,artMotionPaused?'paused':'running');}catch{}syncArtMotion();
});
function message(text){notice.hidden=!text;notice.textContent=text;}

let storages=[];try{storages=[window.localStorage,window.sessionStorage];}catch{}
if(storages.length&&clearLegacyData(storages,name=>indexedDB.deleteDatabase(name)))message('已更新為新版學習路徑：舊的課程進度、評量與 PK 紀錄已清除。');

let assessmentStorage=null;try{assessmentStorage=window.localStorage;}catch{}
const assessmentStore=createAssessmentStore(assessmentStorage,message);
const VIEW_PREFIX='organic-demo-view-v3:',views=new Map();let viewStore=true;
function loadView(id){if(views.has(id))return views.get(id);let v=null;if(viewStore)try{const raw=localStorage.getItem(VIEW_PREFIX+id);v=raw?JSON.parse(raw):null;}catch{viewStore=false;}views.set(id,v);return v;}
function saveView(id,state){views.set(id,state);if(!viewStore)return;try{localStorage.setItem(VIEW_PREFIX+id,JSON.stringify(state));}catch{viewStore=false;}}

let child=null,view='learn',assessmentTab='post',assessmentActive=false,mode='student';
try{if(localStorage.getItem('organic-interface-v1')==='teacher')mode='teacher';}catch{}
function modeUI(){document.body.dataset.mode=mode;document.querySelectorAll('[data-mode]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.mode===mode));b.disabled=assessmentActive;});}
function setMode(next){
 if(assessmentActive){message('請先完成或提交評量，再切換模式。');return;}
 if(next===mode)return;mode=next;try{localStorage.setItem('organic-interface-v1',mode);}catch{}
 modeUI();if(view==='learn')child?.setMode(mode);else render();
}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
modeUI();
function navigate(page){if(assessmentActive){message('請先完成或提早提交目前評量，再切換內容；作答草稿已保存。');return;}if(view===page)return;view=page;const url=new URL(location.href);url.search='';url.hash=page;history.replaceState(null,'',url);render();}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));
function render(){
 child?.destroy();child=null;
 document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===view);b.setAttribute('aria-current',b.dataset.page===view?'page':'false');b.disabled=false;});
 if(view==='assess'&&mode==='teacher'){
  main.innerHTML='<section class="assessment-page teacher-assessment"><p class="course-part">教師模式</p><h1>評量由學生個別作答</h1><p>切換到學生模式後，可以開始後測、延後測，或查看本機成績。</p><button type="button" class="primary" data-assess-student>切換學生模式</button></section>';
  main.querySelector('[data-assess-student]').onclick=()=>setMode('student');return;
 }
 if(view==='assess'){main.innerHTML='<div data-assessment-host></div>';child=mountAssessment(main.querySelector('[data-assessment-host]'),{store:assessmentStore,initialTab:assessmentTab,onDone:()=>navigate('learn'),onActive:active=>{assessmentActive=active;modeUI();document.querySelectorAll('[data-page]').forEach(b=>b.disabled=active);},onNotice:message,exportAll});return;}
 main.innerHTML='<div data-learning-host></div>'+glossaryHTML();
 // The learning screen shows only its content; the course header, glossary and footer return on the map views.
 child=mountLearningPath(main.querySelector('[data-learning-host]'),{mode,onNotice:message,onAssessment:()=>{assessmentTab='post';navigate('assess');},loadView,saveView,onView:v=>{if(v)document.body.dataset.explore=v;else delete document.body.dataset.explore;}});
}
function exportAll(){
 let path=pathSnapshot();if(!path)try{path=JSON.parse(localStorage.getItem(PATH_KEY));}catch{}
 const data={schema:3,exportedAt:new Date().toISOString(),notice:'混合練習與課內檢查不作正式成效分數；評量依固定規則計分，尚未校準。',assessments:assessmentStore.records(),learningPath:path};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='反應分流局_學習紀錄_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
if(['#assess','#assessment'].includes(location.hash))view='assess';
render();

const resetDialog=document.querySelector('[data-reset-dialog]'),resetError=document.querySelector('[data-reset-error]'),resetButton=document.querySelector('[data-clear-learning]');
let resetting=false;
const resetNoticeKey='organic-reset-notice';
try{if(sessionStorage.getItem(resetNoticeKey)==='cleared'){sessionStorage.removeItem(resetNoticeKey);message('本機學習紀錄已清空，可以從暖身重新開始。');}}catch{}
resetButton.onclick=()=>{resetError.hidden=true;resetError.textContent='';resetDialog.showModal();};
document.querySelector('[data-reset-cancel]').onclick=()=>{if(!resetting)resetDialog.close();};
document.querySelector('[data-reset-export]').onclick=exportAll;
resetDialog.addEventListener('cancel',event=>{if(resetting)event.preventDefault();});
resetDialog.addEventListener('close',()=>resetButton.focus());
function deleteLocalDatabase(name){
 return new Promise((resolve,reject)=>{
  let request;try{request=indexedDB.deleteDatabase(name);}catch{reject(new Error('無法清除舊版本機資料庫，請檢查此網站的儲存權限後再試。'));return;}
  request.onsuccess=()=>resolve();
  request.onerror=()=>reject(new Error('舊版本機資料庫清除失敗，請稍後重試。'));
  request.onblocked=()=>reject(new Error('舊版本機資料庫正被其他分頁使用；請關閉其他本工具分頁，再按確認清空。'));
 });
}
function reloadFromWarmup(){
 const url=new URL(location.href);url.hash='';url.search='';history.replaceState(null,'',url);location.reload();
}
document.querySelector('[data-reset-confirm]').onclick=async()=>{
 if(resetting)return;
 resetting=true;resetError.hidden=false;resetError.textContent='正在清除本機學習紀錄…';
 resetDialog.querySelectorAll('button').forEach(b=>b.disabled=true);
 try{
  const areas=[window.localStorage,window.sessionStorage];
  child?.destroy();child=null;
  await resetBrowserData(areas,deleteLocalDatabase);
  try{sessionStorage.setItem(resetNoticeKey,'cleared');}catch{}
  reloadFromWarmup();
 }catch(error){
  resetError.textContent=error instanceof Error?error.message:'清除失敗，請檢查此網站的儲存權限後重試。';
  render();
 }finally{resetting=false;resetDialog.querySelectorAll('button').forEach(b=>b.disabled=false);}
};
// Reload sibling tabs after a successful reset so their in-memory progress cannot restore old data.
window.addEventListener('storage',event=>{
 if(event.key!==RESET_SIGNAL_KEY||!event.newValue||resetting)return;
 viewStore=false;child?.destroy({discard:true});
 try{for(const key of Object.keys(sessionStorage))if(key.startsWith('organic-'))sessionStorage.removeItem(key);}catch{}
 reloadFromWarmup();
});
