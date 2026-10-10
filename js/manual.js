/*
 * Arma el PDF del manual con jsPDF, con pinta de manual de electrodoméstico.
 * El contenido sale de CONFIG.manual (js/config.js).
 */
(() => {
  "use strict";

  const PAGE_W = 148; // A5, en mm
  const PAGE_H = 210;
  const M = 14;
  const CONTENT_W = PAGE_W - M * 2;
  const TOP = 24;
  const BOTTOM = PAGE_H - 18;

  const WINE = [110, 18, 34];
  const WINE_DARK = [58, 6, 16];
  const PAPER = [248, 242, 232];
  const CREAM = [246, 232, 222];
  const INK = [44, 22, 26];
  const SOFT = [125, 82, 88];
  const GOLD = [201, 161, 74];
  const ROSE = [184, 20, 46];
  const LINE = [214, 196, 176];

  // Las fuentes estándar de PDF solo cubren Latin-1: cambiamos lo tipográfico y tiramos el resto (emojis incluidos).
  const clean = (s) =>
    String(s ?? "")
      .replace(/[“”„]/g, '"')
      .replace(/[‘’‚]/g, "'")
      .replace(/[—–]/g, "-")
      .replace(/…/g, "...")
      .replace(/[^\x00-\xFF]/g, "")
      .replace(/[ \t]+/g, " ")
      .trim();

  function loadImageDataURL(src) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const c = document.createElement("canvas");
          c.width = img.naturalWidth;
          c.height = img.naturalHeight;
          c.getContext("2d").drawImage(img, 0, 0);
          resolve({ url: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight });
        } catch (e) {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = src;
    });
  }

  function waitForJsPDF(timeout = 8000) {
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      (function check() {
        if (window.jspdf && window.jspdf.jsPDF) return resolve(window.jspdf.jsPDF);
        if (Date.now() - t0 > timeout) return reject(new Error("jsPDF no cargó"));
        setTimeout(check, 150);
      })();
    });
  }

  async function build(C, extra) {
    const JsPDF = await waitForJsPDF();
    const m = C.manual;
    const doc = new JsPDF({ unit: "mm", format: "a5", compress: true });
    const usagi = await loadImageDataURL("assets/usagi.png");
    let y = TOP;

    const lh = (pt, k = 1.38) => pt * 0.3528 * k;
    const font = (style, size, color = INK) => {
      doc.setFont(style[0], style[1]);
      doc.setFontSize(size);
      doc.setTextColor(...color);
    };

    function paintPaper() {
      doc.setFillColor(...PAPER);
      doc.rect(0, 0, PAGE_W, PAGE_H, "F");
      font(["helvetica", "bold"], 6.5, WINE);
      doc.text("MANUAL DE USUARIO", M, 11);
      font(["helvetica", "normal"], 6.5, SOFT);
      doc.text(clean(`${m.producto} · ${m.modelo}`), PAGE_W - M, 11, { align: "right" });
      doc.setDrawColor(...WINE);
      doc.setLineWidth(0.4);
      doc.line(M, 13.5, PAGE_W - M, 13.5);
    }
    function newPage() {
      doc.addPage();
      paintPaper();
      y = TOP;
    }
    function ensure(h) {
      if (y + h > BOTTOM) newPage();
    }

    function heart(x, cy, s, color) {
      doc.setFillColor(...color);
      doc.circle(x - s * 0.25, cy - s * 0.12, s * 0.28, "F");
      doc.circle(x + s * 0.25, cy - s * 0.12, s * 0.28, "F");
      doc.triangle(x - s * 0.52, cy - 0.02, x + s * 0.52, cy - 0.02, x, cy + s * 0.62, "F");
    }
    function warnIcon(x, cy) {
      doc.setFillColor(...GOLD);
      doc.triangle(x, cy - 3.6, x - 4.1, cy + 3.2, x + 4.1, cy + 3.2, "F");
      font(["helvetica", "bold"], 9, WINE_DARK);
      doc.text("!", x, cy + 2.4, { align: "center" });
    }

    let sectionNo = 0;
    function heading(title) {
      sectionNo++;
      ensure(34); // que el título no quede solo al pie de la página
      doc.setFillColor(...WINE);
      doc.roundedRect(M, y, CONTENT_W, 9, 1.2, 1.2, "F");
      font(["helvetica", "bold"], 10, CREAM);
      doc.text(`${sectionNo}`, M + 4, y + 6.1);
      doc.text(clean(title).toUpperCase(), M + 11, y + 6.1);
      y += 15;
    }

    function para(text, opts = {}) {
      const size = opts.size || 9.5;
      const style = opts.style || ["helvetica", "normal"];
      const color = opts.color || INK;
      const x = opts.x ?? M;
      const width = opts.width ?? CONTENT_W;
      font(style, size, color);
      const lines = doc.splitTextToSize(clean(text), width);
      const step = lh(size);
      for (const line of lines) {
        ensure(step);
        doc.text(line, opts.align === "center" ? x + width / 2 : x, y, opts.align === "center" ? { align: "center" } : undefined);
        y += step;
      }
      y += opts.after ?? 2.5;
    }

    function bullets(items, marker) {
      const size = 9.5;
      const step = lh(size);
      for (const item of items) {
        font(["helvetica", "normal"], size, INK);
        const lines = doc.splitTextToSize(clean(item), CONTENT_W - 8);
        ensure(lines.length * step + 2);
        const cy = y - 1.2;
        if (marker === "heart") heart(M + 2.2, cy, 3.2, ROSE);
        else if (marker === "x") {
          doc.setDrawColor(...WINE);
          doc.setLineWidth(0.7);
          doc.line(M + 0.8, cy - 1.4, M + 3.6, cy + 1.4);
          doc.line(M + 3.6, cy - 1.4, M + 0.8, cy + 1.4);
        } else {
          doc.setFillColor(...GOLD);
          doc.circle(M + 2.2, cy, 1.1, "F");
        }
        font(["helvetica", "normal"], size, INK);
        for (const line of lines) {
          doc.text(line, M + 8, y);
          y += step;
        }
        y += 1.6;
      }
      y += 2;
    }

    function numbered(items) {
      const size = 9.5;
      const step = lh(size);
      items.forEach((item, k) => {
        font(["helvetica", "normal"], size, INK);
        const lines = doc.splitTextToSize(clean(item), CONTENT_W - 9);
        ensure(lines.length * step + 2);
        doc.setFillColor(...WINE);
        doc.circle(M + 2.6, y - 1.25, 2.4, "F");
        font(["helvetica", "bold"], 7.5, CREAM);
        doc.text(String(k + 1), M + 2.6, y - 0.1, { align: "center" });
        font(["helvetica", "normal"], size, INK);
        for (const line of lines) {
          doc.text(line, M + 9, y);
          y += step;
        }
        y += 1.8;
      });
      y += 2;
    }

    function table(widths, head, rows) {
      const size = 8.6;
      const step = lh(size, 1.3);
      const pad = 2.2;
      const drawRow = (cells, isHead) => {
        font(["helvetica", isHead ? "bold" : "normal"], size, isHead ? CREAM : INK);
        const split = cells.map((c, k) => doc.splitTextToSize(clean(c), widths[k] - pad * 2));
        const h = Math.max(...split.map((l) => l.length)) * step + pad * 2 - 0.6;
        ensure(h);
        let x = M;
        if (isHead) {
          doc.setFillColor(...WINE);
          doc.rect(M, y, CONTENT_W, h, "F");
        }
        split.forEach((lines, k) => {
          if (!isHead && k === 0) font(["helvetica", "bold"], size, WINE);
          else if (!isHead) font(["helvetica", "normal"], size, INK);
          lines.forEach((line, j) => doc.text(line, x + pad, y + pad + step * (j + 0.72)));
          x += widths[k];
        });
        doc.setDrawColor(...LINE);
        doc.setLineWidth(0.3);
        doc.line(M, y + h, M + CONTENT_W, y + h);
        y += h;
      };
      if (head) {
        ensure(26);
        drawRow(head, true);
      }
      rows.forEach((r) => drawRow(r, false));
      y += 6;
    }

    function boxed(text, title) {
      const size = 9;
      font(["helvetica", "normal"], size, INK);
      const lines = doc.splitTextToSize(clean(text), CONTENT_W - 10);
      const h = lines.length * lh(size) + (title ? 11 : 6);
      ensure(h + 4);
      doc.setDrawColor(...GOLD);
      doc.setLineWidth(0.8);
      doc.roundedRect(M, y, CONTENT_W, h, 2, 2, "S");
      let ty = y + 6;
      if (title) {
        font(["helvetica", "bold"], 8, WINE);
        doc.text(clean(title).toUpperCase(), M + 5, ty);
        ty += 5;
      }
      font(["helvetica", "normal"], size, INK);
      lines.forEach((line) => {
        doc.text(line, M + 5, ty);
        ty += lh(size);
      });
      y += h + 6;
    }

    // ---------- Portada ----------
    doc.setFillColor(...WINE_DARK);
    doc.rect(0, 0, PAGE_W, PAGE_H, "F");
    doc.setFillColor(...WINE);
    doc.rect(0, 0, PAGE_W, 58, "F");
    doc.setDrawColor(...GOLD);
    doc.setLineWidth(0.6);
    doc.rect(7, 7, PAGE_W - 14, PAGE_H - 14, "S");
    font(["helvetica", "bold"], 8, GOLD);
    doc.text("LEA ESTE MANUAL ANTES DE USAR", PAGE_W / 2, 20, { align: "center" });
    font(["helvetica", "bold"], 25, CREAM);
    doc.text("MANUAL", PAGE_W / 2, 35, { align: "center" });
    doc.text("DE USUARIO", PAGE_W / 2, 46, { align: "center" });
    font(["helvetica", "normal"], 10, CREAM);
    doc.text(clean(`${m.producto} · ${m.modelo}`), PAGE_W / 2, 70, { align: "center" });

    if (usagi) {
      const ih = 82;
      const iw = (ih * usagi.w) / usagi.h;
      doc.addImage(usagi.url, "PNG", (PAGE_W - iw) / 2, 80, iw, ih);
    }
    font(["helvetica", "oblique"], 7.5, [214, 170, 176]);
    doc.text("Fig. 1. El producto (ilustración referencial).", PAGE_W / 2, 168, { align: "center" });

    font(["helvetica", "bold"], 9, GOLD);
    doc.text(clean(`Edición exclusiva para: ${C.ella}`), PAGE_W / 2, 178, { align: "center" });

    // código de barras
    const rnd = (() => { let s = 67; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
    let bx = PAGE_W - 58;
    doc.setFillColor(...CREAM);
    while (bx < PAGE_W - 16) {
      const w = rnd() < 0.5 ? 0.35 : 0.8;
      doc.rect(bx, 186, w, 10, "F");
      bx += w + 0.5 + rnd() * 0.4;
    }
    font(["helvetica", "normal"], 6.5, CREAM);
    doc.text(clean(m.numeroSerie), PAGE_W - 37, 199.5, { align: "center" });
    font(["helvetica", "normal"], 6.5, [214, 170, 176]);
    doc.text("Contenido: 1 novio.", 16, 190);
    doc.text("Pilas no incluidas.", 16, 194);
    doc.text("Conserve este manual.", 16, 198);

    // ---------- Interior ----------
    newPage();
    font(["helvetica", "bold"], 15, WINE);
    doc.text("Antes de empezar", M, y + 2);
    y += 10;
    para(m.intro, { size: 10 });
    y += 2;
    font(["helvetica", "bold"], 8, WINE);
    doc.text("ADVERTENCIAS DE SEGURIDAD", M, y);
    y += 7;
    for (const w of m.advertencias) {
      font(["helvetica", "normal"], 9.2, INK);
      const lines = doc.splitTextToSize(clean(w), CONTENT_W - 13);
      const h = lines.length * lh(9.2) + 5;
      ensure(h + 3);
      doc.setFillColor(243, 233, 214);
      doc.roundedRect(M, y - 4.2, CONTENT_W, h, 1.5, 1.5, "F");
      warnIcon(M + 5.2, y - 4.2 + h / 2 - 0.4);
      font(["helvetica", "normal"], 9.2, INK);
      lines.forEach((line, k) => doc.text(line, M + 12, y + k * lh(9.2)));
      y += h + 3;
    }
    y += 4;

    heading("Especificaciones técnicas");
    table([46, CONTENT_W - 46], null, m.especificaciones);

    heading("Funciones favoritas");
    para("Cosas que me gustan. Activarlas con frecuencia mejora el rendimiento general del producto.", { color: SOFT, size: 9 });
    bullets(m.meGusta, "heart");

    heading("Pequeños gestos compatibles");
    para("Cosas que me agradan. Bajo consumo, alto impacto.", { color: SOFT, size: 9 });
    bullets(m.meAgrada, "dot");

    heading("Incompatibilidades");
    para("Cosas que no me gustan. Evitar para no anular la garantía.", { color: SOFT, size: 9 });
    bullets(m.noMeGusta, "x");

    heading("Solución de problemas");
    table(
      [36, 36, CONTENT_W - 72],
      ["Síntoma", "Causa probable", "Solución"],
      m.problemas.map((p) => [p.sintoma, p.causa, p.solucion])
    );

    heading("Mantenimiento");
    numbered(m.mantenimiento);

    heading("Garantía");
    boxed(m.garantia, "Certificado de garantía");

    // ---------- Anexo: poema ----------
    newPage();
    font(["helvetica", "bold"], 8, WINE);
    doc.text("ANEXO A", M, y);
    y += 7;
    font(["helvetica", "bold"], 15, WINE);
    doc.text("Poema de la usuaria", M, y);
    y += 6;
    font(["helvetica", "normal"], 8.5, SOFT);
    doc.text("Ganador del premio Six Seven de Oro.", M, y);
    y += 12;
    const poem = clean(extra.poem || "").split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (poem.length) {
      for (const verse of poem) para(verse, { style: ["times", "italic"], size: 12.5, color: WINE_DARK, align: "center", after: 0.6 });
      y += 4;
      para(`- ${C.ella}`, { style: ["times", "italic"], size: 11, color: SOFT, align: "center" });
    } else {
      para("(La usuaria se reservó el poema.)", { style: ["times", "italic"], size: 11, color: SOFT, align: "center" });
    }

    // ---------- Certificado ----------
    y += 10;
    ensure(64);
    doc.setDrawColor(...WINE);
    doc.setLineWidth(0.5);
    doc.roundedRect(M, y, CONTENT_W, 58, 2, 2, "S");
    doc.setLineWidth(0.2);
    doc.roundedRect(M + 1.5, y + 1.5, CONTENT_W - 3, 55, 1.5, 1.5, "S");
    font(["helvetica", "bold"], 8, WINE);
    doc.text("CERTIFICADO DE FINALIZACIÓN", PAGE_W / 2, y + 9, { align: "center" });
    const fecha = new Date().toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" });
    font(["helvetica", "normal"], 9.2, INK);
    const certLines = doc.splitTextToSize(
      clean(
        `Se certifica que ${C.ella} superó 10 rosas, resolvió precálculo, trigonometría y una integral, escribió un poema al 67 y alimentó a Usagi hasta los ${extra.kg} kg. Queda habilitada para operar este producto de por vida.`
      ),
      CONTENT_W - 16
    );
    certLines.forEach((line, k) => doc.text(line, PAGE_W / 2, y + 17 + k * lh(9.2), { align: "center" }));
    font(["helvetica", "oblique"], 8, SOFT);
    doc.text(clean(fecha), PAGE_W / 2, y + 50, { align: "center" });
    doc.setFillColor(...GOLD);
    doc.circle(PAGE_W - M - 12, y + 46, 7, "F");
    heart(PAGE_W - M - 12, y + 45.6, 6, [140, 100, 32]);
    y += 64;

    // ---------- Pies de página ----------
    const pages = doc.getNumberOfPages();
    for (let p = 2; p <= pages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.line(M, PAGE_H - 12, PAGE_W - M, PAGE_H - 12);
      font(["helvetica", "normal"], 6.5, SOFT);
      doc.text(clean(m.numeroSerie), M, PAGE_H - 8);
      doc.text(`Pág. ${p} de ${pages}`, PAGE_W - M, PAGE_H - 8, { align: "right" });
    }

    return doc.output("blob");
  }

  // Dentro del visor de Claude las descargas pasan por la capacidad "downloads";
  // en un navegador normal (GitHub Pages) se usa un link de descarga común.
  async function deliver(blob, filename) {
    const host = window.claude;
    if (host && typeof host.use === "function") {
      let downloads = null;
      try {
        downloads = await host.use("downloads");
      } catch (e) {
        downloads = null;
      }
      if (!downloads) return "unavailable";
      try {
        await downloads.save({ filename, data: blob });
        return "saved";
      } catch (e) {
        if (e && e.code === "declined") return "declined";
        if (e && e.code === "rate_limited") return "busy";
        return "unavailable";
      }
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return "saved";
  }

  window.ManualPDF = { build, deliver };
})();
