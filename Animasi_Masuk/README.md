# CoDose — Animated Opening Logo (revisi 2)

Jalankan: buka `index.html` di browser (tekan **R** atau double-click untuk memutar ulang).

## Alur
C putih (bukaan atas) → bola biru muda #82A9FF jatuh + bounce kecil → **C berputar 90°** (bukaan kanan) → bola menggelinding keluar lewat bukaan & berubah menjadi D → C dan D terbuka, o, o, s, e tumbuh → "calculator" timbul dari belakang (opacity + scale + overshoot + blur, tanpa pindah arah). Background #102F60, objek #FFFFFF, tanpa gradient/glow.

## Struktur
```
codose-splash/
├── index.html
├── css/splash.css
├── js/splash.js
├── assets/svg/{logo-c,logo-d,ball,logo-codose}.svg
└── README.md
```

## Integrasi
1. Salin `css/splash.css` & `js/splash.js` ke project.
2. Tempel blok `<div id="codose-splash">…</div>` dari `index.html` tepat setelah `<body>`; tambahkan link font Nunito (300) dan `splash.css`.
3. Atribut: `data-autohide="true"`, `data-dev="false"`, `data-hold="1600"` (ms tampilan akhir).
4. Muat `<script src=".../splash.js" defer>` sebelum script app.
5. Event: `codose:complete` (selesai + hold), `codose:hidden` (splash hilang). API: `CoDoseSplash.play()` / `.skip()`.

Penyetelan: ukuran bola = `RB` di `splash.js` (kini 25 = 87% celah bukaan C 57,7); timing di objek `CFG`. `prefers-reduced-motion` langsung menampilkan hasil akhir.
