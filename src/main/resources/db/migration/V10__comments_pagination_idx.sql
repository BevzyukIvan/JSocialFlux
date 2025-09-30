-- індекс для пост-коментарів: фільтр по post_id і падіння по (created_at,id)
CREATE INDEX IF NOT EXISTS idx_post_comment_post_created_id_desc
    ON post_comment (post_id, created_at DESC, id DESC);

-- індекс для фото-коментарів: фільтр по photo_id і падіння по (created_at,id)
CREATE INDEX IF NOT EXISTS idx_photo_comment_photo_created_id_desc
    ON photo_comment (photo_id, created_at DESC, id DESC);
