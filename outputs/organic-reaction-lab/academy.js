import {mountLearningPath,pathSnapshot,PATH_KEY} from './learning-path.js';
import {createAssessmentStore} from './assessment-store.js';
import {mountAssessment} from './assessment.js';
import {glossaryHTML} from './terminology.js';
import {clearLegacyData} from './legacy-data.js';

const main=document.querySelector('#course-main'),notice=document.querySelector('#course-notice');
function message(text){notice.hidden=!text;notice.textContent=text;}

let storages=[];try{storages=[window.localStorage,window.sessionStorage];}catch{}
if(storages.length&&clearLegacyData(storages,name=>indexedDB.deleteDatabase(name)))message('已更新為新版學習路徑：舊的課程進度、評量與 PK 紀錄已清除。');

let assessmentStorage=null;try{assessmentStorage=window.localStorage;}catch{}
const assessmentStore=createAssessmentStore(assessmentStorage,message);
const VIEW_PREFIX='organic-demo-view-v3:',views=new Map();let viewStore=true;
function loadView(id){if(views.has(id))return views.get(id);let v=null;if(viewStore)try{const raw=localStorage.getItem(VIEW_PREFIX+id);v=raw?JSON.parse(raw):null;}catch{viewStore=false;}views.set(id,v);return v;}
function saveView(id,state){views.set(id,state);if(!viewStore)return;try{localStorage.setItem(VIEW_PREFIX+id,JSON.stringify(state));}catch{viewStore=false;}}

let child=null,view='learn',assessmentTab='post',assessmentActive=false;
function navigate(page){if(assessmentActive){message('請先完成或提早提交目前評量，再切換內容；作答草稿已保存。');return;}if(view===page)return;view=page;const url=new URL(location.href);url.search='';url.hash=page;history.replaceState(null,'',url);render();}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>navigate(b.dataset.page));
function render(){
 child?.destroy();child=null;
 document.querySelectorAll('[data-page]').forEach(b=>{b.classList.toggle('active',b.dataset.page===view);b.setAttribute('aria-current',b.dataset.page===view?'page':'false');b.disabled=false;});
 if(view==='assess'){main.innerHTML='<div data-assessment-host></div>';child=mountAssessment(main.querySelector('[data-assessment-host]'),{store:assessmentStore,initialTab:assessmentTab,onDone:()=>navigate('learn'),onActive:active=>{assessmentActive=active;document.querySelectorAll('[data-page]').forEach(b=>b.disabled=active);},onNotice:message,exportAll});return;}
 main.innerHTML='<div data-learning-host></div>'+glossaryHTML();
 child=mountLearningPath(main.querySelector('[data-learning-host]'),{onNotice:message,onAssessment:()=>{assessmentTab='post';navigate('assess');},loadView,saveView});
}
function exportAll(){
 let path=pathSnapshot();if(!path)try{path=JSON.parse(localStorage.getItem(PATH_KEY));}catch{}
 const data={schema:3,exportedAt:new Date().toISOString(),notice:'混合練習與課內檢查不作正式成效分數；評量依固定規則計分，尚未校準。',assessments:assessmentStore.records(),learningPath:path};
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='反應分流局_學習紀錄_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
if(['#assess','#assessment'].includes(location.hash))view='assess';
render();
