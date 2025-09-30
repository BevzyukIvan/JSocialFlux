-- V9__add_feed_and_profile_indexes.sql
-- Індекси для швидкої курсорної пагінації (ts,id)

-- ===== ГЛОБАЛЬНА СТРІЧКА (без фільтра за користувачем) =====
-- Використовується в UNION фіду: ORDER BY created_at/ uploaded_at DESC, id DESC
CREATE INDEX IF NOT EXISTS idx_post_created_id_desc
    ON post (created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_photo_uploaded_id_desc
    ON photo (uploaded_at DESC, id DESC);

-- ===== ПРОФІЛЬ (фільтр за власником) =====
-- Використовується у запитах:
-- WHERE u.username = :username AND (created_at < :ts OR (created_at = :ts AND id < :tieId))
-- і аналогічно для фото.
CREATE INDEX IF NOT EXISTS idx_post_user_created_id_desc
    ON post (user_id, created_at DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_photo_user_uploaded_id_desc
    ON photo (user_id, uploaded_at DESC, id DESC);

-- На більшості схем users.username вже UNIQUE -> є індекс автоматично.
-- Але про всяк випадок (не зашкодить, якщо вже є унікальний):
-- CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
