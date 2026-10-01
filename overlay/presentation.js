(() => {
  function getPanel(extension) {
    if (extension.state.panel) return extension.state.panel;
    const board = extension.state.layout.board;
    extension.state.panel = RTS.core.panels.create(
      'higher-lower-board', { positions: { Center: board } }
    );
    RTSHigherLowerBoard.build(extension.state.panel);
    RTSHigherLowerBoard.applyLayout(extension.state.panel, extension.state.layout);
    return extension.state.panel;
  }

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

  function cardElement(extension, card) {
    const node = document.createElement('div');
    node.className = 'hl-card';
    node.innerHTML =
      '<img class="hl-card__face" src="' + asset(extension, 'Deck2', code(card) + '.png') + '" alt="">' +
      '<img class="hl-card__back" src="' + asset(extension, 'Deck1', 'green_back.png') + '" alt="">';
    return node;
  }

  function slot(root, name) {
    return root.querySelector('.hl-board__' + name);
  }

  function targetRect(root, target) {
    const rr = root.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    return {
      left: tr.left - rr.left, top: tr.top - rr.top,
      width: tr.width, height: tr.height
    };
  }

  function place(node, target) {
    const value = targetRect(target.closest('.hl-board'), target);
    node.style.left = value.left + 'px';
    node.style.top = value.top + 'px';
    node.style.width = value.width + 'px';
    node.style.height = value.height + 'px';
  }

  function flip(node) {
    node.style.transform = 'rotateY(0deg)';
    const animation = node.animate(
      [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(180deg)' }],
      { duration: 600, easing: 'ease-in-out', fill: 'forwards' }
    );
    return animation.finished;
  }

  function removeNode(node) {
    if (node?.parentNode) node.parentNode.removeChild(node);
  }

  function show(extension, card) {
    const panel = getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    removeNode(extension.state.currentCardElement);

    const node = cardElement(extension, card);
    root.appendChild(node);
    place(node, slot(root, 'current'));
    node.style.transform = 'rotateY(180deg)';
    panel.show(extension.state.layout.board);
    extension.state.currentCardElement = node;
    return Promise.resolve(panel);
  }

  async function presentDraw(extension, result) {
    const panel = getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    const currentTarget = slot(root, 'current');
    const previousTarget = slot(root, 'previous');
    const deckTarget = slot(root, 'deck');
    const old = extension.state.currentCardElement;

    removeNode(extension.state.previousCardElement);

    if (old) {
      place(old, currentTarget);
      const previous = targetRect(root, previousTarget);
      await old.animate(
        { left: previous.left + 'px', top: previous.top + 'px' },
        { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
      ).finished;
      extension.state.previousCardElement = old;
    }

    const node = cardElement(extension, result.card);
    root.appendChild(node);
    place(node, deckTarget);
    panel.show(extension.state.layout.board);

    const current = targetRect(root, currentTarget);
    await node.animate(
      { left: current.left + 'px', top: current.top + 'px' },
      { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
    ).finished;

    await flip(node);
    extension.state.currentCardElement = node;
    return panel;
  }

  function moveCard(extension, position) {
    const panel = getPanel(extension);
    const target = panel.runner.resolve(position, position);
    const from = panel.runner.getActive() || target;
    panel.show(from);

    return new Promise(resolve => {
      panel.runner.transition(
        from, target, 500, 'ease-in-out', () => resolve(panel)
      );
    });
  }

  window.RTSHigherLowerPresentation = {
    getPanel,
    showCard: show,
    presentDraw,
    flipCard: (extension, card) =>
      show(extension, card).then(() => flip(extension.state.currentCardElement)),
    moveCard
  };
})();
