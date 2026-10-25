import {mechanismSpec,newMechanism,validateMechanism,validWork} from './electron-flow.js';
import {mountArrowEditor} from './arrow-editor.js';
import {mountSpotlight} from './spotlight-demo.js';
import {canonicalTermText} from './terminology.js';

export const REACTION_TYPES = [
  {id:'SN2',family:'取代',change:'親核劑取代脫離基',path:'背面進攻；成鍵與斷鍵協同進行',rate:'常見速率式：k[受質][親核劑]',number:'2 表示速率決定步驟涉及兩個反應物，不是兩個步驟。'},
  {id:'SN1',family:'取代',change:'親核劑取代脫離基',path:'先形成碳陽離子，再親核進攻',rate:'常見速率式：k[受質]',number:'1 表示速率決定步驟的單分子性，不是整個機構只有一步。'},
  {id:'E2',family:'消去',change:'移除 β-H 與脫離基，形成 C=C',path:'失氫、形成 π 鍵與離去在同一步發生',rate:'常見速率式：k[受質][鹼]',number:'2 不代表兩步；常見 E2 是一步協同消去。'},
  {id:'E1',family:'消去',change:'移除 β-H 與脫離基，形成 C=C',path:'先形成碳陽離子，再失去 β-H',rate:'常見速率式：k[受質]',number:'1 不代表一步；此消去機構先離去，再失氫。'}
];
export const FOUNDATIONS = {
  electrons:[
    ['電子從哪裡來？','完整彎箭頭表示一對電子的移動，起點是孤對電子或化學鍵，終點是接受電子的原子或新鍵位置。箭頭不是原子的移動軌跡。'],
    ['誰接受電子？','親電中心是接受電子對的位置。C–Br 鍵極化使反應碳偏缺電子；碳陽離子則帶正式正電荷。部分正電 δ+ 與正式正電 + 要分開看。'],
    ['脫離基如何離開？','C–Br 不勻分裂時，原鍵的兩個電子交給 Br，箭頭從 C–Br 鍵指向 Br，形成 Br⁻。不是從 Br 畫向碳。'],
    ['移走氫時如何畫？','鹼用電子對與氫成鍵；原 X–H 鍵的電子另有去向。E2 中，C–H 電子形成 π 鍵，同時 C–Br 鍵斷裂。'],
    ['α、β 與 β-H 在哪裡？','與脫離基直接相連的是 α 碳，相鄰的是 β 碳；連在 β 碳上的氫稱為 β-H。消去前先定位這些原子，再檢查空間排列。']
  ],
  reagents:[
    ['親核劑','提供電子對與親電中心成鍵，例如 I⁻、H₂O。親核性描述在指定條件下與親電中心反應的能力，受溶劑與立體障礙影響。'],
    ['鹼','接受質子，電子對指向 H。鹼性與酸鹼平衡相關，常以共軛酸的 pKₐ 比較；強親核性不等於強鹼性。'],
    ['同一試劑可扮演兩種角色','EtO⁻ 既能接受 H，也能攻擊碳，因此取代與消去可能競爭。I⁻ 是良好親核劑，但鹼性弱。水則是弱親核劑、弱鹼。'],
    ['立體障礙也重要','體積大的強鹼，如 tert-butoxide，較難靠近受阻的碳做 SN2，常使消去較有利；仍須檢查受質與可用 β-H。'],
    ['脫離基','離開時帶走原鍵電子對；能穩定存在的弱鹼通常是較好的脫離基。Br⁻、I⁻ 是常見例子；OH⁻ 通常不好離去，醇常須先活化或質子化成可離去的水。']
  ],
  solvents:[
    ['極性質子性溶劑','水、ethanol 能提供氫鍵，穩定離子，並與陰離子形成溶劑合作用。陰離子親核劑被包覆後，常較難直接攻擊碳。'],
    ['極性非質子性溶劑','acetone、DMSO、DMF 能與陽離子形成溶劑合作用，卻不像水或醇以強氫鍵包覆陰離子，常有利於陰離子親核劑參與 SN2。不能簡化成完全不與離子作用。'],
    ['為什麼 SN1／E1 重視溶劑？','能有效穩定電荷分離的介質，常有助於離解形成碳陽離子與離去陰離子。受質能否形成合適碳陽離子仍是關鍵，不能只看溶劑類別。'],
    ['加熱不是反應類型的開關','升溫通常改變多條路徑的速率與產物分布。不能看到加熱就判定純 E1，也不能由溶劑名稱算出精確比例。']
  ]
};
const q=(id,prompt,options,answer,explanation)=>({id,prompt,options,answer,explanation});
export const LESSONS = {
 sn2:{family:'取代',type:'SN2',kind:'sn2',equation:'R–Br + I⁻ → R–I + Br⁻',definition:'原本與碳連接的 Br，被 I 取代；本次不以形成雙鍵為主要結構變化。',roles:'I⁻ 的孤對電子是來源，與 Br 相連的 Cα 是接受電子的親電中心，Br 是脫離基。I⁻ 鹼性弱，因此不要把它當成強鹼。',conditions:['二級受質有一定立體障礙；仍可在這組條件下進行 SN2。','NaI 提供 I⁻；親核性良好、鹼性弱。','acetone 是極性非質子性溶劑，支持此陰離子親核取代。'],solvent:'在 acetone 中，I⁻ 不會像在水或醇中被強氫鍵包覆；較能參與對碳的親核進攻。這是支持 SN2 的因素，並非只憑溶劑就能決定全部路徑。',geometry:'親核劑由 C–Br 背面進攻，反應中心發生瓦登反轉。R／S 仍需重新判定。',caution:'SN2 的「2」不是兩步。兩支電子箭頭畫在同一步，不代表先形成穩定的五價碳。',checks:[q('family','Br 被 I 取代，屬於哪類結構變化？',['取代','消去'],'取代','脫離基被新的基團取代；這裡不以生成 C=C 為主要變化。'),q('role','此處 I⁻ 主要用電子對做什麼？',['與 Cα 成鍵','以強鹼性抽走 β-H'],'與 Cα 成鍵','I⁻ 主要作為親核劑，而非強鹼。'),q('solvent','acetone 為什麼支持此親核取代？',['不像質子性溶劑以強氫鍵包覆 I⁻','保證所有受質都只走 SN2'],'不像質子性溶劑以強氫鍵包覆 I⁻','還要一起檢查受質、試劑與溫度，不能只靠溶劑下結論。')]},
 sn1:{family:'取代',type:'SN1',kind:'sn1',equation:'R–Br + H₂O → R–OH（另有質子轉移與 Br⁻）',definition:'Br 最後被含氧基團取代，生成醇。先離去、再進攻，是本案例的取代路徑。',roles:'受質先形成碳陽離子，水的氧再提供孤對電子與碳成鍵；另一個水分子可作為鹼，完成氧陽離子的去質子化。',conditions:['三級受質的背面進攻受立體障礙影響。','三級碳陽離子較受烷基穩定，支持先離解的路徑。','富水介質可穩定生成的離子，水也能捕捉碳陽離子。'],solvent:'富水的極性質子介質可溶劑合作用碳陽離子與 Br⁻，有利於電荷分離。這並不代表水是強親核劑；此取代可在先離解後由水捕捉。',geometry:'碳陽離子為平面，可從兩面被進攻；tert-butyl 本身不具手性，不能用它宣稱生成一對對映異構物。',caution:'SN1 不只一步；使用水時，親核進攻後還需要去質子化。E1 可共享碳陽離子而競爭。',checks:[q('family','本案例生成醇的分支是哪一類？',['取代','消去'],'取代','水衍生的含氧基團取代 Br。'),q('role','碳陽離子形成後，哪裡提供成鍵電子對？',['水的氧孤對電子','碳陽離子的正電荷'],'水的氧孤對電子','正電荷表示缺電子，不能作為電子對來源。'),q('solvent','富水介質主要如何支持離解？',['溶劑合作用並穩定離子','把水變成強鹼'],'溶劑合作用並穩定離子','不要把溶劑穩定離子的作用與試劑鹼性混為一談。')]},
 e1:{family:'消去',type:'E1',kind:'e1',equation:'R–CH₂–C(Br)R₂ → R–CH=CR₂（消去分支）',definition:'本題已觀察到烯類；要解釋的是失去 β-H 與 Br、形成 C=C 的消去分支，不代表整瓶只有消去。',roles:'C–Br 鍵先把電子交給 Br。碳陽離子形成後，乙醇的氧作為弱鹼接受 β-H，C–H 鍵電子形成 π 鍵。',conditions:['三級受質可先離解，形成較穩定碳陽離子。','乙醇為弱鹼／弱親核劑，不需要把它誤認成 EtO⁻。','加熱條件下觀察到烯類，可分析 E1 分支；SN1 仍可競爭。'],solvent:'ethanol 是極性質子性溶劑，也能作為反應物參與親核進攻或接受質子。溶劑穩定離子的作用支持分步路徑，但加熱與 ethanol 不保證純 E1。',geometry:'失去 β-H 發生在脫離基離開之後；不像常見 E2，需要 H 與尚連在受質上的 Br 同時反疊構形（antiperiplanar conformation）。',caution:'溶劑 ethanol 是 EtOH；加入 NaOEt 得到的 EtO⁻ 才是強鹼。兩者不能只因名稱相似就視為同一條件。',checks:[q('family','移除 β-H 與脫離基、形成 C=C，屬於？',['取代','消去'],'消去','這是消去的結構變化。'),q('role','此 E1 分支中，乙醇何時接受 β-H？',['碳陽離子形成後','在強鹼一步 E2 中'],'碳陽離子形成後','先形成碳陽離子，再失氫；EtOH 不等於 EtO⁻。'),q('solvent','對 ethanol／加熱條件，哪項較合理？',['可有 E1 與 SN1 競爭','一定全部變成烯類'],'可有 E1 與 SN1 競爭','不能用加熱當成純 E1 的證據。')]},
 e2:{family:'消去',type:'E2',kind:'e2',equation:'R–CH₂–CH(Br)–R′ + EtO⁻ → 烯類 + EtOH + Br⁻',definition:'乙氧基接受 β-H，同時形成雙鍵並使 Br 離去，是協同消去。',roles:'EtO⁻ 的氧孤對電子流向 β-H；C–H 鍵電子流向 Cα–Cβ 形成 π 鍵；C–Br 鍵電子流向 Br。',conditions:['EtO⁻ 是強鹼，也具有親核性。','此二級受質與加熱條件下，消去較有利。','仍須檢查可用 β-H 與反疊構形（antiperiplanar conformation），不能只認出強鹼就結束。'],solvent:'ethanol 為質子性溶劑，與加入的 NaOEt 必須分開看：EtOH 是溶劑，EtO⁻ 是強鹼。質子性溶劑不會自動把反應變成 E1；此處仍可走強鹼促進的 E2。',geometry:'常見 anti E2 要求 H–Cβ–Cα–Br 接近反疊構形（antiperiplanar conformation）；旋轉視角不會改變分子內部二面角。',caution:'EtO⁻ 也能做親核劑，因此 SN2 可能競爭。E2 不先形成碳陽離子。',checks:[q('family','此案例形成 C=C 的路徑是哪類？',['取代','消去'],'消去','β-H 與脫離基被移除，形成烯類。'),q('role','E2 中 EtO⁻ 的電子對指向哪裡？',['β-H','Cα'],'β-H','在此消去路徑，它作為鹼接受 β-H；攻擊碳屬於取代競爭路徑。'),q('solvent','ethanol 作溶劑是否保證 E1？',['否，要連同強鹼與受質判斷','是，質子性溶劑必定只有 E1'],'否，要連同強鹼與受質判斷','此條件加入了強鹼 EtO⁻，不能忽略。')]},
 chair:{family:'消去',type:'E2',kind:'chair',equation:'trans-1-bromo-2-methylcyclohexane → 3-methylcyclohexene（E2）',definition:'這一關仍是 E2，只是環己烷限制了哪些 β-H 能參與協同消去。',roles:'EtO⁻ 的電子對指向可反應的 C6 軸向 H；該 C–H 電子形成原 C1–C6 的 π 鍵，同時 Br 離去。',conditions:['強鹼支持消去。','Br 軸向時，C2 的軸向位置被 Me 占據。','C6 有與 Br 反式雙軸向的氫，可提供需要的幾何。'],solvent:'與上一關一樣，EtOH 是質子性溶劑，EtO⁻ 是強鹼。選對溶劑與試劑仍不足以決定這一關的產物，還要檢查環的構形。',geometry:'翻環不改變 up／down 或 cis／trans；它交換 axial／equatorial。anti E2 的幾何可優先於形成較多取代烯類的趨勢。',caution:'不能為了套用 Zaitsev 規則，就選一個不符合反式雙軸向排列的氫。',checks:[q('family','翻環後移除 H 與 Br 形成烯類，仍屬於？',['取代','消去'],'消去','翻環不是另一種反應類型；它提供可反應構形。'),q('role','Br 軸向時，本案例可用哪個氫？',['C6 軸向 H','C2 赤道向 H'],'C6 軸向 H','C2 的軸向位置是甲基；C6 的氫可符合要求。'),q('solvent','光憑 ethanol 就能決定這一關產物嗎？',['不能，還須看強鹼及構形','能，溶劑完全決定產物'],'不能，還須看強鹼及構形','幾何限制是本關關鍵。')]},
 compare:{family:'取代與消去比較',type:'A：SN2／B：E2',kind:'e2',equation:'相同受質：A 的 I⁻ 取代；B 的 EtO⁻ 促進消去',definition:'比較的重點是條件改變後，較有利路徑為何改變。受質相同不表示反應類型必定相同。',roles:'A：I⁻ 用電子對與 Cα 成鍵。B：EtO⁻ 用電子對與 β-H 成鍵；C–H 電子形成 π 鍵。',conditions:['A：I⁻ 鹼性弱、親核性良好，acetone 支持此 SN2。','B：EtO⁻ 為強鹼，ethanol／加熱條件下此受質偏向 E2。','兩者都要保留競爭反應與資料限制，不能虛構百分比。'],solvent:'A 的 acetone 與 B 的 ethanol 不同，但試劑與溫度也同時改變。因此這不是只改一個變因的溶劑實驗，不能把所有差異都歸因於溶劑。',geometry:'A 檢查背面進攻；B 檢查 anti β-H。兩份空間與機構證據要分別保存。',caution:'親核性、鹼性、溶劑、溫度與受質要一起判斷；單一標籤不是萬用決策樹。',checks:[q('family','A 與 B 的較有利路徑組合是？',['A 取代、B 消去','兩者必定完全相同'],'A 取代、B 消去','試劑、溶劑與溫度改變，可改變路徑趨勢。'),q('role','B 中 EtO⁻ 在 E2 路徑扮演什麼角色？',['接受 β-H 的鹼','只攻擊碳的親核劑'],'接受 β-H 的鹼','不能把 B 的消去箭頭畫成 A 的取代箭頭。'),q('solvent','可把 A/B 的差異全部歸因於溶劑嗎？',['不能，試劑與溫度也變了','可以，只看溶劑即可'],'不能，試劑與溫度也變了','多項條件同時改變，不能宣稱單一因素的因果效果。')]}
};

