/*
 * 黑板诗笺 · Canvas 渲染引擎
 * 纯前端、零依赖。所有字形与纹理均在本机绘制。
 */
(function (global) {
  'use strict';

  const FONT_FAMILY = '"MaShanZheng","Kaiti SC","STKaiti","KaiTi","Noto Serif SC",serif';
  const ASPECTS = { '3:2': 3 / 2, '4:3': 4 / 3, '1:1': 1 };
  const BASE_W = 1800;
  const BASE_H = 1200;

  const BOARD_COLORS = {
    green: ['#2c4a3f', '#1d3730', '#132720'],
    blue: ['#2b3e4e', '#1c2b38', '#111c25'],
    black: ['#282c29', '#1b1f1d', '#0f1211']
  };
  const WOOD_COLORS = {
    walnut: ['#7f5435', '#5b3921', '#35200f'],
    oak: ['#ad7d52', '#855b37', '#56381f'],
    ebony: ['#624734', '#422d20', '#241710']
  };
  const CHALK_COLORS = {
    warm: '#f3efe2',
    white: '#ffffff',
    cream: '#f8efd4'
  };
  const ACCENT_COLORS = {
    yellow: '#f1c96d',
    pink: '#eda9a2',
    cyan: '#9ed4c7'
  };

  let noiseCanvas = null;
  let fontPromise = null;

  /* ---------- 小工具 ---------- */

  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
  }

  function roundRect(ctx, x, y, w, h, r, skipBegin) {
    const rr = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    if (!skipBegin) ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function ensureFont() {
    if (!fontPromise) {
      const load = () => document.fonts.load('80px "MaShanZheng"');
      fontPromise = Promise.race([
        (document.fonts ? load().then(() => document.fonts.ready) : Promise.resolve()),
        new Promise((resolve) => setTimeout(resolve, 7000))
      ]).catch(() => {});
    }
    return fontPromise;
  }

  function getNoiseCanvas() {
    if (noiseCanvas) return noiseCanvas;
    const size = 512;
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    const img = ctx.createImageData(size, size);
    const rand = mulberry32(20241124);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = rand();
      img.data[i] = 0;
      img.data[i + 1] = 0;
      img.data[i + 2] = 0;
      // 约 48% 的透明小孔，其余是不同深浅的颗粒
      img.data[i + 3] = v < 0.48 ? 0 : Math.floor(((v - 0.48) / 0.52) * 235);
    }
    ctx.putImageData(img, 0, 0);
    noiseCanvas = c;
    return c;
  }

  /* ---------- 文本解析与排版 ---------- */

  function parseRich(line) {
    const chars = [];
    let accent = false;
    const raw = String(line == null ? '' : line);
    for (let i = 0; i < raw.length; i++) {
      if (raw[i] === '*' && raw[i + 1] === '*') {
        accent = !accent;
        i++;
        continue;
      }
      chars.push({ ch: raw[i], accent });
    }
    return chars;
  }

  function setFont(ctx, size) {
    ctx.font = '400 ' + size + 'px ' + FONT_FAMILY;
  }

  function measureChars(ctx, chars, size, letterSpacing) {
    setFont(ctx, size);
    let w = 0;
    for (const c of chars) w += ctx.measureText(c.ch).width + letterSpacing;
    return w;
  }

  const NO_START = '，。！？、；：,.!?;:）)》」』】”’…—～·';
  const NO_END = '（(《「『【“‘';

  const CLAUSE_END = '，。！？；：、,.!?;:';

  function splitClauses(chars) {
    const out = [];
    let cur = [];
    for (const c of chars) {
      cur.push(c);
      if (CLAUSE_END.indexOf(c.ch) !== -1) {
        out.push(cur);
        cur = [];
      }
    }
    if (cur.length) out.push(cur);
    return out;
  }

  function measureToken(ctx, chars, size, ls) {
    setFont(ctx, size);
    let w = 0;
    for (const c of chars) w += ctx.measureText(c.ch).width + ls;
    return w;
  }

  function wrapChars(chars, maxWidth, size, ctx) {
    const ls = size * 0.006;
    const clauses = splitClauses(chars);
    const lines = [];
    let current = [];
    let width = 0;

    const flush = () => {
      if (current.length) {
        lines.push({ chars: current, width: width });
        current = [];
        width = 0;
      }
    };

    const charWrap = (clause) => {
      let seg = [];
      let segW = 0;
      setFont(ctx, size);
      for (const c of clause) {
        const cw = ctx.measureText(c.ch).width + ls;
        if (seg.length && segW + cw > maxWidth && NO_START.indexOf(c.ch) === -1) {
          lines.push({ chars: seg, width: segW });
          seg = [];
          segW = 0;
        }
        seg.push(c);
        segW += cw;
      }
      if (seg.length) lines.push({ chars: seg, width: segW });
    };

    for (const clause of clauses) {
      const cw = measureToken(ctx, clause, size, ls);
      if (cw > maxWidth) {
        flush();
        charWrap(clause);
        continue;
      }
      if (current.length && width + cw > maxWidth) flush();
      for (const c of clause) current.push(c);
      width += cw;
    }
    flush();

    return lines.length ? lines : [{ chars: [], width: 0 }];
  }

  const CN_DIGITS = '〇一二三四五六七八九';
  function cnNumber(n) {
    if (n <= 10) return n === 10 ? '十' : CN_DIGITS[n];
    if (n < 20) return '十' + CN_DIGITS[n - 10];
    if (n === 20) return '二十';
    if (n < 30) return '二十' + CN_DIGITS[n - 20];
    if (n === 30) return '三十';
    return '三十' + CN_DIGITS[n - 30];
  }

  function chineseDate(d) {
    const year = String(d.getFullYear())
      .split('')
      .map((x) => CN_DIGITS[Number(x)])
      .join('');
    return year + '年' + cnNumber(d.getMonth() + 1) + '月' + cnNumber(d.getDate()) + '日';
  }

  function parseBody(state) {
    const raw = String(state.body || '').replace(/\r/g, '').split('\n');
    while (raw.length > 1 && !raw[raw.length - 1].trim()) raw.pop();
    return raw;
  }

  /* ---------- 版式计算 ---------- */

  function computeLayout(ctx, state, W, H) {
    const minSide = Math.min(W, H);
    const u = Math.min(W / BASE_W, H / BASE_H);
    const outer = minSide * 0.027;
    const frame = minSide * 0.053;
    const bx = outer + frame;
    const by = outer + frame;
    const bw = W - 2 * bx;
    const bh = H - 2 * by;
    const pad = minSide * 0.076;
    const content = { x: bx + pad, y: by + pad, w: bw - 2 * pad, h: bh - 2 * pad };
    content.right = content.x + content.w;
    content.bottom = content.y + content.h;

    const trayH = minSide * 0.033;
    const footerBase = by + bh - trayH - minSide * 0.035;
    const sealSize = Math.round(104 * u);

    const titleChars = parseRich((state.title || '').trim());
    let titleSize = 100 * u;
    const artVisible = state.illustration && state.illustration !== 'none' && !(state.align === 'left' && state.illustration !== 'moon');
    const titleMaxW = content.w * (artVisible ? 0.72 : 0.88);
    if (titleChars.length) {
      while (titleSize > 40 * u && measureChars(ctx, titleChars, titleSize, titleSize * 0.06) > titleMaxW) {
        titleSize -= 2;
      }
    }
    const titleBase = content.y + titleSize * 0.86;
    const underlineY = titleBase + titleSize * 0.27;

    const authorChars = parseRich((state.author || '').trim());
    const authorSize = 33 * u;
    const authorBase = titleChars.length ? underlineY + 42 * u : content.y + authorSize;

    const bodyTop = authorChars.length ? authorBase + 56 * u : content.y + 76 * u;
    const bodyBottom = footerBase - (state.seal ? sealSize + 18 * u : 58 * u);
    const bodyH = Math.max(bodyBottom - bodyTop, 80 * u);

    const raw = parseBody(state);
    let chosen = null;
    for (let size = 114 * u; size >= 22; size -= 2) {
      const wrapped = [];
      let maxW = 0;
      for (const line of raw) {
        if (!line.trim()) {
          wrapped.push({ blank: true, chars: [], width: 0 });
          continue;
        }
        const parts = wrapChars(parseRich(line), content.w, size, ctx);
        for (const p of parts) {
          wrapped.push(p);
          maxW = Math.max(maxW, p.width);
        }
      }
      if (maxW > content.w + 1) continue;

      let units = 0;
      for (const l of wrapped) units += l.blank ? 0.42 : 1;
      // 行距以设置为上限，空间不够时自动收紧，但不紧于滑杆下限 1.55
      const ratio = Math.min(state.lineHeight, units ? bodyH / (size * units) : state.lineHeight);
      if (ratio < 1.55) continue;
      const lh = size * ratio;
      chosen = { size, wrapped, lh, total: lh * units, maxW };
      break;
    }
    if (!chosen) {
      const size = 21;
      const lh = size * Math.min(state.lineHeight, 1.5);
      const wrapped = [];
      let maxW = 0;
      for (const line of raw) {
        if (!line.trim()) {
          wrapped.push({ blank: true, chars: [], width: 0 });
          continue;
        }
        const parts = wrapChars(parseRich(line), content.w, size, ctx);
        for (const p of parts) {
          wrapped.push(p);
          maxW = Math.max(maxW, p.width);
        }
      }
      let total = 0;
      for (const l of wrapped) total += l.blank ? lh * 0.42 : lh;
      chosen = { size, wrapped, lh, total, maxW, overflow: total > bodyH };
    }

    const gap = Math.max((bodyH - chosen.total) / 2, 0);
    const tallFactor = H / W;
    const maxGap = (tallFactor > 1.15 ? 250 : 130) * u;
    let blockTop = bodyTop + Math.min(gap, maxGap);

    // 让标题、作者、诗句作为一个整体在黑板中更居中
    const groupTop = titleChars.length
      ? titleBase - titleSize * 0.9
      : authorChars.length
        ? authorBase - authorSize
        : bodyTop;
    const groupBottom = blockTop + chosen.total;
    const availableCenter = (content.y + footerBase - 42 * u) / 2;
    let vShift = availableCenter - (groupTop + groupBottom) / 2;
    vShift = Math.max(-8 * u, Math.min(vShift, 220 * u));
    vShift = Math.min(vShift, footerBase - 36 * u - (blockTop + chosen.total));
    vShift = Math.max(vShift, -8 * u);

    return {
      W, H, u, minSide, outer, frame, bx, by, bw, bh, pad, content, trayH,
      footerBase, sealSize,
      titleChars, titleSize, titleBase: titleBase + vShift, underlineY: underlineY + vShift,
      authorChars, authorSize, authorBase: authorBase + vShift,
      bodyTop: bodyTop + vShift, bodyBottom, bodyH, vShift,
      bodySize: chosen.size,
      lines: chosen.wrapped,
      lineHeight: chosen.lh,
      bodyTotal: chosen.total,
      blockTop: blockTop + vShift,
      overflow: !!chosen.overflow,
      dateText: chineseDate(new Date())
    };
  }

  /* ---------- 背景、木框、黑板 ---------- */

  function drawWall(ctx, W, H, rand) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#474238');
    g.addColorStop(0.48, '#37342d');
    g.addColorStop(1, '#25241f');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    const light = ctx.createRadialGradient(W * 0.5, H * 0.34, 0, W * 0.5, H * 0.34, Math.max(W, H) * 0.75);
    light.addColorStop(0, 'rgba(255,244,220,0.075)');
    light.addColorStop(0.5, 'rgba(255,244,220,0.025)');
    light.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = light;
    ctx.fillRect(0, 0, W, H);

    // 墙面细颗粒
    const n = ctx.createPattern(getNoiseCanvas(), 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = n;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();

    // 墙上的淡淡光斑
    for (let i = 0; i < 14; i++) {
      const x = rand() * W;
      const y = rand() * H;
      const r = (0.04 + rand() * 0.12) * Math.min(W, H);
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,240,210,' + (0.012 + rand() * 0.02).toFixed(3) + ')');
      rg.addColorStop(1, 'rgba(255,240,210,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    const vig = ctx.createRadialGradient(W * 0.5, H * 0.46, Math.min(W, H) * 0.25, W * 0.5, H * 0.46, Math.max(W, H) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.72, 'rgba(0,0,0,0.12)');
    vig.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);
  }

  function drawWoodFrame(ctx, L, state, rand) {
    const { W, H, outer, frame, bx, by, bw, bh, minSide } = L;
    const wood = WOOD_COLORS[state.wood] || WOOD_COLORS.walnut;
    const radius = minSide * 0.016;
    const innerRadius = minSide * 0.009;

    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.62)';
    ctx.shadowBlur = minSide * 0.055;
    ctx.shadowOffsetY = minSide * 0.022;
    roundRect(ctx, outer, outer, W - 2 * outer, H - 2 * outer, radius);
    ctx.fillStyle = wood[2];
    ctx.fill();
    ctx.restore();

    // 外框底色
    const base = ctx.createLinearGradient(outer, outer, W - outer, H - outer);
    base.addColorStop(0, wood[0]);
    base.addColorStop(0.24, wood[1]);
    base.addColorStop(0.52, wood[0]);
    base.addColorStop(0.8, wood[1]);
    base.addColorStop(1, wood[2]);
    roundRect(ctx, outer, outer, W - 2 * outer, H - 2 * outer, radius);
    ctx.fillStyle = base;
    ctx.fill();

    // 仅木框区域绘制木纹
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, outer, outer, W - 2 * outer, H - 2 * outer, radius, true);
    roundRect(ctx, bx, by, bw, bh, innerRadius, true);
    ctx.clip('evenodd');

    const topRail = { x: outer, y: outer, w: W - 2 * outer, h: frame };
    const bottomRail = { x: outer, y: H - outer - frame, w: W - 2 * outer, h: frame };
    const leftRail = { x: outer, y: outer, w: frame, h: H - 2 * outer };
    const rightRail = { x: W - outer - frame, y: outer, w: frame, h: H - 2 * outer };

    function grain(rect, vertical) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(rect.x, rect.y, rect.w, rect.h);
      ctx.clip();
      const thickness = vertical ? rect.w : rect.h;
      const lines = Math.max(9, Math.round(thickness / (minSide * 0.0036)));
      for (let i = 0; i < lines; i++) {
        const p = (i + 0.12 + rand() * 0.76) / lines;
        const strong = i % 4 === 0;
        const alpha = 0.04 + rand() * (strong ? 0.19 : 0.12);
        ctx.beginPath();
        if (vertical) {
          const x0 = rect.x + p * rect.w;
          for (let y = rect.y - 4; y <= rect.y + rect.h + 4; y += 26) {
            const x = x0 + Math.sin(y * 0.007 + i * 1.3) * minSide * 0.007 + (rand() - 0.5) * 1.4;
            if (y <= rect.y - 4) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        } else {
          const y0 = rect.y + p * rect.h;
          for (let x = rect.x - 4; x <= rect.x + rect.w + 4; x += 30) {
            const y = y0 + Math.sin(x * 0.006 + i * 1.7) * minSide * 0.006 + (rand() - 0.5) * 1.4;
            if (x <= rect.x - 4) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
        }
        const light = strong && rand() < 0.55;
        ctx.strokeStyle = light
          ? 'rgba(255,224,180,' + (alpha * 0.75).toFixed(3) + ')'
          : 'rgba(30,14,4,' + alpha.toFixed(3) + ')';
        ctx.lineWidth = strong ? 1.4 + rand() * 1.8 : 0.55 + rand() * 1.1;
        ctx.stroke();
      }
      ctx.restore();
    }

    grain(topRail, false);
    grain(bottomRail, false);
    grain(leftRail, true);
    grain(rightRail, true);

    // 上下左右受光不同，木框更立体
    let rg = ctx.createLinearGradient(0, outer, 0, outer + frame);
    rg.addColorStop(0, 'rgba(255,226,184,0.14)');
    rg.addColorStop(0.45, 'rgba(255,226,184,0.02)');
    rg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = rg;
    ctx.fillRect(topRail.x, topRail.y, topRail.w, topRail.h);
    rg = ctx.createLinearGradient(0, H - outer - frame, 0, H - outer);
    rg.addColorStop(0, 'rgba(0,0,0,0.22)');
    rg.addColorStop(0.55, 'rgba(0,0,0,0.04)');
    rg.addColorStop(1, 'rgba(0,0,0,0.34)');
    ctx.fillStyle = rg;
    ctx.fillRect(bottomRail.x, bottomRail.y, bottomRail.w, bottomRail.h);
    rg = ctx.createLinearGradient(outer, 0, outer + frame, 0);
    rg.addColorStop(0, 'rgba(255,226,184,0.09)');
    rg.addColorStop(0.5, 'rgba(0,0,0,0.02)');
    rg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = rg;
    ctx.fillRect(leftRail.x, leftRail.y, leftRail.w, leftRail.h);
    rg = ctx.createLinearGradient(W - outer - frame, 0, W - outer, 0);
    rg.addColorStop(0, 'rgba(0,0,0,0.16)');
    rg.addColorStop(0.55, 'rgba(0,0,0,0.02)');
    rg.addColorStop(1, 'rgba(255,226,184,0.08)');
    ctx.fillStyle = rg;
    ctx.fillRect(rightRail.x, rightRail.y, rightRail.w, rightRail.h);

    // 木结
    for (let k = 0; k < 3; k++) {
      const onVertical = k % 2 === 0;
      const x = onVertical ? (k === 0 ? rightRail.x + rightRail.w * 0.45 : leftRail.x + leftRail.w * 0.55) : outer + frame + rand() * (W - 2 * outer - 2 * frame);
      const y = onVertical ? outer + frame + rand() * (H - 2 * outer - 2 * frame) : outer + frame * (0.3 + rand() * 0.4);
      const r = minSide * (0.009 + rand() * 0.01);
      const kg = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
      kg.addColorStop(0, 'rgba(35,18,7,0.35)');
      kg.addColorStop(0.45, 'rgba(60,32,14,0.16)');
      kg.addColorStop(1, 'rgba(60,32,14,0)');
      ctx.fillStyle = kg;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 1.8, r, rand() * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(35,18,7,0.18)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(x, y, r * 0.7, r * 0.35, 0.2, 0, Math.PI * 2);
      ctx.stroke();
    }

    // 45° 拼角
    ctx.strokeStyle = 'rgba(24,11,3,0.5)';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(outer, outer);
    ctx.lineTo(bx, by);
    ctx.moveTo(W - outer, outer);
    ctx.lineTo(W - bx, by);
    ctx.moveTo(outer, H - outer);
    ctx.lineTo(bx, H - by);
    ctx.moveTo(W - outer, H - outer);
    ctx.lineTo(W - bx, H - by);
    ctx.stroke();
    ctx.restore();

    // 木框内外高光/阴影
    ctx.save();
    roundRect(ctx, outer + 1, outer + 1, W - 2 * outer - 2, H - 2 * outer - 2, radius);
    ctx.strokeStyle = 'rgba(255,231,196,0.22)';
    ctx.lineWidth = 2;
    ctx.stroke();
    roundRect(ctx, bx + 1, by + 1, bw - 2, bh - 2, innerRadius);
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
  }

  function drawBoard(ctx, L, state, rand) {
    const { bx, by, bw, bh, minSide, u } = L;
    const colors = BOARD_COLORS[state.board] || BOARD_COLORS.green;
    const radius = minSide * 0.007;

    ctx.save();
    roundRect(ctx, bx, by, bw, bh, radius);
    ctx.clip();

    const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh);
    g.addColorStop(0, colors[0]);
    g.addColorStop(0.45, colors[1]);
    g.addColorStop(1, colors[2]);
    ctx.fillStyle = g;
    ctx.fillRect(bx, by, bw, bh);

    // 黑板中央的淡淡反光
    const glow = ctx.createRadialGradient(bx + bw * 0.46, by + bh * 0.3, 0, bx + bw * 0.46, by + bh * 0.3, bw * 0.62);
    glow.addColorStop(0, 'rgba(255,255,255,0.035)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(bx, by, bw, bh);

    // 擦痕与粉笔灰
    for (let i = 0; i < 46; i++) {
      const x = bx + rand() * bw;
      const y = by + rand() * bh;
      const r = (0.05 + rand() * 0.16) * minSide;
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, 'rgba(255,255,255,' + (0.004 + rand() * 0.012).toFixed(4) + ')');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }

    ctx.save();
    ctx.translate(bx + bw * 0.5, by + bh * 0.5);
    ctx.rotate(-0.22);
    for (let i = 0; i < 3; i++) {
      const y = (i - 1) * bh * 0.23 + (rand() - 0.5) * bh * 0.1;
      const w = bw * (0.9 + rand() * 0.3);
      const h = minSide * (0.07 + rand() * 0.07);
      const sg = ctx.createLinearGradient(0, y - h, 0, y + h);
      sg.addColorStop(0, 'rgba(255,255,255,0)');
      sg.addColorStop(0.5, 'rgba(255,255,255,0.022)');
      sg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sg;
      ctx.fillRect(-w / 2, y - h, w, h * 2);
    }
    ctx.restore();

    // 细小划痕
    for (let i = 0; i < 26; i++) {
      const x = bx + rand() * bw;
      const y = by + rand() * bh;
      const len = (0.012 + rand() * 0.08) * minSide;
      const a = rand() * Math.PI;
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.012 + rand() * 0.028).toFixed(3) + ')';
      ctx.lineWidth = 0.5 + rand();
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }

    // 颗粒
    ctx.save();
    const n = ctx.createPattern(getNoiseCanvas(), 'repeat');
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = n;
    ctx.fillRect(bx, by, bw, bh);
    ctx.restore();

    // 边缘暗角
    const vig = ctx.createRadialGradient(bx + bw * 0.5, by + bh * 0.46, minSide * 0.25, bx + bw * 0.5, by + bh * 0.46, Math.max(bw, bh) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(0.75, 'rgba(0,0,0,0.1)');
    vig.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vig;
    ctx.fillRect(bx, by, bw, bh);

    // 内框投影
    const shade = minSide * 0.035;
    let eg = ctx.createLinearGradient(0, by, 0, by + shade);
    eg.addColorStop(0, 'rgba(0,0,0,0.55)');
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg;
    ctx.fillRect(bx, by, bw, shade);
    eg = ctx.createLinearGradient(0, by + bh, 0, by + bh - shade);
    eg.addColorStop(0, 'rgba(0,0,0,0.5)');
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg;
    ctx.fillRect(bx, by + bh - shade, bw, shade);
    eg = ctx.createLinearGradient(bx, 0, bx + shade, 0);
    eg.addColorStop(0, 'rgba(0,0,0,0.45)');
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg;
    ctx.fillRect(bx, by, shade, bh);
    eg = ctx.createLinearGradient(bx + bw, 0, bx + bw - shade, 0);
    eg.addColorStop(0, 'rgba(0,0,0,0.45)');
    eg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eg;
    ctx.fillRect(bx + bw - shade, by, shade, bh);

    ctx.restore();
  }

  function drawTrayAndProps(ctx, L, state, rand) {
    const { bx, by, bw, bh, minSide, trayH } = L;
    const wood = WOOD_COLORS[state.wood] || WOOD_COLORS.walnut;
    const trayY = by + bh - trayH;
    const trayX = bx + minSide * 0.014;
    const trayW = bw - minSide * 0.028;
    const faceH = trayH * 0.78;

    // 黑板下沿的投影
    ctx.save();
    let sh = ctx.createLinearGradient(0, trayY - minSide * 0.022, 0, trayY);
    sh.addColorStop(0, 'rgba(0,0,0,0)');
    sh.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = sh;
    ctx.fillRect(bx, trayY - minSide * 0.022, bw, minSide * 0.022);
    ctx.restore();

    // 木质粉笔槽：台面 + 前脸
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = minSide * 0.016;
    ctx.shadowOffsetY = minSide * 0.006;
    roundRect(ctx, trayX, trayY, trayW, faceH, faceH * 0.16);
    let tg = ctx.createLinearGradient(0, trayY, 0, trayY + faceH);
    tg.addColorStop(0, wood[0]);
    tg.addColorStop(0.2, wood[1]);
    tg.addColorStop(1, wood[2]);
    ctx.fillStyle = tg;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // 台面高光
    roundRect(ctx, trayX + 3, trayY + 2, trayW - 6, faceH * 0.28, faceH * 0.1);
    tg = ctx.createLinearGradient(0, trayY, 0, trayY + faceH * 0.3);
    tg.addColorStop(0, 'rgba(255,232,194,0.32)');
    tg.addColorStop(1, 'rgba(255,232,194,0)');
    ctx.fillStyle = tg;
    ctx.fill();

    // 木纹
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      const y = trayY + 3 + (i / 7) * faceH * 0.8 + (rand() - 0.5) * 2;
      for (let x = trayX + 8; x < trayX + trayW - 8; x += 36) {
        const yy = y + Math.sin(x * 0.007 + i) * 1.2;
        if (x === trayX + 8) ctx.moveTo(x, yy);
        else ctx.lineTo(x, yy);
      }
      ctx.strokeStyle = 'rgba(32,15,5,' + (0.06 + rand() * 0.1).toFixed(3) + ')';
      ctx.lineWidth = 0.7 + rand() * 1.1;
      ctx.stroke();
    }
    ctx.restore();

    if (!state.props) return;

    // 板擦：木质握把 + 深色毛毡
    const erW = minSide * 0.082;
    const erH = trayH * 0.78;
    const ex = trayX + minSide * 0.028;
    const ey = trayY - erH + 1;
    ctx.save();
    ctx.translate(ex + erW / 2, ey + erH / 2);
    ctx.rotate(-0.03);
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = minSide * 0.012;
    ctx.shadowOffsetY = minSide * 0.005;
    roundRect(ctx, -erW / 2, -erH / 2, erW, erH, erH * 0.18);
    const eg = ctx.createLinearGradient(0, -erH / 2, 0, erH / 2);
    eg.addColorStop(0, '#8b5b39');
    eg.addColorStop(0.42, '#5f3b24');
    eg.addColorStop(0.43, '#2e332e');
    eg.addColorStop(1, '#171d19');
    ctx.fillStyle = eg;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    // 木柄高光与毛毡粉笔灰
    ctx.fillStyle = 'rgba(255,225,185,0.2)';
    roundRect(ctx, -erW / 2 + 3, -erH / 2 + 2, erW - 6, erH * 0.14, erH * 0.07);
    ctx.fill();
    ctx.fillStyle = 'rgba(240,235,220,0.13)';
    for (let i = 0; i < 14; i++) {
      ctx.fillRect(-erW / 2 + 4 + rand() * (erW - 8), -erH * 0.02 + rand() * erH * 0.42, 1 + rand() * 2, 0.8);
    }
    ctx.restore();

    // 粉笔：三截，长短不一
    const chalkColors = ['#f2ecdc', '#f0d18a', '#e9aaa2'];
    for (let i = 0; i < 3; i++) {
      const len = minSide * (0.06 + rand() * 0.026);
      const th = minSide * 0.015;
      const cx = trayX + trayW - minSide * (0.034 + i * 0.048) - len / 2;
      const cy = trayY - th * 0.75;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((rand() - 0.5) * 0.09);
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = minSide * 0.008;
      ctx.shadowOffsetY = 2;
      roundRect(ctx, -len / 2, -th / 2, len, th, th * 0.4);
      ctx.fillStyle = chalkColors[i];
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      roundRect(ctx, -len / 2 + 2, -th / 2 + 1, len - 5, th * 0.22, th * 0.1);
      ctx.fill();
      // 断口
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath();
      ctx.moveTo(-len / 2 + 1, -th / 2);
      ctx.lineTo(-len / 2 + th * 0.5, 0);
      ctx.lineTo(-len / 2 + 1, th / 2);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // 槽里的粉笔灰
    ctx.save();
    ctx.fillStyle = 'rgba(244,239,225,0.18)';
    for (let i = 0; i < 26; i++) {
      const x = trayX + trayW * (0.52 + rand() * 0.42);
      ctx.beginPath();
      ctx.arc(x, trayY - 1 - rand() * 3, 0.5 + rand() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 装饰 ---------- */

  function drawIllustration(ctx, L, state, rand) {
    const kind = state.illustration;
    if (!kind || kind === 'none') return;
    if (state.align === 'left' && kind !== 'moon') return;
    const { content, minSide } = L;
    const color = CHALK_COLORS[state.chalk] || CHALK_COLORS.warm;
    ctx.save();

    if (kind === 'moon') {
      const r = minSide * 0.052;
      const cx = content.right - r - minSide * 0.02;
      const cy = content.y + r + minSide * 0.03;

      // 月晕
      const halo = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 2.1);
      halo.addColorStop(0, 'rgba(255,248,225,0.075)');
      halo.addColorStop(0.45, 'rgba(255,248,225,0.03)');
      halo.addColorStop(1, 'rgba(255,248,225,0)');
      ctx.fillStyle = halo;
      ctx.fillRect(cx - r * 2.1, cy - r * 2.1, r * 4.2, r * 4.2);

      ctx.globalAlpha = 0.58;
      ctx.strokeStyle = color;
      for (let i = 0; i < 2; i++) {
        ctx.lineWidth = 2.4 + rand() * 1.1;
        ctx.beginPath();
        ctx.arc(cx + (rand() - 0.5) * 2.4, cy + (rand() - 0.5) * 2.4, r, 0.1 + rand() * 0.12, Math.PI * 2 - rand() * 0.08);
        ctx.stroke();
      }
      ctx.globalAlpha = 0.26;
      ctx.lineWidth = 1.3;
      const craters = [[-0.3, -0.24, 0.12], [0.2, 0.08, 0.09], [0.02, 0.38, 0.06]];
      for (const c of craters) {
        ctx.beginPath();
        ctx.arc(cx + c[0] * r, cy + c[1] * r, c[2] * r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 月边的小星
      ctx.globalAlpha = 0.4;
      ctx.lineWidth = 1.8;
      for (let i = 0; i < 3; i++) {
        const x = cx - r * (1.6 + rand() * 1.2);
        const y = cy - r * (0.5 + rand() * 0.9);
        ctx.beginPath();
        ctx.moveTo(x - 4, y);
        ctx.lineTo(x + 4, y);
        ctx.moveTo(x, y - 4);
        ctx.lineTo(x, y + 4);
        ctx.stroke();
      }
    }

    if (kind === 'bamboo') {
      ctx.globalAlpha = 0.17;
      ctx.strokeStyle = color;
      const top = content.y + minSide * 0.018;
      const bottom = Math.max(top + minSide * 0.12, L.bodyTop - minSide * 0.022);
      const x0 = content.x + minSide * 0.038;
      for (let s = 0; s < 2; s++) {
        const x = x0 + s * minSide * 0.032;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(x, top);
        ctx.bezierCurveTo(x - 7, top + (bottom - top) * 0.35, x + 9, top + (bottom - top) * 0.7, x - 2, bottom);
        ctx.stroke();
        for (let i = 0; i < 3; i++) {
          ctx.lineWidth = 1.1;
          const yy = top + (bottom - top) * (0.2 + i * 0.28);
          ctx.beginPath();
          ctx.moveTo(x + (i % 2 ? 1 : -1) * 2, yy);
          ctx.lineTo(x + (i % 2 ? 1 : -1) * minSide * 0.042, yy - minSide * 0.022);
          ctx.stroke();
        }
      }
      // 竹叶
      for (let i = 0; i < 10; i++) {
        const bx = x0 + (rand() - 0.3) * minSide * 0.13;
        const by = top + rand() * (bottom - top) * 0.7;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate((rand() - 0.5) * 1.9);
        ctx.beginPath();
        ctx.ellipse(0, 0, minSide * 0.024, minSide * 0.0055, 0, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.1 + rand() * 0.07;
        ctx.fill();
        ctx.restore();
      }
    }

    if (kind === 'plum') {
      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = color;
      const top = content.y + minSide * 0.012;
      const bottom = Math.max(top + minSide * 0.08, L.bodyTop - minSide * 0.03);
      const sx = content.x + minSide * 0.018;
      const ex = content.x + minSide * 0.255;
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(sx, bottom);
      ctx.bezierCurveTo(sx + minSide * 0.09, bottom - minSide * 0.02, ex - minSide * 0.07, top + minSide * 0.035, ex, top + minSide * 0.012);
      ctx.stroke();
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sx + minSide * 0.13, bottom - minSide * 0.045);
      ctx.lineTo(sx + minSide * 0.18, bottom - minSide * 0.095);
      ctx.stroke();

      for (let i = 0; i < 7; i++) {
        const t = 0.14 + i * 0.12;
        const px = sx + (ex - sx) * t + (rand() - 0.5) * minSide * 0.018;
        const py = bottom - (bottom - top) * t + (rand() - 0.5) * minSide * 0.025;
        ctx.globalAlpha = 0.2 + rand() * 0.18;
        ctx.fillStyle = color;
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(px + Math.cos(a) * minSide * 0.0075, py + Math.sin(a) * minSide * 0.0075, minSide * 0.007, minSide * 0.004, a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(px, py, minSide * 0.0016, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }

  /* ---------- 粉笔字 ---------- */

  function drawChalkChars(ctx, chars, anchorX, baseline, size, opts) {
    if (!chars.length) return;
    const o = opts || {};
    const ls = o.letterSpacing != null ? o.letterSpacing : size * 0.008;
    const color = o.color || CHALK_COLORS.warm;
    const accentColor = o.accentColor || ACCENT_COLORS.yellow;
    const alpha = o.alpha == null ? 1 : o.alpha;
    const align = o.align || 'center';
    const rand = o.rand || Math.random;

    setFont(ctx, size);
    const widths = chars.map((c) => ctx.measureText(c.ch).width);
    let total = 0;
    for (const w of widths) total += w + ls;
    total -= ls;

    let start = 0;
    if (align === 'center') start = -total / 2;
    else if (align === 'right') start = -total;

    const accentRuns = [];
    let run = null;
    let cursor = start;
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const w = widths[i];
      if (c.accent) {
        if (!run) run = { x0: cursor, x1: cursor + w };
        else run.x1 = cursor + w;
      } else if (run) {
        accentRuns.push(run);
        run = null;
      }
      cursor += w + ls;
    }
    if (run) accentRuns.push(run);

    ctx.save();
    ctx.translate(anchorX, baseline);
    if (o.rotate) ctx.rotate(o.rotate);
    const jitter = o.jitter == null ? size * 0.018 : o.jitter;
    const charAlpha = o.charAlpha == null ? 0.09 : o.charAlpha;

    cursor = start;
    for (let i = 0; i < chars.length; i++) {
      const c = chars[i];
      const w = widths[i];
      if (c.ch.trim()) {
        ctx.save();
        ctx.translate(cursor + w / 2 + (rand() - 0.5) * jitter, (rand() - 0.5) * jitter * 0.8);
        ctx.rotate((rand() - 0.5) * 0.01);
        const sc = 0.985 + rand() * 0.03;
        ctx.scale(sc, sc);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        const fill = c.accent ? accentColor : color;
        ctx.globalAlpha = alpha * (c.accent ? 1 : 1 - rand() * charAlpha);
        ctx.fillStyle = fill;
        ctx.fillText(c.ch, 0, 0);
        // 粉笔的干涩边缘
        ctx.globalAlpha = alpha * (c.accent ? 0.5 : 0.34);
        ctx.strokeStyle = fill;
        ctx.lineWidth = size * (c.accent ? 0.022 : 0.016);
        ctx.lineJoin = 'round';
        ctx.strokeText(c.ch, 0, 0);
        ctx.restore();
      }
      cursor += w + ls;
    }

    // 重点句的粉笔划线
    if (o.underlineAccent) {
      ctx.globalAlpha = alpha * 0.55;
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = Math.max(1.8, size * 0.035);
      ctx.lineCap = 'round';
      for (const r of accentRuns) {
        const y = size * 0.12;
        ctx.beginPath();
        const steps = 6;
        for (let s = 0; s <= steps; s++) {
          const x = r.x0 + ((r.x1 - r.x0) * s) / steps;
          const yy = y + Math.sin(s * 1.7 + rand()) * size * 0.012;
          if (s === 0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawChalkContent(ctx, L, state, rand) {
    const col = CHALK_COLORS[state.chalk] || CHALK_COLORS.warm;
    const accent = ACCENT_COLORS[state.accent] || ACCENT_COLORS.yellow;
    const { content, u } = L;

    const titleAnchor = state.align === 'left' ? content.x : content.x + content.w / 2;
    const titleAlign = state.align === 'left' ? 'left' : 'center';

    // 标题
    if (L.titleChars.length) {
      drawChalkChars(ctx, L.titleChars, titleAnchor, L.titleBase, L.titleSize, {
        color: col, accentColor: accent, align: titleAlign,
        letterSpacing: L.titleSize * 0.06, alpha: 0.98, jitter: L.titleSize * 0.012,
        charAlpha: 0.05, rand, underlineAccent: false
      });

      if (state.underline) {
        const tw = measureChars(ctx, L.titleChars, L.titleSize, L.titleSize * 0.06);
        const half = Math.min(tw * 0.34, content.w * 0.18);
        const uc = state.align === 'left' ? content.x + half : content.x + content.w / 2;
        ctx.save();
        ctx.strokeStyle = col;
        ctx.globalAlpha = 0.42;
        ctx.lineCap = 'round';
        for (let k = 0; k < 2; k++) {
          ctx.beginPath();
          ctx.lineWidth = (k === 0 ? 3.2 : 1.4) * u;
          for (let s = 0; s <= 8; s++) {
            const x = uc - half + ((half * 2) * s) / 8;
            const y = L.underlineY + Math.sin(s * 1.3 + rand()) * 2.2 * u + k * 1.8 * u;
            if (s === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
        ctx.fillStyle = col;
        ctx.globalAlpha = 0.35;
        if (state.align !== 'left') {
          for (const side of [-1, 1]) {
            ctx.beginPath();
            ctx.arc(uc + side * (half + 16 * u), L.underlineY, 2.2 * u, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }
    }

    // 作者
    if (L.authorChars.length) {
      drawChalkChars(ctx, L.authorChars, titleAnchor, L.authorBase, L.authorSize, {
        color: col, accentColor: accent, align: titleAlign,
        letterSpacing: L.authorSize * 0.1, alpha: 0.72, jitter: L.authorSize * 0.02,
        charAlpha: 0.12, rand
      });
    }

    // 诗句
    let y = L.blockTop + L.bodySize * 0.86;
    for (const line of L.lines) {
      if (line.blank) {
        y += L.lineHeight * 0.42;
        continue;
      }
      const anchor = state.align === 'left' ? content.x : content.x + content.w / 2;
      drawChalkChars(ctx, line.chars, anchor, y, L.bodySize, {
        color: col, accentColor: accent, align: state.align === 'left' ? 'left' : 'center',
        letterSpacing: L.bodySize * 0.006, alpha: 0.95, jitter: L.bodySize * 0.02,
        charAlpha: 0.1, rand, rotate: (rand() - 0.5) * 0.004, underlineAccent: true
      });
      y += L.lineHeight;
    }

    // 日期与落款
    if (state.showDate) {
      drawChalkChars(ctx, parseRich(L.dateText), content.x, L.footerBase, 23 * u, {
        color: col, accentColor: accent, align: 'left', letterSpacing: 0.5 * u,
        alpha: 0.48, jitter: 0.5 * u, charAlpha: 0.1, rand
      });
    }
    const footer = (state.footer || '').trim();
    if (footer) {
      const fx = content.right - (state.seal ? L.sealSize + 26 * u : 0);
      drawChalkChars(ctx, parseRich(footer), fx, L.footerBase, 22 * u, {
        color: col, accentColor: accent, align: 'right', letterSpacing: 0.5 * u,
        alpha: 0.58, jitter: 0.6 * u, charAlpha: 0.1, rand
      });
    }
  }

  function erodeText(layerCtx, L, rand) {
    const { W, H } = L;
    const pattern = layerCtx.createPattern(getNoiseCanvas(), 'repeat');
    layerCtx.save();
    layerCtx.globalCompositeOperation = 'destination-out';
    layerCtx.globalAlpha = 0.45;
    layerCtx.fillStyle = pattern;
    layerCtx.fillRect(0, 0, W, H);
    layerCtx.globalAlpha = 0.18;
    layerCtx.translate(53, 97);
    layerCtx.fillRect(-53, -97, W, H);
    layerCtx.restore();

    // 一点长条擦痕，让笔画更像粉笔
    layerCtx.save();
    layerCtx.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 18; i++) {
      const y = rand() * H;
      const x = rand() * W;
      const len = (0.01 + rand() * 0.05) * Math.min(W, H);
      layerCtx.strokeStyle = 'rgba(0,0,0,' + (0.05 + rand() * 0.12).toFixed(3) + ')';
      layerCtx.lineWidth = 0.5 + rand() * 1.5;
      layerCtx.beginPath();
      layerCtx.moveTo(x, y);
      layerCtx.lineTo(x + len, y + (rand() - 0.5) * 6);
      layerCtx.stroke();
    }
    layerCtx.restore();
  }

  function sprinkleDust(ctx, layer, L, rand, chalkColor) {
    const sw = 380;
    const sh = Math.max(1, Math.round((sw * layer.height) / layer.width));
    const small = document.createElement('canvas');
    small.width = sw;
    small.height = sh;
    const sctx = small.getContext('2d', { willReadFrequently: true });
    sctx.drawImage(layer, 0, 0, sw, sh);
    let data;
    try {
      data = sctx.getImageData(0, 0, sw, sh).data;
    } catch (e) {
      return;
    }
    const col = chalkColor || CHALK_COLORS.warm;
    ctx.save();
    for (let i = 0; i < 420; i++) {
      const px = Math.floor(rand() * sw);
      const py = Math.floor(rand() * sh);
      const idx = (py * sw + px) * 4 + 3;
      if (data[idx] < 55) continue;
      const x = (px / sw) * L.W + (rand() - 0.5) * 12;
      const y = (py / sh) * L.H + (rand() - 0.5) * 12;
      ctx.globalAlpha = 0.05 + rand() * 0.16;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(x, y, 0.5 + rand() * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  /* ---------- 印章 ---------- */

  function getSealText(state) {
    let t = String(state.sealText || '').trim();
    if (!t) {
      const cleaned = String(state.author || '').replace(/[^\u4e00-\u9fa5]/g, '');
      t = cleaned.slice(-2);
    }
    return t.slice(0, 4);
  }

  function drawSeal(ctx, L, state, rand) {
    if (!state.seal) return;
    const text = getSealText(state);
    const size = L.sealSize;
    const x = L.content.right - size;
    const y = L.footerBase - size + 8 * L.u;
    const red = '#b13b32';

    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    ctx.rotate(-0.045);
    ctx.globalAlpha = 0.94;

    // 手工刻印的毛边：几层错位方块
    for (let i = 0; i < 4; i++) {
      const j = i === 0 ? 0 : 1.2;
      roundRect(ctx, -size / 2 + (rand() - 0.5) * j, -size / 2 + (rand() - 0.5) * j, size, size, size * 0.06);
      ctx.fillStyle = red;
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // 印面斑驳：用黑板底色点出磨损的小孔
    const boardColors = BOARD_COLORS[state.board] || BOARD_COLORS.green;
    ctx.save();
    ctx.fillStyle = boardColors[2];
    for (let i = 0; i < 80; i++) {
      ctx.globalAlpha = 0.04 + rand() * 0.13;
      ctx.beginPath();
      ctx.arc((rand() - 0.5) * size, (rand() - 0.5) * size, 0.5 + rand() * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 内框
    ctx.strokeStyle = 'rgba(246,232,212,0.6)';
    ctx.lineWidth = 1.6;
    roundRect(ctx, -size / 2 + size * 0.1, -size / 2 + size * 0.1, size * 0.8, size * 0.8, size * 0.02);
    ctx.stroke();

    // 印文
    ctx.fillStyle = '#f7ead7';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = text.split('');
    if (chars.length <= 1) {
      ctx.font = '400 ' + size * 0.48 + 'px ' + FONT_FAMILY;
      ctx.fillText(chars[0] || '诗', 0, 2);
    } else if (chars.length === 2) {
      ctx.font = '400 ' + size * 0.38 + 'px ' + FONT_FAMILY;
      ctx.fillText(chars[0], 0, -size * 0.2);
      ctx.fillText(chars[1], 0, size * 0.2);
    } else if (chars.length === 3) {
      ctx.font = '400 ' + size * 0.31 + 'px ' + FONT_FAMILY;
      ctx.fillText(chars[0], 0, -size * 0.26);
      ctx.fillText(chars[1], 0, 0);
      ctx.fillText(chars[2], 0, size * 0.26);
    } else {
      ctx.font = '400 ' + size * 0.3 + 'px ' + FONT_FAMILY;
      ctx.fillText(chars[0], -size * 0.18, -size * 0.18);
      ctx.fillText(chars[1], size * 0.18, -size * 0.18);
      ctx.fillText(chars[2], -size * 0.18, size * 0.18);
      ctx.fillText(chars[3], size * 0.18, size * 0.18);
    }
    ctx.restore();
  }

  /* ---------- 主渲染 ---------- */

  async function render(canvas, state, opts) {
    await ensureFont();
    const o = opts || {};
    const aspect = ASPECTS[state.aspect] || ASPECTS['3:2'];
    const W = BASE_W;
    const H = Math.round(W / aspect);
    const scale = o.scale || 1;

    canvas.width = Math.round(W * scale);
    canvas.height = Math.round(H * scale);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const seed = hashString(
      [state.title, state.author, state.body, state.board, state.wood, state.chalk,
        state.accent, state.aspect, state.illustration, state.lineHeight, state.align].join('|')
    );
    const rand = mulberry32(seed);
    const layout = computeLayout(ctx, state, W, H);

    drawWall(ctx, W, H, rand);
    drawWoodFrame(ctx, layout, state, rand);
    drawBoard(ctx, layout, state, rand);

    // 背景层装饰先画，文字压在上面
    drawIllustration(ctx, layout, state, rand);
    drawTrayAndProps(ctx, layout, state, rand);

    const layer = document.createElement('canvas');
    layer.width = canvas.width;
    layer.height = canvas.height;
    const lctx = layer.getContext('2d');
    lctx.setTransform(scale, 0, 0, scale, 0, 0);

    drawChalkContent(lctx, layout, state, mulberry32(seed ^ 0x9e3779b9));
    erodeText(lctx, layout, mulberry32(seed ^ 0x51ed270b));

    sprinkleDust(ctx, layer, layout, mulberry32(seed ^ 0x1b56c4e9), CHALK_COLORS[state.chalk] || CHALK_COLORS.warm);

    // 淡淡的粉笔拖影
    ctx.save();
    ctx.globalAlpha = 0.09;
    ctx.drawImage(layer, 1.6, 1.1, W, H);
    ctx.restore();
    ctx.drawImage(layer, 0, 0, W, H);

    drawSeal(ctx, layout, state, mulberry32(seed ^ 0x7f4a7c15));

    return layout;
  }

  global.BoardRenderer = {
    render,
    ensureFont,
    computeLayout,
    ASPECTS,
    COLORS: { board: BOARD_COLORS, wood: WOOD_COLORS, chalk: CHALK_COLORS, accent: ACCENT_COLORS },
    getSealText
  };
})(window);
