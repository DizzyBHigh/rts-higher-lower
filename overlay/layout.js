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
      lower: { x: 325, y: 385, z: 20, width: 150, height: 210 },
      deck: { x: 525, y: 385, z: 20, width: 150, height: 210 },
      higher: { x: 725, y: 385, z: 20, width: 150, height: 210 }
    },
    elements: {
      round: { x: 0, y: 42, z: 30, width: 1200, height: 48 },
      totals: { x: 845, y: 575, z: 30, width: 300, height: 65 }
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

  function migrate(value) {
    if (!value || value.coordinateSpace === 'overlay') return create(value);
    const layout = create(value);
    const board = layout.board;
    const scale = Number(board.scale) / 100 || 1;
    const offset = (item, width = true) => ({
      ...item,
      x: Number(board.x) + Number(item.x) * scale,
      y: Number(board.y) + Number(item.y) * scale,
      ...(width ? {
        width: Number(item.width) * scale,
        height: Number(item.height) * scale
      } : {})
    });

    Object.keys(layout.cards).forEach(name => {
      layout.cards[name] = offset(layout.cards[name]);
    });
    Object.keys(layout.elements).forEach(name => {
      layout.elements[name] = offset(layout.elements[name]);
    });

    const players = layout.players;
    const dx = (Number(players.x) + Number(players.width) / 2 - Number(board.width) / 2) * scale;
    const dy = (Number(players.y) + Number(players.height) / 2 - Number(board.height) / 2) * scale;
    layout.players = {
      ...players,
      x: Number(board.x) + dx,
      y: Number(board.y) - dy,
      scale: Number(players.scale) * scale,
      width: Number(players.width) * scale,
      height: Number(players.height) * scale
    };

    layout.coordinateSpace = 'overlay';
    return layout;
  }

  function fromConfiguration(configuration) {
    const value = configuration || {};
    const name = value.activeLayout || 'default';
    const stored = value.layouts?.[name] || value.layout;
    return migrate(stored);
  }

  window.RTSHigherLowerLayout = {
    defaults,
    create,
    merge,
    fromConfiguration,
    migrate
  };
})();
