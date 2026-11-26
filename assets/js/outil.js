/* Maquettes RF Digital — interactions de l'outil de gestion (boîte de réception, commandes, compatibilité).
   Tout est simulé dans le navigateur : aucun envoi, aucun cookie, aucun stockage, aucun appel réseau.
   Les données fictives sont lues dans <script type="application/json" id="donnees-fictives">. */
(function () {
  'use strict';
  var D = JSON.parse(document.getElementById('donnees-fictives').textContent);
  var euros = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
  function prix(n) { return euros.format(n).replace(/ | /g, ' '); }
  function el(tag, classe, texte) {
    var e = document.createElement(tag);
    if (classe) e.className = classe;
    if (texte != null) e.textContent = texte;
    return e;
  }
  function photo(src, classe, alt) {
    var i = el('img', classe);
    i.src = src; i.alt = alt || ''; i.loading = 'lazy'; i.referrerPolicy = 'no-referrer';
    i.addEventListener('error', function () { i.style.visibility = 'hidden'; });
    // eBay sert une petite image grise (80 px) quand la photo n'existe plus : on la masque aussi.
    i.addEventListener('load', function () { if (i.naturalWidth <= 100 && i.naturalHeight <= 100) i.style.visibility = 'hidden'; });
    return i;
  }

  // ---------- Menu : section courante ----------
  var liens = Array.prototype.slice.call(document.querySelectorAll('.o-menu a[href^="#"]'));
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (e) {
        if (!e.isIntersecting) return;
        liens.forEach(function (a) { a.setAttribute('aria-current', a.getAttribute('href') === '#' + e.target.id ? 'true' : 'false'); });
      });
    }, { rootMargin: '-35% 0px -60% 0px' });
    document.querySelectorAll('.o-bloc[id]').forEach(function (s) { obs.observe(s); });
  }

  // ---------- Boîte de réception ----------
  var fils = document.querySelector('[data-fils]');
  var lecture = document.querySelector('[data-lecture]');
  function ouvrirFil(i) {
    var m = D.messages[i];
    Array.prototype.forEach.call(fils.querySelectorAll('button'), function (b, j) { b.setAttribute('aria-selected', i === j ? 'true' : 'false'); });
    lecture.textContent = '';
    var tete = el('p', 'o-fil-plat', m.plateforme + ' · ' + m.client + ' · ' + m.heure);
    var bulle = el('p', 'o-bulle');
    bulle.appendChild(el('b', null, m.type === 'offre' ? 'Offre reçue' : 'Message reçu'));
    bulle.appendChild(document.createTextNode(m.texte));
    var prop = el('div', 'o-proposition');
    prop.appendChild(el('b', null, 'Réponse proposée par l’IA, à valider ou modifier'));
    var zone = el('textarea'); zone.value = m.reponse; zone.setAttribute('aria-label', 'Réponse proposée');
    var ligne = el('div', 'o-ligne-btn');
    var ok = el('button', 'btn btn-petit', m.type === 'offre' ? 'Valider la contre-offre' : 'Valider et envoyer');
    ok.type = 'button';
    var conf = el('p', 'o-confirme'); conf.setAttribute('role', 'status');
    ok.addEventListener('click', function () {
      conf.textContent = 'Réponse envoyée sur ' + m.plateforme + ' (simulation : rien n’est parti).';
      ok.disabled = true; zone.readOnly = true;
    });
    ligne.appendChild(ok); ligne.appendChild(el('span', 'fictif', 'Message fictif'));
    prop.appendChild(zone); prop.appendChild(ligne); prop.appendChild(conf);
    lecture.appendChild(tete); lecture.appendChild(bulle); lecture.appendChild(prop);
  }
  D.messages.forEach(function (m, i) {
    var li = el('li');
    var b = el('button'); b.type = 'button'; b.setAttribute('aria-selected', 'false');
    var l1 = el('span', 'o-fil-l1'); l1.appendChild(el('span', null, m.client)); l1.appendChild(el('span', null, m.heure));
    b.appendChild(l1);
    b.appendChild(el('span', 'o-fil-objet', m.objet));
    b.appendChild(el('span', 'o-fil-plat', m.plateforme));
    b.addEventListener('click', function () { ouvrirFil(i); });
    li.appendChild(b); fils.appendChild(li);
  });
  ouvrirFil(0);

  // ---------- Commandes ----------
  var STATUTS = [
    { id: 'a_preparer', nom: 'À préparer' },
    { id: 'equipe', nom: 'Chez l’équipe' },
    { id: 'expediee', nom: 'Expédiées' },
    { id: 'livree', nom: 'Livrées' }
  ];
  var onglets = document.querySelector('[data-onglets]');
  var corps = document.querySelector('[data-commandes]');
  var vide = document.querySelector('[data-commandes-vide]');
  var prepa = document.querySelector('[data-prepa]');
  var courant = 'a_preparer';

  function dessinerOnglets() {
    onglets.textContent = '';
    STATUTS.forEach(function (s) {
      var b = el('button'); b.type = 'button'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', s.id === courant ? 'true' : 'false');
      b.appendChild(document.createTextNode(s.nom));
      b.appendChild(el('span', 'o-nb', String(D.commandes.filter(function (c) { return c.statut === s.id; }).length)));
      b.addEventListener('click', function () { courant = s.id; prepa.hidden = true; dessiner(); });
      onglets.appendChild(b);
    });
  }
  function dessiner() {
    dessinerOnglets();
    corps.textContent = '';
    var liste = D.commandes.filter(function (c) { return c.statut === courant; });
    vide.hidden = liste.length > 0;
    liste.forEach(function (c) {
      var tr = el('tr');
      var art = el('td'); var d = el('div', 'o-article'); d.appendChild(photo(c.photo, 'o-mini')); d.appendChild(el('span', null, c.titre)); art.appendChild(d);
      tr.appendChild(el('td', 'o-num o-masque', c.numero));
      tr.appendChild(art);
      tr.appendChild(el('td', 'o-masque', c.client));
      tr.appendChild(el('td', 'o-masque', c.plateforme));
      tr.appendChild(el('td', 'o-num', prix(c.montant)));
      var act = el('td');
      var b = el('button', 'btn btn-petit ' + (c.statut === 'a_preparer' || c.statut === 'equipe' ? '' : 'btn-clair'));
      b.type = 'button';
      if (c.statut === 'a_preparer') {
        b.textContent = 'Envoyer à l’équipe';
        b.addEventListener('click', function () { c.statut = 'equipe'; courant = 'equipe'; dessiner(); });
      } else if (c.statut === 'equipe') {
        b.textContent = 'Préparer';
        b.addEventListener('click', function () { ouvrirPrepa(c); });
      } else {
        b.textContent = 'Voir le message';
        b.addEventListener('click', function () { ouvrirPrepa(c, true); });
      }
      act.appendChild(b); tr.appendChild(act);
      corps.appendChild(tr);
    });
  }

  function messageClient(c) {
    return 'Bonjour ' + c.prenom + ',\n\nVotre commande ' + c.numero + ' (« ' + c.titre + ' ») vient d’être expédiée. ' +
      'Vous trouverez ci-joint les photos de l’article et du colis, prises juste avant l’envoi.\n\n' +
      'À la réception, merci de vérifier l’état du colis en présence du livreur et, en cas de dommage, ' +
      'd’émettre des réserves sur le bon de livraison.\n\nMerci pour votre achat !\n' + D.signature;
  }

  function ouvrirPrepa(c, lectureSeule) {
    prepa.hidden = false;
    prepa.textContent = '';
    prepa.appendChild(el('h3', null, 'Préparation de la commande ' + c.numero));
    var etapes = el('ol', 'o-etapes');
    var noms = ['Photos', 'Dimensions et poids', 'Étiquette', 'Message au client'];
    var items = noms.map(function (n) { var li = el('li', null, n); etapes.appendChild(li); return li; });
    function fait(n) { for (var i = 0; i < n; i++) items[i].setAttribute('data-fait', ''); }
    prepa.appendChild(etapes);

    var photos = el('div', 'o-photos');
    ['Article', 'Article emballé', 'Colis fermé'].forEach(function (n, i) {
      var f = el('figure');
      if (i === 0) { f.className = 'o-ok'; f.appendChild(photo(c.photo, '', n)); }
      else if (lectureSeule) { f.className = 'o-ok'; f.appendChild(el('span', null, n + ' : photo prise')); }
      else {
        var b = el('button', 'btn btn-clair btn-petit', 'Photo : ' + n.toLowerCase()); b.type = 'button';
        b.addEventListener('click', function () { f.className = 'o-ok'; f.textContent = ''; f.appendChild(el('span', null, n + ' : photo prise (simulation)')); });
        f.appendChild(b);
      }
      photos.appendChild(f);
    });
    prepa.appendChild(photos);

    var mesures = el('div', 'o-mesures');
    [['Longueur (cm)', c.dimensions[0]], ['Largeur (cm)', c.dimensions[1]], ['Hauteur (cm)', c.dimensions[2]], ['Poids (kg)', c.poids]].forEach(function (m) {
      var l = el('label', null, m[0]); var i = el('input'); i.inputMode = 'decimal'; i.value = String(m[1]).replace('.', ',');
      if (lectureSeule) i.readOnly = true;
      l.appendChild(i); mesures.appendChild(l);
    });
    prepa.appendChild(mesures);
    prepa.appendChild(el('p', 'fictif', 'Dimensions, poids, client et numéro de suivi fictifs'));

    var zoneEtiquette = el('div');
    var zoneMessage = el('div');
    var statut = el('p', 'o-confirme'); statut.setAttribute('role', 'status');

    function montrerEtiquette() {
      var e = el('div', 'o-etiquette');
      e.appendChild(el('strong', null, 'Étiquette d’expédition créée'));
      e.appendChild(el('span', null, 'Destinataire : ' + c.client));
      e.appendChild(el('span', null, 'Colis : ' + c.dimensions.join(' × ') + ' cm, ' + String(c.poids).replace('.', ',') + ' kg'));
      e.appendChild(el('span', null, 'Suivi : ' + c.suivi));
      e.appendChild(el('div', 'o-code'));
      zoneEtiquette.textContent = ''; zoneEtiquette.appendChild(e);
    }
    function montrerMessage() {
      zoneMessage.textContent = '';
      zoneMessage.appendChild(el('p', 'o-message-client', messageClient(c)));
    }

    if (lectureSeule) {
      fait(4); montrerEtiquette(); montrerMessage();
      prepa.appendChild(zoneEtiquette); prepa.appendChild(zoneMessage);
      return prepa.scrollIntoView({ block: 'start' });
    }
    fait(0);
    var bEtiq = el('button', 'btn', 'Créer l’étiquette'); bEtiq.type = 'button';
    var bEnvoi = el('button', 'btn', 'Envoyer les photos et le message au client'); bEnvoi.type = 'button'; bEnvoi.hidden = true;
    bEtiq.addEventListener('click', function () {
      fait(3); montrerEtiquette(); bEtiq.hidden = true; bEnvoi.hidden = false;
      montrerMessage();
      statut.textContent = 'Étiquette créée. Le message au client est prêt.';
    });
    bEnvoi.addEventListener('click', function () {
      fait(4); c.statut = 'expediee'; bEnvoi.disabled = true;
      statut.textContent = 'Photos et message envoyés au client (simulation : rien n’est parti). Commande passée dans « Expédiées ».';
      setTimeout(function () { courant = 'expediee'; dessiner(); }, 1600);
    });
    var ligne = el('div', 'o-ligne-btn'); ligne.appendChild(bEtiq); ligne.appendChild(bEnvoi);
    prepa.appendChild(ligne); prepa.appendChild(zoneEtiquette); prepa.appendChild(zoneMessage); prepa.appendChild(statut);
    prepa.scrollIntoView({ block: 'start' });
  }
  dessiner();

  // ---------- Compatibilité ----------
  var formCompat = document.querySelector('[data-compat]');
  if (formCompat) formCompat.addEventListener('submit', function (e) {
    e.preventDefault();
    formCompat.parentNode.querySelector('[data-compat-resultat]').hidden = false;
  });
})();
