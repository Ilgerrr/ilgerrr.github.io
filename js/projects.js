/*
  All projects on the site. Order here = order on the projects page.
  reel: true      -> tile in the reels grid at the top of "Werk" on the homepage (vertical work posted by the client itself)
  featured: true  -> big block on the homepage
  every project   -> block on projecten.html, with its credits
  by              -> the Instagram account the client posted it on
  films           -> several videos you can swipe through in the player (first one is the cover)
  ratio           -> '9:16', '16:9' or '5:4'

  Credits (shown next to each project, Ilger's name gets underlined):
  production      -> production company
  client          -> who it was for
  with            -> together with (agency, partner)
  team            -> [role, name, name, ...]  roles: director, creative, producer, dop, camera, cam2, ac, ac1, gaffer, dit, drone, edit, sound, color, vfx, motion, photo, mua
  note            -> one extra line, e.g. { en: 'Edited on location', nl: 'Gemonteerd op locatie' }
*/
window.PROJECTS = [
  {
    slug: 'tml', title: 'Tomorrowland', year: '2026', ratio: '9:16', reel: true, by: 'tomorrowland',
    kind: { en: 'Brand reels', nl: 'Brand reels' },
    production: 'FD Productions', client: 'Tomorrowland', with: 'Coca-Cola, Absolut, Lidl, Loop',
    team: [
      ['camera', 'Dries El-Mouhaddab', 'Jelle Dejaegere', 'Kevin Tielemans', 'Jasper Robyn', 'Loek Barendrecht'],
      ['edit', 'Ilger Albert']
    ],
    films: [
      // a film can carry its own crew; the project block on projecten.html shows everyone together
      { slug: 'tml-cocacola', label: 'Coca-Cola Home Party', len: '0:30', team: [['camera', 'Kenzie Wattier'], ['edit', 'Ilger Albert', 'Florian Degreve']] },
      { slug: 'tml-absolut', label: 'Absolut', len: '0:35' },
      { slug: 'tml-united', label: 'Absolut United We Dance', len: '0:23' },
      { slug: 'tml-lidl', label: 'Lidl Bakery Rave', len: '0:16' },
      { slug: 'tml-loop', label: 'Loop at Tomorrowland Winter', len: '0:17' }
    ]
  },
  {
    slug: 'bks', title: 'Best Kept Secret', year: '2026', ratio: '9:16', reel: true, by: 'bksfestival',
    kind: { en: 'Festival reels', nl: 'Festivalreels' },
    production: 'FD Productions', client: 'Best Kept Secret',
    team: [
      ['camera', 'Dries El-Mouhaddab', 'Kenzie Wattier', 'Sebbe Van Hove', 'Kevin Tielemans'],
      ['edit', 'Ilger Albert', 'Florian Degreve']
    ],
    films: [
      { slug: 'bks-pommelien', label: 'Pommelien Thijs', len: '0:37' },
      { slug: 'bks-sunday', label: 'Best Kept Sunday', len: '0:28' },
      { slug: 'bks-day3', label: { en: 'Day three', nl: 'Dag drie' }, len: '0:21' },
      { slug: 'bks-food', label: 'Food', len: '0:19' },
      { slug: 'bks-waking', label: { en: 'Waking up at BKS', nl: 'Wakker worden op BKS' }, len: '0:14' },
      { slug: 'bks-arrival', label: { en: 'First visitors', nl: 'De eerste bezoekers' }, len: '0:22' },
      { slug: 'bks-campsite', label: { en: 'Campsite opening', nl: 'De camping gaat open' }, len: '0:20' }
    ]
  },
  {
    slug: 'obf', title: 'Ostend Beach', year: '2026', ratio: '9:16', reel: true, by: 'ostendbeach',
    kind: { en: 'Festival reels', nl: 'Festivalreels' },
    production: 'FD Productions', client: 'Ostend Beach Festival',
    team: [
      ['camera', 'Sebbe Van Hove', 'Jelle Dejaegere', 'Florian Degreve'],
      ['edit', 'Ilger Albert']
    ],
    films: [
      { slug: 'obf-day2', label: { en: 'Day two', nl: 'Dag twee' }, len: '0:34' },
      { slug: 'obf-day3', label: { en: 'Day three', nl: 'Dag drie' }, len: '0:33' },
      { slug: 'obf-people', label: 'People of Ostend Beach', len: '0:18' },
      { slug: 'obf-joris', label: 'Joris Voorn', len: '0:20' },
      { slug: 'obf-greenvelvet', label: 'Green Velvet', len: '0:20' },
      { slug: 'obf-monique', label: 'Miss Monique', len: '0:18' },
      { slug: 'obf-closing', label: 'Closing set', len: '0:14' },
      { slug: 'obf-vip', label: 'VIP at The Mirage', len: '0:20' }
    ]
  },
  {
    slug: 'tuttobene', title: 'Tuttobene', year: '2026', ratio: '9:16', reel: true, by: 'race.service',
    kind: { en: 'Day recaps', nl: 'Dayrecaps' },
    production: 'Race Service',
    team: [
      ['camera', 'Jelle Dejaegere', 'Florian Degreve', 'Cies Albert'],
      ['dit', 'Sebbe Van Hove'],
      ['edit', 'Ilger Albert']
    ],
    note: { en: 'Edited on location', nl: 'Gemonteerd op locatie' },
    films: [
      { slug: 'tutto-dayrecap', label: 'Day recap', len: '0:25' },
      { slug: 'tutto-opening', label: 'Opening', len: '0:25' },
      { slug: 'tutto-teaser', label: 'Teaser', len: '0:24' }
    ]
  },
  {
    slug: 'ostend-aftermovie', title: 'Ostend Beach', year: '2026', ratio: '5:4', featured: true, len: '2:05',
    kind: { en: 'Aftermovie', nl: 'Aftermovie' },
    production: 'FD Productions', client: 'Ostend Beach Festival',
    team: [
      ['camera', 'Sebbe Van Hove', 'Jelle Dejaegere', 'Florian Degreve'],
      ['edit', 'Ilger Albert']
    ]
  },
  {
    slug: 'spec-ferrari', title: 'Spec Ferrari', year: '2026', ratio: '16:9', featured: true, len: '0:30',
    kind: { en: 'Spec commercial', nl: 'Spec commercial' },
    team: [
      ['dop', 'Ilger Albert', 'Sebbe Van Hove'],
      ['camera', 'Ilger Albert', 'Sebbe Van Hove'],
      ['ac', 'Simon Haex', 'Giel Driesen'],
      ['edit', 'Ilger Albert'],
      ['color', 'Ilger Albert']
    ]
  },
  {
    slug: 'tnc', title: 'TNC', year: '2026', ratio: '16:9', featured: true, len: '1:23',
    kind: { en: "Director's cut", nl: "Director's cut" },
    note: { en: 'Personal project', nl: 'Eigen project' },
    team: [
      ['camera', 'Ilger Albert', 'Simon Haex', 'Sebbe Van Hove'],
      ['edit', 'Ilger Albert']
    ]
  },
  {
    slug: 'exr', title: 'EXR', year: '2026', ratio: '16:9', len: '0:57',
    kind: { en: 'Commercial', nl: 'Commercial' },
    production: 'FD Productions', client: 'EXR',
    team: [
      ['director', 'Florian Degreve'],
      ['dop', 'Cies Albert'],
      ['cam2', 'Jelle Dejaegere', 'Sebbe Van Hove'],
      ['ac1', 'Samuel Debeer', 'Ilger Albert'],
      ['gaffer', 'Jelle Bollen'],
      ['edit', 'Ilger Albert', 'Florian Degreve'],
      ['photo', 'Djorden Vlaeminck'],
      ['mua', 'Nathalie Ceulemans', 'Sarah Degraef']
    ]
  },
  {
    slug: 'cdrc', title: 'Simon Haex × CDRC', year: '2026', ratio: '16:9',
    kind: { en: 'Multicam DJ set', nl: 'Multicam dj-set' },
    client: 'Simon Haex × CDRC', with: 'Project Sint-Pietersplein, Gent',
    team: [['camera', 'Ilger Albert', 'Sebbe Van Hove', 'Giel Driesen'], ['edit', 'Ilger Albert']],
    films: [
      { slug: 'cdrc-1', label: 'Project Sint-Pietersplein, Gent', len: '1:00' },
      { slug: 'cdrc-2', label: 'Project Sint-Pietersplein, Gent', len: '0:35' },
      { slug: 'cdrc-3', label: 'Project Sint-Pietersplein, Gent', len: '0:29' }
    ]
  },
  {
    slug: 'diepgang', title: 'Diepgang', year: '2026', ratio: '16:9', len: '0:55',
    kind: { en: 'Boat party aftermovie', nl: 'Aftermovie bootfeest' },
    client: 'Diepgang',
    team: [['camera', 'Ilger Albert'], ['edit', 'Ilger Albert'], ['color', 'Ilger Albert']]
  },
  {
    slug: 'bambata', title: 'Bambata', year: '2026', ratio: '16:9', len: '1:15',
    kind: { en: 'Aftermovie', nl: 'Aftermovie' },
    client: 'Bambata',
    team: [['camera', 'Ilger Albert'], ['edit', 'Ilger Albert'], ['color', 'Ilger Albert']]
  },
  {
    slug: 'documentaire', title: 'Documentaire', year: '2025', ratio: '16:9', len: '3:00',
    kind: { en: 'Documentary', nl: 'Documentaire' },
    team: [['camera', 'Ilger Albert'], ['edit', 'Ilger Albert'], ['color', 'Ilger Albert']]
  },
  {
    slug: 'bnix-aftermovie', title: 'BNIX 30 jaar', year: '2025', ratio: '16:9', len: '2:09',
    kind: { en: 'Aftermovie', nl: 'Aftermovie' },
    client: 'BNIX',
    team: [['camera', 'Ilger Albert', 'Simon Haex'], ['edit', 'Ilger Albert'], ['color', 'Ilger Albert']]
  },
  {
    slug: 'bnix-testimonials', title: 'BNIX 30 jaar', year: '2025', ratio: '16:9', len: '2:59',
    kind: { en: 'Testimonials', nl: 'Testimonials' },
    client: 'BNIX',
    team: [['camera', 'Ilger Albert', 'Simon Haex'], ['edit', 'Ilger Albert'], ['color', 'Ilger Albert']]
  },
  {
    slug: 'heylen-gsj', title: 'Heylen Vastgoed × GSJ Advocaten', year: '2025', ratio: '16:9', len: '0:33',
    kind: { en: 'Event', nl: 'Event' },
    production: 'Sebbe Van Hove', client: 'Heylen Vastgoed × GSJ Advocaten',
    team: [['camera', 'Ilger Albert', 'Sebbe Van Hove'], ['edit', 'Ilger Albert']]
  },
  {
    slug: 'bumaco', title: 'Bumaco Boutique', year: '2025', ratio: '16:9', len: '1:00',
    kind: { en: 'Aftermovie', nl: 'Aftermovie' },
    production: 'Sebbe Van Hove', client: 'Bumaco Boutique',
    team: [['camera', 'Ilger Albert', 'Sebbe Van Hove'], ['edit', 'Sebbe Van Hove']]
  },
  {
    slug: 'reportage', title: 'Kotbelasting', year: '2025', ratio: '16:9', len: '3:05',
    kind: { en: 'Reportage', nl: 'Reportage' },
    team: [['camera', 'Ilger Albert', 'Simon Haex', 'Sebbe Van Hove', 'Haakon De Clippel'], ['edit', 'Ilger Albert'], ['color', 'Ilger Albert']]
  },
  {
    slug: 'splintertime', title: 'Splintertime', year: '2024', ratio: '16:9', len: '1:45',
    kind: { en: 'Aftermovie', nl: 'Aftermovie' },
    client: 'Splintertime',
    team: [['camera', 'Ilger Albert'], ['edit', 'Ilger Albert'], ['color', 'Ilger Albert']]
  }
];
