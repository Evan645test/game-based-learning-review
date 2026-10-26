import test from 'node:test';
import assert from 'node:assert/strict';
import {freshPath,copyPathLocation} from '../learning-path.js';
test('模式之間僅移轉課程位置；教師作答與學生紀錄互不覆寫',()=>{
 const student=freshPath();student.warm.checks.hybrid={choice:2,first:false};student.stages.s1.predictions={'0':{0:'sn1'}};student.attempts=[{item:'student'}];
 const teacher=copyPathLocation(student,freshPath());assert.deepEqual(teacher.warm.checks,{});assert.deepEqual(teacher.attempts,[]);
 teacher.stage='s2';teacher.explore.pos.s2={node:2,screen:1};teacher.explore.done.s2.primers=true;teacher.warm.checks.hybrid={choice:1,first:true};teacher.attempts.push({item:'teacher'});
 copyPathLocation(teacher,student);assert.equal(student.stage,'s2');assert.deepEqual(student.explore.pos.s2,{node:2,screen:1});assert.deepEqual(student.explore.done.s2,{},'走過的據點屬於學生自己的進度');
 teacher.explore.pos.s2.node=3;assert.equal(student.explore.pos.s2.node,2,'位置是複本，不共用參照');
 assert.deepEqual(student.warm.checks.hybrid,{choice:2,first:false});assert.deepEqual(student.attempts,[{item:'student'}]);assert.deepEqual(student.stages.s1.predictions,{'0':{0:'sn1'}});
});
