import test from 'node:test';
import assert from 'node:assert/strict';
import {createRoom,transition,teamScore,roomTotals} from '../pk-state.js';

test('PK 不能跳過示範或未完成的個人作答；首次提交不可覆寫',()=>{
  let r=createRoom('TEST01',1);
  assert.throws(()=>transition(r,{type:'individual'}));
  r=transition(r,{type:'start'});
  assert.equal(r.phase,'demo');
  assert.throws(()=>transition(r,{type:'individual'}));
  for(const seat of r.seats) r=transition(r,{type:'seen',seat});
  r=transition(r,{type:'individual'});
  r=transition(r,{type:'submit',seat:'A1',report:{score:80}});
  assert.throws(()=>transition(r,{type:'consensus'}));
  r=transition(r,{type:'submit',seat:'A1',report:{score:100}});
  assert.equal(r.individual[0].A1.score,80);
  r=transition(r,{type:'submit',seat:'B1',report:{score:60}});
  assert.equal(transition(r,{type:'consensus'}).phase,'consensus');
});

test('PK 按60/40計分、平手並列，重複共識或修正不回灌分數，六關結束不多算',()=>{
 let r=createRoom('TEST02',2);
 assert.throws(()=>transition(r,{type:'submit',seat:'A1',report:{score:100}}));
 r=transition(r,{type:'start'});
 for(let round=0;round<6;round++){
  for(const seat of r.seats)r=transition(r,{type:'seen',seat});r=transition(r,{type:'individual'});
  for(const seat of r.seats)r=transition(r,{type:'submit',seat,report:{score:seat.endsWith('1')?80:60}});
  r=transition(r,{type:'consensus'});assert.throws(()=>transition(r,{type:'team',seat:'A2',report:{score:100}}));
  for(const seat of ['A1','B1'])r=transition(r,{type:'team',seat,report:{score:90}});
  r=transition(r,{type:'team',seat:'A1',report:{score:100}});assert.equal(r.consensus[round].A.score,90);
  assert.equal(roomTotals(r)[0].total,round*78);
  r=transition(r,{type:'reveal'});assert.equal(teamScore(r,round,'A').total,78);
  r=transition(r,{type:'correct',seat:'A1',report:{score:100}});assert.equal(teamScore(r,round,'A').total,78);
  r=transition(r,{type:'next'});
 }
 assert.equal(r.phase,'finished');assert.equal(r.round,5);assert.deepEqual(roomTotals(r),[{team:'A',total:468},{team:'B',total:468}]);assert.throws(()=>transition(r,{type:'next'}));
 r=transition(r,{type:'exit',seat:'A1',answers:{0:0,1:1,2:1}});r=transition(r,{type:'exit',seat:'B1',answers:{0:1,1:0,2:0}});assert.equal(r.exits.A1.score,3);assert.equal(r.exits.B1.score,0);assert.equal(transition(r,{type:'exit',seat:'A1',answers:{0:1,1:0,2:0}}).exits.A1.score,3);
});
