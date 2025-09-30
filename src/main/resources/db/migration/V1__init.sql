CREATE SCHEMA IF NOT EXISTS jsocial;

-- ролі як ENUM‑тип на рівні БД
CREATE TYPE role AS ENUM ('ROLE_ADMIN', 'ROLE_USER');

-- 1. Users --------------------------------------------------------------
CREATE TABLE users (
                       id       BIGSERIAL PRIMARY KEY,
                       avatar   VARCHAR(255),
                       username VARCHAR(255) NOT NULL UNIQUE,
                       password VARCHAR(255) NOT NULL,
                       role     role         NOT NULL DEFAULT 'ROLE_USER',
                       CHECK (username <> '')
);

-- 2. Chats --------------------------------------------------------------
CREATE TABLE chat (
                      id       BIGSERIAL PRIMARY KEY,
                      avatar   VARCHAR(255),
                      is_group BOOLEAN      NOT NULL,
                      name     VARCHAR(255)
);

-- 3. Chat participants (M‑to‑M) ----------------------------------------
CREATE TABLE chat_participants (
                                   chat_id BIGINT NOT NULL REFERENCES chat(id)   ON DELETE CASCADE,
                                   user_id BIGINT NOT NULL REFERENCES users(id)  ON DELETE CASCADE,
                                   PRIMARY KEY (chat_id, user_id)
);

-- 4. Messages -----------------------------------------------------------
CREATE TABLE message (
                         id        BIGSERIAL PRIMARY KEY,
                         content   VARCHAR(255),
                         sent_at   TIMESTAMPTZ(6) DEFAULT NOW(),
                         chat_id   BIGINT REFERENCES chat(id)  ON DELETE CASCADE,
                         sender_id BIGINT REFERENCES users(id) ON DELETE SET NULL
);

-- 5. Photos -------------------------------------------------------------
CREATE TABLE photo (
                       id          BIGSERIAL PRIMARY KEY,
                       description VARCHAR(1000) NOT NULL,
                       uploaded_at TIMESTAMPTZ(6) DEFAULT NOW(),
                       url         VARCHAR(255),
                       user_id     BIGINT REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE photo_comment (
                               id         BIGSERIAL PRIMARY KEY,
                               content    VARCHAR(1000) NOT NULL,
                               created_at TIMESTAMPTZ(6) DEFAULT NOW(),
                               photo_id   BIGINT NOT NULL REFERENCES photo(id) ON DELETE CASCADE,
                               user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Posts --------------------------------------------------------------
CREATE TABLE post (
                      id         BIGSERIAL PRIMARY KEY,
                      content    VARCHAR(1000) NOT NULL,
                      created_at TIMESTAMPTZ(6) DEFAULT NOW(),
                      edited_at  TIMESTAMPTZ(6),
                      user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE post_comment (
                              id         BIGSERIAL PRIMARY KEY,
                              content    VARCHAR(1000) NOT NULL,
                              created_at TIMESTAMPTZ(6) DEFAULT NOW(),
                              post_id    BIGINT NOT NULL REFERENCES post(id)  ON DELETE CASCADE,
                              user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Followers (M‑to‑M) -------------------------------------------------
CREATE TABLE user_following (
                                follower_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                followed_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                PRIMARY KEY (follower_id, followed_id),
                                CHECK (follower_id <> followed_id)
);
