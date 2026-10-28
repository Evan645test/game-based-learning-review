import {MATERIALS} from './material-map.js';

const panel=document.getElementById('panel');
const sectionIDs=new Set(window.BOOK_ATLAS.sections.map(n=>n.id));
const entry=document.createElement('a');
entry.href='learn/academy.html';entry.className='course-entry';entry.textContent='反應入門教材';
document.querySelector('.toolbar').append(entry);

function showMaterials(){
 if(panel.hidden||panel.querySelector('.book-materials'))return;
 const selected=document.querySelector('[data-node][aria-pressed="true"]')?.dataset.node;
 const record=MATERIALS[selected];if(!record?.items.length)return;
 const block=document.createElement('section');block.className='book-materials';
 const heading=document.createElement('h3');heading.textContent='既有教材參考';block.append(heading);
 const scope=document.createElement('p');scope.className='coverage';scope.textContent=record.scope;block.append(scope);
 const note=document.createElement('p');note.className='coverage';
 note.textContent='沿用已完成的反應入門教材，未涵蓋本節的所有內容。';block.append(note);
 for(const item of record.items){
  const link=document.createElement('a');link.className='material-link';
  link.href='learn/academy.html?'+new URLSearchParams({material:item.id,section:selected});
  link.textContent=item.title;block.append(link);
 }
 const body=panel.querySelector('.panel-body');
 const foundations=[...body.children].find(n=>n.tagName==='H3'&&n.textContent.includes('底層知識'));
 body.insertBefore(block,foundations||body.lastElementChild);
}
new MutationObserver(showMaterials).observe(panel,{childList:true,subtree:true});
showMaterials();

const selected=new URLSearchParams(location.search).get('section');
if(sectionIDs.has(selected)){
 document.querySelector(`[data-node="${selected}"]`)?.dispatchEvent(new MouseEvent('click',{bubbles:true}));
 [...panel.querySelectorAll('.panel-actions button')].find(b=>b.textContent==='聚焦本章')?.click();
}
