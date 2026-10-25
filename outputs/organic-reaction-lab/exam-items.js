// Post-test and delayed test: every reaction type, substrates not used in the course (far transfer).
// reasons[0] / products[0] are correct; the UI shuffles them with a fixed seed.
const q=(id,type,substrate,reagent,conditions,reasons,products,explain)=>({id,type,substrate,reagent,conditions,reasons,products,explain});
export const EXAM_FORMS={
 post:[
  q('p-sn2','sn2','1-溴戊烷','NaCN','DMSO，25 °C',['一級受質、CN⁻ 良好親核劑、極性非質子性溶劑','一級碳陽離子容易形成','CN⁻ 是強鹼，拔 β-H'],['hexanenitrile（CH₃(CH₂)₄CN）','1-pentene','1-pentanol'],'背面一步取代，碳鏈多一個碳。'),
  q('p-sn1','sn1','2-溴-2-甲基己烷','H₂O','室溫，含水溶劑',['三級受質形成穩定碳陽離子，水為弱親核質子性溶劑','三級受質背面暢通','水是強鹼'],['2-methyl-2-hexanol','2-methyl-2-hexene（唯一）','1-bromo-2-methylhexane'],'離解、水進攻、去質子化。'),
  q('p-e2','e2','2-溴己烷','NaOEt','乙醇，加熱',['二級受質＋強鹼＋加熱，鹼拔 β-H 一步消去','二級碳陽離子先形成','EtO⁻ 是弱鹼'],['2-hexene（主要，E/Z）與少量 1-hexene','2-ethoxyhexane（唯一）','2-hexanol'],'Zaitsev：取代較多的 2-hexene 為主。'),
  q('p-e1','e1','1-溴-1-甲基環戊烷','CH₃CH₂OH（溶劑）','加熱，得到烯',['三級受質在弱鹼溶劑中先離解，再失去 β-H','強鹼一步消去','一級受質 SN2'],['1-methylcyclopentene（主要）','methylenecyclopentane（唯一）','cyclopentanol'],'碳陽離子路徑，取代較多的環內烯為主。'),
  q('p-addhx','addhx','1-乙基環己烯','HCl','醚類溶劑',['π 鍵進攻 H，形成三級碳陽離子，Cl⁻ 接住','形成二級碳陽離子','氯鎓離子反式加成'],['1-chloro-1-ethylcyclohexane','1-chloro-2-ethylcyclohexane','trans-1,2-dichloro-1-ethylcyclohexane'],'馬可尼可夫方向。'),
  q('p-hyd','hydration','2-甲基-2-戊烯','H₂O，H₂SO₄（催化）','稀酸、大量水',['質子加到取代較少的雙鍵碳，三級碳陽離子被水捕捉再去質子化','醇在濃酸中脫水','溴鎓離子'],['2-methyl-2-pentanol','2-methyl-3-pentanol','2-methyl-2-pentene（不反應）'],'OH 接在取代較多的碳。'),
  q('p-halo','halogenation','環庚烯','Cl₂','CH₂Cl₂',['氯鎓離子中間體，Cl⁻ 從背面打開，反式加成','開放碳陽離子，順反混合','HCl 加成'],['trans-1,2-dichlorocycloheptane','cis-1,2-dichlorocycloheptane','chlorocycloheptane'],'兩個 Cl 來自雙鍵相反兩面。'),
  q('p-rearr','rearrangement','3-甲基-1-戊烯','HBr','醚類溶劑',['先形成二級碳陽離子，C3 上的 H 帶電子對位移，變成三級碳陽離子','直接形成三級碳陽離子','溴鎓離子不重排'],['3-bromo-3-methylpentane（重排）與 2-bromo-3-methylpentane','只有 1-bromo-3-methylpentane','3-methylpentane'],'1,2-氫位移讓正電移到三級碳。'),
  q('p-dehyd','dehydration','2-甲基-2-戊醇','H₂SO₄','加熱',['三級醇：質子化、失水成碳陽離子、失去 β-H（E1）','OH⁻ 直接離開','稀酸大量水，加水'],['2-methyl-2-pentene（主要）','2-methyl-1-pentene（唯一）','2-methylpentane'],'Zaitsev：取代較多的烯為主。'),
  q('p-bulky','e2','2-溴-2-甲基己烷','KOtBu（t-BuO⁻）','t-BuOH，加熱',['三級受質＋體積大的強鹼：一步消去，較易拔取代較少一側的 β-H','體積大的鹼走 SN2','先形成碳陽離子'],['2-methyl-1-hexene（主要）','2-methyl-2-hexene（唯一）','2-tert-butoxy-2-methylhexane'],'體積大的鹼使取代較少的烯比例提高，與 Zaitsev 預測不同。')
 ],
 delay:[
  q('d-sn2','sn2','1-溴-3-甲基丁烷','NaSH','DMF',['一級受質、HS⁻ 良好親核劑且弱鹼、非質子性溶劑','一級碳陽離子容易形成','HS⁻ 是強鹼'],['3-methyl-1-butanethiol','3-methyl-1-butene','3-methyl-1-butanol'],'HS⁻ 從背面一步取代。'),
  q('d-sn1','sn1','3-氯-3-乙基戊烷','CH₃OH（溶劑）','室溫，溶劑解',['三級受質離解，甲醇捕捉碳陽離子後去質子化','三級受質 SN2','甲醇是強鹼'],['3-ethyl-3-methoxypentane','3-ethyl-2-pentene（唯一）','3-ethylpentane'],'弱親核溶劑捕捉碳陽離子。'),
  q('d-e2','e2','3-溴戊烷','NaOEt','乙醇，加熱',['二級受質＋強鹼＋加熱，一步消去','二級碳陽離子','EtO⁻ 只當親核劑'],['2-pentene（E/Z）','3-ethoxypentane（唯一）','3-pentanol'],'兩側 β-H 等價，都得到 2-pentene。'),
  q('d-e1','e1','3-氯-3-乙基戊烷','CH₃CH₂OH（溶劑）','加熱，得到烯',['三級受質在弱鹼溶劑中加熱：碳陽離子失去 β-H','強鹼一步消去','SN2'],['3-ethyl-2-pentene','3-ethyl-1-pentene','3-ethylpentane'],'與 SN1 同一中間體，加熱得到烯。'),
  q('d-addhx','addhx','2-甲基-2-戊烯','HBr','醚類溶劑',['質子加到取代較少的雙鍵碳，三級碳陽離子被 Br⁻ 接住','形成二級碳陽離子','溴鎓離子'],['2-bromo-2-methylpentane','3-bromo-2-methylpentane','2-methylpentane'],'馬可尼可夫方向。'),
  q('d-hyd','hydration','2-甲基-1-戊烯','H₂O，H₃O⁺','稀酸、大量水',['質子加到末端 CH₂，三級碳陽離子由水捕捉','形成一級碳陽離子','醇脫水'],['2-methyl-2-pentanol','2-methyl-1-pentanol','2-methyl-1-pentene（不反應）'],'OH 接在三級碳。'),
  q('d-halo','halogenation','1-丁烯','Br₂','CH₂Cl₂',['溴鎓離子中間體，Br⁻ 打開三元環','碳陽離子重排','HBr 加成'],['1,2-dibromobutane','2-bromobutane','1-bromobutane'],'兩個 Br 分別加到原雙鍵兩碳。'),
  q('d-rearr','rearrangement','乙烯基環戊烷','HBr','醚類溶劑',['二級碳陽離子旁的環上 C–H 位移，正電移到三級環碳','直接得到三級碳陽離子','溴鎓離子'],['1-bromo-1-ethylcyclopentane（重排）','只有 (2-bromoethyl)cyclopentane','bromocyclopentane'],'經碳陽離子就要檢查重排。'),
  q('d-dehyd','dehydration','1-甲基環戊醇','H₂SO₄','加熱',['三級醇 E1 脫水，取代較多的環內烯為主','醇被 SN2 取代','加水'],['1-methylcyclopentene（主要）','methylenecyclopentane（唯一）','1-methylcyclopentanol（不變）'],'質子化、失水、失 β-H。'),
  q('d-invert','sn2','(R)-2-氯丁烷','NaI','acetone',['二級受質、良好親核劑、非質子性溶劑：背面進攻使構形反轉','先形成平面碳陽離子','I⁻ 拔 β-H'],['(S)-2-iodobutane','(R)-2-iodobutane','2-butene'],'I 與 Cl 都是最高優先序，幾何反轉使 R 變 S。')
 ]
};
export const EXAM_POINTS={mech:3,reason:2,product:2,arrows:3};
export const examItems3=form=>EXAM_FORMS[form]||[];
