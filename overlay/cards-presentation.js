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

  function slots(root, layout) {
    const board = root.getBoundingClientRect();
    const result = {};
    Object.keys(layout.cards).forEach(name => {
      const target = root.querySelector('.hl-board__' + name);
      if (!target) return;
      const rect = target.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      result[name] = {
        x: (centerX - (board.left + board.width / 2)) / board.width * 100,
        y: ((board.top + board.height / 2) - centerY) / board.height * 100,
        scaleX: rect.width / 150 * 100,
        scaleY: rect.height / 210 * 100
      };
    });
    return result;
  }

  function animationOptions(extension) {
    const value = extension.state.configuration?.animation?.card || {};
    return {
      duration: Math.max(0, Number(value.duration) || DEFAULT_DURATION),
      easing: value.easing || DEFAULT_EASING
    };
  }

  function move(node, root, layout, from, to, options) {
    const positions = slots(root, layout);
    const runner = RTS.core.animation.createRunner(node, positions);
    const start = positions[from] || positions[to];
    const target = positions[to];
    runner.apply(start);
    return new Promise(resolve => {
      runner.transition(
        start,
        target,
        options.duration,
        options.easing,
        resolve
      );
    });
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

  async function presentDraw(extension, result) {
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    const options = animationOptions(extension);
    const old = extension.state.resultCardElement;

    remove(extension.state.previousCardElement);

    if (old) {
      await move(
        old,
        root,
        extension.state.layout,
        old.dataset.slot || 'higher',
        'previous',
        options
      );
      old.dataset.slot = 'previous';
      extension.state.previousCardElement = old;
      extension.state.resultCardElement = null;
    }

    const node = create(extension, result.card);
    node.dataset.slot = 'deck';
    root.appendChild(node);
    panel.show(extension.state.layout.board);

    await move(node, root, extension.state.layout, 'deck', 'deck', options);
    await reveal(node);

    if (result.type !== 'first-card') {
      const destination = result.result === 'lower' ? 'lower' : 'higher';
      await move(node, root, extension.state.layout, 'deck', destination, options);
      node.dataset.slot = destination;
    } else {
      await move(node, root, extension.state.layout, 'deck', 'previous', options);
      node.dataset.slot = 'previous';
      extension.state.previousCardElement = node;
    }

    if (result.type !== 'first-card') extension.state.resultCardElement = node;
    return panel;
  }

  function resetCards(extension) {
    remove(extension.state.previousCardElement);
    remove(extension.state.resultCardElement);
    extension.state.previousCardElement = null;
    extension.state.resultCardElement = null;
  }

  async function showCard(extension, card) {
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    const node = create(extension, card);
    root.appendChild(node);
    panel.show(extension.state.layout.board);
    await move(node, root, extension.state.layout, 'deck', 'deck', animationOptions(extension));
    await reveal(node);
    extension.state.resultCardElement = node;
    node.dataset.slot = 'deck';
    return panel;
  }

  async function flipCard(extension) {
    const node = extension.state.resultCardElement ||
      extension.state.previousCardElement;
    if (node) await reveal(node);
    return RTSHigherLowerPresentation.getPanel(extension);
  }

  function moveCard(extension, position) {
    const node = extension.state.resultCardElement ||
      extension.state.previousCardElement;
    if (!node) return Promise.resolve(RTSHigherLowerPresentation.getPanel(extension));
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    const from = node.dataset.slot || position;
    return move(
      node, root, extension.state.layout, from, position,
      animationOptions(extension)
    ).then(() => {
      node.dataset.slot = position;
      return panel;
    });
  }

  window.RTSHigherLowerCardsPresentation = {
    presentDraw,
    resetCards,
    showCard,
    flipCard,
    moveCard
  };
})();
