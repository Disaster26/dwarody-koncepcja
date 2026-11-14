/* Dwa Rody - menu, tabele, formularz. Treść (także drzewa) wyświetlana tak, jak jest zapisana w panelu. Bez bibliotek i bez zewnętrznych serwerów. */
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

  /* ---------- grupy menu (Salmonowicz herbu Szaszor, Jaxa-Bąkowski herbu Gryf) ---------- */
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
