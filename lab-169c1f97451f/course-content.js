import {newMechanism,validateMechanism,validWork} from './electron-flow.js';
import {makeModel} from './geometry.js';

export const SOURCE_CREDIT='John McMurry，Organic Chemistry: A Tenth Edition，OpenStax／Rice University（2023）。教材歸納與改編題依 CC BY-NC-SA 4.0 提供；原文與原頁圖像保留來源。';
export const TOPICS=[
 {id:'polarity',title:'電子分布與鍵極性',section:'6.3、6.5',pages:[194,199,200],body:'先辨認孤對電子、化學鍵、部分電荷與完整電荷。電子對從可提供電子的位置流向可接受電子的位置；彎箭頭表示電子移動，分子接近的位置另以三維畫面觀察。',example:'C–Br 中的碳通常具有親電性；Br 離開時帶走 C–Br 鍵電子。',question:'彎箭頭的起點應代表什麼？',options:['可提供的孤對電子或鍵電子','任何帶正電的原子','產物的位置'],answer:0,feedback:'完整彎箭頭從一對電子出發。原子的位置改變與電子記帳要分開理解。'},
 {id:'nucleophile',title:'親核劑（nucleophile）：電子從哪裡來？',section:'2.11、11.3',pages:[73,74,365],body:'親核劑提供電子對，可帶負電，也可呈中性。要指出實際提供電子的原子，不能只圈整瓶試劑。親核性描述反應能力，會受到受質、溶劑及位阻影響。',example:'I⁻ 可由碘提供電子；H₂O 可由氧的孤對電子進攻。',question:'水作為親核劑時，從哪裡提供電子？',options:['氫原子核','氧的孤對電子','憑空形成的新電子'],answer:1,feedback:'中性水也能提供電子對。水成鍵後可能先得到氧陽離子，再去質子化。'},
 {id:'electrophile',title:'親電子劑（electrophile）與親電中心',section:'2.11、6.3',pages:[73,194],body:'親電子劑接受電子對；分子內接受電子的位置叫親電中心。它可能帶完整正電，也可能因鍵極性而呈部分正電。反應時仍要遵守合理價數與電荷守恆。',example:'碳陽離子及烷基鹵化物的反應碳都可接受電子對，兩者的機構不同。',question:'親電中心一定帶完整正電荷嗎？',options:['一定','不一定，部分正電的碳也可能是親電中心','只有鹵素可以是親電中心'],answer:1,feedback:'親電性是接受電子對的能力；不能只靠是否寫出「＋」判斷。'},
 {id:'base',title:'親核性與鹼性分開判讀',section:'11.3、11.8',pages:[365,380,381],body:'親核進攻碳與鹼接受質子是兩種不同的反應選擇。同一物種可同時是親核劑及鹼；位阻、受質、溶劑與溫度會影響取代／消去競爭。',example:'EtO⁻ 可作親核劑，也可接受 β-H；不能見到負電就直接判為 SN2。',question:'E2 中鹼的孤對電子應指向哪裡？',options:['β-H','脫離基','Cα–Cβ 鍵中心'],answer:0,feedback:'鹼接受 β-H；C–H 鍵電子另形成 π 鍵，離去鍵電子則移向脫離基。'},
 {id:'leaving',title:'脫離基（leaving group）與受質（substrate）',section:'11.3、11.5',pages:[363,366,375],body:'受質的一、二、三級與位阻影響親核接近；形成碳陽離子的難易也影響 SN1／E1。良好脫離基可穩定離去後的電子；OH⁻ 通常不是良好脫離基，常須先活化。',example:'三級烷基碳位阻大，不適合一般 SN2；醇質子化後可讓中性水離去。',question:'未活化的 –OH 通常可直接當良好脫離基嗎？',options:['可以，因為含氧','通常不行，需考慮質子化或其他活化','只要加熱一定可以'],answer:1,feedback:'OH⁻ 是強鹼、通常是差的脫離基。活化條件不能省掉。'},
 {id:'solvent',title:'溶劑如何改變分子交互作用？',section:'2.12、11.3、11.5',pages:[76,77,367,375],body:'極性質子性溶劑如水、甲醇及乙醇，可提供氫鍵，透過溶劑合作用穩定離子；常降低陰離子親核劑在 SN2 的反應性。極性非質子性溶劑如 acetone、DMSO、DMF，缺乏 O–H／N–H 氫鍵供體，在許多陰離子 SN2 條件下較有利。低極性溶劑通常不利離子分離。',example:'水分子的氫可朝向陰離子；氧端可朝向碳陽離子。溶劑合作用同時影響反應物與過渡態，不能只背「水＝SN1」。',question:'acetone 有 C–H 鍵，為何仍屬非質子性溶劑？',options:['它完全不含氫','它缺乏 O–H／N–H 氫鍵供體','所有含氧物都是非質子性溶劑'],answer:1,feedback:'「非質子」不等於「不含氫」。分類需看是否能提供相應的氫鍵供體。'},
 {id:'space',title:'三維方向決定可行路徑',section:'4.5–4.8、11.2、11.8–11.9',pages:[361,381,382,383,384],body:'SN2 由脫離基的背面進攻，反應中心瓦登反轉。常見 E2 偏好 H–Cβ–Cα–脫離基呈 anti-periplanar；環己烷須檢查反式雙軸向。翻環改變軸向／赤道向，但不改變 up／down。',example:'把二面角調到接近 180°，再確認選的確實是可移除的 β-H。',question:'翻轉椅式構形會改變取代基的 up／down 嗎？',options:['會，同時改變異構物','不會，只交換軸向／赤道向','只有 Br 會改變'],answer:1,feedback:'翻環是構形改變；不能把它當成取代基穿過環面。'},
 {id:'pathway',title:'把線索串成 SN／E 判斷',section:'11.4、11.10、11.12',pages:[375,385,387],body:'S 表示取代、N 表示親核、E 表示消去。SN2／E2 為一步協同；SN1／E1 先離解形成碳陽離子，再進行後續反應。名稱中的 1、2 與速率式反應級數相關，不是機構步數。先看受質、試劑、脫離基、溶劑與構形，再提出路徑。SN1／E1 常有競爭；強鹼下須考慮 E2。加熱不保證得到唯一 E1 產物。',example:'三級鹵化物遇水與遇強鹼，不能套用同一套產物預測。',question:'三級鹵化物在水中一定只有 SN1 產物嗎？',options:['一定','不一定，E1 可競爭','一定只有 E2'],answer:1,feedback:'題目若要求解釋已觀察的烯類分支，可分析 E1；不可據此虛構唯一產物或比例。'}
];

