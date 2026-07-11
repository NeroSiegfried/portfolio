// Procedurally generate the four "What I do" service images so they read as a
// cohesive set with the hero (public/hero/hero-2.jpg): a dark, near-monochrome
// editorial composition with a single burnt-orange (#FB460D) glow as the light
// source, seen through fluted/reeded glass (vertical warp + smear), finished
// with rib sheen, film grain and a vignette. Each image carries a faint motif
// hinting at its service, which the glass smears into atmosphere.
//
// Pipeline: HTML5 Canvas render (headless Chrome) -> PNG -> sharp -> JPEG.
//   node scripts/generate-service-images.mjs            # all four
//   ONLY=apis node scripts/generate-service-images.mjs  # one
import puppeteer from 'puppeteer'
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const OUT = path.resolve('public/services')
fs.mkdirSync(OUT, { recursive: true })
const W = 2400, H = 1500

// Per-image identity: glow placement/temperature, motif, rib feel. Everything
// else (grade, streaks, grain, vignette) is shared → they read as one series.
const IMAGES = [
  //                              glow pool           dark subject form
  { file: 'fullstack', motif: 'ui',      gx: 0.34, gy: 0.46, gr: 0.34, warm: 1.00, sx: 0.52, sy: 0.54, srx: 0.24, sry: 0.40, rib: 7, amp: 5 },
  { file: 'apis',      motif: 'json',    gx: 0.26, gy: 0.58, gr: 0.32, warm: 0.90, sx: 0.56, sy: 0.52, srx: 0.22, sry: 0.44, rib: 6, amp: 5 },
  { file: 'systems',   motif: 'circuit', gx: 0.64, gy: 0.52, gr: 0.30, warm: 0.82, sx: 0.40, sy: 0.55, srx: 0.24, sry: 0.42, rib: 8, amp: 6 },
  { file: 'ai',        motif: 'ai',      gx: 0.70, gy: 0.46, gr: 0.34, warm: 1.04, sx: 0.44, sy: 0.52, srx: 0.23, sry: 0.42, rib: 6, amp: 5 },
]

const ONLY = process.env.ONLY ? new Set(process.env.ONLY.split(',')) : null

