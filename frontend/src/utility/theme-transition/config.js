// Choose "chromatic" or "blocky". Both effects remain available.
export const transitionPreset = "chromatic";

// Chromatic transition: speed 1 = 360ms; strength is the maximum channel shift in pixels.
export const chromatic = { speed: 1.2, strength: 25 };

// TV-style frame tearing layered over chromatic. Duration is in milliseconds.
// Disable it with enabled: false, or set duration to 0.
export const frameGlitch = { enabled: true, duration: 10, strength: 400 };

// Travel-speed multiplier: 1 = 550ms, 2 = twice as fast, 0.5 = half speed.
// Set to 0 to switch themes immediately.
export const speed = 3;

// Square size in CSS pixels. Higher values make the wave more blocky.
export const volume = 25;
