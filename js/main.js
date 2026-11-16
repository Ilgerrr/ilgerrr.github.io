/* ilger. — intro, scroll, work, player */
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = document.documentElement;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* ---------- Copy (language picked from the browser, no switcher) ---------- */
  const I18N = {
    en: {
      skip: 'Skip to work',
      'nav.home': 'Home', 'nav.work': 'Work', 'nav.about': 'About', 'nav.contact': 'Contact',
      'hero.title': 'I make videos|that stay with you.',
      statement: 'Festival, brand and event videos from Belgium. Aftermovies, day recaps cut on location, and reels made for the feed.',
      play: 'Watch', 'index.title': 'All projects',
      'reels.title': 'Posted by|the brands themselves.', 'reels.one': '1 reel', 'reels.many': '{n} reels',
      'svc.title': 'What I|make.', 'svc.example': 'Example',
      'svc.after.t': 'Aftermovies', 'svc.after.d': 'Your festival or event in one film people want to watch again. I shoot and edit it.',
      'svc.recap.t': 'Day recaps', 'svc.recap.d': 'Cut on location and online the same evening, while everyone is still talking about it.',
      'svc.social.t': 'Social content and reels', 'svc.social.d': "Reels for festivals and brand activations, made for the brand's own feed.",
      'svc.corp.t': 'Company films and testimonials', 'svc.corp.d': 'Your company, your people or your event, clearly on screen. Reportages and interviews too.',
      'svc.ad.t': 'Commercials', 'svc.ad.d': 'From idea and shot list to the final export: a short film for your brand.',
      'svc.live.t': 'Live and multicam', 'svc.live.d': 'DJ sets and shows filmed with several cameras and cut tight to the music.',
      'svc.edit.t': 'Editing, colour and motion', 'svc.edit.d': 'You have the footage, I make the edit. Colour grading and motion graphics on their own too.',
      'wa.cta': 'Send a message', 'wa.msg': 'Hi Ilger, I have a question about a video.',
      'more.title': 'Want to|see more?', 'more.cta': 'All projects',
      'work.title': 'All|projects.', 'work.count': '{n} projects',
      'work.doctitle': 'All projects by ilger. Aftermovies, reels and brand films',
      'work.desc': 'Every video by Ilger Albert: aftermovies, festival reels for Tomorrowland, Best Kept Secret and Ostend Beach, company films and commercials.',
      "nav.cases": "Cases",
      "cases.title": "Three|cases.",
      "cases.lede": "How I approached three projects, and the choices I made along the way.",
      "cases.doctitle": "Cases by ilger. How I approached three projects",
      "cases.desc": "Three cases by Ilger Albert: brand reels at Tomorrowland, day recaps for Tuttobene cut on location, and a spec commercial for Ferrari.",
      "case.ctx": "Context",
      "case.prob": "The problem",
      "case.angle": "My angle",
      "case.result": "The result",
      "c1.title": "Five brands.|One festival.|No time to wait.",
      "c1.kind": "Brand reels for FD Productions",
      "c1.one": "Vertical brand reels for Coca-Cola, Absolut, Lidl and Loop at Tomorrowland, posted by Tomorrowland itself.",
      "c1.ctx": "FD Productions filmed the brand activations at Tomorrowland 2026 with a full camera crew. I was the editor. The Coca-Cola reel I cut together with Florian Degreve.",
      "c1.prob": "Time. At a festival everything has to happen fast. The footage comes in, the brand wants its reel, and the moment is gone before you know it.",
      "c1.angle": "Five films, five different moments: a home party, a bakery rave, United We Dance. Every reel had to feel like its brand, and all of them like Tomorrowland.",
      "c1.result": "Five reels between 16 and 35 seconds, on Tomorrowland's own channels. Speed is part of the craft.",
      "c2.title": "My first giant|production,|cut on location.",
      "c2.kind": "Day recaps for Race Service",
      "c2.one": "Day recap, opening film and teaser for Tuttobene, edited on site while more than twenty shooters kept the footage coming.",
      "c2.ctx": "Race Service covered Tuttobene with a big crew: more than twenty shooters in total. I was the editor on location.",
      "c2.prob": "Time again, and volume. Twenty-plus shooters means a mountain of footage. It was my first production of that size, so I had to find my way in quickly.",
      "c2.angle": "You can only cut fast if you know where everything is. Getting into the flow of a production this size came first, the edit came after.",
      "c2.result": "Three films of around 25 seconds, posted by Race Service. The client was very satisfied.",
      "c3.title": "Our first|commercial.|Treated like|the real thing.",
      "c3.kind": "Spec commercial, own project",
      "c3.one": "A 30-second spec commercial for Ferrari, shot on cinema lenses with the kind of gear you find on big sets.",
      "c3.ctx": "No client, no brief. A spec commercial I made with Sebbe Van Hove, Simon Haex and Giel Driesen.",
      "c3.prob": "It was our first commercial, and I wanted to show I could really do it. Not a school assignment, a commercial.",
      "c3.angle": "Treat it as a real production: cinema lenses, equipment that also gets used on big sets, a real crew with camera assistants.",
      "c3.result": "DOP and camera together with Sebbe, edit and colour grading myself. Ferrari and Formula 1 are at the top of my dream list.",
      'player.fs': 'Fullscreen', 'player.fsexit': 'Exit fullscreen',
      'cr.for': 'For', 'cr.with': 'Together with', 'cr.production': 'Production by', 'clips.many': '{n} clips',
      'player.next': 'Next', 'player.prev': 'Previous', 'player.scroll': 'Scroll for the next one', 'player.swipe': 'Swipe up for the next one', 'pause.on': 'Pause videos', 'pause.off': 'Play videos',
      'about.title': 'From the set|to the export.',
      'about.body': "I'm Ilger Albert, a freelance videographer and editor from Flanders. I film and edit aftermovies, festival and event content, brand films and social reels.",
      'contact.title': "Let's work|together.",
      'contact.lede': 'Tell me about the event, the date and where the video ends up.',
      'contact.copy': 'Copy', 'contact.copied': 'Copied ✓', 'contact.cta': 'Send a mail',
      'footer.top': 'Back to top',
      'foot.tag': 'Videos that|stay with you.', 'foot.place': 'Flanders, Belgium', 'foot.talk': 'Talk to me', 'foot.rights': 'All rights reserved',
      'player.close': 'Close', 'player.soundoff': 'Sound off', 'player.soundon': 'Sound on',
      'cursor.play': 'Watch',
      title: 'ilger. Aftermovies, festival videos and brand films in Belgium',
      desc: 'Freelance videographer and editor from Flanders, Belgium. Aftermovies, same-day recaps, reels and brand films for Tomorrowland, Best Kept Secret and more.'
    },
    nl: {
      skip: 'Ga naar werk',
      'nav.home': 'Home', 'nav.work': 'Werk', 'nav.about': 'Over', 'nav.contact': 'Contact',
      'hero.title': "Ik maak video's|die blijven hangen.",
      statement: "Festival-, merk- en eventvideo's uit België. Aftermovies, dayrecaps gemonteerd op locatie en reels gemaakt voor de feed.",
      play: 'Bekijk', 'index.title': 'Alle projecten',
      'reels.title': 'Gepost door|de merken zelf.', 'reels.one': '1 reel', 'reels.many': '{n} reels',
      'svc.title': 'Wat ik|maak.', 'svc.example': 'Voorbeeld',
      'svc.after.t': 'Aftermovies', 'svc.after.d': 'Je festival of event in één film die mensen willen terugzien. Ik film en monteer.',
      'svc.recap.t': 'Dayrecaps', 'svc.recap.d': 'Gemonteerd op locatie en dezelfde avond online, terwijl iedereen er nog over praat.',
      'svc.social.t': 'Social content en reels', 'svc.social.d': 'Reels voor festivals en merkactivaties, gemaakt voor de feed van het merk zelf.',
      'svc.corp.t': 'Bedrijfsfilms en testimonials', 'svc.corp.d': 'Je bedrijf, je mensen of je event, helder in beeld. Ook reportages en interviews.',
      'svc.ad.t': 'Commercials', 'svc.ad.d': 'Van idee en shotlist tot de laatste export: een korte film voor je merk.',
      'svc.live.t': 'Live en multicam', 'svc.live.d': "DJ-sets en optredens met meerdere camera's gefilmd en strak op de muziek gemonteerd.",
      'svc.edit.t': 'Montage, kleur en motion', 'svc.edit.d': 'Jij hebt de beelden, ik maak de edit. Ook kleurcorrectie en motion graphics apart.',
      'wa.cta': 'Stuur een bericht', 'wa.msg': 'Hoi Ilger, ik heb een vraag over een video.',
      'more.title': 'Wil je|meer zien?', 'more.cta': 'Alle projecten',
      'work.title': 'Alle|projecten.', 'work.count': '{n} projecten',
      'work.doctitle': 'Alle projecten van ilger. Aftermovies, reels en bedrijfsfilms',
      'work.desc': "Alle video's van Ilger Albert: aftermovies, festivalreels voor Tomorrowland, Best Kept Secret en Ostend Beach, bedrijfsfilms en commercials.",
      "nav.cases": "Cases",
      "cases.title": "Drie|cases.",
      "cases.lede": "Hoe ik drie projecten aanpakte, en welke keuzes ik onderweg maakte.",
      "cases.doctitle": "Cases van ilger. Hoe ik drie projecten aanpakte",
      "cases.desc": "Drie cases van Ilger Albert: brand reels op Tomorrowland, dayrecaps voor Tuttobene gemonteerd op locatie, en een spec commercial voor Ferrari.",
      "case.ctx": "Context",
      "case.prob": "Het probleem",
      "case.angle": "Mijn aanpak",
      "case.result": "Het resultaat",
      "c1.title": "Vijf merken.|Eén festival.|Geen tijd om te wachten.",
      "c1.kind": "Brand reels voor FD Productions",
      "c1.one": "Verticale brand reels voor Coca-Cola, Absolut, Lidl en Loop op Tomorrowland, gepost door Tomorrowland zelf.",
      "c1.ctx": "FD Productions filmde de brand activations op Tomorrowland 2026 met een volledige cameraploeg. Ik was de editor. De Coca-Cola-reel monteerde ik samen met Florian Degreve.",
      "c1.prob": "Tijd. Op een festival moet alles snel gaan. De footage komt binnen, het merk wil zijn reel, en voor je het weet is het moment voorbij.",
      "c1.angle": "Vijf films, vijf verschillende momenten: een home party, een bakery rave, United We Dance. Elke reel moest aanvoelen als zijn merk, en allemaal als Tomorrowland.",
      "c1.result": "Vijf reels van 16 tot 35 seconden, op de kanalen van Tomorrowland zelf. Snelheid hoort bij het vak.",
      "c2.title": "Mijn eerste gigantische|productie, gemonteerd|op locatie.",
      "c2.kind": "Dayrecaps voor Race Service",
      "c2.one": "Dayrecap, openingsfilm en teaser voor Tuttobene, gemonteerd ter plaatse terwijl meer dan twintig shooters footage bleven aanleveren.",
      "c2.ctx": "Race Service draaide Tuttobene met een grote ploeg: in totaal meer dan twintig shooters. Ik was de editor op locatie.",
      "c2.prob": "Opnieuw tijd, en volume. Meer dan twintig shooters betekent een berg footage. Het was mijn eerste productie van die grootte, dus ik moest er snel in komen.",
      "c2.angle": "Je kan pas snel monteren als je weet waar alles staat. Eerst in de flow van zo'n grote productie komen, daarna monteren.",
      "c2.result": "Drie films van ongeveer 25 seconden, gepost door Race Service. De klant was zeer tevreden.",
      "c3.title": "Onze eerste|commercial.|Behandeld als|het echte werk.",
      "c3.kind": "Spec commercial, eigen project",
      "c3.one": "Een spec commercial van 30 seconden voor Ferrari, gedraaid met cinemalenzen en het soort materiaal dat je op grote sets vindt.",
      "c3.ctx": "Geen klant, geen briefing. Een spec commercial die ik maakte met Sebbe Van Hove, Simon Haex en Giel Driesen.",
      "c3.prob": "Het was onze eerste commercial, en ik wilde tonen dat ik het echt kon. Geen schoolopdracht, een commercial.",
      "c3.angle": "Het behandelen als een echte productie: cinemalenzen, materiaal dat ook op grote sets gebruikt wordt, een echte crew met camera-assistenten.",
      "c3.result": "DOP en camera samen met Sebbe, montage en kleurcorrectie zelf. Ferrari en Formule 1 staan bovenaan mijn droomlijst.",
      'player.fs': 'Volledig scherm', 'player.fsexit': 'Volledig scherm sluiten',
      'cr.for': 'Voor', 'cr.with': 'Samen met', 'cr.production': 'Productie door', 'clips.many': '{n} clips',
      'player.next': 'Volgende', 'player.prev': 'Vorige', 'player.scroll': 'Scroll voor de volgende', 'player.swipe': 'Swipe omhoog voor de volgende', 'pause.on': "Pauzeer video's", 'pause.off': "Speel video's af",
      'about.title': 'Van de set|tot de export.',
      'about.body': 'Ik ben Ilger Albert, freelance videograaf en editor uit Vlaanderen. Ik film en monteer aftermovies, festival- en eventcontent, bedrijfsfilms en social reels.',
      'contact.title': 'Laten we|samenwerken.',
      'contact.lede': 'Vertel me over het event, de datum en waar de video terechtkomt.',
      'contact.copy': 'Kopieer', 'contact.copied': 'Gekopieerd ✓', 'contact.cta': 'Stuur een mail',
      'footer.top': 'Naar boven',
      'foot.tag': "Video's die|blijven hangen.", 'foot.place': 'Vlaanderen, België', 'foot.talk': 'Praat met mij', 'foot.rights': 'Alle rechten voorbehouden',
      'player.close': 'Sluiten', 'player.soundoff': 'Geluid uit', 'player.soundon': 'Geluid aan',
      'cursor.play': 'Bekijk',
      title: "ilger. Aftermovies, festivalvideo's en bedrijfsfilms in België",
      desc: 'Freelance videograaf en editor uit Vlaanderen. Aftermovies, dayrecaps die dezelfde avond online staan, reels en bedrijfsfilms voor Tomorrowland, BKS en meer.'
    }
  };
  const lang = root.lang === 'nl' ? 'nl' : 'en';
  const t = (k) => I18N[lang][k] ?? I18N.en[k] ?? '';
  const L = (o) => (o ? o[lang] || o.en || '' : '');
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

  /* ---------- Projects -> page ---------- */
  const PROJECTS = window.PROJECTS || [];
  const FILMS = {};
  // credits: roles in the visitor's language, Ilger's own name gets a hand-drawn underline
  const ROLES = {
    en: { director: 'Director', creative: 'Creative', producer: 'Producer', dop: 'DOP', camera: 'Camera', cam2: '2nd camera', ac: 'AC', ac1: '1st AC', gaffer: 'Gaffer', dit: 'DIT', drone: 'Drone', edit: 'Edit', sound: 'Sound design', color: 'Color grading', vfx: 'VFX', motion: 'Motion graphics', photo: 'Photography', mua: 'MUA' },
    nl: { director: 'Regie', creative: 'Creatie', producer: 'Producer', dop: 'DOP', camera: 'Camera', cam2: '2nd camera', ac: 'AC', ac1: '1st AC', gaffer: 'Gaffer', dit: 'DIT', drone: 'Drone', edit: 'Montage', sound: 'Sounddesign', color: 'Color grading', vfx: 'VFX', motion: 'Motion graphics', photo: 'Fotografie', mua: 'MUA' }
  };
  const roleName = (r) => ROLES[lang][r] || ROLES.en[r] || r;
  const ME = 'Ilger Albert';
  // a different hand-drawn underline each time the name shows up
  const MARKS = [
    '<svg class="me__line" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M3 9.5c38-4.2 77-5.6 116-4.4 25 .8 50 2.6 78 1.4"/></svg>',
    '<svg class="me__line" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M3 9.5c38-4.2 77-5.6 116-4.4 25 .8 50 2.6 78 1.4"/><path pathLength="1" d="M16 12.6c44-2.4 96-2.8 150-.6"/></svg>',
    '<svg class="me__line" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M2 9q8-6 16 0t16 0 16 0 16 0 16 0 16 0 16 0 16 0 16 0 16 0 16 0 16 0"/></svg>',
    '<svg class="me__line" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M4 11.5c40-1 90-3.6 140-5.6 18-.7 36-1.2 54-1.6"/></svg>',
    '<svg class="me__line" viewBox="0 0 200 14" preserveAspectRatio="none" aria-hidden="true"><path pathLength="1" d="M3 7.5c48-2.6 110-3.6 190-1.8-30 1.6-92 3.4-152 6"/></svg>'
  ];
  let markN = 0;
  const nameHtml = (n) => (n === ME ? `<span class="me">${esc(n)}${MARKS[markN++ % MARKS.length]}</span>` : esc(n));
  // short version (player, homepage): roles with the same people merged ("DOP & Camera: ...")
  const myTeam = (p) => {
    const out = [];
    (p.team || []).forEach(([r, ...n]) => {
      const prev = out[out.length - 1];
      if (prev && prev.names.join('|') === n.join('|')) prev.roles.push(r); else out.push({ roles: [r], names: n });
    });
    return out;
  };
  const rolesLabel = (rs) => rs.map(roleName).join(' & ');
  const creditLines = (p) => [
    ...(p.production ? [`${t('cr.production')} ${p.production}`] : []), ...(p.note ? [L(p.note)] : []),
    ...myTeam(p).map((g) => `${rolesLabel(g.roles)}: ${g.names.join(', ')}`)
  ];
  const creditHtml = (p) => [
    ...(p.production ? [`${esc(t('cr.production'))} ${esc(p.production)}`] : []), ...(p.note ? [esc(L(p.note))] : []),
    ...myTeam(p).map((g) => `${esc(rolesLabel(g.roles))}: ${g.names.map(nameHtml).join(', ')}`)
  ];
  const arOf = (r) => { const [a, b] = String(r || '16:9').split(':').map(Number); return a / b; };
  const lab = (x) => (typeof x === 'object' ? L(x) : x || '');
  PROJECTS.forEach((p) => {
    const ar = arOf(p.ratio);
    const crew = (q) => ({ credits: creditLines(q).join('\n'), creditsHtml: creditHtml(q).map((c) => `<span class="pc-line">${c}</span>`).join('') });
    const base = { ...crew(p), wide: ar > 1, ar, title: p.title };
    if (p.films) {
      const group = p.films.map((f) => f.slug);
      // a film with its own crew (e.g. one reel shot by someone else) shows that crew in the player
      p.films.forEach((f) => { FILMS[f.slug] = { ...base, ...(f.team ? crew({ ...p, team: f.team }) : {}), sub: lab(f.label), group: group.length > 1 ? group : null, src: `assets/video/${f.slug}.mp4`, poster: `assets/img/${f.slug}.jpg` }; });
    } else {
      FILMS[p.slug] = { ...base, sub: L(p.kind), src: `assets/video/${p.slug}.mp4`, poster: `assets/img/${p.slug}.jpg` };
    }
  });

  const mediaBtn = (slug, label, len, tag) => `<button class="feat__media" data-play="${slug}" aria-label="${esc(t('play'))}: ${esc(label)}">
      <video muted playsinline loop preload="none" poster="assets/img/${slug}.jpg" data-src="assets/video/${slug}-preview.mp4"></video>
      <span class="feat__tag small"><span class="play" aria-hidden="true"></span><span>${esc(tag || t('play'))}</span><span class="num">${len || ''}</span></span>
    </button>`;

  const page = document.body.dataset.page || 'home';
  const featEl = $('#featured');
  if (featEl) featEl.innerHTML = PROJECTS.filter((p) => p.featured).map((p) => `<article class="feat">
      <div class="feat__meta">
        <h3 class="display feat__title" data-reveal>${esc(p.title)}</h3>
        <p class="feat__info small"><span class="feat__kind"><span>${esc(L(p.kind))}</span><span class="num">${p.year || ''}</span></span>${creditHtml(p).map((c) => `<span class="feat__credit">${c}</span>`).join('')}</p>
      </div>
      ${p.films ? `<div class="feat__trio">${p.films.map((f) => mediaBtn(f.slug, `${p.title} ${lab(f.label)}`, f.len, lab(f.label))).join('')}</div>` : mediaBtn(p.slug, p.title, p.len)}
    </article>`).join('');

  // vertical work the clients posted on their own channels
  const reelsEl = $('#reels');
  if (reelsEl) reelsEl.innerHTML = PROJECTS.filter((p) => p.reel).map((p) => {
    const cover = p.films[0];
    const n = p.films.length;
    const tag = n > 1 ? t('reels.many').replace('{n}', n) : t('play');
    return `<article class="reel">
      ${mediaBtn(cover.slug, p.title, n > 1 ? '' : cover.len, tag)}
      <p class="reel__cap"><span class="reel__name">${esc(p.title)}</span><span class="reel__by small">@${esc(p.by)}</span></p>
    </article>`;
  }).join('');

  // everything I can take on, each with a real example you can open
  const SERVICES = [
    ['after', 'ostend-aftermovie', 'Ostend Beach'],
    ['recap', 'tutto-dayrecap', 'Tuttobene'],
    ['social', 'tml-absolut', 'Tomorrowland × Absolut'],
    ['corp', 'bnix-testimonials', 'BNIX 30 jaar'],
    ['ad', 'spec-ferrari', 'Spec Ferrari'],
    ['live', 'cdrc-1', 'Simon Haex × CDRC']
  ];
  const svcEl = $('#svc');
  if (svcEl) svcEl.innerHTML = SERVICES.map(([k, slug, ex]) => `<li><button class="row svc__row" data-play="${slug}" data-preview="assets/video/${slug}-preview.mp4" data-tall="${FILMS[slug] && !FILMS[slug].wide ? 1 : 0}">
      <span class="svc__main"><span class="row__title">${esc(t(`svc.${k}.t`))}</span><span class="svc__desc">${esc(t(`svc.${k}.d`))}</span></span>
      <span class="svc__ex small"><span class="play" aria-hidden="true"></span><span>${esc(t('svc.example'))}: ${esc(ex)}</span></span>
    </button></li>`).join('');

  const rowsList = $('#rows');
  if (rowsList) rowsList.innerHTML = PROJECTS.map((p, i) => {
    const play = p.films ? p.films[0].slug : p.slug;
    return `<li><button class="row" data-play="${play}" data-preview="assets/video/${play}-preview.mp4" data-tall="${p.ratio === '9:16' ? 1 : 0}">
      <img class="row__thumb" src="assets/img/${play}.jpg" alt="" loading="lazy" decoding="async">
      <span class="row__num small num">${String(i + 1).padStart(2, '0')}</span>
      <span class="row__title">${esc(p.title)}${p.credits ? `<span class="row__credit">${creditLines(p).map((c) => `<span>${esc(c)}</span>`).join('')}</span>` : ''}</span>
      <span class="row__meta small"><span>${esc(L(p.kind))}</span><span class="num">${p.year || ''}</span></span>
    </button></li>`;
  }).join('');

  // projects page: every project as a block, film on one side, credits on the other
  const projEl = $('#projects');
  if (projEl) projEl.innerHTML = PROJECTS.map((p) => {
    const films = p.films || [{ slug: p.slug, label: L(p.kind), len: p.len }];
    const n = films.length;
    const count = n > 1 ? t(p.ratio === '9:16' ? 'reels.many' : 'clips.many').replace('{n}', n) : '';
    const media = p.ratio === '9:16'
      ? `<div class="feat__trio">${films.slice(0, 3).map((f) => mediaBtn(f.slug, `${p.title} ${lab(f.label)}`, f.len, lab(f.label))).join('')}</div>`
      : mediaBtn(films[0].slug, p.title, n > 1 ? '' : films[0].len, n > 1 ? count : '');
    // everyone who worked on any of its films, per role, each name once
    const roles = new Map();
    [p.team || [], ...(p.films || []).map((f) => f.team || [])].forEach((tm) => tm.forEach(([r, ...n]) => {
      const list = roles.get(r) || [];
      n.forEach((x) => { if (!list.includes(x)) list.push(x); });
      roles.set(r, list);
    }));
    const team = [...roles].map(([r, names]) => `<div><dt>${esc(roleName(r))}:</dt><dd>${names.map(nameHtml).join(', ')}</dd></div>`).join('');
    return `<article class="proj" id="${esc(p.slug)}">
      <div class="proj__media">${media}</div>
      <div class="proj__info">
        <h2 class="proj__title">${esc(p.title)}</h2>
        <p class="proj__kind small"><span>${esc(L(p.kind))}</span><span class="num">${p.year || ''}</span>${count ? `<span>${esc(count)}</span>` : ''}</p>
        ${p.production ? `<p class="proj__prod">${esc(t('cr.production'))} <b>${esc(p.production)}</b></p>` : ''}
        ${p.note ? `<p class="proj__note">${esc(L(p.note))}</p>` : ''}
        ${team ? `<dl class="proj__team">${team}</dl>` : ''}
        ${p.client || p.with ? `<dl class="proj__for">${p.client ? `<div><dt>${esc(t('cr.for'))}:</dt><dd>${esc(p.client)}</dd></div>` : ''}${p.with ? `<div><dt>${esc(t('cr.with'))}:</dt><dd>${esc(p.with)}</dd></div>` : ''}</dl>` : ''}
      </div>
    </article>`;
  }).join('');
  // the underline under Ilger's name draws itself once the block is in view
  const inIO = 'IntersectionObserver' in window && !reduce
    ? new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-in'); inIO.unobserve(e.target); } }), { rootMargin: '0px 0px -20% 0px' })
    : null;
  $$('.proj, .feat').forEach((el) => (inIO ? inIO.observe(el) : el.classList.add('is-in')));

  // homepage teaser for the projects page
  const moreThumbs = $('#more-thumbs');
  if (moreThumbs) {
    // an endless, slowly drifting strip; hover one and it plays, click and the projects page opens on that film
    const items = PROJECTS.filter((p) => !p.featured && !p.reel);
    const card = (p, clone) => {
      const s = p.films ? p.films[0].slug : p.slug;
      return `<a class="more__thumb" href="projecten.html#${p.slug}" draggable="false"${clone ? ' tabindex="-1" aria-hidden="true"' : ''} aria-label="${esc(t('play'))}: ${esc(p.title)}">
        <img src="assets/img/${s}.jpg" alt="" loading="lazy" decoding="async" draggable="false"><video muted loop playsinline preload="none" data-src="assets/video/${s}-preview.mp4"></video>
        <span class="more__name small">${esc(p.title)}</span></a>`;
    };
    moreThumbs.innerHTML = `<div class="more__track">${items.map((p) => card(p)).join('')}${items.map((p) => card(p, true)).join('')}</div>`;
    moreThumbs.removeAttribute('aria-hidden');
    moreThumbs.addEventListener('pointerover', (e) => {
      const a = e.target.closest('.more__thumb');
      if (!a || a.classList.contains('is-on')) return;
      const v = $('video', a);
      if (!v.getAttribute('src')) v.src = v.dataset.src;
      v.play().catch(() => {});
      a.classList.add('is-on');
    });
    moreThumbs.addEventListener('pointerout', (e) => {
      const a = e.target.closest('.more__thumb');
      if (!a || a.contains(e.relatedTarget)) return;
      $('video', a).pause();
      a.classList.remove('is-on');
    });
  }
  const moreCount = $('#more-count');
  if (moreCount) moreCount.textContent = String(PROJECTS.length);
  const workCount = $('#work-count');
  if (workCount) workCount.textContent = t('work.count').replace('{n}', PROJECTS.length);
  // WhatsApp opens with a first line already typed
  $$('[data-wa]').forEach((a) => { a.href = `https://wa.me/32468264656?text=${encodeURIComponent(t('wa.msg'))}`; });
  const waTop = $('.top__wa');
  if (waTop) waTop.setAttribute('aria-label', `${t('wa.cta')} (WhatsApp)`);

  $$('[data-i18n]').forEach((el) => { const v = t(el.dataset.i18n); if (v) el.textContent = v; });
  const footTag = $('#foot-tag');
  if (footTag) { const [l1, l2] = t('foot.tag').split('|'); footTag.innerHTML = `${esc(l1)}<br><span>${esc(l2 || '')}</span>`; }
  document.title = t(page === 'work' ? 'work.doctitle' : page === 'cases' ? 'cases.doctitle' : 'title');
  const metaDesc = $('meta[name="description"]'); if (metaDesc) metaDesc.content = t(page === 'work' ? 'work.desc' : page === 'cases' ? 'cases.desc' : 'desc');

  // mail address is put together here, so scrapers reading the HTML don't get it
  $$('[data-u]').forEach((a) => {
    const addr = `${a.dataset.u}@${a.dataset.d}`;
    a.href = `mailto:${addr}`;
    if (a.classList.contains('mail') || a.hasAttribute('data-text')) a.textContent = addr;
  });

  /* ---------- Line wipe (Unseen-style text reveal) ---------- */
  const played = new WeakSet();
  function splitReveal(el) {
    if (!el.dataset.raw) el.dataset.raw = el.textContent;
    const parts = el.dataset.raw.split('|');
    el.innerHTML = parts.map((part) => part.trim().split(/\s+/).map((w) => `<span class="rw">${esc(w)}</span>`).join(' ')).join('<br>');
    const lines = [];
    let lastTop = null;
    $$('.rw', el).forEach((w) => {
      const top = w.offsetTop;
      if (lastTop === null || Math.abs(top - lastTop) > 4) { lines.push([]); lastTop = top; }
      lines[lines.length - 1].push(w.textContent);
    });
    el.innerHTML = lines.map((l) => `<span class="rl"><span class="rl__in">${esc(l.join(' '))}</span></span>`).join('');
    const done = played.has(el) || reduce || !hasGsap;
    $$('.rl__in', el).forEach((x) => {
      x.style.setProperty('--p', done ? '130%' : '0%');
      // lines waiting for their wipe sit on their own layer: the wipe then only redraws the mask, not the text and its shadow
      x.style.willChange = done ? '' : 'transform';
    });
    el.classList.add('is-split');
  }
  function playReveal(el, delay = 0) {
    if (played.has(el)) return;
    played.add(el);
    const lines = $$('.rl__in', el);
    gsap.fromTo(lines, { '--p': '0%' }, {
      '--p': '130%', duration: 1.1, ease: 'power2.out', stagger: 0.09, delay,
      onComplete: () => lines.forEach((x) => { x.style.willChange = ''; })
    });
  }
  const reveals = $$('[data-reveal]');
  const splitAll = () => reveals.forEach(splitReveal);
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => {
    splitAll();
    if (!hasGsap || reduce) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      playReveal(e.target);
    }), { rootMargin: '0px 0px -14% 0px' });
    reveals.filter((el) => el.dataset.reveal !== 'intro').forEach((el) => io.observe(el));
  });
  let rsT = 0;
  window.addEventListener('resize', () => { clearTimeout(rsT); rsT = setTimeout(splitAll, 180); });

  if (!hasGsap) { $('#top').classList.add('is-in'); return; }
  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ lerp: 0.08, smoothWheel: true, wheelMultiplier: 1.1, touchMultiplier: 1.2 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  function goTo(target) {
    if (lenis) lenis.scrollTo(target, { duration: 1.6, easing: (x) => (x < 0.5 ? 8 * x ** 4 : 1 - Math.pow(-2 * x + 2, 4) / 2) });
    else if (target === 0) window.scrollTo(0, 0);
    else target.scrollIntoView();
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || a.hasAttribute('data-u')) return;
    const id = a.getAttribute('href');
    const target = id === '#hero' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    goTo(target);
  });

  /* ---------- Hero: the mark, then woosh into the reel ---------- */
  const canvas = $('#hero-canvas');
  const isHome = !!canvas;
  const ctx = canvas ? canvas.getContext('2d') : null;
  // other pages have no banner: a stand-in video keeps the shared code simple
  const wide = $('#reel-wide') || document.createElement('video');
  const tall = $('#reel-tall') || wide;
  const posterWide = new Image(), posterTall = new Image();
  if (isHome) { posterWide.src = 'assets/img/showreel.jpg'; posterTall.src = 'assets/img/showreel-tall.jpg'; }
  const PAPER = '#EFEBE4', RED = '#F13936', BLACK = '#080807';
  const hero = { p: reduce ? 1 : 0, mark: reduce ? 1 : 0, lens: reduce ? 1 : 0 };
  let W = 0, H = 0, u0 = 1, uEnd = 1, heroInView = isHome;
  // phones in data-saver mode: nothing plays or downloads by itself, posters instead (the pause button turns it back on)
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  let reel = wide, poster = posterWide, soundOn = false, current = null, videosPaused = saveData, heroLive = false;
  function showLiveVideo() {
    [wide, tall].forEach((v) => { const on = v === reel; v.classList.toggle('hero__vid', on); v.classList.toggle('sr-src', !on); });
  }
  function goLive() {
    if (heroLive) return;
    heroLive = true;
    showLiveVideo();
    $('.hero').classList.add('is-live');
  }

  function sizeCanvas() {
    const r = canvas.getBoundingClientRect();
    W = r.width; H = r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    u0 = Math.min(W * 0.34, H * 0.46 * (336 / 208), 520) / 336; // brandkit mark: r 104, centres ±64
    uEnd = ((64 * W + Math.sqrt(4096 * W * W + 6720 * (W * W + H * H))) / (2 * 6720)) * 1.08;
    const next = W / H < 0.8 ? tall : wide; // only the version that fits gets downloaded
    if (next !== reel) { reel.pause(); reel = next; poster = next === tall ? posterTall : posterWide; if (heroLive) showLiveVideo(); if (heroInView) playReel(); }
    if (reel.preload === 'none' && !videosPaused) { reel.preload = 'auto'; reel.load(); if (heroInView) playReel(); }
  }
  function drawCover(src, sw, sh, scale) {
    if (!sw || !sh) return;
    const s = Math.max(W / sw, H / sh) * scale;
    ctx.drawImage(src, (W - sw * s) / 2, (H - sh * s) / 2, sw * s, sh * s);
  }
  function drawHero() {
    const z = hero.p;
    const u = u0 * Math.pow(uEnd / u0, z);
    const R = 104 * u, off = 64 * u + (1 - hero.mark) * 70 * u0, cx = W / 2, cy = H / 2;
    ctx.globalAlpha = 1; ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, H);
    if (z < 1) {
      ctx.globalAlpha = hero.mark;
      ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(cx - off, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx + off, cy, R, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx - off, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.beginPath(); ctx.arc(cx + off, cy, R, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = BLACK; ctx.fillRect(0, 0, W, H);
    }
    if (hero.lens > 0) {
      ctx.globalAlpha = hero.lens;
      const scale = 1.2 - 0.2 * z;
      if (reel.readyState >= 2) drawCover(reel, reel.videoWidth, reel.videoHeight, scale);
      else if (poster.complete) drawCover(poster, poster.naturalWidth, poster.naturalHeight, scale);
      ctx.globalAlpha = 1;
    }
    if (z < 1) ctx.restore();
    if (z > 0.6) {
      const g = ctx.createLinearGradient(0, H * 0.35, 0, H);
      g.addColorStop(0, 'rgba(8,8,7,0)'); g.addColorStop(1, `rgba(8,8,7,${0.6 * clamp((z - 0.6) / 0.4)})`);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    }
  }
  function playReel() {
    if (videosPaused) return;
    reel.muted = !soundOn;
    const pr = reel.play(); if (pr && pr.catch) pr.catch(() => { reel.muted = true; reel.play().catch(() => {}); });
  }
  const top = $('#top');
  if (!isHome) top.classList.add('is-in');
  else {
  sizeCanvas();
  window.addEventListener('resize', () => { sizeCanvas(); if (!heroLive) drawHero(); });
  gsap.ticker.add(() => { if (heroInView && !heroLive) drawHero(); });
  new IntersectionObserver(([e]) => {
    heroInView = e.isIntersecting;
    if (current) return;
    if (heroInView) playReel(); else reel.pause();
  }).observe($('.hero'));

  const heroTitle = $('.hero__title');
  // the logo intro plays once per visit; coming back, or landing on a section, goes straight to the banner
  let seenIntro = false;
  try { seenIntro = sessionStorage.getItem('ilger-intro') === '1'; sessionStorage.setItem('ilger-intro', '1'); } catch (e) {}
  const skipIntro = reduce || seenIntro || (location.hash && location.hash !== '#hero');
  playReel();
  if (skipIntro) {
    hero.p = 1; hero.mark = 1; hero.lens = 1;
    top.classList.add('is-in'); goLive();
    if (!reduce) (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => playReveal(heroTitle, 0.15));
  } else {
    lenis?.stop();
    const ready = new Promise((res) => {
      if (reel.readyState >= 3) return res();
      reel.addEventListener('canplay', res, { once: true });
      setTimeout(res, 2600);
    });
    const intro = gsap.timeline();
    intro.to(hero, { mark: 1, duration: 1.1, ease: 'expo.out' }, 0.15)
      .addPause(1.0, () => ready.then(() => intro.resume()))
      .to(hero, { lens: 1, duration: 0.55, ease: 'power2.out' }, 1.0)
      .to(hero, { p: 1, duration: 1.45, ease: 'expo.inOut' }, 1.35)
      .add(() => top.classList.add('is-in'), 2.3)
      .add(() => playReveal(heroTitle), 2.4)
      .add(() => { lenis?.start(); }, 2.8)
      .add(goLive, 2.85);
    const ff = () => { if (intro.isActive() || intro.paused()) intro.timeScale(4); };
    window.addEventListener('wheel', ff, { passive: true, once: true });
    window.addEventListener('touchstart', ff, { passive: true, once: true });
    window.addEventListener('keydown', ff, { once: true });
  }
  if (!reduce) gsap.to('.hero__stage', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  }

  /* ---------- The fire comes with you: in under the statement, still there while the first film slides over it ---------- */
  const fire = $('.flow[data-flow="statement"]');
  if (fire && !reduce) {
    let fin = 0, fout = 0;
    const setFire = () => { fire.style.opacity = String(Math.max(0, Math.min(fin, 1 - fout))); };
    setFire();
    ScrollTrigger.create({ trigger: '.statement', start: 'top bottom', end: 'top 30%', onUpdate: (s) => { fin = s.progress; setFire(); } });
    // the reel softens at its bottom edge and the fire leaks up over it while you scroll away
    const stage = $('.hero__stage');
    const leak = $('.hero__leak');
    ScrollTrigger.create({
      trigger: '.hero', start: 'top top', end: 'bottom top',
      onUpdate: (s) => {
        stage.style.setProperty('--hf', String(100 - 48 * Math.min(1, s.progress * 1.8)));
        leak.style.opacity = String(Math.min(1, s.progress * 2.4));
      }
    });
    ScrollTrigger.create({ trigger: '.reels__grid', start: 'top 70%', end: 'bottom 35%', onUpdate: (s) => { fout = s.progress; setFire(); } });
  }

  /* ---------- Logos: an endless slider that runs with your scroll ---------- */
  const track = $('.marquee__track');
  if (track && !reduce) {
    const list = $('.logos', track);
    const copy = list.cloneNode(true);
    // the copy keeps its alt texts: every logo is sized by its name in the CSS, so an empty alt made the copy
    // wider than the original and the loop jumped. aria-hidden already keeps it away from screen readers.
    copy.setAttribute('aria-hidden', 'true');
    $$('img', copy).forEach((i) => { i.loading = 'eager'; });
    track.appendChild(copy);
    track.classList.add('is-running');
    const marquee = track.parentElement;
    let x = 0, cur = 0.6, dir = 1, vel = 0, lastY = window.scrollY, hover = false, seen = false, drag = null;
    new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, { rootMargin: '20% 0px' }).observe(track);
    marquee.addEventListener('pointerenter', () => { hover = true; });
    marquee.addEventListener('pointerleave', () => { hover = false; });
    // grab it and pull it through; let go and it glides on
    marquee.addEventListener('pointerdown', (e) => {
      drag = { x: e.clientX, v: 0 };
      marquee.setPointerCapture(e.pointerId);
      marquee.classList.add('is-drag');
    });
    marquee.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      drag.v = drag.v * 0.4 + dx * 0.6;
      x += dx;
    });
    const endDrag = () => {
      if (!drag) return;
      cur = Math.max(-28, Math.min(28, -drag.v));
      if (Math.abs(drag.v) > 0.5) dir = drag.v > 0 ? -1 : 1;
      drag = null;
      marquee.classList.remove('is-drag');
    };
    marquee.addEventListener('pointerup', endDrag);
    marquee.addEventListener('pointercancel', endDrag);
    gsap.ticker.add(() => {
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      vel += (dy - vel) * 0.1;
      if (Math.abs(vel) > 0.6) dir = vel < 0 ? -1 : 1; // it keeps the way you last scrolled, no snapping back
      if (!seen) return;
      const w = copy.offsetLeft - list.offsetLeft; // one full lap = exactly where the copy starts
      if (!w) return;
      const k = gsap.ticker.deltaRatio(60);
      if (!drag) {
        const target = dir * (0.6 + Math.min(7, Math.abs(vel) * 0.3)) * (hover ? 0.3 : 1);
        cur += (target - cur) * Math.min(1, 0.045 * k); // every change of speed or direction eases in
        x -= cur * k;
      }
      x = ((x % w) + w) % w - w;
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    });
  }

  /* ---------- "Want to see more?" strip: drifts on its own, grab it to pull it through ---------- */
  const strip = $('#more-thumbs');
  const strack = strip && $('.more__track', strip);
  if (strack && !reduce) {
    let x = 0, cur = 0.5, over = false, seenS = false, press = null, drag = null, dragged = false;
    new IntersectionObserver(([e]) => { seenS = e.isIntersecting; }, { rootMargin: '20% 0px' }).observe(strip);
    strip.addEventListener('pointerenter', () => { over = true; });
    strip.addEventListener('pointerleave', () => { over = false; });
    strip.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      press = { x: e.clientX, id: e.pointerId };
      dragged = false;
    });
    strip.addEventListener('pointermove', (e) => {
      if (!press) return;
      // a drag only starts after a few pixels, so a plain click still opens the film
      if (!drag && Math.abs(e.clientX - press.x) > 5) {
        drag = { x: e.clientX, v: 0 };
        dragged = true;
        strip.setPointerCapture(press.id);
        strip.classList.add('is-drag');
      }
      if (!drag) return;
      const dx = e.clientX - drag.x;
      drag.x = e.clientX;
      drag.v = drag.v * 0.4 + dx * 0.6;
      x += dx;
    });
    const release = () => {
      press = null;
      if (!drag) return;
      cur = Math.max(-28, Math.min(28, -drag.v));
      drag = null;
      strip.classList.remove('is-drag');
    };
    strip.addEventListener('pointerup', release);
    strip.addEventListener('pointercancel', release);
    strip.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); e.stopPropagation(); dragged = false; } }, true);
    gsap.ticker.add(() => {
      if (!seenS) return;
      const w = strack.scrollWidth / 2;
      if (!w) return;
      const k = gsap.ticker.deltaRatio(60);
      if (!drag) {
        cur += ((over ? 0 : 0.5) - cur) * Math.min(1, 0.05 * k); // stands still under the mouse, glides on otherwise
        x -= cur * k;
      }
      x = ((x % w) + w) % w - w;
      strack.style.transform = `translate3d(${x}px, 0, 0)`;
    });
  }

  /* ---------- Pill nav: the indicator follows you, stretching a little while it moves ---------- */
  const pills = $('#pills');
  const ind = $('.pills__ind', pills);
  let activeSec = '';
  function setActive(name, force) {
    if (name === activeSec && !force) return;
    const moved = !!activeSec && name !== activeSec;
    activeSec = name;
    $$('a', pills).forEach((a) => {
      const on = a.dataset.sec === name;
      a.setAttribute('aria-current', String(on));
      if (on) { ind.style.width = a.offsetWidth + 'px'; ind.style.transform = `translateX(${a.offsetLeft}px)`; }
    });
    if (moved && !reduce) { ind.classList.remove('is-moving'); void ind.offsetWidth; ind.classList.add('is-moving'); }
    $$('.foot [data-sec]').forEach((a) => a.classList.toggle('is-current', a.dataset.sec === name));
  }
  if (isHome) {
    [['hero', '#hero', '#hero'], ['work', '#work', '#index'], ['about', '#about', '.clients'], ['contact', '#contact', '.foot']].forEach(([name, a, b]) => ScrollTrigger.create({
      trigger: a, endTrigger: b, start: 'top 55%', end: 'bottom 55%',
      onToggle: (s) => { if (s.isActive) setActive(name); }
    }));
    setActive('hero');
  } else setActive(page === 'work' || page === 'cases' ? page : '');
  document.fonts?.ready.then(() => setActive(activeSec, true));
  window.addEventListener('resize', () => setActive(activeSec, true));

  /* ---------- Scroll-driven bits ---------- */
  // previews start one after the other instead of all at once, so scrolling into a row of them stays smooth
  const loadQ = [];
  let loadT = 0;
  const pump = () => {
    loadT = 0;
    const v = loadQ.shift();
    if (v && v.wantPlay && !v.getAttribute('src')) { v.src = v.dataset.src; if (!videosPaused) v.play().catch(() => {}); }
    if (loadQ.length) loadT = setTimeout(pump, 140);
  };
  const mediaIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    const v = $('video', en.target);
    v.wantPlay = en.isIntersecting;
    if (!en.isIntersecting) { v.pause(); return; }
    if (v.getAttribute('src')) { if (!videosPaused) v.play().catch(() => {}); return; }
    loadQ.push(v);
    if (!loadT) loadT = setTimeout(pump, 0);
  }), { rootMargin: '25% 0px' });
  $$('.feat__media').forEach((m) => mediaIO.observe(m));
  const farIO = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) return;
    const v = $('video', en.target);
    if (v.getAttribute('src')) { v.pause(); v.removeAttribute('src'); v.load(); }
  }), { rootMargin: '150% 0px' });
  $$('.feat__media').forEach((m) => farIO.observe(m));

  if (!reduce) {
    $$('.feat__media').forEach((m) => {
      // coming in at the bottom of the screen a film is still bent towards you, like a curved screen; it straightens as it rises
      gsap.fromTo(m, { scale: 0.88 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top 98%', end: 'top 35%', scrub: true } });
      gsap.fromTo($('video', m), { scale: 1.22 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: m, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    // big titles that just came in at the bottom still show a colour split (red / cyan), it pulls together as they rise
    $$('.display, .feat__title, .proj__title').forEach((el) => {
      ScrollTrigger.create({
        trigger: el, start: 'top bottom', end: 'top 62%',
        onUpdate: (s) => {
          const ca = (1 - s.progress) * 5;
          if (ca < 0.08) { el.classList.remove('ca'); return; }
          el.classList.add('ca');
          el.style.setProperty('--ca', `${ca.toFixed(2)}px`);
        },
        onLeave: () => el.classList.remove('ca')
      });
    });
    const rows = $$('.row');
    gsap.set(rows, { opacity: 0, y: 24 });
    const rowIO = new IntersectionObserver((entries) => {
      const hits = entries.filter((e) => e.isIntersecting).map((e) => e.target);
      if (!hits.length) return;
      hits.forEach((h) => rowIO.unobserve(h));
      gsap.to(hits, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.03 });
    }, { rootMargin: '0px 0px -8% 0px' });
    rows.forEach((r) => rowIO.observe(r));
    gsap.fromTo('.about__mask', { scale: 0.86 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__mask', start: 'top 95%', end: 'center 55%', scrub: true } });
    gsap.fromTo('.about__mask img', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.about__mask', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.from('.logos li', { opacity: 0, y: 18, duration: 0.8, ease: 'power3.out', stagger: 0.05, scrollTrigger: { trigger: '.logos', start: 'top 85%' } });
  }

  /* ---------- Small helper: swap a label with a quick blur crossfade ---------- */
  function swapText(el, text) {
    if (reduce) { el.textContent = text; return; }
    gsap.to(el, { opacity: 0, filter: 'blur(4px)', duration: 0.12, ease: 'power1.in', onComplete: () => {
      el.textContent = text;
      gsap.to(el, { opacity: 1, filter: 'blur(0px)', duration: 0.22, ease: 'power2.out' });
    } });
  }

  /* ---------- Sound ---------- */
  const soundBtn = $('#sound');
  if (soundBtn) soundBtn.addEventListener('click', () => {
    soundOn = !soundOn;
    soundBtn.setAttribute('aria-pressed', String(soundOn));
    reel.muted = !soundOn;
    if (soundOn && heroInView && !videosPaused) { reel.volume = 1; reel.play().catch(() => {}); }
  });

  /* ---------- Pause: one button stops every video that plays by itself ---------- */
  const pauseBtn = $('#pause');
  const setPauseLabel = () => pauseBtn.setAttribute('aria-label', t(videosPaused ? 'pause.off' : 'pause.on'));
  setPauseLabel();
  pauseBtn.setAttribute('aria-pressed', String(videosPaused));
  pauseBtn.addEventListener('click', () => {
    videosPaused = !videosPaused;
    pauseBtn.setAttribute('aria-pressed', String(videosPaused));
    setPauseLabel();
    const auto = [reel, ...$$('.feat__media video')];
    if (videosPaused) auto.forEach((v) => v.pause());
    else {
      if (reel.preload === 'none') { reel.preload = 'auto'; reel.load(); }
      if (heroInView) playReel();
      $$('.feat__media video').forEach((v) => { const r = v.getBoundingClientRect(); if (v.src && r.bottom > 0 && r.top < innerHeight) v.play().catch(() => {}); });
    }
  });

  /* ---------- Player: what you click grows into it, along a slight arc ---------- */
  const player = $('#player');
  const pframe = $('#player-frame');
  const pv = $('#player-video');
  const pbar = $('#player-bar');
  let playerMuted = false, barRAF = 0, playerVol = 1;
  const pmute = $('#player-sound');
  const pvolume = $('#player-volume');
  const pvolWrap = $('.player__vol');
  const pfs = $('#player-fs');
  function setMuted(m) {
    playerMuted = m; pv.muted = m;
    const shown = m ? 0 : playerVol;
    pvolWrap.classList.toggle('is-muted', shown === 0);
    pmute.setAttribute('aria-label', t(m ? 'player.soundon' : 'player.soundoff'));
    pvolume.value = String(shown);
    pvolume.style.setProperty('--v', `${shown * 100}%`);
  }
  pmute.addEventListener('click', () => {
    if (playerMuted || playerVol === 0) { if (playerVol === 0) playerVol = 1; pv.volume = playerVol; setMuted(false); }
    else setMuted(true);
  });
  pvolume.addEventListener('input', () => { playerVol = Number(pvolume.value); pv.volume = playerVol; setMuted(playerVol === 0); });
  const fsEl = () => document.fullscreenElement || document.webkitFullscreenElement;
  function toggleFs() {
    if (fsEl()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
    if (pframe.requestFullscreen) pframe.requestFullscreen().catch(() => {});
    else if (pframe.webkitRequestFullscreen) pframe.webkitRequestFullscreen();
    else if (pv.webkitEnterFullscreen) pv.webkitEnterFullscreen(); // iPhone: the system player
  }
  const syncFs = () => {
    const on = !!fsEl();
    player.classList.toggle('is-fs', on);
    pfs.setAttribute('aria-label', t(on ? 'player.fsexit' : 'player.fs'));
  };
  document.addEventListener('fullscreenchange', syncFs);
  document.addEventListener('webkitfullscreenchange', syncFs);
  pfs.addEventListener('click', toggleFs);
  // double-click for fullscreen, but not the second click of a fast double-click on the card that opened it
  pv.addEventListener('dblclick', () => { if (performance.now() - openedAt > 600) toggleFs(); });
  syncFs();
  const screenRect = () => ({ left: 0, top: 0, width: window.innerWidth, height: window.innerHeight });
  const glow = $('#player-glow');
  const gctx = glow.getContext('2d');
  function tickBar() {
    if (pv.duration) pbar.style.transform = `scaleX(${pv.currentTime / pv.duration})`;
    // ambient light: the film itself, tiny and blurred, behind the frame
    if (pv.readyState >= 2 && pv.videoWidth) {
      const s = Math.max(glow.width / pv.videoWidth, glow.height / pv.videoHeight);
      const w = pv.videoWidth * s, h = pv.videoHeight * s;
      gctx.drawImage(pv, (glow.width - w) / 2, (glow.height - h) / 2, w, h);
    }
    barRAF = requestAnimationFrame(tickBar);
  }
  let closing = null, openedAt = 0;
  // whatever happened before (fast clicks, a close cut short), no card stays invisible
  const showCards = () => $$('.feat__media, .row').forEach((c) => { if (c.style.visibility === 'hidden') c.style.visibility = ''; });
  function openPlayer(opts) {
    if (closing) closing.progress(1); // a close still running finishes first
    if (current) return;
    gsap.killTweensOf(pframe);
    gsap.set(pframe, { clearProps: 'transform,opacity' });
    showCards();
    current = opts;
    openedAt = performance.now();
    const from = opts.frame ? opts.frame.getBoundingClientRect() : screenRect();
    player.classList.toggle('player--wide', !!opts.wide);
    pframe.style.setProperty('--ar', String(opts.ar || (opts.wide ? 16 / 9 : 9 / 16)));
    player.hidden = false;
    lenis?.stop();
    reel.pause();
    $('#player-title').textContent = opts.title || '';
    $('#player-credits').innerHTML = playerCredits(opts);
    $('#player-count').textContent = opts.group ? `${opts.group.indexOf(opts.slug) + 1} / ${opts.group.length}` : '';
    markIn();
    syncNav(opts);
    // nothing else needs to move while you watch
    window.ilgerPaused = true;
    $$('.feat__media video').forEach((v) => v.pause());
    setTimeout(() => player.classList.add('has-glow'), 250);
    pv.poster = opts.poster || '';
    pv.src = opts.src;
    pv.volume = playerVol;
    setMuted(false);
    pv.play().catch(() => { setMuted(true); pv.play().catch(() => {}); });
    const to = layoutPlayer();
    opts.box = to; // the frame's resting place: the close is measured from here, even if it starts mid-animation
    if (opts.hide) opts.hide.style.visibility = 'hidden';
    const d = reduce ? 0 : 0.7;
    gsap.set(pframe, { x: from.left - to.left, y: from.top - to.top, scaleX: from.width / to.width, scaleY: from.height / to.height });
    // straight from the card to the centre, one ease for everything: no arc, no bounce
    gsap.to(pframe, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: d, ease: 'expo.out' });
    gsap.fromTo('.player__backdrop', { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' });
    gsap.fromTo('.player__info, .player__tools button', { autoAlpha: 0, y: -6 }, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: 0.03, delay: 0.2 });
    tickBar();
    $('.player__tools [data-close]').focus({ preventScroll: true });
  }
  function closePlayer() {
    if (!current || closing) return;
    queued = 0;
    if (fsEl()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
    const opts = current;
    const to = opts.frame && opts.frame.isConnected ? opts.frame.getBoundingClientRect() : screenRect();
    const now = opts.box || pframe.getBoundingClientRect();
    gsap.killTweensOf(pframe);
    cancelAnimationFrame(barRAF);
    const d = reduce ? 0 : 0.56; // exits 20% shorter than the 0.7 entrance
    gsap.to('.player__info, .player__tools button', { autoAlpha: 0, duration: 0.15 });
    gsap.to('.player__backdrop', { opacity: 0, duration: 0.4, ease: 'power2.in' });
    player.classList.remove('has-glow');
    if (!opts.frame || opts.fade) gsap.to(pframe, { opacity: 0, duration: 0.22, delay: 0.3, ease: 'power2.in' });
    closing = gsap.to(pframe, {
      x: to.left - now.left, y: to.top - now.top, scaleX: to.width / now.width, scaleY: to.height / now.height, duration: d, ease: 'power3.inOut',
      onComplete: () => {
        closing = null;
        if (opts.hide) opts.hide.style.visibility = '';
        showCards();
        pv.pause(); pv.removeAttribute('src'); pv.load();
        gsap.set(pframe, { clearProps: 'transform,opacity' });
        player.hidden = true;
        current = null;
        window.ilgerPaused = false;
        player.classList.remove('has-group', 'hint-done');
        if (!videosPaused) $$('.feat__media video').forEach((v) => { const r = v.getBoundingClientRect(); if (v.getAttribute('src') && r.bottom > 0 && r.top < innerHeight) v.play().catch(() => {}); });
        lenis?.start();
        if (heroInView) playReel();
        (opts.focus || opts.frame)?.focus?.({ preventScroll: true });
      }
    });
  }
  const pinfo = $('.player__info');
  /* Where the title and credits go: next to the film when there is room (vertical reels),
     under it when there is not (wide films). Measured, so it can never run over the video. */
  const phone = matchMedia('(max-width: 860px)');
  function placeInfo(box, keepBelow) {
    const s = pinfo.style;
    if (phone.matches) { s.left = s.top = s.maxWidth = s.width = ''; pinfo.classList.remove('is-below', 'is-side'); return; }
    const gutter = parseFloat(getComputedStyle(player).getPropertyValue('--gutter')) || 40;
    const gap = box.left - gutter - 28;
    if (gap >= 220 && !keepBelow) {
      pinfo.classList.add('is-side'); pinfo.classList.remove('is-below');
      s.left = `${gutter}px`; s.top = `${Math.max(22, box.top)}px`; s.maxWidth = `${Math.min(gap, 380)}px`; s.width = '';
    } else {
      pinfo.classList.add('is-below'); pinfo.classList.remove('is-side');
      s.left = `${box.left}px`; s.top = `${box.bottom + 16}px`; s.maxWidth = `${box.width}px`; s.width = `${box.width}px`;
    }
  }
  // place the info; when it is under the film and would run off the screen, the film gets exactly that much smaller
  function layoutPlayer() {
    player.style.setProperty('--cut', '0px');
    let box = pframe.getBoundingClientRect();
    placeInfo(box);
    let cut = 0;
    for (let k = 0; k < 4 && pinfo.classList.contains('is-below'); k++) {
      const over = box.bottom + 16 + pinfo.offsetHeight - (window.innerHeight - 20);
      if (over <= 0) break;
      cut += Math.ceil(over * 2);
      player.style.setProperty('--cut', `${cut}px`);
      box = pframe.getBoundingClientRect();
      placeInfo(box, true);
    }
    return box;
  }
  window.addEventListener('resize', () => { if (current) layoutPlayer(); });
  const playerCredits = (o) => [o.sub ? `<span class="pc-sub">${esc(o.sub)}</span>` : '', o.creditsHtml || ''].join('');
  let markT = 0;
  function markIn() { pinfo.classList.remove('is-in'); clearTimeout(markT); markT = setTimeout(() => pinfo.classList.add('is-in'), 450); }
  const pprev = $('#player-prev'), pnext = $('#player-next');
  function syncNav(o) {
    const g = o.group;
    player.classList.toggle('has-group', !!g);
    if (!g) return;
    const i = g.indexOf(o.slug);
    pprev.disabled = i <= 0;
    pnext.disabled = i >= g.length - 1;
  }
  const peek = $('#peek');
  const peekVs = [$('video', peek), $('video', peek).cloneNode()];
  peek.appendChild(peekVs[1]);
  let peekFront = 0;
  function hidePeek() { peek.classList.remove('is-on'); peekVs.forEach((v) => v.pause()); }
  function playFilm(slug, el, fromRow) {
    const f = FILMS[slug];
    if (!f) return;
    const peekOn = fromRow && peek.classList.contains('is-on');
    openPlayer({ ...f, slug, frame: peekOn ? peek : el, hide: peekOn ? peek : el, focus: el, fade: !!fromRow });
    if (peekOn) hidePeek();
  }
  document.addEventListener('click', (e) => {
    const m = e.target.closest('.feat__media');
    if (m) return playFilm(m.dataset.play, m, false);
    const r = e.target.closest('.row');
    if (r) return playFilm(r.dataset.play, r, true);
  });
  $$('[data-close]', player).forEach((b) => b.addEventListener('click', closePlayer));

  let feedLock = false, wheelAcc = 0, wheelT = 0, queued = 0;
  // returns true when it actually did something (next/previous film or close)
  function step(dir) {
    if (!current || closing) return false;
    if (feedLock) { queued = dir; return true; } // asked for mid-transition: it runs right after
    const g = current.group;
    const i = g ? g.indexOf(current.slug) : -1;
    const ni = i + dir;
    if (!g || ni < 0 || ni >= g.length) { closePlayer(); return true; }
    feedLock = true;
    const slug = g[ni];
    const f = FILMS[slug];
    const card = $(`.feat__media[data-play="${slug}"]`);
    if (current.hide) current.hide.style.visibility = '';
    current = { ...current, ...f, slug, frame: card || current.frame, hide: card || null, focus: card || current.focus };
    if (card) card.style.visibility = 'hidden';
    gsap.to(pv, { yPercent: -dir * 14, opacity: 0, duration: 0.22, ease: 'power2.in', onComplete: () => {
      pv.poster = f.poster; pv.src = f.src; pv.muted = playerMuted; pv.play().catch(() => {});
      gsap.fromTo(pv, { yPercent: dir * 14, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.45, ease: 'power3.out', onComplete: () => {
        feedLock = false;
        if (queued) { const q = queued; queued = 0; step(q); }
      } });
    } });
    const pc = $('#player-credits');
    gsap.to(pc, { opacity: 0, duration: 0.12, onComplete: () => { pc.innerHTML = playerCredits({ ...current, sub: f.sub }); markIn(); gsap.to(pc, { opacity: 1, duration: 0.22 }); } });
    swapText($('#player-count'), `${ni + 1} / ${g.length}`);
    syncNav(current);
    player.classList.add('hint-done');
    return true;
  }
  pprev.addEventListener('click', () => step(-1));
  pnext.addEventListener('click', () => step(1));
  pprev.setAttribute('aria-label', t('player.prev'));
  pnext.setAttribute('aria-label', t('player.next'));
  // one scroll gesture = one reel: after a step the rest of that gesture (trackpad momentum included) is ignored,
  // the next step only counts once the wheel has been still for a moment
  // a fresh push is recognised by the speed jumping up again (a trackpad's glide only ever fades out)
  let wheelSpent = false, stepAt = 0;
  const recent = [];
  player.addEventListener('wheel', (e) => {
    e.preventDefault();
    const a = Math.abs(e.deltaY);
    // a new push: from a dip the speed shoots up again (a glide only fades, a steady drag only wobbles)
    const rising = recent.length >= 2 && a > Math.min(...recent.slice(-3)) * 2 + 15 && a > 30;
    recent.push(a);
    if (recent.length > 8) recent.shift();
    clearTimeout(wheelT);
    wheelT = setTimeout(() => { wheelAcc = 0; wheelSpent = false; recent.length = 0; }, 200);
    if (wheelSpent) {
      if (!(rising && performance.now() - stepAt > 250)) return;
      wheelSpent = false; wheelAcc = 0;
    }
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 60) {
      // only a step that really happened uses up the gesture; one that hits a running transition waits and tries again
      if (step(Math.sign(wheelAcc))) { wheelSpent = true; stepAt = performance.now(); }
      wheelAcc = 0;
    }
  }, { passive: false });
  let touchY = null;
  player.addEventListener('touchstart', (e) => { touchY = e.touches[0].clientY; }, { passive: true });
  player.addEventListener('touchend', (e) => {
    if (touchY === null) return;
    const dy = touchY - e.changedTouches[0].clientY;
    touchY = null;
    if (Math.abs(dy) > 60) step(Math.sign(dy));
  }, { passive: true });
  pv.addEventListener('click', () => (pv.paused ? pv.play() : pv.pause()));

  /* ---------- Timeline: hover shows where you'd land, click or drag to jump, arrows step 5 s ---------- */
  const scrub = $('#player-scrub');
  const tip = $('#player-tip');
  const ptime = $('#player-time');
  const fmt = (s) => { s = Math.max(0, Math.floor(s || 0)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
  let scrubbing = false, wasPlaying = false;
  const posAt = (e) => { const r = scrub.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width); };
  const showHover = (p) => { scrub.style.setProperty('--hx', `${p * 100}%`); tip.textContent = fmt(p * (pv.duration || 0)); };
  const seek = (p) => { if (!pv.duration) return; pv.currentTime = p * pv.duration; pbar.style.transform = `scaleX(${p})`; };
  scrub.addEventListener('pointermove', (e) => { const p = posAt(e); showHover(p); if (scrubbing) seek(p); });
  scrub.addEventListener('pointerdown', (e) => {
    e.preventDefault(); e.stopPropagation();
    scrub.setPointerCapture(e.pointerId);
    scrubbing = true; scrub.classList.add('is-scrubbing');
    wasPlaying = !pv.paused; pv.pause();
    const p = posAt(e); showHover(p); seek(p);
  });
  const endScrub = () => {
    if (!scrubbing) return;
    scrubbing = false; scrub.classList.remove('is-scrubbing');
    if (wasPlaying) pv.play().catch(() => {});
  };
  scrub.addEventListener('pointerup', endScrub);
  scrub.addEventListener('pointercancel', endScrub);
  scrub.addEventListener('touchstart', (e) => e.stopPropagation(), { passive: true });
  scrub.addEventListener('keydown', (e) => {
    if (!pv.duration) return;
    const step = e.shiftKey ? 10 : 5;
    if (e.key === 'ArrowRight') { pv.currentTime = Math.min(pv.duration - 0.1, pv.currentTime + step); e.preventDefault(); }
    if (e.key === 'ArrowLeft') { pv.currentTime = Math.max(0, pv.currentTime - step); e.preventDefault(); }
    if (e.key === 'Home') { pv.currentTime = 0; e.preventDefault(); }
    if (e.key === 'End') { pv.currentTime = pv.duration - 0.1; e.preventDefault(); }
  });
  const syncTime = () => {
    ptime.textContent = `${fmt(pv.currentTime)} / ${fmt(pv.duration)}`;
    scrub.setAttribute('aria-valuenow', String(Math.round(pv.duration ? (pv.currentTime / pv.duration) * 100 : 0)));
    scrub.setAttribute('aria-valuetext', `${fmt(pv.currentTime)} / ${fmt(pv.duration)}`);
  };
  pv.addEventListener('timeupdate', syncTime);
  pv.addEventListener('loadedmetadata', syncTime);
  document.addEventListener('keydown', (e) => {
    const inField = !!e.target.closest?.('input');
    if (e.key === 'Escape' && current && !fsEl()) closePlayer();
    if (current && e.key === ' ' && !e.target.closest('button, input')) { e.preventDefault(); pv.paused ? pv.play() : pv.pause(); }
    if (current && !inField && (e.key === 'f' || e.key === 'F')) { e.preventDefault(); toggleFs(); }
    if (current && !inField && (e.key === 'ArrowDown' || e.key === 'PageDown')) { e.preventDefault(); step(1); }
    if (current && !inField && (e.key === 'ArrowUp' || e.key === 'PageUp')) { e.preventDefault(); step(-1); }
    if (e.key === 'Tab' && current) {
      const f = $$('button, input', player).filter((x) => x.offsetParent !== null);
      const i = f.indexOf(document.activeElement);
      if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- Floating preview on the project list ---------- */
  if (finePointer && !reduce) {
    let peekSrc = '';
    const px = gsap.quickTo(peek, 'x', { duration: 0.5, ease: 'power3' });
    const py = gsap.quickTo(peek, 'y', { duration: 0.5, ease: 'power3' });
    const onList = (e) => {
      px(e.clientX); py(e.clientY);
      const r = e.target.closest('.row');
      if (!r) { hidePeek(); return; }
      if (r.dataset.preview !== peekSrc) {
        peekSrc = r.dataset.preview;
        const tallR = r.dataset.tall === '1';
        peek.style.width = tallR ? '190px' : '340px';
        peek.style.height = tallR ? '338px' : '191px';
        const front = peekVs[peekFront], back = peekVs[1 - peekFront];
        const src = peekSrc;
        back.src = src;
        back.play().catch(() => {});
        const show = () => {
          if (src !== peekSrc) return;
          gsap.fromTo(back, { opacity: 0, scale: 1.06, filter: 'blur(8px)' }, { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.45, ease: 'power2.out' });
          gsap.to(front, { opacity: 0, duration: 0.35, ease: 'power1.out', onComplete: () => front.pause() });
          peekFront = 1 - peekFront;
        };
        if (back.readyState >= 2) show(); else back.addEventListener('loadeddata', show, { once: true });
      }
      peek.classList.add('is-on');
      peekVs[peekFront].play().catch(() => {});
    };
    ['#rows', '#svc'].map((s) => $(s)).filter(Boolean).forEach((el) => {
      el.addEventListener('pointermove', onList);
      el.addEventListener('pointerleave', hidePeek);
    });
  }

  /* ---------- Copy mail ---------- */
  const copyBtn = $('#copy');
  const copyLabel = copyBtn ? $('span', copyBtn) : null;
  if (copyBtn) copyBtn.addEventListener('click', async () => {
    const m = $('.mail[data-u]');
    const addr = `${m.dataset.u}@${m.dataset.d}`;
    try {
      await navigator.clipboard.writeText(addr);
      swapText(copyLabel, t('contact.copied'));
      copyBtn.classList.remove('is-done'); void copyBtn.offsetWidth; copyBtn.classList.add('is-done');
      setTimeout(() => { swapText(copyLabel, t('contact.copy')); copyBtn.classList.remove('is-done'); }, 1800);
    } catch (e) { window.location.href = `mailto:${addr}`; }
  });

  /* ---------- Cursor: just a small "Play" tag that follows over films ---------- */
  if (finePointer && !reduce) {
    const cur = $('#cursor');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.25, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.25, ease: 'power3' });
    let lx = -1, ly = -1;
    const mode = (el) => cur.classList.toggle('is-play', !!el?.closest('.feat__media') && !current);
    window.addEventListener('pointermove', (e) => {
      lx = e.clientX; ly = e.clientY; cx(lx); cy(ly);
      mode(e.target instanceof Element ? e.target : null);
    }, { passive: true });
    window.addEventListener('scroll', () => { if (lx >= 0) mode(document.elementFromPoint(lx, ly)); }, { passive: true });
    document.addEventListener('pointerleave', () => cur.classList.remove('is-play'));
  }

  /* ---------- Projects page opened on one film (projecten.html#slug): go there and play it ---------- */
  if (page === 'work' && location.hash.length > 1) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    const media = target && target.querySelector('.feat__media');
    if (media) {
      setTimeout(() => {
        if (lenis) lenis.scrollTo(target, { immediate: true, offset: -110, force: true });
        else target.scrollIntoView();
        setTimeout(() => playFilm(media.dataset.play, media, false), 300);
      }, 350);
    }
  }
})();
