export const svgNamespace = "http://www.w3.org/2000/svg";

export function appendSvg(doc, parent, tag, attributes = {}) {
  const element = doc.createElementNS(svgNamespace, tag);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  parent.append(element);
  return element;
}
