function cloneBox(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return value;
  const out = {};
  for (const [key, item] of Object.entries(value)) {
    if (Array.isArray(item)) {
      out[key] = item.map((entry) => cloneBox(entry));
      continue;
    }
    out[key] = cloneBox(item);
  }
  return out;
}

export function buildLayoutContract(templatePackage = {}) {
  const typeLayouts = templatePackage?.layouts?.types || {};
  const byType = {};

  for (const [slideType, layout] of Object.entries(typeLayouts)) {
    byType[slideType] = {
      boxes: cloneBox(layout?.geometry || {}),
      templateLayout: layout?.templateLayout || null,
    };
  }

  return {
    byType,
    get(slideType) {
      return byType[slideType] || { boxes: {}, templateLayout: null };
    },
  };
}

export function resolveSlideGeometry(layoutContract, slideType, fallbackGeometry = null) {
  const contract = layoutContract?.get?.(slideType);
  if (contract?.boxes && Object.keys(contract.boxes).length > 0) return contract.boxes;
  return fallbackGeometry || null;
}
