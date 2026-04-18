/**
 * guide.js — 学習サイクル誘導オーバーレイ
 *
 * フェーズ判定:
 *   1. 週次計画未完了 (土曜24時超過)
 *   2. 19時以降 → 今日の勉強セッション開始
 *   3. 勉強完了後 → AI復習問題
 *   4. 全完了 → 通常画面
 *
 * 拠点:
 *   文プラ / プロシード / 秀明彦根→文プラ / 秀明彦根→プロシード / なし
 */

// ══════════════════════════════════════════
// 定数
// ══════════════════════════════════════════

const GUIDE_BASES = [
  { id: 'bunkura',        label: '文プラ',              pomodoroCount: 6, endHour: 22, endMin: 0,  shumeiFirst: false },
  { id: 'proceed',        label: 'プロシード',           pomodoroCount: 4, endHour: 21, endMin: 20, shumeiFirst: false },
  { id: 'shumei_bunkura', label: '秀明彦根 → 文プラ',   pomodoroCount: 6, endHour: 22, endMin: 0,  shumeiFirst: true  },
  { id: 'shumei_proceed', label: '秀明彦根 → プロシード',pomodoroCount: 4, endHour: 21, endMin: 20, shumeiFirst: true  },
  { id: 'none',           label: 'なし（塾なし）',       pomodoroCount: 0, endHour: 0,  endMin: 0,  shumeiFirst: false },
];

// localStorage キー
const LS_WEEK_PLAN_DONE   = 'guide_weekPlanDone';   // "YYYY-WW" → "1"
const LS_TODAY_BASE       = 'guide_todayBase';       // "bunkura" etc.
const LS_TODAY_SESSION    = 'guide_todaySession';    // "done" / ""
const LS_TODAY_REVIEW     = 'guide_todayReview';     // "done" / ""
const LS_LAST_DATE        = 'guide_lastDate';        // "YYYY-MM-DD"

// ══════════════════════════════════════════
// ユーティリティ
// ══════════════════════════════════════════

function _today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function _getWeekKey() {
  // 月曜起点の ISO週キー "YYYY-WN"
  const d = new Date();
  const day = d.getDay() || 7;
  d.setDate(d.getDate() - day + 1);
  const y = d.getFullYear();
  const m = String(d.getMonth()+1).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${dd}`;
}

function _resetDailyIfNeeded() {
  const today = _today();
  if (localStorage.getItem(LS_LAST_DATE) !== today) {
    localStorage.setItem(LS_LAST_DATE, today);
    localStorage.removeItem(LS_TODAY_SESSION);
    localStorage.removeItem(LS_TODAY_REVIEW);
    // 拠点は毎日選び直す
    localStorage.removeItem(LS_TODAY_BASE);
  }
}

function _isWeekPlanDone() {
  return localStorage.getItem(LS_WEEK_PLAN_DONE + '_' + _getWeekKey()) === '1';
}

function _markWeekPlanDone() {
  localStorage.setItem(LS_WEEK_PLAN_DONE + '_' + _getWeekKey(), '1');
}

function _shouldShowWeekPlanAlert() {
  if (_isWeekPlanDone()) return false;
  const now = new Date();
  const day = now.getDay(); // 0=日, 6=土
  const h = now.getHours();
  // 土曜24時（＝日曜0時）以降なら催促
  // 実装上は「土曜かつ24時超過」を「日曜」として扱う
  // → 日曜以降（月〜日）かつ未完了なら常に催促
  if (day === 6 && h < 21) return false; // 土曜21時前は催促しない
  return true;
}

function _isStudyTime() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const base = localStorage.getItem(LS_TODAY_BASE);
  if (!base) return false;
  const baseInfo = GUIDE_BASES.find(b => b.id === base);
  if (!baseInfo || baseInfo.id === 'none') return false;
  const startH = baseInfo.shumeiFirst ? 19 : 19;
  const startM = baseInfo.shumeiFirst ? 20 : 0;
  return (h > startH) || (h === startH && m >= startM);
}

// ══════════════════════════════════════════
// オーバーレイ注入（CSS）
// ══════════════════════════════════════════

(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    #guide-overlay {
      position: fixed;
      inset: 0;
      z-index: 99000;
      background: rgba(0,0,0,0.72);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      box-sizing: border-box;
      animation: guideIn 0.3s ease;
    }
    @keyframes guideIn {
      from { opacity: 0; transform: scale(0.96); }
      to   { opacity: 1; transform: scale(1); }
    }
    #guide-card {
      background: #fff;
      border-radius: 20px;
      padding: 32px 28px 28px;
      max-width: 420px;
      width: 100%;
      box-shadow: 0 12px 48px rgba(0,0,0,0.28);
      text-align: center;
    }
    #guide-icon { font-size: 52px; margin-bottom: 12px; }
    #guide-title {
      font-size: 20px;
      font-weight: bold;
      color: #222;
      margin-bottom: 8px;
      line-height: 1.4;
    }
    #guide-body {
      font-size: 14px;
      color: #555;
      margin-bottom: 24px;
      line-height: 1.7;
    }
    #guide-actions {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .guide-btn-primary {
      padding: 14px 20px;
      border: none;
      border-radius: 12px;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      background: #4a90e2;
      color: #fff;
      transition: filter .15s;
    }
    .guide-btn-primary:active { filter: brightness(0.88); }
    .guide-btn-secondary {
      padding: 11px 20px;
      border: 1.5px solid #ccc;
      border-radius: 12px;
      font-size: 14px;
      cursor: pointer;
      background: #fff;
      color: #555;
      transition: background .15s;
    }
    .guide-btn-secondary:active { background: #f0f0f0; }
    /* 拠点選択 */
    .guide-base-btn {
      padding: 12px 16px;
      border: 2px solid #d0d8e8;
      border-radius: 12px;
      font-size: 14px;
      cursor: pointer;
      background: #fff;
      color: #333;
      transition: border-color .15s, background .15s;
      text-align: left;
    }
    .guide-base-btn:hover, .guide-base-btn.selected {
      border-color: #4a90e2;
      background: #eef4ff;
    }
    /* ポモドーロ情報 */
    .guide-info-box {
      background: #f5f8ff;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 20px;
      text-align: left;
      font-size: 13px;
      color: #444;
      line-height: 1.8;
    }
  `;
  document.head.appendChild(style);
})();

