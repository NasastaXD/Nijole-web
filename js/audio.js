/*
 * Música y sonidos, todo sintetizado con WebAudio: no hay archivos de audio.
 *
 *   Sound.unlock()          crea/reanuda el audio (hay que llamarlo desde un toque o tecla)
 *   Sound.music("romance")  pide una pista (romance, invaders, battle, facu) o null para silencio
 *   Sound.sfx("good")       efecto suelto
 *   Sound.toggle()          silenciar / activar; la preferencia queda guardada en el navegador
 */
(() => {
  "use strict";

  const KEY = "manual-usagi:sound";
  const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const AC = window.AudioContext || window.webkitAudioContext;

  let ac = null;
  let g = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === "off"; } catch (e) { /* sin almacenamiento */ }
  let wanted = null;
  let playing = null;
  const listeners = new Set();

  // ---------- Grafo de audio ----------
  function build(ctx) {
    const n = {};
    n.master = ctx.createGain();
    n.master.connect(ctx.destination);
    n.music = ctx.createGain();
    n.music.gain.value = 0.34;
    n.music.connect(n.master);
    n.sfx = ctx.createGain();
    n.sfx.gain.value = 0.9;
    n.sfx.connect(n.master);

    // Eco suave para las campanitas
    n.echo = ctx.createGain();
    n.echo.gain.value = 0.26;
    const dl = ctx.createDelay(1);
    dl.delayTime.value = 0.36;
    const fb = ctx.createGain();
    fb.gain.value = 0.36;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2600;
    n.echo.connect(dl);
    dl.connect(lp);
    lp.connect(fb);
    fb.connect(dl);
    lp.connect(n.music);

    const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = nb.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.noise = nb;

    // Onda de pulso al 25 %, el sonido clásico de las consolas de 8 bits
    const N = 32;
    const re = new Float32Array(N);
    const im = new Float32Array(N);
    for (let k = 1; k < N; k++) re[k] = (2 / (k * Math.PI)) * Math.sin(k * Math.PI * 0.25);
    n.pulse = ctx.createPeriodicWave(re, im);
    return n;
  }

  // ---------- Instrumentos ----------
  function note(ctx, n, out, inst, midi, t, len, vel) {
    const f = hz(midi);
    const osc = (type, freq) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      return o;
    };
    const amp = (peak, attack, end) => {
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.0001, t);
      gn.gain.linearRampToValueAtTime(peak, t + attack);
      gn.gain.exponentialRampToValueAtTime(0.0001, end);
      gn.connect(out);
      return gn;
    };
    const run = (o, end) => { o.start(t); o.stop(end + 0.05); };

    switch (inst) {
      case "bell": {
        const end = t + Math.min(2.4, len * 0.9 + 0.9);
        const gn = amp(0.5 * vel, 0.005, end);
        gn.connect(n.echo);
        const a = osc("sine", f);
        const b = osc("sine", f * 3);
        const gb = ctx.createGain();
        gb.gain.value = 0.18;
        a.connect(gn);
        b.connect(gb);
        gb.connect(gn);
        run(a, end);
        run(b, end);
        break;
      }
      case "pluck": {
        const end = t + 0.45;
        const gn = amp(0.2 * vel, 0.004, end);
        const a = osc("triangle", f);
        a.connect(gn);
        run(a, end);
        break;
      }
      case "pad": {
        const end = t + len + 0.6;
        const gn = ctx.createGain();
        gn.gain.setValueAtTime(0.0001, t);
        gn.gain.linearRampToValueAtTime(0.16 * vel, t + 0.35);
        gn.gain.setValueAtTime(0.16 * vel, t + Math.max(0.4, len - 0.1));
        gn.gain.exponentialRampToValueAtTime(0.0001, end);
        gn.connect(out);
        const a = osc("sine", f);
        const b = osc("triangle", f * 1.004);
        a.connect(gn);
        b.connect(gn);
        run(a, end);
        run(b, end);
        break;
      }
      case "bass": {
        const end = t + Math.max(0.12, len);
        const gn = amp(0.42 * vel, 0.006, end);
        const a = osc("triangle", f);
        a.connect(gn);
        run(a, end);
        break;
      }
      case "sq": {
        const end = t + Math.max(0.1, len * 0.95);
        const gn = amp(0.13 * vel, 0.004, end);
        const a = osc("square", f);
        a.connect(gn);
        run(a, end);
        break;
      }
      case "pulse": {
        const end = t + Math.max(0.08, len * 0.9);
        const gn = amp(0.11 * vel, 0.003, end);
        const a = ctx.createOscillator();
        a.setPeriodicWave(n.pulse);
        a.frequency.value = f;
        a.connect(gn);
        run(a, end);
        break;
      }
      case "ep": {
        const end = t + Math.min(1.6, len * 0.9 + 0.5);
        const gn = amp(0.2 * vel, 0.006, end);
        const a = osc("sine", f);
        const b = osc("sine", f * 2);
        const c = osc("sine", f * 4);
        const gb = ctx.createGain();
        gb.gain.value = 0.35;
        const gc = ctx.createGain();
        gc.gain.value = 0.08;
        a.connect(gn);
        b.connect(gb);
        gb.connect(gn);
        c.connect(gc);
        gc.connect(gn);
        run(a, end);
        run(b, end);
        run(c, end);
        break;
      }
      case "vib": {
        const end = t + Math.min(2.2, len * 1.1 + 0.5);
        const gn = amp(0.3 * vel, 0.01, end);
        gn.connect(n.echo);
        const a = osc("sine", f);
        const lfo = osc("sine", 5);
        const lg = ctx.createGain();
        lg.gain.value = 0.35;
        lfo.connect(lg);
        lg.connect(gn.gain);
        a.connect(gn);
        run(a, end);
        run(lfo, end);
        break;
      }
    }
  }

  function drum(ctx, n, out, kind, t, vel) {
    const burst = (type, freq, q, peak, dur) => {
      const src = ctx.createBufferSource();
      src.buffer = n.noise;
      const fl = ctx.createBiquadFilter();
      fl.type = type;
      fl.frequency.value = freq;
      fl.Q.value = q;
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(peak, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(fl);
      fl.connect(gn);
      gn.connect(out);
      src.start(t, Math.random() * 0.5);
      src.stop(t + dur + 0.02);
    };
    if (kind === "kick") {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.setValueAtTime(150, t);
      o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.55 * vel, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(gn);
      gn.connect(out);
      o.start(t);
      o.stop(t + 0.25);
    } else if (kind === "snare") {
      burst("bandpass", 1900, 0.8, 0.28 * vel, 0.13);
      const o = ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(200, t);
      const gn = ctx.createGain();
      gn.gain.setValueAtTime(0.16 * vel, t);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      o.connect(gn);
      gn.connect(out);
      o.start(t);
      o.stop(t + 0.12);
    } else if (kind === "hat") {
      burst("highpass", 7500, 0.7, 0.13 * vel, 0.04);
    } else if (kind === "open") {
      burst("highpass", 7000, 0.7, 0.1 * vel, 0.14);
    } else if (kind === "brush") {
      burst("bandpass", 5200, 0.6, 0.1 * vel, 0.08);
    }
  }

  // ---------- Pistas ----------
  const ROMANCE_MELODY = [
    [[0, 79, 4], [4, 76, 4], [8, 79, 4], [12, 84, 4]],
    [[0, 83, 6], [8, 79, 4], [12, 74, 4]],
    [[0, 81, 4], [4, 79, 4], [8, 76, 4], [12, 72, 4]],
    [[0, 71, 6], [8, 76, 4], [12, 79, 4]],
    [[0, 81, 4], [4, 84, 4], [8, 81, 4], [12, 77, 4]],
    [[0, 79, 6], [8, 76, 4], [12, 72, 4]],
    [[0, 74, 4], [4, 77, 4], [8, 81, 4], [12, 77, 4]],
    [[0, 79, 8], [8, 74, 4], [12, 71, 4]],
  ];
  const ROMANCE_CHORDS = [
    [48, [60, 64, 67]], [47, [59, 62, 67]], [45, [57, 60, 64]], [40, [59, 64, 67]],
    [41, [57, 60, 65]], [40, [60, 64, 67]], [38, [57, 62, 65]], [43, [59, 62, 67]],
  ];

  const INV_CHORDS = [
    [45, [0, 3, 7]], [41, [0, 4, 7]], [48, [0, 4, 7]], [43, [0, 4, 7]],
    [45, [0, 3, 7]], [41, [0, 4, 7]], [43, [0, 4, 7]], [40, [0, 4, 7]],
  ];
  const INV_MELODY = [
    [[0, 81], [4, 84], [8, 88], [12, 84]],
    [[0, 89], [4, 88], [8, 84], [12, 81]],
    [[0, 84], [4, 88], [8, 91], [12, 88]],
    [[0, 86], [4, 83], [8, 79], [12, 83]],
    [[0, 81], [4, 84], [8, 88], [12, 93]],
    [[0, 89], [4, 93], [8, 89], [12, 84]],
    [[0, 86], [4, 83], [8, 86], [12, 91]],
    [[0, 88], [4, 83], [8, 80], [12, 83]],
  ];

  const BATTLE_ROOTS = [50, 50, 46, 46, 43, 43, 45, 45];
  const BATTLE_LEAD = [
    [[0, 74, 2], [2, 77, 2], [4, 81, 2], [6, 77, 2], [8, 74, 2], [10, 77, 2], [12, 81, 4]],
    [[0, 82, 2], [2, 81, 2], [4, 77, 2], [6, 74, 2], [8, 76, 4], [12, 73, 4]],
    [[0, 70, 2], [2, 74, 2], [4, 77, 2], [6, 74, 2], [8, 70, 2], [10, 74, 2], [12, 77, 4]],
    [[0, 79, 2], [2, 77, 2], [4, 74, 2], [6, 70, 2], [8, 72, 4], [12, 69, 4]],
    [[0, 70, 2], [2, 74, 2], [4, 79, 2], [6, 74, 2], [8, 70, 2], [10, 74, 2], [12, 79, 4]],
    [[0, 82, 2], [2, 79, 2], [4, 77, 2], [6, 74, 2], [8, 75, 4], [12, 74, 4]],
    [[0, 69, 2], [2, 73, 2], [4, 76, 2], [6, 73, 2], [8, 69, 2], [10, 73, 2], [12, 76, 4]],
    [[0, 81, 2], [2, 80, 2], [4, 76, 2], [6, 73, 2], [8, 69, 8]],
  ];

  const JAZZ = [
    { root: 50, tones: [50, 53, 57, 60], chord: [62, 65, 69, 72] },
    { root: 43, tones: [43, 47, 50, 53], chord: [55, 59, 62, 65] },
    { root: 48, tones: [48, 52, 55, 59], chord: [60, 64, 67, 71] },
    { root: 45, tones: [45, 49, 52, 55], chord: [55, 61, 64, 67] },
  ];
  const JAZZ_MELODY = [
    [[0, 76, 6], [8, 74, 4], [12, 72, 4]],
    [[0, 71, 8], [8, 74, 6]],
    [[0, 72, 6], [8, 76, 4], [12, 79, 4]],
    [[0, 73, 8], [8, 76, 4], [12, 73, 4]],
    [[0, 74, 4], [4, 77, 4], [8, 81, 6]],
    [[0, 79, 4], [4, 77, 4], [8, 74, 8]],
    [[0, 76, 8], [8, 72, 8]],
    [[0, 69, 4], [4, 73, 4], [8, 76, 4], [12, 81, 4]],
  ];

  const TRACKS = {
    // Caja de música tranquila para el sobre, la carta y la enredadera
    romance: {
      bpm: 66,
      bars: 8,
      vol: 1,
      bar(i, P) {
        const [root, tri] = ROMANCE_CHORDS[i];
        P("pad", root, 0, 16, 0.9);
        tri.forEach((m) => P("pad", m - 12, 0, 16, 0.5));
        [0, 1, 2, 1, 2, 1, 2, 1].forEach((k, j) => P("pluck", tri[k] + 12, j * 2, 3, 0.8));
        ROMANCE_MELODY[i].forEach(([s, m, l]) => P("bell", m, s, l, 0.9));
      },
    },
    // Chiptune rápido para la primera fase del jefe
    invaders: {
      bpm: 150,
      bars: 8,
      vol: 2,
      bar(i, P, D) {
        const [root, iv] = INV_CHORDS[i];
        for (let s = 0; s < 16; s++) P("pulse", root + 24 + iv[s % 3], s, 1, 0.75);
        for (let s = 0; s < 16; s += 2) P("bass", root + (s % 4 === 2 ? 12 : 0), s, 2, 0.9);
        INV_MELODY[i].forEach(([s, m]) => P("sq", m, s, 3.5, 0.9));
        [0, 4, 8, 12].forEach((s) => D("kick", s, 0.85));
        [4, 12].forEach((s) => D("snare", s, 0.8));
        [2, 6, 10, 14].forEach((s) => D("hat", s, 0.9));
      },
    },
    // Tenso, en menor, para la traición de Usagi
    battle: {
      bpm: 160,
      bars: 8,
      vol: 2,
      bar(i, P, D) {
        const root = BATTLE_ROOTS[i];
        for (let s = 0; s < 16; s += 2) P("bass", root, s, 2, s % 8 === 0 ? 1 : 0.75);
        P("bass", root + 12, 7, 1, 0.6);
        P("bass", root + 12, 15, 1, 0.6);
        BATTLE_LEAD[i].forEach(([s, m, l]) => P("pulse", m, s, l, 0.9));
        [0, 6, 8, 14].forEach((s) => D("kick", s, 0.85));
        [4, 12].forEach((s) => D("snare", s, 0.8));
        for (let s = 0; s < 16; s += 2) D(s === 14 ? "open" : "hat", s, 0.8);
      },
    },
    // Jazz de ascensor, a propósito cheto, para Facu-lo
    facu: {
      bpm: 98,
      bars: 8,
      vol: 0.85,
      bar(i, P, D) {
        const c = JAZZ[i % 4];
        const next = JAZZ[(i + 1) % 4];
        [c.tones[0], c.tones[1], c.tones[2], next.root - 1].forEach((m, k) => P("bass", m, k * 4, 3.4, 0.85));
        [3, 10].forEach((s) => c.chord.forEach((m) => P("ep", m, s, 3, 0.6)));
        [2, 6, 10, 14].forEach((s) => D("brush", s, 0.9));
        D("kick", 0, 0.45);
        D("kick", 8, 0.35);
        JAZZ_MELODY[i].forEach(([s, m, l]) => P("vib", m, s, l, 0.9));
      },
    },
  };

  // ---------- Reproducción ----------
  function scheduleBar(ctx, n, out, track, i, t0) {
    const S = 60 / track.bpm / 4;
    track.bar(
      i,
      (inst, midi, step, steps, vel) => note(ctx, n, out, inst, midi, t0 + step * S, steps * S, vel),
      (kind, step, vel) => drum(ctx, n, out, kind, t0 + step * S, vel)
    );
    return S * 16;
  }

  function pump(p) {
    if (!ac || ac.state !== "running") return;
    const track = TRACKS[p.name];
    while (p.next < ac.currentTime + 0.7) {
      p.next += scheduleBar(ac, g, p.out, track, p.bar % track.bars, p.next);
      p.bar++;
    }
  }

  function applyTrack() {
    if (!ac || !g) return;
    if (playing && playing.name === wanted) return;
    if (playing) {
      const old = playing;
      clearInterval(old.timer);
      old.out.gain.cancelScheduledValues(ac.currentTime);
      old.out.gain.setTargetAtTime(0, ac.currentTime, 0.18);
      setTimeout(() => { try { old.out.disconnect(); } catch (e) { /* ya desconectado */ } }, 1800);
      playing = null;
    }
    if (!wanted || !TRACKS[wanted]) return;
    const out = ac.createGain();
    out.gain.value = 0;
    out.gain.setTargetAtTime(TRACKS[wanted].vol || 1, ac.currentTime, 0.3);
    out.connect(g.music);
    const p = { name: wanted, out, next: ac.currentTime + 0.12, bar: 0, timer: 0 };
    p.timer = setInterval(() => pump(p), 90);
    playing = p;
    pump(p);
  }

  function unlock() {
    if (!AC) return;
    if (!ac) {
      try {
        ac = new AC();
      } catch (e) {
        ac = null;
        return;
      }
      g = build(ac);
      g.master.gain.value = muted ? 0 : 1;
    }
    if (!muted && ac.state === "suspended") ac.resume().then(applyTrack).catch(() => {});
    applyTrack();
  }

  function music(name) {
    wanted = name || null;
    applyTrack();
  }

  function setMuted(value) {
    muted = !!value;
    try { localStorage.setItem(KEY, muted ? "off" : "on"); } catch (e) { /* idem */ }
    if (ac) {
      g.master.gain.setTargetAtTime(muted ? 0 : 1, ac.currentTime, 0.03);
      if (muted) setTimeout(() => { if (muted && ac) ac.suspend().catch(() => {}); }, 200);
      else ac.resume().then(applyTrack).catch(() => {});
    }
    listeners.forEach((fn) => fn(muted));
  }

  document.addEventListener("visibilitychange", () => {
    if (!ac) return;
    if (document.hidden) ac.suspend().catch(() => {});
    else if (!muted) ac.resume().catch(() => {});
  });

  // ---------- Efectos ----------
  function tone(freq, t0, dur, type = "square", vol = 0.05, slideTo) {
    const o = ac.createOscillator();
    const gn = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gn.gain.setValueAtTime(vol, t0);
    gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    o.connect(gn);
    gn.connect(g.sfx);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  function noise(t0, dur, type, f0, f1, vol) {
    const src = ac.createBufferSource();
    src.buffer = g.noise;
    const fl = ac.createBiquadFilter();
    fl.type = type;
    fl.frequency.setValueAtTime(f0, t0);
    if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const gn = ac.createGain();
    gn.gain.setValueAtTime(vol, t0);
    gn.gain.exponentialRampToValueAtTime(0.0008, t0 + dur);
    src.connect(fl);
    fl.connect(gn);
    gn.connect(g.sfx);
    src.start(t0, Math.random() * 0.4);
    src.stop(t0 + dur + 0.02);
  }

  function sfx(kind) {
    if (muted || !ac || ac.state !== "running") return;
    const t = ac.currentTime;
    switch (kind) {
      // interfaz
      case "click": tone(820, t, 0.035, "triangle", 0.06); break;
      case "wax": tone(170, t, 0.16, "sine", 0.14, 80); noise(t, 0.12, "lowpass", 900, 300, 0.1); break;
      case "paper": noise(t, 0.28, "bandpass", 1100, 3200, 0.08); break;
      case "good": tone(659, t, 0.09, "triangle", 0.07); tone(880, t + 0.09, 0.16, "triangle", 0.07); break;
      case "bad": tone(233, t, 0.14, "sawtooth", 0.045, 190); tone(185, t + 0.14, 0.24, "sawtooth", 0.045, 120); break;
      case "bloom": [784, 988, 1175, 1568, 1976].forEach((f, k) => tone(f, t + k * 0.07, 0.3, "sine", 0.05)); break;
      case "fanfare":
        [[523, 0, 0.12], [523, 0.14, 0.12], [523, 0.28, 0.12], [659, 0.42, 0.34], [784, 0.82, 0.55]].forEach(([f, d, l]) => {
          tone(f, t + d, l, "square", 0.04);
          tone(f / 2, t + d, l, "triangle", 0.06);
        });
        break;
      // minijuego, fase 1
      case "slurp": tone(260, t, 0.09, "sine", 0.05, 820); break;
      case "yum": tone(520, t, 0.07, "square", 0.04); tone(780, t + 0.07, 0.1, "square", 0.04); break;
      case "yuck": tone(190, t, 0.28, "sawtooth", 0.045, 70); break;
      case "ouch": tone(420, t, 0.2, "triangle", 0.06, 140); break;
      case "bonus": [523, 659, 784, 1046].forEach((f, k) => tone(f, t + k * 0.06, 0.1, "square", 0.04)); break;
      case "tick": tone(880, t, 0.06, "square", 0.03); break;
      case "go": tone(1320, t, 0.18, "square", 0.04); break;
      case "win": [523, 659, 784, 1046, 784, 1046, 1318].forEach((f, k) => tone(f, t + k * 0.11, 0.16, "square", 0.045)); break;
      case "lose": [392, 330, 262, 196].forEach((f, k) => tone(f, t + k * 0.16, 0.22, "triangle", 0.06)); break;
      // fase 2
      case "betray": tone(220, t, 0.9, "sawtooth", 0.05, 55); tone(110, t + 0.5, 1.2, "square", 0.04, 40); break;
      case "blip": tone(660, t, 0.03, "square", 0.018); break;
      case "blipUsagi": tone(330, t, 0.04, "square", 0.022); break;
      case "move": tone(520, t, 0.04, "square", 0.025); break;
      case "select": tone(780, t, 0.06, "square", 0.03); break;
      case "hit": tone(160, t, 0.18, "square", 0.05, 90); break;
      case "hurt": tone(300, t, 0.14, "sawtooth", 0.06, 120); break;
      case "heal": [660, 880, 1100].forEach((f, k) => tone(f, t + k * 0.06, 0.08, "triangle", 0.05)); break;
      case "break": tone(200, t, 0.08, "square", 0.07); tone(140, t + 0.5, 0.3, "sawtooth", 0.06, 50); break;
      case "spare": [392, 523, 659, 784].forEach((f, k) => tone(f, t + k * 0.12, 0.2, "triangle", 0.05)); break;
      // novela visual
      case "vnBlip": tone(140 + Math.random() * 50, t, 0.04, "square", 0.02); break;
      case "vnTick": tone(520 + Math.random() * 60, t, 0.02, "triangle", 0.02); break;
      case "vnUp": tone(523, t, 0.08, "triangle", 0.06); tone(784, t + 0.08, 0.12, "triangle", 0.06); break;
      case "vnDown": tone(330, t, 0.28, "sine", 0.09, 90); break;
      case "flush":
        noise(t, 1.8, "lowpass", 2600, 180, 0.28);
        tone(420, t, 1.7, "sine", 0.07, 60);
        [0.3, 0.6, 0.95, 1.25].forEach((d) => tone(200 + Math.random() * 120, t + d, 0.12, "sine", 0.05, 90));
        break;
      case "trombone":
        [[466, 0, 0.32], [440, 0.4, 0.32], [415, 0.8, 0.32]].forEach(([f, d, l]) => tone(f, t + d, l, "sawtooth", 0.05));
        tone(392, t + 1.2, 1.1, "sawtooth", 0.05, 340);
        break;
    }
  }

  // ---------- Pruebas: renderiza una pista sin tocar los parlantes ----------
  async function render(name, seconds) {
    const rate = 22050;
    const ctx = new OfflineAudioContext(1, rate * seconds, rate);
    const n = build(ctx);
    n.master.gain.value = 1;
    const track = TRACKS[name];
    const out = ctx.createGain();
    out.gain.value = track.vol || 1;
    out.connect(n.music);
    let t = 0;
    let i = 0;
    while (t < seconds) {
      t += scheduleBar(ctx, n, out, track, i % track.bars, t);
      i++;
    }
    const buf = await ctx.startRendering();
    return Array.from(buf.getChannelData(0));
  }

  window.Sound = {
    unlock,
    music,
    sfx,
    toggle: () => setMuted(!muted),
    setMuted,
    get muted() { return muted; },
    onChange: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
    tracks: Object.keys(TRACKS),
    _render: location.hash === "#dev" ? render : undefined,
    _debug: location.hash === "#dev" ? () => ({ state: ac ? ac.state : "none", playing: playing ? playing.name : null, wanted, muted }) : undefined,
  };
})();
