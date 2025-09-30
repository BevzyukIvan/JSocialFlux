-- 1) Якщо такий індекс існує — прибираємо частковий
DROP INDEX IF EXISTS uniq_private_chat_key;

-- 2) Додаємо унікальний КОНСТРЕЙНТ по всій таблиці
ALTER TABLE chat
    ADD CONSTRAINT uk_chat_private_key UNIQUE (private_key);