// ══════════════════════════════════════════
// オーバーレイ表示・非表示
// ══════════════════════════════════════════

function _showOverlay(html) {
  _removeOverlay();
  const el = document.createElement('div');
  el.id = 'guide-overlay';
  el.innerHTML = `<div id="guide-card">${html}</div>`;
  document.body.appendChild(el);
}

function _removeOverlay() {
  const el = document.getElementById('guide-overlay');
  if (el) el.remove();
}

// ══════════════════════════════════════════
// フェーズ1: 週次計画オーバーレイ
// ══════════════════════════════════════════

function _showWeekPlanOverlay() {
  const now = new Date();
  const isSat = now.getDay() === 6;
  const h = now.getHours();

  let message = '';
  if (isSat && h >= 21) {
    message = '今夜（21:00〜24:00）が計画タイムです！<br>来週の時間割と拠点を設定しましょう。';
  } else {
    message = '先週の週次計画がまだ完了していません。<br>スケジュールを設定してから始めましょう。';
  }

  _showOverlay(`
    <div id="guide-icon">📅</div>
    <div id="guide-title">今週の計画を立てよう</div>
    <div id="guide-body">${message}</div>
    <div id="guide-actions">
      <button class="guide-btn-primary" onclick="guideOpenWeekPlan()">📋 今すぐ設定する</button>
      <button class="guide-btn-secondary" onclick="guideCompleteWeekPlan()">✅ 設定済みにする</button>
    </div>
  `);
}

window.guideOpenWeekPlan = function() {
  // 設定モーダルを開く（既存の設定ボタンをクリック）
  _removeOverlay();
  const settingsBtn = document.querySelector('button[onclick*="setting"], button[onclick*="Setting"]');
  if (settingsBtn) {
    settingsBtn.click();
  } else {
    // フォールバック: 設定オーバーレイを直接開く
    const settingsOverlay = document.getElementById('settings-overlay');
    if (settingsOverlay) settingsOverlay.style.display = 'flex';
  }
};

window.guideCompleteWeekPlan = function() {
  _markWeekPlanDone();
  _removeOverlay();
  setTimeout(guideCheck, 300);
};

// ══════════════════════════════════════════
// フェーズ2: 拠点選択オーバーレイ
// ══════════════════════════════════════════

let _selectedBaseId = null;

function _showBaseSelectOverlay() {
  const btns = GUIDE_BASES.map(b => `
    <button class="guide-base-btn" data-base="${b.id}" onclick="guideSelectBase('${b.id}')">
      ${b.id === 'none' ? '🏠' : b.shumeiFirst ? '🏫→📚' : '📚'} ${b.label}
    </button>
  `).join('');

  _showOverlay(`
    <div id="guide-icon">🌙</div>
    <div id="guide-title">今日はどこで勉強？</div>
    <div id="guide-body">今日の拠点を選んでください。<br>ポモドーロの回数と終了時間が自動で設定されます。</div>
    <div id="guide-actions">${btns}</div>
  `);
}

window.guideSelectBase = function(baseId) {
  _selectedBaseId = baseId;
  localStorage.setItem(LS_TODAY_BASE, baseId);

  const base = GUIDE_BASES.find(b => b.id === baseId);
  if (!base || base.id === 'none') {
    // 塾なしの日は通常画面へ
    _removeOverlay();
    return;
  }

  _showSessionInfoOverlay(base);
};

// ══════════════════════════════════════════
// フェーズ3: セッション情報＋開始オーバーレイ
// ══════════════════════════════════════════

