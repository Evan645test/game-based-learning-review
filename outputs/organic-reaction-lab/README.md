# 反應分流局：整合學習課程

原生 HTML／CSS／JavaScript 與 Python 標準函式庫，本機執行不需套件、CDN、帳號或 API 金鑰。原 index.html 與 academy.html 已共用同一入口；不再保留兩套教學或獨立六關。

## 本機啟動

本資料夾執行：

```sh
python3 server.py
```

Python 3.10 以上。開啟 http://127.0.0.1:8768/academy.html 。原 http://127.0.0.1:8768/index.html 會使用符合既有 CSP 的 entry.js 轉至相同介面，保留查詢與錨點。若連接埠占用可執行：

```sh
python3 server.py --port 8770
```

```sh
curl http://127.0.0.1:8768/health
```

伺服器只綁 loopback，只提供白名單資源及指定原文頁。必須透過 HTTP 使用 ES modules，不能直接雙擊 HTML。沒有發布、commit 或 push。

## 學習流程與內容配置（漸進交錯版，2026-10-26）

對象為大一有機入門、尚無反應機構概念的學生。目標是看到受質、試劑與條件後，能選出反應類型、說出判斷依據、預測產物並畫出電子箭頭。主程式為 learning-path.js（介面）與 course-path.js（內容）。

| 階段 | 新增類型 | 內容 |
| --- | --- | --- |
| 暖身 | — | 彎箭頭、親核劑／親電子劑、碳陽離子（平面、穩定性）、級數與 α／β 碳、脫離基、鹼性與親核性、溶劑、R/S／Newman／Zaitsev；每個觀念附不計分即時檢查。新使用者預設從此開始，可跳過、可回看。 |
| 1 | SN2、SN1 | 概念 → 對比觀察 → 補上流程圖分支 → 畫電子箭頭 → 混合練習（6 題） |
| 2 | ＋E2 | 同上（6 題） |
| 3 | ＋E1 | 同上（8 題） |
| 4 | HX 加成、酸催化加水、X₂ 加成 | 同上（8 題） |
| 5 | 碳陽離子重排、醇的酸催化脫水 | 同上（8 題） |
| 總混合練習 | 九類全部 | 不限題數，依最近錯誤加權出題、同類型不連續；顯示各類精熟度（最近 5 題） |

- 對比觀察：26 個例子（原 16 例＋新增 10 例）全部隱藏機構標籤，兩兩並排，先預測、再揭曉並播放三維機構；預測保留第一次結果、不計分。
- 流程圖隨階段長出分支；學生在每階段自行選出正確分支內容補上。混合練習時可打開對照，答後標出該題走過的路徑。
- 電子箭頭：每支箭頭的起點與終點都要正確。「檢查箭頭」第一層只指出哪一步要修，第二層才指出哪支箭頭及原因，之後可選本機 AI 換句話說（只從核可診斷中選，不自由生成化學敘述）。第一次檢查結果另存。
- 混合練習每題：反應類型、判斷依據、主要產物三題提交後回饋，再在正確類型的模板上畫箭頭。題庫 45 題（每類 5 題）。全程不擋關。
- 新增內容以 OpenStax《Organic Chemistry》為主並附頁碼（HX 加成 237–241、碳陽離子 244–252、重排 248–249、X₂ 加成 263–265、加水 267–268、脫水 262、604–605）；溴鎓離子三箭頭畫法標為教學補充。

新版第一次載入時，依使用者決定清除所有舊 `organic-` 開頭的課程進度、評量、觀看書籤及 PK 資料庫（legacy-data.js），只清一次；其他網站資料不受影響。PK 入口已移除，pk-state.js 等程式檔保留以便日後加回。舊 learning-course.js、guided-lesson.js、course-checks.js 不再由入口載入。

## 三維與畫面操作

- 試劑整體接近反應部位，電子對沿曲線移動，原鍵淡出、新鍵淡入；分段解說不代表增加中間體。
- 播放、暫停、上一段／下一段、重播及進度條常顯。旋轉／縮放先暫停，操作只改攝影機。
- 手機水平拖曳旋轉、垂直捲頁。放大使用同一播放器的 dialog，返回保留段落及焦點；Esc 可返回。
- 引導片段及完整例子使用不同觀看書籤，返回 PK／重載均可保留段落、進度與鏡頭，還原固定暫停。
- 動畫關鍵標籤與課內／評量三維標籤維持實際 14px。課內模型標籤有引線與避讓；Newman 說明使用 HTML 文字。
- 完整解說、視角設定、原文頁碼與中英術語按需展開。不同觀察與檢核工具一次只掛載一個。
- Me＝CH₃；評量／檢核模型採反應中心縮合表示。動畫採 XYZ 球棍與深度排序，但所有座標及插值均為教學幾何，非實測電子軌跡、量子化學或分子動力學。

