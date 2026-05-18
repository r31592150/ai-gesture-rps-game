# ✊ AI 手勢偵測猜拳小遊戲 (VSCode 改良版)

這是一個基於 **MediaPipe Hands** 與 **p5.js (Canvas API)** 開發的網頁遊戲。玩家可以透過攝影機比出「石頭、布、剪刀」與電腦進行對決。

## 🌟 改良重點

1.  **UI/UX 提升**：
    *   採用毛玻璃效果 (Backdrop Filter) 與深色模式設計。
    *   新增頂部狀態列，即時顯示勝負紀錄。
    *   更清晰的文字提示與進度條回饋。
2.  **程式碼結構優化**：
    *   將 HTML、CSS、JS 徹底分離，方便在 VSCode 中維護。
    *   使用現代 JavaScript (ES6+) 語法。
    *   模組化繪圖與邏輯處理函式。
3.  **互動體驗優化**：
    *   優化手勢偵測的穩定性 (使用投票機制與緩衝區)。
    *   更流暢的狀態切換動畫。
    *   支援手勢選單控制 (比讚繼續遊戲)。

## 🚀 如何在 VSCode 中執行

1.  **安裝 Live Server 擴充功能**：
    *   在 VSCode 的 Extensions (擴充功能) 搜尋並安裝 `Live Server`。
2.  **開啟專案**：
    *   使用 VSCode 開啟此專案資料夾。
3.  **啟動遊戲**：
    *   右鍵點擊 `index.html`，選擇 `Open with Live Server`。
    *   瀏覽器會自動開啟，請務必 **允許攝影機存取**。

## 🛠 使用技術

*   [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands) - AI 手勢偵測核心
*   [Canvas API](https://developer.mozilla.org/zh-TW/docs/Web/API/Canvas_API) - 高效能畫面渲染
*   [CSS3 Grid/Flexbox](https://developer.mozilla.org/zh-TW/docs/Web/CSS) - 響應式佈局

---
由 Manus 改良製作。