function _showSessionInfoOverlay(base) {
  let schedule = '';
  if (base.shumeiFirst) {
    schedule = `
      🏫 秀明彦根：19:20〜20:00<br>
      🚌 移動：20:00〜20:30<br>
      📚 ${base.label.split('→')[1].trim()}：20:30〜${base.endHour}:${String(base.endMin).padStart(2,'0')}<br>
      🍅 ポモドーロ：25+5分 × ${base.pomodoroCount}回
    `;
  } else {
    schedule = `
      📚 ${base.label}：19:00〜${base.endHour}:${String(base.endMin).padStart(2,'0')}<br>
      🍅 ポモドーロ：25+5分 × ${base.pomodoroCount}回
    `;
  }

  _showOverlay(`
    <div id="guide-icon">🍅</div>
    <div id="guide-title">今日の勉強を始めよう</div>
    <div class="guide-info-box">${schedule}</div>
    <div id="guide-body" style="margin-bottom:16px;">準備ができたらポモドーロタイマーを開始しましょう！</div>
    <div id="guide-actions">
      <button class="guide-btn-primary" onclick="guideStartPomodoro()">🍅 ポモドーロを開始</button>
      <button class="guide-btn-secondary" onclick="guideSessionDone()">✅ 勉強が終わった</button>
    </div>
  `);
}

window.guideStartPomodoro = function() {
  _removeOverlay();
  // ポモドーロページへ遷移（nav.jsのnavigateTo使用）
  if (typeof navigateTo === 'function') {
    navigateTo('pomodoro.html');
  } else {
    window.location.href = 'pomodoro.html';
  }
};

window.guideSessionDone = function() {
  localStorage.setItem(LS_TODAY_SESSION, 'done');
  _removeOverlay();
  setTimeout(guideCheck, 300);
};

// ══════════════════════════════════════════
// フェーズ4: 復習問題オーバーレイ
// ══════════════════════════════════════════

function _showReviewOverlay() {
  _showOverlay(`
    <div id="guide-icon">📝</div>
    <div id="guide-title">AIが復習問題を用意しました</div>
    <div id="guide-body">
      今日勉強した内容をもとに<br>
      AIが復習問題を作成しました。<br>
      解いて定着度を確認しましょう！
    </div>
    <div id="guide-actions">
      <button class="guide-btn-primary" onclick="guideGoReview()">📝 復習問題を解く</button>
      <button class="guide-btn-secondary" onclick="guideReviewDone()">✅ 今日は終わり</button>
    </div>
  `);
}

window.guideGoReview = function() {
  _removeOverlay();
  if (typeof navigateTo === 'function') {
    navigateTo('review.html');
  } else {
    window.location.href = 'review.html';
  }
};

window.guideReviewDone = function() {
  localStorage.setItem(LS_TODAY_REVIEW, 'done');
  _removeOverlay();
};

// ══════════════════════════════════════════
// メイン判定ロジック
// ══════════════════════════════════════════

window.guideCheck = function() {
  _resetDailyIfNeeded();

  // フェーズ1: 週次計画
  if (_shouldShowWeekPlanAlert()) {
    _showWeekPlanOverlay();
    return;
  }

  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();

  // 19時前は何もしない
  if (h < 19) return;

  // 拠点未選択 → 選択させる
  const savedBase = localStorage.getItem(LS_TODAY_BASE);
  if (!savedBase) {
    _showBaseSelectOverlay();
    return;
  }

  const base = GUIDE_BASES.find(b => b.id === savedBase);

  // 塾なし → 何もしない
  if (!base || base.id === 'none') return;

  // 秀明彦根の日は19:20から
  const startMin = base.shumeiFirst ? 20 : 0;
  if (h === 19 && m < startMin) return;

  // フェーズ3: セッション未完了
  if (localStorage.getItem(LS_TODAY_SESSION) !== 'done') {
    _showSessionInfoOverlay(base);
    return;
  }

  // フェーズ4: 復習問題未完了
  if (localStorage.getItem(LS_TODAY_REVIEW) !== 'done') {
    _showReviewOverlay();
    return;
  }

  // 全完了 → 何もしない
};

// ══════════════════════════════════════════
// 起動
// ══════════════════════════════════════════

// showApp()の後に呼ばれるよう、少し遅延させる
// index.htmlのshowApp()に `guideCheck()` を追記してください
// または以下の自動起動を使用（app-contentが表示されてから動く）

(function autoStart() {
  // app-contentが表示されるまで待つ
  function tryStart() {
    const appContent = document.getElementById('app-content');
    if (appContent && appContent.style.display !== 'none') {
      // 画面描画後に実行
      setTimeout(guideCheck, 600);
    } else if (appContent) {
      // ログイン待ち → MutationObserverで監視
      const obs = new MutationObserver(() => {
        if (appContent.style.display !== 'none') {
          obs.disconnect();
          setTimeout(guideCheck, 600);
        }
      });
      obs.observe(appContent, { attributes: true, attributeFilter: ['style'] });
    } else {
      // index.html以外のページ（pomodoro等）では起動しない
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tryStart);
  } else {
    tryStart();
  }
})();