export function demonstrationFrames(kind){
 const spec=mechanismSpec(kind),frames=[];
 spec.steps.forEach((step,index)=>{
   frames.push({step:index,count:0,text:step.description});
   step.required.forEach((a,j)=>{const source=step.nodes.find(n=>n.id===a.from).label,target=step.nodes.find(n=>n.id===a.to).label;frames.push({step:index,count:j+1,text:`第 ${j+1} 支：電子從「${source}」流向「${target}」。${['sn2','e2','chair'].includes(kind)?'這些箭頭屬於同一步協同反應，逐支顯示不代表可分離的中間體。':'檢查成鍵、斷鍵與中間體電荷，再進入下一步。'}`});});
 });return frames;
}
export function guidedMechanism(kind){const work=newMechanism(kind),spec=mechanismSpec(kind);work.current=spec.steps.length-1;work.steps.forEach((s,i)=>{s.arrows=structuredClone(i<work.current?spec.steps[i].required:spec.steps[i].required.slice(0,1));s.confirmed=i<work.current;});return work;}
export function teachingReady(id,progress){const lesson=LESSONS[id];return Boolean(progress&&lesson.checks.every(q=>canonicalTermText(progress.answers?.[q.id])===canonicalTermText(q.answer))&&validateMechanism(lesson.kind,progress.practice).ok);}

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const blocks=rows=>rows.map(([title,text])=>`<div class="concept-block"><h3>${esc(title)}</h3><p>${esc(text)}</p></div>`).join('');

