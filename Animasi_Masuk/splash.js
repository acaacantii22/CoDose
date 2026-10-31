/* CoDose splash — seluruh animasi adalah fungsi murni dari waktu: render(t). */
(() => {
  'use strict';
  const root = document.getElementById('codose-splash');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  const svg = $('cd-logo'), cG = $('cd-c'), ground = $('cd-ground'), ball = $('cd-ball'), mark = $('cd-mark'),
        shape = $('cd-shape'), u1 = $('cd-u1'), u2 = $('cd-u2'), u3 = $('cd-u3'),
        name = root.querySelector('.cd-name'), sub = root.querySelector('.cd-sub');

  /* ---------- konfigurasi ---------- */
  const CFG = { G: 2800, H1: 44, H2: 12, cDur: .6, rollDur: .85, flightDur: .95,
                hold: +root.dataset.hold || 1200, autohide: root.dataset.autohide === 'true' };
  const CX = 140, CY = 120, RC = 34, RB = 18, YREST = CY + RC, TH = 82 * Math.PI / 180;
  const D2R = Math.PI / 180;

  /* ---------- easing ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const outCubic = t => 1 - Math.pow(1 - t, 3);
  const inOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const outBack = t => 1 + 2.4 * Math.pow(t - 1, 3) + 1.4 * Math.pow(t - 1, 2);

  /* ---------- geometri morph: bola -> D (8 segmen kubik, struktur sama) ---------- */
  const line = (p, q) => [p[0] + (q[0] - p[0]) / 3, p[1] + (q[1] - p[1]) / 3, p[0] + 2 * (q[0] - p[0]) / 3, p[1] + 2 * (q[1] - p[1]) / 3, q[0], q[1]];
  const arc = (cx, cy, r, a0, a1) => {
    const k = 4 / 3 * Math.tan((a1 - a0) / 4), x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0),
          x3 = cx + r * Math.cos(a1), y3 = cy + r * Math.sin(a1);
    return [x0 - k * r * Math.sin(a0), y0 + k * r * Math.cos(a0), x3 + k * r * Math.sin(a1), y3 - k * r * Math.cos(a1), x3, y3];
  };
  const shift = (s, dx, dy) => ({ s: [s.s[0] - dx, s.s[1] - dy], g: s.g.map(g => g.map((v, i) => v - (i % 2 ? dy : dx))) });
  const circle = r => {
    const A = [-35, 0, 90, 180, 220, 245, 270, 295, 325].map(d => (d - 90) * D2R);
    return { s: [r * Math.cos(A[0]), r * Math.sin(A[0])], g: A.slice(0, 8).map((a, i) => arc(0, 0, r, a, A[i + 1])) };
  };
  const T0 = -90 * D2R, T1 = 0, T2 = 90 * D2R, T3 = 180 * D2R, T4 = 270 * D2R;
  const OUT_D = shift({ s: [288, 28], g: [line([288, 28], [320, 28]), arc(320, 120, 92, T0, T1), arc(320, 120, 92, T1, T2),
    line([320, 212], [288, 212]), arc(288, 192, 20, T2, T3), line([268, 192], [268, 120]), line([268, 120], [268, 48]), arc(288, 48, 20, T3, T4)] }, 340, 120);
  const IN_D = shift({ s: [314, 68], g: [line([314, 68], [320, 68]), arc(320, 120, 52, T0, T1), arc(320, 120, 52, T1, T2),
    line([320, 172], [314, 172]), arc(314, 166, 6, T2, T3), line([308, 166], [308, 120]), line([308, 120], [308, 74]), arc(314, 74, 6, T3, T4)] }, 340, 120);
  const OUT_B = circle(RB), ZERO = { s: [0, 0], g: Array.from({ length: 8 }, () => [0, 0, 0, 0, 0, 0]) };
  const f = n => n.toFixed(2);
  const mk = (A, B, t) => {
    let d = 'M' + f(lerp(A.s[0], B.s[0], t)) + ' ' + f(lerp(A.s[1], B.s[1], t));
    for (let i = 0; i < 8; i++) { d += 'C'; for (let j = 0; j < 6; j++) d += f(lerp(A.g[i][j], B.g[i][j], t)) + ' '; }
    return d + 'Z';
  };
  const morphD = (e, ec) => mk(OUT_B, OUT_D, e) + mk(ZERO, IN_D, ec);

  /* ---------- lintasan keluar dari mangkuk (Catmull-Rom, diparameterisasi panjang busur) ---------- */
  const PA = [CX + RC * Math.sin(TH), CY + RC * Math.cos(TH)];
  const PTS = [[172, 158], PA, [160, 100], [150, 72], [153, 42], [182, 14], [225, 3], [275, 16], [318, 60], [340, 120], [340, 120]];
  const poly = [[PA[0], PA[1], 0]]; let LEN = 0;
  for (let i = 1; i < PTS.length - 2; i++) {
    const p0 = PTS[i - 1], p1 = PTS[i], p2 = PTS[i + 1], p3 = PTS[i + 2];
    for (let j = 1; j <= 20; j++) {
      const t = j / 20, t2 = t * t, t3 = t2 * t;
      const pt = [0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
      const l = poly[poly.length - 1]; LEN += Math.hypot(pt[0] - l[0], pt[1] - l[1]); poly.push([pt[0], pt[1], LEN]);
    }
  }
  const posAt = s => {
    const d = s * LEN; let i = 1; while (i < poly.length - 1 && poly[i][2] < d) i++;
    const a = poly[i - 1], b = poly[i], t = (d - a[2]) / ((b[2] - a[2]) || 1);
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  };
  // Hermite: kecepatan awal terbang = kecepatan akhir menggelinding (tanpa patahan), berhenti halus di posisi D
  const M0 = Math.min(2.5, (RC * TH * 2 / CFG.rollDur) * CFG.flightDur / LEN);
  const flightS = u => (u * u * u - 2 * u * u + u) * M0 + (-2 * u * u * u + 3 * u * u);

  /* ---------- timeline ---------- */
  let T, startY, lastD = '';
  function build() {
    const r = svg.getBoundingClientRect(), k = (r.width / 460) || 1;
    startY = Math.min(-60, -r.top / k - 40);                  // bola mulai dari tepi atas layar
    const fall = Math.sqrt(2 * (YREST - startY) / CFG.G);
    const b1 = 2 * Math.sqrt(2 * CFG.H1 / CFG.G), b2 = 2 * Math.sqrt(2 * CFG.H2 / CFG.G);
    T = { fall0: .4 }; T.I0 = T.fall0 + fall; T.I1 = T.I0 + b1; T.I2 = T.I1 + b2;
    T.roll0 = T.I2; T.fly0 = T.roll0 + CFG.rollDur; T.end = T.fly0 + CFG.flightDur;
    T.name0 = T.end + .05; T.sub0 = T.name0 + .5; T.total = T.sub0 + .7;
    T.v1 = Math.sqrt(2 * CFG.G * CFG.H1); T.v2 = Math.sqrt(2 * CFG.G * CFG.H2);
  }

  function render(t) {
    // Tahap 1: huruf C
    const uc = clamp(t / CFG.cDur), s = .6 + .4 * outBack(uc), ty = (1 - outCubic(uc)) * 18;
    cG.setAttribute('transform', `translate(${CX} ${CY + ty}) scale(${s}) translate(${-CX} ${-CY})`);
    cG.setAttribute('opacity', Math.min(1, uc * 2.5)); ground.setAttribute('opacity', uc);

    // Tahap 2-4: bola
    let x = CX, y = YREST, a = 0, e = 0, ec = 0, q = 0, vis = t >= T.fall0;
    if (t < T.I0) { const tau = t - T.fall0; y = startY + .5 * CFG.G * tau * tau; }
    else if (t < T.I1) { const tau = t - T.I0; y = YREST - (T.v1 * tau - .5 * CFG.G * tau * tau); }
    else if (t < T.I2) { const tau = t - T.I1; y = YREST - (T.v2 * tau - .5 * CFG.G * tau * tau); }
    else if (t < T.fly0) {                                      // menggelinding ke kanan mengikuti lengkung
      const u = (t - T.roll0) / CFG.rollDur, th = TH * u * u;
      x = CX + RC * Math.sin(th); y = CY + RC * Math.cos(th); a = RC / RB * th / D2R;
    } else {                                                    // keluar lewat bukaan, berubah menjadi D
      const u = clamp((t - T.fly0) / CFG.flightDur), p = posAt(clamp(flightS(u)));
      x = p[0]; y = p[1]; e = inOutCubic(clamp((u - .28) / .72)); ec = inOutCubic(clamp((u - .55) / .45));
      a = RC / RB * TH / D2R + 60 * u;
    }
    if (t < T.I2) for (const [Ti, A] of [[T.I0, .22], [T.I1, .1], [T.I2, .05]]) { const d = Math.abs(t - Ti); if (d < .08) q += A * Math.pow(1 - d / .08, 2); }
    ball.setAttribute('opacity', vis ? 1 : 0);
    ball.setAttribute('transform', `translate(${f(x)} ${f(y + RB)}) scale(${f(1 + q)} ${f(1 - q)}) translate(0 ${-RB})`);
    const dd = morphD(e, ec); if (dd !== lastD) { shape.setAttribute('d', dd); lastD = dd; }
    const ra = a * Math.pow(1 - e, 2), dep = lerp(4, 9, e);
    u1.setAttribute('transform', `translate(0 ${f(dep)}) rotate(${f(ra)})`);
    u2.setAttribute('transform', `translate(0 ${f(dep / 2)}) rotate(${f(ra)})`);
    u3.setAttribute('transform', `rotate(${f(ra)})`);
    mark.setAttribute('transform', `rotate(${f(a)})`); mark.setAttribute('opacity', Math.max(0, 1 - e * 3));

    // Tahap 5-6: teks
    const n = outCubic(clamp((t - T.name0) / .6)), m = outCubic(clamp((t - T.sub0) / .7));
    name.style.opacity = n; name.style.transform = `translateY(${(1 - n) * 10}px)`;
    sub.style.opacity = m; sub.style.transform = `translateY(${(1 - m) * 8}px)`;
  }

  /* subtitle disesuaikan lebarnya dengan "CoDose" lewat letter-spacing */
  function fit() {
    sub.style.letterSpacing = '0'; sub.style.marginRight = '0';
    const n = sub.textContent.length, ls = (name.offsetWidth - sub.offsetWidth) / (n - 1);
    sub.style.letterSpacing = ls + 'px'; sub.style.marginRight = -ls + 'px';
  }

  /* ---------- pemutar ---------- */
  let raf = 0, hold = 0, t0 = 0;
  const frame = now => { const t = (now - t0) / 1000; if (t < T.total) { render(t); raf = requestAnimationFrame(frame); } else finish(); };
  function finish() {
    cancelAnimationFrame(raf); render(Infinity); clearTimeout(hold);
    hold = setTimeout(() => {
      document.dispatchEvent(new CustomEvent('codose:complete'));
      if (CFG.autohide) { root.classList.add('is-hidden'); setTimeout(() => { root.hidden = true; document.dispatchEvent(new CustomEvent('codose:hidden')); }, 550); }
    }, CFG.hold);
  }
  function play() {
    cancelAnimationFrame(raf); clearTimeout(hold); root.hidden = false; root.classList.remove('is-hidden');
    fit(); build(); lastD = '';
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
    render(0); t0 = performance.now(); raf = requestAnimationFrame(frame);
  }
  const ready = Promise.race([document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 1500))]);
  ready.then(play);
  addEventListener('resize', () => { fit(); });
  if (root.dataset.dev === 'true') {
    addEventListener('keydown', e => { if (e.key.toLowerCase() === 'r') play(); });
    root.addEventListener('dblclick', play);
  }
  window.CoDoseSplash = { play, skip: finish };
})();
