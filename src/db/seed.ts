import { count } from 'drizzle-orm'
import { createDb } from './index'
import { categories, orderItems, orders, productImages, products, productVariants } from './schema'
import { buildSearchText } from '@/lib/search'
import { slugify } from '@/lib/slug'

const db = createDb(process.env.DATABASE_URL ?? 'data/shop.db', process.env.DATABASE_AUTH_TOKEN)

// детерминированный ГПСЧ, чтобы сид всегда давал одни и те же данные
let seed = 42
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646
const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

const CLOTHES = ['XS', 'S', 'M', 'L', 'XL']
const SHOES = ['36', '37', '38', '39', '40', '41', '42', '43', '44']

const CATALOG: { name: string; slug: string; sizes: string[]; items: string[]; price: [number, number] }[] = [
  { name: 'Платья', slug: 'platya', sizes: CLOTHES, price: [2990, 8990], items: ['Льняное платье', 'Платье-рубашка', 'Сарафан в горошек', 'Платье миди', 'Трикотажное платье', 'Платье на запах', 'Вечернее платье'] },
  { name: 'Футболки', slug: 'futbolki', sizes: CLOTHES, price: [990, 2490], items: ['Базовая футболка', 'Футболка оверсайз', 'Лонгслив', 'Футболка с принтом', 'Поло', 'Майка рибана', 'Футболка из хлопка'] },
  { name: 'Худи и свитшоты', slug: 'hudi', sizes: CLOTHES, price: [2990, 6490], items: ['Худи оверсайз', 'Свитшот базовый', 'Худи на молнии', 'Свитшот с вышивкой', 'Толстовка флисовая', 'Худи укороченное'] },
  { name: 'Джинсы', slug: 'dzhinsy', sizes: ['26', '27', '28', '29', '30', '31', '32'], price: [3490, 7990], items: ['Джинсы мом', 'Прямые джинсы', 'Широкие джинсы', 'Джинсы скинни', 'Джинсы клёш', 'Джинсовые шорты'] },
  { name: 'Обувь', slug: 'obuv', sizes: SHOES, price: [3990, 12990], items: ['Кеды белые', 'Кроссовки беговые', 'Лоферы кожаные', 'Ботинки челси', 'Сандалии', 'Слипоны', 'Кроссовки на платформе'] },
  { name: 'Аксессуары', slug: 'aksessuary', sizes: ['ONE SIZE'], price: [490, 3490], items: ['Шоппер холщовый', 'Кепка', 'Панама', 'Ремень кожаный', 'Шарф вязаный', 'Носки набор 3 пары', 'Сумка через плечо'] },
]

let seeded = 0

const COLORS = ['молочный', 'чёрный', 'графит', 'оливковый', 'пудровый', 'синий', 'бежевый']

async function main() {
  // сид пересоздаёт каталог и стирает заказы — на живой базе только осознанно
  const existingOrders = (await db.select({ n: count() }).from(orders).get())?.n ?? 0
  if (existingOrders > 0 && process.env.SEED_FORCE !== '1') {
    console.error(`✖ В базе ${existingOrders} заказ(ов). Сид удалит их вместе с каталогом. Запустите с SEED_FORCE=1, если это действительно нужно.`)
    process.exit(1)
  }

  await db.delete(orderItems).run()
  await db.delete(orders).run()
  await db.delete(productImages).run()
  await db.delete(productVariants).run()
  await db.delete(products).run()
  await db.delete(categories).run()

  seeded = 0
  for (const cat of CATALOG) {
    const category = await db.insert(categories).values({ name: cat.name, slug: cat.slug }).returning().get()
    for (const item of cat.items) {
      const color = pick(COLORS)
      const title = `${item}, ${color}`
      const slug = `${slugify(title)}-${++seeded}`
      const priceRub = Math.round((cat.price[0] + rand() * (cat.price[1] - cat.price[0])) / 100) * 100 - 10
      const hasDiscount = rand() < 0.45
      const description = `${item} цвета «${color}». Свободная посадка, натуральные материалы, шьём сами небольшими партиями. Уход: деликатная стирка при 30°.`
      const product = await db
        .insert(products)
        .values({
          title,
          slug,
          description,
          search: buildSearchText(title, description),
          price: priceRub * 100,
          oldPrice: hasDiscount ? Math.round((priceRub * (1.2 + rand() * 0.4)) / 100) * 10000 - 1000 : null,
          categoryId: category.id,
          createdAt: new Date(Date.now() - seeded * 3_600_000),
        })
        .returning()
        .get()
      await db.insert(productImages).values([0, 1, 2].map((i) => ({ productId: product.id, url: `https://picsum.photos/seed/${slug}-${i}/600/800`, sort: i }))).run()
      await db.insert(productVariants).values(cat.sizes.map((size) => ({ productId: product.id, size, stock: rand() < 0.2 ? 0 : Math.ceil(rand() * 8) }))).run()
    }
  }
  console.log(`✔ seeded ${CATALOG.length} categories, ${seeded} products`)
}

main()
