// A project's figure number, two digits: Fig. P-01.
export const figureNumber = (number) => `Fig. P-${String(number).padStart(2, "0")}`;