// The whole render runs in the browser (full Canvas pixel control).
function pageScript(cfg, W, H) {
  return `(() => {
  const W=${W}, H=${H};
  const cfg=${JSON.stringify(cfg)};
  const c=document.getElementById('c'); c.width=W; c.height=H;
  const ctx=c.getContext('2d');

  function mono(canvas){return canvas.getContext('2d');}
  function layer(){const x=document.createElement('canvas');x.width=W;x.height=H;return x;}

  // ── base scene (pre-glass) ────────────────────────────────────────────────
  const s=layer(), sx=mono(s);
  // warm charcoal with real mid-tone range (so it reads on BOTH light + dark
  // themes, like the hero); lighter on the side away from the subject
  const lightRight = cfg.gx < 0.5;
  const g=sx.createLinearGradient(0,0,W,0);
  if(lightRight){ g.addColorStop(0,'#151311'); g.addColorStop(0.5,'#232019'); g.addColorStop(1,'#3b352c'); }
  else          { g.addColorStop(0,'#3b352c'); g.addColorStop(0.5,'#232019'); g.addColorStop(1,'#151311'); }
  sx.fillStyle=g; sx.fillRect(0,0,W,H);
  const vg0=sx.createLinearGradient(0,0,0,H);
  vg0.addColorStop(0,'rgba(0,0,0,0.28)'); vg0.addColorStop(0.5,'rgba(0,0,0,0)'); vg0.addColorStop(1,'rgba(0,0,0,0.34)');
  sx.fillStyle=vg0; sx.fillRect(0,0,W,H);

  // ── burnt-orange glow = the light source (contained pool, behind subject) ──
  const w=cfg.warm, gr=cfg.gr*W*1.15;
  const rg=sx.createRadialGradient(cfg.gx*W,cfg.gy*H,0, cfg.gx*W,cfg.gy*H,gr);
  rg.addColorStop(0.00,'rgba('+Math.round(255*w)+','+Math.round(190*w)+','+Math.round(120*w)+',0.95)');
  rg.addColorStop(0.22,'rgba(251,104,30,0.66)');
  rg.addColorStop(0.48,'rgba(216,60,14,0.32)');  // #FB460D family
  rg.addColorStop(0.78,'rgba(104,30,9,0.13)');
  rg.addColorStop(1.00,'rgba(0,0,0,0)');
  sx.globalCompositeOperation='screen';
  sx.fillStyle=rg; sx.fillRect(0,0,W,H);
  sx.globalCompositeOperation='source-over';

  // ── soft shadow mass (gives the light something to wrap around — not a hole)
  sx.save();
  sx.translate(cfg.sx*W, cfg.sy*H); sx.scale(cfg.srx*W, cfg.sry*H);
  const sg=sx.createRadialGradient(0,0,0, 0,0,1);
  sg.addColorStop(0.00,'rgba(7,7,8,0.66)'); sg.addColorStop(0.60,'rgba(7,7,8,0.5)');
  sg.addColorStop(0.86,'rgba(7,7,8,0.2)'); sg.addColorStop(1.00,'rgba(7,7,8,0)');
  sx.fillStyle=sg; sx.beginPath(); sx.arc(0,0,1,0,7); sx.fill();
  sx.restore();

  // ── faint service motif (reads as structure inside the frame) ─────────────
  drawMotif(sx, cfg.motif);

  // ── vertical striations = the reeded-glass "brushed" texture (signature) ──
  const phases=[]; for(let k=0;k<7;k++) phases.push([0.6+Math.random()*8, Math.random()*6.283, 0.5+Math.random()]);
  const streak=(px)=>{ let n=0,a=0; for(const[f,ph,w2]of phases){ n+=w2*Math.sin(px*0.0011*f+ph); a+=w2; } return n/a; };
  sx.globalCompositeOperation='overlay';
  for(let x=0;x<W;x++){ const n=streak(x), a=0.06+0.14*Math.abs(n); sx.fillStyle=(n>0?'rgba(255,246,236,':'rgba(0,0,0,')+a+')'; sx.fillRect(x,0,1,H); }
  sx.globalCompositeOperation='source-over';

  // ── vertical smear (motion-blur up/down → long streaks) ───────────────────
  const b=layer(), bx=mono(b);
  bx.filter='blur(2px)'; bx.drawImage(s,0,0); bx.filter='none';
  bx.globalAlpha=0.30;
  for(const dy of [-22,-14,-8,8,14,22]) bx.drawImage(s,0,dy);
  bx.globalAlpha=0.50; bx.drawImage(s,0,0); bx.globalAlpha=1;

  // ── reeded-glass lens warp: per-column offset within each rib ──────────────
  const period=cfg.rib, amp=cfg.amp;
  for(let x=0;x<W;x++){ const phase=(x%period)/period; let ssx=x+Math.sin(phase*6.283)*amp; if(ssx<0)ssx=0; if(ssx>W-1)ssx=W-1; ctx.drawImage(b, ssx,0,1,H, x,0,1,H); }

  // ── rib sheen ─────────────────────────────────────────────────────────────
  const rib=document.createElement('canvas'); rib.width=period; rib.height=1; const rbx=rib.getContext('2d');
  const rgd=rbx.createLinearGradient(0,0,period,0);
  rgd.addColorStop(0.00,'rgba(255,255,255,0)'); rgd.addColorStop(0.40,'rgba(255,246,236,0.10)'); rgd.addColorStop(0.62,'rgba(255,255,255,0.02)'); rgd.addColorStop(1,'rgba(0,0,0,0.14)');
  rbx.fillStyle=rgd; rbx.fillRect(0,0,period,1);
  ctx.globalCompositeOperation='soft-light'; ctx.fillStyle=ctx.createPattern(rib,'repeat'); ctx.fillRect(0,0,W,H); ctx.globalCompositeOperation='source-over';

  // ── film grain ────────────────────────────────────────────────────────────
  const gn=ctx.getImageData(0,0,W,H), d=gn.data;
  for(let i=0;i<d.length;i+=4){ const n=(Math.random()-0.5)*18; d[i]+=n; d[i+1]+=n; d[i+2]+=n; }
  ctx.putImageData(gn,0,0);

  // ── vignette ──────────────────────────────────────────────────────────────
  const vg=ctx.createRadialGradient(W/2,H*0.5,H*0.26, W/2,H*0.5,W*0.74);
  vg.addColorStop(0,'rgba(0,0,0,0)'); vg.addColorStop(1,'rgba(0,0,0,0.40)');
  ctx.fillStyle=vg; ctx.fillRect(0,0,W,H);

  // ── motif renderers (faint, warm grey; smeared into atmosphere by glass) ──
  function drawMotif(x, kind){
    x.save();
    x.strokeStyle='rgba(234,230,220,0.30)'; x.fillStyle='rgba(234,230,220,0.17)';
    x.lineWidth=3;
    if(kind==='ui'){
      // browser window + cards suggesting a dashboard/landing
      rr(x, W*0.30, H*0.16, W*0.56, H*0.66, 22, true, true);
      x.fillStyle='rgba(232,228,218,0.16)';
      for(let i=0;i<3;i++){ dot(x, W*0.33+i*34, H*0.205, 8); }         // traffic lights
      x.fillStyle='rgba(232,228,218,0.06)';
      x.fillRect(W*0.34, H*0.30, W*0.30, H*0.30);                       // hero block
      for(let i=0;i<4;i++) x.fillRect(W*0.67, H*0.30+i*H*0.09, W*0.16, H*0.055); // side cards
      x.fillStyle='rgba(232,228,218,0.12)';
      x.fillRect(W*0.34, H*0.64, W*0.20, 10); x.fillRect(W*0.34, H*0.67, W*0.30, 8);
    } else if(kind==='json'){
      x.font='700 30px ui-monospace, Menlo, monospace';
      x.fillStyle='rgba(234,230,220,0.26)';
      const lines=['{','  "id": 4212,','  "status": "ok",','  "items": [','    { "sku": "A-19", "qty": 3 },','    { "sku": "B-07", "qty": 1 }','  ],','  "ts": 1739e9','}'];
      lines.forEach((l,i)=> x.fillText(l, W*0.14, H*0.24+i*H*0.072));
      // schema box + connectors on the right
      x.strokeStyle='rgba(234,230,220,0.22)';
      rr(x, W*0.60, H*0.30, W*0.24, H*0.40, 10, false, true);
      for(let i=1;i<5;i++){ const yy=H*0.30+i*H*0.08; x.beginPath(); x.moveTo(W*0.60,yy); x.lineTo(W*0.84,yy); x.stroke(); }
      x.beginPath(); x.moveTo(W*0.50,H*0.42); x.bezierCurveTo(W*0.56,H*0.42,W*0.56,H*0.40,W*0.60,H*0.40); x.stroke();
    } else if(kind==='circuit'){
      x.strokeStyle='rgba(234,230,220,0.24)'; x.lineWidth=3;
      // orthogonal traces
      const pts=[[0.14,0.30],[0.40,0.30],[0.40,0.58],[0.70,0.58],[0.20,0.72],[0.62,0.72],[0.62,0.34],[0.86,0.34]];
      for(let i=0;i<pts.length-1;i++){ x.beginPath(); x.moveTo(pts[i][0]*W,pts[i][1]*H); x.lineTo(pts[i+1][0]*W,pts[i][1]*H); x.lineTo(pts[i+1][0]*W,pts[i+1][1]*H); x.stroke(); }
      // chip + pins
      rr(x, W*0.44, H*0.40, W*0.16, H*0.18, 6, false, true);
      x.fillStyle='rgba(232,228,218,0.12)';
      for(let i=0;i<6;i++){ x.fillRect(W*0.44-14, H*0.42+i*18, 12, 8); x.fillRect(W*0.60+2, H*0.42+i*18, 12, 8); }
      // nodes; one glows orange (the live pin)
      x.fillStyle='rgba(232,228,218,0.18)';
      for(const p of pts) dot(x, p[0]*W, p[1]*H, 9);
      const glow=x.createRadialGradient(W*0.70,H*0.58,0, W*0.70,H*0.58,120);
      glow.addColorStop(0,'rgba(251,70,13,0.9)'); glow.addColorStop(1,'rgba(251,70,13,0)');
      x.fillStyle=glow; x.beginPath(); x.arc(W*0.70,H*0.58,120,0,7); x.fill();
    } else if(kind==='ai'){
      x.font='600 28px ui-monospace, Menlo, monospace';
      x.fillStyle='rgba(234,230,220,0.26)';
      const code=['function ship(idea) {','  const plan = model.plan(idea)','  return plan.steps.map(build)','}','','ship("service images")'];
      code.forEach((l,i)=> x.fillText(l, W*0.16, H*0.26+i*H*0.078));
      // ghost "AI suggestion" line with an orange glow behind it
      const yy=H*0.26+2*H*0.078;
      const gl=x.createLinearGradient(W*0.14,yy, W*0.70,yy);
      gl.addColorStop(0,'rgba(251,70,13,0.0)'); gl.addColorStop(0.5,'rgba(251,70,13,0.45)'); gl.addColorStop(1,'rgba(251,70,13,0.0)');
      x.fillStyle=gl; x.fillRect(W*0.15, yy-40, W*0.52, 56);
      x.fillStyle='rgba(255,196,150,0.5)'; x.fillText('  return plan.steps.map(build)', W*0.16, yy);
      // caret
      x.fillStyle='rgba(255,196,150,0.6)'; x.fillRect(W*0.16+560, yy-30, 6, 34);
    }
    x.restore();
  }
  function rr(x,px,py,w,h,r,fill,stroke){ x.beginPath(); x.moveTo(px+r,py); x.arcTo(px+w,py,px+w,py+h,r); x.arcTo(px+w,py+h,px,py+h,r); x.arcTo(px,py+h,px,py,r); x.arcTo(px,py,px+w,py,r); x.closePath(); if(fill)x.fill(); if(stroke)x.stroke(); }
  function dot(x,cx,cy,r){ x.beginPath(); x.arc(cx,cy,r,0,7); x.fill(); }

  return c.toDataURL('image/png');
  })()`
}

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })

for (const cfg of IMAGES) {
  if (ONLY && !ONLY.has(cfg.file)) continue
  await page.setContent('<!doctype html><meta charset=utf8><body style="margin:0"><canvas id="c"></canvas></body>')
  const dataUrl = await page.evaluate(pageScript(cfg, W, H))
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64')
  const outFile = path.join(OUT, `${cfg.file}.jpg`)
  await sharp(buf)
    .resize(2000, 1250, { fit: 'cover' })
    .modulate({ brightness: 1.08, saturation: 1.08 })
    .linear(1.06, -6)              // gentle S-contrast so the glow + motif read
    .sharpen({ sigma: 0.6 })
    .jpeg({ quality: 86, mozjpeg: true })
    .toFile(outFile)
  console.log('→', outFile)
}

await browser.close()
console.log('service images done →', OUT)
