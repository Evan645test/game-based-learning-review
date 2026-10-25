const commonSequences = [
  ['concerted-sub','親核劑成鍵與 C–Br 斷鍵同步發生；沒有碳陽離子中間體'],
  ['cation-sub','C–Br 先斷裂 → 碳陽離子 → 親核進攻；水進攻後再去質子化'],
  ['cation-elim','C–Br 先斷裂 → 碳陽離子 → 鹼移走 β-H 並形成雙鍵'],
  ['concerted-elim','鹼取走 β-H、形成 C=C 與 C–Br 斷裂在同一步發生']
];
const reasons = (...rows) => rows.map(([id,text,correct])=>({id,text,correct}));
export const LEVELS = [
  {
    id:'sn2', name:'背面入口', mechanism:'SN2', kind:'sn2', subtitle:'用空間方向解釋瓦登反轉',
    substrate:'單一對映異構物的 2-bromobutane', reagent:'NaI', solvent:'acetone',temperature:'25 °C',
    brief:'碘離子準備取代溴。先觀察受質，再調整進攻方向：從哪一側接近反應碳，才能支持你提出的機構？',
    objective:'將 Nu–Cα–Br 調至背面方向，保存空間證據，再完成機構與產物判斷。',
    answer:'SN2', mechanisms:['SN1','SN2','E1','E2'],
    reasons:reasons(['nuc','I⁻ 親核性良好，鹼性較弱',true],['solvent','極性非質子性溶劑有利於此親核取代',true],['cation','二級受質在任何溶劑中都先形成碳陽離子',false],['heat','只要有鹵素就一定發生消去',false]),
    sequences:commonSequences,sequenceAnswer:'concerted-sub',
    products:[['inversion','2-iodobutane；反應中心發生瓦登反轉'],['retain','2-iodobutane；空間配置必定保留'],['alkene','butene；碘離子只會移走氫']],productAnswer:'inversion',
    competitions:[['minor','此組條件偏向 SN2；不能把二級受質視為永遠沒有競爭反應'],['none','此受質在任何條件下都只可能 SN2']],competitionAnswer:'minor',
    hints:['先分開考慮「親核性」與「鹼性」。I⁻ 容易攻擊碳，不等於容易移走 β-H。','看 C–Br 的另一側。轉動整個分子只改視角，請用「進攻角」改變 I⁻ 的位置。','讓 Nu–Cα–Br 接近 180°；選擇同步成鍵、斷鍵的機構，再檢查產物空間反轉。'],
    explanation:'I⁻ 在 acetone 中是良好親核劑，對此二級受質偏向 SN2。從 C–Br 背面進攻，成鍵與斷鍵協同進行。瓦登反轉不等於任何反應都能直接把 R 改寫成 S；仍需重新套用 CIP 規則。',
  },
  {
    id:'sn1',name:'平面岔路',mechanism:'SN1',kind:'sn1',subtitle:'先看中間體，再判斷兩面進攻',
    substrate:'tert-butyl bromide',reagent:'H₂O（溶媒解）',solvent:'富水介質',temperature:'室溫',
    brief:'體積大的三級受質在富水條件中進行取代。讓脫離基離開，再從不同方向檢視反應中心。',
    objective:'建立平面碳陽離子，分別切換兩面進攻並保存證據。tert-butyl 本身不具手性。',
    answer:'SN1',mechanisms:['SN1','SN2','E1','E2'],
    reasons:reasons(['tertiary','三級受質可形成較穩定的碳陽離子',true],['water','水是弱親核／弱鹼的質子性溶劑',true],['back','三級受質的背面進攻最容易',false],['strong','水的強鹼性會保證 E2',false]),
    sequences:commonSequences,sequenceAnswer:'cation-sub',
    products:[['alcohol','tert-butanol；水進攻後須去質子化'],['racemic','tert-butanol 必定是兩種對映異構物各半'],['butene','只可能得到 but-1-ene']],productAnswer:'alcohol',
    competitions:[['e1','同一碳陽離子也可能進入 E1；不指定未提供的產物百分比'],['none','形成碳陽離子後不可能消去']],competitionAnswer:'e1',
    hints:['檢查三級碳的立體障礙，以及水作為親核劑的性質。','用「機構步驟」先讓 C–Br 斷裂；此時三個 C–C 鍵圍繞平面碳陽離子。','切換「前面進攻」及「背面進攻」。本受質有三個相同甲基，因此兩面進攻不會形成一對對映異構物。'],
    explanation:'三級受質與富水介質支持 SN1 取代路徑；水進攻產生氧陽離子後，需再去質子化。E1 可競爭。此模型的三個甲基相同，不能由它宣稱產生外消旋產物；一般手性 SN1 也不保證精確 50：50。',
  },
  {
    id:'e1',name:'共同起點',mechanism:'E1',kind:'e1',subtitle:'從碳陽離子追蹤消去分支',
    substrate:'2-bromo-2-methylbutane',reagent:'EtOH（弱鹼／溶劑）',solvent:'ethanol',temperature:'加熱',
    brief:'此案件已觀察到烯類產物。請解釋其中的消去路徑，不需假設整瓶反應只發生一種機構。',
    objective:'先建立碳陽離子，再選擇乙基側 β-H，追蹤較多取代烯類的形成。',
    answer:'E1',mechanisms:['SN1','SN2','E1','E2'],
    reasons:reasons(['cation','三級受質可先離解形成碳陽離子',true],['weak','乙醇是弱鹼；消去可由碳陽離子後續失去 β-H 進行',true],['only','加熱代表 SN1 完全不可能',false],['concert','沒有強鹼也保證一步 E2',false]),
    sequences:commonSequences,sequenceAnswer:'cation-elim',
    products:[['more','2-methyl-2-butene 是此消去分支通常較有利的烯類'],['less','只能形成 2-methyl-1-butene'],['none','沒有 β-H，因此不可能生成烯類']],productAnswer:'more',
    competitions:[['sn1','SN1 與 E1 共享中間體；加熱不足以證明 E1 是唯一或必然主要路徑'],['only','只要加熱，全部受質必定轉成烯類']],competitionAnswer:'sn1',
    hints:['題目問的是「已觀察到烯類的形成路徑」，而非要求你虛構整體產物比例。','先使 Br 離開，接著找鄰碳上的氫。E1 的失氫發生在脫離基離開之後。','選擇乙基側的 β-H 可生成 2-methyl-2-butene；比較另一側形成的較少取代烯類。'],
    explanation:'三級受質先形成碳陽離子，乙醇再移走 β-H 形成烯類。此 E1 消去分支通常較有利於較多取代的 2-methyl-2-butene。SN1 可同時競爭，不能只憑加熱推定消去百分比。',
  },
  {
    id:'e2',name:'同步斷鍵',mechanism:'E2',kind:'e2',subtitle:'把反疊構形（antiperiplanar conformation）變成可量測的證據',
    substrate:'2-bromobutane',reagent:'NaOEt',solvent:'ethanol',temperature:'加熱',
    brief:'強鹼存在時，二級受質偏向消去。選一個 β-H，旋轉真正的 Cα–Cβ 單鍵，找出常見 anti 路徑。',
    objective:'選取 β-H，將 H–Cβ–Cα–Br 二面角調至接近 180°並保存。',
    answer:'E2',mechanisms:['SN1','SN2','E1','E2'],
    reasons:reasons(['base','EtO⁻ 是強鹼，可移走 β-H',true],['secondary','此二級受質在強鹼與加熱條件下偏向消去',true],['cation','E2 必定先形成可分離碳陽離子',false],['only','只要是二級受質就不會有 SN2',false]),
    sequences:commonSequences,sequenceAnswer:'concerted-elim',
    products:[['butenes','形成 butenes；2-butene 通常較有利，E／Z 需依構形判斷'],['onlyz','不論構形都只形成 (Z)-2-butene'],['alcohol','唯一產物是 2-butanol']],productAnswer:'butenes',
    competitions:[['sn2','EtO⁻ 也有親核性，SN2 可競爭；本條件偏向 E2'],['none','強鹼在任何受質都不會參與取代']],competitionAnswer:'sn2',
    hints:['鹼抽走的是 β-H。請先選 Hβ1 或 Hβ2，而不是只轉動攝影機。','用二面角滑桿轉動 Cα–Cβ 鍵，觀察 Newman 投影中的 H 與 Br。','讓所選 H–Cβ–Cα–Br 接近 180°；E2 的失氫、成雙鍵與離去在同一步發生。'],
    explanation:'EtO⁻ 在此條件下使 E2 較有利。常見 anti 路徑需要合適的 H–Cβ–Cα–Br 二面角。消去協同進行，不形成碳陽離子；區域與 E／Z 結果仍須依受質及反應構形判斷。',
  },
  {
    id:'chair',name:'椅式通道',mechanism:'E2',kind:'chair',subtitle:'當空間限制優先於產物取代程度',
    substrate:'trans-1-bromo-2-methylcyclohexane',reagent:'NaOEt',solvent:'ethanol',temperature:'加熱',
    brief:'最穩定的雙赤道向椅式，未必就是反應構形。翻環後，逐一檢查兩個鄰碳上是否存在可消去的氫。',
    objective:'讓 Br 位於軸向，選取 C6 上與它反式雙軸向的 H6。',
    answer:'E2',mechanisms:['SN1','SN2','E1','E2'],
    reasons:reasons(['axial','椅式環己烷的 anti E2 需要反式雙軸向排列',true],['occupied','Br 軸向時，C2 的軸向位置由甲基占據',true],['zaitsev','只要較多取代，任何 β-H 都能直接消去',false],['flip','翻環會把 trans 異構物變成 cis',false]),
    sequences:commonSequences,sequenceAnswer:'concerted-elim',
    products:[['three','3-methylcyclohexene；由原 C1–C6 形成雙鍵'],['one','1-methylcyclohexene；不需檢查 C2 的氫'],['none','Br 起初赤道向，因此整個分子永遠不能 E2']],productAnswer:'three',
    competitions:[['geometry','幾何限制可排除較多取代烯類路徑；翻環構形的比例也影響反應速率'],['rule','Zaitsev 規則永遠凌駕空間幾何']],competitionAnswer:'geometry',
    hints:['先比較兩個椅式：Br 與甲基的 up／down 不變，axial／equatorial 互換。','把 Br 切到軸向。C2 上與 Br 反式的軸向位置，目前是氫還是甲基？','C2 的軸向位置被甲基占據；選擇 C6 的軸向 H6，形成原 C1–C6 的雙鍵。'],
    explanation:'trans-1,2 異構物在雙軸向反應構形中，Br 與甲基都在軸向。C2 上的氫為赤道向，不能提供所需排列；C6 軸向氫可以。因此形成 3-methylcyclohexene，幾何限制優先。',
  },
  {
    id:'compare',name:'條件改造',mechanism:'綜合',kind:'compare',subtitle:'同一受質，兩份有證據的反應報告',
    substrate:'2-bromobutane（兩份案件）',reagent:'A：NaI ／ B：NaOEt',solvent:'A：acetone ／ B：ethanol',temperature:'A：25 °C ／ B：加熱',
    brief:'A 與 B 使用同一受質。先保存 A 的進攻方向，再切換 B 保存消去構形，解釋為什麼條件改變會改變較有利路徑。',
    objective:'分別完成 A 的 SN2 與 B 的 E2 空間證據，提交比較報告。',
    answer:'SN2 → E2',mechanisms:['SN2 → E2','SN1 → E1','E2 → SN2','SN2 → SN2'],
    reasons:reasons(['a','A 的 I⁻ 親核性良好且鹼性弱，acetone 有利於此取代',true],['b','B 的 EtO⁻ 強鹼性與加熱條件使消去較有利',true],['same','受質相同，所以反應機構必定相同',false],['solvent','只改溶劑就足以精確預測全部產物比例',false]),
    sequences:[['two','A：背面一步取代；B：β-H 與 Br 同步消去'],['cation','A 與 B 都必須先形成碳陽離子'],['none','A 與 B 都沒有成鍵或斷鍵']],sequenceAnswer:'two',
    products:[['different','A：瓦登反轉的取代物；B：烯類，需檢查構形與選擇性'],['same','兩者都只形成相同取代物'],['percentage','只憑這些條件就能算出每種產物的精確百分比']],productAnswer:'different',
    competitions:[['limited','可提出較有利路徑；精確比例仍需實驗或適用的動力學資料'],['certain','只要過關分數高，預測產率就必定是 100%']],competitionAnswer:'limited',
    hints:['請把兩份案件分開分析：親核性與鹼性、溶劑、溫度各扮演什麼角色？','切換 A、B 模型。A 需要背面進攻證據；B 需要選 β-H 與 anti 二面角證據。','比較 A 的 SN2 與 B 的 E2。你能判斷趨勢，但不能從操作角度直接算出產物比例。'],
    explanation:'相同受質可以因試劑、溶劑與溫度改變而偏向不同路徑。A 偏向 SN2，B 偏向 E2；本原型的模型與角度用來支持機構推理，不是產率或反應速率的計算器。',
  }
];

