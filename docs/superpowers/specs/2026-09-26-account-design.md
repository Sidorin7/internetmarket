# Личный кабинет покупателя

## Контекст
Сейчас покупатели анонимны: заказ открывается по подписанной ссылке (`order-token.ts`),
избранное живёт только в localStorage (`favorites-v1`), вход есть только у админа.
Нужен профиль: избранное, текущие заказы, история покупок, личные данные.

**Решения пользователя:**
- Вход — одноразовый код на email (без паролей). Регистрация = первый вход.
- В профиле видны **все заказы на этот email**, включая старые гостевые. Гостевой checkout остаётся.
- Разделы: избранное, текущие заказы, история, личные данные с автозаполнением checkout,
  отмена заказа покупателем (пока статус «новый»).
- Статус заказа — шкала с датами в кабинете. Писем покупателю о смене статуса **нет**.
- Реализация входа своя, на `jose` + таблица кодов (без Better Auth / Auth.js).

**Мои допущения (подтверждены):**
- «Текущие» = new, confirmed, shipped не старше 14 дней. «История» = shipped старше 14 дней
  (или без даты отправки — старые заказы) + cancelled.
- Избранное у гостя — как сейчас (localStorage); после входа сливается с серверным.
- Отмена покупателем возвращает товар на склад (как отмена из админки) и шлёт письмо продавцу.

**Почта без домена.** Локально письма ловит Mailpit (`localhost:1025`, UI на :8025), а в dev-режиме
код дополнительно печатается в консоль сервера. В проде Resend без подтверждённого домена шлёт
только на свой адрес, поэтому для реальных покупателей нужен либо домен в Resend, либо Gmail SMTP
(пароль приложения, ~500 писем/сутки). Код не меняется — только 4 переменные env; `.env.example`
и README дополняются этим вариантом.

## Модель данных (миграция `0002_accounts`)
- `users` — id, email (unique, всегда lower-case), name `''`, phone `''`, address `''`, createdAt
- `login_codes` — email (PK), codeHash, expiresAt (int, мс), attempts (int, 0)
  Одна строка на email: новый запрос кода перезаписывает старый.
- `favorites` — userId → users (cascade), productId → products (cascade), createdAt;
  PK (userId, productId)
- `orders` + `confirmedAt`, `shippedAt`, `cancelledAt` (nullable timestamp) и индекс
  `orders_email_lower_idx` на `lower(email)`. Связи orders → users **нет**: заказы находятся по email.

## Вход по коду
`src/features/account/login.ts` (чистая логика, принимает `db` и `now` — тестируется без Next):
- `issueLoginCode(db, email)` — `crypto.randomInt` → 6 цифр; хранится
  `HMAC-SHA256(SESSION_SECRET, email + ':' + code)`, срок 10 минут, attempts = 0. Возвращает код.
- `verifyLoginCode(db, email, code)` — нет строки / истёк / attempts ≥ 5 → ошибка;
  неверный код → attempts + 1; верный (`timingSafeEqual`) → строка удаляется,
  `users` upsert по email → `{ userId }`.

`src/features/account/auth-actions.ts` (server actions):
- `requestCodeAction` — zod-валидация email (lower-case, trim), лимиты `hitRateLimit`:
  `login-ip:<ip>` 10/час и `login-email:<email>` 3 за 15 минут (форма шлёт письма на любой адрес).
  Письмо через `sendLoginCode` в `mail.ts`; в dev — `console.info('[login] code for …')`.
  Ответ одинаковый независимо от того, есть ли такой пользователь.
- `verifyCodeAction` — плюс лимит `login-verify-ip:<ip>` 30/час; при успехе ставит cookie и
  `redirect(next)`; `next` принимается, только если начинается с `/` и не с `//`, иначе `/account`.
- `logoutAction` — удаляет cookie, redirect на `/`.

**Сессия** (`src/lib/session.ts` расширяется): cookie `user_session`, JWT `{ role: 'user', sub: userId }`,
30 дней, httpOnly, `sameSite: 'lax'`, `secure` в проде. Ключ тот же `SESSION_SECRET`.
`verifySession` админа по-прежнему требует `role === 'admin'` — пользовательский токен в админку не пустит
(есть тест). Новые `signUserSession(userId)` / `verifyUserSession(token): number | null`.

**DAL** `src/lib/user.ts` (`server-only`), по гайду Next «Data Access Layer»:
- `getCurrentUser = cache(async () => …)` — читает cookie, проверяет JWT, достаёт строку `users`
  (удалённый пользователь = не вошёл).
- `requireUser()` — `getCurrentUser()` или `redirect('/login?next=…')`.
Каждая страница и action кабинета вызывает DAL сам — layout для проверки не используется.
`proxy.ts` дополнительно делает оптимистичный редирект `/account/*` → `/login` без cookie.

## Страницы
Всё в `(shop)`, стиль витрины (Tailwind, `rounded-card`, brand/coral, lucide), без shadcn.
- `/login` — `LoginForm` (client, `useActionState`): шаг 1 email → шаг 2 поле кода
  (`inputMode="numeric"`, `autoComplete="one-time-code"`), «Отправить ещё раз», «Другой email».
  Если уже вошёл — redirect на `/account`.
