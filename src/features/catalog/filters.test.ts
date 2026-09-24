import { describe, expect, it } from 'vitest'
import { buildQuery, parseFilters } from './filters'

describe('parseFilters', () => {
  it('parses valid params, prices in rubles → kopecks', () => {
    expect(parseFilters({ q: ' платье ', min: '1000', max: '5000', size: 'M', sort: 'cheap', page: '2' }, 'dresses')).toEqual({
      q: 'платье', category: 'dresses', minPrice: 100000, maxPrice: 500000, size: 'M', sort: 'cheap', page: 2,
    })
  })

  it('parseFilters ignores garbage', () => {
    expect(parseFilters({ q: '   ', min: 'abc', max: '-5', sort: 'hack', page: '-5', size: '' })).toEqual({
      q: undefined, category: undefined, minPrice: undefined, maxPrice: undefined, size: undefined, sort: 'new', page: 1,
    })
  })

  it('swaps min and max when reversed and caps page', () => {
    const f = parseFilters({ min: '5000', max: '1000', page: '9999' })
    expect([f.minPrice, f.maxPrice, f.page]).toEqual([100000, 500000, 50])
  })

  it('takes first value of repeated params', () => {
    expect(parseFilters({ sort: ['expensive', 'cheap'] }).sort).toBe('expensive')
  })
})

describe('buildQuery', () => {
  it('patches params and drops empty values', () => {
    expect(buildQuery({ q: 'юбка', page: '3', sort: 'new' }, { page: undefined, size: 'S' })).toBe('?q=%D1%8E%D0%B1%D0%BA%D0%B0&sort=new&size=S')
    expect(buildQuery({}, {})).toBe('')
  })
})