function question(id,dimension,points,prompt,options,answer,explanation,spatial=null) {
  return {id,dimension,points,prompt,options:options.map((text,i)=>[String(i),text]),answer:String(answer),explanation,spatial,mechanism:id==='arrows-sn'?'sn2':id==='arrows-e'?'e2':null};
}
export function examItems(form) {
  const n = form === 'pre' ? 0 : form === 'post' ? 1 : 2;
  const primary=['1-bromobutane','1-bromopentane','1-bromohexane'][n];
  const tertiary=['tert-butyl bromide','2-bromo-2-methylbutane','3-bromo-3-methylpentane'][n];
  const secondary=['2-bromobutane','2-bromopentane','3-bromohexane'][n];
  return [
    question('route-sn2','條件判斷',10,`${primary} 與 NaI 在 acetone、25 °C 反應。哪個判斷最合理？`,['SN1：一級受質容易離解','SN2：較小立體障礙、良好親核劑及極性非質子性溶劑','E1：任何鹵化物都先形成碳陽離子','E2：I⁻ 是強鹼'],1,'一級受質、I⁻ 的親核性與極性非質子性溶劑共同支持 SN2。'),
    question('route-sn1','條件判斷',10,`${tertiary} 在富水、室溫條件下觀察到取代產物。哪個機構解釋較合理？`,['SN2：三級受質背面容易接近','SN1：三級碳陽離子形成後被水捕捉','E2：水保證一步消去','只要產物是醇就無法討論機構'],1,'三級受質的位阻與碳陽離子穩定性支持 SN1 取代路徑；仍可有 E1 競爭。'),
    question('route-e1','條件判斷',10,`${tertiary} 在乙醇中加熱，已觀察到烯類。哪個解釋合理？`,['一定是 E2，因為只要加熱就有強鹼','E1：先離解，再失去 β-H；不能據此排除 SN1','一定只發生 E1，沒有取代物','沒有強鹼就不可能形成烯類'],1,'弱鹼質子介質中的三級受質可由 E1 形成烯類，SN1 可同時競爭。'),
    question('route-e2','條件判斷',10,`${secondary} 與 NaOEt 在 ethanol 中加熱。哪個判斷較合理？`,['E2 較有利：強鹼移走 β-H，SN2 仍可能競爭','SN1 唯一：所有二級受質都先離解','SN2 唯一：EtO⁻ 不具鹼性','E1 唯一：加熱決定全部機構'],0,'強鹼及二級受質支持 E2；不能否認乙氧基的親核性。'),
    question('arrows-sn','機構理解',10,'比較 SN1 與 SN2，哪個敘述正確？',['兩者都先形成碳陽離子','SN2 一步協同；SN1 先離去再親核進攻，中性親核劑進攻後可能須去質子化','SN2 的第一步是鹼移走 β-H','SN1 的彎箭頭必須從正電荷指向電子對'],1,'彎箭頭表示電子移動，從孤對電子或化學鍵出發；SN2 沒有碳陽離子中間體。'),
    question('arrows-e','機構理解',10,'哪組電子移動對應常見 E2？',['C–Br 先單獨斷裂，再等待碳陽離子形成','鹼的電子對 → β-H；C–H 鍵 → Cα–Cβ；C–Br 鍵 → Br，同步發生','Br 的正電荷 → β-H，先形成自由基','先生成烯類，再找一個氫移除'],1,'三組電子移動在同一步進行，沒有碳陽離子中間體。'),
    question('space-sn2','空間推理',15,'操作下方新視角模型：保存可支持 SN2 的進攻方向，再選擇正確推論。',['正面進攻支持保留配置','背面進攻支持瓦登反轉；R／S 仍需重新判定','背面進攻代表一定形成外消旋混合物'],1,'背面進攻支持反轉；R／S 取決於產物 CIP 優先序。','sn2'),
    question('space-e2','空間推理',15,n === 0 ? '操作下方模型：選 β-H 並保存常見 anti E2 反應構形。' : '模型從不同構形開始。選 β-H，重新建立並保存 anti E2 證據。',['只轉攝影機就能改變分子二面角','H–Cβ–Cα–Br 接近 180°；改變的是單鍵構形','H 與 Br 只要在螢幕上重疊就能證明反應'],1,'反應構形由分子內部座標決定，螢幕投影重疊不等於 anti。','e2'),
    question('limits','證據判讀',10,['有人說「加熱就一定只發生 E1」。你如何評估？','有人說「模型的角度正確，所以產率必定 100%」。你如何評估？','有人說「三級受質永遠只發生 SN1」。你如何評估？'][n],['這是普遍成立的規則','此說法過度推論；須綜合受質、試劑、溶劑及資料，必要時以產物分析或動力學驗證','只需把模型轉快一點便可證明','遊戲得分越高，該化學主張越正確'],1,'幾何與一般反應趨勢不能直接提供精確產率，也不能排除所有競爭路徑。')
  ];
}

export const SOURCES = [
  ['極性反應、親核與親電角色','https://openstax.org/books/organic-chemistry/pages/6-3-polar-reactions'],
  ['SN2：試劑、立體障礙與溶劑效應','https://openstax.org/books/organic-chemistry/pages/11-3-characteristics-of-the-sn2-reaction'],
  ['SN1：受質、脫離基與溶劑效應','https://openstax.org/books/organic-chemistry/pages/11-5-characteristics-of-the-sn1-reaction'],
  ['SN2 機構與背面進攻','https://openstax.org/books/organic-chemistry/pages/11-2-the-sn2-reaction'],
  ['SN1 與立體化學','https://openstax.org/books/organic-chemistry/pages/11-4-the-sn1-reaction'],
  ['E2 機構與幾何','https://openstax.org/books/organic-chemistry/pages/11-8-the-e2-reaction-and-the-deuterium-isotope-effect'],
  ['環己烷 E2 與椅式','https://openstax.org/books/organic-chemistry/pages/11-9-the-e2-reaction-and-cyclohexane-conformation'],
  ['E1 與 SN1 的競爭','https://openstax.org/books/organic-chemistry/pages/11-10-the-e1-and-e1cb-reactions']
];