const q=(prompt,options,answer,why)=>({prompt,options,answer,why});
const substrate=q('A 的脫離基所在碳屬於哪一級？',['一級','二級','三級'],1,'數與反應碳直接相連的碳，不是整個分子總共有幾個碳。');
const tertiary=q('A 的脫離基所在碳屬於哪一級？',['一級','二級','三級'],2,'反應碳直接連接三個碳基團；位阻與碳陽離子穩定性都需納入。');
const anti=q('此路徑的空間條件是？',['前面進攻','β-H 與脫離基偏好 anti-periplanar','完全不必看方向'],1,'E2 需檢查所選 β-H 與脫離基的二面角。');
export const COURSE_CASES=[
 {id:'sn2',title:'交換脫離基',kind:'sn2',demo:'sn2',a:'2-bromobutane',b:'I⁻（NaI）',condition:'acetone，25 °C',kinds:['sn2'],questions:[substrate,q('B 在此案件的主要角色？',['由 I⁻ 提供電子對的親核劑','移除 β-H 的強鹼','讓 Br 接受質子的酸'],0,'I⁻ 是良好親核劑、弱鹼；在此條件支持取代。'),q('哪一組條件理由較合理？',['acetone 的極性非質子性溶劑環境有利此陰離子親核取代','acetone 一定產生碳陽離子','25 °C 保證沒有任何競爭'],0,'結合二級受質、I⁻ 與溶劑判讀；不由單一條件保證唯一反應。'),q('最符合此案件的主要機構？',['SN1','SN2','E1','E2'],1,'親核進攻與離去在同一步，需由背面接近。'),q('新鍵與主要取代產物？',['Cα–I；2-iodobutane，反應中心反轉','Cβ=Cα；只有 butene','Cα–Br；結構完全不變'],0,'把 Br 換成 I，電子記帳另保留 Br⁻；R/S 名稱可能隨優先序改變，勿把反轉一律等同 R 變 S。')],geometry:'背面接近：把 I–Cα–Br 進攻角調到接近 180°，保存證據。',conclusion:'SN2 以背面進攻完成取代，C–I 成鍵及 C–Br 斷鍵同步；觀察瓦登反轉。',source:[361,363,367]},
 {id:'sn1',title:'水接住反應中心',kind:'sn1',demo:'sn1',a:'tert-butyl bromide',b:'H₂O',condition:'富水極性質子性溶劑環境，室溫；分析取代分支',kinds:['sn1'],questions:[tertiary,q('水如何參與取代？',['氧的孤對電子進攻碳陽離子','水的氫進攻 Br','水只可當溶劑，不能反應'],0,'水兼具溶劑與親核劑角色，進攻後先形成氧陽離子。'),q('溶劑在此如何提供支持？',['極性環境可與離子作用並穩定離子','水讓三級碳變成一級','質子性溶劑保證不會消去'],0,'離子與離解過渡態的穩定化支持 SN1，但 E1 仍可競爭。'),q('取代分支符合哪個機構？',['SN1','SN2','E1','E2'],0,'先離解，再親核進攻與去質子化；編號 1 不代表只一步。'),q('取代分支最終產物？',['tert-butanol；另需顯示 Br⁻ 與質子轉移','R–OH₂⁺ 就是最終中性醇','只有 2-methylpropene'],0,'水進攻後須去質子化。此受質本身不手性，勿宣稱產物一定外消旋。')],geometry:'切到離解後第 1 階段，觀察三角平面碳陽離子，可切換進攻面後保存。',conclusion:'SN1 取代分支：碳陽離子 → 氧陽離子 → 中性醇；此案例不是手性受質，E1 仍可能競爭。',source:[375,385]},
 {id:'e1',title:'解釋觀察到的烯類',kind:'e1',demo:'e1',a:'2-bromo-2-methylbutane',b:'EtOH',condition:'乙醇、加熱；題目已觀察到烯類，解釋消去分支',kinds:['e1'],questions:[tertiary,q('形成烯類的步驟中，EtOH 做什麼？',['氧接受 β-H','直接把 Br 換成 OH⁻','電子由碳陽離子流向水'],0,'離解後由乙醇接受 β-H，C–H 電子形成雙鍵。'),q('哪個條件敘述合理？',['極性質子性溶劑環境可支持離解，SN1 也可競爭','加熱保證唯一 E1','EtOH 是強鹼所以必定 E2'],0,'本題分析已觀察的消去分支，不推斷未提供的比例。'),q('此烯類分支的機構？',['SN1','SN2','E1','E2'],2,'先形成碳陽離子，再失去 β-H；不是協同的 E2。'),q('乙基側 β-H 消去後的烯類？',['2-methyl-2-butene；另可能有其他產物','2-iodobutane','先把碳骨架全部拆開'],0,'常見較多取代烯類是 2-methyl-2-butene，但其他 β 位與取代路徑不可忽略。')],geometry:'先顯示碳陽離子，再選乙基側 Hβ，保存這個路徑的空間觀察。',conclusion:'E1 先離解，再移除 β-H。此題選乙基側形成 2-methyl-2-butene；SN1 及其他烯類仍須考慮。',source:[385,387]},
 {id:'e2',title:'讓三組電子同時動',kind:'e2',demo:'e2',a:'2-bromobutane',b:'EtO⁻（NaOEt）',condition:'ethanol，加熱；分析較有利的消去路徑',kinds:['e2'],questions:[substrate,q('B 在消去路徑做什麼？',['以氧的孤對電子接受 β-H','先把 Br⁻ 氧化','只與碳陽離子成鍵'],0,'EtO⁻ 是強鹼，也有親核性；此條件支持 E2，SN2 可競爭。'),q('哪個判讀較完整？',['二級受質＋強鹼＋加熱支持 E2，仍需考慮 SN2','所有 ethanol 反應都是 SN1','只要有負電就一定 SN2'],0,'把受質、鹼、溶劑、溫度及可行構形一起考慮。'),q('三組電子在同一步移動，屬於？',['SN1','SN2','E1','E2'],3,'β-H 移除、π 鍵形成與離去同步。'),q('圖示 Cα–Cβ 路徑形成什麼？',['2-butene；E/Z 隨反應構形判讀，另可能有其他產物','2-iodobutane','碳陽離子是必經中間體'],0,'常見 2-butene，E/Z 與選定的構形有關；仍可能有 1-butene 與取代競爭。')],geometry:'選 β-H，旋轉 Cα–Cβ 至 anti 二面角接近 180°，保存證據。',conclusion:'E2 是一步協同反應。此局部路徑形成 2-butene；不能由平面箭頭直接宣稱唯一 E/Z 或產率。',source:[380,381,382]},
 {id:'chair',title:'翻環找出可消去的氫',kind:'chair',demo:'chair',a:'trans-1-bromo-2-methylcyclohexane',b:'EtO⁻',condition:'ethanol；檢查常見 anti E2 路徑',kinds:['chair'],questions:[substrate,q('鹼應找哪個位置？',['與軸向 Br 呈反式雙軸向的 β-H','任何赤道向 H 都一樣','環上 Me 的碳原子核'],0,'需先翻環確認 Br 軸向，再檢查 β 位軸向是否被 Me 占據。'),q('翻環改變什麼？',['軸向／赤道向，保留 up／down','把 trans 變成 cis','直接斷 C–Br 鍵'],0,'翻環只改構形；不是化學反應或異構物轉換。'),q('這個構形限制對應哪個機構？',['SN1','SN2','E1','E2'],3,'環己烷常見 anti E2 要反式雙軸向。'),q('C6 的軸向 H 消去後？',['3-methylcyclohexene','1-methylcyclohexene 必定形成','所有 β-H 都給同一種連接'],0,'Br 軸向時 C2 軸向由 Me 占據；可用的 C6 軸向 H 決定此路徑的產物。')],geometry:'翻到 Br 軸向，選 H6（而非 H2 或 H6′），保存反式雙軸向證據。',conclusion:'Br 軸向時 C2 軸向是 Me；C6 的軸向 H 允許 anti E2，形成 3-methylcyclohexene。',source:[383,384,387]},
 {id:'compare',title:'同一受質，兩組條件',kind:'e2',demo:'e2',a:'2-bromobutane（兩份相同受質）',b:'甲：NaI；乙：NaOEt',condition:'甲：acetone／25 °C；乙：ethanol／加熱',kinds:['sn2','e2'],questions:[substrate,q('甲、乙的主要反應角色？',['甲：親核劑；乙：強鹼且有親核性','兩者都只作酸','兩者沒有差異'],0,'試劑的親核性與鹼性不同，不能只看都有鈉。'),q('如何比較兩組條件？',['甲較支持 SN2；乙較支持 E2，但可有競爭','只依溫度即可決定唯一產物','兩者都是極性質子性溶劑'],0,'同時比較試劑、溶劑與溫度；不虛構產物比例。'),q('甲／乙較合理的路徑組合？',['SN2／E2','SN1／SN1','E1／SN2','E2／SN1'],0,'甲親核取代；乙強鹼消去。兩份都需完成電子與空間證據。'),q('兩組所分析路徑的產物？',['甲：2-iodobutane；乙：2-butene（仍須考慮異構與競爭）','甲乙都只有同一產物','乙必定先形成碳陽離子'],0,'不同條件改變路徑的重要性；答案須與各自畫出的機構一致。')],geometry:'甲保存背面進攻；乙保存 anti 二面角。兩份證據缺一不可。',conclusion:'同一受質可因試劑與環境不同走向不同路徑；甲 SN2、乙 E2 的電子記帳與空間限制都要成立。',source:[367,381,387]}
];

