(() => {
  const defaults = {
    board: { x: 0, y: 0, scale: 100, z: 0, width: 1200, height: 675 },
    players: { x: 55, y: 125, scale: 100, z: 10, width: 260, height: 400 },
    cards: {
      previous: { x: 525, y: 125, z: 20, width: 150, height: 210 },
      higher: { x: 725, y: 385, z: 20, width: 150, height: 210 },
      lower: { x: 325, y: 385, z: 20, width: 150, height: 210 },
      deck: { x: 525, y: 385, z: 20, width: 150, height: 210 }
    },
    elements: {
      round: { x: 0, y: 42, z: 30, width: 1200, height: 48 },
      roundTimer: { x: 525, y: 315, z: 30, width: 150, height: 48 },
      roundTotalLabel: { x: 845, y: 575, z: 30, width: 170, height: 28 },
      roundTotalValue: { x: 1015, y: 575, z: 30, width: 130, height: 28 },
      potTotalLabel: { x: 845, y: 611, z: 30, width: 170, height: 28 },
      potTotalValue: { x: 1015, y: 611, z: 30, width: 130, height: 28 }
    }
  };

  const clone = value => JSON.parse(JSON.stringify(value));

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

  function merge(base, value) {
    const source = value || {};
    return {
      board: { ...(base?.board || {}), ...(source.board || {}) },
      players: { ...(base?.players || {}), ...(source.players || {}) },
      cards: Object.keys(defaults.cards).reduce((result, key) => {
        result[key] = { ...(base?.cards?.[key] || {}), ...(source.cards?.[key] || {}) };
        return result;
      }, {}),
      elements: Object.keys(defaults.elements).reduce((result, key) => {
        result[key] = { ...(base?.elements?.[key] || {}), ...(source.elements?.[key] || {}) };
        return result;
      }, {})
    };
  }

  function fromConfiguration(configuration) {
    const value = configuration || {};
    const name = value.activeLayout || 'default';
    return create(value.layouts?.[name] || value.layout);
  }

  function targets(extension) {
    const panel = extension.state.panel?.element;
    const players = extension.state.playersPanel?.element;
    const result = panel ? Array.from(panel.querySelectorAll(
      '.hl-board,.hl-board__round,.hl-board__round-timer,' +
      '.hl-board__previous,.hl-board__higher,.hl-board__lower,.hl-board__deck,' +
      '.hl-board__round-total-label,.hl-board__round-total-value,' +
      '.hl-board__pot-total-label,.hl-board__pot-total-value'
    )) : [];
    if (players) result.push(players);
    return result;
  }

  function snapshot(extension) {
    return targets(extension).map(element => ({
      element,
      left: getComputedStyle(element).left,
      top: getComputedStyle(element).top,
      width: getComputedStyle(element).width,
      height: getComputedStyle(element).height
    }));
  }

  function animate(extension, before) {
    const settings = RTSHigherLowerConfiguration.current?.settings || {};
    const duration = Math.max(0, Number(settings.cardAnimation?.duration) || 500);
    const easing = settings.cardAnimation?.easing || 'ease-in-out';
    if (!duration) return;

    before.forEach(item => {
      const style = getComputedStyle(item.element);
      item.element.animate([
        { left: item.left, top: item.top, width: item.width, height: item.height },
        { left: style.left, top: style.top, width: style.width, height: style.height }
      ], { duration, easing });
    });
  }

  window.RTSHigherLowerLayout = {
    defaults,
    clone,
    create,
    merge,
    fromConfiguration,
    transition(extension, apply) {
      const before = snapshot(extension);
      const result = apply();
      requestAnimationFrame(() => animate(extension, before));
      return result;
    }
  };
})();
