import { useRef, useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * ScrollRow
 * Smooth, mobile-optimized horizontal carousel row:
 * - CSS snap scrolling for magnetic card alignment (no cut-off cards)
 * - Mouse drag-to-scroll for desktop and DevTools mobile emulation
 * - Non-intrusive event handling with zero passive listener intervention warnings
 * - Touch-friendly chevrons for instant one-tap sliding
 */
export default function ScrollRow({
  children,
  className = '',
  showArrows = true,
  scrollAmount = 240,
  arrowClassName = '',
}) {
  const containerRef = useRef(null)
  const isDownRef = useRef(false)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const hasDraggedRef = useRef(false)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isGrabbing, setIsGrabbing] = useState(false)

  const updateScrollButtons = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 6)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    updateScrollButtons()
    el.addEventListener('scroll', updateScrollButtons, { passive: true })
    window.addEventListener('resize', updateScrollButtons, { passive: true })
    return () => {
      el.removeEventListener('scroll', updateScrollButtons)
      window.removeEventListener('resize', updateScrollButtons)
    }
  }, [updateScrollButtons, children])

  const scroll = (direction) => {
    const el = containerRef.current
    if (!el) return
    const delta = direction === 'left' ? -scrollAmount : scrollAmount
    el.scrollBy({ left: delta, behavior: 'smooth' })
  }

  // Mouse drag handling (for desktop & Chrome DevTools mouse simulation)
  const handleMouseDown = (e) => {
    if (e.button !== 0) return
    const el = containerRef.current
    if (!el) return

    isDownRef.current = true
    hasDraggedRef.current = false
    startXRef.current = e.pageX - el.offsetLeft
    scrollLeftRef.current = el.scrollLeft
    setIsGrabbing(true)

    const onMouseMove = (moveEvent) => {
      if (!isDownRef.current || !containerRef.current) return
      const x = moveEvent.pageX - containerRef.current.offsetLeft
      const walk = (x - startXRef.current) * 1.3
      if (Math.abs(walk) > 5) {
        hasDraggedRef.current = true
      }
      containerRef.current.scrollLeft = scrollLeftRef.current - walk
    }

    const onMouseUp = () => {
      isDownRef.current = false
      setIsGrabbing(false)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      setTimeout(() => {
        hasDraggedRef.current = false
      }, 80)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mouseup', onMouseUp, { passive: true })
  }

  const handleClickCapture = (e) => {
    if (hasDraggedRef.current) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  return (
    <div className="relative group/scrollrow w-full min-w-0">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onClickCapture={handleClickCapture}
        className={`flex gap-3 sm:gap-4 overflow-x-auto pb-2 no-scrollbar snap-x snap-proximity scroll-smooth select-none ${
          isGrabbing ? 'cursor-grabbing' : 'cursor-grab'
        } ${className}`}
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-x pan-y',
          overscrollBehaviorX: 'contain',
        }}
      >
        {children}
      </div>

      {showArrows && (
        <>
          {canScrollLeft && (
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scroll('left')}
              className={`absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--primary-text)] shadow-md backdrop-blur-sm transition hover:scale-110 active:scale-95 ${arrowClassName}`}
            >
              <ChevronLeft size={18} />
            </button>
          )}
          {canScrollRight && (
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scroll('right')}
              className={`absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-30 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--primary-text)] shadow-md backdrop-blur-sm transition hover:scale-110 active:scale-95 ${arrowClassName}`}
            >
              <ChevronRight size={18} />
            </button>
          )}
        </>
      )}
    </div>
  )
}
