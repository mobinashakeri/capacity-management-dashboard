// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CapacityBar from '~/components/ui/CapacityBar.vue'
import { capacityDescription, capacityFillPercent } from '~/utils/capacity/format'

function render(placesUsed: number, capacity: number, status = 'healthy') {
  return mount(CapacityBar, {
    props: { placesUsed, capacity, status: status as never },
  })
}

describe('capacityFillPercent', () => {
  it('fills proportionally within capacity', () => {
    expect(capacityFillPercent(5, 10)).toBe(50)
    expect(capacityFillPercent(0, 10)).toBe(0)
    expect(capacityFillPercent(10, 10)).toBe(100)
  })

  // The bar must not run past its own track when a room is over-subscribed.
  it('caps at 100 rather than overflowing the track', () => {
    expect(capacityFillPercent(11, 10)).toBe(100)
    expect(capacityFillPercent(50, 1)).toBe(100)
  })

  it('does not divide by zero when a room has no recorded capacity', () => {
    expect(capacityFillPercent(0, 0)).toBe(0)
    expect(capacityFillPercent(3, 0)).toBe(100)
    expect(Number.isFinite(capacityFillPercent(3, 0))).toBe(true)
  })
})

describe('CapacityBar', () => {
  it('exposes its reading as a meter', () => {
    const meter = render(4, 10).get('[role="meter"]')

    expect(meter.attributes('aria-valuenow')).toBe('4')
    expect(meter.attributes('aria-valuemin')).toBe('0')
    expect(meter.attributes('aria-valuemax')).toBe('10')
  })

  // Colour and bar length are never the only carriers of the reading.
  it('states the reading in words for assistive technology', () => {
    expect(render(4, 10).get('[role="meter"]').attributes('aria-valuetext')).toBe(
      '4 of 10 places used',
    )
  })

  it('says so in words when a room is over capacity', () => {
    const text = render(11, 10, 'over').get('[role="meter"]').attributes('aria-valuetext')

    expect(text).toBe('11 of 10 places used, over capacity by 1')
    expect(text).toMatch(/over capacity/)
  })

  // aria-valuemax must not fall below aria-valuenow, or the meter is invalid.
  it('raises its maximum to the reading when over capacity', () => {
    expect(render(11, 10, 'over').get('[role="meter"]').attributes('aria-valuemax')).toBe('11')
  })

  it('renders a room with no capacity without producing NaN', () => {
    const meter = render(0, 0).get('[role="meter"]')

    expect(meter.attributes('aria-valuetext')).not.toMatch(/NaN|Infinity/)
    expect(meter.html()).not.toMatch(/NaN|Infinity/)
  })

  it('does not let the fill run past the track', () => {
    const fill = render(11, 10, 'over').get('[role="meter"] > div')

    expect(fill.attributes('style')).toContain('width: 100%')
  })

  it('distinguishes an over-capacity room by more than width alone', () => {
    const over = render(11, 10, 'over').get('[role="meter"] > div').classes().join(' ')
    const healthy = render(5, 10, 'healthy').get('[role="meter"] > div').classes().join(' ')

    expect(over).not.toBe(healthy)
    expect(over).toContain('bg-alert')
  })

  it('keeps the description consistent with the pure formatter', () => {
    for (const [used, capacity] of [
      [0, 0],
      [4, 10],
      [11, 10],
      [1, 1],
    ] as const) {
      expect(render(used, capacity).get('[role="meter"]').attributes('aria-valuetext')).toBe(
        capacityDescription(used, capacity),
      )
    }
  })
})
