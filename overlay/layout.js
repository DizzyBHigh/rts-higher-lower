(() => {
  const defaults = {
    board: {
      x: 0, y: 0, scale: 100, z: 0,
      width: 1200, height: 675
    },
    players: {
      x: 55, y: 125, scale: 100, z: 10,
      width: 260, height: 400
    },
    cards: {
      previous: { x: 525, y: 125, z: 20, width: 150, height: 210 },
      higher: { x: 725, y: 385, z: 20, width: 150, height: 210 },
      lower: { x: 325, y: 385, z: 20, width: 150, height: 210 },
      deck: { x: 525, y: 385, z: 20, width: 150, height: 210 }
    },
    elements: {
      round: { x: 0, y: 42, z: 30, width: 1200, height: 48 },
      roundTotalLabel: { x: 845, y: 575, z: 30, width: 170, height: 28 },
      roundTotalValue: { x: 1015, y: 575, z: 30, width: 130, height: 28 },
      potTotalLabel: { x: 845, y: 611, z: 30, width: 170, height: 28 },
      potTotalValue: { x: 1015, y: 611, z: 30, width: 130, height: 28 }
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
      players: { ...defaults.players, ...(value?.players || {}) },
      cards: Object.keys(defaults.cards).reduce((result, key) => {
        result[key] = { ...defaults.cards[key], ...(value?.cards?.[key] || {}) };
        return result;
      }, {}),
      elements: Object.keys(defaults.elements).reduce((result, key) => {
        result[key] = { ...defaults.elements[key], ...(value?.elements?.[key] || {}) };
        return result;
      }, {})
    };
  }

  function fromConfiguration(configuration) {
    const value = configuration || {};
    const name = value.activeLayout || 'default';
    const stored = value.layouts?.[name] || value.layout;
    return create(stored);
  }

  window.RTSHigherLowerLayout = {
    defaults,
    create,
    merge,
    fromConfiguration
  };
})();
