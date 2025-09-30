CREATE OR REPLACE FUNCTION tg_update_follow_counters() RETURNS trigger
    LANGUAGE plpgsql AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE users SET following_cnt = following_cnt + 1
        WHERE id = NEW.follower_id;
        UPDATE users SET followers_cnt = followers_cnt + 1
        WHERE id = NEW.followed_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE users SET following_cnt = following_cnt - 1
        WHERE id = OLD.follower_id;
        UPDATE users SET followers_cnt = followers_cnt - 1
        WHERE id = OLD.followed_id;
    END IF;
    RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_user_following_aiud ON user_following;

CREATE TRIGGER trg_user_following_aiud
    AFTER INSERT OR DELETE ON user_following
    FOR EACH ROW EXECUTE PROCEDURE tg_update_follow_counters();