export const REASON_STEPS=['讀懂 A','判讀 B','分析環境','提出路徑','完成機構','提出 C'];
export function newReasoning(c){return {version:1,step:0,answers:{},work:Object.fromEntries(c.kinds.map(k=>[k,newMechanism(k)])),geometry:Object.fromEntries(c.kinds.map(k=>[k,{state:{approach:70,torsion:60,beta:k==='chair'?'H2':k==='e1'?'Hmethyl':'HB1',chair:'equatorial',step:0,face:'front'},captured:false}])),hints:0};}
export function reasoningComplete(c,d){return Boolean(d&&c.questions.every((_,i)=>Number.isInteger(d.answers?.[i])&&d.answers[i]>=0&&d.answers[i]<c.questions[i].options.length)&&c.kinds.every(k=>validWork(k,d.work?.[k])&&d.work[k].steps.every(s=>s.confirmed)&&d.geometry?.[k]?.captured));}
export function geometryCorrect(kind,evidence){
 if(!evidence?.captured||!evidence.state)return false;
 const s=evidence.state;if(!geometryStateValid(kind,s))return false;
 const model=makeModel(kind,s);
 if(!Number.isFinite(model.measurement))return false;
 if(kind==='sn1')return Number(s.step)===1;
 if(kind==='e1')return Number(s.step)===1&&s.beta==='Hethyl';
 if(kind==='chair')return s.chair==='axial'&&s.beta==='H6'&&model.measurement>=170;
 return model.measurement>=170&&model.measurement<=180.01;
}
export function geometryStateValid(kind,s){
 if(!s||!Number.isFinite(s.approach)||s.approach<0||s.approach>180||!Number.isFinite(s.torsion)||s.torsion<0||s.torsion>360||![0,1].includes(s.step)||!['front','back'].includes(s.face)||!['axial','equatorial'].includes(s.chair))return false;
 const choices=kind==='chair'?['H2','H6','H6b']:kind==='e1'?['Hethyl','Hmethyl']:['HB1','HB2'];
 return choices.includes(s.beta);
}
export const EXIT_QUESTIONS=[
 {prompt:'I⁻ 與烷基溴形成新 C–I 鍵時，電子對由哪裡出發？',options:['I⁻ 的孤對電子','親電碳的原子核','Br⁻ 的新電子'],answer:0},
 {prompt:'看到 ethanol 與加熱，能否斷定唯一產物來自 E1？',options:['能，溶劑已決定一切','不能，還須看受質、試劑及競爭路徑'],answer:1},
 {prompt:'E2 的 β-H 移除、π 鍵形成與離去發生在？',options:['三個可分離中間體','同一機構步驟'],answer:1}
];
export function gradeReasoning(c,d){
 const points=c.questions.map((q,i)=>d?.answers?.[i]===q.answer?[10,10,20,20,20][i]:0);
 const flow=c.kinds.filter(k=>validateMechanism(k,d?.work?.[k]).ok).length/c.kinds.length*10;
 const space=c.kinds.filter(k=>geometryCorrect(k,d?.geometry?.[k])).length/c.kinds.length*10;
 const dimensions={roles:points[0]+points[1],conditions:points[2],pathway:points[3],mechanism:flow+space,product:points[4]};
 return {score:Object.values(dimensions).reduce((a,b)=>a+b,0),dimensions,flow,space,hints:Math.max(0,Number(d?.hints)||0),evidence:structuredClone(d),caseId:c.id,version:1};
}
