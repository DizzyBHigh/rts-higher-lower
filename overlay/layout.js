(() => {
  const defaults = {
    board: {
      x: 0, y: 0, scale: 100,
      width: 1200, height: 680
    },
    elements: {
      round: { x: 0, y: 42, width: 1200, height: 48 },
      lower: { x: 55, y: 125, width: 260, height: 400 },
      higher: { x: 885, y: 125, width: 260, height: 400 },
      cards: { x: 355, y: 170, width: 490, height: 290 },
      deck: { x: 355, y: 210, width: 150, height: 210 },
      previous: { x: 525, y: 210, width: 150, height: 210 },
      current: { x: 695, y: 210, width: 150, height: 210 },
      totals: { x: 845, y: 575, width: 300, height: 65 }
    }
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function merge(base, value) {
    const result = clone(base);
    const source = value || {};
    Object.keys(source).forEach(key => {
      if (source[key] && typeof source[key] === 'object')
        result[key] = { ...(result[key] || {}), ...source[key] };
      else
        result[key] = source[key];
    });
    return result;
  }

  function create(value) {
    return {
      board: { ...defaults.board, ...(value?.board || {}) },
      elements: Object.keys(defaults.elements).reduce((result, key) => {
        result[key] = {
          ...defaults.elements[key],
          ...(value?.elements?.[key] || {})
        };
        return result;
      }, {})
    };
  }

  window.RTSHigherLowerLayout = {
    defaults,
    create,
    merge
  };
})();