- `/account` — layout с вкладками (Заказы · Избранное · Личные данные · Выйти); на мобиле вкладки
  горизонтальной лентой. Страница: секции «Текущие заказы» и «История покупок» — карточки
  (номер, дата, сумма, статус-бейдж, превью позиций) → ссылка на заказ. Пустое состояние со ссылкой в ленту.
- `/account/orders/[number]` — шкала статуса: Оформлен (createdAt) → Подтверждён (confirmedAt) →
  Отправлен (shippedAt); отменённый — отдельное красное состояние с cancelledAt. Нет даты у старого
  заказа — шаг отмечен без даты. Ниже состав, адрес, телефон, комментарий, итог.
  Кнопка «Отменить заказ» (только status = new, с подтверждением). Чужой номер → 404.
- `/account/favorites` — переиспользует `FavoritesView`.
- `/account/profile` — форма: имя, телефон (нормализация через `lib/phone.ts`, как в checkout),
  адрес; email только для чтения.

**Шапка:** третья иконка «Профиль» (`User`) → `/account`. Состояние входа в шапке не читается —
иначе `cookies()` в layout сделает все страницы витрины динамическими. Без входа `/account` уведёт на `/login`.

## Заказы в кабинете
`src/features/account/orders.ts`:
- `listUserOrders(db, email, now)` → `{ current, history }` — `where lower(email) = ?`, новые сверху,
  с позициями одним запросом (как `listOrders` в админке). Разбиение по правилу из «Допущений».
- `getUserOrder(db, email, number)` — null, если email заказа не совпадает (сравнение в lower-case).
- `cancelOrderByCustomer(db, email, number)` — в одной транзакции: заказ этого email и
  status = 'new' (иначе «Заказ уже подтверждён — позвоните нам»), возврат остатков, status = cancelled,
  cancelledAt = now. Защищает от гонки с админом, который в этот момент подтверждает заказ.

**Админка:** возврат остатков из `setOrderStatus` выносится в общую `restockOrder(tx, orderId)`.
`setOrderStatus` при переходе ставит соответствующую дату (`confirmedAt`/`shippedAt`/`cancelledAt`).
Письмо продавцу об отмене покупателем — `renderCancelEmail` в `mail.ts`, отправка через `after()`.

## Checkout
- `checkout/page.tsx` получает `getCurrentUser()` и передаёт в `CheckoutForm` значения по умолчанию
  (name/phone/address из профиля, email). Для вошедшего email **только для чтения** со ссылкой «Не вы? Выйти» —
  иначе заказ не попадёт в его кабинет. `/checkout` становится динамическим — это нормально.
- `placeOrder`: если пользователь вошёл, email берётся из сессии, а не из формы; после заказа пустые поля
  профиля (name/phone/address) заполняются данными заказа.
- Страница «Заказ оформлен»: вошедшему — ссылка «Мои заказы».

## Избранное
- Store получает флаг `synced: boolean` (persist). Серверные actions в `src/features/favorites/actions.ts`:
  `syncFavoritesAction(localIds)` — union локальных и серверных, возвращает итоговый список;
  `setFavoriteAction(productId, on)`.
- Синхронизация: сразу после входа (LoginForm вызывает sync перед переходом) и при открытии `/favorites`
  и `/account/favorites` (если `synced`). Store заменяется ответом сервера.
- `toggle` при `synced` дополнительно вызывает `setFavoriteAction` (оптимистично). Ответ «не авторизован»
  (сессия истекла) сбрасывает `synced`. `logoutAction` → клиент очищает store и `synced`.
- Несуществующие/неактивные товары отсеиваются на сервере при sync.

## Ошибки и безопасность
- Все actions кабинета берут пользователя только из DAL, никогда из параметров.
- Код хранится хешем с секретом; 5 попыток; 10 минут; лимиты по IP и email.
- Ответ на запрос кода не раскрывает, зарегистрирован ли email.
- SMTP недоступен при запросе кода → «Не удалось отправить письмо, попробуйте позже» (без утечки деталей),
  ошибка в лог.

## Тесты
Vitest (in-memory libSQL, как существующие тесты):
- login: выдача/проверка кода, неверный код → attempts, 5 попыток, истечение, повторный запрос
  перезаписывает, upsert пользователя, email регистронезависим.
- session: user-токен не проходит `verifySession` админа и наоборот.
- account orders: поиск по email без учёта регистра, разбиение current/history (граница 14 дней, shipped без даты),
  чужой заказ → null, отмена (владелец, только new, возврат остатков, cancelledAt).
- admin: `setOrderStatus` ставит даты.
- favorites: union при sync, отсев удалённых товаров, set on/off.
Playwright: вход по коду (код читается из API Mailpit на :8025) → оформление заказа с автозаполненным email →
заказ виден в «Текущих» → отмена → переехал в «Историю».

## Вне рамок
Смена email, удаление аккаунта, адресная книга (несколько адресов), «Повторить заказ»,
письма о смене статуса, вход через соцсети/SMS.
