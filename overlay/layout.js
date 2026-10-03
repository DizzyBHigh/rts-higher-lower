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
    return create({
      ...(base || {}),
      ...(value || {}),
      cards: { ...(base?.cards || {}), ...(value?.cards || {}) },
      elements: { ...(base?.elements || {}), ...(value?.elements || {}) }
    });
  }

  function fromConfiguration(configuration) {
    const value = configuration || {};
    const name = value.activeLayout || 'default';
    return create(value.layouts?.[name] || value.layout);
  }

  function targets(extension) {
    const panel = extension.state.panel?.element;
    const players = extension.state.playersPanel?.element;
    const result = {};
    if (panel) {
      result.board = panel.querySelector('.hl-board');
      result.elements = {
        round: panel.querySelector('.hl-board__round'),
        roundTimer: panel.querySelector('.hl-board__round-timer'),
        roundTotalLabel: panel.querySelector('.hl-board__round-total-label'),
        roundTotalValue: panel.querySelector('.hl-board__round-total-value'),
        potTotalLabel: panel.querySelector('.hl-board__pot-total-label'),
        potTotalValue: panel.querySelector('.hl-board__pot-total-value')
      };
      result.cards = {
        previous: panel.querySelector('.hl-board__previous'),
        higher: panel.querySelector('.hl-board__higher'),
        lower: panel.querySelector('.hl-board__lower'),
        deck: panel.querySelector('.hl-board__deck')
      };
    }
    result.players = players;
    return result;
  }

  function applyValue(element, value, path) {
    if (!element || !value) return;
    if (path === 'board') {
      element.style.left = (value.x || 0) + 'px';
      element.style.top = (value.y || 0) + 'px';
      element.style.width = value.width + 'px';
      element.style.height = value.height + 'px';
      element.style.zIndex = String(value.z ?? 0);
      element.style.transform = 'scale(' + ((Number(value.scale) || 100) / 100) + ')';
      element.style.transformOrigin = 'top left';
      return;
    }
    if (path === 'players') {
      element.style.width = value.width + 'px';
      element.style.height = value.height + 'px';
      element.style.zIndex = String(value.z ?? 10);
      RTS.core.positioning.apply(element, {
        x: value.x, y: value.y, z: value.z,
        scaleX: value.scale, scaleY: value.scale
      });
      return;
    }
    element.style.left = (value.x || 0) + 'px';
    element.style.top = (value.y || 0) + 'px';
    element.style.width = value.width + 'px';
    element.style.height = value.height + 'px';
    element.style.zIndex = String(value.z ?? 0);
  }

  window.RTSHigherLowerLayout = {
    defaults,
    clone,
    create,
    merge,
    fromConfiguration,
    transition(extension, from, to, complete) {
      const settings = RTSHigherLowerConfiguration.current?.settings || {};
      const options = settings.cardAnimation || {};
      const runner = RTS.core.layoutAnimation.createRunner(targets(extension), applyValue);
      return new Promise(resolve => {
        runner.animate(from, to, {
          duration: Math.max(0, Number(options.duration) || 500),
          easing: options.easing || 'ease-in-out'
        }, () => {
          if (typeof complete === 'function') complete();
          resolve();
        });
      });
    }
  };
})();
