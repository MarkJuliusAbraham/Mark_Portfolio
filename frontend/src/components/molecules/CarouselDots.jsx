import { cn } from "@/lib/utils";

/**
 * One dot per slide; the current one stretches into a pill. Each is a full-height tap target, as
 * wide as the row allows, so many slides still fit between the carousel's arrows.
 */
export const CarouselDots = ({ count, current, onSelect }) => (
  <div className="flex min-w-0 flex-1 items-center justify-center">
    {Array.from({ length: count }, (_, index) => (
      <button
        key={index}
        type="button"
        aria-label={`Go to slide ${index + 1}`}
        aria-current={current === index ? "true" : undefined}
        onClick={() => onSelect(index)}
        className="flex h-11 min-w-0 max-w-11 flex-1 items-center justify-center rounded-md focus-visible:outline-2"
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-2 shrink-0 rounded-full transition-all duration-300",
            current === index ? "w-6 bg-foreground" : "w-2 bg-foreground/30 hover:bg-foreground/50",
          )}
        />
      </button>
    ))}
  </div>
);
