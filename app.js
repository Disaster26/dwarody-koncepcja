(function(){
  // menu mobilne
  var burger=document.getElementById('burger'),menu=document.getElementById('menu');
  function zamknij(){menu.classList.remove('otwarte');burger.setAttribute('aria-expanded','false');burger.setAttribute('aria-label','Otwórz menu');}
  burger.addEventListener('click',function(){
    var o=menu.classList.toggle('otwarte');
    burger.setAttribute('aria-expanded',o?'true':'false');
    burger.setAttribute('aria-label',o?'Zamknij menu':'Otwórz menu');
  });
  menu.querySelectorAll('a').forEach(function(a){a.addEventListener('click',zamknij);});
  document.addEventListener('keydown',function(e){if(e.key==='Escape')zamknij();});

  // aktywna pozycja menu
  var linki=[].slice.call(menu.querySelectorAll('a'));
  var mapa={'top':0,'o-stronie':0,'drzewa':1,'herby':2,'archiwum':3,'spokrewnione':4,'kontakt':5};
  var sekcje=['o-stronie','drzewa','herby','archiwum','spokrewnione','kontakt'].map(function(id){return document.getElementById(id);});
  function ustaw(){
    var y=window.scrollY+window.innerHeight*0.35,akt='top';
    sekcje.forEach(function(s){if(s&&s.offsetTop<=y)akt=s.id;});
    if((window.innerHeight+window.scrollY)>=document.body.scrollHeight-4)akt='kontakt';
    linki.forEach(function(a,i){a.classList.toggle('on',i===mapa[akt]);});
  }
  window.addEventListener('scroll',ustaw,{passive:true});ustaw();

  // karuzele: palec, mysz, strzalki, licznik
  document.querySelectorAll('[data-karuzela]').forEach(function(k){
    var tor=k.querySelector('.kar-tor'),l=k.querySelector('.kar-l'),p=k.querySelector('.kar-p'),licz=k.querySelector('.kar-licznik');
    var el=[].slice.call(tor.children);
    function krok(){return el[0].getBoundingClientRect().width+20;}
    function stan(){
      var i=Math.round(tor.scrollLeft/krok());
      var max=tor.scrollWidth-tor.clientWidth-2;
      l.disabled=tor.scrollLeft<=2;p.disabled=tor.scrollLeft>=max;
      licz.textContent=Math.min(i+1,el.length)+' / '+el.length;
    }
    l.addEventListener('click',function(){tor.scrollBy({left:-krok(),behavior:'smooth'});});
    p.addEventListener('click',function(){tor.scrollBy({left:krok(),behavior:'smooth'});});
    tor.addEventListener('scroll',stan,{passive:true});
    tor.addEventListener('keydown',function(e){
      if(e.key==='ArrowRight'){tor.scrollBy({left:krok(),behavior:'smooth'});e.preventDefault();}
      if(e.key==='ArrowLeft'){tor.scrollBy({left:-krok(),behavior:'smooth'});e.preventDefault();}
    });
    var down=false,x0=0,s0=0,ruch=0;
    tor.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse')return;down=true;ruch=0;x0=e.clientX;s0=tor.scrollLeft;});
    window.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-x0;ruch=Math.max(ruch,Math.abs(dx));if(ruch>4){tor.classList.add('ciagnie');tor.scrollLeft=s0-dx;}});
    window.addEventListener('pointerup',function(){if(!down)return;down=false;if(tor.classList.contains('ciagnie')){tor.classList.remove('ciagnie');var i=Math.round(tor.scrollLeft/krok());tor.scrollTo({left:i*krok(),behavior:'smooth'});}});
    tor.addEventListener('click',function(e){if(ruch>4){e.preventDefault();e.stopPropagation();}},true);
    tor.addEventListener('dragstart',function(e){e.preventDefault();});
    window.addEventListener('resize',stan);stan();
  });

  // formularz (podglad - bez wysylki)
  var f=document.getElementById('formularz'),info=document.getElementById('form-info');
  f.addEventListener('submit',function(e){
    e.preventDefault();
    if(!f.checkValidity()){info.textContent='Proszę uzupełnić imię, e-mail i wiadomość.';return;}
    info.textContent='To podgląd strony - w docelowej wersji wiadomość trafi na adres nomlas@wp.pl.';
  });

  var rok=document.getElementById('rok');if(rok)rok.textContent=new Date().getFullYear();
})();
