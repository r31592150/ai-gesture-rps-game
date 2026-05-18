/**
 * AI Gesture Battle - 改良版
 * 基於 MediaPipe Hands 與 Canvas API
 */

// --- 常數配置 ---
const W = 640, H = 480;
const cv = document.getElementById('c');
const g = cv.getContext('2d');
const vid = document.getElementById('vid');

const PICKS = ['rock', 'paper', 'scissors'];
const EM = { rock: '✊', paper: '🖐', scissors: '✌️', thumbs_up: '👍' };
const LB = { rock: '石頭', paper: '布', scissors: '剪刀', thumbs_up: '讚' };
const BEATS = { rock: 'scissors', scissors: 'paper', paper: 'rock' };
const COLORS = {
    primary: '#00ff88',
    secondary: '#4ecdc4',
    accent: '#ff6b6b',
    warning: '#ffd93d',
    text: '#ffffff',
    bg: '#0d1117'
};

// 骨架連接定義
const SKEL = [[0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
    [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [0, 17], [17, 18], [18, 19], [19, 20]];

// --- 遊戲狀態 ---
let state = 'loading'; // loading, idle, countdown, reveal, win, lose, draw, menu
let stateStartTime = Date.now();
let playerGesture = null;
let cpuGesture = null;
let landmarks = null;
let stableGesture = null;
let handedness = null;
let gestureBuffer = [];
let holdStartTime = null;
let menuHoldStartTime = null;
let score = { w: 0, l: 0, d: 0 };
let particles = [];

const BUFFER_SIZE = 10;
const HOLD_DURATION = 500; // 毫秒
const COUNTDOWN_SECONDS = 3;

// --- 初始化 MediaPipe ---
const initMediaPipe = () => {
    const hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });

    hands.onResults((results) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks[0]) {
            landmarks = results.multiHandLandmarks[0];
            handedness = results.multiHandedness[0].label;
            const currentGesture = classifyGesture(landmarks);
            
            gestureBuffer.push(currentGesture);
            if (gestureBuffer.length > BUFFER_SIZE) gestureBuffer.shift();
            
            stableGesture = getVotedGesture(gestureBuffer);
        } else {
            landmarks = null;
            stableGesture = null;
            handedness = null;
            gestureBuffer = [];
        }
    });

    const camera = new Camera(vid, {
        onFrame: async () => {
            await hands.send({ image: vid });
        },
        width: W,
        height: H
    });
    
    camera.start().then(() => {
        if (state === 'loading') changeState('idle');
    });
};

// --- 手勢辨識邏輯 ---
function classifyGesture(l) {
    const tips = [8, 12, 16, 20];
    const pips = [6, 10, 14, 18];
    const extended = tips.map((t, i) => l[t].y < l[pips[i]].y);
    const extendedCount = extended.filter(Boolean).length;

    // 比讚偵測
    const thumbUp = l[4].y < l[3].y && l[4].y < l[2].y && l[4].y < l[5].y;
    if (thumbUp && extendedCount === 0) return 'thumbs_up';

    if (extendedCount === 0) return 'rock';
    if (extendedCount >= 3) return 'paper';
    if (extended[0] && extended[1] && !extended[2] && !extended[3]) return 'scissors';
    
    return 'unknown';
}

function getVotedGesture(buffer) {
    if (buffer.length < 5) return null;
    const counts = {};
    buffer.forEach(g => counts[g] = (counts[g] || 0) + 1);
    
    let best = null, maxCount = 0;
    for (const g in counts) {
        if (g !== 'unknown' && counts[g] > maxCount) {
            maxCount = counts[g];
            best = g;
        }
    }
    return (maxCount / buffer.length >= 0.6) ? best : null;
}

// --- 輔助函式 ---
function changeState(newState) {
    state = newState;
    stateStartTime = Date.now();
    
    // 更新 UI 提示
    const instructionEl = document.getElementById('instruction');
    if (newState === 'idle') instructionEl.innerText = '請比出 ✊ 石頭、🖐 布 或 ✌️ 剪刀 來開始';
    if (newState === 'countdown') instructionEl.innerText = '保持手勢！倒數中...';
    if (newState === 'reveal') instructionEl.innerText = '揭曉結果！';
}

function drawRoundedRect(x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
}

function getCanvasCoords(p) {
    // 水平鏡像處理
    return [(1 - p.x) * W, p.y * H];
}

// --- 繪圖函式 ---
function drawSkeleton() {
    if (!landmarks) return;
    g.save();
    g.strokeStyle = 'rgba(0, 255, 136, 0.6)';
    g.lineWidth = 3;
    
    SKEL.forEach(([a, b]) => {
        const [ax, ay] = getCanvasCoords(landmarks[a]);
        const [bx, by] = getCanvasCoords(landmarks[b]);
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.stroke();
    });
    
    landmarks.forEach((p, i) => {
        const [x, y] = getCanvasCoords(p);
        g.fillStyle = i === 0 ? COLORS.accent : COLORS.primary;
        g.beginPath();
        g.arc(x, y, i === 0 ? 6 : 4, 0, Math.PI * 2);
        g.fill();
    });
    g.restore();
}

function drawText(text, x, y, size, color = '#fff', align = 'center') {
    g.save();
    g.font = `bold ${size}px 'Segoe UI', Arial`;
    g.textAlign = align;
    g.textBaseline = 'middle';
    g.fillStyle = color;
    g.shadowColor = 'rgba(0,0,0,0.5)';
    g.shadowBlur = 10;
    g.fillText(text, x, y);
    g.restore();
}

