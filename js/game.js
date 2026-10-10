/*
 * El hambre de Usagi: Space Invaders al revés.
 * Usagi saca la lengua para comerse los dulces de la formación y evitar la comida saludable.
 * Arranca en 10 kg y tiene que pasar los 100 kg antes de que se acabe el tiempo.
 */
(() => {
  "use strict";

  const SWEETS = [
    ["🍩", 7], ["🍰", 8], ["🍫", 6], ["🍬", 5], ["🍭", 5], ["🧁", 7], ["🍪", 6], ["🍦", 7], ["🍮", 8],
  ];
  const HEALTHY = [
    ["🥦", -6], ["🥕", -4], ["🥗", -6], ["🍎", -4], ["🥬", -5], ["🥒", -4],
  ];
  const VITAMIN_KG = 2;
  const SWEET_WORDS = ["ÑAM", "ÑOM ÑOM", "RICO", "MÁS", "DELICIA"];
  const YUCK_WORDS = ["¡PUAJ!", "¡ASCO!", "¡VITAMINAS NO!", "¡VERDE NO!"];
  const LOSE_QUIPS = [
    "Usagi sigue con hambre y te mira con decepción.",
    "Usagi pidió delivery por su cuenta.",
    "Usagi dice que así no se puede vivir.",
  ];
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const ARCADE_FONT = '"Pixelify Sans", ui-monospace, monospace';
  const SPRITE_ASPECT = 201 / 370;
  const MOUTH = { x: 0.473, y: 0.263 };

  const $ = (id) => document.getElementById(id);
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const usagiImg = new Image();
  usagiImg.src = "assets/usagi.png";
  const fatSprite = new Image();
  fatSprite.src = "assets/usagi-gorda.png";

  const emojiCache = new Map();
  function emojiSprite(ch, size) {
    const key = ch + size;
    if (emojiCache.has(key)) return emojiCache.get(key);
    const pad = Math.ceil(size * 0.25);
    const c = document.createElement("canvas");
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = c.height = (size + pad * 2) * dpr;
    const g = c.getContext("2d");
    g.scale(dpr, dpr);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.font = `${size}px ${EMOJI_FONT}`;
    g.fillText(ch, size / 2 + pad, size / 2 + pad + size * 0.06);
    const sprite = { c, s: size + pad * 2 };
    emojiCache.set(key, sprite);
    return sprite;
  }

  // ---------- Sonido ----------
  // Los efectos y la música viven en js/audio.js
  const sfx = (kind) => window.Sound.sfx(kind);

  function open({ cfg, stage: bossStage, fails: startFails, battleFails: startBattleFails, done, onPhase1Win, onLose, onBattleLose, onWin, onExit }) {
    const arcade = $("arcade");
    const stage = $("arcadeStage");
    const canvas = $("gameCanvas");
    const ctx = canvas.getContext("2d");
    const screen = $("arcadeScreen");
    const hudEls = { la: $("hudLabelA"), a: $("hudA"), lb: $("hudLabelB"), b: $("hudB"), fill: $("hudFill"), goal: $("hudGoal") };
    const menuBtns = [...document.querySelectorAll("#battleMenu .ut-btn")];
    const touchUI = window.matchMedia("(hover: none), (pointer: coarse)").matches;

    const GOAL = cfg.pesoMeta;
    const START = cfg.pesoInicial;
    const SECONDS = cfg.segundos;

    let fails = startFails;
    let battleFails = startBattleFails;
    let W = 0, H = 0, dpr = 1;
    let mode = "intro"; // intro | countdown | play | over | transform | battle-intro | battle | battle-over | won
    let scene = "invaders";
    let transformT = 0;
    let raf = 0;
    let last = 0;
    let countdown = 0;
    let lastTick = 0;

    let kg, timeLeft, wave, foods, formation, drops, dropTimer, bonus, bonusTimer;
    let floaters, crumbs, banner, invuln, squash, shake, eaten;
    const player = { x: 0 };
    const tongue = { state: "idle", len: 0, caught: null };
    const keys = { left: false, right: false };
    const stars = [];

    const mercy = () => 1 + 0.25 * Math.min(fails, 4);
    const battleHp = () => 20 + 4 * Math.min(battleFails, 4);

    function setHud(la, a, lb, b, pct, goal) {
      const set = (el, v) => { if (el.textContent !== v) el.textContent = v; };
      set(hudEls.la, la);
      set(hudEls.a, a);
      set(hudEls.lb, lb);
      set(hudEls.b, b);
      set(hudEls.goal, goal);
      hudEls.fill.style.width = `${clamp(pct * 100, 0, 100)}%`;
    }

    const battle = window.UsagiBattle.create({
      ctx,
      size: () => ({ W, H }),
      sfx,
      hud: setHud,
      menu: menuBtns,
      onDeath: () => {
        window.Sound.music(null);
        mode = "battle-over";
        battleFails++;
        onBattleLose();
        showScreen(`
          <h3>GAME OVER</h3>
          <p>¡No te rindas! Mantené tu DETERMINACIÓN.</p>
          <p>Tu DETERMINACIÓN aumentó: ahora tenés ${battleHp()} HP.</p>
          <div class="row">
            <button type="button" class="arcade-go" data-act="rebattle">REINTENTAR</button>
            <button type="button" class="arcade-go alt" data-act="exit">SALIR</button>
          </div>`);
      },
      onWin: () => {
        window.Sound.music(null);
        mode = "won";
        sfx("win");
        onWin();
        showScreen(`
          <h3>GANASTE</h3>
          <p>Perdonaste a Usagi. Ganaste 0 EXP, 0 de oro y un manual.</p>
          <div class="row"><button type="button" class="arcade-go" data-act="prize">VER MI PREMIO</button></div>`);
      },
    });

    function render(now) {
      if (scene === "battle") battle.draw(now);
      else draw(now);
    }
    function resize() {
      const r = stage.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      const oldW = W || r.width;
      W = r.width;
      H = r.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      player.x = clamp(player.x * (W / oldW), 0, W);
      stars.length = 0;
      for (let k = 0; k < 46; k++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 1.3 + 0.3, p: Math.random() * 6.28 });
      battle.relayout();
      if (mode !== "play" && mode !== "battle") render(performance.now());
    }

    function reset() {
      kg = START;
      timeLeft = SECONDS;
      wave = 0;
      drops = [];
      floaters = [];
      crumbs = [];
      banner = null;
      bonus = null;
      bonusTimer = rand(10, 14);
      dropTimer = 1.6;
      invuln = 0;
      squash = 0;
      shake = 0;
      eaten = 0;
      player.x = W / 2;
      tongue.state = "idle";
      tongue.len = 0;
      tongue.caught = null;
      spawnWave(false);
      updateHud();
    }

    function spawnWave(announce) {
      wave++;
      // Que la formación ocupe ~3/4 del ancho: si llena la pantalla rebota sin parar y baja de golpe.
      const cols = W < 420 ? 6 : 7;
      const cell = Math.min(50, (W * 0.76) / cols);
      const rows = 4;
      const healthyChance = Math.min(0.42, 0.3 + wave * 0.03);
      foods = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const healthy = Math.random() < healthyChance;
          const [ch, val] = healthy ? pick(HEALTHY) : pick(SWEETS);
          foods.push({ r, c, ch, val, healthy, alive: true, ph: Math.random() * 6.28 });
        }
      }
      formation = { x: (W - cols * cell) / 2, y: 62, cell, cols, rows, dir: Math.random() < 0.5 ? -1 : 1, speed: 30 + wave * 8 };
      if (announce) banner = { text: "¡MÁS DULCES!", t: 1.3 };
    }

    const foodX = (f) => formation.x + f.c * formation.cell + formation.cell / 2;
    const foodY = (f) => formation.y + f.r * formation.cell * 0.92 + formation.cell / 2;

    function body() {
      const prog = clamp((kg - START) / (GOAL - START), 0, 1.25);
      const h = Math.min(H * 0.21, 124) * (0.94 + prog * 0.1);
      const w = h * SPRITE_ASPECT * (0.62 + prog * 1.05);
      const bottom = H - 10;
      return {
        prog, w, h, bottom, top: bottom - h,
        mouthX: player.x + (MOUTH.x - 0.5) * w,
        mouthY: bottom - h + MOUTH.y * h,
      };
    }

    function updateHud() {
      setHud("TIEMPO", String(Math.ceil(timeLeft)), "PESO", `${Math.max(0, Math.round(kg))} kg`, kg / GOAL, `${GOAL} kg`);
    }

    function addFloater(text, x, y, color) {
      floaters.push({ text, x, y, color, t: 1.1 });
    }
    function addCrumbs(x, y, colors, n = 10) {
      for (let k = 0; k < n; k++) {
        crumbs.push({ x, y, vx: rand(-90, 90), vy: rand(-140, -30), t: rand(0.4, 0.8), c: pick(colors), s: rand(2, 4.5) });
      }
    }

    function fire() {
      if (mode !== "play" || tongue.state !== "idle") return;
      tongue.state = "out";
      tongue.len = 0;
      sfx("slurp");
    }

    function eat(item) {
      const b = body();
      if (item.kind === "food" && !item.healthy) {
        const gain = item.val * mercy();
        kg += gain;
        eaten++;
        squash = 0.25;
        addFloater(`+${Math.round(gain)} kg`, b.mouthX, b.top - 6, "#ffd1dc");
        if (Math.random() < 0.35) addFloater(pick(SWEET_WORDS), b.mouthX + rand(-30, 30), b.top - 26, "#ffffff");
        addCrumbs(b.mouthX, b.mouthY, ["#ffb3c4", "#f5d27a", "#8b4a2b", "#ffffff"]);
        sfx("yum");
      } else if (item.kind === "food") {
        kg = Math.max(1, kg + item.val);
        shake = 0.3;
        addFloater(`${item.val} kg`, b.mouthX, b.top - 6, "#9be39b");
        addFloater(pick(YUCK_WORDS), b.mouthX, b.top - 26, "#c8f5c0");
        addCrumbs(b.mouthX, b.mouthY, ["#3f9b4a", "#7ccf6a", "#f08a2c"]);
        sfx("yuck");
      } else if (item.kind === "cake") {
        const gain = 12 * mercy();
        kg += gain;
        squash = 0.35;
        addFloater(`TORTA +${Math.round(gain)} kg`, b.mouthX, b.top - 10, "#f5d27a");
        addCrumbs(b.mouthX, b.mouthY, ["#ffffff", "#ff7aa2", "#f5d27a"], 18);
        sfx("bonus");
      } else if (item.kind === "pill") {
        kg = Math.max(1, kg - VITAMIN_KG);
        addFloater(`-${VITAMIN_KG} kg VITAMINA`, b.mouthX, b.top - 6, "#9be39b");
        sfx("yuck");
      }
      updateHud();
      if (kg >= GOAL) finish(true);
    }

    function updateTongue(dt, b) {
      if (tongue.state === "idle") return;
      if (tongue.state === "out") {
        const prevTip = b.mouthY - tongue.len;
        tongue.len += 1150 * dt;
        const tip = b.mouthY - tongue.len;
        const thr = formation.cell * 0.42;
        let hit = null;
        let hitY = -Infinity;
        for (const f of foods) {
          if (!f.alive) continue;
          const fx = foodX(f), fy = foodY(f);
          if (Math.abs(fx - b.mouthX) < thr && fy + thr > tip && fy - thr < prevTip && fy > hitY) {
            hit = f;
            hitY = fy;
          }
        }
        for (const d of drops) {
          if (Math.abs(d.x - b.mouthX) < 12 && d.y + 10 > tip && d.y - 10 < prevTip && d.y > hitY) {
            hit = d;
            hitY = d.y;
          }
        }
        if (bonus && Math.abs(bonus.x - b.mouthX) < 26 && bonus.y + 20 > tip && bonus.y - 20 < prevTip && bonus.y > hitY) {
          hit = bonus;
          hitY = bonus.y;
        }
        if (hit) {
          if (hit === bonus) {
            tongue.caught = { kind: "cake", ch: "🎂" };
            bonus = null;
          } else if (drops.includes(hit)) {
            tongue.caught = { kind: "pill" };
            drops.splice(drops.indexOf(hit), 1);
          } else {
            hit.alive = false;
            tongue.caught = { kind: "food", ch: hit.ch, val: hit.val, healthy: hit.healthy };
          }
          tongue.len = b.mouthY - hitY;
          tongue.state = "back";
        } else if (tip < 6) {
          tongue.state = "back";
        }
      } else {
        tongue.len -= 1500 * dt;
        if (tongue.len <= 0) {
          tongue.len = 0;
          tongue.state = "idle";
          if (tongue.caught) {
            const c = tongue.caught;
            tongue.caught = null;
            eat(c);
          }
        }
      }
    }

    function update(dt) {
      timeLeft -= dt;
      if (timeLeft <= 0) {
        timeLeft = 0;
        updateHud();
        finish(kg >= GOAL);
        return;
      }
      const b = body();

      const speed = 300 * (1.08 - b.prog * 0.32);
      if (keys.left) player.x -= speed * dt;
      if (keys.right) player.x += speed * dt;
      player.x = clamp(player.x, b.w / 2, W - b.w / 2);

      // Formación: cuando no quedan dulces, lo saludable se va y entra otra tanda.
      const alive = foods.filter((f) => f.alive);
      if (!alive.some((f) => !f.healthy)) {
        spawnWave(true);
      } else {
        const ratio = alive.length / foods.length;
        const sp = formation.speed * (1 + (1 - ratio) * 1.3);
        formation.x += formation.dir * sp * dt;
        let minC = Infinity, maxC = -Infinity, maxR = -Infinity;
        for (const f of alive) {
          minC = Math.min(minC, f.c);
          maxC = Math.max(maxC, f.c);
          maxR = Math.max(maxR, f.r);
        }
        const left = formation.x + minC * formation.cell;
        const right = formation.x + (maxC + 1) * formation.cell;
        if (right > W - 4 && formation.dir > 0) { formation.dir = -1; formation.y += 14; }
        else if (left < 4 && formation.dir < 0) { formation.dir = 1; formation.y += 14; }
        const bottom = formation.y + (maxR + 1) * formation.cell * 0.92;
        if (bottom > b.top - 8) {
          banner = { text: "¡SE ESCAPARON!", t: 1.2 };
          spawnWave(false);
        }
      }

      // Vitaminas que caen
      dropTimer -= dt;
      if (dropTimer <= 0) {
        dropTimer = rand(1.1, 2) - Math.min(wave * 0.06, 0.4);
        const shooters = foods.filter((f) => f.alive && f.healthy);
        if (shooters.length) {
          const s = pick(shooters);
          drops.push({ x: foodX(s), y: foodY(s) + 10, vy: 150 + wave * 12, rot: Math.random() * 3 });
        }
      }
      for (const d of drops) {
        d.y += d.vy * dt;
        d.rot += dt * 5;
      }
      invuln = Math.max(0, invuln - dt);
      for (let k = drops.length - 1; k >= 0; k--) {
        const d = drops[k];
        if (d.y > H + 20) { drops.splice(k, 1); continue; }
        if (invuln <= 0 && Math.abs(d.x - player.x) < b.w * 0.4 && d.y > b.top + b.h * 0.15 && d.y < b.bottom) {
          drops.splice(k, 1);
          kg = Math.max(1, kg - VITAMIN_KG);
          invuln = 0.8;
          shake = 0.3;
          addFloater(`-${VITAMIN_KG} kg VITAMINA`, player.x, b.top - 6, "#9be39b");
          sfx("ouch");
          updateHud();
        }
      }

      // Torta voladora
      bonusTimer -= dt;
      if (!bonus && bonusTimer <= 0) {
        const dir = Math.random() < 0.5 ? 1 : -1;
        bonus = { x: dir > 0 ? -30 : W + 30, y: 30, dir };
        bonusTimer = rand(12, 17);
      }
      if (bonus) {
        bonus.x += bonus.dir * 115 * dt;
        if (bonus.x < -50 || bonus.x > W + 50) bonus = null;
      }

      updateTongue(dt, b);

      for (const f of floaters) { f.t -= dt; f.y -= 40 * dt; }
      floaters = floaters.filter((f) => f.t > 0);
      for (const c of crumbs) { c.t -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 420 * dt; }
      crumbs = crumbs.filter((c) => c.t > 0);
      if (banner) { banner.t -= dt; if (banner.t <= 0) banner = null; }
      squash = Math.max(0, squash - dt);
      shake = Math.max(0, shake - dt);
      updateHud();
    }

    // ---------- Dibujo ----------
    function capsule(x, y, w, h) {
      const r = w / 2;
      ctx.beginPath();
      ctx.moveTo(x, y + r);
      ctx.arc(x + r, y + r, r, Math.PI, 0);
      ctx.lineTo(x + w, y + h - r);
      ctx.arc(x + r, y + h - r, r, 0, Math.PI);
      ctx.closePath();
    }
    function drawPill(x, y, rot) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      capsule(-5, -10, 10, 20);
      ctx.fillStyle = "#f4fff2";
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.35)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-5, 0);
      ctx.lineTo(-5, -5);
      ctx.arc(0, -5, 5, Math.PI, 0);
      ctx.lineTo(5, 0);
      ctx.closePath();
      ctx.fillStyle = "#3fbf5a";
      ctx.fill();
      ctx.restore();
    }

    function drawSprite(ch, x, y, size) {
      const s = emojiSprite(ch, size);
      ctx.drawImage(s.c, x - s.s / 2, y - s.s / 2, s.s, s.s);
    }

    function draw(now) {
      ctx.save();
      if (shake > 0) ctx.translate(rand(-3, 3), rand(-3, 3));
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#22030a");
      g.addColorStop(1, "#4a0a17");
      ctx.fillStyle = g;
      ctx.fillRect(-5, -5, W + 10, H + 10);
      for (const s of stars) {
        ctx.fillStyle = `rgba(255,200,210,${0.25 + 0.25 * Math.sin(now / 700 + s.p)})`;
        ctx.fillRect(s.x, s.y, s.r, s.r);
      }
      // mantel
      const cloth = 8;
      for (let x = 0; x < W; x += cloth * 2) {
        ctx.fillStyle = "#ff7aa2";
        ctx.fillRect(x, H - cloth, cloth, cloth);
        ctx.fillStyle = "#fff0f4";
        ctx.fillRect(x + cloth, H - cloth, cloth, cloth);
      }

      if (formation) {
        const size = Math.round(formation.cell * 0.66);
        for (const f of foods) {
          if (!f.alive) continue;
          drawSprite(f.ch, foodX(f), foodY(f) + Math.sin(now / 300 + f.ph) * 2, size);
        }
      }
      if (bonus) {
        ctx.save();
        ctx.shadowColor = "#f5d27a";
        ctx.shadowBlur = 16;
        drawSprite("🎂", bonus.x, bonus.y + Math.sin(now / 160) * 3, 30);
        ctx.restore();
      }
      if (drops) for (const d of drops) drawPill(d.x, d.y, d.rot);

      if (usagiImg.complete && usagiImg.naturalWidth && kg !== undefined) {
        const b = body();
        const sq = squash > 0 ? Math.sin((squash / 0.25) * Math.PI) * 0.08 : 0;
        const w = b.w * (1 + sq);
        const h = b.h * (1 - sq);
        const tilt = (keys.left ? -0.05 : keys.right ? 0.05 : 0);
        ctx.save();
        if (invuln > 0 && Math.floor(now / 80) % 2) ctx.globalAlpha = 0.45;
        ctx.translate(player.x, b.bottom);
        ctx.rotate(tilt);
        ctx.drawImage(usagiImg, -w / 2, -h, w, h);
        ctx.restore();

        if (tongue.len > 0) {
          const tipY = b.mouthY - tongue.len;
          ctx.lineCap = "round";
          ctx.strokeStyle = "#e0507e";
          ctx.lineWidth = 11;
          ctx.beginPath(); ctx.moveTo(b.mouthX, b.mouthY); ctx.lineTo(b.mouthX, tipY); ctx.stroke();
          ctx.strokeStyle = "#ff8fb3";
          ctx.lineWidth = 7;
          ctx.beginPath(); ctx.moveTo(b.mouthX, b.mouthY); ctx.lineTo(b.mouthX, tipY); ctx.stroke();
          ctx.strokeStyle = "rgba(160,30,70,.6)";
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.moveTo(b.mouthX, b.mouthY + 2); ctx.lineTo(b.mouthX, tipY + 6); ctx.stroke();
          ctx.fillStyle = "#ff8fb3";
          ctx.beginPath(); ctx.ellipse(b.mouthX, tipY, 8, 9, 0, 0, 6.283); ctx.fill();
          if (tongue.caught) {
            if (tongue.caught.kind === "pill") drawPill(b.mouthX, tipY - 8, 0);
            else drawSprite(tongue.caught.ch, b.mouthX, tipY - 10, tongue.caught.kind === "cake" ? 30 : Math.round(formation.cell * 0.66));
          }
        }
      }

      if (crumbs) for (const c of crumbs) {
        ctx.fillStyle = c.c;
        ctx.globalAlpha = clamp(c.t * 2, 0, 1);
        ctx.fillRect(c.x, c.y, c.s, c.s);
      }
      ctx.globalAlpha = 1;

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";
      if (floaters) for (const f of floaters) {
        ctx.globalAlpha = clamp(f.t * 1.6, 0, 1);
        ctx.font = `600 15px ${ARCADE_FONT}`;
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#1a0207";
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillStyle = f.color;
        ctx.fillText(f.text, f.x, f.y);
      }
      ctx.globalAlpha = 1;

      const centerText = mode === "countdown" ? (countdown > 0.6 ? String(Math.ceil(countdown - 0.6)) : "¡ÑAM!") : banner ? banner.text : "";
      if (centerText) {
        ctx.font = `700 ${mode === "countdown" ? 48 : 24}px ${ARCADE_FONT}`;
        ctx.lineWidth = 6;
        ctx.strokeStyle = "#1a0207";
        ctx.strokeText(centerText, W / 2, H * 0.48);
        ctx.fillStyle = "#ff7aa2";
        ctx.fillText(centerText, W / 2, H * 0.48);
      }
      ctx.restore();
    }

    // Al llegar a la meta Usagi crece, la pantalla se apaga y empieza la traición.
    function drawTransform(now) {
      draw(now);
      const p = clamp(transformT / 2.6, 0, 1);
      ctx.fillStyle = `rgba(0,0,0,${clamp(p * 1.6, 0, 1)})`;
      ctx.fillRect(0, 0, W, H);
      const b = body();
      const grow = clamp((p - 0.15) / 0.6, 0, 1);
      const h = b.h + (Math.min(H * 0.42, 260) - b.h) * grow;
      const w = h * (420 / 457);
      const cx = player.x + (W / 2 - player.x) * grow;
      const bottom = b.bottom + (H * 0.62 - b.bottom) * grow;
      const shakeX = p > 0.2 && p < 0.8 ? rand(-4, 4) : 0;
      ctx.drawImage(fatSprite, cx - w / 2 + shakeX, bottom - h, w, h);
      if (p > 0.45 && p < 0.55) {
        ctx.fillStyle = `rgba(255,255,255,${1 - Math.abs(p - 0.5) * 20})`;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function transform() {
      mode = "transform";
      transformT = 0;
      tongue.state = "idle";
      tongue.len = 0;
      onPhase1Win(Math.round(kg));
      window.Sound.music(null);
      sfx("betray");
    }

    function enterBattle(firstTime) {
      window.Sound.music("battle");
      scene = "battle";
      arcade.classList.add("is-battle");
      screen.innerHTML = "";
      mode = "battle";
      battle.start(firstTime, battleHp());
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }

    function loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000 || 0);
      last = now;
      if (mode === "countdown") {
        countdown -= dt;
        const n = Math.ceil(countdown - 0.6);
        if (n !== lastTick && n > 0) { lastTick = n; sfx("tick"); }
        if (countdown <= 0) { mode = "play"; sfx("go"); }
      } else if (mode === "play") {
        update(dt);
      } else if (mode === "transform") {
        transformT += dt;
        if (transformT >= 2.6) {
          enterBattle(true);
          return;
        }
        drawTransform(now);
        raf = requestAnimationFrame(loop);
        return;
      } else if (mode === "battle") {
        battle.update(dt);
      }
      render(now);
      if (mode === "countdown" || mode === "play" || mode === "battle" || mode === "transform") raf = requestAnimationFrame(loop);
    }

    function start() {
      window.Sound.music("invaders");
      reset();
      screen.innerHTML = "";
      mode = "countdown";
      countdown = 3.6;
      lastTick = 0;
      last = performance.now();
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    }

    function finish(won) {
      if (mode !== "play") return;
      mode = "over";
      tongue.state = "idle";
      tongue.len = 0;
      const final = Math.round(kg);
      if (won) {
        mode = "play";
        transform();
      } else {
        window.Sound.music(null);
        sfx("lose");
        fails++;
        onLose();
        showScreen(`
          <h3>SE ACABÓ EL TIEMPO</h3>
          <p class="big">${final} kg</p>
          <p>${pick(LOSE_QUIPS)} Faltaron ${Math.max(1, GOAL - final)} kg.</p>
          ${mercyNote(true)}
          <div class="row">
            <button type="button" class="arcade-go" data-act="retry">REINTENTAR</button>
            <button type="button" class="arcade-go alt" data-act="exit">SALIR</button>
          </div>`);
      }
    }

    function mercyNote(justFailed) {
      if (fails < 1) return "";
      const pct = Math.round((mercy() - 1) * 100);
      return justFailed
        ? `<p>Usagi se apiadó de vos: ahora los dulces engordan un ${pct} % más.</p>`
        : `<p>Modo piedad: los dulces engordan un ${pct} % más.</p>`;
    }

    function showScreen(html) {
      screen.innerHTML = html;
      const btn = screen.querySelector("button");
      if (btn) setTimeout(() => btn.focus({ preventScroll: true }), 50);
    }

    function intro() {
      mode = "intro";
      const controls = touchUI
        ? "Arrastrá el dedo para moverte. Tocá la pantalla o LENGÜETAZO para sacar la lengua."
        : "Flechas ← → para moverte. ESPACIO para el lengüetazo.";
      showScreen(`
        <h3>EL HAMBRE DE USAGI</h3>
        <p>Usagi pesa ${START} kg y quiere pasar los ${GOAL} kg en ${SECONDS} segundos. Ayudala.</p>
        <div class="rules">
          <p><span class="em">🍩🍫🧁</span> Dulces: engordan</p>
          <p><span class="em">🥦🥕🥗</span> Saludable: adelgaza</p>
          <p><span class="em">💊</span> Esquivá las vitaminas</p>
          <p><span class="em">🎂</span> Torta voladora: bonus</p>
        </div>
        <p>${controls}</p>
        ${done ? "<p>Ya le ganaste. Esta vuelta es por diversión.</p>" : mercyNote(false)}
        <div class="row"><button type="button" class="arcade-go" data-act="start">¡A COMER!</button></div>`);
      reset();
      draw(performance.now());
    }

    function battleIntro() {
      mode = "battle-intro";
      scene = "battle";
      arcade.classList.add("is-battle");
      const controls = touchUI
        ? "Arrastrá el dedo para mover el corazón. Tocá la pantalla para pasar los diálogos."
        : "Flechas para mover el corazón. Z o ENTER para elegir y avanzar.";
      battle.start(false, battleHp());
      showScreen(`
        <h3>USAGI TE TRAICIONÓ</h3>
        <p>Usagi pesa 100 kg y todavía tiene hambre. Esquivá sus ataques durante 7 turnos y perdonala.</p>
        <p>${controls}</p>
        ${battleFails ? `<p>DETERMINACIÓN: ${battleHp()} HP.</p>` : ""}
        <div class="row"><button type="button" class="arcade-go" data-act="battle">PELEAR</button></div>`);
      battle.draw(performance.now());
    }

    // ---------- Entrada ----------
    function onScreenClick(e) {
      const btn = e.target.closest("button[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "start" || act === "retry") start();
      else if (act === "battle" || act === "rebattle") enterBattle(false);
      else if (act === "prize") close(true);
      else if (act === "exit") close(false);
    }

    const MOVE_KEYS = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right" };
    function onKeyDown(e) {
      if (e.key === "Escape") return close(false);
      if (scene === "battle") {
        if (mode === "battle") battle.key(e, true);
        return;
      }
      if (MOVE_KEYS[e.key]) { keys[MOVE_KEYS[e.key]] = true; e.preventDefault(); }
      else if (e.key === " " || e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        if (mode === "play") { fire(); e.preventDefault(); }
      } else if (e.key === "Escape") close(false);
    }
    function onKeyUp(e) {
      if (scene === "battle") return battle.key(e, false);
      if (MOVE_KEYS[e.key]) keys[MOVE_KEYS[e.key]] = false;
    }

    let drag = null;
    function onPointerDown(e) {
      if (mode === "battle") {
        canvas.setPointerCapture(e.pointerId);
        return battle.pointerDown(e);
      }
      if (mode !== "play") return;
      canvas.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x0: e.clientX, px: player.x, t: performance.now(), moved: 0 };
    }
    function onPointerMove(e) {
      if (mode === "battle") return battle.pointerMove(e);
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x0;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      const b = body();
      player.x = clamp(drag.px + dx * 1.2, b.w / 2, W - b.w / 2);
    }
    function onPointerUp(e) {
      if (scene === "battle") return battle.pointerUp(e);
      if (!drag || e.pointerId !== drag.id) return;
      if (drag.moved < 10 && performance.now() - drag.t < 320) fire();
      drag = null;
    }

    function holdPad(el, key) {
      const down = (e) => { e.preventDefault(); keys[key] = true; el.classList.add("is-down"); };
      const up = () => { keys[key] = false; el.classList.remove("is-down"); };
      el.addEventListener("pointerdown", down);
      el.addEventListener("pointerup", up);
      el.addEventListener("pointercancel", up);
      el.addEventListener("pointerleave", up);
      return () => {
        el.removeEventListener("pointerdown", down);
        el.removeEventListener("pointerup", up);
        el.removeEventListener("pointercancel", up);
        el.removeEventListener("pointerleave", up);
      };
    }
    const firePad = $("padFire");
    const onFirePad = (e) => { e.preventDefault(); fire(); };

    const muteBtn = $("arcadeMute");
    const syncMute = () => {
      muteBtn.textContent = window.Sound.muted ? "Sonido: no" : "Sonido: sí";
      muteBtn.setAttribute("aria-pressed", String(window.Sound.muted));
    };
    const onMute = () => window.Sound.toggle();
    const offMute = window.Sound.onChange(syncMute);
    const onExitBtn = () => close(mode === "won");
    const onMenuClick = (e) => {
      const i = menuBtns.indexOf(e.currentTarget);
      if (i >= 0 && mode === "battle") battle.pickAction(i);
    };
    const onVisibility = () => { last = performance.now(); };

    if (location.hash === "#dev") {
      window.__usagiDebug = () => ({
        mode, scene, kg, timeLeft, W, H, tongue: tongue.state, mouthX: body().mouthX,
        foods: (foods || []).filter((f) => f.alive).map((f) => ({ x: foodX(f), y: foodY(f), healthy: f.healthy, c: f.c })),
      });
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(stage);
    screen.addEventListener("click", onScreenClick);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    const unpadL = holdPad($("padLeft"), "left");
    const unpadR = holdPad($("padRight"), "right");
    firePad.addEventListener("pointerdown", onFirePad);
    muteBtn.addEventListener("click", onMute);
    $("arcadeExit").addEventListener("click", onExitBtn);
    menuBtns.forEach((b) => b.addEventListener("click", onMenuClick));
    document.addEventListener("visibilitychange", onVisibility);
    syncMute();

    function close(won) {
      cancelAnimationFrame(raf);
      mode = "closed";
      ro.disconnect();
      screen.removeEventListener("click", onScreenClick);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      unpadL();
      unpadR();
      firePad.removeEventListener("pointerdown", onFirePad);
      muteBtn.removeEventListener("click", onMute);
      offMute();
      $("arcadeExit").removeEventListener("click", onExitBtn);
      menuBtns.forEach((b) => b.removeEventListener("click", onMenuClick));
      document.removeEventListener("visibilitychange", onVisibility);
      keys.left = keys.right = false;
      battle.releaseKeys();
      arcade.classList.remove("is-battle");
      screen.innerHTML = "";
      onExit(won);
    }

    resize();
    const fontsReady = document.fonts && document.fonts.load ? document.fonts.load(`600 15px ${ARCADE_FONT}`).catch(() => {}) : Promise.resolve();
    if (bossStage >= 1 && !done) battleIntro();
    else intro();
    const redraw = () => { if (mode === "intro" || mode === "battle-intro") render(performance.now()); };
    fontsReady.then(redraw);
    usagiImg.decode?.().then(redraw).catch(() => {});
    fatSprite.decode?.().then(redraw).catch(() => {});

    return { close };
  }

  window.UsagiGame = { open };
})();
