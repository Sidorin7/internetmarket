import { createDb } from './index'
import { categories, orderItems, orders, productImages, products, productVariants } from './schema'
import { buildSearchText } from '@/lib/search'
import { slugify } from '@/lib/slug'

const db = createDb(process.env.DATABASE_URL ?? 'data/shop.db')

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

const COLORS = ['молочный', 'чёрный', 'графит', 'оливковый', 'пудровый', 'синий', 'бежевый']

db.delete(orderItems).run()
db.delete(orders).run()
db.delete(productImages).run()
db.delete(productVariants).run()
db.delete(products).run()
db.delete(categories).run()

let count = 0
for (const cat of CATALOG) {
  const category = db.insert(categories).values({ name: cat.name, slug: cat.slug }).returning().get()
  for (const item of cat.items) {
    const color = pick(COLORS)
    const title = `${item}, ${color}`
    const slug = `${slugify(title)}-${++count}`
    const priceRub = Math.round((cat.price[0] + rand() * (cat.price[1] - cat.price[0])) / 100) * 100 - 10
    const hasDiscount = rand() < 0.45
    const description = `${item} цвета «${color}». Свободная посадка, натуральные материалы, шьём сами небольшими партиями. Уход: деликатная стирка при 30°.`
    const product = db
      .insert(products)
      .values({
        title,
        slug,
        description,
        search: buildSearchText(title, description),
        price: priceRub * 100,
        oldPrice: hasDiscount ? Math.round((priceRub * (1.2 + rand() * 0.4)) / 100) * 10000 - 1000 : null,
        categoryId: category.id,
        createdAt: new Date(Date.now() - count * 3_600_000),
      })
      .returning()
      .get()
    for (let i = 0; i < 3; i++) {
      db.insert(productImages).values({ productId: product.id, url: `https://picsum.photos/seed/${slug}-${i}/600/800`, sort: i }).run()
    }
    for (const size of cat.sizes) {
      db.insert(productVariants).values({ productId: product.id, size, stock: rand() < 0.2 ? 0 : Math.ceil(rand() * 8) }).run()
    }
  }
}
console.log(`✔ seeded ${CATALOG.length} categories, ${count} products`)
