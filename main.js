// Arranger (test): the markers are the song's sections. Duplicate, move or remove a section on
// every track at once, and the rest of the song moves to make room or close the gap.
//
// Everything is done with LUNA's own timeline edits on all tracks (select a range, cut, copy,
// paste), the way you would by hand, so clips, MIDI and automation travel together.

(() => {
  const $ = (id) => document.getElementById(id);
  const VERSION = '1.0.0';
  const KEY = 'com.fedetrillo.arranger.';
  const store = {
    get: (k) => { try { return JSON.parse(localStorage.getItem(KEY + k)); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch { /* not fatal */ } },
  };
  const I18N = {
    es: { _name: 'Español', dup: 'Duplicar', move: 'Mover', del: 'Quitar', before: 'delante de…', toEnd: 'al final', bars: '{n} comp.',
      noMarkers: 'El proyecto no tiene marcas. Pon una marca al principio de cada sección (INTRO, VERSE, CHORUS…).',
      hint: 'Cada sección va de su marca a la siguiente. Duplicar la repite justo detrás; Mover la coloca delante de otra; Quitar la elimina y cierra el hueco. Todo lo que va detrás se desplaza solo.',
      working: '{what}…', done: 'Hecho: {what}', failed: 'Error: {e}', undoAll: 'Deshacer arreglo',
      undone: 'Arreglo deshecho ({n} pasos)', nothingToUndo: 'No hay nada que deshacer', waiting: 'Esperando a LUNA…', noSession: 'Abre una sesión en LUNA.', report: 'Informe copiado', dark: 'Oscuro', grey: 'Gris',
      copyFailed: 'No pude crear la copia de playlist en: {n}. No he tocado nada.', original: 'Original', version: 'Versión', versions: 'Versiones:', noVersions: 'El original se guarda solo al hacer el primer cambio', snap: '+ Foto', snapTip: 'Guardar cómo está ahora y seguir probando en una copia', origTip: 'La canción tal como estaba: nunca se edita. Clic para volver a ella', verTip: 'Clic para cambiar a esta versión · doble clic para renombrar', switching: 'Cambiando a {n}…', switched: 'Ahora suena {n}', snapped: 'Foto guardada: sigues en {n}', copy: 'Copiar', paste: 'Pegar', pasteAfter: 'Pegar detrás', copiedSec: '{n} copiada: elige una sección y pega detrás (Cmd+V)', clipHeld: 'En el portapapeles: {n}', dragTip: 'Arrastra para mover · Alt+arrastrar para copiar · clic derecho: menú', dropMove: 'Suelta para mover aquí', dropCopy: 'Suelta para copiar aquí', keys: 'Arrastra los bloques para mover · Alt+arrastrar copia · Cmd+C / Cmd+V copia y pega detrás de la sección elegida · Cmd+D duplica · Supr quita', copySuffix: '2', tempoWarn: 'Ojo: el tema tiene cambios de tempo o compás después de esta sección; no se mueven con ella.' },
    en: { _name: 'English', dup: 'Duplicate', move: 'Move', del: 'Remove', before: 'before…', toEnd: 'to the end', bars: '{n} bars',
      noMarkers: 'The project has no markers. Put a marker at the start of each section (INTRO, VERSE, CHORUS…).',
      hint: 'Each section runs from its marker to the next. Duplicate repeats it right after; Move puts it before another; Remove deletes it and closes the gap. Everything after moves along.',
      working: '{what}…', done: 'Done: {what}', failed: 'Error: {e}', undoAll: 'Undo arrangement',
      undone: 'Arrangement undone ({n} steps)', nothingToUndo: 'Nothing to undo', waiting: 'Waiting for LUNA…', noSession: 'Open a session in LUNA.', report: 'Report copied', dark: 'Dark', grey: 'Grey',
      copyFailed: 'Could not make the playlist copy on: {n}. Nothing was changed.', original: 'Original', version: 'Version', versions: 'Versions:', noVersions: 'The original is kept the first time you change something', snap: '+ Snapshot', snapTip: 'Keep how it is now and keep trying on a copy', origTip: 'The song as it was: never edited. Click to go back to it', verTip: 'Click to switch to this version · double-click to rename', switching: 'Switching to {n}…', switched: 'Now playing {n}', snapped: 'Snapshot kept: you are on {n}', copy: 'Copy', paste: 'Paste', pasteAfter: 'Paste after', copiedSec: '{n} copied: pick a section and paste after it (Cmd+V)', clipHeld: 'On the clipboard: {n}', dragTip: 'Drag to move · Alt-drag to copy · right-click: menu', dropMove: 'Drop to move here', dropCopy: 'Drop to copy here', keys: 'Drag blocks to move · Alt-drag copies · Cmd+C / Cmd+V copy and paste after the chosen section · Cmd+D duplicates · Delete removes', copySuffix: '2', tempoWarn: 'Note: the song has tempo or meter changes after this section; they do not move with it.' },
    ca: { _name: 'Català', dup: 'Duplicar', move: 'Moure', del: 'Treure', bars: '{n} comp.', noMarkers: 'El projecte no té marques. Posa una marca al començament de cada secció (INTRO, VERSE, CHORUS…).', working: '{what}…', done: 'Fet: {what}', failed: 'Error: {e}', undoAll: 'Desfer arranjament', undone: 'Arranjament desfet ({n} passos)', nothingToUndo: 'No hi ha res per desfer', waiting: 'Esperant LUNA…', noSession: 'Obre una sessió a LUNA.', report: 'Informe copiat', dark: 'Fosc', grey: 'Gris', copyFailed: 'No he pogut crear la còpia de playlist a: {n}. No he tocat res.', original: 'Original', version: 'Versió', versions: 'Versions:', noVersions: 'L’original es desa sol en fer el primer canvi', snap: '+ Foto', snapTip: 'Desar com està ara i seguir provant en una còpia', origTip: 'La cançó tal com era: mai no s’edita. Clic per tornar-hi', verTip: 'Clic per canviar a aquesta versió · doble clic per canviar-ne el nom', switching: 'Canviant a {n}…', switched: 'Ara sona {n}', snapped: 'Foto desada: ets a {n}', copy: 'Copiar', paste: 'Enganxar', pasteAfter: 'Enganxar darrere', copiedSec: '{n} copiada: tria una secció i enganxa darrere (Cmd+V)', clipHeld: 'Al porta-retalls: {n}', dragTip: 'Arrossega per moure · Alt+arrossegar per copiar · clic dret: menú', dropMove: 'Deixa anar per moure aquí', dropCopy: 'Deixa anar per copiar aquí', keys: 'Arrossega els blocs per moure · Alt+arrossegar copia · Cmd+C / Cmd+V copia i enganxa darrere de la secció triada · Cmd+D duplica · Supr treu' },
    fr: { _name: 'Français', dup: 'Dupliquer', move: 'Déplacer', del: 'Retirer', bars: '{n} mes.', noMarkers: 'Le projet n’a pas de marqueurs. Placez un marqueur au début de chaque section (INTRO, VERSE, CHORUS…).', working: '{what}…', done: 'Fait : {what}', failed: 'Erreur : {e}', undoAll: 'Annuler l’arrangement', undone: 'Arrangement annulé ({n} étapes)', nothingToUndo: 'Rien à annuler', waiting: 'En attente de LUNA…', noSession: 'Ouvrez une session dans LUNA.', report: 'Rapport copié', dark: 'Sombre', grey: 'Gris', copyFailed: 'Impossible de copier la playlist sur : {n}. Rien n’a été modifié.', original: 'Original', version: 'Version', versions: 'Versions :', noVersions: 'L’original est gardé dès la première modification', snap: '+ Instantané', snapTip: 'Garder l’état actuel et continuer sur une copie', origTip: 'La chanson telle qu’elle était : jamais modifiée. Cliquez pour y revenir', verTip: 'Clic pour passer à cette version · double-clic pour la renommer', switching: 'Passage à {n}…', switched: '{n} en lecture', snapped: 'Instantané gardé : vous êtes sur {n}', copy: 'Copier', paste: 'Coller', pasteAfter: 'Coller après', copiedSec: '{n} copiée : choisissez une section et collez après (Cmd+V)', clipHeld: 'Dans le presse-papiers : {n}', dragTip: 'Glissez pour déplacer · Alt+glisser pour copier · clic droit : menu', dropMove: 'Relâchez pour déplacer ici', dropCopy: 'Relâchez pour copier ici', keys: 'Glissez les blocs pour déplacer · Alt+glisser copie · Cmd+C / Cmd+V copie et colle après la section choisie · Cmd+D duplique · Suppr retire' },
    de: { _name: 'Deutsch', dup: 'Duplizieren', move: 'Verschieben', del: 'Entfernen', bars: '{n} Takte', noMarkers: 'Das Projekt hat keine Marker. Setze an den Anfang jedes Teils einen Marker (INTRO, VERSE, CHORUS…).', working: '{what}…', done: 'Erledigt: {what}', failed: 'Fehler: {e}', undoAll: 'Arrangement rückgängig', undone: 'Arrangement rückgängig ({n} Schritte)', nothingToUndo: 'Nichts rückgängig zu machen', waiting: 'Warte auf LUNA…', noSession: 'Öffne eine Session in LUNA.', report: 'Bericht kopiert', dark: 'Dunkel', grey: 'Grau', copyFailed: 'Konnte die Playlist-Kopie nicht anlegen auf: {n}. Nichts wurde geändert.', original: 'Original', version: 'Version', versions: 'Versionen:', noVersions: 'Das Original wird bei der ersten Änderung gesichert', snap: '+ Schnappschuss', snapTip: 'Den jetzigen Stand sichern und an einer Kopie weiterprobieren', origTip: 'Der Song, wie er war: wird nie bearbeitet. Klick führt zurück', verTip: 'Klick wechselt zu dieser Version · Doppelklick benennt um', switching: 'Wechsle zu {n}…', switched: 'Jetzt läuft {n}', snapped: 'Schnappschuss gesichert: du bist auf {n}', copy: 'Kopieren', paste: 'Einfügen', pasteAfter: 'Dahinter einfügen', copiedSec: '{n} kopiert: wähle einen Teil und füge dahinter ein (Cmd+V)', clipHeld: 'In der Zwischenablage: {n}', dragTip: 'Ziehen zum Verschieben · Alt-Ziehen zum Kopieren · Rechtsklick: Menü', dropMove: 'Loslassen zum Verschieben', dropCopy: 'Loslassen zum Kopieren', keys: 'Blöcke ziehen zum Verschieben · Alt-Ziehen kopiert · Cmd+C / Cmd+V kopiert und fügt hinter dem gewählten Teil ein · Cmd+D dupliziert · Entf entfernt' },
    it: { _name: 'Italiano', dup: 'Duplica', move: 'Sposta', del: 'Togli', bars: '{n} batt.', noMarkers: 'Il progetto non ha marker. Metti un marker all’inizio di ogni sezione (INTRO, VERSE, CHORUS…).', working: '{what}…', done: 'Fatto: {what}', failed: 'Errore: {e}', undoAll: 'Annulla arrangiamento', undone: 'Arrangiamento annullato ({n} passi)', nothingToUndo: 'Niente da annullare', waiting: 'In attesa di LUNA…', noSession: 'Apri una sessione in LUNA.', report: 'Rapporto copiato', dark: 'Scuro', grey: 'Grigio', copyFailed: 'Non sono riuscito a copiare la playlist su: {n}. Non ho toccato nulla.', original: 'Originale', version: 'Versione', versions: 'Versioni:', noVersions: 'L’originale si salva da solo alla prima modifica', snap: '+ Istantanea', snapTip: 'Salva com’è ora e continua a provare su una copia', origTip: 'Il brano com’era: non si modifica mai. Clic per tornarci', verTip: 'Clic per passare a questa versione · doppio clic per rinominarla', switching: 'Passo a {n}…', switched: 'Ora suona {n}', snapped: 'Istantanea salvata: sei su {n}', copy: 'Copia', paste: 'Incolla', pasteAfter: 'Incolla dopo', copiedSec: '{n} copiata: scegli una sezione e incolla dopo (Cmd+V)', clipHeld: 'Negli appunti: {n}', dragTip: 'Trascina per spostare · Alt+trascina per copiare · clic destro: menu', dropMove: 'Rilascia per spostare qui', dropCopy: 'Rilascia per copiare qui', keys: 'Trascina i blocchi per spostare · Alt+trascina copia · Cmd+C / Cmd+V copia e incolla dopo la sezione scelta · Cmd+D duplica · Canc toglie' },
    pt: { _name: 'Português', dup: 'Duplicar', move: 'Mover', del: 'Tirar', bars: '{n} comp.', noMarkers: 'O projeto não tem marcadores. Põe um marcador no início de cada secção (INTRO, VERSE, CHORUS…).', working: '{what}…', done: 'Feito: {what}', failed: 'Erro: {e}', undoAll: 'Desfazer arranjo', undone: 'Arranjo desfeito ({n} passos)', nothingToUndo: 'Nada para desfazer', waiting: 'À espera do LUNA…', noSession: 'Abre uma sessão no LUNA.', report: 'Relatório copiado', dark: 'Escuro', grey: 'Cinzento', copyFailed: 'Não consegui criar a cópia da playlist em: {n}. Não mexi em nada.', original: 'Original', version: 'Versão', versions: 'Versões:', noVersions: 'O original guarda-se sozinho na primeira alteração', snap: '+ Foto', snapTip: 'Guardar como está agora e continuar a experimentar numa cópia', origTip: 'A canção tal como estava: nunca é editada. Clique para voltar a ela', verTip: 'Clique para mudar para esta versão · duplo clique para mudar o nome', switching: 'A mudar para {n}…', switched: 'Agora toca {n}', snapped: 'Foto guardada: estás em {n}', copy: 'Copiar', paste: 'Colar', pasteAfter: 'Colar depois', copiedSec: '{n} copiada: escolhe uma secção e cola depois (Cmd+V)', clipHeld: 'Na área de transferência: {n}', dragTip: 'Arrasta para mover · Alt+arrastar para copiar · clique direito: menu', dropMove: 'Larga para mover aqui', dropCopy: 'Larga para copiar aqui', keys: 'Arrasta os blocos para mover · Alt+arrastar copia · Cmd+C / Cmd+V copia e cola depois da secção escolhida · Cmd+D duplica · Delete tira' },
  };
  let lang = store.get('lang') ?? (() => { for (const l of navigator.languages ?? [navigator.language]) { const c = String(l || '').slice(0, 2).toLowerCase(); if (I18N[c]) return c; } return 'en'; })();
  if (!I18N[lang]) lang = 'en';
  const t = (k, v = {}) => String(I18N[lang][k] ?? I18N.en[k] ?? k).replace(/\{(\w+)\}/g, (m, x) => (x in v ? String(v[x]) : m));
  let theme = store.get('theme') === 'grey' ? 'grey' : 'dark';
  let statusTimer;
  const say = (key, vars = {}, kind = '', ms = 0) => { clearTimeout(statusTimer); $('status').textContent = key ? t(key, vars) : ''; $('status').className = `status ${kind}`; if (ms) statusTimer = setTimeout(() => say(null), ms); };
  const log = [];
  const note = (what, extra = {}) => { log.push({ t: new Date().toISOString().slice(11, 23), what, ...extra }); if (log.length > 300) log.shift(); };
  const errText = (e) => String(e?.message || e);

  let repaint = () => {};
  function paintStatic() {
    document.documentElement.lang = lang;
    document.documentElement.dataset.theme = theme;
    $('ver').textContent = `v${VERSION}`;
    $('lang').replaceChildren(...Object.keys(I18N).map((c) => Object.assign(document.createElement('option'), { value: c, textContent: I18N[c]._name })));
    $('lang').value = lang;
    for (const [id, name] of [['tDark', 'dark'], ['tGrey', 'grey']]) { $(id).classList.toggle('on', theme === name); $(id).title = t(name); }
    $('hint').textContent = t('keys'); $('undoAll').textContent = t('undoAll');
    repaint();
  }
  $('lang').onchange = () => { lang = $('lang').value; store.set('lang', lang); paintStatic(); };
  for (const b of [$('tDark'), $('tGrey')]) b.onclick = () => { theme = b.dataset.t; store.set('theme', theme); paintStatic(); };
  paintStatic();

  // Marker colours are ARGB; a marker with none gets one from this palette.
  const PALETTE = ['#5b6cff', '#ff9f1a', '#1fd17a', '#ff4d6d', '#00b2ff', '#a855f7', '#ffd60a', '#12d6c0', '#ff6bd6', '#84cc16'];
  // Each section name keeps the colour it first got (VERSE and VERSE 2 share one), all different.
  const colourMap = store.get('colours') ?? {};
  const colourOf = (m, i) => {
    const c = m.color?.value; if (typeof c === 'number' && (c & 0xffffff)) return `#${(c & 0xffffff).toString(16).padStart(6, '0')}`;
    const base = String(m.name?.value || `#${i}`).replace(/\s*\d+$/, '').trim().toUpperCase();
    if (!(base in colourMap)) { const used = new Set(Object.values(colourMap)); let k = 0; while (used.has(k % PALETTE.length) && k < PALETTE.length) k++; colourMap[base] = k % PALETTE.length; store.set('colours', colourMap); }
    return PALETTE[colourMap[base]];
  };

  let luna, built;
  async function build() {
    const s = luna.sessions.current();
    if (s === built) return;
    built = s;
    if (!s) { say('noSession'); return; }
    await s.ready();
    if (s !== built) return;
    await s.musical.ready();
    say(null);
    const tl = s.musical.timeline, ctx = s.context;
    const TPB = Luna.TICKS_PER_BEAT;
    let busy = false, selected = -1;
    let undoSteps = 0;

    const tracks = () => s.tracks.items.filter((x) => x && x.trackType?.value);
    async function songEnd() {
      let end = 0;
      for (const tk of tracks()) {
        const lane = s.playlistFor(tk);
        if (!lane) continue;
        await lane.clips.load();
        for (const c of lane.clips.items) end = Math.max(end, c.stop.value);
      }
      const last = s.markers.sorted.at(-1);
      if (last) end = Math.max(end, last.location.value + 4 * TPB);
      const bar = tl.barBeat(end).bar;
      return tl.tickAtBar(bar + 1);
    }
    let endTick = 0;
    function sections() {
      const ms = s.markers.sorted;
      return ms.map((m, i) => ({ i, marker: m, name: m.name.value || `#${i + 1}`, A: m.location.value, B: i + 1 < ms.length ? ms[i + 1].location.value : Math.max(endTick, m.location.value + TPB), colour: colourOf(m, i) }));
    }
    const barsOf = (A, B) => { const a = tl.barBeat(A), b = tl.barBeat(B); return Math.round(((b.bar - a.bar) + ((b.beat - a.beat) / 4)) * 10) / 10; };

    // Readable text on a coloured block.
    const inkFor = (hex) => { const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? '#12141a' : '#ffffff'; };
    const ICON = {
      dup: '<svg viewBox="0 0 24 24"><rect x="3.5" y="7" width="8" height="10" rx="2"/><rect x="12.5" y="7" width="8" height="10" rx="2"/><path d="M16.5 10v4M14.5 12h4"/></svg>',
      copy: '<svg viewBox="0 0 24 24"><rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16"/></svg>',
      paste: '<svg viewBox="0 0 24 24"><rect x="5" y="5" width="14" height="16" rx="2.5"/><path d="M9 3.5h6v3H9z"/><path d="M9 13h6M9 16.5h4"/></svg>',
      del: '<svg viewBox="0 0 24 24"><path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/></svg>',
    };
    let clip = null;   // a copied section: { marker, name }
    function paint() {
      paintVersions();
      const secs = sections();
      const strip = $('strip'), list = $('list');
      $('pasteHint').hidden = !clip;
      if (clip) $('pasteHint').textContent = t('clipHeld', { n: clip.name });
      if (!secs.length) { strip.replaceChildren(); list.replaceChildren(Object.assign(document.createElement('div'), { className: 'empty', textContent: t('noMarkers') })); return; }
      const total = secs.reduce((a, x) => a + (x.B - x.A), 0) || 1;
      strip.replaceChildren(...secs.map((x) => {
        const b = document.createElement('div');
        b.className = `blk${selected === x.i ? ' sel' : ''}${busy ? ' busy' : ''}`;
        b.style.flex = `${(x.B - x.A) / total} 1 0`;
        b.style.setProperty('--c', x.colour);
        b.style.color = inkFor(x.colour);
        b.innerHTML = '<b></b><span></span>';
        b.querySelector('b').textContent = x.name;
        b.querySelector('span').textContent = t('bars', { n: barsOf(x.A, x.B) });
        b.dataset.i = x.i;
        b.title = t('dragTip');
        b.onpointerdown = (ev) => startDrag(ev, x, b);
        b.oncontextmenu = (ev) => { ev.preventDefault(); selected = x.i; paint(); openMenu(ev.clientX, ev.clientY, x); };
        return b;
      }));
      list.replaceChildren(...secs.map((x) => {
        const row = document.createElement('div');
        row.className = `sec${selected === x.i ? ' sel' : ''}`;
        row.innerHTML = '<div class="dot"></div><div class="nm"><b></b><span></span></div><div class="acts"></div>';
        row.querySelector('.dot').style.background = x.colour;
        row.querySelector('b').textContent = x.name;
        row.querySelector('.nm span').textContent = `${tl.formatBarBeat(x.A)} · ${t('bars', { n: barsOf(x.A, x.B) })}`;
        const ib = (k, fn) => { const b = document.createElement('button'); b.className = 'ib'; b.innerHTML = ICON[k]; b.title = t(k); b.setAttribute('aria-label', t(k)); b.disabled = busy; b.onclick = (ev) => { ev.stopPropagation(); fn(); }; return b; };
        row.querySelector('.acts').append(
          ib('dup', () => void run(`${t('dup')} ${x.name}`, () => duplicateSection(x))),
          ib('copy', () => copyClip(x)),
          ib('paste', () => pasteAfter(x)),
          ib('del', () => void run(`${t('del')} ${x.name}`, () => removeSection(x))));
        row.querySelector('.acts').lastChild.classList.add('danger');
        row.querySelectorAll('.ib')[2].disabled = busy || !clip;
        row.onclick = () => { selected = x.i; paint(); };
        return row;
      }));
    }

    // ---- Mouse: drag a block to move it, Alt-drag to copy; right-click for a menu ------------------
    function insertIndexAt(clientX) {
      const blocks = [...$('strip').querySelectorAll('.blk')];
      for (const [k, el] of blocks.entries()) { const r = el.getBoundingClientRect(); if (clientX < r.left + r.width / 2) return k; }
      return blocks.length;
    }
    function startDrag(ev, x, el) {
      if (busy || ev.button !== 0) return;
      const x0 = ev.clientX;
      let dragging = false, ghost = null, at = -1;
      const marker = $('dropMark');
      const move = (e) => {
        if (!dragging && Math.abs(e.clientX - x0) < 5) return;
        if (!dragging) {
          dragging = true;
          ghost = el.cloneNode(true); ghost.className = 'blk ghost'; ghost.style.width = `${el.getBoundingClientRect().width}px`;
          document.body.append(ghost); el.classList.add('lifted');
        }
        ghost.style.left = `${e.clientX - 30}px`; ghost.style.top = `${el.getBoundingClientRect().top - 6}px`;
        ghost.classList.toggle('copying', e.altKey);
        at = insertIndexAt(e.clientX);
        const blocks = [...$('strip').querySelectorAll('.blk')];
        const sr = $('strip').getBoundingClientRect();
        const ref = blocks[at] ? blocks[at].getBoundingClientRect().left - 2 : blocks.at(-1).getBoundingClientRect().right + 1;
        const noop = !e.altKey && (at === x.i || at === x.i + 1);
        marker.hidden = noop; marker.style.left = `${ref - sr.left}px`;
        $('dragHint').textContent = e.altKey ? t('dropCopy') : t('dropMove');
      };
      const up = (e) => {
        window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up);
        marker.hidden = true; $('dragHint').textContent = '';
        if (ghost) ghost.remove();
        el.classList.remove('lifted');
        if (!dragging) { selected = x.i; paint(); return; }
        const secs = sections();
        const where = at >= secs.length ? 'end' : String(at);
        if (e.altKey) void run(`${t('copy')} ${x.name}`, () => copySectionTo(x, where));
        else if (at !== x.i && at !== x.i + 1) void run(`${t('move')} ${x.name}`, () => moveSection(x, where));
      };
      window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
    }
    function openMenu(cx, cy, x) {
      const m = $('menu');
      const item = (k, fn, off = false) => { const b = document.createElement('button'); b.innerHTML = `${ICON[k] ?? ''}<span></span>`; b.querySelector('span').textContent = t(k === 'paste' ? 'pasteAfter' : k); b.disabled = off; b.onclick = () => { m.hidden = true; fn(); }; return b; };
      m.replaceChildren(
        item('dup', () => void run(`${t('dup')} ${x.name}`, () => duplicateSection(x))),
        item('copy', () => copyClip(x)),
        item('paste', () => pasteAfter(x), !clip),
        item('del', () => void run(`${t('del')} ${x.name}`, () => removeSection(x))));
      m.lastChild.classList.add('danger');
      m.hidden = false;
      const r = m.getBoundingClientRect();
      m.style.left = `${Math.min(cx, innerWidth - r.width - 6)}px`; m.style.top = `${Math.min(cy, innerHeight - r.height - 6)}px`;
    }
    document.addEventListener('pointerdown', (ev) => { if (!ev.target.closest?.('#menu')) $('menu').hidden = true; });
    function copyClip(x) { clip = { name: x.name }; say('copiedSec', { n: x.name }, 'ok', 3000); paint(); }
    function pasteAfter(x) {
      if (!clip) return;
      const src = sections().find((y) => y.name === clip.name);
      if (!src) { clip = null; paint(); return; }
      const where = x.i + 1 >= sections().length ? 'end' : String(x.i + 1);
      void run(`${t('paste')} ${src.name}`, () => copySectionTo(src, where));
    }
    document.addEventListener('keydown', (ev) => {
      if (busy || selected < 0 || ev.target.closest?.('select,input')) return;
      const x = sections()[selected];
      if (!x) return;
      const mod = ev.metaKey || ev.ctrlKey;
      if (mod && ev.key.toLowerCase() === 'c') { ev.preventDefault(); copyClip(x); }
      else if (mod && ev.key.toLowerCase() === 'v') { ev.preventDefault(); pasteAfter(x); }
      else if (mod && ev.key.toLowerCase() === 'd') { ev.preventDefault(); void run(`${t('dup')} ${x.name}`, () => duplicateSection(x)); }
      else if (ev.key === 'Backspace' || ev.key === 'Delete') { ev.preventDefault(); void run(`${t('del')} ${x.name}`, () => removeSection(x)); }
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') { selected = Math.max(0, Math.min(sections().length - 1, selected + (ev.key === 'ArrowLeft' ? -1 : 1))); paint(); }
    });
    repaint = paint;


    // ---- Snapshots: every version is a playlist version on each track, plus its markers ------------
    // "Original" is the song as it was the first time Arranger edited it; it is never edited. The
    // add-on always edits a copy, and switching versions swaps every track's playlist and the markers.
    const vstore = s.storage.context('com.fedetrillo.arranger');
    let versions = [], active = 0;
    const laneTracks = () => tracks().filter((x) => x.playlistUid?.value);
    async function loadVersions() {
      try {
        await vstore.load();
        versions = vstore.value('versions', 'list').value ?? [];
        active = vstore.value('versions', 'active').value ?? 0;
      } catch (e) { note('storage load failed', { e: errText(e) }); }
    }
    async function saveVersions() {
      for (const [field, value] of [['list', versions], ['active', active]]) {
        if (vstore.value('versions', field).value === undefined) await vstore.add('versions', field, value);
        else await vstore.set('versions', field, value);
      }
    }
    const markerShot = () => s.markers.sorted.map((m) => ({ name: m.name.value, tick: m.location.value, color: m.color?.value ?? 0, comments: m.comments?.value ?? '' }));
    async function playlistVersions() {
      await s.playlists.load?.();
      const map = {};
      for (const tk of laneTracks()) { const p = s.playlists.byId?.(tk.playlistUid.value) ?? s.playlists.items.find((x) => x.id === tk.playlistUid.value || x.uid?.value === tk.playlistUid.value); if (p) map[tk.id] = p.version.value; }
      return map;
    }
    async function newVersion(name) {
      const ids = laneTracks().map((x) => x.id);
      await s.newPlaylists(ids, { duplicate: true });
      await s.playlists.load?.();
      // Make sure the new copy is the active one on every track.
      for (const id of ids) {
        const mine = s.playlists.items.filter((p) => p.trackUid.value === id);
        const top = Math.max(...mine.map((p) => p.version.value));
        const tk = s.tracks.byId(id);
        const cur = (await playlistVersions())[id];
        if (Number.isFinite(top) && cur !== top) await s.setPlaylist(id, top);
        void tk;
      }
      versions.push({ name, playlists: await playlistVersions(), markers: markerShot() });
      active = versions.length - 1;
      await saveVersions();
      note('version', { name, playlists: versions[active].playlists });
    }
    // Before the first edit: keep the song as "Original" and move to a copy to edit.
    async function ensureCopy() {
      if (!versions.length) { versions.push({ name: t('original'), playlists: await playlistVersions(), markers: markerShot() }); active = 0; await saveVersions(); }
      if (active === 0) {
        await newVersion(nextVersionName());
        // Never edit the original: if any track is still on its original playlist, stop here.
        const orig = versions[0].playlists, now = versions[active].playlists;
        const same = Object.keys(orig).filter((id) => now[id] === orig[id]);
        if (same.length) {
          versions.pop(); active = 0; await saveVersions();
          throw new Error(t('copyFailed', { n: same.map((id) => s.tracks.byId(id)?.name.value).join(', ') }));
        }
      }
    }
    const nextVersionName = () => `${t('version')} ${versions.length + 1}`;
    async function rememberMarkers() { if (versions[active]) { versions[active].markers = markerShot(); await saveVersions(); } }
    async function restoreMarkers(list) {
      for (const m of [...s.markers.sorted]) await m.delete();
      for (const m of list) await s.addMarker(m.tick, m.name, { ...(m.color ? { color: m.color } : {}), ...(m.comments ? { comments: m.comments } : {}) });
    }
    async function switchTo(k) {
      if (busy || k === active || !versions[k]) return;
      busy = true; paint(); say('switching', { n: versions[k].name });
      try {
        await rememberMarkers();
        for (const [id, v] of Object.entries(versions[k].playlists)) if (s.tracks.byId(id)) await s.setPlaylist(id, v);
        await restoreMarkers(versions[k].markers);
        active = k; await saveVersions();
        undoSteps = 0;
        say('switched', { n: versions[k].name }, 'ok', 4000);
      } catch (e) { note('switch failed', { e: errText(e) }); say('failed', { e: errText(e) }, 'bad', 8000); }
      endTick = await songEnd().catch(() => endTick);
      busy = false; paint();
    }
    async function snapshotNow() {
      if (busy) return;
      busy = true; paint();
      try {
        if (!versions.length) { versions.push({ name: t('original'), playlists: await playlistVersions(), markers: markerShot() }); active = 0; }
        await rememberMarkers();
        await newVersion(nextVersionName());
        undoSteps = 0;
        say('snapped', { n: versions[active].name }, 'ok', 4000);
      } catch (e) { note('snapshot failed', { e: errText(e) }); say('failed', { e: errText(e) }, 'bad', 8000); }
      busy = false; paint();
    }
    function paintVersions() {
      const bar = $('versions');
      const chips = versions.map((v, k) => {
        const b = document.createElement('button');
        b.className = `chip${k === active ? ' on' : ''}${k === 0 ? ' orig' : ''}`;
        b.innerHTML = k === 0 ? '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg><span></span>' : '<span></span>';
        b.querySelector('span').textContent = v.name;
        b.title = k === 0 ? t('origTip') : t('verTip');
        b.disabled = busy;
        b.onclick = () => void switchTo(k);
        b.ondblclick = () => { if (k === 0) return; const inp = document.createElement('input'); inp.className = 'chipedit'; inp.value = v.name; b.replaceWith(inp); inp.focus(); inp.select(); const done = async () => { const n = inp.value.trim(); if (n) { v.name = n; await saveVersions(); } paint(); }; inp.onblur = done; inp.onkeydown = (e) => { if (e.key === 'Enter') inp.blur(); if (e.key === 'Escape') { inp.value = v.name; inp.blur(); } }; };
        return b;
      });
      const add = document.createElement('button');
      add.className = 'chip add'; add.textContent = t('snap'); add.title = t('snapTip'); add.disabled = busy;
      add.onclick = () => void snapshotNow();
      const lab = Object.assign(document.createElement('span'), { className: 'vlab', textContent: versions.length ? t('versions') : t('noVersions') });
      bar.replaceChildren(lab, ...chips, add);
    }

    // ---- Timeline edits on every track -----------------------------------------------------------
    // Cut or copy a range on all tracks, and paste it at a tick on all tracks.
    async function grab(A, B, cut) {
      await s.selectTimeline({ tracks: tracks(), startTick: A, stopTick: B });
      if (cut) await ctx.cut(); else await ctx.copy();
      note(cut ? 'cut' : 'copy', { A, B });
    }
    async function drop(at, len) {
      await s.selectTimeline({ tracks: tracks(), startTick: at, stopTick: at + len });
      await ctx.paste();
      note('paste', { at });
    }
    // Shift everything from `at` to the end of the song by `by` ticks (positive opens a gap).
    async function shiftFrom(at, by, end) {
      if (end <= at) return;
      await grab(at, end, true);
      await drop(at + by, end - at);
    }
    // Markers that move are taken out and put back where they belong, with their name, colour
    // and comments: moving them one by one can land one on top of another, which LUNA does not
    // keep. Returns the edits made.
    async function moveMarkers(plan) {
      const items = plan.filter((p) => p.to !== p.marker.location.value).map((p) => ({ marker: p.marker, to: p.to, name: p.marker.name.value, color: p.marker.color?.value, comments: p.marker.comments?.value }));
      if (!items.length) return 0;
      for (const it of items) await it.marker.delete();
      for (const it of items) await s.addMarker(it.to, it.name, { ...(it.color ? { color: it.color } : {}), ...(it.comments ? { comments: it.comments } : {}) });
      note('markers', { moved: items.map((it) => `${it.name}→${tl.formatBarBeat(it.to)}`) });
      return items.length * 2;
    }

    async function duplicateSection(x) {
      const L = x.B - x.A, end = Math.max(endTick, x.B), colour = x.marker.color?.value;
      const later = s.markers.sorted.filter((m) => m.location.value >= x.B);
      const plan = later.map((m) => ({ marker: m, to: m.location.value + L }));
      await shiftFrom(x.B, L, end);
      await grab(x.A, x.B, false);
      await drop(x.B, L);
      return async () => {
        const n = await moveMarkers(plan);
        await s.addMarker(x.B, `${x.name.replace(/\s+\d+$/, '')} ${nextNumber(x.name)}`, colour ? { color: colour } : {});
        return n + 1;
      };
    }
    async function removeSection(x) {
      const L = x.B - x.A, end = Math.max(endTick, x.B);
      const later = s.markers.sorted.filter((m) => m.location.value >= x.B);
      const plan = later.map((m) => ({ marker: m, to: m.location.value - L }));
      await grab(x.A, x.B, true);
      await shiftFrom(x.B, -L, end);
      return async () => {
        await x.marker.delete();
        return (await moveMarkers(plan)) + 1;
      };
    }
    // Move a section in front of another (or to the end): park it after the song, close its gap,
    // open one where it goes, and bring it back.
    async function moveSection(x, where) {
      const secs = sections();
      const L = x.B - x.A, end = Math.max(endTick, x.B);
      const park = tl.tickAtBar(tl.barBeat(end + L).bar + 8);
      const markersNow = s.markers.sorted.map((m) => ({ marker: m, at: m.location.value }));
      await grab(x.A, x.B, true);
      await drop(park, L);
      await shiftFrom(x.B, -L, end);
      // Where it lands, in the song without it.
      let P;
      if (where === 'end') P = end - L;
      else { const y = secs[Number(where)]; P = y.A > x.A ? y.A - L : y.A; }
      await shiftFrom(P, L, end - L);
      await grab(park, park + L, true);
      await drop(P, L);
      // Markers: the section's own marker goes to P; the rest follow the two shifts.
      const plan = markersNow.map(({ marker, at }) => {
        if (marker === x.marker) return { marker, to: P };
        let to = at >= x.B ? at - L : at;
        if (to >= P) to += L;
        return { marker, to };
      });
      return async () => moveMarkers(plan);
    }

    // Put a copy of a section in front of another (or at the end), opening a gap for it.
    async function copySectionTo(x, where) {
      const secs = sections();
      const L = x.B - x.A, end = Math.max(endTick, x.B), colour = x.marker.color?.value, label = `${x.name.replace(/\s+\d+$/, '')} ${nextNumber(x.name)}`;
      const P = where === 'end' ? end : secs[Number(where)].A;
      const later = s.markers.sorted.filter((m) => m.location.value >= P);
      const plan = later.map((m) => ({ marker: m, to: m.location.value + L }));
      await shiftFrom(P, L, end);
      const A = x.A >= P ? x.A + L : x.A;
      await grab(A, A + L, false);
      await drop(P, L);
      return async () => {
        const n = await moveMarkers(plan);
        await s.addMarker(P, label, colour ? { color: colour } : {});
        return n + 1;
      };
    }
    // VERSE → VERSE 2, then VERSE 3…
    function nextNumber(name) {
      const base = name.replace(/\s+\d+$/, '');
      const used = sections().map((y) => y.name).filter((n) => n === base || n.startsWith(`${base} `)).map((n) => Number(n.slice(base.length).trim()) || 1);
      return Math.max(1, ...used) + 1;
    }

    async function run(what, fn) {
      if (busy) return;
      busy = true; paint(); say('working', { what });
      const saved = ctx.snapshot?.();
      const t0 = performance.now();
      try {
        await ensureCopy();
        endTick = await songEnd();
        note('markersBefore', { list: s.markers.sorted.map((m) => `${m.name.value}@${tl.formatBarBeat(m.location.value)}`), end: tl.formatBarBeat(endTick) });
        const cc0 = s.changeCount?.value;
        const after = await s.transaction(`Arranger: ${what}`, fn);
        undoSteps++;
        if (typeof after === 'function') undoSteps += await after();
        await rememberMarkers();
        note('markersAfter', { list: s.markers.sorted.map((m) => `${m.name.value}@${tl.formatBarBeat(m.location.value)}`) });
        note('changeCount', { before: cc0, after: s.changeCount?.value, steps: undoSteps });
        note('done', { what, ms: Math.round(performance.now() - t0) });
        say('done', { what }, 'ok', 9000);
      } catch (e) {
        note('failed', { what, e: errText(e), code: e?.code, stack: String(e?.stack || '').split('\n').slice(0, 4).join(' | ') });
        say('failed', { e: errText(e) }, 'bad', 9000);
      }
      if (saved) await ctx.restore(saved).catch(() => undefined);
      endTick = await songEnd().catch(() => endTick);
      busy = false; paint();
    }

    $('undoAll').onclick = async () => {
      if (!undoSteps) { say('nothingToUndo', {}, '', 3000); return; }
      let n = 0;
      try { n = undoSteps; await s.undo(undoSteps); undoSteps = 0; } catch (e) { note('undo failed', { e: errText(e) }); }
      say('undone', { n }, 'ok', 4000);
    };
    $('ver').onclick = async (ev) => {
      if (!ev.altKey) return;
      const text = JSON.stringify({ version: VERSION, end: endTick, tracks: tracks().map((x) => x.name.value), sections: sections().map((x) => ({ name: x.name, A: x.A, B: x.B })), log }, null, 2);
      try { await navigator.clipboard.writeText(text); say('report', {}, 'ok', 2500); } catch { /* nothing */ }
    };
    // Keep the song's end (and so the last section's length) current as clips change.
    let endTimer = 0;
    const refreshEnd = () => { clearTimeout(endTimer); endTimer = setTimeout(async () => { if (busy) return; const e = await songEnd().catch(() => endTick); if (e !== endTick) { endTick = e; paint(); } }, 400); };
    s.markers.onChange?.(() => { if (!busy) { paint(); refreshEnd(); } });
    window.addEventListener('focus', refreshEnd);
    setInterval(refreshEnd, 5000);
    await loadVersions();
    endTick = await songEnd();
    paint();
  }

  (async () => {
    for (;;) {
      try { luna = await Luna.connect(); break; }
      catch { say('waiting'); await new Promise((r) => setTimeout(r, 1500)); }
    }
    Luna.bindShortcuts(luna, { onError: () => undefined });
    await luna.sessions.ready();
    luna.sessions.focused.onChange(() => void build());
    await build();
  })();
})();
