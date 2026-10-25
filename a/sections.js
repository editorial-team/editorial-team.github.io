// Interactive parts: before/after slider, the live demo, the calculator, and the boxes that drift with the scroll.
(function () {
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (id) { return document.getElementById(id); };

  // numbers are built from outlined digit shapes (no fonts ship with the page)
  var SETS = {};
  [].forEach.call(document.querySelectorAll('#glyphs [data-set]'), function (set) {
    var m = {}; [].forEach.call(set.children, function (s) { m[s.dataset.g] = s.firstElementChild; }); SETS[set.dataset.set] = m;
  });
  function num(el, str, set) {
    if (!el) return; el.textContent = ''; el.setAttribute('aria-label', str);
    String(str).split('').forEach(function (c) { var g = SETS[set][c]; if (g) el.appendChild(g.cloneNode(true)); });
  }
  function fmt(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  // ---------- before / after ----------
  var box = $('cmpBox');
  if (box) {
    var rng = box.querySelector('input');
    var set = function () { box.style.setProperty('--cut', rng.value + '%'); };
    rng.addEventListener('input', set); set();
    // the layers drift with the mouse: -1..1 across the box, each layer by its own depth
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      box.addEventListener('mousemove', function (e) {
        var r = box.getBoundingClientRect();
        box.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
        box.style.setProperty('--my', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
      });
      box.addEventListener('mouseleave', function () { box.style.setProperty('--mx', 0); box.style.setProperty('--my', 0); });
    }
  }

  // ---------- live demo ----------
  var demo = $('demo-app');
  if (demo) {
    var COLS = ['#8A4FF7', '#E4A31F', '#FF2338', '#1CA47F', '#E7553E'];
    var rows = [].slice.call(demo.querySelectorAll('.tl-row:not(.a1) .lane')), wave = demo.querySelector('.lane.wave');
    for (var w = 0; w < 120; w++) { var b = document.createElement('i'); b.style.height = (18 + Math.abs(Math.sin(w * .7) * Math.cos(w * .23)) * 78) + '%'; wave.appendChild(b); }
    var go = $('demoGo'), fill = $('demoFill'), timers = [];
    demo.dataset.state = 'idle';
    function clear() {
      timers.forEach(clearTimeout); timers = [];
      rows.forEach(function (l) { l.innerHTML = ''; }); wave.classList.remove('on');
      [].forEach.call(demo.querySelectorAll('.tl-marks span'), function (s) { s.classList.remove('on'); });
      fill.style.width = '0'; demo.dataset.state = 'idle'; go.disabled = false;
    }
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
    [].forEach.call(demo.querySelectorAll('.dp-tabs button'), function (b) {
      b.addEventListener('click', function () {
        demo.dataset.mode = b.dataset.mode; clear();
        [].forEach.call(demo.querySelectorAll('.dp-tabs button'), function (o) { o.classList.toggle('on', o === b); o.setAttribute('aria-selected', o === b); });
      });
    });
    go.addEventListener('click', function () {
      if (demo.dataset.state === 'done') { clear(); return; }
      clear(); demo.dataset.state = 'busy'; go.disabled = true;
      var clip = demo.dataset.mode === 'clip', marks = [].slice.call(demo.querySelectorAll(clip ? '.tl-marks.m-clip span' : '.tl-marks.m-film span'));
      demo.dataset.phase = clip ? 'beat' : 'take';
      var n = 0, T = 2600;
      for (var k = 1; k <= 41; k++) (function (k) { later(function () { num($('takeN'), String(k), 'sm'); fill.style.width = (k / 41 * 100) + '%'; }, k * (T / 41)); })(k);
      marks.forEach(function (m, i) { later(function () { m.classList.add('on'); }, 300 + i * 260); });
      // clips land row by row, a little like the plugin filling the timeline
      var per = [marks.length, marks.length + 1, marks.length];
      rows.forEach(function (lane, r) {
        for (var i = 0; i < per[r]; i++) (function (lane, r, i) {
          // each clip shows a real frame, with its label colour along the top like in Premiere
          var c = document.createElement('span'); c.className = 'clipb'; c.style.setProperty('--c', COLS[(i + r * 2) % COLS.length]);
          c.style.backgroundImage = 'url(a/img/fr' + ((i * 3 + r * 4) % 9 + 1) + '.webp)';
          lane.appendChild(c); later(function () { c.classList.add('on'); }, 700 + (n++) * 120);
        })(lane, r, i);
      });
      later(function () { wave.classList.add('on'); }, 900);
      later(function () { demo.dataset.state = 'done'; go.disabled = false; fill.style.width = '100%'; }, T + 600);
    });
  }

  // ---------- calculator ----------
  var r0 = $('r0'), r1 = $('r1'), r2 = $('r2');
  if (r0) {
    var shown = 0, raf = 0;
    function calc() {
      var p = +r0.value, h = +r1.value, rate = +r2.value, hours = p * h * 12 * .9;
      num($('v0'), String(p), 'sm'); num($('v1'), String(h), 'sm'); num($('v2'), '₪' + rate, 'sm');
      num($('nVal'), '₪' + fmt(hours * rate), 'sm');
      // the big number counts to its new value
      cancelAnimationFrame(raf); var from = shown, t0 = performance.now();
      (function tick(t) { var k = Math.min(1, (t - t0) / 600); k = 1 - Math.pow(1 - k, 3); shown = from + (hours - from) * k; num($('nBig'), String(Math.round(shown)), 'big'); if (k < 1) raf = requestAnimationFrame(tick); })(t0);
    }
    [r0, r1, r2].forEach(function (r) { r.addEventListener('input', calc); }); calc();
  }

  // ---------- the product boxes drift and tilt with the scroll ----------
  var arts = [].slice.call(document.querySelectorAll('.box-art'));
  if (!REDUCE && arts.length) {
    addEventListener('scroll', function () {
      arts.forEach(function (a) {
        var r = a.getBoundingClientRect(), k = (r.top + r.height / 2 - innerHeight / 2) / innerHeight;
        a.style.transform = 'translateY(' + (k * -60).toFixed(1) + 'px) rotate(' + (k * -6).toFixed(2) + 'deg)';
      });
    }, { passive: true });
  }
})();
