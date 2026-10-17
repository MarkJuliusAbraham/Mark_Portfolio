let context = null;

/**
 * How far, in em, a line of text's first glyph draws in from where its box starts: the side space
 * built into the letter. Shifting the line back by this much puts its ink, not its box, on the
 * edge it shares with the text around it. Measured in `element`'s own font.
 */
export const leadingInset = (element, text = element.textContent) => {
    if (!text) return 0;
    context ??= document.createElement("canvas").getContext("2d");
    const style = getComputedStyle(element);
    const size = parseFloat(style.fontSize);
    if (!context || !size) return 0;
    context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    return -context.measureText(text.trimStart()).actualBoundingBoxLeft / size;
};
