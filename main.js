/* Уборка — одна уборщица: меню, «что делаю», калькулятор, отзывы, появление блоков */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- мобильное меню ---------- */
  var burger = $('#burger'), nav = $('#nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', open);
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); burger.setAttribute('aria-expanded', false); }
    });
  }

  /* ---------- уведомление ---------- */
  var toast = $('#toast'), tTimer;
  function say(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('on');
    clearTimeout(tTimer);
    tTimer = setTimeout(function () { toast.classList.remove('on'); }, 4200);
  }

  /* ---------- что входит: уровень 1 / 2 / 3 ---------- */
  var tabs = $('#tabs'), zones = $('#zones');
  function showLevel(l) {
    $$('.tab', tabs).forEach(function (t) { t.setAttribute('aria-selected', t.dataset.l == l); });
    $$('li[data-l]', zones).forEach(function (li) {
      var n = +li.dataset.l;
      li.hidden = n > l;
      li.classList.toggle('add', n === l && l > 1);
    });
  }
  if (tabs && zones) {
    tabs.addEventListener('click', function (e) {
      var t = e.target.closest('.tab'); if (t) showLevel(+t.dataset.l);
    });
    showLevel(1);
  }

  /* ---------- калькулятор ---------- */
  var calc = $('#calc'), dataEl = $('#calc-data');
  if (calc && dataEl) {
    var D = JSON.parse(dataEl.textContent), W = D.words;
    var area = $('#area'), areaO = $('#area-o'), winO = $('#win'), wins = 0;
    var box = $('#extras');
    D.extras.forEach(function (x) {
      var l = document.createElement('label');
      l.className = 'chk';
      l.innerHTML = '<input type="checkbox" value="' + x.id + '"><span>' + x.name + '<em>+' + x.price + '</em></span>';
      box.appendChild(l);
    });
    var fmt = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); };
    var plural = function (n, f) {
      var a = n % 10, b = n % 100;
      if (f.length === 2) return n === 1 ? f[0] : f[1];
      return a === 1 && b !== 11 ? f[0] : a >= 2 && a <= 4 && (b < 12 || b > 14) ? f[1] : f[2];
    };
    var state = function () {
      var key = $('input[name=type]:checked', calc).value, t = D.types[key], m2 = +area.value;
      var ex = $$('#extras input:checked').map(function (i) { return D.extras.filter(function (x) { return x.id === i.value; })[0]; });
      var sum = Math.max(t.min, m2 * t.rate) + wins * D.window + ex.reduce(function (s, x) { return s + x.price; }, 0);
      sum = Math.round(sum / 50) * 50;
      // убирает один человек: время растёт с площадью, большие объекты — на 2 дня
      var hours = m2 / t.speed + wins * 0.25 + ex.length * 0.4;
      var lo = Math.max(2, Math.floor(hours)), hi = Math.max(lo + 1, Math.ceil(hours + 0.5));
      var crew = 1;
      return { key: key, t: t, m2: m2, ex: ex, sum: sum, crew: crew, lo: lo, hi: hi };
    };
    var message = function (s) {
      return calc.dataset.msg
        .replace('{type}', s.t.msg)
        .replace('{area}', s.m2)
        .replace('{windows}', wins ? ', ' + W.windows.replace('{n}', wins) : '')
        .replace('{extras}', s.ex.length ? ', ' + W.extras + s.ex.map(function (x) { return x.name.toLowerCase(); }).join(', ') : '')
        .replace('{sum}', fmt(s.sum));
    };
    var wa = $('.js-wa', calc), waBase = wa.getAttribute('href');
    var render = function () {
      var s = state();
      areaO.textContent = s.m2 + ' ' + (W.m2 || 'м²');
      winO.textContent = wins;
      $('#sum').textContent = fmt(s.sum);
      $('#r-type').textContent = s.t.name;
      $('#r-time').textContent = s.hi > 10 ? W.twoDays : s.lo + '–' + s.hi + ' ' + plural(s.hi, W.hours);
      wa.href = waBase + '?text=' + encodeURIComponent(message(s));
    };
    calc.addEventListener('input', render);
    calc.addEventListener('change', render);
    $$('.stepper button', calc).forEach(function (b) {
      b.addEventListener('click', function () { wins = Math.min(40, Math.max(0, wins + +b.dataset.d)); render(); });
    });
    // Viber не принимает текст в ссылке на чат — копируем его в буфер
    $('.js-viber', calc).addEventListener('click', function () {
      var text = message(state());
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(function () { say(calc.dataset.copied); }, function () {});
      }
    });
    // ссылки «Рассчитать» на карточках выбирают вид уборки
    $$('[data-pick]').forEach(function (a) {
      a.addEventListener('click', function () {
        var r = $('input[name=type][value="' + a.dataset.pick + '"]', calc);
        if (r) { r.checked = true; render(); }
      });
    });
    render();
  }

  /* ---------- до / после ---------- */
  $$('.cmp').forEach(function (c) {
    var r = $('input', c);
    var set = function () { c.style.setProperty('--x', r.value + '%'); };
    r.addEventListener('input', set); set();
  });

  /* ---------- отзывы ---------- */
  var track = $('#rev');
  if (track) {
    $$('.rev__arr').forEach(function (b) {
      b.addEventListener('click', function () {
        var card = $('.r', track);
        track.scrollBy({ left: +b.dataset.dir * (card.offsetWidth + 20), behavior: 'smooth' });
      });
    });
  }

  /* ---------- появление при прокрутке ---------- */
  var items = $$('.rv');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in'); });
  }
})();
