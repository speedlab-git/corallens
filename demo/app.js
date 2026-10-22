// CoralLens demo: step navigation, frame selection, multi-view reasoning, evidence report. No dependencies.
(function () {
  'use strict';
  var STEPS = [
    ['Add video', 'Survey footage'],
    ['Watch less', 'Frames, visibility, regions'],
    ['Reason', 'Per-view VLM + fusion'],
    ['Verify', 'Evidence-grounded report']
  ];
  var CHECK = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke="#0B6E79" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  // frames along the survey; score = informativeness used for the frame budget
  var FRAMES = [
    { img: 'v0.jpg', raw: 'v0_raw.jpg', vis: 0.34, venh: 0.78, fix: 'dark', t: '00:00:12', score: 0.82, why: 'new viewpoint, encrusting colony C4' },
    { img: 'v1.jpg', vis: 0.86, t: '00:02:15', score: 0.91, why: 'sharp, brain coral C2 in view' },
    { img: 'v2.jpg', vis: 0.91, t: '00:02:40', score: 0.95, why: 'keyframe: C1, C2 and C4 together' },
    { img: 'v2dup.jpg', vis: 0.84, t: '00:02:44', score: 0.12, why: 'near-duplicate of 00:02:40' },
    { img: 'v3.jpg', raw: 'v3_raw.jpg', vis: 0.29, venh: 0.81, fix: 'haze', t: '00:03:58', score: 0.77, why: 'C2 from a new angle' },
    { img: 'v4.jpg', vis: 0.88, t: '00:04:32', score: 0.86, why: 'pale edge on C2' },
    { img: 'v5.jpg', vis: 0.79, t: '00:05:10', score: 0.35, why: 'little new coral coverage' },
    { img: 'v6.jpg', raw: 'v6_raw.jpg', vis: 0.46, venh: 0.84, fix: 'cast', t: '00:06:18', score: 0.8, why: 'turf algae on rubble' }
  ];

  var VIEWS = [['view1.jpg', 'view 1 · 02:15'], ['view2.jpg', 'view 2 · 02:40'], ['view3.jpg', 'view 3 · 04:32'], ['view4.jpg', 'view 4 · vis 0.31']];
  var DIMS = {
    type: { label: 'Coral type', ask: 'coral type', a: ['Brain', 'Brain', 'Brain', 'Brain'], fused: 'Brain coral', agree: [4, 4],
      trace: [['Observe', 'Meandering ridges and valleys across a domed colony.', 'v1, v2, v3'],
              ['Compare', 'Same ridge pattern in every view; v4 is hazy but the outline matches.', 'v1–v4'],
              ['Conclude', 'Brain coral, high confidence.', ''],
              ['Verify', 'Ridges are visible in three clear frames.', '02:15, 02:40, 04:32']] },
    form: { label: 'Growth form', ask: 'growth form', a: ['Massive', 'Massive', 'Massive', 'Massive'], fused: 'Massive', agree: [4, 4],
      trace: [['Observe', 'Rounded, boulder-like colony with no branches.', 'v1, v2'],
              ['Compare', 'Shape is stable across angles, including the turbid view.', 'v1–v4'],
              ['Conclude', 'Massive growth form.', ''],
              ['Verify', 'Profile visible in all four frames.', '02:15–04:32']] },
    colour: { label: 'Colour, health', ask: 'colour and visible health', a: ['Normal', 'Normal', 'Normal', '?'], fused: 'Normal', agree: [3, 3],
      trace: [['Observe', 'Uniform brown tissue colour.', 'v1, v2, v3'],
              ['Compare', 'View 4 colour is shifted by turbid water, so it abstains.', 'v4'],
              ['Conclude', 'Normal colour in all clear views.', ''],
              ['Verify', 'Colour judged only from clear frames.', '02:15, 02:40, 04:32']] },
    bleach: { label: 'Bleaching', ask: 'bleaching', a: ['None', 'None', 'Pale', '?'], fused: 'Review', agree: [2, 3], warn: true,
      trace: [['Observe', 'Views 1–2 show no white or pale tissue.', 'v1, v2'],
              ['Compare', 'View 3 shows a pale edge; view 4 is too turbid to judge.', 'v3, v4'],
              ['Conclude', 'Possible bleaching on one edge; flag for expert review.', ''],
              ['Verify', 'Only one frame supports “pale”, so it is not stated as fact.', '04:32']] },
    damage: { label: 'Damage', ask: 'damage', a: ['None', 'None', 'None', '?'], fused: 'None', agree: [3, 3],
      trace: [['Observe', 'No broken or scarred surfaces on the colony.', 'v1, v2, v3'],
              ['Compare', 'Consistent across clear views; view 4 abstains.', 'v1–v3'],
              ['Conclude', 'No visible damage.', ''],
              ['Verify', 'Surface visible in three frames.', '02:15, 02:40, 04:32']] },
    death: { label: 'Partial death', ask: 'partial mortality', a: ['Low', 'Low', 'Low', 'Low'], fused: 'Low', agree: [4, 4],
      trace: [['Observe', 'Small patches of bare surface at the colony base.', 'v1, v3'],
              ['Compare', 'Patch size looks similar in every view.', 'v1–v4'],
              ['Conclude', 'Low partial mortality.', ''],
              ['Verify', 'Base visible in all frames.', '02:15–04:32']] },
    complex: { label: 'Complexity', ask: 'structural complexity', a: ['High', 'High', 'Med', 'High'], fused: 'High', agree: [3, 4],
      trace: [['Observe', 'Large colony with deep ridges and neighbouring colonies.', 'v1, v2'],
              ['Compare', 'View 3 crops the colony tightly and rates it medium.', 'v3'],
              ['Conclude', 'High complexity, three of four views.', ''],
              ['Verify', 'Wide views support the rating.', '02:15, 02:40']] }
  };
  var DIM_ORDER = ['type', 'form', 'colour', 'bleach', 'damage', 'death', 'complex'];

  var FINDINGS = [
    { img: 'col_massive.jpg', t: 'Massive brain colony (C2), live tissue', ev: ['00:02:15', '00:02:40', '00:03:58'], tag: 'supported' },
    { img: 'col_pale.jpg', t: 'Possible bleaching on a colony edge', ev: ['00:04:32'], tag: 'review', note: 'one view only' },
    { img: 'col_turf.jpg', t: 'Turf algae on rubble', ev: ['00:06:18'], tag: 'supported' },
    { img: 'col_encrust.jpg', t: 'Encrusting colony (C4), orange tissue', ev: ['00:00:12', '00:02:40'], tag: 'supported' },
    { img: null, t: 'Disease signs', ev: [], tag: 'uncertain', note: 'no supporting frame' }
  ];

  var ROUTES = [['haze', 'Haze, turbid water', 'physics restoration'], ['dark', 'Darkness', 'low-light enhancement'], ['cast', 'Color cast', 'calibrated white balance'],
                ['particles', 'Floating particles', 'multi-frame fusion'], ['skip', 'Clear frame', 'skip, no change']];
  var state = { step: 0, budget: 6, sel: 2, vsel: 4, regions: 'on', dim: 'type', finding: 0, vmode: 'cmp', cut: 50 };

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function keptSet() {
    var order = FRAMES.map(function (f, i) { return i; }).sort(function (a, b) { return FRAMES[b].score - FRAMES[a].score; });
    var keep = {}; order.slice(0, state.budget).forEach(function (i) { keep[i] = true; }); return keep;
  }

  function renderNav() {
    var nav = $('#stepnav'); nav.innerHTML = '';
    STEPS.forEach(function (s, i) {
      var b = el('button', 'step' + (i < state.step ? ' done' : ''));
      b.type = 'button';
      if (i === state.step) b.setAttribute('aria-current', 'step');
      b.innerHTML = '<span class="n">' + (i < state.step ? CHECK : String(i + 1)) + '</span><span class="t"><b></b><span></span></span>';
      b.querySelector('b').textContent = s[0]; b.querySelector('.t span').textContent = s[1];
      b.addEventListener('click', function () { go(i); });
      nav.appendChild(b);
    });
  }

  function renderFrames() {
    var keep = keptSet(), strip = $('#strip'); strip.innerHTML = '';
    FRAMES.forEach(function (f, i) {
      var b = el('button', 'fr ' + (keep[i] ? 'keep' : 'dropped') + (state.sel === i ? ' sel' : ''));
      b.type = 'button';
      b.setAttribute('aria-label', 'Frame ' + f.t + (keep[i] ? ', kept' : ', dropped'));
      b.innerHTML = '<img src="assets/' + (f.raw || f.img) + '" alt=""><span class="ts">' + f.t.slice(3) + '</span><span class="vb' + (f.vis < 0.5 ? ' low' : '') + '">' + f.vis.toFixed(2) + '</span>' + (keep[i] ? '' : '<span class="x" aria-hidden="true">×</span>');
      b.addEventListener('click', function () { state.sel = i; state.vsel = i; render(); });
      strip.appendChild(b);
    });
    var f = FRAMES[state.sel];
    $('#frameNote').innerHTML = '<b style="color:var(--ink)">' + f.t + '</b> · ' + (keep[state.sel] ? 'kept: ' : 'dropped: ') + esc(f.why) + ' · informativeness ' + f.score.toFixed(2) + ' · visibility ' + f.vis.toFixed(2) + (f.raw ? ' (enhanced to ' + f.venh.toFixed(2) + ')' : '');
    renderVis();
    var n = Object.keys(keep).length;
    $('#keptStat').textContent = n + ' / ' + FRAMES.length;
    $('#budgetv').textContent = n + ' of ' + FRAMES.length + ' frames';
    var isKey = state.sel === 2;
    $('#keyImg').src = isKey ? 'assets/key.jpg' : 'assets/' + f.img;  // regions run on the enhanced frame
    $('#keyCap').textContent = isKey ? 'keyframe 00:02:40 · 3 coral regions' : 'frame ' + f.t + (keep[state.sel] ? '' : ' (dropped)');
    $$('#keyFig .bx').forEach(function (b) { b.hidden = !(isKey && state.regions === 'on'); });
  }

  function renderVis() {
    var f = FRAMES[state.vsel], raw = f.raw || f.img, enh = f.img;
    $('#cmpEnh').src = 'assets/' + enh; $('#cmpRaw').src = 'assets/' + raw;
    var cut = state.vmode === 'raw' ? 100 : state.vmode === 'enh' ? 0 : state.cut;
    if (!f.raw) cut = 0;
    $('#cmpRaw').style.clipPath = 'inset(0 ' + (100 - cut) + '% 0 0)';
    $('#cmpLine').style.left = cut + '%'; $('#cmpLine').hidden = !(f.raw && state.vmode === 'cmp');
    $('#cmpSlider').disabled = !(f.raw && state.vmode === 'cmp');
    $('#cmpCapL').textContent = f.raw ? 'raw · vis ' + f.vis.toFixed(2) : f.t + ' · clear';
    $('#cmpCapL').hidden = f.raw ? cut === 0 : false;
    $('#cmpCapR').textContent = f.raw ? 'enhanced · vis ' + f.venh.toFixed(2) : 'no enhancement needed';
    $('#cmpCapR').hidden = f.raw ? cut === 100 : true;
    $('#visRaw').textContent = f.vis.toFixed(2);
    $('#visRawStat').className = 'stat' + (f.vis < 0.5 ? ' warn' : '');
    $('#visEnh').textContent = f.raw ? f.venh.toFixed(2) : '—';
    var key = f.fix || 'skip', ul = $('#route'); ul.innerHTML = '';
    ROUTES.forEach(function (r) {
      var li = el('li', r[0] === key ? 'on' : ''); li.innerHTML = '<b>' + r[1] + '</b><span>→ ' + r[2] + '</span>'; ul.appendChild(li);
    });
    $('#visNote').textContent = f.raw ? 'Score below 0.5, so the frame is enhanced before SAM 2 and the VLM. Its visibility score travels with it and sets its weight in fusion.'
      : 'Score above 0.5, so the frame passes through unchanged.';
  }

  function renderDims() {
    var chips = $('#dimChips'); chips.innerHTML = '';
    DIM_ORDER.forEach(function (k) {
      var b = el('button', 'chip pill'); b.type = 'button'; b.dataset.v = k; b.textContent = DIMS[k].label;
      b.setAttribute('aria-pressed', String(state.dim === k)); chips.appendChild(b);
    });
    var d = DIMS[state.dim], vw = $('#views'); vw.innerHTML = '';
    VIEWS.forEach(function (v, i) {
      var a = d.a[i], cls = a === '?' ? 'unk' : (a === d.fused || (d.warn && a === 'None') ? 'ok' : 'no');
      if (state.dim === 'type' && a === 'Brain') cls = 'ok';
      var c = el('div', 'vcard');
      c.innerHTML = '<img src="assets/' + v[0] + '" alt="Colony C2, ' + v[1] + '"><div class="a"><span class="muted small">' + v[1] + '</span><span class="ans ' + cls + '">' + (a === '?' ? 'abstain' : esc(a)) + '</span></div>';
      vw.appendChild(c);
    });
    var tr = $('#trace'); tr.innerHTML = '';
    d.trace.forEach(function (s, i) {
      var li = el('li');
      li.innerHTML = '<span class="n2">' + (i + 1) + '</span><span><b>' + s[0] + '</b>' + esc(s[1]) + (s[2] ? ' <span class="cite">[' + esc(s[2]) + ']</span>' : '') + '</span>';
      tr.appendChild(li);
    });
    $('#fusedAns').textContent = d.fused;
    $('#fusedAns').style.color = d.warn ? '#9A4F12' : 'var(--ink)';
    $('#fusedTag').textContent = d.agree[0] + ' of ' + d.agree[1] + ' views agree';
    $('#fusedTag').className = 'badge' + (d.warn ? ' bad' : '');
    $('#meter').className = 'meter' + (d.warn ? ' warn' : '');
    $('#meterI').style.width = Math.round(100 * d.agree[0] / 4) + '%';
    var abst = d.a.filter(function (x) { return x === '?'; }).length;
    $('#fusedNote').textContent = d.warn ? 'Views disagree, so the answer is passed to the report as "review" rather than stated as fact.'
      : (abst ? abst + ' view abstained because of low visibility (0.31), so it gets low weight; the answer uses the clear views.' : 'All views agree.');
    $('#promptDim').textContent = d.ask;
  }

  function renderReport() {
    var list = $('#findings'); list.innerHTML = '';
    FINDINGS.forEach(function (f, i) {
      var b = el('button', 'find'); b.type = 'button'; b.setAttribute('aria-pressed', String(state.finding === i));
      var ok = f.tag === 'supported';
      b.innerHTML = (f.img ? '<img src="assets/' + f.img + '" alt="">' : '<span class="q" aria-hidden="true">?</span>') +
        '<span class="t"><b>' + esc(f.t) + '</b><span class="muted small">' + (f.ev.length ? 'frames ' + f.ev.map(function (t) { return t.slice(3); }).join(', ') : '') + (f.note ? (f.ev.length ? ' · ' : '') + f.note : '') + '</span></span>' +
        '<span class="tagp ' + (ok ? 'ok' : 'rev') + '">' + f.tag + '</span>';
      b.addEventListener('click', function () { state.finding = i; renderReport(); });
      list.appendChild(b);
    });
    var f = FINDINGS[state.finding], hits = {}; f.ev.forEach(function (t) { hits[t] = true; });
    var strip = $('#evStrip'); strip.innerHTML = '';
    FRAMES.forEach(function (fr) {
      var d = el('div', 'fr' + (hits[fr.t] ? ' hit' : ''));
      d.innerHTML = '<img src="assets/' + fr.img + '" alt="Frame ' + fr.t + '"><span class="ts">' + fr.t.slice(3) + '</span>';
      if (!hits[fr.t]) d.querySelector('img').style.opacity = '0.45';
      strip.appendChild(d);
    });
    $('#evNote').textContent = f.ev.length ? f.ev.length + ' supporting frame' + (f.ev.length > 1 ? 's' : '') + ' for “' + f.t + '”' : 'No frame supports “' + f.t + '”, so it is reported as uncertain';
  }

  function render() {
    renderNav();
    $$('section.pane').forEach(function (p) { p.hidden = Number(p.dataset.step) !== state.step; });
    $$('[data-group]').forEach(function (g) {
      var key = g.dataset.group;
      $$('button[data-v]', g).forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.v === state[key])); });
    });
    renderFrames(); renderDims(); renderReport();
  }

  function go(i) {
    state.step = Math.max(0, Math.min(STEPS.length - 1, i));
    render();
    try { history.replaceState(null, '', '#step-' + (state.step + 1)); } catch (e) {}
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('button');
    if (!t) return;
    if (t.hasAttribute('data-next')) { go(state.step + 1); return; }
    if (t.hasAttribute('data-go')) { go(Number(t.dataset.go)); return; }
    var g = t.closest('[data-group]');
    if (g && t.dataset.v) { state[g.dataset.group] = t.dataset.v; render(); }
  });
  $('#cmpSlider').addEventListener('input', function (e) { state.cut = Number(e.target.value); renderVis(); });
  $('#budget').addEventListener('input', function (e) { state.budget = Number(e.target.value); renderFrames(); });
  $('#up').addEventListener('change', function (e) {
    var n = e.target.files.length;
    $('#dropmsg').textContent = n ? n + ' file' + (n > 1 ? 's' : '') + ' selected (demo: not uploaded)' : 'Drop video here or browse';
    $('#drop').classList.toggle('has', n > 0);
  });
  $('#csv').addEventListener('click', function () {
    var rows = [['finding', 'frames', 'status']].concat(FINDINGS.map(function (f) { return [f.t, f.ev.join(' '), f.tag]; }));
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'corallens_plotT3_findings.csv';
    document.body.appendChild(a); a.click(); a.remove();
  });
  $('#pdf').addEventListener('click', function () { window.print(); });

  var m = /#step-(\d)/.exec(location.hash);
  if (m) state.step = Math.max(0, Math.min(3, Number(m[1]) - 1));
  render();
})();
