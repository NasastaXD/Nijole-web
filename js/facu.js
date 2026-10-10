/*
 * Jefe intermedio: novela visual de decisiones contra Facu-lo.
 * El guion (escenas, opciones y finales) está en CONFIG.facu, en js/config.js.
 */
(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shuffle = (list) => {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  };

  function open({ cfg, done, onWin, onMigajera, onExit }) {
    const root = $("vn");
    const sprite = $("vnSprite");
    const box = $("vnBox");
    const nameEl = $("vnName");
    const textEl = $("vnText");
    const nextEl = $("vnNext");
    const choicesEl = $("vnChoices");
    const endEl = $("vnEnd");
    const fill = $("vnFill");
    const value = $("vnValue");
    const delta = $("vnDelta");
    const muteBtn = $("vnMute");
    const Sound = window.Sound;

    let mode = "idle"; // idle | typing | waiting | choices | ended | closed
    let dig = cfg.dignidadInicial;
    let queue = [];
    let after = null;
    let line = null;
    let typed = 0;
    let timer = 0;
    let deltaTimer = 0;

    // ---------- Dignidad ----------
    function showDig(change) {
      fill.style.width = `${dig}%`;
      value.textContent = String(dig);
      $("vnTick").style.left = `${cfg.dignidadParaCortar}%`;
      $("vnMeter").classList.toggle("can-cut", dig >= cfg.dignidadParaCortar);
      if (!change) return;
      delta.textContent = change > 0 ? `+${change}` : String(change);
      delta.className = `vn-delta ${change > 0 ? "up" : "down"} show`;
      clearTimeout(deltaTimer);
      deltaTimer = setTimeout(() => delta.classList.remove("show"), 1100);
    }

    // ---------- Sprite ----------
    function react(kind) {
      sprite.className = "vn-sprite";
      if (!kind) return;
      void sprite.offsetWidth;
      sprite.classList.add(`r-${kind}`);
      if (kind === "flush") Sound.sfx("flush");
    }
    sprite.addEventListener("animationend", (e) => {
      if (e.animationName === "vn-shake" || e.animationName === "vn-jump") sprite.className = "vn-sprite";
    });

    // ---------- Texto ----------
    function showLine(l) {
      line = l;
      typed = 0;
      const who = l[0];
      const label = who === "facu" ? cfg.nombre : who === "vos" ? "Vos" : "";
      nameEl.textContent = label;
      nameEl.hidden = !label;
      box.dataset.who = who;
      textEl.textContent = "";
      nextEl.hidden = true;
      if (l[2]) react(l[2]);
      mode = "typing";
      clearInterval(timer);
      if (reduced) {
        typed = l[1].length;
        return finishTyping();
      }
      timer = setInterval(() => {
        typed++;
        textEl.textContent = l[1].slice(0, typed);
        if (typed % 2 === 0 && /\S/.test(l[1][typed - 1] || "")) Sound.sfx(who === "facu" ? "vnBlip" : "vnTick");
        if (typed >= l[1].length) finishTyping();
      }, 24);
    }

    function finishTyping() {
      clearInterval(timer);
      textEl.textContent = line[1];
      mode = "waiting";
      nextEl.hidden = false;
    }

    function nextLine() {
      const l = queue.shift();
      if (l) return showLine(l);
      nextEl.hidden = true;
      const fn = after;
      after = null;
      if (fn) fn();
    }

    function advance() {
      if (mode === "typing") {
        typed = line[1].length;
        finishTyping();
      } else if (mode === "waiting") {
        nextLine();
      }
    }

    function play(lines, then) {
      queue = lines.slice();
      after = then;
      nextLine();
    }

    // ---------- Escenas ----------
    function go(id, prefix) {
      const scene = cfg.escenas[id];
      play(prefix.concat(scene.lineas), () => showChoices(scene));
    }

    function showChoices(scene) {
      mode = "choices";
      choicesEl.hidden = false;
      choicesEl.innerHTML = "";
      shuffle(scene.opciones).forEach((o) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "vn-choice";
        const label = document.createElement("span");
        label.textContent = o.texto;
        b.appendChild(label);
        if (o.requiere && dig < o.requiere) {
          b.disabled = true;
          b.classList.add("is-locked");
          const hint = document.createElement("small");
          hint.textContent = `Te falta DIGNIDAD (${dig}/${o.requiere})`;
          b.appendChild(hint);
        } else {
          b.addEventListener("click", () => choose(o));
        }
        choicesEl.appendChild(b);
      });
      const first = choicesEl.querySelector("button:not(:disabled)");
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 40);
    }

    function choose(o) {
      if (mode !== "choices") return;
      choicesEl.hidden = true;
      choicesEl.innerHTML = "";
      Sound.sfx("select");
      if (o.dignidad) {
        const before = dig;
        dig = clamp(dig + o.dignidad, 0, 100);
        showDig(dig - before);
        Sound.sfx(o.dignidad > 0 ? "vnUp" : "vnDown");
      }
      const prefix = [["vos", o.texto]];
      if (o.ir.startsWith("fin:")) return ending(o.ir.slice(4), prefix);
      go(o.ir, prefix);
    }

    // ---------- Finales ----------
    function ending(key, prefix) {
      const f = cfg.finales[key];
      Sound.music(null);
      play(prefix.concat(f.lineas), () => showEnd(key, f));
    }

    function showEnd(key, f) {
      mode = "ended";
      Sound.sfx(key === "ganar" ? "fanfare" : "trombone");
      root.dataset.end = key;
      $("vnEndTitle").textContent = f.titulo;
      $("vnEndText").textContent = f.texto || "";
      $("vnEndText").hidden = !f.texto;
      const btns = $("vnEndBtns");
      btns.innerHTML = "";
      const add = (label, fn, alt) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = `vn-btn${alt ? " alt" : ""}`;
        b.textContent = label;
        b.addEventListener("click", fn);
        btns.appendChild(b);
        return b;
      };
      let primary;
      if (key === "ganar") {
        primary = add("Seguir", () => { onWin(); close(true); });
      } else if (key === "migajera" && !done) {
        primary = add("Empezar de cero", () => onMigajera());
      } else {
        primary = add("Reintentar", restart);
        add("Salir", () => close(false), true);
      }
      endEl.hidden = false;
      setTimeout(() => primary.focus({ preventScroll: true }), 60);
    }

    function restart() {
      endEl.hidden = true;
      delete root.dataset.end;
      choicesEl.hidden = true;
      choicesEl.innerHTML = "";
      react(null);
      dig = cfg.dignidadInicial;
      showDig(0);
      Sound.music("facu");
      go(cfg.inicio, []);
    }

    // ---------- Entrada ----------
    function onKey(e) {
      if (e.key === "Escape") return close(false);
      if (e.target.closest && e.target.closest("button")) return;
      if (mode === "typing" || mode === "waiting") {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          advance();
        }
      } else if (mode === "choices" && /^[1-9]$/.test(e.key)) {
        const btn = choicesEl.querySelectorAll("button")[Number(e.key) - 1];
        if (btn && !btn.disabled) btn.click();
      }
    }
    function onRootClick(e) {
      if (e.target.closest("button")) return;
      advance();
    }

    const syncMute = () => {
      muteBtn.textContent = Sound.muted ? "Sonido: no" : "Sonido: sí";
      muteBtn.setAttribute("aria-pressed", String(Sound.muted));
    };
    const onMute = () => Sound.toggle();
    const onExitBtn = () => close(false);
    const offMute = Sound.onChange(syncMute);
    muteBtn.addEventListener("click", onMute);
    $("vnExit").addEventListener("click", onExitBtn);
    window.addEventListener("keydown", onKey);
    root.addEventListener("click", onRootClick);

    function close(won) {
      if (mode === "closed") return;
      mode = "closed";
      clearInterval(timer);
      clearTimeout(deltaTimer);
      offMute();
      muteBtn.removeEventListener("click", onMute);
      $("vnExit").removeEventListener("click", onExitBtn);
      window.removeEventListener("keydown", onKey);
      root.removeEventListener("click", onRootClick);
      choicesEl.innerHTML = "";
      endEl.hidden = true;
      delete root.dataset.end;
      react(null);
      onExit(won);
    }

    // ---------- Arranque ----------
    $("vnName").textContent = "";
    syncMute();
    restart();
    return { close };
  }

  window.FacuVN = { open };
})();
