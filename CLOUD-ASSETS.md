# 船模載入與雲端分流（2026-11-18）

這個版本保留原始模型面數與材質。網頁繼續放在 GitHub Pages，模型可由 jsDelivr 傳送，不需要另開帳號或買網域。瀏覽器仍自行繪製 3D；CDN 改善傳輸，不會把 GPU 運算搬到雲端。

## 已實作

1. 每個模型檔案由 SHA-256 和檔案長度識別。下載完成通過校驗後，寫入瀏覽器 Cache Storage。重新整理時可直接讀取同一版本；快取被清除、儲存空間不足或 API 不可用時仍能下載。
2. `asset-host.json` 指定已公開 GitHub commit 的 CDN 路徑。固定版本與一年不可變快取相配，不依賴會變動的分支名稱。五個原始模型檔案保持原位，作為原站備援。
3. CDN 在 1.2 秒內沒有開始傳資料，原站就加入競速；第一個完整且校驗正確的結果獲勝，取消另一個請求。正常開始傳輸的 CDN 不會觸發額外原站下載；傳輸超時、檔案錯誤和服務故障也會回原站。
4. 原站若回傳舊版本的成功回應，會強制重新下載再校驗。失敗回應和校驗錯誤不寫入模型快取。
5. 三船水線、船身體積切面與開口資料已預先計算。只在版本不符、檔案缺失或損壞時，才使用原來的分段計算。三個 sidecar 合計約 449 KB，不需要改模型。
6. 準備完成後解除大型原始下載 Promise 的快取引用；已準備船模仍保留供切船使用。下載層只共享進行中的請求，不持續保留另一份壓縮資料在記憶體中。

## 配置與更新

- `asset-host.json` 的 `baseURL: null` 可關閉 CDN，仍使用持久快取與預先計算資料。
- `layout: github` 使用 commit 固定路徑；`layout: content-addressed` 可接日後自有物件儲存服務的雜湊路徑。
- 現有 commit 已含五個模型檔，新的水線資料先由網頁原站傳送。未來換模型時，應在新模型發布後更新 CDN commit；若未更新，內容校驗會拒絕舊 CDN 資料並改用原站。
- manifest 與載入模組的 HTML 引用帶內容版本，避免新網頁讀到舊的資源清單。

重新產生水線資料：

1. 執行 `python3 scripts/build-asset-manifest.py`。
2. 執行 `python3 scripts/create-water-bake.py`，在本地瀏覽器開啟 `bake-local.html?resetBoat=luxury&skipIntro=1`。這個隔離頁面強制實際計算，將結果放在 `#bake-output`，可保存其 JSON 內容。
3. 執行 `python3 scripts/import-water-bake.py <保存的JSON路徑>`。
4. 再執行 manifest 建置與 `python3 sync_routes.py`，並執行 `tests/asset-manifest.mjs`。
5. 可用 `python3 scripts/create-water-bake.py --verify` 產生隔離驗證頁。它禁止執行即時計算；三船都完成才代表預先計算資料確實被使用。

發布檔案包括五個 HTML、`asset-loader.mjs`、`asset-manifest.mjs`、`asset-host.json`，以及 manifest 指向的三個 `water-data/*.json.gz`。保留既有共用資源與五個模型原站備援。烘焙頁、驗證頁及本地效能診斷頁不屬於發布資源。

## 實測與限制

同一個 16,777,216-byte 遊艇分段，本輪依序請求：CDN 冷快取 6.18 秒，CDN 快取命中 2.27 秒，GitHub 原站 3.00 秒。每次都校驗原始內容；這是少數請求的觀察，不是各地速度保證，也不能直接和前一輪 8.3 秒比較成固定改善比例。CDN 冷快取可能較慢，競速備援因此保留。另一輪首次取檔中，帆船兩個分段分別用了 9.78 秒、21.21 秒，亦支持不能只依賴單一 CDN；五個模型檔案皆已確認 HTTP 200、跨網域許可與正確 SHA-256。

重複載入的重點是先避免再次傳輸模型。模型解析、貼圖上傳、材質處理和 HD 持續繪製仍在使用者裝置執行，這些成本不會因換 CDN 消失。

官方參考：
- https://www.jsdelivr.com/documentation — GitHub 固定版本路徑、單檔 20 MB／package 150 MB 預設限制；本案最大分段為 16 MB。
- https://www.jsdelivr.com/terms/acceptable-use-policy — 服務允許合理的應用／遊戲資源使用，不作為一般檔案備份服務。
- https://developers.cloudflare.com/r2/buckets/public-buckets/ — 未來若改 R2，正式 CDN 快取需搭配自訂網域；`r2.dev` 是開發用途，這輪不需要建立 R2。
