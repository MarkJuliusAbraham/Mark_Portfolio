import { cn } from "@/lib/utils";

/** One dot per slide; the current one stretches into a pill. Each is a full-size tap target. */
export const CarouselDots = ({ count, current, onSelect }) => (
  <div className="flex items-center justify-center">
    {Array.from({ length: count }, (_, index) => (
      <button
        key={index}
        type="button"
        aria-label={`Go to slide ${index + 1}`}
        aria-current={current === index ? "true" : undefined}
        onClick={() => onSelect(index)}
        className="flex size-11 items-center justify-center rounded-md focus-visible:outline-2"
      >
        <span
          aria-hidden="true"
          className={cn(
            "h-2 rounded-full transition-all duration-300",
            current === index ? "w-6 bg-foreground" : "w-2 bg-foreground/30 hover:bg-foreground/50",
          )}
        />
      </button>
    ))}
  </div>
);
