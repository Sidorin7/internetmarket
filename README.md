# ЛЁН — интернет-магазин одного продавца (учебный проект)

Next.js 16 · Drizzle + libSQL (SQLite / Turso) · Tailwind v4 · Mantine (админка) · Nodemailer · Vercel Blob

## Локальный запуск

```bash
npm install
cp .env.example .env          # для локальной работы значения по умолчанию подходят
npm run db:migrate && npm run db:seed
docker compose up -d mailpit  # письма смотреть на http://localhost:8025
npm run dev                   # http://localhost:3000, админка — /admin
```

Локально база — файл `data/shop.db`, фото товаров складываются в `data/uploads`.

`npm run db:seed` пересоздаёт каталог и **удаляет все заказы**. Если заказы уже есть, сид откажется работать; чтобы запустить его всё равно, задайте `SEED_FORCE=1`.

## Тесты

```bash
npm test      # unit (vitest)
npm run e2e   # сценарий покупки (playwright); поднимает свой сервер на :3100 с отдельной БД data/e2e.db
```

## Деплой на Vercel

На Vercel нет постоянного диска, поэтому база живёт в [Turso](https://turso.tech), а фото — в Vercel Blob. Оба сервиса бесплатны на маленьких объёмах.

1. **База в Turso.** Выберите регион поближе к региону функций Vercel: каждый запрос к базе — это поход по сети.
   ```bash
   turso auth signup                  # или turso auth login
   turso db create len                # имя любое
   turso db show len --url            # → DATABASE_URL (libsql://…)
   turso db tokens create len         # → DATABASE_AUTH_TOKEN
   ```
2. **Проект на Vercel.** Импортируйте репозиторий на [vercel.com/new](https://vercel.com/new). Во вкладке **Storage** создайте Blob Store и подключите его к проекту: переменная `BLOB_READ_WRITE_TOKEN` появится сама.
3. **Переменные окружения** (Settings → Environment Variables):

   | Переменная | Значение |
   |---|---|
   | `DATABASE_URL`, `DATABASE_AUTH_TOKEN` | из шага 1 |
   | `ADMIN_PASSWORD` | не короче 12 символов |
   | `SESSION_SECRET` | `openssl rand -base64 48` |
   | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | почтовый ящик, например `smtp.yandex.ru`, `465` и [пароль приложения](https://id.yandex.ru/security/app-passwords) |
   | `MAIL_FROM` | тот же ящик, что в `SMTP_USER`, например `ЛЁН <shop@yandex.ru>` |
   | `SELLER_EMAIL` | куда присылать заказы |
   | `NEXT_PUBLIC_SHOP_NAME` | название магазина |

   Если оставить `ADMIN_PASSWORD` или `SESSION_SECRET` из `.env.example`, вход в админку в продакшене будет отключён: репозиторий публичный, и эти значения известны всем.
4. **Деплой.** Скрипт `vercel-build` сам применяет миграции к Turso перед сборкой. Каталог-пример можно залить один раз с локальной машины:
   ```bash
   DATABASE_URL=libsql://… DATABASE_AUTH_TOKEN=… npm run db:seed
   ```

## Безопасность

- Секреты хранятся только в `.env` и в настройках Vercel; `.env*`, `data/` и базы в git не попадают.
- В админку пускают по паролю. Сессия — подписанный JWT в httpOnly-cookie. Не больше 10 попыток входа за 15 минут с одного IP.
- Каждое оформление заказа отправляет письмо на указанный адрес, поэтому с одного IP можно оформить не больше 10 заказов в час.
- Страница заказа открывается только по ссылке с подписью: номера заказов идут подряд, и без подписи их можно было бы перебирать.
- Фото загружает только админ: JPG, PNG, WEBP или AVIF, до 5 МБ. В карточке товара допускаются только адреса наших хранилищ.
- Заголовки запрещают встраивать сайт в чужие страницы (`frame-ancestors 'none'`) и включают `nosniff`.
