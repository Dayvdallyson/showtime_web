import { useState, type KeyboardEvent } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type Carousel3DItem = {
  id: string
  title: string
  subtitle?: string
  image?: string
  accent?: string
}

type Carousel3DProps = {
  items: Carousel3DItem[]
  cardWidth?: number
  onActiveChange?: (item: Carousel3DItem, index: number) => void
  className?: string
}

const CARD_GAP = 28
const DEFAULT_ACCENT = "#6366f1"

export function Carousel3D({
  items,
  cardWidth = 220,
  onActiveChange,
  className,
}: Carousel3DProps) {
  const [position, setPosition] = useState(0)

  const total = items.length
  if (total === 0) return null

  const anglePerCard = 360 / total
  const radius =
    total < 3
      ? cardWidth
      : Math.round((cardWidth + CARD_GAP) / 2 / Math.tan(Math.PI / total))
  const activeIndex = wrapIndex(position, total)
  const activeItem = items[activeIndex]

  function rotateBy(steps: number) {
    if (steps === 0) return

    const nextPosition = position + steps
    const nextIndex = wrapIndex(nextPosition, total)
    setPosition(nextPosition)
    onActiveChange?.(items[nextIndex], nextIndex)
  }

  function goTo(index: number) {
    rotateBy(shortestSteps(activeIndex, index, total))
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowLeft") {
      event.preventDefault()
      rotateBy(-1)
    }
    if (event.key === "ArrowRight") {
      event.preventDefault()
      rotateBy(1)
    }
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Destaques"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative isolate flex flex-col items-center gap-8 overflow-hidden py-12 outline-none",
        "focus-visible:ring-2 focus-visible:ring-ring/50 rounded-3xl",
        className
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 transition-opacity duration-700"
          style={{
            opacity: index === activeIndex ? 1 : 0,
            background: `radial-gradient(closest-side at 50% 42%, ${item.accent ?? DEFAULT_ACCENT}45, transparent)`,
          }}
        />
      ))}

      <div
        className="relative perspective-[1400px]"
        style={{ width: cardWidth, aspectRatio: "2 / 3" }}
      >
        <div
          className="absolute inset-0 transform-3d transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{
            transform: `translateZ(${-radius}px) rotateY(${-position * anglePerCard}deg)`,
          }}
        >
          {items.map((item, index) => {
            const distance = Math.abs(shortestSteps(activeIndex, index, total))
            const isActive = distance === 0
            const isVisible = distance <= 2

            return (
              <button
                key={item.id}
                type="button"
                tabIndex={-1}
                aria-label={`Mostrar ${item.title}`}
                aria-current={isActive}
                disabled={!isVisible}
                onClick={() => goTo(index)}
                className={cn(
                  "group absolute inset-0 overflow-hidden rounded-2xl text-left backface-hidden",
                  "transition-[opacity,box-shadow] duration-700",
                  isActive
                    ? "cursor-default ring-1 ring-white/25"
                    : "cursor-pointer ring-1 ring-white/10"
                )}
                style={{
                  transform: `rotateY(${index * anglePerCard}deg) translateZ(${radius}px)`,
                  opacity: [1, 0.85, 0.4][distance] ?? 0,
                  boxShadow: isActive
                    ? `0 30px 80px -20px ${item.accent ?? DEFAULT_ACCENT}aa`
                    : "0 20px 40px -20px #000c",
                }}
              >
                <Poster item={item} />

                <span
                  aria-hidden
                  className="absolute inset-0 bg-black transition-opacity duration-700 group-hover:opacity-20"
                  style={{ opacity: isActive ? 0 : 0.25 + distance * 0.15 }}
                />
              </button>
            )
          })}
        </div>

        <div
          aria-hidden
          className="absolute -bottom-10 left-1/2 h-8 w-[140%] -translate-x-1/2 rounded-[100%] bg-black/60 blur-2xl"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          className="rounded-full backdrop-blur"
          onClick={() => rotateBy(-1)}
        >
          <ChevronLeft />
          <span className="sr-only">Anterior</span>
        </Button>

        <div className="flex items-center gap-1.5">
          {items.map((item, index) => (
            <button
              key={item.id}
              type="button"
              aria-label={`Ir para ${item.title}`}
              aria-current={index === activeIndex}
              onClick={() => goTo(index)}
              className={cn(
                "h-1.5 rounded-full transition-all duration-500",
                index === activeIndex
                  ? "w-6 bg-foreground"
                  : "w-1.5 bg-foreground/25 hover:bg-foreground/50"
              )}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="rounded-full backdrop-blur"
          onClick={() => rotateBy(1)}
        >
          <ChevronRight />
          <span className="sr-only">Próximo</span>
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        {activeItem.title}, {activeIndex + 1} de {total}
      </p>
    </div>
  )
}

function Poster({ item }: { item: Carousel3DItem }) {
  const accent = item.accent ?? DEFAULT_ACCENT

  return (
    <>
      {item.image ? (
        <img
          src={item.image}
          alt=""
          draggable={false}
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `radial-gradient(120% 80% at 20% 10%, ${accent} 0%, transparent 55%),
                         radial-gradient(90% 60% at 90% 100%, ${accent}66 0%, transparent 60%),
                         linear-gradient(165deg, #18181b 0%, #09090b 100%)`,
          }}
        />
      )}

      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1/2 bg-linear-to-b from-white/15 to-transparent"
      />

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-linear-to-t from-black/90 via-black/50 to-transparent p-4 pt-16">
        <span className="text-lg leading-tight font-semibold text-white">
          {item.title}
        </span>
        {item.subtitle && (
          <span className="text-xs tracking-wide text-white/60 uppercase">
            {item.subtitle}
          </span>
        )}
      </span>
    </>
  )
}

function wrapIndex(position: number, total: number) {
  return ((position % total) + total) % total
}

function shortestSteps(from: number, to: number, total: number) {
  const forward = wrapIndex(to - from, total)
  return forward > total / 2 ? forward - total : forward
}
