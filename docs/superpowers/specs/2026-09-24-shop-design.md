# Учебный интернет-магазин одного продавца («мини-WB»)

## Контекст
Учебный проект: витрина для одного селлера, который уходит с маркетплейса на свой сайт.
UX как на WB: лента товаров, карточка, размеры, избранное, корзина, оформление.
Оплаты нет — при оформлении заказ сохраняется в БД и уходят 2 письма: продавцу
(номер заказа, телефон/контакты, состав корзины) и покупателю (подтверждение).
Папка `/Users/ivansidorin/Documents/Prog/internetmarket` пустая, git не инициализирован.

**Решения пользователя:** Next.js + Drizzle + SQLite; в MVP — админка, категории/поиск/фильтры,
размеры с остатками, избранное; письма продавцу и покупателю через SMTP (Nodemailer).
**Мои допущения:** покупатель без регистрации (имя, телефон, email, адрес, комментарий);
вход в админку — один пароль из `.env`; фото товаров хранятся локально в `public/uploads`;
демо-ниша — одежда/обувь (под размеры).

## Стек
- **Next.js 16** (App Router, TypeScript, Server Components, Server Actions, `proxy.ts` вместо middleware)
- **Drizzle ORM + better-sqlite3**, файл `sqlite.db`, миграции `drizzle-kit generate/migrate`
- **Витрина:** собственный дизайн на **Tailwind CSS v4** (свои токены: цвета бренда, шрифты,
  радиусы, тени) + **Motion** для анимаций (добавление в корзину, ♥, ховер карточек, галерея) +
  headless **Radix UI** примитивы для доступных Dialog/Popover/Select (drawer фильтров, мини-корзина).
  Без shadcn. **lucide-react** — иконки.
- **Админка:** **Mantine** (таблицы, формы, Dropzone для фото, уведомления) — изолирована в
  `app/admin` со своим `MantineProvider` и CSS, чтобы стили не пересекались с витриной.
- **Zustand (persist → localStorage)** — корзина и избранное на клиенте
- **Zod** — валидация форм (checkout, админка)
- **Nodemailer** — письма; локально **Mailpit** в Docker (веб-интерфейс писем на :8025)
- **jose** — подписанная cookie-сессия админа
- **Vitest** — юнит-тесты; **Playwright** — e2e-сценарий покупки

## Структура
```
src/
  app/
    (shop)/page.tsx               лента (сетка карточек, «Показать ещё»)
    (shop)/catalog/[slug]/        товары категории + фильтры
    (shop)/search/                поиск ?q=
    (shop)/product/[slug]/        карточка: галерея, выбор размера, в корзину, ♥
    (shop)/cart/                  корзина (кол-во, удалить, итого)
    (shop)/checkout/              форма заказа → server action
    (shop)/order/[number]/        «Заказ №… оформлен»
    (shop)/favorites/
    admin/login/                  вход по паролю
    admin/(panel)/products/       список, создание, редактирование (фото, размеры, остатки)
    admin/(panel)/categories/
    admin/(panel)/orders/         список заказов, смена статуса
  db/ schema.ts, index.ts, seed.ts
  lib/ auth.ts (сессия jose), mail.ts (транспорт + шаблоны), money.ts, validation.ts
  features/
    catalog/queries.ts            getProducts({category,q,minPrice,maxPrice,size,sort,page})
    cart/store.ts                 zustand: items [{productId, variantId, qty}]
    favorites/store.ts
    orders/create-order.ts        бизнес-логика оформления (тестируется отдельно)
  components/ ProductCard, ProductGrid, Filters, Header (поиск, счётчики ♥ и корзины) …
proxy.ts                          редирект /admin/* → /admin/login без валидной cookie
```

## Модель данных (Drizzle, SQLite)
- `categories` — id, name, slug
- `products` — id, slug, title, description, price (int, копейки), oldPrice?, categoryId, isActive, createdAt
- `product_images` — id, productId, url, sort
- `product_variants` — id, productId, size, stock
- `orders` — id, number (напр. `100123`), customerName, phone, email, address, comment, total, status (`new|confirmed|shipped|cancelled`), emailSent, createdAt
- `order_items` — id, orderId, productId, variantId, title/size/price (снимок на момент заказа), qty

## Ключевые потоки
1. **Каталог/фильтры** — фильтры и сортировка живут в `searchParams` URL (шаринг ссылки, back-кнопка),
   серверный компонент вызывает `getProducts()`; фильтры: категория, цена от/до, размер, сортировка
   (новинки / дешевле / дороже), поиск `LIKE` по title.
2. **Корзина** — на клиенте (Zustand persist). Для отображения клиент запрашивает актуальные
   цены/остатки по id (server action `getCartProducts(ids)`), чтобы не доверять localStorage.
3. **Оформление** (`createOrder`, server action):
   Zod-валидация → транзакция: перечитать цены из БД, проверить остатки, уменьшить `stock`,
   создать `orders` + `order_items` → после коммита отправить 2 письма (ошибка SMTP не отменяет
   заказ, `emailSent=false` + лог) → очистить корзину → редирект на `/order/[number]`.
   Нехватка остатка → понятная ошибка в форме с указанием позиции.
4. **Админка** — логин сравнивает пароль с `ADMIN_PASSWORD`, ставит httpOnly cookie (JWT, jose).
   `proxy.ts` делает быстрый редирект, а каждая admin server action дополнительно вызывает
   `requireAdmin()` (proxy — не единственная защита). Загрузка фото → `public/uploads/<uuid>.<ext>`.

## Конфиг (`.env.example`)
`DATABASE_URL=sqlite.db`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `SMTP_HOST/PORT/USER/PASS`,
`MAIL_FROM`, `SELLER_EMAIL`, `SHOP_NAME`. Плюс `docker-compose.yml` с Mailpit.

## Порядок реализации
0. `git init`, записать спек в `docs/superpowers/specs/2026-09-24-shop-design.md`, коммит; затем skill writing-plans для детального плана.
1. Визуальное направление витрины: 2–3 варианта мокапов (цвет, типографика, карточка товара) → пользователь выбирает → токены в `globals.css` (`@theme`).
2. Скаффолд: create-next-app (TS, Tailwind, App Router, src/), Mantine только для admin, Drizzle + схема + миграция, seed (~6 категорий, ~40 товаров с размерами, картинки-плейсхолдеры).
3. Лента + ProductCard + Header.
4. Карточка товара (галерея, размеры с остатком, «в корзину», ♥).
5. Избранное и корзина (stores + страницы, счётчики в шапке).
6. Каталог/поиск/фильтры/сортировка/пагинация.
7. Checkout + `createOrder` + письма (Mailpit) + страница успеха.
8. Админка (Mantine): логин, CRUD товаров (Dropzone фото, варианты), категории, заказы.
9. Адаптив под мобилку, пустые состояния, loading/error-страницы.

## Проверка
- `npx vitest` — тесты `createOrder` (пересчёт цен из БД, нехватка остатка, списание stock, запись order_items), store корзины, `getProducts` с фильтрами (на временной SQLite-базе).
- `npx playwright test` — e2e: лента → карточка → выбрать размер → корзина → оформить → страница «Заказ №…».
- `docker compose up mailpit` + ручной заказ → в http://localhost:8025 видно 2 письма с номером, телефоном и составом.
- Админка: без cookie `/admin/products` редиректит на логин; после входа создать товар с фото и размером → он появляется в ленте.
- `npm run build` и `npm run lint` без ошибок.
