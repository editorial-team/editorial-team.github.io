// Small interactions: the portal and app tile follow the mouse, the side index tracks the section in view.
(function () {
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // the arch rings spread with the mouse and the artwork inside drifts the other way
  var hero = document.querySelector('.hero'), arch = document.getElementById('arch');
  if (hero && arch && !REDUCE) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      arch.style.setProperty('--px', (x * 9).toFixed(1) + 'px'); arch.style.setProperty('--py', (y * 6).toFixed(1) + 'px');
      arch.style.setProperty('--ix', (x * -18).toFixed(1) + 'px'); arch.style.setProperty('--iy', (y * -14).toFixed(1) + 'px');
    });
    hero.addEventListener('mouseleave', function () { ['--px', '--py', '--ix', '--iy'].forEach(function (k) { arch.style.setProperty(k, '0px'); }); });
  }
  // side index
  var links = [].slice.call(document.querySelectorAll('.index a'));
  if ('IntersectionObserver' in window && links.length) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) links.forEach(function (a) { a.classList.toggle('on', a.dataset.for === e.target.id); }); });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) { var s = document.getElementById(a.dataset.for); if (s) io.observe(s); });
  }
  // the index steps aside while it would sit over the red noise panels or the red footer
  var idx = document.querySelector('.index'), reds = [].slice.call(document.querySelectorAll('.noise-frame, .foot')), raf = 0;
  function aside() {
    raf = 0; var r = idx.getBoundingClientRect();
    idx.classList.toggle('off', reds.some(function (el) { var b = el.getBoundingClientRect(); return b.top < r.bottom && b.bottom > r.top; }));
  }
  if (idx) { addEventListener('scroll', function () { if (!raf) raf = requestAnimationFrame(aside); }, { passive: true }); addEventListener('resize', aside); aside(); }
})();

// ---------- scroll experience ----------
(function () {
  var REDUCE = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // smooth wheel scrolling (touch keeps the native feel); anchor links glide too
  var target = scrollY, cur = scrollY, running = false, root = document.documentElement;
  function max() { return root.scrollHeight - innerHeight; }
  function loop() {
    cur += (target - cur) * .1;
    if (Math.abs(target - cur) < .5) { cur = target; running = false; } else requestAnimationFrame(loop);
    scrollTo(0, cur);
  }
  if (!REDUCE) {
    root.style.scrollBehavior = 'auto';
    addEventListener('wheel', function (e) {
      if (e.ctrlKey) return;
      e.preventDefault();
      if (!running) cur = scrollY;
      target = Math.max(0, Math.min(max(), target + (e.deltaMode === 1 ? e.deltaY * 40 : e.deltaY)));
      if (!running) { running = true; requestAnimationFrame(loop); }
    }, { passive: false });
    addEventListener('scroll', function () { if (!running) target = cur = scrollY; }, { passive: true });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('a[href^="#"]'); if (!a) return;
      var el = document.getElementById(a.getAttribute('href').slice(1)); if (!el && a.getAttribute('href') !== '#top') return;
      e.preventDefault(); cur = scrollY; target = el ? Math.max(0, el.getBoundingClientRect().top + scrollY - 52) : 0;
      if (!running) { running = true; requestAnimationFrame(loop); }
    });
  }
  // ruler ticks slide with the page; the percentage rolls digit by digit
  var ticks = document.querySelector('.ticks'), cols = [].slice.call(document.querySelectorAll('.odo .col'));
  function onScroll() {
    var p = Math.round(scrollY / Math.max(1, max()) * 100), s = ('00' + p).slice(-3);
    if (ticks) ticks.style.setProperty('--tk', (-scrollY * .5).toFixed(0) + 'px');
    cols.forEach(function (c, i) { c.style.transform = 'translateY(' + (-s.charAt(i) * 1.2) + 'em)'; });
    // lines draw themselves while their section passes
    draws.forEach(function (d) {
      var r = d.el.getBoundingClientRect(), t = Math.max(0, Math.min(1, (innerHeight * .9 - r.top) / (r.height + innerHeight * .4)));
      d.path.forEach(function (p) { p.style.strokeDashoffset = (p._len * (1 - t)).toFixed(1); });
    });
  }
  var draws = [].map.call(document.querySelectorAll('svg.draw'), function (svg) {
    var ps = [].slice.call(svg.querySelectorAll('path'));
    ps.forEach(function (p) { p._len = p.getTotalLength() * 4; p.style.strokeDasharray = p._len; p.style.strokeDashoffset = p._len; });
    return { el: svg, path: ps };
  });
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
  // reveals, staggered inside a group
  var rv = [].slice.call(document.querySelectorAll('.rv'));
  if (REDUCE || !('IntersectionObserver' in window)) { rv.forEach(function (e) { e.classList.add('in'); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target;
      if (el.classList.contains('cell')) el.style.setProperty('--rd', ([].indexOf.call(el.parentNode.children, el) % 3) * .08 + 's');
      el.classList.add('in'); io.unobserve(el);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  rv.forEach(function (e) { io.observe(e); });
})();