export function mountTeaching(root,{level,progress,onSave,onChallenge}){
 const lesson=LESSONS[level.id],steps=['這是哪種反應？','電子與試劑角色','溶劑與反應條件','看老師示範','一起完成練習'];
 if(!Number.isInteger(progress.stage)||progress.stage<0||progress.stage>4)progress.stage=0;
 progress.answers ||= {};if(!validWork(lesson.kind,progress.practice))progress.practice=guidedMechanism(lesson.kind);
 if(level.id==='compare'&&!['A','B'].includes(progress.demoCase))progress.demoCase='A';
 let child=null,destroyed=false,feedback='';
 function render(){
  child?.destroy();child=null;if(destroyed)return;
  const stage=progress.stage;
  root.innerHTML=`<section class="lesson"><div class="lesson-intro"><div><p class="chapter-label">先理解，再動手</p><h2>這一關先學 ${esc(lesson.type)}</h2></div><p>每關約 8–12 分鐘教學，再進入獨立挑戰。先備：基本鍵結、電荷與酸鹼概念。</p></div><nav class="lesson-steps" aria-label="教學步驟">${steps.map((name,i)=>`<button type="button" data-teach-stage="${i}" class="${i===stage?'active':''}" aria-current="${i===stage?'step':'false'}"><span>${i+1}</span>${esc(name)}</button>`).join('')}</nav><div id="lesson-content"></div><div class="lesson-navigation"><button type="button" data-teach-prev ${stage===0?'disabled':''}>上一步</button><span>${stage+1}／5</span><button type="button" class="primary" data-teach-next ${stage===4?'hidden':''}>接著學：${esc(steps[stage+1]||'')}</button></div></section>`;
  const content=root.querySelector('#lesson-content');
  if(stage===0)content.innerHTML=`<div class="reaction-summary"><span class="reaction-family">${esc(lesson.family)}</span><h3>${esc(lesson.type)}：${esc(lesson.definition)}</h3><p class="reaction-equation">${esc(lesson.equation)}</p></div><p class="lesson-lead">先看結構變化，再看機構：新基團取代脫離基，叫「取代」；移除鄰位氫與脫離基、形成雙鍵，叫「消去」。</p><div class="table-wrap"><table class="reaction-table"><caption>四種反應怎麼分？S＝取代、N＝親核、E＝消去。</caption><thead><tr><th>類型</th><th>結構變化</th><th>機構關鍵</th></tr></thead><tbody>${REACTION_TYPES.map(t=>`<tr class="${lesson.type.includes(t.id)?'current-type':''}"><th>${t.id}<small>${t.family}</small></th><td>${esc(t.change)}</td><td>${esc(t.path)}</td></tr>`).join('')}</tbody></table></div><p class="lesson-note">${esc(lesson.caution)}</p><details class="lesson-details"><summary>名稱中的 1、2 是什麼意思？</summary>${REACTION_TYPES.filter(t=>lesson.type.includes(t.id)).map(t=>`<p>${t.id}：${esc(t.number)} ${esc(t.rate)}。速率式須在適用條件下使用。</p>`).join('')}</details>`;
  if(stage===1)content.innerHTML=`<h3 class="lesson-title">先找「誰有電子、誰接受電子」</h3><p class="case-connection">這一關：${esc(lesson.roles)}</p><div class="concept-grid">${blocks(FOUNDATIONS.electrons)}</div><h3 class="lesson-title">親核性與鹼性分開想</h3><div class="concept-grid">${blocks(FOUNDATIONS.reagents)}</div>`;
  if(stage===2)content.innerHTML=`<h3 class="lesson-title">為什麼這組條件支持 ${esc(lesson.type)}？</h3><ol class="condition-list">${lesson.conditions.map(s=>`<li>${esc(s)}</li>`).join('')}</ol><p class="case-connection">${esc(lesson.solvent)}</p><div class="concept-grid">${blocks(FOUNDATIONS.solvents)}</div><p class="lesson-note">空間也要檢查：${esc(lesson.geometry)}</p>`;
  if(stage===3){
    const kind=level.id==='compare'&&progress.demoCase==='A'?'sn2':lesson.kind;
    content.innerHTML=`<h3 class="lesson-title">老師示範：每支箭頭為什麼這樣畫？</h3>${level.id==='compare'?'<div class="subnav"><button data-demo-case="A">案件 A：SN2</button><button data-demo-case="B">案件 B：E2</button></div>':''}<div data-teaching-demo></div><p class="lesson-note">${esc(lesson.geometry)} 示範不會替你填入挑戰答案或增加得分。</p>`;
    child=mountSpotlight(content.querySelector('[data-teaching-demo]'),{kind,frame:progress.frame,onFrameChange:frame=>{progress.frame=frame;onSave();}});
    content.querySelectorAll('[data-demo-case]').forEach(b=>b.onclick=()=>{progress.demoCase=b.dataset.demoCase;progress.frame=0;onSave();render();});
  }
  if(stage===4){
    content.innerHTML=`<h3 class="lesson-title">先判斷，再補完電子移動</h3><p class="lesson-lead">老師已在最後一步畫出第一支箭頭。請回答三個問題，再補上剩餘箭頭並確認機構；此處為引導練習，不計入正式評量。</p><form data-teaching-check>${lesson.checks.map(q=>`<fieldset class="teaching-question"><legend>${esc(q.prompt)}</legend>${q.options.map(option=>`<label class="option-row"><input type="radio" name="${q.id}" value="${esc(option)}" ${canonicalTermText(progress.answers[q.id])===canonicalTermText(option)?'checked':''}><span>${esc(option)}</span></label>`).join('')}</fieldset>`).join('')}<button type="submit">檢查我的理解</button><div class="lesson-check-feedback" role="status" ${feedback?'':'hidden'}>${esc(feedback)}</div></form><div data-guided-editor></div><div class="ready-panel"><h3>接著換你獨立完成</h3><p data-ready-status></p><button type="button" class="primary" data-start-independent>開始獨立挑戰</button><p class="report-note">若還不確定，可返回示範。教學練習與挑戰紀錄分開保存。</p></div>`;
    const form=content.querySelector('[data-teaching-check]');form.onchange=()=>{for(const q of lesson.checks)progress.answers[q.id]=form.elements[q.id].value;onSave();updateReady();};form.onsubmit=e=>{e.preventDefault();const wrong=lesson.checks.filter(q=>canonicalTermText(progress.answers[q.id])!==canonicalTermText(q.answer));feedback=wrong.length?wrong.map(q=>q.explanation).join(' '):'三個判斷都正確。再完成下方的電子移動，即可開始獨立挑戰。';const box=content.querySelector('.lesson-check-feedback');box.hidden=false;box.textContent=feedback;progress.checked=true;onSave();updateReady();};
    child=mountArrowEditor(content.querySelector('[data-guided-editor]'),{kind:lesson.kind,work:progress.practice,onChange:work=>{progress.practice=work;onSave();updateReady();},allowAI:false});
    function updateReady(){const ready=teachingReady(level.id,progress);content.querySelector('[data-ready-status]').textContent=ready?'理解檢查與引導機構已完成。挑戰將使用你原本的獨立作答，不會帶入示範答案。':'請完成三個理解判斷與引導機構；完成後即可進入挑戰。';content.querySelector('[data-start-independent]').disabled=!ready;}
    content.querySelector('[data-start-independent]').onclick=()=>{if(teachingReady(level.id,progress)){progress.completedAt=new Date().toISOString();onSave();onChallenge();}};updateReady();
  }
  root.querySelectorAll('[data-teach-stage]').forEach(b=>b.onclick=()=>{progress.stage=Number(b.dataset.teachStage);onSave();render();});root.querySelector('[data-teach-prev]').onclick=()=>{progress.stage--;onSave();render();};root.querySelector('[data-teach-next]').onclick=()=>{progress.stage++;onSave();render();};
 }
 render();return {destroy(){destroyed=true;child?.destroy();}};
}
