(() => {
  const positions = {
    Center: { x: 0, y: 0, scale: 100 },
    OffLeft: { x: -45, y: 0, scale: 100 },
    OffRight: { x: 45, y: 0, scale: 100 }
  };

  function getPanel(extension) {
    if (extension.state.panel) return extension.state.panel;
    extension.state.panel = RTS.core.panels.create(
      'higher-lower-board',
      { positions }
    );
    RTSHigherLowerBoard.build(extension.state.panel);
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
    const cardNode = document.createElement('div');
    cardNode.className = 'hl-card';
    cardNode.innerHTML =
      '<img class="hl-card__face" src="' +
      asset(extension, 'Deck2', code(card) + '.png') +
      '" alt="">' +
      '<img class="hl-card__back" src="' +
      asset(extension, 'Deck1', 'green_back.png') +
      '" alt="">';
    return cardNode;
  }

  function slot(root, name) {
    return root.querySelector('.hl-board__' + name);
  }

  function place(cardNode, target) {
    const root = target.closest('.hl-board');
    const rr = root.getBoundingClientRect();
    const tr = target.getBoundingClientRect();
    cardNode.style.left = (tr.left - rr.left) + 'px';
    cardNode.style.top = (tr.top - rr.top) + 'px';
  }

  function flip(cardNode) {
    cardNode.style.transform = 'rotateY(0deg)';
    const animation = cardNode.animate(
      [
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(180deg)' }
      ],
      { duration: 600, easing: 'ease-in-out', fill: 'forwards' }
    );
    return animation.finished;
  }

  function show(extension, card) {
    const panel = getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    const target = slot(root, 'current');
    const node = cardElement(extension, card);
    root.appendChild(node);
    place(node, target);
    node.style.transform = 'rotateY(180deg)';
    panel.show(panel.runner.getActive() || positions.Center);
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

    if (old) {
      place(old, currentTarget);
      await old.animate(
        {
          left: previousTarget.offsetLeft + 'px',
          top: previousTarget.offsetTop + 'px'
        },
        { duration: 500, easing: 'ease-in-out', fill: 'forwards' }
      ).finished;
    }

    const node = cardElement(extension, result.card);
    root.appendChild(node);
    place(node, deckTarget);
    panel.show(panel.runner.getActive() || positions.Center);

    await node.animate(
      {
        left: currentTarget.offsetLeft + 'px',
        top: currentTarget.offsetTop + 'px'
      },
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
    showCard: show,
    presentDraw,
    flipCard: (extension, card) => show(extension, card).then(() =>
      flip(extension.state.currentCardElement)),
    moveCard
  };
})();
