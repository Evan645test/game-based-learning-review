import {openCourseMaterial} from './academy.js';
import {MATERIALS} from '../material-map.js';

globalThis.ORGANIC_STATIC_RELEASE=true;
const parameters=new URLSearchParams(location.search);
const section=parameters.get('section'),material=parameters.get('material');
const known=Object.hasOwn(MATERIALS,section);
const back=document.createElement('a');back.className='book-atlas-back';
back.href=known?'../?'+new URLSearchParams({section}):'../';back.textContent='回到全書星圖';
const returnBar=document.createElement('nav');returnBar.className='book-return-bar';
returnBar.setAttribute('aria-label','全書導覽');returnBar.append(back);
document.querySelector('.skip').after(returnBar);
const badge=document.querySelector('.local-badge');if(badge)badge.textContent='反應入門教材';
if(material){
 const allowed=known&&MATERIALS[section].items.some(item=>item.id===material);
 if(!allowed||!openCourseMaterial(material)){
  const notice=document.getElementById('course-notice');notice.hidden=false;
  notice.textContent='這個教材定位無法開啟，請從全書星圖重新選取；也可使用下方既有教材目錄。';
 }
}
