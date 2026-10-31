# CoDose — Animated Opening Logo

Jalankan: buka `index.html` di browser (tekan **R** atau double-click untuk memutar ulang).

## Struktur
```
codose-splash/
├── index.html
├── css/splash.css
├── js/splash.js
├── assets/svg/{logo-c,logo-d,ball,logo-mark}.svg
└── README.md
```
`assets/svg/*` adalah aset statis (favicon, OG image, fallback). Animasi memakai SVG inline di `index.html` agar JS bisa memorph bola → D.

## Integrasi ke web app utama
1. Salin `css/splash.css` dan `js/splash.js` ke project (mis. `public/splash/`).
2. Tempel blok `<div id="codose-splash">…</div>` dari `index.html` tepat setelah `<body>`; tambahkan link Nunito (atau self-host fontnya) dan `<link rel="stylesheet">` ke `splash.css`.
3. Ubah atribut: `data-autohide="true"` (splash memudar setelah selesai), `data-dev="false"`, `data-hold="1400"` (ms tampil statis).
4. Muat `<script src=".../splash.js" defer>` sebelum script aplikasi.
5. Event: `document.addEventListener('codose:complete', …)` (animasi + hold selesai), `'codose:hidden'` (splash sudah hilang). API: `CoDoseSplash.play()` / `CoDoseSplash.skip()`.
6. React/Vue/SPA: render markup di `index.html` root (di luar komponen), import `splash.js` sekali di entry file.
7. Opsional: tampilkan splash hanya sekali per sesi — `if (sessionStorage.cdSeen) document.getElementById('codose-splash').remove(); else sessionStorage.cdSeen = 1;` sebelum memuat `splash.js`.

Penyesuaian: warna di gradient `#cd-grad` & `--cd-*` pada CSS; durasi di objek `CFG` (`rollDur`, `flightDur`). `prefers-reduced-motion` otomatis langsung menampilkan logo akhir.
