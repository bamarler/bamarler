-- Slingshot Game Schema

-- Players table (anonymous until they set a name)
CREATE TABLE IF NOT EXISTS slingshot_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    display_name TEXT,  -- NULL until user enters name
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Level attempts table (tracks best attempts per player per level)
CREATE TABLE IF NOT EXISTS slingshot_level_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES slingshot_players(id) ON DELETE CASCADE,
    level_id INT NOT NULL,
    attempts INT NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, level_id)
);

-- Index for faster leaderboard queries
CREATE INDEX IF NOT EXISTS idx_level_attempts_level
ON slingshot_level_attempts(level_id, attempts);

-- Leaderboard view (only show players with names)
CREATE OR REPLACE VIEW slingshot_leaderboard AS
SELECT
    p.display_name,
    la.level_id,
    la.attempts,
    la.completed_at,
    ROW_NUMBER() OVER (PARTITION BY la.level_id ORDER BY la.attempts ASC, la.completed_at ASC) as rank
FROM slingshot_level_attempts la
JOIN slingshot_players p ON p.id = la.player_id
WHERE p.display_name IS NOT NULL;

-- Overall leaderboard (total attempts across all levels, named players only)
CREATE OR REPLACE VIEW slingshot_overall_leaderboard AS
SELECT
    p.id as player_id,
    p.display_name,
    COUNT(DISTINCT la.level_id) as levels_completed,
    SUM(la.attempts) as total_attempts,
    MIN(la.completed_at) as first_completion
FROM slingshot_players p
JOIN slingshot_level_attempts la ON la.player_id = p.id
WHERE p.display_name IS NOT NULL
GROUP BY p.id, p.display_name
ORDER BY levels_completed DESC, total_attempts ASC;

-- RLS Policies
ALTER TABLE slingshot_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE slingshot_level_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for players"
ON slingshot_players FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Public read access for attempts"
ON slingshot_level_attempts FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can create players"
ON slingshot_players FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update their own player"
ON slingshot_players FOR UPDATE TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Anyone can insert attempts"
ON slingshot_level_attempts FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Function to upsert attempt (only update if new attempt is better)
CREATE OR REPLACE FUNCTION upsert_level_attempt(
    p_player_id UUID,
    p_level_id INT,
    p_attempts INT
) RETURNS void AS $$
BEGIN
    INSERT INTO slingshot_level_attempts (player_id, level_id, attempts)
    VALUES (p_player_id, p_level_id, p_attempts)
    ON CONFLICT (player_id, level_id)
    DO UPDATE SET
        attempts = LEAST(slingshot_level_attempts.attempts, EXCLUDED.attempts),
        completed_at = CASE
            WHEN EXCLUDED.attempts < slingshot_level_attempts.attempts
            THEN NOW()
            ELSE slingshot_level_attempts.completed_at
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set player name (only if not already set)
CREATE OR REPLACE FUNCTION set_player_name(
    p_player_id UUID,
    p_name TEXT
) RETURNS void AS $$
BEGIN
    UPDATE slingshot_players
    SET display_name = p_name
    WHERE id = p_player_id AND display_name IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;