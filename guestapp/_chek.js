/* Shared Chek drawer — attaches to [data-chek-trigger] buttons */
(function(){
  const SPARKLE = '<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M10 2.3l1.75 5.45L17 9.4l-5.25 1.65L10 16.5l-1.75-5.45L3 9.4l5.25-1.65z"/><path d="M18.5 14l.75 2.25 2.25.75-2.25.75-.75 2.25-.75-2.25-2.25-.75 2.25-.75z"/></svg>';

  const DRAWER_HTML = `
<div class="chek-back" id="chekBack"></div>
<aside class="chek-drawer" id="chekDrawer" role="dialog" aria-label="Vela — AI concierge">
  <div class="dh">
    <div class="av">${SPARKLE}</div>
    <div>
      <div class="ht">Vela</div>
      <div class="hd">Tuned in to your trip</div>
    </div>
    <div class="actions">
      <button class="act" aria-label="New chat" title="New chat"><svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></button>
      <button class="act" aria-label="History" title="History"><svg viewBox="0 0 24 24"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/></svg></button>
      <button class="act chek-close" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
    </div>
  </div>

  <div class="db" id="chekBody">
    <div class="msg ai">
      <div class="av">${SPARKLE}</div>
      <div class="bub">Hola Carmen 👋 I'm <b>Vela</b>. Your Iberia flight lands Monday at 13:20 — two tasks remain before arrival. Want me to take you through them?</div>
    </div>

    <div class="card-s">
      <div class="sh"><svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><path d="M10 2l1.7 5.3L17 9l-5.3 1.7L10 14l-1.7-5.3L3 9z"/></svg> Your trip in 30 seconds</div>
      <div class="items">
        <div class="it a"><div class="pill">1</div><div><div class="t">Verify ID + pay balance</div><div class="d">~4 min · unlocks digital keys</div></div></div>
        <div class="it b"><div class="pill">2</div><div><div class="t">Airport bus to Sol stop</div><div class="d">€5 · 35 min · 4 min walk to door</div></div></div>
        <div class="it c"><div class="pill">3</div><div><div class="t">Tapas tonight — terrace weather</div><div class="d">I saved 3 picks nearby</div></div></div>
      </div>
    </div>

    <div class="msg ai">
      <div class="av">${SPARKLE}</div>
      <div class="bub">Ask me anything about Madrid or your booking — or tap a shortcut below to jump in.</div>
    </div>
  </div>

  <div class="dc">
    <div class="chips">
      <div class="chip"><svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="12" r="2.5"/></svg>Verify ID now</div>
      <div class="chip"><svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>Pay €340</div>
      <div class="chip"><svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 1 1 18 0z"/></svg>Walk from airport</div>
      <div class="chip"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>Late check-out</div>
    </div>
    <div class="input">
      <input placeholder="Ask Vela anything…">
      <button aria-label="Send"><svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg></button>
    </div>
  </div>
</aside>`;

  function init(){
    if (document.getElementById('chekDrawer')) return;
    const wrap = document.createElement('div');
    wrap.innerHTML = DRAWER_HTML;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    // Render sparkle inside any trigger button
    document.querySelectorAll('[data-chek-trigger]').forEach(btn => {
      if (!btn.querySelector('.sp')){
        const sp = document.createElement('span');
        sp.className = 'sp';
        sp.innerHTML = SPARKLE;
        btn.insertBefore(sp, btn.firstChild);
      }
    });

    const back = document.getElementById('chekBack');
    const drawer = document.getElementById('chekDrawer');
    const body = document.getElementById('chekBody');

    function open(){
      back.classList.add('open');
      drawer.classList.add('open');
      document.body.classList.add('chek-open');
      setTimeout(() => body.scrollTop = body.scrollHeight, 50);
    }
    function close(){
      back.classList.remove('open');
      drawer.classList.remove('open');
      document.body.classList.remove('chek-open');
    }

    document.querySelectorAll('[data-chek-trigger]').forEach(b => b.addEventListener('click', open));
    back.addEventListener('click', close);
    drawer.querySelector('.chek-close').addEventListener('click', close);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });

    drawer.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
      const input = drawer.querySelector('.input input');
      if (input){ input.value = c.innerText.trim(); input.focus(); }
    }));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
