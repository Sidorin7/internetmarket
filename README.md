# ЛЁН — интернет-магазин одного продавца (учебный проект)

Next.js 16 · Drizzle + SQLite · Tailwind v4 · Mantine (админка) · Nodemailer

## Запуск

```bash
npm install
cp .env.example .env          # поменяйте ADMIN_PASSWORD и SESSION_SECRET
npm run db:migrate && npm run db:seed
docker compose up -d mailpit  # письма смотреть на http://localhost:8025
npm run dev                   # http://localhost:3000, админка — /admin
```

## Тесты

```bash
npm test      # unit (vitest)
npm run e2e   # сценарий покупки (playwright); поднимает свой сервер на :3100 с отдельной БД data/e2e.db
```

## Боевая почта

Замените `SMTP_*` на данные своего почтового ящика (например, smtp.yandex.ru:465 с паролем приложения)
и укажите `SELLER_EMAIL` — туда будут приходить заказы.
