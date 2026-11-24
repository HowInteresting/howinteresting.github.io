(function () {
  'use strict';

  const DEFAULTS = {
    title: '静夜思',
    author: '唐 · 李白',
    body: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
    board: 'green',
    wood: 'walnut',
    chalk: 'warm',
    accent: 'yellow',
    aspect: '1:1',
    align: 'center',
    lineHeight: 1.9,
    seal: true,
    sealText: '',
    footer: '',
    illustration: 'moon',
    props: true,
    underline: true,
    showDate: true,
    format: 'jpg'
  };

  const PRESETS = [
    {
      name: '静夜思',
      title: '静夜思',
      author: '唐 · 李白',
      body: '床前明月光，疑是地上霜。\n举头望明月，低头思故乡。',
      illustration: 'moon'
    },
    {
      name: '春晓',
      title: '春晓',
      author: '唐 · 孟浩然',
      body: '春眠不觉晓，处处闻啼鸟。\n夜来风雨声，花落知多少。',
      illustration: 'plum'
    },
    {
      name: '登鹳雀楼',
      title: '登鹳雀楼',
      author: '唐 · 王之涣',
      body: '白日依山尽，黄河入海流。\n欲穷千里目，更上一层楼。',
      illustration: 'none'
    },
    {
      name: '江雪',
      title: '江雪',
      author: '唐 · 柳宗元',
      body: '千山鸟飞绝，万径人踪灭。\n孤舟蓑笠翁，独钓寒江雪。',
      illustration: 'bamboo'
    },
    {
      name: '望庐山瀑布',
      title: '望庐山瀑布',
      author: '唐 · 李白',
      body: '日照香炉生紫烟，遥看瀑布挂前川。\n飞流直下三千尺，疑是银河落九天。',
      illustration: 'none'
    },
    {
      name: '山行',
      title: '山行',
      author: '唐 · 杜牧',
      body: '远上寒山石径斜，白云生处有人家。\n停车坐爱枫林晚，霜叶红于二月花。',
      illustration: 'plum'
    },
    {
      name: '早发白帝城',
      title: '早发白帝城',
      author: '唐 · 李白',
      body: '朝辞白帝彩云间，千里江陵一日还。\n两岸猿声啼不住，轻舟已过万重山。',
      illustration: 'none'
    },
    {
      name: '送孟浩然',
      title: '黄鹤楼送孟浩然之广陵',
      author: '唐 · 李白',
      body: '故人西辞黄鹤楼，烟花三月下扬州。\n孤帆远影碧空尽，唯见长江天际流。',
      illustration: 'none'
    },
    {
      name: '枫桥夜泊',
      title: '枫桥夜泊',
      author: '唐 · 张继',
      body: '月落乌啼霜满天，江枫渔火对愁眠。\n姑苏城外寒山寺，夜半钟声到客船。',
      illustration: 'moon'
    },
    {
      name: '出塞',
      title: '出塞',
      author: '唐 · 王昌龄',
      body: '秦时明月汉时关，万里长征人未还。\n但使龙城飞将在，不教胡马度阴山。',
      illustration: 'moon'
    },
    {
      name: '凉州词',
      title: '凉州词',
      author: '唐 · 王之涣',
      body: '黄河远上白云间，一片孤城万仞山。\n羌笛何须怨杨柳，春风不度玉门关。',
      illustration: 'none'
    },
    {
      name: '咏柳',
      title: '咏柳',
      author: '唐 · 贺知章',
      body: '碧玉妆成一树高，万条垂下绿丝绦。\n不知细叶谁裁出，二月春风似剪刀。',
      illustration: 'bamboo'
    },
    {
      name: '清明',
      title: '清明',
      author: '唐 · 杜牧',
      body: '清明时节雨纷纷，路上行人欲断魂。\n借问酒家何处有，牧童遥指杏花村。',
      illustration: 'none'
    },
    {
      name: '泊船瓜洲',
      title: '泊船瓜洲',
      author: '宋 · 王安石',
      body: '京口瓜洲一水间，钟山只隔数重山。\n春风又绿江南岸，明月何时照我还。',
      illustration: 'moon'
    },
    {
      name: '饮湖上',
      title: '饮湖上初晴后雨',
      author: '宋 · 苏轼',
      body: '水光潋滟晴方好，山色空蒙雨亦奇。\n欲把西湖比西子，淡妆浓抹总相宜。',
      illustration: 'none'
    },
    {
      name: '题西林壁',
      title: '题西林壁',
      author: '宋 · 苏轼',
      body: '横看成岭侧成峰，远近高低各不同。\n不识庐山真面目，只缘身在此山中。',
      illustration: 'none'
    },
    {
      name: '九月九日',
      title: '九月九日忆山东兄弟',
      author: '唐 · 王维',
      body: '独在异乡为异客，每逢佳节倍思亲。\n遥知兄弟登高处，遍插茱萸少一人。',
      illustration: 'plum'
    }
  ];

  const BOARDS = [
    { value: 'green', name: '墨绿', css: 'linear-gradient(150deg,#2c4a3f,#142a23)' },
    { value: 'blue', name: '黛蓝', css: 'linear-gradient(150deg,#2b3e4e,#111c25)' },
    { value: 'black', name: '炭黑', css: 'linear-gradient(150deg,#282c29,#0f1211)' }
  ];
  const WOODS = [
    { value: 'walnut', name: '胡桃', css: 'linear-gradient(150deg,#9a6841,#4a2c19)' },
    { value: 'oak', name: '原木', css: 'linear-gradient(150deg,#c29263,#6e4828)' },
    { value: 'ebony', name: '乌木', css: 'linear-gradient(150deg,#624734,#241710)' }
  ];
  const CHALKS = [
    { value: 'warm', name: '米白', css: '#f3efe2' },
    { value: 'white', name: '雪白', css: '#ffffff' },
    { value: 'cream', name: '暖黄', css: '#f8efd4' }
  ];
  const ACCENTS = [
    { value: 'yellow', name: '杏黄', css: '#f1c96d' },
    { value: 'pink', name: '胭脂', css: '#eda9a2' },
    { value: 'cyan', name: '豆青', css: '#9ed4c7' }
  ];

  const SHORT = {
    title: 't',
    author: 'a',
    body: 'b',
    board: 'd',
    wood: 'w',
    chalk: 'c',
    accent: 'k',
    aspect: 'r',
    align: 'l',
    lineHeight: 'g',
    seal: 's',
    sealText: 'x',
    footer: 'f',
    illustration: 'i',
    props: 'p',
    underline: 'u',
    showDate: 'z',
    format: 'q'
  };

  const STORAGE_KEY = 'poem-board-state-v1';

  const $ = (sel) => document.querySelector(sel);

  let state = { ...DEFAULTS };
  let renderTimer = 0;
  let rendering = false;
  let queued = false;
  let toastTimer = 0;
  let lastOverflow = false;

  /* ---------- URL / 本地状态 ---------- */

  function encodeBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = '';
    for (const b of bytes) bin += String.fromCharCode(b);
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeBase64(code) {
    let s = code.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    const bin = atob(s);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeState(s) {
    const out = {};
    for (const key of Object.keys(SHORT)) {
      if (s[key] !== DEFAULTS[key]) out[SHORT[key]] = s[key];
    }
    if (!Object.keys(out).length) return '';
    return encodeBase64(JSON.stringify(out));
  }

  function decodeState(code) {
    if (!code) return {};
    const raw = JSON.parse(decodeBase64(code));
    const out = {};
    for (const key of Object.keys(SHORT)) {
      if (Object.prototype.hasOwnProperty.call(raw, SHORT[key])) out[key] = raw[SHORT[key]];
    }
    return out;
  }

  function stateFromHash() {
    const hash = location.hash || '';
    if (!hash.startsWith('#p=')) return null;
    const code = hash.slice(3);
    if (!code) return { ...DEFAULTS };
    try {
      return { ...DEFAULTS, ...decodeState(code) };
    } catch (err) {
      console.warn('分享链接解析失败', err);
      return null;
    }
  }

  function safeValidate() {
    if (!BOARDS.some((x) => x.value === state.board)) state.board = DEFAULTS.board;
    if (!WOODS.some((x) => x.value === state.wood)) state.wood = DEFAULTS.wood;
    if (!CHALKS.some((x) => x.value === state.chalk)) state.chalk = DEFAULTS.chalk;
    if (!ACCENTS.some((x) => x.value === state.accent)) state.accent = DEFAULTS.accent;
    if (!['3:2', '4:3', '1:1'].includes(state.aspect)) state.aspect = DEFAULTS.aspect;
    if (!['center', 'left'].includes(state.align)) state.align = DEFAULTS.align;
    if (!['jpg', 'png'].includes(state.format)) state.format = DEFAULTS.format;
    if (!['none', 'moon', 'bamboo', 'plum'].includes(state.illustration)) state.illustration = DEFAULTS.illustration;
    const lh = Number(state.lineHeight);
    state.lineHeight = Number.isFinite(lh) ? Math.min(2.35, Math.max(1.55, lh)) : DEFAULTS.lineHeight;
    for (const key of ['seal', 'props', 'underline', 'showDate']) {
      state[key] = Boolean(state[key]);
    }
    for (const key of ['title', 'author', 'body', 'sealText', 'footer']) {
      state[key] = String(state[key] == null ? '' : state[key]);
    }
  }

  function loadInitialState() {
    const fromHash = stateFromHash();
    if (fromHash) {
      state = { ...DEFAULTS, ...fromHash };
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        if (saved && typeof saved === 'object') {
          // 旧版本默认画幅是 3:2，切换到 1:1 默认时同步迁移存档
          if (!saved.__v && saved.aspect === '3:2') saved.aspect = '1:1';
          saved.__v = 2;
          state = { ...DEFAULTS, ...saved };
        } else {
          state = { ...DEFAULTS };
        }
      } catch (err) {
        state = { ...DEFAULTS };
      }
    }
    safeValidate();
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      /* 忽略隐私模式下的存储失败 */
    }
  }

  function writeHash() {
    const code = encodeState(state);
    try {
      history.replaceState(null, '', location.pathname + location.search + '#p=' + code);
    } catch (err) {
      /* file:// 下部分浏览器不允许 replaceState */
    }
  }

  /* ---------- 控件构建 ---------- */

  function makeSwatches(container, items, key, compact) {
    container.innerHTML = '';
    for (const item of items) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'swatch' + (compact ? ' compact' : '');
      btn.dataset.value = item.value;
      btn.title = item.name;
      btn.innerHTML =
        '<span class="chip" style="background:' + item.css + '"></span>' +
        '<span class="name">' + item.name + '</span>';
      btn.addEventListener('click', () => {
        state[key] = item.value;
        sync();
        schedule(true);
      });
      container.appendChild(btn);
    }
  }

  function buildPresets() {
    const row = $('#presets');
    row.innerHTML = '';
    for (const p of PRESETS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'preset';
      btn.textContent = p.name;
      btn.dataset.title = p.title;
      btn.addEventListener('click', () => {
        state.title = p.title;
        state.author = p.author;
        state.body = p.body;
        state.illustration = p.illustration;
        state.sealText = '';
        sync();
        schedule(true);
      });
      row.appendChild(btn);
    }
  }

  function setActive(container, key) {
    container.querySelectorAll('[data-value]').forEach((btn) => {
      const active = btn.dataset.value === String(state[key]);
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateRange() {
    const el = $('#lineHeight');
    el.value = String(state.lineHeight);
    $('#lineHeightOut').textContent = Number(state.lineHeight).toFixed(2).replace(/0$/, '') + '×';
    const min = Number(el.min);
    const max = Number(el.max);
    const pct = ((Number(el.value) - min) / (max - min)) * 100;
    el.style.background =
      'linear-gradient(90deg,var(--green) 0%,var(--green) ' + pct + '%,rgba(31,46,38,.13) ' + pct + '%)';
  }

  function sync() {
    $('#title').value = state.title;
    $('#author').value = state.author;
    $('#body').value = state.body;
    $('#footer').value = state.footer;
    $('#sealText').value = state.sealText;

    $('#seal').checked = state.seal;
    $('#props').checked = state.props;
    $('#underline').checked = state.underline;
    $('#showDate').checked = state.showDate;
    $('#illustration').value = state.illustration;
    $('#formatHint').textContent = state.format === 'png'
      ? 'PNG 无损，约 13 MB；适合留存或打印。'
      : 'JPG 约 1 MB，发微信更快；PNG 约 13 MB。';
    $('#downloadHint').textContent = (state.format === 'png' ? 'PNG' : 'JPG') + ' · 2×';
    $('#sealTextField').classList.toggle('is-disabled', !state.seal);
    $('#sealText').placeholder = BoardRenderer.getSealText({ ...state, sealText: '' }) || '闲章';

    setActive($('#boardSwatches'), 'board');
    setActive($('#woodSwatches'), 'wood');
    setActive($('#chalkSwatches'), 'chalk');
    setActive($('#accentSwatches'), 'accent');
    setActive($('#aspectSeg'), 'aspect');
    setActive($('#alignSeg'), 'align');
    setActive($('#formatSeg'), 'format');
    updateRange();

    document.querySelectorAll('.preset').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.title === state.title);
    });
  }

  /* ---------- 渲染 ---------- */

  function schedule(writeUrl) {
    if (writeUrl) writeHash();
    persist();
    clearTimeout(renderTimer);
    renderTimer = window.setTimeout(render, 130);
  }

  async function render() {
    if (rendering) {
      queued = true;
      return;
    }
    rendering = true;
    try {
      const layout = await BoardRenderer.render($('#board'), state);
      $('#loading').classList.add('is-hidden');
      const exportW = layout.W * 2;
      const exportH = layout.H * 2;
      $('#sizeLabel').textContent = layout.W + ' × ' + layout.H + ' · 导出 ' + exportW + ' × ' + exportH;
      if (layout.overflow !== lastOverflow) {
        lastOverflow = layout.overflow;
        $('.stage-tip').textContent = layout.overflow
          ? '内容较长，已自动缩小字号；建议精简到 12 行以内'
          : '点击画面可放大查看 · 所有处理都在你的浏览器里完成';
      }
    } catch (err) {
      console.error(err);
      $('#loading').classList.add('is-hidden');
      toast('渲染失败，请刷新后重试');
    } finally {
      rendering = false;
      if (queued) {
        queued = false;
        render();
      }
    }
  }

  function snapshot() {
    return JSON.parse(JSON.stringify(state));
  }

  async function renderCanvas(scale, snap) {
    const canvas = document.createElement('canvas');
    await BoardRenderer.render(canvas, snap || snapshot(), { scale });
    return canvas;
  }

  function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('PNG 生成失败'));
      }, 'image/png');
    });
  }

  async function renderBlob(scale, type, quality) {
    const canvas = await renderCanvas(scale);
    const mime = type || 'image/png';
    if (mime === 'image/png') return canvasToBlob(canvas);
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('图片生成失败'));
      }, mime, quality == null ? 0.94 : quality);
    });
  }

  function safeFileName(ext) {
    const title = (state.title || '黑板诗笺')
      .replace(/[\\/:*?"<>|\n\r]+/g, '-')
      .replace(/\s+/g, '')
      .slice(0, 24);
    return (title || '黑板诗笺') + '-黑板字.' + (ext || 'jpg');
  }

  function downloadBlob(blob, ext) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = safeFileName(ext);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function setBusy(btn, busy, text) {
    if (busy) {
      btn.dataset.original = btn.innerHTML;
      btn.disabled = true;
      btn.textContent = text || '正在生成…';
    } else {
      btn.disabled = false;
      if (btn.dataset.original) btn.innerHTML = btn.dataset.original;
      delete btn.dataset.original;
    }
  }

  async function download() {
    const btn = $('#btnDownload');
    if (btn.disabled) return;
    const isPng = state.format === 'png';
    setBusy(btn, true, '正在生成 2× 高清图…');
    try {
      const blob = await renderBlob(2, isPng ? 'image/png' : 'image/jpeg', 0.94);
      downloadBlob(blob, isPng ? 'png' : 'jpg');
      const mb = Math.max(0.1, Math.round((blob.size / 1048576) * 10) / 10);
      toast('已生成 3600 像素宽的 ' + (isPng ? 'PNG' : 'JPG') + '（约 ' + mb + ' MB）');
    } catch (err) {
      console.error(err);
      toast('生成失败，请稍后再试');
    } finally {
      setBusy(btn, false);
    }
  }

  async function copyImage() {
    const btn = $('#btnCopy');
    if (btn.disabled) return;
    if (!navigator.clipboard || !window.ClipboardItem) {
      toast('当前浏览器不支持复制图片，已改为下载');
      download();
      return;
    }
    setBusy(btn, true, '正在复制…');
    try {
      const blobPromise = renderBlob(1.5, 'image/png');
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blobPromise })]);
      toast('图片已复制，可直接粘贴到微信');
    } catch (err) {
      console.warn(err);
      try {
        downloadBlob(await renderBlob(2, 'image/png'), 'png');
        toast('复制图片受浏览器限制，已改为下载');
      } catch (err2) {
        console.error(err2);
        toast('复制失败，请使用「下载图片」');
      }
    } finally {
      setBusy(btn, false);
    }
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        /* fall through */
      }
    }
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    ta.style.pointerEvents = 'none';
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (err) {
      ok = false;
    }
    ta.remove();
    return ok;
  }

  async function share() {
    const url = location.href.split('#')[0] + '#p=' + encodeState(state);
    const ok = await copyText(url);
    if (!ok) {
      toast('复制失败，请手动复制地址栏链接');
      return;
    }
    if (location.protocol === 'file:') {
      toast('已复制本地链接；部署到网上后，这个按钮才会生成可分享的网址');
    } else {
      toast('分享链接已复制，打开即可看到同一幅字');
    }
  }

  /* ---------- 智能分行 ---------- */

  function smartBreak() {
    const text = $('#body').value.trim();
    if (!text) {
      toast('先写几句诗吧');
      return;
    }
    const flat = text.replace(/\s*\n\s*/g, '');
    const clauses = flat.match(/[^，。！？；：、,.!?;:]+[，。！？；：、,.!?;:]?/g) || [flat];
    const next = clauses.map((s) => s.trim()).filter(Boolean).join('\n');
    state.body = next;
    $('#body').value = next;
    schedule(true);
    toast(text === next ? '已经是一句一行了' : '已按短句分行');
  }

  /* ---------- 预览弹窗 ---------- */

  async function openZoom() {
    const dialog = $('#zoomDialog');
    if (!dialog.open) dialog.showModal();
    try {
      await BoardRenderer.render($('#zoomCanvas'), snapshot());
    } catch (err) {
      console.error(err);
    }
  }

  /* ---------- toast ---------- */

  function toast(message) {
    const el = $('#toast');
    el.textContent = message;
    el.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove('is-show'), 2600);
  }

  /* ---------- 事件绑定 ---------- */

  function bindText(id, key) {
    $(id).addEventListener('input', (e) => {
      state[key] = e.target.value;
      if (key === 'author') {
        $('#sealText').placeholder = BoardRenderer.getSealText({ ...state, sealText: '' }) || '闲章';
      }
      schedule(true);
    });
  }

  function bind() {
    buildPresets();
    makeSwatches($('#boardSwatches'), BOARDS, 'board', false);
    makeSwatches($('#woodSwatches'), WOODS, 'wood', false);
    makeSwatches($('#chalkSwatches'), CHALKS, 'chalk', true);
    makeSwatches($('#accentSwatches'), ACCENTS, 'accent', true);

    bindText('#title', 'title');
    bindText('#author', 'author');
    bindText('#body', 'body');
    bindText('#footer', 'footer');
    bindText('#sealText', 'sealText');

    $('#btnSmart').addEventListener('click', smartBreak);

    $('#lineHeight').addEventListener('input', (e) => {
      state.lineHeight = Number(e.target.value);
      updateRange();
      schedule(true);
    });

    $('#aspectSeg').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-value]');
      if (!btn) return;
      state.aspect = btn.dataset.value;
      sync();
      schedule(true);
    });

    $('#alignSeg').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-value]');
      if (!btn) return;
      state.align = btn.dataset.value;
      sync();
      schedule(true);
    });

    $('#formatSeg').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-value]');
      if (!btn) return;
      state.format = btn.dataset.value;
      sync();
      schedule(true);
    });

    $('#seal').addEventListener('change', (e) => {
      state.seal = e.target.checked;
      sync();
      schedule(true);
    });

    $('#illustration').addEventListener('change', (e) => {
      state.illustration = e.target.value;
      schedule(true);
    });

    $('#props').addEventListener('change', (e) => {
      state.props = e.target.checked;
      schedule(true);
    });

    $('#underline').addEventListener('change', (e) => {
      state.underline = e.target.checked;
      schedule(true);
    });

    $('#showDate').addEventListener('change', (e) => {
      state.showDate = e.target.checked;
      schedule(true);
    });

    $('#btnDownload').addEventListener('click', download);
    $('#btnCopy').addEventListener('click', copyImage);
    $('#btnShare').addEventListener('click', share);
    $('#btnExpand').addEventListener('click', openZoom);
    $('#board').addEventListener('click', openZoom);

    $('#btnCloseZoom').addEventListener('click', () => $('#zoomDialog').close());
    $('#zoomDialog').addEventListener('click', (e) => {
      if (e.target === $('#zoomDialog')) $('#zoomDialog').close();
    });

    $('#btnReset').addEventListener('click', () => {
      state = { ...DEFAULTS };
      sync();
      schedule(true);
      toast('已恢复示例');
    });

    window.addEventListener('hashchange', () => {
      const fromHash = stateFromHash();
      if (!fromHash) return;
      state = { ...DEFAULTS, ...fromHash };
      safeValidate();
      sync();
      render();
    });

    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        download();
      }
    });

    window.addEventListener('beforeunload', persist);
  }

  /* ---------- 启动 ---------- */

  loadInitialState();
  bind();
  sync();
  render();
})();
