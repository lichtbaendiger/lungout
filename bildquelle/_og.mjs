/* Baut vorschau.html (1200x630) inkl. echtem Lungen-Layout aus ../index.html
   und rendert daraus mit Headless-Chrome ../vorschau.png (og:image-Format).
   Start im Spielordner:  node bildquelle\_og.mjs   */
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const dir = new URL('./', import.meta.url);
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

const ms = html.indexOf('/*__MASK_START__*/');
const me = html.indexOf('/*__MASK_END__*/');
if (ms < 0 || me < 0) { console.error('MASK-Block nicht gefunden'); process.exit(1); }
const mask = html.slice(ms, me);

const page = `<!doctype html>
<html lang="de"><head><meta charset="utf-8">
<style>
  html,body{margin:0;padding:0;width:1200px;height:630px;overflow:hidden;background:#06090c}
  canvas{display:block}
</style></head>
<body><canvas id="c" width="1200" height="630"></canvas>
<script>
"use strict";
${mask}

const ctx = document.getElementById('c').getContext('2d');
const W = 1200, H = 630;

/* Hintergrund */
const bg = ctx.createLinearGradient(0, 0, 0, H);
bg.addColorStop(0, '#101a26'); bg.addColorStop(0.6, '#0a1017'); bg.addColorStop(1, '#05080b');
ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
ctx.strokeStyle = 'rgba(120,160,200,.05)'; ctx.lineWidth = 1;
ctx.beginPath();
for (let x = 0; x < W; x += 40) { ctx.moveTo(x + .5, 0); ctx.lineTo(x + .5, H); }
for (let y = 0; y < H; y += 40) { ctx.moveTo(0, y + .5); ctx.lineTo(W, y + .5); }
ctx.stroke();

/* Ziegel-Farbzuordnung wie im Spiel */
function hsl(h, s, l) { return 'hsl(' + h + ',' + s + '%,' + l + '%)'; }
function colorOf(b) {
  if (b.type === 'trachea') return ['#f0d3a6', '#c39a63', '#8a6b42'];
  if (b.type === 'bronchus') return ['#e7c39a', '#b98d5c', '#7f5f39'];
  if (b.type === 'bronchiole') return ['#e3ece0', '#a8bfa6', '#6d8370'];
  const hue = 352 - b.v * 30;
  return [hsl(hue, 62, 62 - b.v * 16), hsl(hue, 58, 44 - b.v * 14), hsl(hue, 45, 30 - b.v * 14)];
}
function rr(x, y, w, h, r) {
  const q = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + q, y); ctx.lineTo(x + w - q, y); ctx.quadraticCurveTo(x + w, y, x + w, y + q);
  ctx.lineTo(x + w, y + h - q); ctx.quadraticCurveTo(x + w, y + h, x + w - q, y + h);
  ctx.lineTo(x + q, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - q);
  ctx.lineTo(x, y + q); ctx.quadraticCurveTo(x, y, x + q, y); ctx.closePath();
}

/* Umriss der Lunge, schematisch */
const S = 0.70, OX = 34, OY = 12;
ctx.save(); ctx.translate(OX, OY); ctx.scale(S, S);
ctx.setLineDash([3, 6]); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(170,200,230,.20)';
ctx.beginPath();
for (const side of [SHAPE.lung.left, SHAPE.lung.right]) {
  ctx.moveTo(side.cx + side.rx, SHAPE.lung.cy);
  ctx.ellipse(side.cx, SHAPE.lung.cy, side.rx, side.ry, 0, 0, 6.284);
}
ctx.moveTo(CX - SHAPE.trachea.half, SHAPE.trachea.y0); ctx.lineTo(CX - SHAPE.trachea.half, SHAPE.trachea.y1);
ctx.moveTo(CX + SHAPE.trachea.half, SHAPE.trachea.y0); ctx.lineTo(CX + SHAPE.trachea.half, SHAPE.trachea.y1);
for (const b of SHAPE.bronchus) { ctx.moveTo(SHAPE.carina.x, SHAPE.carina.y); ctx.lineTo(b.x2, b.y2); }
ctx.stroke(); ctx.setLineDash([]);

/* Steine: ein Feld ist schon weggeraucht, damit man den Rauch sieht */
let seed = 11;
function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
ctx.shadowColor = 'rgba(255,116,84,.30)'; ctx.shadowBlur = 10;
for (let r = 0; r < GRID.rows; r++) {
  for (let c = 0; c < GRID.cols; c++) {
    const type = cellType(c, r);
    if (!type) continue;
    const p = cellCenter(c, r);
    const v = (p.y - GRID.gy) / GRID.fh;
    const gone = (c >= 9 && c <= 14 && r >= 8) && rnd() < 0.82;
    if (gone) continue;
    const col = colorOf({ type: type, v: v });
    const ring = type === 'trachea';
    const w = (ring ? GRID.cw * 0.9 : GRID.cw) - 3.2;
    const h = (ring ? GRID.ch * 0.6 : GRID.ch) - 3.2;
    const x = p.x - w / 2, y = p.y - h / 2;
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, col[0]); g.addColorStop(1, col[1]);
    rr(x, y, w, h, ring ? h / 2 : 5); ctx.fillStyle = g; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = 1; ctx.strokeStyle = col[2]; ctx.stroke();
    ctx.globalAlpha = 0.5; ctx.strokeStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.moveTo(x + 4, y + 1.5); ctx.lineTo(x + w - 4, y + 1.5); ctx.stroke();
    ctx.globalAlpha = 1;
    if (type === 'lobe') {
      ctx.globalAlpha = 0.22; ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x + 5 + rnd() * (w - 10), y + 4 + rnd() * (h - 8), 2 + rnd() * 2, 0, 6.284); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
  }
}
/* Zigarette als Schlaeger */
const pw = 190, ph = 17, pyc = 638, px0 = CX - pw / 2;
ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 4;
rr(px0, pyc - ph / 2, pw, ph, ph / 2);
const pg = ctx.createLinearGradient(0, pyc - ph / 2, 0, pyc + ph / 2);
pg.addColorStop(0, '#fdfaf2'); pg.addColorStop(1, '#c9bfae');
ctx.fillStyle = pg; ctx.fill(); ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
ctx.save(); rr(px0, pyc - ph / 2, pw * 0.26, ph, ph / 2); ctx.clip();
const fg = ctx.createLinearGradient(0, pyc - ph / 2, 0, pyc + ph / 2);
fg.addColorStop(0, '#e0a55e'); fg.addColorStop(1, '#96581f');
ctx.fillStyle = fg; ctx.fillRect(px0, pyc - ph / 2, pw * 0.26, ph); ctx.restore();
ctx.save(); rr(px0 + pw - 14, pyc - ph / 2, 14, ph, ph / 2); ctx.clip();
const bgn = ctx.createLinearGradient(px0 + pw - 14, 0, px0 + pw, 0);
bgn.addColorStop(0, 'rgba(140,140,140,0)'); bgn.addColorStop(0.4, '#8d8f92');
bgn.addColorStop(0.75, '#ff8a34'); bgn.addColorStop(1, '#ffd88f');
ctx.fillStyle = bgn; ctx.fillRect(px0 + pw - 14, pyc - ph / 2, 14, ph); ctx.restore();

/* Gluehender Ball */
const bx = 470, by = 560;
ctx.globalCompositeOperation = 'lighter';
const bal = ctx.createRadialGradient(bx, by, 0, bx, by, 42);
bal.addColorStop(0, 'rgba(255,225,170,.95)'); bal.addColorStop(0.35, 'rgba(255,140,60,.4)');
bal.addColorStop(1, 'rgba(255,90,30,0)');
ctx.fillStyle = bal; ctx.beginPath(); ctx.arc(bx, by, 42, 0, 6.284); ctx.fill();
ctx.globalCompositeOperation = 'source-over';
const core = ctx.createRadialGradient(bx - 2.5, by - 3, 1, bx, by, 9);
core.addColorStop(0, '#fff6e2'); core.addColorStop(0.5, '#ffb257'); core.addColorStop(1, '#c2410c');
ctx.fillStyle = core; ctx.beginPath(); ctx.arc(bx, by, 9, 0, 6.284); ctx.fill();
ctx.restore();

/* Qualm: schwadenhaft aufsteigend */
ctx.globalCompositeOperation = 'lighter';
let s2 = 77;
function rnd2() { s2 = (s2 * 1103515245 + 12345) & 0x7fffffff; return s2 / 0x7fffffff; }
for (let i = 0; i < 30; i++) {
  const t = i / 30;
  const x = 420 + Math.sin(t * 6.2) * 130 + rnd2() * 60;
  const y = 470 - t * 400;
  const r = 24 + t * 82;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const a = 0.10 * (1 - t) + 0.02;
  g.addColorStop(0, 'rgba(214,220,228,' + a.toFixed(3) + ')');
  g.addColorStop(1, 'rgba(214,220,228,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.284); ctx.fill();
}
ctx.globalCompositeOperation = 'source-over';

/* Vignette */
const vg = ctx.createRadialGradient(600, 300, 240, 600, 300, 780);
vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

/* Textblock */
const TX = 672, TITLE = '700 88px "Segoe UI", system-ui, sans-serif';
function spaced(txt, x, y, font, color, sp) {
  ctx.font = font; ctx.fillStyle = color;
  let cx = x;
  for (const ch of txt) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; }
  return cx - sp - x;
}
ctx.font = TITLE;
let px = TX;
for (const ch of 'LUNG') px += ctx.measureText(ch).width + 7;
spaced('LUNG', TX, 292, TITLE, '#f2f6fa', 7);
spaced('OUT', px - 7, 292, TITLE, '#ff8348', 7);
spaced('VIER ZÜGE. ZWEI LUNGENFLÜGEL. NULL REUE.', TX, 340, '700 17px "Segoe UI", sans-serif', '#e8edf2', 2.4);
ctx.font = '400 19px "Segoe UI", sans-serif'; ctx.fillStyle = '#9db0c2';
const lines = ['Willkommen in deinen Lungenflügeln.', 'Zieh durch: ein Zug, ein Ball, ein Stein weniger.', 'Der Qualm bleibt, wo er hingehört.'];
let ty = 392;
for (const l of lines) { ctx.fillText(l, TX, ty); ty += 30; }
/* Domain-Kapsel */
ctx.font = '700 17px ui-monospace, Consolas, monospace';
const dom = 'lungout.de';
const dw = ctx.measureText(dom).width;
rr(TX, 494, dw + 44, 42, 21);
ctx.fillStyle = '#ff8348'; ctx.fill();
ctx.fillStyle = '#20140c'; ctx.fillText(dom, TX + 22, 522);
ctx.font = '400 13px "Segoe UI", sans-serif'; ctx.fillStyle = '#8ea0b2';
ctx.fillText('Breakout für Leute, die wissen, wie das endet.', TX + dw + 60, 521);
</script></body></html>`;

writeFileSync(new URL('./vorschau.html', dir), page, 'utf8');

const chrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const out = 'C:\\Users\\Thermaltake\\Desktop\\strata\\lungouth\\vorschau.png';
execFileSync(chrome, [
  '--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--user-data-dir=' + process.env.TEMP + '\\ogprof',
  '--window-size=1200,630', '--force-device-scale-factor=1',
  '--virtual-time-budget=3000',
  '--screenshot=' + out,
  'file:///C:/Users/Thermaltake/Desktop/strata/lungouth/bildquelle/vorschau.html',
], { stdio: 'pipe' });
console.log('vorschau.png erzeugt');
