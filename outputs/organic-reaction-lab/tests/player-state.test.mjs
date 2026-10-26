import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePlaybackState} from '../spotlight-demo.js';
test('混成軌域模式可保存在觀看書籤，舊書籤仍預設球棍',()=>{
 assert.equal(normalizePlaybackState({version:1,orbitals:true},5).orbitals,true);
 assert.equal(normalizePlaybackState({version:1},5).orbitals,false);
 assert.equal(normalizePlaybackState({version:1,orbitals:'true'},5).orbitals,false);
});
test('觀看書籤保留段落、時間與鏡頭，還原不自動播放',()=>{
 const state={version:1,frame:4,progress:.62,camera:{yaw:.7,pitch:.2,zoom:1.2},speed:1.5,spot:false,hydrogens:true,playing:true};
 const restored=normalizePlaybackState(state,15);assert.equal(restored.frame,4);assert.equal(restored.progress,.62);assert.deepEqual(restored.camera,state.camera);assert.equal(restored.playing,undefined);assert.equal(restored.spot,false);restored.camera.yaw=2;assert.equal(state.camera.yaw,.7);
});
test('舊資料與受損書籤使用可操作預設，時間、角度與框數保持有效範圍',()=>{
 for(const value of [null,'bad',{version:9},{version:1,frame:NaN,progress:Infinity,camera:{yaw:'wrong',zoom:NaN},speed:4}]){const state=normalizePlaybackState(value,7,2);assert.equal(state.frame,2);assert.equal(state.progress,0);assert.equal(state.camera.zoom,1);assert.equal(state.speed,1);}
 const clamped=normalizePlaybackState({version:1,frame:999,progress:12,camera:{pitch:4,zoom:-2}},7);assert.equal(clamped.frame,6);assert.equal(clamped.progress,1);assert.equal(clamped.camera.pitch,1.35);assert.equal(clamped.camera.zoom,.65);
});
test('顯示模式與連續播放保存，舊書籤用響應式預設與逐步暫停',()=>{
 const defaults=normalizePlaybackState({version:1},4);
 assert.equal(defaults.viewMode,'auto');assert.equal(defaults.continuous,false);
 for(const viewMode of ['auto','three','paper','compare'])assert.equal(normalizePlaybackState({version:1,viewMode,continuous:true},4).viewMode,viewMode);
 assert.equal(normalizePlaybackState({version:1,viewMode:'invalid',continuous:'yes'},4).viewMode,'auto');
 assert.equal(normalizePlaybackState({version:1,continuous:'yes'},4).continuous,false);
});
test('舊固定鏡頭升級為共同對照視角；自由鏡頭與觀看位置保持不變',()=>{
 const defaults=normalizePlaybackState(null,10),old={version:1,frame:4,progress:.65,camera:{yaw:-.3,pitch:.36,zoom:1.2}};
 const upgraded=normalizePlaybackState(old,10);assert.equal(upgraded.camera.yaw,defaults.camera.yaw);assert.equal(upgraded.camera.pitch,defaults.camera.pitch);assert.equal(upgraded.camera.zoom,1.2);assert.equal(upgraded.frame,4);assert.equal(upgraded.progress,.65);
 const custom={...old,camera:{yaw:.7,pitch:-.4,zoom:.9}};assert.deepEqual(normalizePlaybackState(custom,10).camera,custom.camera);
 assert.deepEqual(normalizePlaybackState({...old,referenceVersion:2},10).camera,old.camera);
});
