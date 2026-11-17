import { useLayoutEffect, useRef } from 'react'
import { prefersReducedMotion } from '../lib/prefs'

/**
 * FLIP-Animation: Listeneinträge gleiten von ihrer alten an die neue Position,
 * statt zu springen. `order` ist die aktuelle Reihenfolge der IDs.
 */
export function useFlip(order: string[]) {
  const nodes = useRef(new Map<string, HTMLElement>())
  const last = useRef(new Map<string, number>())
  const key = order.join('|')

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion()
    nodes.current.forEach((el, id) => {
      const top = el.getBoundingClientRect().top
      const before = last.current.get(id)
      if (!reduced && before !== undefined && before !== top) {
        const dy = before - top
        el.animate(
          [
            { transform: `translateY(${dy}px)`, zIndex: 2 },
            { transform: 'translateY(0)', zIndex: 2 },
          ],
          { duration: 700, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
        )
      }
      last.current.set(id, top)
    })
  }, [key])

  return (id: string) => (el: HTMLElement | null) => {
    if (el) nodes.current.set(id, el)
    else nodes.current.delete(id)
  }
}
