import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizePlaybackState} from '../spotlight-demo.js';
test('觀看書籤保留段落、時間與鏡頭，還原不自動播放',()=>{
 const state={version:1,frame:4,progress:.62,camera:{yaw:.7,pitch:.2,zoom:1.2},speed:1.5,spot:false,hydrogens:true,playing:true};
 const restored=normalizePlaybackState(state,15);assert.equal(restored.frame,4);assert.equal(restored.progress,.62);assert.deepEqual(restored.camera,state.camera);assert.equal(restored.playing,undefined);assert.equal(restored.spot,false);restored.camera.yaw=2;assert.equal(state.camera.yaw,.7);
});
test('舊資料與受損書籤使用可操作預設，時間、角度與框數保持有效範圍',()=>{
 for(const value of [null,'bad',{version:9},{version:1,frame:NaN,progress:Infinity,camera:{yaw:'wrong',zoom:NaN},speed:4}]){const state=normalizePlaybackState(value,7,2);assert.equal(state.frame,2);assert.equal(state.progress,0);assert.equal(state.camera.zoom,1);assert.equal(state.speed,1);}
 const clamped=normalizePlaybackState({version:1,frame:999,progress:12,camera:{pitch:4,zoom:-2}},7);assert.equal(clamped.frame,6);assert.equal(clamped.progress,1);assert.equal(clamped.camera.pitch,1.35);assert.equal(clamped.camera.zoom,.65);
});
