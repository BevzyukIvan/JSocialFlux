CREATE INDEX IF NOT EXISTS idx_following_by_follower
    ON user_following (follower_id);

CREATE INDEX IF NOT EXISTS idx_followers_by_followed
    ON user_following (followed_id);
