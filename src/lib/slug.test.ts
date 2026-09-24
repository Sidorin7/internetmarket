import { describe, expect, it } from 'vitest'
import { slugify } from './slug'
import { buildSearchText, escapeLike, normalizeSearch } from './search'
import { sortSizes } from './sizes'

describe('slugify', () => {
  it('transliterates russian and strips punctuation', () => {
    expect(slugify('Льняное платье «Лето»')).toBe('lnyanoe-plate-leto')
    expect(slugify('  Худи   OVERSIZE #2 ')).toBe('hudi-oversize-2')
    expect(slugify('Щётка-ёж')).toBe('schetka-ezh')
  })
  it('falls back for empty result', () => {
    expect(slugify('!!!')).toBe('item')
  })
})

describe('search helpers', () => {
  it('normalizes case and ё', () => {
    expect(normalizeSearch('  ЁЛКА Платье ')).toBe('елка платье')
    expect(buildSearchText('Платье', 'Лёгкое')).toBe('платье легкое')
  })
  it('escapes LIKE wildcards', () => {
    expect(escapeLike('50%_off\\')).toBe('50\\%\\_off\\\\')
  })
})

describe('sortSizes', () => {
  it('orders letter sizes then numeric then others', () => {
    expect(sortSizes(['XL', '42', 'S', 'ONE SIZE', '40', 'M', 'XS'])).toEqual(['XS', 'S', 'M', 'XL', '40', '42', 'ONE SIZE'])
  })
})
