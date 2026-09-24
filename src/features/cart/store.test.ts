// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'
import { selectCartCount, useCart } from './store'
import { useFavorites } from '../favorites/store'

beforeEach(() => {
  useCart.setState({ items: [] })
  useFavorites.setState({ ids: [] })
})

describe('useCart', () => {
  it('adds and merges same variant', () => {
    const { add } = useCart.getState()
    add({ variantId: 1, productId: 10 })
    add({ variantId: 1, productId: 10 }, 2)
    add({ variantId: 2, productId: 10 })
    expect(useCart.getState().items).toEqual([
      { variantId: 1, productId: 10, qty: 3 },
      { variantId: 2, productId: 10, qty: 1 },
    ])
    expect(selectCartCount(useCart.getState())).toBe(4)
  })

  it('clamps quantity to max stock', () => {
    useCart.getState().add({ variantId: 1, productId: 10 }, 5, 2)
    expect(useCart.getState().items[0].qty).toBe(2)
    useCart.getState().setQty(1, 10, 3)
    expect(useCart.getState().items[0].qty).toBe(3)
  })

  it('removes item when qty set below 1, clears all', () => {
    const s = useCart.getState()
    s.add({ variantId: 1, productId: 10 })
    s.add({ variantId: 2, productId: 11 })
    s.setQty(1, 0)
    expect(useCart.getState().items.map((i) => i.variantId)).toEqual([2])
    useCart.getState().clear()
    expect(useCart.getState().items).toEqual([])
  })

  it('persists to localStorage', () => {
    useCart.getState().add({ variantId: 7, productId: 70 })
    expect(JSON.parse(localStorage.getItem('cart-v1')!).state.items).toEqual([{ variantId: 7, productId: 70, qty: 1 }])
  })
})

describe('useFavorites', () => {
  it('toggles ids, newest first', () => {
    const { toggle } = useFavorites.getState()
    toggle(1)
    toggle(2)
    expect(useFavorites.getState().ids).toEqual([2, 1])
    toggle(1)
    expect(useFavorites.getState().ids).toEqual([2])
  })
})
