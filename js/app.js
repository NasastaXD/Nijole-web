(() => {
  "use strict";

  const C = window.CONFIG;
  const LEVELS = C.niveles;
  const TOTAL = LEVELS.length;
  const BOSS = TOTAL;
  const KEY = "manual-usagi:v3";
  const DEV = location.hash === "#dev";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const Sound = window.Sound;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // ---------- Estado ----------
  const fresh = () => ({ opened: false, started: false, done: [], poem: "", poemDraft: "", bossKg: 0, bossFails: 0, bossStage: 0, battleFails: 0 });
  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) return Object.assign(fresh(), JSON.parse(raw));
    } catch (e) { /* sin almacenamiento: se juega igual, solo que no recuerda */ }
    return fresh();
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* idem */ }
  }

  const isDone = (i) => state.done.includes(i);
  function currentIndex() {
    for (let i = 0; i <= BOSS; i++) if (!isDone(i)) return i;
    return BOSS + 1;
  }
  const isUnlocked = (i) => DEV || i <= currentIndex();

  function complete(i) {
    if (!isDone(i)) {
      state.done.push(i);
      save();
    }
    refreshVine();
    refreshFinale();
    refreshPill();
  }

  // ---------- Utilidades ----------
  function mulberry32(seed) {
    return () => {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(list, last) {
    if (list.length < 2) return list[0];
    let x;
    do { x = list[Math.floor(Math.random() * list.length)]; } while (x === last);
    return x;
  }

  function scrollToEl(el, block = "center") {
    if (!el) return;
    el.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block });
  }

  function petalBurst(n = 26) {
    Sound.sfx("bloom");
    if (reducedMotion) return;
    for (let k = 0; k < n; k++) {
      const p = document.createElement("span");
      p.className = "petal-fx";
      p.style.left = Math.random() * 100 + "vw";
      p.style.setProperty("--dx", (Math.random() * 160 - 80).toFixed(0) + "px");
      p.style.setProperty("--rot", (Math.random() * 720 - 360).toFixed(0) + "deg");
      p.style.animationDuration = (2.4 + Math.random() * 2.2).toFixed(2) + "s";
      p.style.animationDelay = (Math.random() * 0.6).toFixed(2) + "s";
      p.style.scale = (0.7 + Math.random() * 0.8).toFixed(2);
      p.addEventListener("animationend", () => p.remove());
      document.body.appendChild(p);
    }
  }

  // ---------- Papel rasgado ----------
  const tornObserver = new ResizeObserver((entries) => {
    for (const e of entries) tear(e.target);
  });
  function tear(el) {
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    if (!w || !h) return;
    const rnd = mulberry32(Number(el.dataset.seed || 7));
    const pts = [];
    const amp = 6;
    const step = 7;
    for (let x = 0; x < w; x += step) pts.push([x, rnd() * amp + (rnd() < 0.08 ? 3 : 0)]);
    pts.push([w, rnd() * amp]);
    for (let y = 20; y < h - 20; y += 26) pts.push([w - rnd() * 2.5, y]);
    for (let x = w; x > 0; x -= step) pts.push([x, h - rnd() * amp - (rnd() < 0.08 ? 3 : 0)]);
    pts.push([0, h - rnd() * amp]);
    for (let y = h - 20; y > 20; y -= 26) pts.push([rnd() * 2.5, y]);
    el.style.clipPath = `polygon(${pts.map(([x, y]) => `${x.toFixed(1)}px ${y.toFixed(1)}px`).join(",")})`;
  }
  $$(".torn").forEach((el, k) => {
    el.dataset.seed = String(11 + k * 17);
    tornObserver.observe(el);
  });

  // ---------- Polvo flotante ----------
  const dust = (() => {
    const cv = $("#dust");
    const ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, running = true, last = 0;
    const specks = [];
    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = window.innerWidth; H = window.innerHeight;
      cv.width = W * dpr; cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function seed() {
      specks.length = 0;
      const n = Math.round(Math.min(60, (W * H) / 9000));
      for (let k = 0; k < n; k++) {
        specks.push({
          x: Math.random() * W, y: Math.random() * H,
          r: 0.4 + Math.random() * 1.5,
          vy: -(3 + Math.random() * 10), vx: Math.random() * 4 - 2,
          a: 0.12 + Math.random() * 0.45, ph: Math.random() * 6.28,
          gold: Math.random() < 0.35,
        });
      }
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (const s of specks) {
        const tw = 0.6 + 0.4 * Math.sin(t / 900 + s.ph);
        ctx.fillStyle = s.gold ? `rgba(230,190,120,${s.a * tw})` : `rgba(255,170,180,${s.a * tw})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
      }
    }
    function frame(t) {
      if (!running) return;
      const dt = Math.min(0.05, (t - last) / 1000 || 0);
      last = t;
      for (const s of specks) {
        s.y += s.vy * dt; s.x += s.vx * dt + Math.sin(t / 1500 + s.ph) * 0.08;
        if (s.y < -5) { s.y = H + 5; s.x = Math.random() * W; }
        if (s.x < -5) s.x = W + 5; else if (s.x > W + 5) s.x = -5;
      }
      draw(t);
      requestAnimationFrame(frame);
    }
    resize(); seed();
    window.addEventListener("resize", () => { resize(); seed(); if (reducedMotion) draw(0); });
    if (reducedMotion) draw(0); else requestAnimationFrame(frame);
    return {
      pause() { running = false; },
      resume() { if (!running && !reducedMotion) { running = true; last = performance.now(); requestAnimationFrame(frame); } },
    };
  })();

  // ---------- Escena 1 y 2: sobre y carta ----------
  function fillLetter() {
    $("#letterHello").textContent = C.carta.saludo;
    $("#letterBody").innerHTML = C.carta.parrafos.map((p) => `<p>${esc(p)}</p>`).join("");
    $("#letterSign").textContent = C.carta.despedida;
    $("#termsText").textContent = C.carta.terminos;
  }

  function showLetter(animate) {
    if (animate) Sound.sfx("paper");
    $("#sceneEnvelope").hidden = true;
    const letter = $("#sceneLetter");
    letter.hidden = false;
    if (!animate) letter.style.animation = "none";
  }

  $("#sealBtn").addEventListener("click", () => {
    const env = $("#envelope");
    if (env.classList.contains("is-open")) return;
    Sound.sfx("wax");
    env.classList.add("is-open");
    state.opened = true;
    save();
    const wait = reducedMotion ? 50 : 1500;
    setTimeout(() => {
      $("#sceneEnvelope").classList.add("is-leaving");
      setTimeout(() => {
        showLetter(true);
        window.scrollTo({ top: 0 });
      }, reducedMotion ? 10 : 650);
    }, wait);
  });

  $("#acceptTerms").addEventListener("change", (e) => {
    $("#beginBtn").disabled = !e.target.checked;
  });

  $("#beginBtn").addEventListener("click", () => {
    state.started = true;
    save();
    $("#terms").hidden = true;
    startJourney(true);
  });

  function startJourney(fromBegin) {
    $("#vineWrap").hidden = false;
    $("#finale").hidden = false;
    $("#progressPill").hidden = false;
    buildVine();
    refreshFinale();
    refreshPill();
    requestAnimationFrame(() => {
      layoutStem();
      if (fromBegin) setTimeout(() => scrollToEl(nodeEl(0)), 120);
    });
  }

  // ---------- Enredadera ----------
  const nodeEl = (i) => $(`.node[data-i="${i}"]`);

  function makeNode(i) {
    if (LEVELS[i].tipo === "jefe") return makeBossNode(i, { sprite: LEVELS[i].sprite, mini: true });
    const node = document.createElement("div");
    node.className = "node" + (i % 2 ? " is-right" : "");
    node.dataset.i = String(i);
    node.innerHTML = `
      <button class="bloom" type="button">
        <svg viewBox="-52 -52 104 104" aria-hidden="true">
          <g class="flower"><use href="#rose"/></g>
          <g class="bud" transform="translate(0 -6) scale(1.2)"><use href="#bud"/></g>
        </svg>
      </button>
      <div class="tag">
        <p class="eyebrow"></p>
        <p class="tag-title"></p>
      </div>`;
    node.querySelector(".bloom").addEventListener("click", () => onBloom(i));
    return node;
  }

  function makeBossNode(i, { sprite = "assets/usagi.png", mini = false } = {}) {
    const node = document.createElement("div");
    node.className = "node boss" + (mini ? " mini" : "") + (i % 2 ? " is-right" : "");
    node.dataset.i = String(i);
    node.innerHTML = `
      <button class="bloom" type="button">
        <span class="boss-portrait${mini ? " is-sprite" : ""}"><img src="${esc(sprite)}" alt=""></span>
        <svg class="boss-rose r1" viewBox="-52 -52 104 104" aria-hidden="true"><use href="#rose"/></svg>
        <svg class="boss-rose r2" viewBox="-52 -52 104 104" aria-hidden="true"><use href="#rose"/></svg>
        <svg class="boss-rose r3" viewBox="-52 -52 104 104" aria-hidden="true"><use href="#rose"/></svg>
      </button>
      <div class="tag">
        <p class="eyebrow">${mini ? "" : "Jefe final"}</p>
        <p class="tag-title"></p>
      </div>`;
    node.querySelector(".bloom").addEventListener("click", () => onBloom(i));
    return node;
  }

  function buildVine() {
    const vine = $("#vine");
    $$(".node, .bfly", vine).forEach((n) => n.remove());
    for (let i = 0; i < TOTAL; i++) vine.appendChild(makeNode(i));
    vine.appendChild(makeBossNode(BOSS));
    [1, 4, 7].forEach((k, n) => {
      const b = document.createElement("div");
      b.className = "bfly";
      b.dataset.near = String(k);
      b.style.animationDelay = `${-n * 2.3}s`;
      b.innerHTML = `<svg viewBox="-26 -20 52 42" aria-hidden="true" style="animation-delay:${-n * 0.11}s"><use href="#butterfly"/></svg>`;
      vine.appendChild(b);
    });
    refreshVine();
  }

  function refreshVine() {
    const cur = currentIndex();
    for (let i = 0; i <= BOSS; i++) {
      const node = nodeEl(i);
      if (!node) continue;
      const done = isDone(i);
      const unlocked = isUnlocked(i);
      node.classList.toggle("is-done", done);
      node.classList.toggle("is-current", !done && unlocked && (i === cur || DEV));
      node.classList.toggle("is-locked", !unlocked);

      const isBoss = i === BOSS;
      const lv = isBoss ? null : LEVELS[i];
      const title = isBoss ? C.jefe.titulo : lv.titulo;
      const eyebrow = node.querySelector(".eyebrow");
      if (!isBoss) eyebrow.textContent = unlocked ? `Nivel ${i + 1} · ${lv.tema}` : `Nivel ${i + 1}`;
      node.querySelector(".tag-title").textContent = unlocked ? title : "¿?";
      node.querySelector(".bloom").setAttribute(
        "aria-label",
        `${isBoss ? "Jefe final" : `Nivel ${i + 1}`}: ${unlocked ? title : "bloqueado"}${done ? ", superado" : ""}`
      );

      const oldMedal = node.querySelector(".medal");
      if (oldMedal) oldMedal.remove();
      if (done && !isBoss) {
        const medal = document.createElement("span");
        medal.className = "medal";
        medal.innerHTML = lv.tipo === "meme"
          ? `<img src="${esc(lv.imagen)}" alt="">`
          : `<svg viewBox="-34 -34 68 68" aria-hidden="true"><use href="#seal"/></svg>`;
        node.querySelector(".bloom").appendChild(medal);
      }
    }
  }

  function layoutStem() {
    const vine = $("#vine");
    const svg = $("#stem");
    if (!vine || vine.offsetParent === null) return;
    const vr = vine.getBoundingClientRect();
    const W = vr.width;
    const H = vine.offsetHeight;
    const pts = $$(".node .bloom", vine).map((b) => {
      const r = b.getBoundingClientRect();
      return { x: r.left - vr.left + r.width / 2, y: r.top - vr.top + r.height / 2 };
    });
    if (!pts.length) return;
    svg.setAttribute("viewBox", `0 0 ${W.toFixed(1)} ${H.toFixed(1)}`);
    const all = [{ x: W * 0.5, y: 0 }, ...pts, { x: W * 0.5, y: H }];
    let d = `M${all[0].x.toFixed(1)},${all[0].y.toFixed(1)}`;
    for (let k = 1; k < all.length; k++) {
      const a = all[k - 1], b = all[k];
      const dy = (b.y - a.y) * 0.55;
      d += ` C${a.x.toFixed(1)},${(a.y + dy).toFixed(1)} ${b.x.toFixed(1)},${(b.y - dy).toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
    }
    svg.innerHTML =
      `<path class="stem-main" d="${d}" fill="none" stroke="#1d4024" stroke-width="6" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="#5a9460" stroke-opacity=".45" stroke-width="1.6" transform="translate(-1.6 0)"/>`;

    const path = svg.querySelector(".stem-main");
    const L = path.getTotalLength();
    const rnd = mulberry32(67);
    let side = 1;
    let leaves = "";
    let thorns = "";
    for (let s = 20; s < L - 10; s += 30 + rnd() * 16) {
      const p = path.getPointAtLength(s);
      const q = path.getPointAtLength(Math.min(L, s + 1));
      const ang = (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
      if (pts.some((c) => Math.hypot(c.x - p.x, c.y - p.y) < 64)) continue;
      const rot = ang + side * (48 + rnd() * 26);
      const sc = 0.5 + rnd() * 0.4;
      leaves += `<use href="#leaf" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${rot.toFixed(1)}) scale(${sc.toFixed(2)})"/>`;
      if (rnd() < 0.35) {
        const tr = ang - side * 70;
        thorns += `<path d="M0,-2 L7,0 L0,2Z" fill="#2c5a33" transform="translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${tr.toFixed(1)})"/>`;
      }
      side = -side;
    }
    svg.insertAdjacentHTML("beforeend", thorns + leaves);

    $$(".bfly", vine).forEach((b) => {
      const c = pts[Number(b.dataset.near)];
      if (!c) return;
      const right = c.x < W / 2;
      b.style.left = `${(right ? c.x + 58 : c.x - 92).toFixed(0)}px`;
      b.style.top = `${(c.y - 74).toFixed(0)}px`;
    });
  }

  let resizeTimer = 0;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(layoutStem, 120);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => layoutStem());

  function onBloom(i) {
    if (!isUnlocked(i)) {
      nodeEl(i).querySelector(".bloom").animate(
        [{ transform: "rotate(0)" }, { transform: "rotate(-12deg)" }, { transform: "rotate(10deg)" }, { transform: "rotate(0)" }],
        { duration: 380 }
      );
      return;
    }
    if (i === BOSS) openGame();
    else if (LEVELS[i].tipo === "jefe") openFacu(i);
    else openSheet(i);
  }

  function goNext(i) {
    closeSheet();
    const next = i + 1;
    const el = next <= BOSS ? nodeEl(next) : $("#finale");
    if (next <= BOSS && el && !reducedMotion) {
      el.classList.remove("just-bloomed");
      void el.offsetWidth;
      el.classList.add("just-bloomed");
    }
    setTimeout(() => scrollToEl(el), 60);
  }

  // ---------- Hoja de nivel ----------
  const FALLOS = [
    "Nop. Usagi llora en un rincón.",
    "Casi. Bueno, no tan casi.",
    "Error 404: respuesta correcta no encontrada.",
    "Esa respuesta no existe ni en el multiverso.",
    "Mi profe de precálculo sintió un escalofrío.",
    "Incorrecto, pero lo dijiste con mucha seguridad y eso cuenta. (No cuenta).",
    "Respirá hondo y probá de nuevo. Creo en vos.",
    "Le mostré tu respuesta a la calculadora y se apagó sola.",
  ];
  let lastFallo = "";
  let lastFocus = null;

  function openSheet(i) {
    const lv = LEVELS[i];
    lastFocus = document.activeElement;
    $("#sheetEyebrow").textContent = `Nivel ${i + 1} de ${TOTAL} · ${lv.tema}`;
    $("#sheetTitle").textContent = lv.titulo;
    const body = $("#sheetBody");
    body.innerHTML = "";
    ({ respuesta: renderRespuesta, meme: renderMeme, rickroll: renderRick, poema: renderPoema })[lv.tipo](lv, i, body);
    $("#sheet").hidden = false;
    Sound.sfx("paper");
    document.documentElement.style.overflow = "hidden";
    $(".sheet-scroll").scrollTop = 0;
    const focusable = body.querySelector("input, textarea") || $("#sheetClose");
    setTimeout(() => focusable.focus({ preventScroll: true }), 80);
  }

  function closeSheet() {
    $("#sheet").hidden = true;
    document.documentElement.style.overflow = "";
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  }
  $("#sheetClose").addEventListener("click", closeSheet);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#sheet").hidden) closeSheet();
  });

  function nextButtonHTML(i) {
    const next = LEVELS[i + 1];
    const label = i + 1 === BOSS ? "Ir al jefe final" : next && next.tipo === "jefe" ? "Ir al jefe" : "Siguiente rosa";
    return `<button class="btn-wax" type="button" data-next>${label}</button>`;
  }
  function wireNext(root, i) {
    const b = root.querySelector("[data-next]");
    if (b) b.addEventListener("click", () => goNext(i));
  }

  function setFeedback(el, text, kind) {
    el.className = "feedback" + (kind ? ` is-${kind}` : "");
    el.innerHTML = text;
    if (kind === "bad") {
      Sound.sfx("bad");
      void el.offsetWidth;
      el.classList.add("shake");
    }
  }

  function parseNumber(raw) {
    let s = raw.trim().toLowerCase().replace(/\s+/g, "");
    s = s.replace(/^[a-zθ]+=/, "").replace(/(metros?|mts?|m|kg)$/, "").replace(",", ".");
    if (/^-?\d+(\.\d+)?\/-?\d+(\.\d+)?$/.test(s)) {
      const [a, b] = s.split("/").map(Number);
      return b ? a / b : NaN;
    }
    if (/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return Number(s);
    return NaN;
  }

  function renderRespuesta(lv, i, body) {
    const digits = lv.comparar === "digitos";
    body.innerHTML = `
      <p>${lv.enunciado}</p>
      <div class="formula">${lv.formula}</div>
      <form class="answer-form" id="answerForm" novalidate>
        <label class="sr-only" for="answerInput">Tu respuesta</label>
        <input class="answer-input" id="answerInput" type="text" inputmode="${digits ? "numeric" : "decimal"}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Tu respuesta">
        <button class="btn-wax" type="submit">Comprobar</button>
      </form>
      <p class="feedback" id="feedback" aria-live="polite"></p>
      <div class="sheet-actions" id="hintRow" hidden><button type="button" class="link-btn" id="hintBtn">¿Pista?</button></div>
      <p class="hint" id="hint" hidden></p>
      <div class="sheet-actions" id="nextRow" hidden>${nextButtonHTML(i)}</div>`;
    wireNext(body, i);
    const form = $("#answerForm", body);
    const input = $("#answerInput", body);
    const fb = $("#feedback", body);
    const hint = $("#hint", body);
    let misses = 0;

    const win = (first) => {
      input.disabled = true;
      form.querySelector("button").disabled = true;
      setFeedback(fb, lv.exito, "good");
      $("#hintRow", body).hidden = true;
      $("#nextRow", body).hidden = false;
      if (first) {
        complete(i);
        petalBurst();
      }
    };

    if (isDone(i)) {
      input.value = String(lv.respuesta);
      win(false);
      return;
    }

    $("#hintBtn", body).addEventListener("click", () => {
      hint.innerHTML = `<strong>Pista:</strong> ${lv.pista}`;
      hint.hidden = false;
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = input.value;
      if (!raw.trim()) {
        setFeedback(fb, "Escribí algo, aunque sea un número al azar.", "bad");
        return;
      }
      let ok = false;
      let key;
      if (digits) {
        key = raw.replace(/\D/g, "");
        ok = key === String(lv.respuesta);
      } else {
        const v = parseNumber(raw);
        if (Number.isNaN(v)) {
          setFeedback(fb, "Eso no es un número. Es arte, pero no es un número.", "bad");
          return;
        }
        key = String(Math.round(v * 1000) / 1000);
        ok = Math.abs(v - lv.respuesta) < 1e-6;
      }
      if (ok) return win(true);

      misses++;
      const special = lv.especiales && lv.especiales[key];
      lastFallo = special || pick(FALLOS, lastFallo);
      setFeedback(fb, esc(lastFallo), "bad");
      if (misses >= 2) $("#hintRow", body).hidden = false;
      if (misses >= 4) {
        hint.innerHTML = `<strong>Pista:</strong> ${lv.pista}<br><br>Bueno, te la regalo: es <strong>${esc(lv.respuesta)}</strong>. Pero me debés un beso.`;
        hint.hidden = false;
      }
      input.select();
    });
  }

  function renderMeme(lv, i, body) {
    body.innerHTML = `
      <figure class="polaroid">
        <img src="${esc(lv.imagen)}" alt="${esc(lv.alt)}">
        <figcaption>${esc(lv.titulo)}</figcaption>
      </figure>
      ${lv.texto ? `<p>${esc(lv.texto)}</p>` : ""}
      <div class="sheet-actions">
        <button class="btn-wax" type="button" id="memeOk">Ya me reí, sigamos</button>
        <button class="btn-wax ghost" type="button" id="memeNo">No me dio risa</button>
      </div>
      <p class="feedback" id="feedback" aria-live="polite"></p>`;
    const fb = $("#feedback", body);
    const finish = () => {
      const first = !isDone(i);
      complete(i);
      if (first) petalBurst(14);
      goNext(i);
    };
    $("#memeOk", body).addEventListener("click", finish);
    $("#memeNo", body).addEventListener("click", () => {
      $("#memeOk", body).disabled = true;
      $("#memeNo", body).disabled = true;
      setFeedback(fb, "Error: sentido del humor no encontrado. Reiniciando todo por boluda…", "bad");
      Sound.sfx("trombone");
      setTimeout(resetProgress, 2800);
    });
  }

  function renderRick(lv, i, body) {
    body.innerHTML = `
      <p>${esc(lv.texto)}</p>
      <a class="rick-link" id="rickLink" href="${esc(lv.url)}" target="_blank" rel="noopener noreferrer">${esc(lv.boton)}</a>
      <p class="feedback" id="feedback" aria-live="polite"></p>
      <div class="sheet-actions" id="nextRow" hidden>${nextButtonHTML(i)}</div>`;
    wireNext(body, i);
    const fb = $("#feedback", body);
    const reveal = (first) => {
      setFeedback(fb, esc(lv.despues), "good");
      $("#nextRow", body).hidden = false;
      if (first) {
        complete(i);
        petalBurst(18);
      }
    };
    if (isDone(i)) return reveal(false);
    $("#rickLink", body).addEventListener("click", () => {
      setTimeout(() => reveal(!isDone(i)), 1200);
    });
  }

  const SIX_SEVEN = /67|six[\s-]*seven|seis[\s-]*siete|sesenta\s*y\s*siete/i;

  function renderPoema(lv, i, body) {
    body.innerHTML = `
      <p>${esc(lv.enunciado)}</p>
      <label class="sr-only" for="poemInput">Tu poema</label>
      <textarea class="poem-input" id="poemInput" placeholder="${esc(lv.placeholder)}"></textarea>
      <p class="poem-meta" id="poemMeta"></p>
      <div class="sheet-actions" id="poemActions"><button class="btn-wax" type="button" id="poemSend">Publicar poema</button></div>
      <p class="feedback" id="feedback" aria-live="polite"></p>
      <div class="poem-out" id="poemOut" hidden></div>
      <div class="sheet-actions" id="nextRow" hidden>${nextButtonHTML(i)}</div>`;
    wireNext(body, i);
    const ta = $("#poemInput", body);
    const meta = $("#poemMeta", body);
    const fb = $("#feedback", body);
    const out = $("#poemOut", body);
    const verses = () => ta.value.split(/\n/).map((l) => l.trim()).filter(Boolean);

    const showPublished = (text, first) => {
      ta.hidden = true;
      meta.hidden = true;
      $("#poemActions", body).hidden = true;
      out.textContent = text;
      out.hidden = false;
      setFeedback(fb, esc(lv.exito), "good");
      $("#nextRow", body).hidden = false;
      if (first) {
        complete(i);
        petalBurst();
      }
    };
    if (isDone(i) && state.poem) return showPublished(state.poem, false);

    const updateMeta = () => {
      const n = verses().length;
      const has67 = SIX_SEVEN.test(ta.value);
      meta.textContent = `${n} ${n === 1 ? "verso" : "versos"} · ${has67 ? "67 presente" : "sin 67 todavía"}`;
    };
    ta.value = state.poemDraft || "";
    updateMeta();
    ta.addEventListener("input", () => {
      updateMeta();
      state.poemDraft = ta.value;
      save();
    });

    $("#poemSend", body).addEventListener("click", () => {
      const v = verses();
      if (!v.length) return setFeedback(fb, "La hoja en blanco también es arte, pero no cuenta.", "bad");
      if (!SIX_SEVEN.test(ta.value)) return setFeedback(fb, "Le falta el 67. Sin 67 no hay poema, hay prosa triste.", "bad");
      if (v.length < lv.minVersos) {
        return setFeedback(fb, `Tiene ${v.length} ${v.length === 1 ? "verso" : "versos"}. Mínimo ${lv.minVersos}: esto es un poema, no un tuit.`, "bad");
      }
      state.poem = v.join("\n");
      save();
      showPublished(state.poem, true);
    });
  }

  // ---------- Jefe final ----------
  let game = null;
  function openGame() {
    lastFocus = document.activeElement;
    $("#arcade").hidden = false;
    document.documentElement.style.overflow = "hidden";
    dust.pause();
    game = window.UsagiGame.open({
      cfg: C.jefe,
      stage: state.bossStage,
      fails: state.bossFails,
      battleFails: state.battleFails,
      done: isDone(BOSS),
      onLose: () => {
        state.bossFails++;
        save();
      },
      onPhase1Win: (kg) => {
        state.bossKg = Math.max(state.bossKg, kg);
        state.bossStage = 1;
        save();
      },
      onBattleLose: () => {
        state.battleFails++;
        save();
      },
      onWin: () => complete(BOSS),
      onExit: (won) => {
        $("#arcade").hidden = true;
        document.documentElement.style.overflow = "";
        dust.resume();
        Sound.music("romance");
        game = null;
        if (won) {
          setTimeout(() => {
            scrollToEl($("#finale"));
            Sound.sfx("fanfare");
            petalBurst(36);
          }, 80);
        } else if (lastFocus) {
          lastFocus.focus({ preventScroll: true });
        }
      },
    });
  }

  // ---------- Jefe intermedio: novela visual ----------
  function openFacu(i) {
    if (!$("#vn").hidden) return;
    lastFocus = document.activeElement;
    $("#vn").hidden = false;
    // Sin esto, Enter vuelve a "apretar" la rosa que abrió el jefe y reinicia la pelea.
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    $("#vnBox").tabIndex = -1;
    $("#vnBox").focus({ preventScroll: true });
    document.documentElement.style.overflow = "hidden";
    dust.pause();
    Sound.music("facu");
    window.FacuVN.open({
      cfg: C.facu,
      done: isDone(i),
      onWin: () => {
        complete(i);
        petalBurst(30);
      },
      onMigajera: () => resetProgress(),
      onExit: (won) => {
        $("#vn").hidden = true;
        document.documentElement.style.overflow = "";
        dust.resume();
        Sound.music("romance");
        if (won) setTimeout(() => goNext(i), 80);
        else if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
      },
    });
  }

  // ---------- Final y PDF ----------
  function refreshFinale() {
    const unlocked = isDone(BOSS);
    const fin = $("#finale");
    fin.classList.toggle("is-unlocked", unlocked);
    $("#manualBtn").disabled = !unlocked;
    $("#finaleEyebrow").textContent = unlocked ? "Premio desbloqueado" : "Premio final";
  }

  $("#manualBtn").addEventListener("click", async () => {
    const btn = $("#manualBtn");
    const status = $("#manualStatus");
    btn.disabled = true;
    status.textContent = "Imprimiendo tu manual…";
    try {
      const blob = await window.ManualPDF.build(C, { poem: state.poem, kg: state.bossKg || C.jefe.pesoMeta });
      const result = await window.ManualPDF.deliver(blob, "Manual-de-usuario.pdf");
      status.textContent = {
        saved: "Listo. Lo encontrás en tus descargas.",
        declined: "Cancelaste la descarga. Podés volver a intentarlo cuando quieras.",
        busy: "Ya hay una descarga esperando tu confirmación.",
        unavailable: "Esta vista no permite descargas. Abrí el sitio en el navegador para bajarlo.",
      }[result];
    } catch (err) {
      console.error(err);
      status.textContent = "No se pudo armar el PDF. Revisá la conexión a internet y probá de nuevo.";
    }
    btn.disabled = false;
  });

  // ---------- Píldora de progreso ----------
  function refreshPill() {
    const cur = currentIndex();
    $("#progressText").textContent =
      cur < TOTAL ? `Nivel ${cur + 1} de ${TOTAL}` : cur === BOSS ? "Jefe final" : "Manual desbloqueado";
  }
  $("#progressPill").addEventListener("click", () => {
    const cur = currentIndex();
    scrollToEl(cur <= BOSS ? nodeEl(cur) : $("#finale"));
  });

  // ---------- Reinicio ----------
  function resetProgress() {
    try { localStorage.removeItem(KEY); } catch (err) { /* nada que borrar */ }
    location.reload();
  }

  let resetArmed = 0;
  $("#resetBtn").addEventListener("click", (e) => {
    const b = e.currentTarget;
    if (Date.now() - resetArmed < 4000) return resetProgress();
    resetArmed = Date.now();
    b.textContent = "¿Seguro? Tocá de nuevo para borrar todo";
    setTimeout(() => { b.textContent = "Reiniciar progreso"; }, 4000);
  });

  // ---------- Sonido ----------
  const soundBtn = $("#soundBtn");
  function syncSound() {
    soundBtn.classList.toggle("is-muted", Sound.muted);
    soundBtn.setAttribute("aria-pressed", String(Sound.muted));
    soundBtn.setAttribute("aria-label", Sound.muted ? "Activar el sonido" : "Silenciar el sonido");
  }
  soundBtn.addEventListener("click", () => Sound.toggle());
  Sound.onChange(syncSound);
  syncSound();
  // El navegador solo deja sonar el audio después de un toque o una tecla.
  document.addEventListener("pointerdown", () => Sound.unlock(), true);
  document.addEventListener("keydown", () => Sound.unlock(), true);
  document.addEventListener("click", (e) => {
    if (e.target.closest(".btn-wax, .bloom, .sheet-close, .progress-pill, .link-btn, .rick-link, .sound-btn")) Sound.sfx("click");
  }, true);
  Sound.music("romance");

  // ---------- Arranque ----------
  fillLetter();
  if (state.opened) showLetter(false);
  if (state.started) {
    $("#acceptTerms").checked = true;
    $("#terms").hidden = true;
    startJourney(false);
    const cur = currentIndex();
    setTimeout(() => scrollToEl(cur <= BOSS ? nodeEl(cur) : $("#finale")), 400);
  }
})();
