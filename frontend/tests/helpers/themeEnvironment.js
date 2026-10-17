const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};

function element(tag) {
  const properties = new Map();
  const priorities = new Map();
  return {
    tag,
    attributes: new Map(),
    children: [],
    parent: null,
    style: {
      getPropertyValue: (name) => properties.get(name) ?? "",
      getPropertyPriority: (name) => priorities.get(name) ?? "",
      setProperty: (name, value, priority = "") => { properties.set(name, value); priorities.set(name, priority); },
      removeProperty: (name) => { properties.delete(name); priorities.delete(name); },
    },
    setAttribute(name, value) { this.attributes.set(name, value); },
    append(child) { this.children.push(child); child.parent = this; },
    remove() { this.parent.children = this.parent.children.filter((child) => child !== this); },
  };
}

export function environment({ reducedMotion = false, supported = true, rejectCapture = false, holdCapture = false,
  preset = "blocky", mediaNames = [] } = {}) {
  const attributes = new Map();
  const viewListeners = new Map();
  const docListeners = new Map();
  const captures = [];
  const animations = [];
  const media = mediaNames.map((name) => {
    const image = element("img");
    if (name) image.style.setProperty("view-transition-name", name);
    return image;
  });
  const root = {
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    animate: (frames, options) => {
      animations.push({ frames, options });
      return { finished: Promise.resolve(), cancel() {} };
    },
  };
  const doc = {
    documentElement: root,
    body: element("body"),
    createElementNS: (_namespace, tag) => element(tag),
    querySelectorAll: () => media,
    visibilityState: "visible",
    addEventListener: (name, callback) => docListeners.set(name, callback),
    removeEventListener: (name) => docListeners.delete(name),
  };
  if (supported) doc.startViewTransition = (update) => {
    const ready = deferred();
    const capture = {
      ready: ready.promise,
      finished: Promise.resolve(),
      commit: () => { update(); ready.resolve(); },
      skipTransition: () => { update(); ready.reject(new Error("Skipped")); },
    };
    captures.push(capture);
    if (rejectCapture) ready.reject(new Error("Capture failed"));
    else if (!holdCapture) capture.commit();
    return capture;
  };
  const view = {
    innerWidth: 1440,
    innerHeight: 900,
    CSS: { supports: () => true },
    matchMedia: () => ({ matches: reducedMotion }),
    addEventListener: (name, callback) => viewListeners.set(name, callback),
    removeEventListener: (name) => viewListeners.delete(name),
  };
  return { doc, view, attributes, viewListeners, docListeners, captures, animations, media,
    settings: { preset, speed: 1, volume: 40, chromatic: { speed: 1, strength: 8 } } };
}
