(() => {
  const DEFAULT_DURATION = 500;
  const DEFAULT_EASING = 'ease-in-out';

  function code(card) {
    const ranks = { Jack: 'J', Queen: 'Q', King: 'K', Ace: 'A' };
    const suits = { Clubs: 'C', Diamonds: 'D', Hearts: 'H', Spades: 'S' };
    return (ranks[card?.rank] || card?.rank || '') +
      (suits[card?.suit] || card?.suit || '');
  }

  function asset(extension, deck, file) {
    return new URL(
      '../assets/images/card Images/' + deck + '/' + file,
      extension.options.baseUrl + '/'
    ).href;
  }

  function create(extension, card) {
    const node = document.createElement('div');
    node.className = 'hl-card';
    node.innerHTML =
      '<div class="hl-card__inner">' +
        '<img class="hl-card__face" src="' +
          asset(extension, 'Deck2', code(card) + '.png') + '" alt="">' +
        '<img class="hl-card__back" src="' +
          asset(extension, 'Deck1', 'green_back.png') + '" alt="">' +
      '</div>';
    return node;
  }

  function positions(root, layout) {
    const result = {};
    Object.keys(layout.cards).forEach(name => {
      const value = layout.cards[name];
      result[name] = {
        x: Number(value.x) || 0,
        y: Number(value.y) || 0,
        scaleX: (Number(value.width) || 150) / 150 * 100,
        scaleY: (Number(value.height) || 210) / 210 * 100
      };
    });
    return result;
  }

  function options(extension) {
    const value = extension.state.configuration?.settings?.cardAnimation || {};
    return {
      duration: Math.max(0, Number(value.duration) || DEFAULT_DURATION),
      easing: value.easing || DEFAULT_EASING
    };
  }

  function move(node, root, layout, from, to, value) {
    const configured = positions(root, layout);
    const runner = RTS.core.animation.createRunner(node, configured);
    const start = configured[from] || configured[to];
    const target = configured[to];
    runner.apply(start);
    return new Promise(resolve =>
      runner.transition(start, target, value.duration, value.easing, resolve)
    );
  }

  function reveal(node) {
    const inner = node.querySelector('.hl-card__inner');
    inner.style.transform = 'rotateY(0deg)';
    return inner.animate(
      [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }],
      { duration: 600, easing: 'ease-in-out', fill: 'forwards' }
    ).finished;
  }

  function remove(node) {
    if (node?.parentNode) node.parentNode.removeChild(node);
  }

  window.RTSHigherLowerCards = {
    create,
    options,
    move,
    reveal,
    remove
  };
})();