function drawCard(gesture, x, y, w, h, color, alpha = 1) {
    g.save();
    g.globalAlpha = alpha;
    g.fillStyle = color + '33';
    g.strokeStyle = color;
    g.lineWidth = 3;
    drawRoundedRect(x, y, w, h, 20);
    g.fill();
    g.stroke();
    
    drawText(EM[gesture] || '❓', x + w / 2, y + h / 2 - 10, h * 0.4);
    drawText(LB[gesture] || '未知', x + w / 2, y + h * 0.8, h * 0.12, color);
    g.restore();
}

// --- 遊戲邏輯更新 ---
function update() {
    const now = Date.now();
    const elapsed = now - stateStartTime;

    if (state === 'idle') {
        if (stableGesture && PICKS.includes(stableGesture)) {
            if (!holdStartTime) holdStartTime = now;
            if (now - holdStartTime >= HOLD_DURATION) {
                playerGesture = stableGesture;
                changeState('countdown');
            }
        } else {
            holdStartTime = null;
        }
    }

    if (state === 'countdown') {
        if (stableGesture && PICKS.includes(stableGesture)) playerGesture = stableGesture;
        if (elapsed >= COUNTDOWN_SECONDS * 1000) {
            cpuGesture = PICKS[Math.floor(Math.random() * 3)];
            changeState('reveal');
        }
    }

    if (state === 'reveal') {
        if (elapsed > 1500) {
            const result = playerGesture === cpuGesture ? 'draw' : 
                          (BEATS[playerGesture] === cpuGesture ? 'win' : 'lose');
            
            if (result === 'win') score.w++;
            else if (result === 'lose') score.l++;
            else score.d++;
            
            document.getElementById('win-count').innerText = score.w;
            document.getElementById('lose-count').innerText = score.l;
            document.getElementById('draw-count').innerText = score.d;
            
            changeState(result);
        }
    }

    if (['win', 'lose', 'draw'].includes(state)) {
        if (elapsed > 3000) changeState('menu');
    }

    if (state === 'menu') {
        if (stableGesture === 'thumbs_up') {
            if (!menuHoldStartTime) menuHoldStartTime = now;
            if (now - menuHoldStartTime >= HOLD_DURATION) {
                changeState('idle');
            }
        } else {
            menuHoldStartTime = null;
        }
    }
}

// --- 主渲染循環 ---
function render() {
    // 1. 清除畫布
    g.clearRect(0, 0, W, H);

    // 2. 繪製視訊背景 (鏡像)
    if (vid.readyState >= 2) {
        g.save();
        g.translate(W, 0);
        g.scale(-1, 1);
        g.drawImage(vid, 0, 0, W, H);
        g.restore();
    }

    // 3. 根據狀態繪製 UI
    if (state === 'loading') {
        g.fillStyle = 'rgba(0,0,0,0.8)';
        g.fillRect(0, 0, W, H);
        drawText('AI 載入中...', W / 2, H / 2, 30, COLORS.secondary);
    } else {
        drawSkeleton();
        
        if (state === 'idle') {
            if (holdStartTime) {
                const progress = Math.min(1, (Date.now() - holdStartTime) / HOLD_DURATION);
                g.fillStyle = 'rgba(255,255,255,0.2)';
                drawRoundedRect(W / 2 - 100, H - 60, 200, 10, 5);
                g.fill();
                g.fillStyle = COLORS.primary;
                drawRoundedRect(W / 2 - 100, H - 60, 200 * progress, 10, 5);
                g.fill();
            }
        }

        if (state === 'countdown') {
            const count = Math.ceil(COUNTDOWN_SECONDS - (Date.now() - stateStartTime) / 1000);
            g.fillStyle = 'rgba(0,0,0,0.4)';
            g.fillRect(0, 0, W, H);
            drawText(count, W / 2, H / 2, 120, COLORS.warning);
            drawText(`你出: ${EM[playerGesture]}`, W / 2, H / 2 + 80, 24);
        }

        if (state === 'reveal' || ['win', 'lose', 'draw'].includes(state)) {
            g.fillStyle = 'rgba(0,0,0,0.7)';
            g.fillRect(0, 0, W, H);
            
            const cardW = 180, cardH = 220;
            drawCard(playerGesture, W / 4 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, COLORS.secondary);
            
            const cpuAlpha = Math.min(1, (Date.now() - stateStartTime) / 800);
            drawCard(cpuGesture, W * 3 / 4 - cardW / 2, H / 2 - cardH / 2, cardW, cardH, COLORS.accent, cpuAlpha);
            
            drawText('VS', W / 2, H / 2, 40, '#fff');
            
            if (['win', 'lose', 'draw'].includes(state)) {
                let msg = state === 'win' ? 'YOU WIN! 🎉' : (state === 'lose' ? 'YOU LOSE 😢' : 'DRAW 🤝');
                let col = state === 'win' ? COLORS.primary : (state === 'lose' ? COLORS.accent : COLORS.warning);
                drawText(msg, W / 2, 80, 50, col);
            }
        }

        if (state === 'menu') {
            g.fillStyle = 'rgba(0,0,0,0.8)';
            g.fillRect(0, 0, W, H);
            drawText('想再玩一局嗎？', W / 2, H / 2 - 40, 32);
            drawText('比出 👍 讚 手勢繼續遊戲', W / 2, H / 2 + 20, 18, COLORS.secondary);
            
            if (menuHoldStartTime) {
                const progress = Math.min(1, (Date.now() - menuHoldStartTime) / HOLD_DURATION);
                g.fillStyle = COLORS.primary;
                drawRoundedRect(W / 2 - 100, H / 2 + 60, 200 * progress, 5, 2);
                g.fill();
            }
        }
    }

    update();
    requestAnimationFrame(render);
}

// 啟動
initMediaPipe();
render();
