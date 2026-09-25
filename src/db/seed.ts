import { count } from 'drizzle-orm'
import { createDbFromEnv } from './index'
import { categories, orderItems, orders, productImages, products, productVariants } from './schema'
import { buildSearchText } from '@/lib/search'
import { slugify } from '@/lib/slug'

const db = createDbFromEnv()

// детерминированный ГПСЧ, чтобы сид всегда давал одни и те же данные
let seed = 42
const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

const CLOTHES = ['XS', 'S', 'M', 'L', 'XL']
const SHOES = ['36', '37', '38', '39', '40', '41', '42', '43', '44']

const CATALOG: { name: string; slug: string; sizes: string[]; price: [number, number]; about: string; items: { title: string; images: string[] }[] }[] = [
  {
    name: 'Платья',
    slug: 'platya',
    sizes: CLOTHES,
    price: [2990, 8990],
    about: 'Свободная посадка, натуральные ткани, шьём сами небольшими партиями.',
    items: [
      { title: 'Льняное платье', images: ['platya-1-1.jpg', 'platya-1-2.jpg'] },
      { title: 'Платье-рубашка', images: ['platya-2-1.jpg', 'platya-2-2.jpg'] },
      { title: 'Платье в горошек', images: ['platya-3-1.jpg', 'platya-3-2.jpg'] },
      { title: 'Платье миди', images: ['platya-4-1.jpg', 'platya-4-2.jpg'] },
      { title: 'Трикотажное платье', images: ['platya-5-1.jpg', 'platya-5-2.jpg'] },
      { title: 'Платье с цветочным принтом', images: ['platya-6-1.jpg', 'platya-6-2.jpg'] },
      { title: 'Вечернее платье', images: ['platya-7-1.jpg', 'platya-7-2.jpg'] },
    ],
  },
  {
    name: 'Футболки и рубашки',
    slug: 'futbolki',
    sizes: CLOTHES,
    price: [990, 3490],
    about: 'Плотный хлопок, не садится после стирки.',
    items: [
      { title: 'Базовая белая футболка', images: ['futbolki-1-1.jpg', 'futbolki-1-2.jpg'] },
      { title: 'Футболка оверсайз', images: ['futbolki-2-1.jpg', 'futbolki-2-2.jpg'] },
      { title: 'Футболка с принтом', images: ['futbolki-3-1.jpg', 'futbolki-3-2.jpg'] },
      { title: 'Футболка серая меланж', images: ['futbolki-4-1.jpg', 'futbolki-4-2.jpg'] },
      { title: 'Лонгслив', images: ['futbolki-5-1.jpg', 'futbolki-5-2.jpg'] },
      { title: 'Джинсовая рубашка', images: ['futbolki-6-1.jpg', 'futbolki-6-2.jpg'] },
      { title: 'Рубашка в клетку', images: ['futbolki-7-1.jpg', 'futbolki-7-2.jpg'] },
    ],
  },
  {
    name: 'Худи и свитеры',
    slug: 'hudi',
    sizes: CLOTHES,
    price: [2990, 6490],
    about: 'Мягкий трикотаж с начёсом, держит форму.',
    items: [
      { title: 'Худи оверсайз', images: ['hudi-1-1.jpg', 'hudi-1-2.jpg'] },
      { title: 'Худи серое', images: ['hudi-2-1.jpg', 'hudi-2-2.jpg'] },
      { title: 'Худи оранжевое', images: ['hudi-3-1.jpg', 'hudi-3-2.jpg'] },
      { title: 'Свитшот базовый', images: ['hudi-4-1.jpg', 'hudi-4-2.jpg'] },
      { title: 'Свитер в полоску', images: ['hudi-5-1.jpg', 'hudi-5-2.jpg'] },
      { title: 'Кардиган вязаный', images: ['hudi-6-1.jpg', 'hudi-6-2.jpg'] },
      { title: 'Свитер вязаный', images: ['hudi-7-1.jpg', 'hudi-7-2.jpg'] },
    ],
  },
  {
    name: 'Джинсы и деним',
    slug: 'dzhinsy',
    sizes: ['26', '27', '28', '29', '30', '31', '32'],
    price: [3490, 7990],
    about: 'Плотный деним, классические пять карманов.',
    items: [
      { title: 'Джинсы скинни', images: ['dzhinsy-1-1.jpg', 'dzhinsy-1-2.jpg'] },
      { title: 'Рваные джинсы', images: ['dzhinsy-2-1.jpg', 'dzhinsy-2-2.jpg'] },
      { title: 'Прямые джинсы', images: ['dzhinsy-3-1.jpg', 'dzhinsy-3-2.jpg'] },
      { title: 'Джинсы мом', images: ['dzhinsy-4-1.jpg', 'dzhinsy-4-2.jpg'] },
      { title: 'Джинсовая куртка', images: ['dzhinsy-5-1.jpg', 'dzhinsy-5-2.jpg'] },
      { title: 'Джинсовые шорты', images: ['dzhinsy-6-1.jpg', 'dzhinsy-6-2.jpg'] },
      { title: 'Тёмные джинсы', images: ['dzhinsy-7-1.jpg', 'dzhinsy-7-2.jpg'] },
    ],
  },
  {
    name: 'Обувь',
    slug: 'obuv',
    sizes: SHOES,
    price: [3990, 12990],
    about: 'Удобная колодка, можно носить весь день.',
    items: [
      { title: 'Кеды белые', images: ['obuv-1-1.jpg', 'obuv-1-2.jpg'] },
      { title: 'Кеды высокие чёрные', images: ['obuv-2-1.jpg', 'obuv-2-2.jpg'] },
      { title: 'Кроссовки беговые', images: ['obuv-3-1.jpg', 'obuv-3-2.jpg'] },
      { title: 'Мокасины кожаные', images: ['obuv-4-1.jpg', 'obuv-4-2.jpg'] },
      { title: 'Ботинки челси', images: ['obuv-5-1.jpg', 'obuv-5-2.jpg'] },
      { title: 'Туфли оксфорды', images: ['obuv-6-1.jpg', 'obuv-6-2.jpg'] },
      { title: 'Сандалии', images: ['obuv-7-1.jpg', 'obuv-7-2.jpg'] },
    ],
  },
  {
    name: 'Аксессуары',
    slug: 'aksessuary',
    sizes: ['ONE SIZE'],
    price: [490, 4990],
    about: 'Качественная фурнитура и материалы.',
    items: [
      { title: 'Кожаная сумка-мессенджер', images: ['aksessuary-1-1.jpg', 'aksessuary-1-2.jpg'] },
      { title: 'Рюкзак городской', images: ['aksessuary-2-1.jpg', 'aksessuary-2-2.jpg'] },
      { title: 'Соломенная шляпа', images: ['aksessuary-3-1.jpg', 'aksessuary-3-2.jpg'] },
      { title: 'Кепка', images: ['aksessuary-4-1.jpg', 'aksessuary-4-2.jpg'] },
      { title: 'Шапка вязаная', images: ['aksessuary-5-1.jpg', 'aksessuary-5-2.jpg'] },
      { title: 'Клатч с цветочным принтом', images: ['aksessuary-6-1.jpg', 'aksessuary-6-2.jpg'] },
      { title: 'Ремень кожаный', images: ['aksessuary-7-1.jpg', 'aksessuary-7-2.jpg'] },
    ],
  },
]

let seeded = 0

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
    for (const { title, images } of cat.items) {
      const slug = `${slugify(title)}-${++seeded}`
      const priceRub = Math.round((cat.price[0] + rand() * (cat.price[1] - cat.price[0])) / 100) * 100 - 10
      const hasDiscount = rand() < 0.45
      const description = `${title}. ${cat.about}`
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
      await db.insert(productImages).values(images.map((file, sort) => ({ productId: product.id, url: `/seed/${file}`, sort }))).run()
      await db.insert(productVariants).values(cat.sizes.map((size) => ({ productId: product.id, size, stock: rand() < 0.2 ? 0 : Math.ceil(rand() * 8) }))).run()
    }
  }
  console.log(`✔ seeded ${CATALOG.length} categories, ${seeded} products`)
}

main()
