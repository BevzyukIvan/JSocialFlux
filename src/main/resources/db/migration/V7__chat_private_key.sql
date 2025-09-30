ALTER TABLE chat ADD COLUMN private_key text;

WITH pairs AS (
    SELECT cp.chat_id,
           MIN(cp.user_id)::text AS u1,
           MAX(cp.user_id)::text AS u2,
           COUNT(*)              AS cnt
    FROM chat_participants cp
             JOIN chat c ON c.id = cp.chat_id
    WHERE c.is_group = FALSE
    GROUP BY cp.chat_id
    HAVING COUNT(*) = 2
)
UPDATE chat c
SET private_key = pairs.u1 || ':' || pairs.u2
FROM pairs
WHERE c.id = pairs.chat_id;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_private_chat_key
    ON chat (private_key)
    WHERE is_group = FALSE;

ALTER TABLE chat
    ADD CONSTRAINT chk_private_key_for_private
        CHECK (is_group OR private_key IS NOT NULL);
