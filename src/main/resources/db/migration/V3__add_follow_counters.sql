/* 1. Додаємо поля з дефолтним 0 */
ALTER TABLE users
    ADD COLUMN followers_cnt BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN following_cnt BIGINT NOT NULL DEFAULT 0;

/* 2. Заповнюємо для вже існуючих даних */
UPDATE users u SET
                   followers_cnt = (
                       SELECT COUNT(*) FROM user_following f
                       WHERE f.followed_id = u.id
                   ),
                   following_cnt = (
                       SELECT COUNT(*) FROM user_following f
                       WHERE f.follower_id = u.id
                   );
