/*
 * Fase 2 del jefe: Usagi, ya obesa, te traiciona.
 * Combate tipo Undertale: elegís una acción y después esquivás sus ataques
 * moviendo un corazón dentro de una caja. Sobreviví 7 turnos y perdonala.
 */
(() => {
  "use strict";

  const FONT = '"Pixelify Sans", ui-monospace, monospace';
  const EMOJI_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
  const CANDIES = ["🍬", "🍭", "🍫", "🍩", "🧁", "🍪"];
  const FAT_ASPECT = 420 / 457;
  const TURNS = 7;
  const DAMAGE = 4;
  const SOUL_R = 5;
  const SOUL_SPEED = 155;
  const GOD = location.hash === "#god"; // para probar el final sin recibir daño

  const fatImg = new Image();
  fatImg.src = "assets/usagi-gorda.png";

  const INTRO = [
    { who: "usagi", text: "Gracias por alimentarme." },
    { who: "usagi", text: "Ya peso 100 kg." },
    { who: "usagi", text: "Pero todavía tengo hambre..." },
    { who: "narr", text: "* Usagi te traicionó." },
  ];
  const RETRY = [{ who: "usagi", text: "¿Volviste? Qué rico." }];
  const TAUNTS = [
    "¿Pensabas que era tierna?",
    "Me diste 100 kg de dulces. Gracias, tonta.",
    "Ahora quiero el postre principal: vos.",
    "Ñam ñam ñam.",
    "¿Por qué no te dejás comer?",
    "Estoy... muy... llena...",
    "Un último bocado...",
  ];
  const MENU_LINES = [
    "* ¡Usagi gorda bloquea el camino!",
    "* Usagi huele a azúcar quemada.",
    "* Usagi se relame.",
    "* La panza de Usagi hace un ruido terrible.",
    "* Usagi te mira como si fueras un flan.",
    "* Usagi respira pesado.",
    "* Usagi casi no se puede mover.",
  ];
  const FIGHT_LINES = [
    "* Le pegás en la panza. La panza absorbe el golpe.",
    "* Atacás con todas tus fuerzas. Usagi ni se entera.",
    "* Le hacés cosquillas. Usagi tiembla entera, pero no le duele.",
  ];
  const ACT_LINES = [
    { text: "* Le hacés mimos a Usagi. Ronronea... y sigue con hambre." },
    { text: "* Le decís que está hermosa. Usagi se sonroja. Su próximo ataque va más lento.", speed: 0.8 },
    { text: "* Le contás un chiste de trigonometría. Nadie se ríe." },
    { text: "* Le mostrás un brócoli. Usagi se enoja MUCHO.", speed: 1.15 },
  ];

  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const emojiCache = new Map();
  function emojiSprite(ch, size) {
    const key = ch + size;
    if (emojiCache.has(key)) return emojiCache.get(key);
    const pad = Math.ceil(size * 0.25);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const c = document.createElement("canvas");
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

  function create(env) {
    const { ctx } = env;
    let mode = "idle"; // talk | menu | attack | dying | over
    let queue = [];
    let after = null;
    let line = null;
    let shown = 0;
    let blipAcc = 0;
    let turn = 0;
    let hp = 20;
    let maxHp = 20;
    let items = 3;
    let speedMul = 1;
    let selected = 0;
    let spareable = false;
    let sleeping = false;
    let invuln = 0;
    let shake = 0;
    let usagiHit = 0;
    let dmgText = null;
    let breakT = 0;
    let wave = null;
    let bullets = [];
    let hazards = [];
    const soul = { x: 0, y: 0 };
    const box = { x: 0, y: 0, w: 0, h: 0 };
    const keys = { left: false, right: false, up: false, down: false };
    let drag = null;
    let L = null;

    // Las cajas quedan abajo, como en Undertale; Usagi ocupa el espacio de arriba.
    function layout() {
      const { W, H } = env.size();
      const aw = Math.min(W - 32, 330);
      const ah = Math.min(H * 0.38, 240);
      const bottom = H - 12;
      const fightBox = { x: (W - aw) / 2, y: bottom - ah, w: aw, h: ah };
      const th = Math.min(150, H * 0.25);
      const textBox = { x: 12, y: bottom - th, w: W - 24, h: th };
      const usH = Math.max(80, Math.min(W * 0.6, fightBox.y - 34, 300));
      const usW = usH * FAT_ASPECT;
      const usX = W < 520 ? W * 0.3 : W * 0.38;
      const usY = Math.max(8, (fightBox.y - 16 - usH) / 2);
      const bubbleX = usX + usW * 0.42;
      return { W, H, usH, usW, usX, usY, textBox, fightBox, bubble: { x: bubbleX, y: usY + 6, w: Math.min(W - bubbleX - 10, 240) } };
    }
    const boxTarget = () => (mode === "attack" ? L.fightBox : L.textBox);

    function hud() {
      env.hud("HP", `${Math.max(0, Math.ceil(hp))}/${maxHp}`, "TURNO", `${Math.min(turn + 1, TURNS)}/${TURNS}`, hp / maxHp, `HP ${maxHp}`);
    }

    function setMenu() {
      env.menu.forEach((b, i) => {
        b.disabled = mode !== "menu";
        b.classList.toggle("is-selected", mode === "menu" && i === selected);
        b.classList.toggle("is-spare", spareable && i === 3);
      });
    }

    // ---------- Texto ----------
    function say(lines, then) {
      queue = lines.slice();
      after = then;
      mode = "talk";
      nextLine();
      setMenu();
    }
    function nextLine() {
      line = queue.shift() || null;
      shown = 0;
      if (!line) {
        const fn = after;
        after = null;
        if (fn) fn();
      }
    }
    function advance() {
      if (!line) return;
      if (shown < line.text.length) shown = line.text.length;
      else nextLine();
    }

    function toMenu() {
      mode = "menu";
      line = { who: "narr", text: spareable ? "* Usagi está demasiado llena para seguir. Ya podés perdonarla." : MENU_LINES[turn] };
      shown = 0;
      if (spareable) selected = 3;
      setMenu();
      hud();
    }

    function pickAction(i) {
      if (mode !== "menu") return;
      selected = i;
      env.sfx("select");
      if (spareable) {
        if (i === 3) return spare();
        return say([{ who: "narr", text: "* Usagi ya no puede pelear. Elegí PIEDAD." }], toMenu);
      }
      let text;
      speedMul = 1;
      if (i === 0) {
        text = pick(FIGHT_LINES);
        usagiHit = 0.5;
        dmgText = { t: 1 };
        env.sfx("hit");
      } else if (i === 1) {
        const act = ACT_LINES[turn % ACT_LINES.length];
        text = act.text;
        speedMul = act.speed || 1;
      } else if (i === 2) {
        if (items > 0) {
          items--;
          const before = hp;
          hp = Math.min(maxHp, hp + 8);
          text = `* Te comiste un caramelo. Recuperaste ${Math.round(hp - before)} HP. ${items ? `Quedan ${items}.` : "Era el último."}`;
          env.sfx("heal");
          hud();
        } else {
          text = "* No te quedan caramelos. Usagi se los comió todos.";
        }
      } else {
        text = "* Intentás perdonar a Usagi. Usagi no quiere piedad: quiere postre.";
      }
      say([{ who: "narr", text }, { who: "usagi", text: TAUNTS[turn] }], startAttack);
    }

    function spare() {
      sleeping = true;
      env.sfx("spare");
      say(
        [
          { who: "narr", text: "* Perdonaste a Usagi." },
          { who: "narr", text: "* Usagi se quedó dormida, panza arriba." },
          { who: "usagi", text: "Zzz... gracias por los dulces..." },
        ],
        () => {
          mode = "over";
          setMenu();
          env.onWin();
        }
      );
    }

    // ---------- Ataques ----------
    function bullet(b) {
      bullets.push(Object.assign({ vx: 0, vy: 0, r: 7, size: 18, rot: 0, vr: 0 }, b));
    }
    function candy(B, S) {
      bullet({ x: rand(B.x + 8, B.x + B.w - 8), y: B.y - 12, vx: rand(-15, 15), vy: rand(95, 150) * S, ch: pick(CANDIES), vr: rand(-3, 3) });
    }
    function carrot(B, S, side) {
      const y = clamp(soul.y + rand(-12, 12), B.y + 8, B.y + B.h - 8);
      bullet({ x: side > 0 ? B.x - 14 : B.x + B.w + 14, y, vx: (side > 0 ? 1 : -1) * 215 * S, ch: "🥕", size: 20, rot: side > 0 ? 0.8 : -2.35 });
    }
    function tongue(B, S) {
      const thick = 22;
      if (Math.random() < 0.5) {
        const y = rand(B.y + 4, B.y + B.h - thick - 4);
        hazards.push({ kind: "tongue", x: B.x, y, w: B.w, h: thick, warn: 0.62 / S, act: 0.32, t: 0, horiz: true });
      } else {
        const x = rand(B.x + 4, B.x + B.w - thick - 4);
        hazards.push({ kind: "tongue", x, y: B.y, w: thick, h: B.h, warn: 0.62 / S, act: 0.32, t: 0, horiz: false });
      }
    }
    function slam(B, S) {
      const side = pick(["top", "bottom", "left", "right"]);
      const half = { top: [B.x, B.y, B.w, B.h / 2], bottom: [B.x, B.y + B.h / 2, B.w, B.h / 2], left: [B.x, B.y, B.w / 2, B.h], right: [B.x + B.w / 2, B.y, B.w / 2, B.h] }[side];
      hazards.push({ kind: "belly", x: half[0], y: half[1], w: half[2], h: half[3], warn: 0.8 / S, act: 0.42, t: 0 });
    }
    function ring(S) {
      const n = 14;
      const gap = Math.floor(Math.random() * n);
      for (let k = 0; k < n; k++) {
        if (k === gap || k === (gap + 1) % n || k === (gap + 2) % n) continue;
        bullet({ ring: true, cx: soul.x, cy: soul.y, ang: (k / n) * Math.PI * 2, rad: 100, vrad: -44 * S, ch: "🍩", size: 20, r: 8 });
      }
    }

    const WAVES = [
      () => ({ dur: 8, acc: 0, step(dt, B, S) {
        this.acc += dt;
        const every = this.t > 4 ? 0.12 : 0.16;
        while (this.acc > every) { this.acc -= every; candy(B, S * (this.t > 4 ? 1.15 : 1)); }
      } }),
      () => ({ dur: 8.5, acc: 0.2, step(dt, B, S) {
        this.acc -= dt;
        if (this.acc <= 0) {
          this.acc = (this.t > 4 ? 0.85 : 1.1) / S;
          tongue(B, S);
          if (this.t > 4) tongue(B, S);
        }
      } }),
      () => ({ dur: 8, step(dt, B, S) {
        if (!this.started) {
          this.started = true;
          for (let k = 0; k < 4; k++) {
            bullet({ x: B.x + 20 + (k * (B.w - 40)) / 3, y: B.y + 16, vx: rand(85, 140) * S * (k % 2 ? 1 : -1), vy: rand(90, 140) * S, r: 10, ch: "🍩", size: 24, bounce: true });
          }
        }
        if (!this.extra && this.t > 4) {
          this.extra = true;
          bullet({ x: B.x + B.w / 2, y: B.y + 14, vx: 150 * S, vy: 130 * S, r: 10, ch: "🍩", size: 24, bounce: true });
        }
      } }),
      () => ({ dur: 8, acc: 0.3, side: 1, step(dt, B, S) {
        this.acc -= dt;
        if (this.acc <= 0) { this.acc = (this.t > 4 ? 0.34 : 0.42) / S; this.side *= -1; carrot(B, S, this.side); }
      } }),
      () => ({ dur: 9, fired: 0, step(dt, B, S) {
        const times = [0.3, 3.2, 6.1];
        while (this.fired < times.length && this.t >= times[this.fired]) { this.fired++; ring(S); }
      } }),
      () => ({ dur: 9, acc: 0.3, rain: 0, step(dt, B, S) {
        this.acc -= dt;
        if (this.acc <= 0) { this.acc = 1.5 / S; slam(B, S); }
        this.rain += dt;
        if (this.rain > 0.5) { this.rain = 0; candy(B, S * 0.9); }
      } }),
      () => ({ dur: 11, a: 0, b: 0.4, c: 0.8, side: 1, step(dt, B, S) {
        S *= 1.1;
        this.a += dt; this.b -= dt; this.c -= dt;
        if (this.a > 0.22) { this.a = 0; candy(B, S); }
        if (this.b <= 0) { this.b = 0.85 / S; this.side *= -1; carrot(B, S, this.side); }
        if (this.c <= 0) { this.c = 1.5 / S; tongue(B, S); }
      } }),
    ];

    function startAttack() {
      mode = "attack";
      line = null;
      bullets = [];
      hazards = [];
      const B = L.fightBox;
      soul.x = B.x + B.w / 2;
      soul.y = B.y + B.h / 2;
      wave = WAVES[turn]();
      wave.t = 0;
      setMenu();
    }

    function endAttack() {
      bullets = [];
      hazards = [];
      wave = null;
      turn++;
      speedMul = 1;
      if (turn >= TURNS) spareable = true;
      toMenu();
    }

    function hurt() {
      if (GOD || invuln > 0 || mode !== "attack") return;
      hp -= DAMAGE;
      invuln = 1;
      shake = 0.25;
      env.sfx("hurt");
      hud();
      if (hp <= 0) {
        hp = 0;
        hud();
        mode = "dying";
        breakT = 0;
        env.sfx("break");
        setMenu();
      }
    }

    // ---------- Bucle ----------
    function update(dt) {
      L = layout();
      const T = boxTarget();
      const k = Math.min(1, dt * 9);
      box.x += (T.x - box.x) * k;
      box.y += (T.y - box.y) * k;
      box.w += (T.w - box.w) * k;
      box.h += (T.h - box.h) * k;

      usagiHit = Math.max(0, usagiHit - dt);
      shake = Math.max(0, shake - dt);
      invuln = Math.max(0, invuln - dt);
      if (dmgText) { dmgText.t -= dt; if (dmgText.t <= 0) dmgText = null; }

      if (line && shown < line.text.length) {
        const prev = Math.floor(shown);
        shown = Math.min(line.text.length, shown + dt * 42);
        blipAcc += Math.floor(shown) - prev;
        if (blipAcc >= 2) { blipAcc = 0; env.sfx(line.who === "usagi" ? "blipUsagi" : "blip"); }
      }

      if (mode === "dying") {
        breakT += dt;
        if (breakT > 1.6) {
          mode = "over";
          env.onDeath();
        }
        return;
      }
      if (mode !== "attack") return;

      const B = L.fightBox;
      let mx = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
      let my = (keys.down ? 1 : 0) - (keys.up ? 1 : 0);
      if (mx && my) { mx *= 0.7071; my *= 0.7071; }
      soul.x = clamp(soul.x + mx * SOUL_SPEED * dt, B.x + 8, B.x + B.w - 8);
      soul.y = clamp(soul.y + my * SOUL_SPEED * dt, B.y + 8, B.y + B.h - 8);

      wave.t += dt;
      wave.step(dt, B, speedMul);

      for (const b of bullets) {
        if (b.ring) {
          b.rad += b.vrad * dt;
          b.x = b.cx + Math.cos(b.ang) * b.rad;
          b.y = b.cy + Math.sin(b.ang) * b.rad;
        } else {
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.rot += b.vr * dt;
          if (b.bounce) {
            if (b.x < B.x + b.r) { b.x = B.x + b.r; b.vx = Math.abs(b.vx); }
            if (b.x > B.x + B.w - b.r) { b.x = B.x + B.w - b.r; b.vx = -Math.abs(b.vx); }
            if (b.y < B.y + b.r) { b.y = B.y + b.r; b.vy = Math.abs(b.vy); }
            if (b.y > B.y + B.h - b.r) { b.y = B.y + B.h - b.r; b.vy = -Math.abs(b.vy); }
          }
        }
        if (Math.hypot(b.x - soul.x, b.y - soul.y) < b.r + SOUL_R) { b.dead = true; hurt(); }
      }
      bullets = bullets.filter((b) => !b.dead && (b.ring ? b.rad > 6 : b.y < B.y + B.h + 30 && b.x > B.x - 40 && b.x < B.x + B.w + 40));

      for (const h of hazards) {
        h.t += dt;
        const live = h.t >= h.warn && h.t < h.warn + h.act;
        if (live && soul.x > h.x - 3 && soul.x < h.x + h.w + 3 && soul.y > h.y - 3 && soul.y < h.y + h.h + 3) hurt();
      }
      hazards = hazards.filter((h) => h.t < h.warn + h.act);

      if (mode === "attack" && wave.t >= wave.dur) endAttack();
    }

    function heartPath(x, y, s) {
      ctx.beginPath();
      ctx.moveTo(x, y + s * 0.42);
      ctx.bezierCurveTo(x - s * 0.7, y - s * 0.05, x - s * 0.42, y - s * 0.62, x, y - s * 0.22);
      ctx.bezierCurveTo(x + s * 0.42, y - s * 0.62, x + s * 0.7, y - s * 0.05, x, y + s * 0.42);
      ctx.closePath();
    }

    function wrap(text, maxW) {
      const words = text.split(" ");
      const lines = [];
      let cur = "";
      for (const w of words) {
        const test = cur ? `${cur} ${w}` : w;
        if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
      }
      if (cur) lines.push(cur);
      return lines;
    }

    function draw(now) {
      if (!L) L = layout();
      const { W, H } = L;
      ctx.save();
      if (shake > 0) ctx.translate(rand(-3, 3), rand(-3, 3));
      ctx.fillStyle = "#000";
      ctx.fillRect(-5, -5, W + 10, H + 10);

      // Usagi
      if (fatImg.complete && fatImg.naturalWidth) {
        const breathe = sleeping ? 0.03 * Math.sin(now / 900) : 0.02 * Math.sin(now / 420);
        const w = L.usW * (1 + breathe);
        const h = L.usH * (1 - breathe * 0.6);
        const hx = usagiHit > 0 ? rand(-5, 5) : 0;
        ctx.save();
        ctx.translate(L.usX + hx, L.usY + L.usH);
        if (sleeping) ctx.rotate(-0.08);
        ctx.drawImage(fatImg, -w / 2, -h, w, h);
        ctx.restore();
        if (sleeping) {
          ctx.font = `700 18px ${FONT}`;
          ctx.fillStyle = "#fff";
          ctx.textAlign = "left";
          for (let z = 0; z < 3; z++) {
            const p = ((now / 1400 + z / 3) % 1);
            ctx.globalAlpha = 1 - p;
            ctx.fillText("Z", L.usX + L.usW * 0.35 + p * 30, L.usY + L.usH * 0.3 - p * 40);
          }
          ctx.globalAlpha = 1;
        }
        if (dmgText) {
          ctx.font = `700 26px ${FONT}`;
          ctx.textAlign = "center";
          ctx.fillStyle = "#ff3b3b";
          ctx.fillText("0", L.usX, L.usY + L.usH * 0.35 - (1 - dmgText.t) * 30);
        }
      }

      // Burbuja de Usagi
      if (line && line.who === "usagi") {
        ctx.font = `500 16px ${FONT}`;
        const b = L.bubble;
        const lines = wrap(line.text.slice(0, Math.floor(shown)), b.w - 20);
        const full = wrap(line.text, b.w - 20);
        const bh = Math.max(full.length, 1) * 20 + 18;
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.moveTo(b.x + 10, b.y);
        ctx.lineTo(b.x + b.w - 10, b.y);
        ctx.quadraticCurveTo(b.x + b.w, b.y, b.x + b.w, b.y + 10);
        ctx.lineTo(b.x + b.w, b.y + bh - 10);
        ctx.quadraticCurveTo(b.x + b.w, b.y + bh, b.x + b.w - 10, b.y + bh);
        ctx.lineTo(b.x + 10, b.y + bh);
        ctx.quadraticCurveTo(b.x, b.y + bh, b.x, b.y + bh - 10);
        ctx.lineTo(b.x, b.y + 34);
        ctx.lineTo(b.x - 12, b.y + 26);
        ctx.lineTo(b.x, b.y + 18);
        ctx.lineTo(b.x, b.y + 10);
        ctx.quadraticCurveTo(b.x, b.y, b.x + 10, b.y);
        ctx.fill();
        ctx.fillStyle = "#000";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        lines.forEach((l, i) => ctx.fillText(l, b.x + 10, b.y + 10 + i * 20));
      }

      // Caja
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#fff";
      ctx.fillStyle = "#000";
      ctx.fillRect(box.x, box.y, box.w, box.h);
      ctx.strokeRect(box.x, box.y, box.w, box.h);

      if (line && line.who === "narr") {
        ctx.font = `500 18px ${FONT}`;
        ctx.fillStyle = "#fff";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        const lines = wrap(line.text.slice(0, Math.floor(shown)), box.w - 32);
        lines.forEach((l, i) => ctx.fillText(l, box.x + 16, box.y + 16 + i * 25));
      }
      if ((mode === "talk" || mode === "menu") && line && shown >= line.text.length && mode === "talk") {
        ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(now / 160)})`;
        ctx.beginPath();
        ctx.moveTo(box.x + box.w - 22, box.y + box.h - 18);
        ctx.lineTo(box.x + box.w - 12, box.y + box.h - 18);
        ctx.lineTo(box.x + box.w - 17, box.y + box.h - 11);
        ctx.fill();
      }

      if (mode === "attack" || mode === "dying") {
        ctx.save();
        ctx.beginPath();
        ctx.rect(box.x + 2, box.y + 2, box.w - 4, box.h - 4);
        ctx.clip();
        for (const h of hazards) {
          const live = h.t >= h.warn;
          if (!live) {
            const blink = Math.floor(h.t * 10) % 2;
            ctx.fillStyle = h.kind === "tongue" ? `rgba(255,110,160,${blink ? 0.28 : 0.12})` : `rgba(255,236,200,${blink ? 0.22 : 0.08})`;
            ctx.fillRect(h.x, h.y, h.w, h.h);
            ctx.strokeStyle = h.kind === "tongue" ? "rgba(255,110,160,.8)" : "rgba(255,236,200,.7)";
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 5]);
            ctx.strokeRect(h.x + 1, h.y + 1, h.w - 2, h.h - 2);
            ctx.setLineDash([]);
          } else if (h.kind === "tongue") {
            ctx.fillStyle = "#e0507e";
            ctx.fillRect(h.x, h.y, h.w, h.h);
            ctx.fillStyle = "#ff8fb3";
            if (h.horiz) ctx.fillRect(h.x, h.y + 3, h.w, h.h - 6);
            else ctx.fillRect(h.x + 3, h.y, h.w - 6, h.h);
            ctx.fillStyle = "rgba(160,30,70,.7)";
            if (h.horiz) ctx.fillRect(h.x, h.y + h.h / 2 - 1, h.w, 2);
            else ctx.fillRect(h.x + h.w / 2 - 1, h.y, 2, h.h);
          } else {
            ctx.fillStyle = "#f6e7c4";
            ctx.fillRect(h.x, h.y, h.w, h.h);
            ctx.strokeStyle = "#5a3a22";
            ctx.lineWidth = 3;
            ctx.strokeRect(h.x + 1.5, h.y + 1.5, h.w - 3, h.h - 3);
            ctx.fillStyle = "#5a3a22";
            ctx.fillRect(h.x + h.w / 2 - 2, h.y + h.h / 2 - 5, 4, 10);
          }
        }
        for (const b of bullets) {
          const s = emojiSprite(b.ch, b.size);
          ctx.save();
          ctx.translate(b.x, b.y);
          if (b.rot) ctx.rotate(b.rot);
          ctx.drawImage(s.c, -s.s / 2, -s.s / 2, s.s, s.s);
          ctx.restore();
        }
        ctx.restore();

        // Alma
        if (mode === "dying") {
          const p = Math.min(1, breakT / 0.6);
          ctx.fillStyle = "#ff1a1a";
          ctx.save();
          ctx.beginPath();
          ctx.rect(soul.x - 20 - p * 10, soul.y - 20, 20, 40);
          ctx.clip();
          heartPath(soul.x - p * 6, soul.y + p * 4, 18);
          ctx.fill();
          ctx.restore();
          ctx.save();
          ctx.beginPath();
          ctx.rect(soul.x, soul.y - 20, 20 + p * 10, 40);
          ctx.clip();
          heartPath(soul.x + p * 6, soul.y + p * 4, 18);
          ctx.fill();
          ctx.restore();
        } else if (!(invuln > 0 && Math.floor(now / 70) % 2)) {
          ctx.fillStyle = "#ff1a1a";
          heartPath(soul.x, soul.y, 18);
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // ---------- Entrada ----------
    const DIRS = { ArrowLeft: "left", a: "left", A: "left", ArrowRight: "right", d: "right", D: "right", ArrowUp: "up", w: "up", W: "up", ArrowDown: "down", s: "down", S: "down" };
    function key(e, down) {
      const dir = DIRS[e.key];
      if (dir) {
        keys[dir] = down;
        e.preventDefault();
        if (down && mode === "menu" && (dir === "left" || dir === "right")) {
          selected = (selected + (dir === "left" ? 3 : 1)) % 4;
          env.sfx("move");
          setMenu();
        }
        return;
      }
      if (!down) return;
      if (e.key === "z" || e.key === "Z" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        if (mode === "menu") pickAction(selected);
        else if (mode === "talk") advance();
      }
    }
    function pointerDown(e) {
      if (mode === "talk") return advance();
      if (mode !== "attack") return;
      drag = { id: e.pointerId, x0: e.clientX, y0: e.clientY, sx: soul.x, sy: soul.y };
    }
    function pointerMove(e) {
      if (!drag || e.pointerId !== drag.id || mode !== "attack") return;
      const B = L.fightBox;
      soul.x = clamp(drag.sx + (e.clientX - drag.x0) * 1.1, B.x + 8, B.x + B.w - 8);
      soul.y = clamp(drag.sy + (e.clientY - drag.y0) * 1.1, B.y + 8, B.y + B.h - 8);
    }
    function pointerUp(e) {
      if (drag && e.pointerId === drag.id) drag = null;
    }

    function start(firstTime, hpMax) {
      L = layout();
      maxHp = hpMax;
      hp = hpMax;
      turn = 0;
      items = 3;
      spareable = false;
      sleeping = false;
      bullets = [];
      hazards = [];
      selected = 0;
      invuln = 0;
      Object.assign(box, L.textBox);
      Object.keys(keys).forEach((k) => (keys[k] = false));
      hud();
      say(firstTime ? INTRO : RETRY, toMenu);
    }

    function releaseKeys() {
      Object.keys(keys).forEach((k) => (keys[k] = false));
    }

    return { start, update, draw, key, pointerDown, pointerMove, pointerUp, pickAction, releaseKeys, relayout: () => { L = layout(); } };
  }

  window.UsagiBattle = { create };
})();
