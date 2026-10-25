import test from 'node:test';
import assert from 'node:assert/strict';
import {spotlightSegmentFrames} from '../spotlight-demo.js';
import {validGuide,LESSONS} from '../guided-lesson.js';
import {canonicalTermText,TERMS} from '../terminology.js';
test('引導片段只呈現指定實際步驟，產物答案在推理後才揭曉',()=>{
 const first=spotlightSegmentFrames('sn1',null,{step:0,includeProduct:false});
 assert.ok(first.every(f=>f.step===0&&f.mode!=='product'));assert.equal(first.at(-1).mode,'transform');
 const second=spotlightSegmentFrames('e1',null,{step:1,includeProduct:false});assert.ok(second.every(f=>f.step===1));
 assert.throws(()=>spotlightSegmentFrames('sn1',null,{step:99}),RangeError);
 assert.ok(spotlightSegmentFrames('sn1').some(f=>f.step===2&&f.mode==='product'));
});
test('損毀或跳階引導紀錄不當成已完成，不刪除原作答紀錄',()=>{
 const s={version:1,lesson:0,records:Object.fromEntries(LESSONS.map(l=>[l.id,{phase:0,prediction:null,diagram:false,observed:false,first:null,latest:null,done:false}]))};
 assert.equal(validGuide(s),true);s.records.charge.phase=3;assert.equal(validGuide(s),false);
 Object.assign(s.records.charge,{phase:4,prediction:1,diagram:true,observed:true,latest:{product:2,reason:0},done:true});assert.equal(validGuide(s),false);
 s.records.charge.first={product:0,reason:1};assert.equal(validGuide(s),true);s.records.charge.latest.reason=2;assert.equal(validGuide(s),false);
});
test('官方化學譯詞保留英文與來源，舊教學答案可相容比對',()=>{
 for(const [en,zh]of [['nucleophile','親核劑'],['electrophile','親電子劑'],['leaving group','脫離基'],['protic solvent','質子性溶劑'],['aprotic solvent','非質子性溶劑']]){const t=TERMS.find(t=>t.en===en);assert.equal(t.zh,zh);assert.ok(t.url.startsWith('https://terms.naer.edu.tw/'));assert.ok(t.field.includes('化學'));}
 assert.equal(canonicalTermText('溶劑化並穩定離子'),'溶劑合作用並穩定離子');assert.equal(canonicalTermText('親核試劑與離去基'),'親核劑與脫離基');
});
