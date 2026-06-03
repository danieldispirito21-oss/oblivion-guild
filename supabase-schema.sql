-- ══════════════════════════════════════════
-- OBLIVION GUILD — Supabase Schema
-- Ejecutar en SQL Editor de Supabase
-- ══════════════════════════════════════════

-- Profiles (extiende auth.users de Supabase)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname      TEXT NOT NULL DEFAULT '',
  role          TEXT NOT NULL DEFAULT 'pending',   -- pending | member | officer | admin
  badge         TEXT NOT NULL DEFAULT 'member',    -- member | officer | master
  specialty     TEXT DEFAULT '',
  weapons       TEXT DEFAULT '',
  bio           TEXT DEFAULT '',
  quote         TEXT DEFAULT '',
  image_url     TEXT DEFAULT '',
  guild_coins   INTEGER DEFAULT 0,
  status        TEXT DEFAULT 'active',
  discord_tag   TEXT DEFAULT '',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Eventos / Misiones
CREATE TABLE IF NOT EXISTS events (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  description   TEXT DEFAULT '',
  event_type    TEXT DEFAULT 'general',  -- siege | dungeon | meeting | general
  event_date    TIMESTAMPTZ NOT NULL,
  max_players   INTEGER DEFAULT 0,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- RSVPs de eventos
CREATE TABLE IF NOT EXISTS event_rsvps (
  id            SERIAL PRIMARY KEY,
  event_id      INTEGER REFERENCES events(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status        TEXT DEFAULT 'attending',  -- attending | not_attending | maybe
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- GuildCoins — historial de transacciones
CREATE TABLE IF NOT EXISTS coin_transactions (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL,
  reason        TEXT DEFAULT '',
  given_by      UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Logros / Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement   TEXT NOT NULL,  -- stonegard_conqueror | veteran | founder | etc
  earned_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement)
);

-- Votaciones
CREATE TABLE IF NOT EXISTS polls (
  id            SERIAL PRIMARY KEY,
  question      TEXT NOT NULL,
  options       JSONB NOT NULL DEFAULT '[]',
  active        BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES auth.users(id),
  ends_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id            SERIAL PRIMARY KEY,
  poll_id       INTEGER REFERENCES polls(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  option_idx    INTEGER NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(poll_id, user_id)
);

-- Solicitudes de reclutamiento
CREATE TABLE IF NOT EXISTS applications (
  id            SERIAL PRIMARY KEY,
  user_id       UUID REFERENCES auth.users(id),
  nickname      TEXT NOT NULL,
  game          TEXT DEFAULT '',
  why           TEXT DEFAULT '',
  status        TEXT DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by   UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ══════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ══════════════════════════════════════════

ALTER TABLE profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_rsvps     ENABLE ROW LEVEL SECURITY;
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls           ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications    ENABLE ROW LEVEL SECURITY;

-- Profiles: cualquiera puede ver, solo el dueño edita
CREATE POLICY "Profiles visibles para todos" ON profiles FOR SELECT USING (true);
CREATE POLICY "Usuario edita su propio perfil" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Supabase inserta perfil en registro" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Eventos: miembros ven, officers/admin crean
CREATE POLICY "Miembros ven eventos" ON events FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('member','officer','admin')));
CREATE POLICY "Officers crean eventos" ON events FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));
CREATE POLICY "Officers editan eventos" ON events FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));
CREATE POLICY "Officers borran eventos" ON events FOR DELETE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));

-- RSVPs: miembros gestionan los suyos
CREATE POLICY "Miembros ven RSVPs" ON event_rsvps FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('member','officer','admin')));
CREATE POLICY "Miembros hacen RSVP" ON event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Miembros actualizan su RSVP" ON event_rsvps FOR UPDATE USING (auth.uid() = user_id);

-- Logros: todos ven los suyos
CREATE POLICY "Ver propios logros" ON achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Ver logros publicos" ON achievements FOR SELECT USING (true);

-- GuildCoins: solo admins dan monedas
CREATE POLICY "Miembros ven sus monedas" ON coin_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Officers dan monedas" ON coin_transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));

-- Polls: miembros ven y votan
CREATE POLICY "Miembros ven polls" ON polls FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('member','officer','admin')));
CREATE POLICY "Officers crean polls" ON polls FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));
CREATE POLICY "Miembros votan" ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Miembros ven votos" ON poll_votes FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('member','officer','admin')));

-- Aplicaciones
CREATE POLICY "Aplicante ve la suya" ON applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Cualquiera aplica" ON applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Officers ven todas" ON applications FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));
CREATE POLICY "Officers gestionan" ON applications FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('officer','admin')));

-- ══════════════════════════════════════════
-- TRIGGER: actualizar updated_at en profiles
-- ══════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$ BEGIN
  NEW.updated_at = NOW(); RETURN NEW;
END; $$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ══════════════════════════════════════════
-- TRIGGER: crear perfil automáticamente al registrarse
-- ══════════════════════════════════════════
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, nickname, discord_tag)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'user_name', '')
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ══════════════════════════════════════════
-- Tu primer admin: ejecutar después de registrarte
-- Reemplaza 'TU_EMAIL@ejemplo.com' con tu email
-- ══════════════════════════════════════════
-- UPDATE profiles SET role = 'admin', badge = 'master'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'TU_EMAIL@ejemplo.com');
