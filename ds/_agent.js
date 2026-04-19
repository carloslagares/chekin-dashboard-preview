/* Chekin AI Agent — "Chek"
   Injects a trigger button into [data-agent-trigger-slot] and a panel
   into <body>. Open/close with Cmd/Ctrl+K or by clicking the trigger.
*/
(function(){

  const TRIGGER_HTML = `
    <button class="chek-trigger" type="button" aria-label="Open Vela AI assistant">
      <span class="mark">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/>
          <path d="M19 15 19.8 17.5 22 18.2 19.8 19 19 21.5 18.2 19 16 18.2 18.2 17.5 Z"/>
        </svg>
      </span>
      <span class="label">Ask Vela</span>
      <span class="kbd">⌘K</span>
    </button>
  `;

  const PANEL_HTML = `
    <div class="chek-backdrop" data-chek-close></div>
    <aside class="chek-panel" role="dialog" aria-label="Vela AI assistant">
      <div class="chek-head">
        <div class="av">
          <svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/><path d="M19 15 19.8 17.5 22 18.2 19.8 19 19 21.5 18.2 19 16 18.2 18.2 17.5 Z"/></svg>
        </div>
        <div class="ti">
          <div class="t">Vela</div>
        </div>
        <div class="acts">
          <button class="new" title="New conversation">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>
            New chat
          </button>
          <button class="ib" data-chek-close title="Close">
            <svg viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>

      <div class="chek-body" id="chek-body">

        <div class="chek-greet">
          <div class="hello">Good afternoon, Maria 👋</div>
          <div class="q">What shall we get done today?</div>
        </div>

        <!-- Proactive insight — tied to real dashboard state -->
        <div class="chek-insight">
          <div class="ic">
            <svg viewBox="0 0 24 24"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/><circle cx="12" cy="12" r="4"/></svg>
          </div>
          <div class="cp">
            <div class="tag">Spotted for you</div>
            <div class="t">3 guests arriving tomorrow haven't verified their ID</div>
            <div class="d">Send a reminder now and they'll have time to complete check-in before arrival.</div>
            <div class="actions">
              <button class="primary">
                <svg viewBox="0 0 24 24"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z"/></svg>
                Send reminders
              </button>
              <button>Show bookings</button>
              <button class="ghost">Dismiss</button>
            </div>
          </div>
        </div>

        <!-- Capabilities -->
        <div class="chek-caps">
          <div class="h">Try asking Vela</div>
          <div class="grid">
            <div class="chek-cap" data-prompt="How's my check-in rate this week?">
              <div class="ic"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg></div>
              <div class="t">Summarise this week</div>
              <div class="d">Check-ins, no-shows, revenue at a glance</div>
            </div>
            <div class="chek-cap" data-prompt="Enable deposit holds on all Madrid properties">
              <div class="ic"><svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M2 10h20M6 14h4"/></svg></div>
              <div class="t">Configure features</div>
              <div class="d">Toggle Deposits, Keys, Taxes in bulk</div>
            </div>
            <div class="chek-cap" data-prompt="Draft tonight's SES.HOSPEDAJES report for Puerta del Sol">
              <div class="ic"><svg viewBox="0 0 24 24"><path d="M12 2 4 5v7c0 5 3.5 8 8 10 4.5-2 8-5 8-10V5z"/></svg></div>
              <div class="t">Compliance reports</div>
              <div class="d">SES, Alloggiati, police &amp; tourist tax</div>
            </div>
            <div class="chek-cap" data-prompt="Show me bookings with missing ID">
              <div class="ic"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg></div>
              <div class="t">Find &amp; filter</div>
              <div class="d">Guests, bookings, invoices by any rule</div>
            </div>
          </div>
        </div>

      </div>

      <div class="chek-input">
        <div class="bar">
          <textarea id="chek-input" rows="1" placeholder="Ask anything, or type / for commands"></textarea>
          <div class="tools">
            <button title="Attach"><svg viewBox="0 0 24 24"><path d="m21 12-8.5 8.5a6 6 0 0 1-8.5-8.5L13 3.5a4 4 0 0 1 5.7 5.7L10 18"/></svg></button>
            <button title="Voice"><svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 19v3"/></svg></button>
          </div>
          <button class="send" id="chek-send" disabled title="Send">
            <svg viewBox="0 0 24 24"><path d="M2 21 22 12 2 3v7l13 2-13 2z"/></svg>
          </button>
        </div>
        <div class="hint">
          Type <kbd>/</kbd> for commands
        </div>
      </div>
    </aside>
  `;

  function mount(){
    // Inject trigger into slot(s)
    document.querySelectorAll('[data-agent-trigger-slot]').forEach(slot => {
      slot.innerHTML = TRIGGER_HTML;
    });

    // Inject panel into body once
    if (!document.getElementById('chek-root')){
      const wrap = document.createElement('div');
      wrap.id = 'chek-root';
      wrap.innerHTML = PANEL_HTML;
      document.body.appendChild(wrap);
    }

    const root = document.documentElement;
    const open = () => root.classList.add('chek-open');
    const close = () => root.classList.remove('chek-open');
    const toggle = () => root.classList.toggle('chek-open');

    document.querySelectorAll('.chek-trigger').forEach(b => b.addEventListener('click', open));
    document.querySelectorAll('[data-chek-close]').forEach(b => b.addEventListener('click', close));
    document.querySelector('[data-chek-wide]')?.addEventListener('click', () => {
      document.querySelector('.chek-panel').classList.toggle('wide');
    });

    // Keyboard: Cmd/Ctrl+K toggle, Esc close
    document.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'){ e.preventDefault(); toggle(); }
      if (e.key === 'Escape' && root.classList.contains('chek-open')) close();
    });

    // Input / send
    const input = document.getElementById('chek-input');
    const send  = document.getElementById('chek-send');
    const body  = document.getElementById('chek-body');

    const autosize = () => { input.style.height = 'auto'; input.style.height = Math.min(120, input.scrollHeight) + 'px'; };
    input.addEventListener('input', () => { send.disabled = !input.value.trim(); autosize(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey){ e.preventDefault(); if (!send.disabled) submit(); }
    });
    send.addEventListener('click', submit);

    // Capability chips & insight buttons prefill the input
    document.querySelectorAll('[data-prompt]').forEach(el => {
      el.addEventListener('click', () => {
        input.value = el.getAttribute('data-prompt');
        send.disabled = false;
        autosize();
        input.focus();
      });
    });

    function scrollBottom(){ body.scrollTop = body.scrollHeight; }

    function submit(){
      const text = input.value.trim();
      if (!text) return;
      input.value = ''; send.disabled = true; autosize();

      // Hide greeting/insight/caps after the first message for a focused thread
      body.querySelector('.chek-greet')?.remove();
      body.querySelector('.chek-insight')?.remove();
      body.querySelector('.chek-caps')?.remove();

      // User bubble
      body.insertAdjacentHTML('beforeend', `
        <div class="chek-msg user">
          <div class="av">M</div>
          <div class="bubble">${escapeHtml(text)}</div>
        </div>
      `);
      scrollBottom();

      // Typing indicator
      body.insertAdjacentHTML('beforeend', `
        <div class="chek-msg bot" id="chek-typing-row">
          <div class="av"><svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/></svg></div>
          <div class="chek-typing"><span></span><span></span><span></span></div>
        </div>
      `);
      scrollBottom();

      // Canned bot reply (demo) — shape chosen based on loose intent
      setTimeout(() => {
        document.getElementById('chek-typing-row')?.remove();
        body.insertAdjacentHTML('beforeend', botReply(text));
        scrollBottom();
      }, 900);
    }

    function botReply(q){
      const lower = q.toLowerCase();
      // Compliance / SES
      if (lower.includes('ses') || lower.includes('police') || lower.includes('compliance') || lower.includes('report')){
        return `
          <div class="chek-msg bot">
            <div class="av"><svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/></svg></div>
            <div style="flex:1">
              <div class="bubble">I drafted tonight's SES.HOSPEDAJES submission for Puerta del Sol. 2 guests check in today — both have verified IDs and signed contracts.</div>
              <div class="chek-result">
                <div class="rhead"><svg viewBox="0 0 24 24"><path d="M12 2 4 5v7c0 5 3.5 8 8 10 4.5-2 8-5 8-10V5z"/></svg>Draft report · ready to submit</div>
                <div class="rrow">Puerta del Sol · Madrid<span class="sm">2 guests · 18 fields</span></div>
                <div class="rrow">Booking #BK-40281 · Rivera, L.<span class="sm">Verified ✓</span></div>
                <div class="rrow">Booking #BK-40285 · Okafor, C.<span class="sm">Verified ✓</span></div>
                <div class="rfoot">
                  <button class="primary">Submit now</button>
                  <button>Review &amp; edit</button>
                </div>
              </div>
            </div>
          </div>`;
      }
      // Bulk config
      if (lower.includes('enable') || lower.includes('deposit') || lower.includes('madrid') || lower.includes('configure')){
        return `
          <div class="chek-msg bot">
            <div class="av"><svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/></svg></div>
            <div style="flex:1">
              <div class="bubble">Found 4 properties in Madrid. I'll enable deposit holds via your Stripe account — €200 default, released on check-out. Review before I apply:</div>
              <div class="chek-result">
                <div class="rhead"><svg viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/></svg>Changes queued · not yet applied</div>
                <div class="rrow">Puerta del Sol<span class="sm">Deposit: off → €200</span></div>
                <div class="rrow">Gràcia Loft 3B<span class="sm">Deposit: off → €200</span></div>
                <div class="rrow">Chamberí Studio<span class="sm">Deposit: off → €200</span></div>
                <div class="rrow">Retiro Park Apt<span class="sm">Deposit: already on · skip</span></div>
                <div class="rfoot">
                  <button class="primary">Apply to 3 properties</button>
                  <button>Adjust amount</button>
                </div>
              </div>
            </div>
          </div>`;
      }
      // Find/filter
      if (lower.includes('missing') || lower.includes('show me') || lower.includes('find') || lower.includes('filter')){
        return `
          <div class="chek-msg bot">
            <div class="av"><svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/></svg></div>
            <div style="flex:1">
              <div class="bubble">5 bookings in the next 72h are missing ID verification. Want me to send them a nudge?</div>
              <div class="chek-result">
                <div class="rhead"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>5 matching bookings</div>
                <div class="rrow">BK-40281 · tomorrow<span class="sm">Puerta del Sol</span></div>
                <div class="rrow">BK-40299 · tomorrow<span class="sm">Trastevere Suites</span></div>
                <div class="rrow">BK-40312 · Sunday<span class="sm">Gràcia Loft 3B</span></div>
                <div class="rrow">BK-40340 · Sunday<span class="sm">Montmartre 9e</span></div>
                <div class="rrow">BK-40361 · Monday<span class="sm">Green House</span></div>
                <div class="rfoot">
                  <button class="primary">Send 5 reminders</button>
                  <button>Open in Bookings</button>
                </div>
              </div>
            </div>
          </div>`;
      }
      // Summary
      if (lower.includes('rate') || lower.includes('week') || lower.includes('summary') || lower.includes('summarise')){
        return `
          <div class="chek-msg bot">
            <div class="av"><svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/></svg></div>
            <div style="flex:1">
              <div class="bubble">This week across 24 properties: <b>94% online check-in rate</b> (up 3pt), €1,240 in upselling, 0 no-shows. One property — Green House — is lagging at 71%.</div>
              <div class="chek-result">
                <div class="rhead"><svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></svg>Why Green House is lagging</div>
                <div class="rrow">Identity verification<span class="sm">disabled</span></div>
                <div class="rrow">Last reminder<span class="sm">never sent</span></div>
                <div class="rfoot">
                  <button class="primary">Fix Green House</button>
                  <button>See full report</button>
                </div>
              </div>
            </div>
          </div>`;
      }
      return `
        <div class="chek-msg bot">
          <div class="av"><svg viewBox="0 0 24 24"><path d="M12 2 13.5 8 19 9.5 13.5 11 12 17 10.5 11 5 9.5 10.5 8 Z"/></svg></div>
          <div class="bubble">Got it — I can help with check-in flows, compliance reports, bulk property settings, guest comms and finding things in your workspace. Try one of the suggestions above or ask away.</div>
        </div>`;
    }
  }

  function escapeHtml(s){ return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();
})();