## 評量

選做後測／延後測各 10 題、100 分，涵蓋九種反應類型，起始物都是課程與題庫沒出現過的分子（遠遷移；單元測試會檢查）。每題：反應類型 3、依據 2、產物 2、電子箭頭 3 分。箭頭依學生所選類型提供模板，類型選錯時箭頭不計分。評量中沒有 AI 或正誤提示，提交後顯示逐題對照。紀錄版本 path-assessment-v3，每次提交使用獨立鍵 `organic-assessment-v3:attempt:<id>`。題本尚未經學生試測校準，分數變化不代表 AI 或三維功能的因果效果。

## AI 與術語

AI 為選用的本機 Ollama，預設 http://127.0.0.1:11434 。按提示才傳送目前電子箭頭與規則診斷；模型只選核可診斷焦點及提問方式，不自由產生化學答案、不負責評分。逾時／無效回覆／無服務時，明確切回內建提示。

伺服器從 /api/tags 選第一個非 :cloud 模型，不下載模型。有已安裝的 qwen3.5:9b 時可明確指定：

```sh
OLLAMA_MODEL='qwen3.5:9b' python3 server.py
```

OLLAMA_HOST 選填且只接受 loopback HTTP。本輪未新增模型或服務；模型的實際運算位置仍由使用者的 Ollama 設定決定。

32 筆中英術語以國家教育研究院樂詞網化學學門查核，記錄在 terminology-audit.json；頁面提供英文與官方查核連結。採親核劑、親電子劑、脫離基、質子性／非質子性溶劑等譯詞。現行詞條不宣稱等同國立編譯館任一歷史版本逐字證明；未查得相符獨立詞條的去質子化、反式雙軸向與 E2 完整複合名稱，保留英文並標為教學用語。

## 保存與匯出

| 資料 | 儲存位置 |
| --- | --- |
| 學習路徑進度、預測、分支、箭頭與混合練習紀錄 | localStorage `organic-path-v3` |
| 三維觀看書籤 | `organic-demo-view-v3:<例子id>` |
| 評量紀錄／草稿 | `organic-assessment-v3:attempt:<id>`、`organic-assessment-v3:draft` |
| 資料版本（舊資料只清一次） | `organic-data-version` = 3 |

「紀錄與比較」可匯出 JSON（評量＋學習路徑）。儲存被拒或資料損毀時改以本頁記憶體繼續，並顯示提示。

## 驗證

2026-10-26 漸進交錯版：

```sh
node --test tests/*.test.mjs
```

```sh
PLAYWRIGHT_MODULE='/Users/evan_1/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs' node tests/path-browser.mjs
```

path-browser.mjs 走完整條路徑：舊資料清除、暖身、五階段（對比、補分支、分級提示箭頭、混合練習）、總混合練習、後測 100 分與延後測提早結束，以及 320／390／1280px 版面。下方較舊的瀏覽器腳本是先前四單元與 PK 介面的歷史驗收，不適用新版入口。

### 先前紀錄

Node.js 22 以上及 Python：

```sh
node --test tests/*.test.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
```

本機既有 Chrome／Playwright 測試環境：

```sh
PLAYWRIGHT_MODULE='/Users/evan_1/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs' node tests/integration-browser.mjs
PLAYWRIGHT_MODULE='/Users/evan_1/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs' node tests/no-pre-browser.mjs
PLAYWRIGHT_MODULE='/Users/evan_1/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs' node tests/integration-edges-browser.mjs
PLAYWRIGHT_MODULE='/Users/evan_1/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.mjs' node tests/pk-concurrency-browser.mjs
```

測試只在隔離瀏覽器執行，不改使用者既有資料；Playwright 不是執行原型的必要相依。舊 academy／teaching 等瀏覽器腳本保留為歷史流程證據，因獨立六關與重複教材入口已取消，不作新版驗收入口。

目前結果見 verification.json；整合流程與手機證據在 /private/tmp/organic-integration-verification/ 。Chrome 觸控模擬不等同實體手機、VoiceOver 或學生認知負荷／學習成效實證。

教材依 John McMurry／OpenStax《Organic Chemistry》第十版（2023）原文原則改編，CC BY-NC-SA 4.0。原 Markdown 及圖像歸檔唯讀；根目錄公開網站與 GitHub Pages 未變更。
