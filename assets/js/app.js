/* Eventos Cristian — app.js
   Sitio 100% estático: no hay backend, base de datos ni claves.
   Reglas de seguridad de este archivo:
   - Nunca se usa innerHTML / eval / new Function: todo el contenido dinámico se inserta con textContent.
   - Todo lo que viene de localStorage o de inputs se valida contra una lista blanca antes de usarse.
   - Cada módulo corre aislado en safe(): si uno falla, el resto de la página sigue funcionando. */
(function () {
  'use strict';

  /* ============ CONFIGURACIÓN (datos públicos del negocio, no secretos) ============
     Para activar la cuenta regresiva del próximo sorteo, pon la fecha aquí,
     por ejemplo: '2026-10-15T20:00:00-05:00'. Si está vacía, se muestra el aviso de seguir en redes. */
  const CONFIG = Object.freeze({
    whatsapp: '573222053255',
    proximoSorteo: '',
    nombreProximoSorteo: ''
  });

  const WA_RE = /^573\d{9}$/;
  const WHATSAPP = WA_RE.test(CONFIG.whatsapp) ? CONFIG.whatsapp : '';
  const VOTE_IDS = Object.freeze(['naked', 'adventure', 'pickup']);
  const NUM_RE = /^\d{2}$/;

  /* ============ utilidades ============ */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const isDesktop = () => innerWidth > 1024;
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || (navigator.deviceMemory || 4) <= 2;
  const hasIO = 'IntersectionObserver' in window;

  function safe(name, fn) {
    try { fn(); } catch (err) { console.warn('[EC] módulo "' + name + '" desactivado:', err && err.message); }
  }
  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = String(text);
    return n;
  }
  function waLink(msg) {
    if (!WHATSAPP) return '#contacto';
    const clean = String(msg || '').replace(/[\u0000-\u001F\u007F]/g, ' ').slice(0, 500);
    return 'https://wa.me/' + WHATSAPP + (clean ? '?text=' + encodeURIComponent(clean) : '');
  }
  const store = {
    get(key) {
      try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null; }
      catch (e) { try { localStorage.removeItem(key); } catch (_) {} return null; }
    },
    set(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* modo privado o almacenamiento lleno */ } }
  };
  /* Validadores: descartan cualquier dato manipulado en localStorage */
  function loadNums() {
    const v = store.get('ec-nums');
    if (!Array.isArray(v)) return new Set();
    return new Set(v.filter(n => typeof n === 'string' && NUM_RE.test(n)).slice(0, 100));
  }
  function loadVotes() {
    const v = store.get('ec-votes'), out = Object.create(null);
    if (v && typeof v === 'object' && !Array.isArray(v)) VOTE_IDS.forEach(id => { if (v[id] === true) out[id] = true; });
    return out;
  }

  let toastT;
  function toast(msg) {
    const t = $('#toast'); if (!t) return;
    t.textContent = String(msg).slice(0, 140); t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }
  const colors = ['#ffc21a', '#ffdd6b', '#e89b00', '#ffffff', '#fff1b8'];
  function domBurst(x, y) {
    if (reduced || !Element.prototype.animate || !isFinite(x) || !isFinite(y)) return;
    const n = isDesktop() ? 26 : 16, frag = document.createDocumentFragment(), els = [];
    for (let i = 0; i < n; i++) {
      const d = document.createElement('i');
      d.className = 'confetto';
      d.style.left = x + 'px'; d.style.top = y + 'px'; d.style.background = colors[i % colors.length];
      frag.appendChild(d); els.push(d);
    }
    document.body.appendChild(frag);
    els.forEach(d => {
      const a = Math.random() * 6.28, v = 70 + Math.random() * 130;
      d.animate([{ transform: 'translate3d(0,0,0) rotate(0)', opacity: 1 }, { transform: 'translate3d(' + Math.cos(a) * v + 'px,' + (Math.sin(a) * v + 110) + 'px,0) rotate(' + Math.random() * 540 + 'deg)', opacity: 0 }],
        { duration: 800 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.2,1)' }).onfinish = () => d.remove();
    });
  }

  /* ============ enlaces externos: siempre sin opener ni referrer ============ */
  safe('links', () => {
    $$('a[target="_blank"]').forEach(a => a.setAttribute('rel', 'noopener noreferrer'));
    const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
  });

  /* ============ imagen del hero: fundido desde el placeholder ============ */
  safe('hero-img', () => {
    const img = $('#heroBg');
    if (!img || img.complete) return;
    img.classList.add('pending');
    const done = () => img.classList.remove('pending');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });

  /* ============ marquees (texto estático, insertado como texto) ============ */
  safe('marquee', () => {
    const fill = (node, items) => {
      if (!node) return;
      const frag = document.createDocumentFragment();
      for (let k = 0; k < 4; k++) items.forEach(t => frag.appendChild(el('span', null, t)));
      node.replaceChildren(frag);
    };
    fill($('#mq1'), ['EL QUE SÍ CUMPLE 😎', 'ENTREGAS REALES', 'MOTOS 0 KM', 'CARROS 0 KM', 'NÚMEROS DE 2 CIFRAS', 'ENVÍOS A TODA COLOMBIA 🇨🇴']);
    fill($('#mq2'), ['DIOS PRIMERO 🙏🏼', 'CÚCUTA', 'LLAVES EN MANO', 'EVENTOS CRISTIAN ⚡', 'OBRAS 🙏🏼', 'SÍGUENOS @EVENTOSCRISTIAN_']);
    if (hasIO) {
      const io = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('offscreen', !e.isIntersecting)), { rootMargin: '100px' });
      $$('[data-anim]').forEach(n => io.observe(n));
    }
  });

  /* ============ scroll: nav, progreso y parallax ============ */
  let measure = () => {};
  safe('scroll', () => {
    const nav = $('#nav'), prog = $('#progress'), heroBg = $('#heroBg');
    const useParallax = !reduced && finePointer;
    const parallax = $$('[data-parallax]').map(n => ({ el: n, speed: parseFloat(n.dataset.parallax) || 0, visible: !hasIO, top: 0, h: 0 }));
    let docH = 1, vh = innerHeight, ticking = false, lastScrolled = null;
    measure = function () {
      vh = innerHeight; docH = Math.max(1, document.documentElement.scrollHeight - vh);
      const y = scrollY;
      parallax.forEach(p => { const t = p.el.style.transform; p.el.style.transform = ''; const r = p.el.getBoundingClientRect(); p.top = r.top + y; p.h = r.height; p.el.style.transform = t; });
    };
    if (hasIO) {
      const pIO = new IntersectionObserver(es => es.forEach(e => { const p = parallax.find(x => x.el === e.target); if (p) p.visible = e.isIntersecting; }), { rootMargin: '200px' });
      parallax.forEach(p => pIO.observe(p.el));
    }
    function onScroll() {
      ticking = false;
      const y = scrollY, sc = y > 40;
      if (sc !== lastScrolled && nav) { nav.classList.toggle('scrolled', sc); lastScrolled = sc; }
      if (prog) prog.style.transform = 'scaleX(' + Math.min(1, y / docH) + ')';
      if (useParallax && isDesktop()) {
        if (heroBg && y < vh) heroBg.style.transform = 'translate3d(0,' + (y * 0.25).toFixed(1) + 'px,0)';
        for (const p of parallax) {
          if (!p.visible) continue;
          p.el.style.transform = 'translate3d(0,' + ((p.top + p.h / 2 - y - vh / 2) * p.speed).toFixed(1) + 'px,0)';
        }
      }
    }
    const requestTick = () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } };
    addEventListener('scroll', requestTick, { passive: true });
    let rsT; addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(() => { measure(); requestTick(); }, 150); }, { passive: true });
    addEventListener('load', () => { measure(); requestTick(); });
    measure(); onScroll();

    if (hasIO) {
      const links = $$('.nav-links a');
      const secIO = new IntersectionObserver(es => es.forEach(e => {
        if (e.isIntersecting) links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
      }), { rootMargin: '-40% 0px -55% 0px' });
      $$('section[id]').forEach(s => secIO.observe(s));
    }
  });

  /* ============ menú móvil ============ */
  safe('menu', () => {
    const burger = $('#burger'), mmenu = $('#mmenu');
    if (!burger || !mmenu) return;
    const setMenu = open => {
      burger.classList.toggle('open', open); mmenu.classList.toggle('open', open);
      document.documentElement.style.overflow = open ? 'hidden' : '';
      burger.setAttribute('aria-expanded', String(open)); mmenu.setAttribute('aria-hidden', String(!open));
    };
    burger.addEventListener('click', () => setMenu(!mmenu.classList.contains('open')));
    $$('a', mmenu).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && mmenu.classList.contains('open')) { setMenu(false); burger.focus(); } });
  });

  /* ============ brillo del cursor (solo escritorio) ============ */
  safe('glow', () => {
    const glow = $('#glow'); if (!glow) return;
    if (!finePointer || reduced) { glow.remove(); return; }
    let gx = -600, gy = -600, q = false;
    addEventListener('pointermove', e => {
      gx = e.clientX; gy = e.clientY;
      if (!q) { q = true; requestAnimationFrame(() => { glow.style.transform = 'translate3d(' + gx + 'px,' + gy + 'px,0)'; q = false; }); }
    }, { passive: true });
  });

  /* ============ reveal + contadores ============ */
  function countUp(node) {
    if (node.dataset.done) return; node.dataset.done = '1';
    const end = parseFloat(node.dataset.count), dec = parseInt(node.dataset.dec || '0', 10);
    if (!isFinite(end)) return;
    const dur = reduced ? 1 : 1400, t0 = performance.now();
    (function step(t) { const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 4); node.textContent = (end * e).toFixed(dec).replace('.', ','); if (p < 1) requestAnimationFrame(step); })(t0);
  }
  safe('reveal', () => {
    const targets = $$('.rv, .stg');
    if (!hasIO) { targets.forEach(t => t.classList.add('in')); $$('[data-count]').forEach(countUp); return; }
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      const t = en.target;
      if (t.classList.contains('stg')) Array.from(t.children).forEach((c, i) => { c.style.transitionDelay = (i * 0.09) + 's'; });
      t.classList.add('in');
      $$('[data-count]', t).forEach(countUp);
      io.unobserve(t);
    }), { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });
    targets.forEach(t => io.observe(t));
    setTimeout(() => $$('.hero [data-count]').forEach(countUp), 900);
  });

  /* ============ confeti del hero (canvas) ============ */
  safe('confetti', () => {
    const cv = $('#confetti'), hero = $('#inicio'), slogan = $('#slogan');
    const ctx = cv && cv.getContext ? cv.getContext('2d') : null;
    if (!ctx || !hero) return;
    const DPR = Math.min(devicePixelRatio || 1, 1.5);
    const AMBIENT = reduced ? 0 : (isDesktop() && !lowPower ? 34 : 14);
    const MAX_PIECES = 260;
    let W = 0, H = 0, pieces = [], running = false, heroVisible = true, rafId = 0, last = 0;
    const sizeCv = () => { W = cv.clientWidth * DPR; H = cv.clientHeight * DPR; cv.width = W; cv.height = H; };
    const mk = (x, y, burst) => ({
      x: x != null ? x : Math.random() * W, y: y != null ? y : -20, w: (6 + Math.random() * 7) * DPR, h: (3 + Math.random() * 4) * DPR,
      vx: burst ? (Math.random() - .5) * 14 : (Math.random() - .5) * .8, vy: burst ? -Math.random() * 12 - 4 : .7 + Math.random() * 1.3,
      r: Math.random() * 6.28, vr: (Math.random() - .5) * .16, c: colors[Math.random() * colors.length | 0], burst: !!burst, life: 1
    });
    sizeCv();
    for (let i = 0; i < AMBIENT; i++) { const p = mk(); p.y = Math.random() * H; pieces.push(p); }
    function frame(t) {
      const dt = Math.min(2, last ? (t - last) / 16.67 : 1); last = t;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
      for (let i = pieces.length - 1; i >= 0; i--) {
        const p = pieces[i];
        if (p.burst) { p.vy += .32 * dt; p.vx *= .99; p.life -= .01 * dt; if (p.life <= 0 || p.y > H + 40) { pieces.splice(i, 1); continue; } }
        p.x += p.vx * DPR * dt; p.y += p.vy * DPR * dt; p.r += p.vr * dt;
        if (!p.burst && p.y > H + 20) { p.y = -20; p.x = Math.random() * W; }
        const c = Math.cos(p.r), s = Math.sin(p.r);
        ctx.setTransform(c, s, -s, c, p.x, p.y);
        ctx.globalAlpha = p.burst ? p.life : .8; ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      if (running) rafId = requestAnimationFrame(frame);
    }
    const start = () => { if (running || !pieces.length || !heroVisible || document.hidden) return; running = true; last = 0; rafId = requestAnimationFrame(frame); };
    const stop = () => { running = false; cancelAnimationFrame(rafId); };
    if (hasIO) new IntersectionObserver(e => { heroVisible = e[0].isIntersecting; heroVisible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    let cvT; addEventListener('resize', () => { clearTimeout(cvT); cvT = setTimeout(sizeCv, 200); }, { passive: true });
    function burst(x, y) {
      if (reduced) return;
      const r = cv.getBoundingClientRect(), n = Math.min(isDesktop() ? 80 : 40, MAX_PIECES - pieces.length);
      for (let i = 0; i < n; i++) pieces.push(mk((x - r.left) * DPR, (y - r.top) * DPR, true));
      start();
    }
    if (slogan) {
      slogan.addEventListener('click', e => burst(e.clientX, e.clientY));
      setTimeout(() => { const r = slogan.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2); }, 1100);
    }
    start();
    $$('.confetti-btn').forEach(b => b.addEventListener('click', e => domBurst(e.clientX, e.clientY)));
  });

  /* ============ tablero de números + balotera ============ */
  safe('picker', () => {
    const numsEl = $('#nums'), chips = $('#chips'), sendBtn = $('#sendBtn');
    if (!numsEl || !chips || !sendBtn) return;
    const selected = loadNums(), numBtns = Object.create(null), frag = document.createDocumentFragment();
    for (let i = 0; i < 100; i++) {
      const n = String(i).padStart(2, '0');
      const b = el('button', 'num-btn', n); b.type = 'button'; b.dataset.n = n; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'Número ' + n);
      numBtns[n] = b; frag.appendChild(b);
    }
    numsEl.appendChild(frag);
    const setBtn = (n, on) => { const b = numBtns[n]; if (!b) return; b.classList.toggle('sel', on); b.setAttribute('aria-pressed', String(on)); };
    function toggleNum(n, force) {
      if (!NUM_RE.test(n)) return;
      const on = typeof force === 'boolean' ? force : !selected.has(n);
      on ? selected.add(n) : selected.delete(n);
      setBtn(n, on); renderCart();
    }
    function renderCart() {
      const arr = Array.from(selected).filter(n => NUM_RE.test(n)).sort();
      const frag2 = document.createDocumentFragment();
      if (arr.length) arr.forEach(n => frag2.appendChild(el('span', 'chip', '#' + n)));
      else frag2.appendChild(el('span', 'empty', 'Aún no has escogido números'));
      chips.replaceChildren(frag2);
      const msg = arr.length
        ? 'Hola Cristian 😎, quiero apartar ' + (arr.length > 1 ? 'los números' : 'el número') + ': ' + arr.join(', ') + '. ¿Están disponibles?'
        : 'Hola Cristian 😎, quiero participar en el sorteo.';
      sendBtn.href = waLink(msg);
      store.set('ec-nums', arr);
    }
    selected.forEach(n => setBtn(n, true));
    renderCart();
    numsEl.addEventListener('click', e => { const b = e.target.closest('.num-btn'); if (b) toggleNum(b.dataset.n); });
    const clearBtn = $('#clearBtn');
    if (clearBtn) clearBtn.addEventListener('click', () => { selected.forEach(n => setBtn(n, false)); selected.clear(); renderCart(); toast('Tablero limpio 🧹'); });
    sendBtn.addEventListener('click', e => domBurst(e.clientX, e.clientY));

    const flash = b => { if (!b) return; b.classList.remove('flash'); void b.offsetWidth; b.classList.add('flash'); };
    const search = $('#numSearch');
    if (search) search.addEventListener('input', () => {
      const v = search.value.replace(/\D/g, '').slice(0, 2);
      if (search.value !== v) search.value = v;
      for (const n in numBtns) numBtns[n].classList.toggle('dim', v !== '' && !n.startsWith(v));
      if (v.length === 2) flash(numBtns[v]);
    });

    const spinBtn = $('#spinBtn'), ball = $('#luckyBall'), luckyTxt = $('#luckyTxt'), drum = $('#drum');
    if (!spinBtn || !ball || !luckyTxt || !drum) return;
    let spinning = false;
    spinBtn.addEventListener('click', () => {
      if (spinning) return;
      spinning = true; drum.classList.add('spinning'); ball.classList.add('show'); spinBtn.disabled = true; spinBtn.textContent = 'Girando…';
      const rnd = () => {
        const a = new Uint8Array(1);
        do { crypto.getRandomValues(a); } while (a[0] >= 200); // sin sesgo de módulo
        return String(a[0] % 100).padStart(2, '0');
      };
      const final = rnd();
      let ticks = 0;
      const iv = setInterval(() => {
        try {
          ball.textContent = rnd();
          if (++ticks <= 22) return;
          clearInterval(iv);
          ball.textContent = final; drum.classList.remove('spinning');
          if (ball.animate) ball.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 500, easing: 'cubic-bezier(.34,1.8,.5,1)' });
          const b = el('b', 'gold', '#' + final);
          luckyTxt.replaceChildren('¡Salió el ', b, '! Lo agregamos a tu tablero.');
          toggleNum(final, true); flash(numBtns[final]);
          const r = ball.getBoundingClientRect(); domBurst(r.left + r.width / 2, r.top + r.height / 2);
        } catch (err) {
          clearInterval(iv); drum.classList.remove('spinning'); toast('No pudimos girar la balotera, intenta de nuevo.');
        } finally {
          if (ticks > 22 || !drum.classList.contains('spinning')) { spinning = false; spinBtn.disabled = false; spinBtn.textContent = '🎰 Girar otra vez'; }
        }
      }, 70);
    });
  });

  /* ============ tarjetas de entregas (inclinación 3D, solo escritorio) ============ */
  safe('tilt', () => {
    if (!finePointer || reduced) return;
    $$('[data-tilt]').forEach(card => {
      let rect = null, q = false, ex = 0, ey = 0;
      card.addEventListener('pointerenter', () => { rect = card.getBoundingClientRect(); });
      card.addEventListener('pointermove', e => {
        ex = e.clientX; ey = e.clientY; if (q || !rect) return; q = true;
        requestAnimationFrame(() => {
          const x = (ex - rect.left) / rect.width, y = (ey - rect.top) / rect.height;
          card.style.transform = 'perspective(1000px) rotateY(' + ((x - .5) * 10).toFixed(2) + 'deg) rotateX(' + ((.5 - y) * 10).toFixed(2) + 'deg)';
          card.style.setProperty('--mx', (x * 100).toFixed(1) + '%'); card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
          q = false;
        });
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  });

  /* ============ próximos sorteos: filtros, giro y votos ============ */
  safe('future', () => {
    const pill = $('#pill'), fBtns = $$('#filters button');
    const movePill = b => { if (pill && b) { pill.style.left = b.offsetLeft + 'px'; pill.style.width = b.offsetWidth + 'px'; } };
    movePill($('#filters .on'));
    addEventListener('resize', () => requestAnimationFrame(() => movePill($('#filters .on'))), { passive: true });
    if (document.fonts) document.fonts.ready.then(() => { movePill($('#filters .on')); measure(); }).catch(() => {});
    const ALLOWED_F = ['all', 'moto', 'carro'];
    fBtns.forEach(b => b.addEventListener('click', () => {
      const f = ALLOWED_F.includes(b.dataset.f) ? b.dataset.f : 'all';
      fBtns.forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
      movePill(b);
      $$('.fcard').forEach(c => c.classList.toggle('hide', !(f === 'all' || c.dataset.cat === f || c.dataset.cat === 'all')));
    }));

    $$('.fcard:not(.suggest)').forEach(c => {
      const toggle = () => { const on = c.classList.toggle('flipped'); c.setAttribute('aria-pressed', String(on)); };
      c.addEventListener('click', e => { if (!e.target.closest('.vote')) toggle(); });
      c.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target === c) { e.preventDefault(); toggle(); } });
    });

    const votes = loadVotes();
    $$('.fcard').forEach(c => {
      const btn = $('.vote', c), id = c.dataset.id;
      if (!btn || !VOTE_IDS.includes(id)) return;
      const name = ($('h3', c) || {}).textContent || 'Premio';
      btn.href = waLink('Hola Cristian 😎, voto para que el próximo sorteo sea: ' + name);
      const markVoted = () => { btn.classList.add('voted'); btn.textContent = '✔ Ya votaste'; };
      if (votes[id]) markVoted();
      // Es un <a> real: el navegador abre WhatsApp en el mismo gesto del usuario (no lo bloquea el anti-popups)
      btn.addEventListener('click', e => {
        e.stopPropagation();
        if (votes[id]) return;
        votes[id] = true; store.set('ec-votes', votes); markVoted();
        domBurst(e.clientX, e.clientY); toast('¡Voto registrado por la ' + name.toLowerCase() + '! 🔥');
      });
    });
  });

  /* ============ cuenta regresiva ============ */
  safe('countdown', () => {
    if (!CONFIG.proximoSorteo) return;
    const target = Date.parse(CONFIG.proximoSorteo);
    if (!isFinite(target) || target <= Date.now() || target - Date.now() > 366 * 864e5) return;
    const cd = $('#cd'); if (!cd) return;
    cd.hidden = false;
    const title = String(CONFIG.nombreProximoSorteo || '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 60);
    $('#cdTitle').textContent = title ? title.toUpperCase() : 'PRÓXIMO SORTEO';
    $('#cdText').textContent = 'Corre, que los números vuelan. Aparta el tuyo antes de que se acabe el tiempo.';
    const btn = $('#cdBtn'); btn.textContent = 'Apartar mi número ⚡'; btn.href = '#numeros'; btn.removeAttribute('target'); btn.removeAttribute('rel');
    const pad = n => String(n).padStart(2, '0'), D = $('#cdD'), Hh = $('#cdH'), M = $('#cdM'), S = $('#cdS');
    (function tick() {
      const d = Math.max(0, target - Date.now());
      D.textContent = pad(Math.floor(d / 864e5)); Hh.textContent = pad(Math.floor(d / 36e5) % 24);
      M.textContent = pad(Math.floor(d / 6e4) % 60); S.textContent = pad(Math.floor(d / 1e3) % 60);
      if (d > 0) setTimeout(tick, 1000);
    })();
  });

  /* ============ verificador de número oficial ============ */
  safe('verify', () => {
    const form = $('#checkForm'), input = $('#checkInput'), res = $('#checkResult');
    if (!form || !input || !res) return;
    const ALLOWED = /^[\d\s()+\-.]*$/;
    const show = (kind, icon, parts) => {
      res.className = 'result show ' + kind;
      const msg = el('span');
      parts.forEach(p => msg.append(typeof p === 'string' ? p : el(p.tag, null, p.text)));
      res.replaceChildren(el('span', 'big', icon), msg);
    };
    input.addEventListener('input', () => { if (input.value.length > 20) input.value = input.value.slice(0, 20); input.removeAttribute('aria-invalid'); });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const raw = input.value.trim();
      if (!raw) { input.setAttribute('aria-invalid', 'true'); show('bad', '✍️', ['Escribe un número para verificar.']); return; }
      if (raw.length > 20 || !ALLOWED.test(raw)) { input.setAttribute('aria-invalid', 'true'); show('bad', '✍️', ['Escribe solo números (puedes usar espacios, guiones o +57).']); return; }
      let v = raw.replace(/\D/g, '');
      if (v.length === 12 && v.startsWith('57')) v = v.slice(2);
      if (!/^3\d{9}$/.test(v)) { input.setAttribute('aria-invalid', 'true'); show('bad', '🤔', ['Eso no parece un celular colombiano válido (10 dígitos, empieza por 3).']); return; }
      if (WHATSAPP && v === WHATSAPP.slice(2)) {
        show('good', '✅', ['¡Número oficial de Eventos Cristian! Puedes comprar con tranquilidad. 😎']);
        const r = res.getBoundingClientRect(); domBurst(r.left + 40, r.top + 20);
      } else {
        show('bad', '⚠️', ['Este número ', { tag: 'b', text: 'NO' }, ' es el oficial. No envíes dinero. El único WhatsApp oficial es el 322 205 3255.']);
        if (res.animate) res.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(8px)' }, { transform: 'translateX(0)' }], { duration: 350 });
      }
    });
  });

  /* ============ preguntas frecuentes ============ */
  safe('faq', () => {
    $$('.qa button').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.addEventListener('click', () => {
        const qa = b.parentElement, open = qa.classList.contains('open');
        $$('.qa').forEach(q => { q.classList.remove('open'); const qb = $('button', q); if (qb) qb.setAttribute('aria-expanded', 'false'); });
        if (!open) { qa.classList.add('open'); b.setAttribute('aria-expanded', 'true'); }
      });
    });
  });

  /* ============ pista del botón flotante ============ */
  safe('fab', () => {
    const f = $('#fab'); if (!f) return;
    setTimeout(() => { f.classList.add('hint'); setTimeout(() => f.classList.remove('hint'), 4000); }, 6000);
  });
})();
