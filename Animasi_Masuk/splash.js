/* CoDose splash v2 — seluruh animasi adalah fungsi murni dari waktu: render(t). */
(() => {
  'use strict';
  const root = document.getElementById('codose-splash');
  if (!root) return;
  const $ = id => root.querySelector('#' + id);
  const svg = $('cd-logo'), world = $('cd-world'), cEl = $('cd-C'), o1 = $('cd-o1'), o2 = $('cd-o2'), sEl = $('cd-s'), eEl = $('cd-e'),
        ballG = $('cd-ball'), shape = $('cd-shape'), stage = root.querySelector('.cd-stage'), sub = root.querySelector('.cd-sub');

  const CFG = { G: 2400, H1: 30, H2: 9, cDur: .6, rotDur: .9, outDur: 1.1, s5Dur: 1.15, Z0: 2,
                hold: +root.dataset.hold || 1500, autohide: root.dataset.autohide === 'true' };
  // Geometri (satuan SVG). Tebal huruf 22, tinggi kapital 126, jari-jari tengah C = 52, bukaan C ±50°.
  // Celah bukaan = 2*52*sin50° - 22 = 57.7 ; diameter bola = 50 = 87% celah.
  const RB = 25, RC = 41 - RB, YR = RC;
  const XC0 = -53.7, XD0 = 60.7;                                       // komposisi "CD"
  const XC1 = -232.7, XO1 = -133.3, XD1 = -22.3, XO2 = 88.7, XS = 169.7, XE = 250.7;  // kata "CoDose"
  const WORDW = 569.4, BALL = [130, 169, 255], D2R = Math.PI / 180;

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const outCubic = t => 1 - Math.pow(1 - t, 3);
  const inOutCubic = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const inOutSine = t => -(Math.cos(Math.PI * t) - 1) / 2;
  const back = (t, c = 1.7) => 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
  const f = n => n.toFixed(2);

  /* ---------- morph bola -> D (8 segmen kubik berstruktur sama) ---------- */
  const line = (p, q) => [p[0] + (q[0] - p[0]) / 3, p[1] + (q[1] - p[1]) / 3, p[0] + 2 * (q[0] - p[0]) / 3, p[1] + 2 * (q[1] - p[1]) / 3, q[0], q[1]];
  const arc = (cx, cy, r, a0, a1) => {
    const k = 4 / 3 * Math.tan((a1 - a0) / 4), x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x3 = cx + r * Math.cos(a1), y3 = cy + r * Math.sin(a1);
    return [x0 - k * r * Math.sin(a0), y0 + k * r * Math.cos(a0), x3 + k * r * Math.sin(a1), y3 - k * r * Math.cos(a1), x3, y3];
  };
  const shift = (s, dx) => ({ s: [s.s[0] - dx, s.s[1]], g: s.g.map(g => g.map((v, i) => i % 2 ? v : v - dx)) });
  const circle = r => {
    const A = [-35, 0, 90, 180, 220, 245, 270, 295, 325].map(d => (d - 90) * D2R);
    return { s: [r * Math.cos(A[0]), r * Math.sin(A[0])], g: A.slice(0, 8).map((a, i) => arc(0, 0, r, a, A[i + 1])) };
  };
  const T0 = -90 * D2R, T1 = 0, T2 = 90 * D2R, T3 = 180 * D2R, T4 = 270 * D2R;
  const OUT_D = shift({ s: [14, -63], g: [line([14, -63], [49, -63]), arc(49, 0, 63, T0, T1), arc(49, 0, 63, T1, T2), line([49, 63], [14, 63]),
    arc(14, 49, 14, T2, T3), line([0, 49], [0, 0]), line([0, 0], [0, -49]), arc(14, -49, 14, T3, T4)] }, 56);
  const IN_D = shift({ s: [27, -41], g: [line([27, -41], [49, -41]), arc(49, 0, 41, T0, T1), arc(49, 0, 41, T1, T2), line([49, 41], [27, 41]),
    arc(27, 36, 5, T2, T3), line([22, 36], [22, 0]), line([22, 0], [22, -36]), arc(27, -36, 5, T3, T4)] }, 56);
  const OUT_B = circle(RB), ZERO = { s: [0, 0], g: Array.from({ length: 8 }, () => [0, 0, 0, 0, 0, 0]) };
  const mk = (A, B, t) => {
    let d = 'M' + f(lerp(A.s[0], B.s[0], t)) + ' ' + f(lerp(A.s[1], B.s[1], t));
    for (let i = 0; i < 8; i++) { d += 'C'; for (let j = 0; j < 6; j++) d += f(lerp(A.g[i][j], B.g[i][j], t)) + ' '; }
    return d + 'Z';
  };

  /* ---------- lintasan bola keluar lewat bukaan kanan (relatif ke pusat C) ---------- */
  const REL = [[-12, 18], [0, 18], [10.3, 14.7], [22, 6], [33.4, .5], [60, 0], [88, 0], [114.4, 0], [114.4, 0]];
  const PTS = REL.map(p => [p[0] + XC0, p[1]]);
  const poly = [[PTS[1][0], PTS[1][1], 0]]; let LEN = 0;
  for (let i = 1; i < PTS.length - 2; i++) {
    const p0 = PTS[i - 1], p1 = PTS[i], p2 = PTS[i + 1], p3 = PTS[i + 2];
    for (let j = 1; j <= 16; j++) {
      const t = j / 16, t2 = t * t, t3 = t2 * t;
      const pt = [0, 1].map(k => .5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3));
      const l = poly[poly.length - 1]; LEN += Math.hypot(pt[0] - l[0], pt[1] - l[1]); poly.push([pt[0], pt[1], LEN]);
    }
  }
  const posAt = s => {
    const d = s * LEN; let i = 1; while (i < poly.length - 1 && poly[i][2] < d) i++;
    const a = poly[i - 1], b = poly[i], t = (d - a[2]) / ((b[2] - a[2]) || 1);
    return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
  };

  /* ---------- timeline ---------- */
  let T, startY, OFF = 0, lastD = '';
  function build() {
    const r = svg.getBoundingClientRect(), k = (r.width / 660) || 1;
    startY = (-110 - r.top / k) / CFG.Z0 - RB - 10;               // bola muncul dari tepi atas layar
    const fall = Math.sqrt(2 * (YR - startY) / CFG.G), b1 = 2 * Math.sqrt(2 * CFG.H1 / CFG.G), b2 = 2 * Math.sqrt(2 * CFG.H2 / CFG.G);
    T = { fall0: .4 }; T.I0 = T.fall0 + fall; T.I1 = T.I0 + b1; T.I2 = T.I1 + b2;
    T.rot0 = T.I2 + .1; T.out0 = T.rot0 + CFG.rotDur + .05; T.s5 = T.out0 + CFG.outDur;
    T.sub0 = T.s5 + .6; T.total = T.sub0 + 1;
    T.v1 = Math.sqrt(2 * CFG.G * CFG.H1); T.v2 = Math.sqrt(2 * CFG.G * CFG.H2);
  }
  const put = (el, x, y, sc, o) => { el.setAttribute('opacity', sc > .001 ? clamp(o) : 0); el.setAttribute('transform', `translate(${f(x)} ${y}) scale(${f(Math.max(sc, .001))})`); };

  function render(t) {
    const p = clamp((t - T.s5) / CFG.s5Dur), ep = inOutCubic(p);
    const xC = lerp(XC0, XC1, ep), xD = lerp(XD0, XD1, ep);
    world.setAttribute('transform', `scale(${f(lerp(CFG.Z0, 1, ep))})`);
    stage.style.transform = `translateY(${f(-OFF * ep)}px)`;

    // Tahap 1 + 3: huruf C (muncul, lalu berputar 90° searah jarum jam: bukaan atas -> kanan)
    const uc = clamp(t / CFG.cDur), rot = -90 + 90 * inOutCubic(clamp((t - T.rot0) / CFG.rotDur));
    cEl.setAttribute('opacity', Math.min(1, uc * 2.5));
    cEl.setAttribute('transform', `translate(${f(xC)} 0) scale(${f(.6 + .4 * back(uc))}) rotate(${f(rot)})`);

    // Tahap 2 + 4: bola
    let x = XC0, y = YR, a = 0, e = 0, ec = 0, q = 0;
    if (t < T.I0) { const tau = t - T.fall0; y = startY + .5 * CFG.G * tau * tau; }
    else if (t < T.I1) { const tau = t - T.I0; y = YR - (T.v1 * tau - .5 * CFG.G * tau * tau); }
    else if (t < T.I2) { const tau = t - T.I1; y = YR - (T.v2 * tau - .5 * CFG.G * tau * tau); }
    if (t < T.I2 + .08) for (const [Ti, A] of [[T.I0, .14], [T.I1, .07], [T.I2, .03]]) { const d = Math.abs(t - Ti); if (d < .08) q += A * Math.pow(1 - d / .08, 2); }
    if (t >= T.out0) {
      const u = clamp((t - T.out0) / CFG.outDur), s = inOutSine(u), pos = posAt(s);
      x = pos[0]; y = pos[1]; a = s * LEN / RB / D2R;
      e = inOutCubic(clamp((u - .4) / .6)); ec = inOutCubic(clamp((u - .65) / .35));
      if (u >= 1) { x = xD; y = 0; }
    }
    ballG.setAttribute('opacity', t >= T.fall0 ? 1 : 0);
    ballG.setAttribute('transform', `translate(${f(x)} ${f(y + RB * (1 - e))}) scale(${f(1 + q)} ${f(1 - q)}) translate(0 ${f(-RB * (1 - e))})`);
    const dd = mk(OUT_B, OUT_D, e) + mk(ZERO, IN_D, ec); if (dd !== lastD) { shape.setAttribute('d', dd); lastD = dd; }
    shape.setAttribute('fill', `rgb(${BALL.map(c => Math.round(lerp(c, 255, e))).join(',')})`);
    // Tahap 5: CD membuka & berkembang menjadi CoDose
    let lp = clamp((p - .1) / .6);
    put(o1, (xC + xD) / 2 - 5.8 * ep, 18, back(lp), lp * 3);
    lp = clamp((p - .3) / .55); put(o2, lerp(xD + 50, XO2, outCubic(lp)), 18, back(lp), lp * 3);
    lp = clamp((p - .45) / .55); put(sEl, lerp(xD + 50, XS, outCubic(lp)), 18, back(lp), lp * 3);
    lp = clamp((p - .6) / .4); put(eEl, lerp(xD + 50, XE, outCubic(lp)), 18, back(lp), lp * 3);

    // "calculator": timbul dari belakang (opacity + scale + overshoot + blur, tanpa berpindah arah)
    const sp = clamp((t - T.sub0) / .95), b = (1 - outCubic(sp)) * 4;
    sub.style.opacity = clamp((t - T.sub0 + .12) / .12) * (.14 + .86 * outCubic(sp));
    sub.style.transform = `translateX(-50%) scale(${f(.8 + .2 * back(sp, 2.2))})`;
    sub.style.filter = b > .05 ? `blur(${f(b)}px)` : 'none';
  }

  /* lebar "calculator" disamakan dengan lebar kata "CoDose" lewat letter-spacing */
  function fit() {
    const k = svg.getBoundingClientRect().width / 660; sub.style.letterSpacing = '0'; sub.style.paddingLeft = '0';
    const target = WORDW * k, natural = sub.offsetWidth;
    sub.style.letterSpacing = '1px';
    const spacingWidth = sub.offsetWidth - natural;
    sub.style.letterSpacing = spacingWidth ? (target - natural) / spacingWidth + 'px' : '0';
    OFF = (18 * k + sub.offsetHeight) / 2;                         // agar kata + subtitle berada tepat di tengah layar
  }

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
  Promise.race([document.fonts ? document.fonts.ready : 0, new Promise(r => setTimeout(r, 1500))]).then(play);
  addEventListener('resize', fit);
  if (root.dataset.dev === 'true') {
    addEventListener('keydown', e => { if (e.key.toLowerCase() === 'r') play(); });
    root.addEventListener('dblclick', play);
  }
  window.CoDoseSplash = { play, skip: finish };
})();
