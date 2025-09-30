
ALTER TABLE chat ADD COLUMN created_at TIMESTAMPTZ;

UPDATE chat c
SET created_at = COALESCE(
        (SELECT MIN(m.sent_at) FROM message m WHERE m.chat_id = c.id),
        now()
                 );

ALTER TABLE chat ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE chat ALTER COLUMN created_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_chat_created_at_desc_id_desc
    ON chat (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_message_chat_sent_at_desc_id_desc
    ON message (chat_id, sent_at DESC, id DESC);
