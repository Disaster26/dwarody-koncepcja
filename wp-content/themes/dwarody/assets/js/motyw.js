/* Dwa Rody - menu, tabele, formularz, drzewo w skrócie, powiększanie zdjęć. Treść (także drzewa) wyświetlana tak, jak jest zapisana w panelu. Bez bibliotek i bez zewnętrznych serwerów. */
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
  /* ---------- drzewo w skrócie: główna linia rodu zbudowana z numeracji drzewa w treści (0., 1., 1.1., 1.1.1. ...) ---------- */
  /* Treść drzewa zostaje bez zmian; schemat czyta ją przy każdym wyświetleniu, więc po podmianie drzewa w panelu zmienia się sam. */
  (function () {
    var sek = d.querySelector('[data-skrot]'), tresc = d.querySelector('.strona-drzewo .tresc');
    if (!sek || !tresc) return;
    var BLOK = /^(P|DIV|H[1-6]|PRE|LI|UL|OL|TABLE|TR|TD|BLOCKQUOTE|HR)$/, PDF = /\.pdf(\?|#|$)/i;
    var linie = [], cur = { t: '', a: null };
    function nowa() { if (cur.t.replace(/\s+/g, '')) linie.push(cur); cur = { t: '', a: null }; }
    function idz(n, wPre) {
      for (var c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) {
          var cz = wPre ? c.nodeValue.split('\n') : [c.nodeValue.replace(/\n/g, ' ')];
          for (var i = 0; i < cz.length; i++) {
            if (i) nowa();
            if (!cz[i]) continue;
            cur.t += cz[i];
            if (!cur.a && cz[i].trim()) { var a = c.parentNode.closest('a[href]'); if (a && PDF.test(a.getAttribute('href'))) cur.a = a; }
          }
        } else if (c.nodeType === 1) {
          if (c.tagName === 'BR') { nowa(); continue; }
          if (c.tagName === 'SCRIPT' || c.tagName === 'STYLE') continue;
          var b = BLOK.test(c.tagName);
          if (b) nowa();
          idz(c, wPre || c.tagName === 'PRE');
          if (b) nowa();
        }
      }
    }
    idz(tresc, false); nowa();

    /* wiersz-kontynuacja (zaczyna się od odstępów, bez numeru, a wiersz wyżej urywa się na dywizie, przecinku, "+" albo niezamkniętym nawiasie) to dalszy ciąg wpisu - dołącz go; wyraz przeniesiony z dywizem ("Ewe-" + "lina") sklej */
    var NUMER = /^(\d{1,3}(?:\s*[.,]\s*\d{1,3})*)\s*[.,]?\s*(?=[^\d\s.,])/;
    linie = linie.reduce(function (acc, l) {
      var pop = acc[acc.length - 1], t = l.t.replace(/ /g, ' ');
      var p = pop ? pop.t.replace(/\s+$/, '') : '', n = t.replace(/^\s+/, '');
      var urwany = /[-,;+(\[]$/.test(p) || (p.split('(').length > p.split(')').length) || (p.split('[').length > p.split(']').length);
      if (pop && urwany && /^\s/.test(t) && !NUMER.test(t.trim()) && NUMER.test(pop.t.replace(/ /g, ' ').replace(/\s+/g, ' ').trim())) {
        pop.t = /[a-ząćęłńóśźż]-$/.test(p) && /^[a-ząćęłńóśźż]/.test(n) ? p.slice(0, -1) + n : p + ' ' + n;
      } else acc.push(l);
      return acc;
    }, []);

    var osoby = {}, kolej = [];
    linie.forEach(function (l) {
      var t = l.t.replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
      var m = t.match(/^(\d{1,3}(?:\s*[.,]\s*\d{1,3})*)\s*[.,]?\s*(?=[^\d\s.,])/);
      if (!m) return;
      var klucz = m[1].split(/\s*[.,]\s*/).join('.');
      if (osoby[klucz]) return;
      var reszta = t.slice(m[0].length);
      var o = { k: klucz, gl: klucz.split('.').length, t: reszta, a: l.a };
      var nawias = reszta.indexOf('(');
      var ur = reszta.search(/\bur\.|,|;/);
      var kon = nawias > 0 && (ur < 0 || nawias < ur) ? nawias : (ur > 0 ? ur : Math.min(reszta.length, 40));
      o.imie = reszta.slice(0, kon).replace(/[,;\s]+$/, '').trim();
      var sym = reszta.match(/\(([^)]{1,12})\)/); o.sym = sym ? sym[1].trim() : '';
      var wlasne = reszta.indexOf('+') >= 0 ? reszta.slice(0, reszta.indexOf('+')) : reszta; /* daty osoby, nie małżonka */
      var u = wlasne.match(/\bur\.\s*([^,;+\[\]]+)/); o.ur = u ? u[1].trim() : '';
      var z = wlasne.match(/\bzm\.\s*([^,;+\[\]]+)/); o.zm = z ? z[1].trim() : '';
      var rok = o.ur.match(/(ok\.\s*)?(\d{4})/); o.rok = rok ? (rok[1] ? 'ok. ' : '') + rok[2] : '';
      var plus = reszta.indexOf('+');
      if (plus >= 0) {
        var mal = reszta.slice(plus).split(/[\[;]/)[0].replace(/[,\s]+$/, '').trim();
        o.mal = mal.length > 90 ? mal.slice(0, 88).replace(/\s+\S*$/, '') + '…' : mal;
      }
      if (!o.imie) return;
      osoby[klucz] = o; kolej.push(o);
    });
    if (kolej.length < 5) return;

    /* osoba docelowa: autor strony (Witold, ur. 1939/1940), w drzewie Jaxa-Bąkowskich jego matka (żona Leona Salmonowicza); w innym drzewie najdłuższa linia */
    var cel = null, wzory = [/^Witold\b.*\b(1939|1940)\b/, /\+\s*Leon Salmonowicz/];
    for (var w = 0; w < wzory.length && !cel; w++) for (var i = 0; i < kolej.length; i++) if (wzory[w].test(kolej[i].imie + ' ' + kolej[i].t)) { cel = kolej[i]; break; }
    if (!cel) kolej.forEach(function (o) { if (o.k.charAt(0) !== '0' && (!cel || o.gl > cel.gl)) cel = o; });
    if (!cel) return;
    var sciezka = [], cz = cel.k.split('.');
    if (cz[0] !== '0') kolej.forEach(function (o) { if (o.k.charAt(0) === '0' && o.k.split('.').every(function (x, j) { return j === 0 || x === '1'; })) sciezka.push(o); });
    sciezka.sort(function (a, b) { return a.gl - b.gl; });
    for (var g = 1; g <= cz.length; g++) { var o = osoby[cz.slice(0, g).join('.')]; if (o) sciezka.push(o); }
    if (sciezka.length < 3) return;

    var lista = sek.querySelector('.skrot-lista');
    function el(tag, kl, txt) { var e = d.createElement(tag); if (kl) e.className = kl; if (txt) e.textContent = txt; return e; }
    sciezka.forEach(function (o, n) {
      var li = el('li', 'skrot-kr' + (o === cel ? ' skrot-cel' : ''));
      var nr = el('div', 'skrot-nr'); nr.appendChild(el('b', '', String(n + 1))); nr.appendChild(el('span', '', 'pokolenie')); li.appendChild(nr);
      li.appendChild(el('span', 'skrot-rok', o.rok || ' '));
      var imie;
      if (o.a) { imie = el('a', 'skrot-imie', o.imie); imie.href = o.a.href; imie.target = '_blank'; imie.rel = 'noopener'; imie.title = 'Biogram (PDF)'; }
      else imie = el('span', 'skrot-imie', o.imie);
      li.appendChild(imie);
      if (o.sym) li.appendChild(el('span', 'skrot-sym', '(' + o.sym + ')'));
      var daty = [o.ur && o.ur.replace(/\s+/g, ' ') !== o.rok ? 'ur. ' + o.ur : '', o.zm ? 'zm. ' + o.zm : ''].filter(Boolean).join(', ');
      if (daty) li.appendChild(el('span', 'skrot-daty', daty));
      if (o.mal) li.appendChild(el('span', 'skrot-mal', o.mal));
      lista.appendChild(li);
    });
    var dr = sek.getAttribute('data-dwa-rody');
    if (dr) { var p = el('p', 'skrot-dalej'), a = el('a', '', 'Gdzie spotykają się dwa rody - schemat na stronie głównej'); a.href = dr; p.appendChild(a); sek.appendChild(p); }
    sek.hidden = false;
    var os = sek.querySelector('.skrot-os');
    function przew() { sek.classList.toggle('przewijana', os.scrollWidth > os.clientWidth + 4); }
    przew(); window.addEventListener('resize', przew);
  })();

  /* ---------- zdjęcia z treści: powiększenie po kliknięciu (bez osobnych galerii) ---------- */
  (function () {
    var IMG = /\.(jpe?g|png|gif|webp)(\?.*)?$/i;
    var zdjecia = [];
    [].forEach.call(d.querySelectorAll('.tresc img'), function (img) {
      var a = img.closest('a');
      if (a && !IMG.test(a.getAttribute('href') || '') && !/attachment_id=|\/attachment\//.test(a.getAttribute('href') || '')) return; // odnośnik do PDF lub strony zostaje
      var w = img.getAttribute('width') ? parseInt(img.getAttribute('width'), 10) : img.naturalWidth;
      if (w && w < 60) return;
      var src = a && IMG.test(a.getAttribute('href')) ? a.href : (img.currentSrc || img.src);
      var cel = a || img;
      if (!a) { cel.setAttribute('tabindex', '0'); cel.setAttribute('role', 'button'); cel.style.cursor = 'zoom-in'; }
      else a.classList.add('lb-link');
      cel.setAttribute('aria-label', 'Powiększ zdjęcie: ' + (img.alt || ''));
      var nr = zdjecia.push({ src: src, alt: img.alt || '' }) - 1;
      cel.addEventListener('click', function (e) { e.preventDefault(); otworz(nr); });
      if (!a) cel.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); otworz(nr); } });
    });
    if (!zdjecia.length) return;
    var lb, obraz, opis, licznik, poprzedni, teraz = 0;
    function zbuduj() {
      lb = d.createElement('div'); lb.className = 'lb'; lb.hidden = true;
      lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true'); lb.setAttribute('aria-label', 'Powiększone zdjęcie');
      lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure>' +
        '<button type="button" class="lb-zamknij" aria-label="Zamknij">×</button>' +
        (zdjecia.length > 1 ? '<button type="button" class="lb-wstecz" aria-label="Poprzednie zdjęcie">‹</button><button type="button" class="lb-dalej" aria-label="Następne zdjęcie">›</button><p class="lb-licznik"></p>' : '');
      d.body.appendChild(lb);
      obraz = lb.querySelector('img'); opis = lb.querySelector('figcaption'); licznik = lb.querySelector('.lb-licznik');
      lb.querySelector('.lb-zamknij').addEventListener('click', zamknij);
      if (zdjecia.length > 1) {
        lb.querySelector('.lb-wstecz').addEventListener('click', function () { pokaz(teraz - 1); });
        lb.querySelector('.lb-dalej').addEventListener('click', function () { pokaz(teraz + 1); });
      }
      lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') zamknij(); });
      var x0 = null;
      lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
      lb.addEventListener('touchend', function (e) { if (x0 === null || zdjecia.length < 2) return; var dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) pokaz(teraz + (dx < 0 ? 1 : -1)); x0 = null; });
      d.addEventListener('keydown', function (e) {
        if (lb.hidden) return;
        if (e.key === 'Escape') { e.stopPropagation(); zamknij(); }
        else if (e.key === 'ArrowRight') pokaz(teraz + 1);
        else if (e.key === 'ArrowLeft') pokaz(teraz - 1);
      }, true);
    }
    function pokaz(i) {
      teraz = (i + zdjecia.length) % zdjecia.length;
      obraz.src = zdjecia[teraz].src; obraz.alt = zdjecia[teraz].alt; opis.textContent = zdjecia[teraz].alt;
      if (licznik) licznik.textContent = (teraz + 1) + ' / ' + zdjecia.length;
    }
    function otworz(i) {
      if (!lb) zbuduj();
      poprzedni = d.activeElement;
      pokaz(i); lb.hidden = false; d.documentElement.classList.add('lb-blokada');
      requestAnimationFrame(function () { lb.classList.add('otwarty'); });
      lb.querySelector('.lb-zamknij').focus();
    }
    function zamknij() {
      lb.classList.remove('otwarty'); lb.hidden = true; d.documentElement.classList.remove('lb-blokada');
      if (poprzedni && poprzedni.focus) poprzedni.focus();
    }
  })();
})();
