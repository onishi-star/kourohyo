/**
 * nav.js — ボタン操作によるスライドナビゲーション
 * 右端に3ボタン縦並び ＋ 下部タブバー
 */

const NAV_PAGES = [
  { file: 'index.html',    label: '📅', title: 'スケジュール', color: '#4a90e2' },
  { file: 'pomodoro.html', label: '🍅', title: 'ポモドーロ',   color: '#e05a2b' },
  { file: 'review.html',   label: '📝', title: '復習',         color: '#2ecc87' },
];

function navigateTo(target) {
  let targetIdx;
  if (typeof target === 'number') {
    targetIdx = target;
  } else {
    targetIdx = NAV_PAGES.findIndex(p => p.file === target);
  }
  if (targetIdx === -1 || targetIdx === _NAV_CURRENT_IDX) return;

  const page = NAV_PAGES[targetIdx];
  const goingRight = targetIdx > _NAV_CURRENT_IDX;

  const curtain = document.getElementById('_nav_curtain');
  curtain.style.transition = 'none';
  curtain.style.transform = goingRight ? 'translateX(100%)' : 'translateX(-100%)';
  curtain.querySelector('#_nav_curtain_icon').textContent  = page.label;
  curtain.querySelector('#_nav_curtain_title').textContent = page.title;
  curtain.style.background = page.color + '22';

  curtain.offsetHeight;

  curtain.style.transition = 'transform 0.30s cubic-bezier(0.22, 0.61, 0.36, 1)';
  curtain.style.transform  = 'translateX(0%)';

  const exitX = goingRight ? '-40px' : '40px';
  document.body.style.transition = 'transform 0.28s cubic-bezier(0.22,0.61,0.36,1), opacity 0.22s';
  document.body.style.transform  = 'translateX(' + exitX + ')';
  document.body.style.opacity    = '0';

  setTimeout(function() { window.location.href = page.file; }, 280);
}

var _NAV_CURRENT_IDX = -1;

(function () {
  var filename = location.pathname.split('/').pop() || 'index.html';
  _NAV_CURRENT_IDX = NAV_PAGES.findIndex(function(p) { return p.file === filename; });
  if (_NAV_CURRENT_IDX === -1) return;

  var style = document.createElement('style');
  style.textContent = [
    '#_nav_curtain{position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;pointer-events:none;transform:translateX(100%);background:#f5f5f0;}',
    '#_nav_curtain_icon{font-size:56px;}',
    '#_nav_curtain_title{font-size:18px;font-weight:700;color:#444;font-family:"Hiragino Kaku Gothic ProN",sans-serif;}',

    /* 右端ボタングループ */
    '#_nav_side{position:fixed;right:env(safe-area-inset-right,0);top:50%;transform:translateY(-50%);z-index:10001;display:flex;flex-direction:column;border-radius:12px 0 0 12px;overflow:hidden;box-shadow:-3px 0 16px rgba(0,0,0,0.14);}',
    '.side-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;width:46px;padding:13px 0;border:none;cursor:pointer;font-family:"Hiragino Kaku Gothic ProN",sans-serif;transition:filter .15s,transform .12s;-webkit-tap-highlight-color:transparent;position:relative;}',
    '.side-btn+.side-btn{border-top:1px solid rgba(255,255,255,0.22);}',
    '.side-btn:active{filter:brightness(0.86);transform:scaleX(0.93);}',
    '.side-btn .side-icon{font-size:19px;line-height:1;}',
    '.side-btn .side-label{font-size:9px;font-weight:700;writing-mode:vertical-rl;letter-spacing:0.08em;line-height:1;}',
    '.side-btn.current{filter:brightness(0.78);cursor:default;}',
    '.side-btn.current::before{content:"";position:absolute;left:0;top:20%;bottom:20%;width:3px;border-radius:0 2px 2px 0;background:rgba(255,255,255,0.9);}',

    /* 下部タブバー */
    '#_nav_bar{position:fixed;bottom:0;left:0;right:0;height:calc(58px + env(safe-area-inset-bottom, 0px));background:rgba(255,255,255,0.95);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(0,0,0,0.08);display:flex;z-index:10000;box-shadow:0 -2px 12px rgba(0,0,0,0.06);padding-bottom:env(safe-area-inset-bottom, 0px);}',
    '.nav-tab{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;border:none;background:none;cursor:pointer;padding:6px 0;font-family:"Hiragino Kaku Gothic ProN",sans-serif;transition:transform .12s;-webkit-tap-highlight-color:transparent;position:relative;}',
    '.nav-tab:active{transform:scale(0.91);}',
    '.nav-tab .tab-icon{font-size:22px;line-height:1;transition:transform .18s;}',
    '.nav-tab .tab-label{font-size:10px;font-weight:600;color:#aaa;letter-spacing:0.03em;transition:color .18s;}',
    '.nav-tab.active .tab-icon{transform:scale(1.15) translateY(-1px);}',
    '.nav-tab.active .tab-label{color:var(--tc,#333);}',
    '.nav-tab.active::after{content:"";position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:28px;height:3px;border-radius:3px 3px 0 0;background:var(--tc,#333);}',

    'body{opacity:0;padding-bottom:58px!important;}'
  ].join('');
  document.head.appendChild(style);

  /* カーテン */
  var curtain = document.createElement('div');
  curtain.id = '_nav_curtain';
  curtain.innerHTML = '<div id="_nav_curtain_icon"></div><div id="_nav_curtain_title"></div>';
  document.body.appendChild(curtain);

  /* 右端ボタン */
  var side = document.createElement('div');
  side.id = '_nav_side';
  NAV_PAGES.forEach(function(page, idx) {
    var btn = document.createElement('button');
    btn.className = 'side-btn' + (idx === _NAV_CURRENT_IDX ? ' current' : '');
    btn.style.background = page.color;
    btn.style.color = '#fff';
    btn.innerHTML = '<span class="side-icon">' + page.label + '</span><span class="side-label">' + page.title + '</span>';
    btn.addEventListener('click', function() { navigateTo(idx); });
    side.appendChild(btn);
  });
  document.body.appendChild(side);

  /* 下部タブバー */
  var bar = document.createElement('div');
  bar.id = '_nav_bar';
  NAV_PAGES.forEach(function(page, idx) {
    var btn = document.createElement('button');
    btn.className = 'nav-tab' + (idx === _NAV_CURRENT_IDX ? ' active' : '');
    btn.style.setProperty('--tc', page.color);
    btn.innerHTML = '<span class="tab-icon">' + page.label + '</span><span class="tab-label">' + page.title + '</span>';
    btn.addEventListener('click', function() { navigateTo(idx); });
    bar.appendChild(btn);
  });
  document.body.appendChild(bar);

  /* フェードイン */
  var prevIdx = parseInt(sessionStorage.getItem('_nav_prev') || '-1');
  var fromRight = _NAV_CURRENT_IDX > prevIdx;
  document.body.style.transform = fromRight ? 'translateX(24px)' : 'translateX(-24px)';
  sessionStorage.setItem('_nav_prev', String(_NAV_CURRENT_IDX));

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      document.body.style.transition = 'opacity 0.22s ease, transform 0.22s cubic-bezier(0.22,0.61,0.36,1)';
      document.body.style.opacity    = '1';
      document.body.style.transform  = 'translateX(0)';
      setTimeout(function() { document.body.style.transition = ''; }, 260);
    });
  });
})();