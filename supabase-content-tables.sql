-- ══════════════════════════════════════════
-- TABLAS DE CONTENIDO — Admin Panel
-- Ejecutar en Supabase SQL Editor
-- ══════════════════════════════════════════

-- Miembros del sitio (los que se ven en la página principal)
CREATE TABLE IF NOT EXISTS content_members (
  id          SERIAL PRIMARY KEY,
  nickname    TEXT DEFAULT '',
  role_label  TEXT DEFAULT 'Member',
  specialty   TEXT DEFAULT '',
  weapons     TEXT DEFAULT '',
  bio         TEXT DEFAULT '',
  quote       TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  badge       TEXT DEFAULT 'member',
  status      TEXT DEFAULT 'active',
  is_pending  BOOLEAN DEFAULT false,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Noticias / Capítulos
CREATE TABLE IF NOT EXISTS content_news (
  id          SERIAL PRIMARY KEY,
  chapter     TEXT DEFAULT '',
  title       TEXT NOT NULL DEFAULT '',
  date_label  TEXT DEFAULT '',
  category    TEXT DEFAULT 'guild',
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  featured    BOOLEAN DEFAULT false,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Guías
CREATE TABLE IF NOT EXISTS content_guides (
  id          SERIAL PRIMARY KEY,
  game        TEXT DEFAULT '',
  game_short  TEXT DEFAULT '',
  category    TEXT DEFAULT '',
  title       TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  content     TEXT DEFAULT '',
  author      TEXT DEFAULT '',
  date_label  TEXT DEFAULT '',
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Galería
CREATE TABLE IF NOT EXISTS content_gallery (
  id          SERIAL PRIMARY KEY,
  title       TEXT DEFAULT '',
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  is_empty    BOOLEAN DEFAULT false,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS: Lectura pública, escritura solo officers/admin ──
ALTER TABLE content_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_news    ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_guides  ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_gallery ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede leer
CREATE POLICY "Public read members" ON content_members FOR SELECT USING (true);
CREATE POLICY "Public read news"    ON content_news    FOR SELECT USING (true);
CREATE POLICY "Public read guides"  ON content_guides  FOR SELECT USING (true);
CREATE POLICY "Public read gallery" ON content_gallery FOR SELECT USING (true);

-- Solo officers/admin pueden escribir
CREATE POLICY "Officers write members" ON content_members FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));
CREATE POLICY "Officers write news" ON content_news FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));
CREATE POLICY "Officers write guides" ON content_guides FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));
CREATE POLICY "Officers write gallery" ON content_gallery FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));

-- ── DATOS INICIALES ──
INSERT INTO content_members (nickname, role_label, specialty, weapons, bio, quote, image_url, badge, status, sort_order) VALUES
('Corvo',   'Guild Master', 'DPS / Control',     'Dagger · Wand & Tome',       'Fundador de Oblivion. Estratega nato. El que decidía cuándo atacar, cuándo esperar y cuándo apostar todo.', 'No pedimos obediencia. Pedimos creer.',    'assets/characters/Corvo.png',   'master',  'veteran', 1),
('Hazel',   'Officer',      'Support / Healer',  'Wand & Tome · Staff',         'La razón por la que Oblivion sobrevivió asedios que habrían destruido a cualquier otro guild.',              'La línea no cae mientras yo esté de pie.', 'assets/characters/Hazel.png',   'officer', 'veteran', 2),
('Kael',    'Member',       'DPS / Ranged',      'Longbow · Crossbow',          'Silenciosa y letal. Su posicionamiento en siege era imposible de predecir.',                                  'El que no te ve venir, ya perdió.',        'assets/characters/Kael.png',    'member',  'veteran', 3),
('Liam',    'Member',       'Frontline / DPS',   'Sword & Shield · Greatsword', 'De los primeros en entrar y de los últimos en retirarse. Saurodoma fue suya.',                               'La lealtad no se promete, se demuestra.',  'assets/characters/Liam.png',    'member',  'veteran', 4),
('Bastion', 'Member',       'Tank / Protector',  'Sword & Shield · Wand',       'El escudo más grande del guild. Cuando Alex sostenía una puerta, nadie la cruzaba.',                         'Nadie pasa.',                              'assets/characters/Alex.png',    'member',  'veteran', 5),
('Ozzler',  'Member',       'DPS / Disruptor',   'Greatsword · Dagger',         'El que siempre encontraba el ángulo inesperado. Imposible de ignorar en batalla.',                           'Hazlos mirar a otro lado.',                'assets/characters/ozzler.png',  'member',  'veteran', 6),
('Scions',  'Member',       'DPS / Dark Blade',  'Greatsword · Dagger',         'Armadura negra. Espada roja. No necesita decir mucho — en batalla, su presencia habla sola.',                'El caos tiene su propio orden.',           'assets/characters/Scions.png',  'member',  'active',  7);

INSERT INTO content_news (chapter, title, date_label, category, description, image_url, featured, sort_order) VALUES
('Capítulo I',   'Reyes de Grinwell',                   '2024',        'guild', 'Oblivion conquistó Stonegard Castle. Éramos pocos. Fuimos reyes. Throne and Liberty quedó marcado con nuestro nombre.', 'manga/cap01/01.png', true,  1),
('Capítulo II',  'El Manga — Capítulo 1 Publicado',     'Junio 2026',  'manga', 'La historia de Oblivion llega en formato manga. 31 páginas que narran el inicio — desde el Vacío hasta la taberna.',     'manga/cap01/04.png', false, 2),
('Prólogo',      'Throne and Liberty — Legado',         '2025',        'guild', 'Cerramos un capítulo. Lo que construimos en Solisium no desaparece — queda grabado en la historia de la guild.',        'manga/cap01/20.png', false, 3),
('Capítulo III', 'El Próximo Mundo — AION 2',           'Próximamente','juego', 'NCSoft prepara el sucesor de un clásico. Oblivion estará ahí cuando abran las puertas.',                               null,                false, 4);

INSERT INTO content_guides (game, game_short, category, title, description, content, author, date_label, sort_order) VALUES
('Throne and Liberty', 'TL',   'Siege',   'Cómo conquistar Stonegard',   'Las mecánicas del asedio de castillo en TL y cómo Oblivion organizó la toma de Stonegard.',         'Próximamente...', 'Corvo',   '2024', 1),
('Throne and Liberty', 'TL',   'Build',   'Build DPS — Dagger / Wand',   'La build de control y daño que Oblivion usó en los asedios de Grinwell.',                           'Próximamente...', 'Corvo',   '2024', 2),
('General',            'Guild','Reglas',  'Código de la Guild',          'Lo que se espera de cada miembro de Oblivion. Lealtad, presencia en eventos y respeto al liderazgo.','Próximamente...', 'Oblivion','2024', 3);
