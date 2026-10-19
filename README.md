# 🚀 JSocialFlux

**Live demo:** https://app.bevzyuk.site

JSocialFlux — **реактивна соцмережа** на **Spring WebFlux** з **live‑чатом** (WebSocket) та підтримкою горизонтального масштабування через **Redis Pub/Sub**.
Проєкт демонструє full‑stack підхід: **Java 21 + Spring Boot 3**, **PostgreSQL (R2DBC) + Flyway**, **Redis**, **JWT**, **Cloudinary** для фото та **React/Vite** фронтенд (папка `frontend`).

---

## ✨ Функціонал

- ✅ Аутентифікація та авторизація (Spring Security + JWT)
- ✅ Профіль, аватар
- ✅ Пости та коментарі
- ✅ Фото (завантаження/видалення) зберігаються у Cloudinary
- ✅ Підписки (follow/unfollow)
- ✅ **Live‑чат** (приватні та групові чати)
  - WebSocket endpoint: `GET /ws`
  - Повідомлення/превʼю чатів розсилаються через Redis Pub/Sub канали
- ✅ Пагінація (у т.ч. cursor‑based там, де це доречно)

---

## 🧱 Технології

**Backend**
- Spring Boot 3, Spring WebFlux
- Spring Security, Validation
- Spring Data R2DBC + PostgreSQL
- Flyway (міграції)
- Redis (Reactive) + Pub/Sub
- JWT
- Cloudinary інтеграція (через WebClient)

**Frontend**
- React + Vite (TypeScript)

---

## 📁 Структура репозиторію

- `src/` — бекенд (WebFlux)
- `src/main/resources/db/migration/` — Flyway міграції
- `frontend/` — фронтенд (React/Vite)
