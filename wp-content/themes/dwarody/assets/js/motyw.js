/* Dwa Rody - menu, karuzele, czytelne drzewa, formularz. Bez bibliotek i bez zewnętrznych serwerów. */
(function () {
  'use strict';
  var d = document;

  /* ---------- menu mobilne ---------- */
  var burger = d.getElementById('burger'), menu = d.getElementById('menu');
  function zamknijMenu() {
    if (!menu) return;
    menu.classList.remove('otwarte');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Otwórz menu');
  }
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var o = menu.classList.toggle('otwarte');
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      burger.setAttribute('aria-label', o ? 'Zamknij menu' : 'Otwórz menu');
      if (o) { /* na telefonie grupa z bieżącą stroną od razu rozwinięta */
        [].forEach.call(menu.querySelectorAll('.m-przodek > .m-rozwin'), function (b) { ustawGrupe(b, true); });
      }
    });
    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a && a.getAttribute('href') && a.getAttribute('href').charAt(0) === '#') zamknijMenu();
    });
  }

  /* ---------- grupy menu (Drzewa, Herby, Archiwum) ---------- */
  function ustawGrupe(btn, otworz) {
    var li = btn.parentNode;
    li.classList.toggle('otwarte', otworz);
    btn.setAttribute('aria-expanded', otworz ? 'true' : 'false');
  }
  var przyciski = [].slice.call(d.querySelectorAll('.m-rozwin'));
  przyciski.forEach(function (b) {
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      var otworz = b.getAttribute('aria-expanded') !== 'true';
      if (window.matchMedia('(min-width:1101px)').matches) przyciski.forEach(function (x) { if (x !== b) ustawGrupe(x, false); });
      ustawGrupe(b, otworz);
    });
  });
  d.addEventListener('click', function (e) {
    if (!window.matchMedia('(min-width:1101px)').matches) return;
    if (!e.target.closest('.m-ma-pod')) przyciski.forEach(function (x) { ustawGrupe(x, false); });
  });
  d.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var otwarty = przyciski.filter(function (x) { return x.getAttribute('aria-expanded') === 'true'; })[0];
    przyciski.forEach(function (x) { ustawGrupe(x, false); });
    if (otwarty && window.matchMedia('(min-width:1101px)').matches) otwarty.focus();
    else zamknijMenu();
  });
  /* po wyjściu klawiaturą z grupy zamknij ją (komputer) */
  [].forEach.call(d.querySelectorAll('.menu .m-lista > .m-ma-pod'), function (li) {
    li.addEventListener('focusout', function (e) {
      if (!window.matchMedia('(min-width:1101px)').matches) return;
      if (e.relatedTarget && !li.contains(e.relatedTarget)) { var b = li.querySelector('.m-rozwin'); if (b) ustawGrupe(b, false); }
    });
  });

  /* ---------- karuzele: palec, mysz, strzałki, licznik ---------- */
  [].forEach.call(d.querySelectorAll('[data-karuzela]'), function (k) {
    var tor = k.querySelector('.kar-tor'), l = k.querySelector('.kar-l'), p = k.querySelector('.kar-p'), licz = k.querySelector('.kar-licznik');
    var el = [].slice.call(tor.children);
    if (!el.length) return;
    function krok() { return el[0].getBoundingClientRect().width + 20; }
    function stan() {
      var i = Math.round(tor.scrollLeft / krok()), max = tor.scrollWidth - tor.clientWidth - 2;
      l.disabled = tor.scrollLeft <= 2; p.disabled = tor.scrollLeft >= max;
      licz.textContent = Math.min(i + 1, el.length) + ' / ' + el.length;
    }
    l.addEventListener('click', function () { tor.scrollBy({ left: -krok(), behavior: 'smooth' }); });
    p.addEventListener('click', function () { tor.scrollBy({ left: krok(), behavior: 'smooth' }); });
    tor.addEventListener('scroll', stan, { passive: true });
    tor.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { tor.scrollBy({ left: krok(), behavior: 'smooth' }); e.preventDefault(); }
      if (e.key === 'ArrowLeft') { tor.scrollBy({ left: -krok(), behavior: 'smooth' }); e.preventDefault(); }
    });
    var down = false, x0 = 0, s0 = 0, ruch = 0;
    tor.addEventListener('pointerdown', function (e) { if (e.pointerType !== 'mouse') return; down = true; ruch = 0; x0 = e.clientX; s0 = tor.scrollLeft; });
    window.addEventListener('pointermove', function (e) { if (!down) return; var dx = e.clientX - x0; ruch = Math.max(ruch, Math.abs(dx)); if (ruch > 4) { tor.classList.add('ciagnie'); tor.scrollLeft = s0 - dx; } });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; if (tor.classList.contains('ciagnie')) { tor.classList.remove('ciagnie'); tor.scrollTo({ left: Math.round(tor.scrollLeft / krok()) * krok(), behavior: 'smooth' }); } });
    tor.addEventListener('click', function (e) { if (ruch > 4) { e.preventDefault(); e.stopPropagation(); } }, true);
    tor.addEventListener('dragstart', function (e) { e.preventDefault(); });
    window.addEventListener('resize', stan); stan();
  });

  /* ---------- drzewa: każda osoba w osobnym wierszu z wcięciem wg pokolenia ----------
     Treść zapisana w bazie się nie zmienia - podział na wiersze robi przeglądarka przy wyświetlaniu.
     Wiersz zaczyna się numerem, np. "1.1.2. Jan (A2) ...". */
  if (d.body.classList.contains('strona-drzewo')) {
    var NR = /^\s*((?:\d+[a-z]?\.)+)\s*/i;
    var akapity = [].slice.call(d.querySelectorAll('.strona-drzewo .tresc > p'));
    akapity.forEach(function (p) {
      var brs = p.querySelectorAll('br');
      if (brs.length < 2 || !NR.test(p.textContent)) return;
      var frag = d.createDocumentFragment(), g = 0;
      var rng = d.createRange();
      var granice = [].slice.call(brs);
      granice.push(null);
      var start = { node: p, offset: 0 };
      granice.forEach(function (br) {
        rng.setStart(start.node, start.offset);
        if (br) rng.setEndBefore(br); else rng.setEnd(p, p.childNodes.length);
        var kawal = rng.cloneContents();
        if (br) { rng.setStartAfter(br); start = { node: rng.startContainer, offset: rng.startOffset }; }
        var div = d.createElement('div');
        div.className = 'dr-linia';
        div.appendChild(kawal);
        [].forEach.call(div.querySelectorAll('br'), function (b) { b.parentNode.removeChild(b); });
        var tekst = div.textContent.replace(/ /g, ' ');
        if (!tekst.trim()) return;
        var m = tekst.match(NR);
        if (m) {
          g = Math.max(0, m[1].split('.').length - 2);
          /* numer w osobnym, szarym elemencie */
          var w = d.createTreeWalker(div, NodeFilter.SHOW_TEXT, null), t;
          while ((t = w.nextNode())) {
            if (!t.nodeValue.trim()) continue;
            var mm = t.nodeValue.match(NR);
            if (mm) {
              var nr = d.createElement('span'); nr.className = 'dr-nr'; nr.textContent = mm[1];
              t.nodeValue = t.nodeValue.slice(mm[0].length);
              t.parentNode.insertBefore(nr, t);
              t.parentNode.insertBefore(d.createTextNode(' '), t);
            }
            break;
          }
        }
        div.style.setProperty('--g', Math.min(g, 12));
        if (m && g === 0) div.classList.add('dr-g0');
        frag.appendChild(div);
      });
      if (frag.childNodes.length > 1) p.parentNode.replaceChild(frag, p);
    });
  }

  /* ---------- szerokie tabele: podpowiedź, że można je przesunąć w bok ---------- */
  function podpowiedzi() {
    [].forEach.call(d.querySelectorAll('.tabela-przewin'), function (t) {
      var szeroka = t.scrollWidth > t.clientWidth + 4;
      var p = t.previousElementSibling, jest = p && p.classList.contains('tabela-podpowiedz');
      if (szeroka && !jest) { p = d.createElement('p'); p.className = 'tabela-podpowiedz'; p.textContent = 'Tabela jest szersza niż ekran - można ją przesunąć w bok →'; t.parentNode.insertBefore(p, t); }
      if (!szeroka && jest) p.parentNode.removeChild(p);
    });
  }
  podpowiedzi(); window.addEventListener('resize', podpowiedzi);

  /* ---------- formularz: świeży token przy pierwszym wpisywaniu, prosta kontrola pól ---------- */
  [].forEach.call(d.querySelectorAll('[data-formularz]'), function (f) {
    var pobrano = false;
    f.addEventListener('focusin', function () {
      if (pobrano || !window.DWR || !window.fetch) return;
      pobrano = true;
      fetch(DWR.ajax + '?action=dwarody_token', { credentials: 'same-origin', cache: 'no-store' })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !j.n) return;
          f.elements.dwr_nonce.value = j.n;
          /* znacznik czasu wymieniany tylko, gdy strona była długo w pamięci podręcznej (ponad 20 godzin) */
          var stary = parseInt(String(f.elements.t.value).split('.')[0], 10) || 0;
          if (j.t && Date.now() / 1000 - stary > 72000) f.elements.t.value = j.t;
        })
        .catch(function () {});
    });
    f.addEventListener('submit', function (e) {
      if (f.checkValidity && !f.checkValidity()) {
        e.preventDefault();
        var info = f.querySelector('.form-info-js');
        if (!info) { info = d.createElement('p'); info.className = 'form-info form-blad form-info-js'; info.setAttribute('role', 'status'); f.insertBefore(info, f.firstChild); }
        info.textContent = 'Proszę uzupełnić imię i nazwisko, poprawny adres e-mail i treść wiadomości.';
        var zle = f.querySelector(':invalid'); if (zle) zle.focus();
        return;
      }
      var b = f.querySelector('button[type=submit]');
      if (b) { b.disabled = true; b.textContent = 'Wysyłanie…'; }
    });
    window.addEventListener('pageshow', function () { var b = f.querySelector('button[type=submit]'); if (b) { b.disabled = false; b.textContent = 'Wyślij wiadomość'; } });
    var kom = f.querySelector('.form-info');
    if (kom) { setTimeout(function () { f.scrollIntoView({ block: 'start', behavior: 'auto' }); kom.focus({ preventScroll: true }); }, 60); }
  });
})();
