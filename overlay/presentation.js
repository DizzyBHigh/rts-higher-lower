(() => {
  const positions = {
    Center: { x: 0, y: 0, scale: 100 },
    OffLeft: { x: -45, y: 0, scale: 100 },
    OffRight: { x: 45, y: 0, scale: 100 }
  };

  function getPanel(extension) {
    if (extension.state.panel) return extension.state.panel;

    extension.state.panel = RTS.core.panels.create(
      'higher-lower-card',
      { positions }
    );
    return extension.state.panel;
  }

  function cardCode(card) {
    const ranks = { Jack: 'J', Queen: 'Q', King: 'K', Ace: 'A' };
    const suits = { Clubs: 'C', Diamonds: 'D', Hearts: 'H', Spades: 'S' };
    return (ranks[card?.rank] || card?.rank || '') +
      (suits[card?.suit] || card?.suit || '');
  }

  function assetPath(extension, deck, file) {
    return new URL(
      '../assets/images/card Images/' + deck + '/' + file,
      extension.options.baseUrl + '/'
    ).href;
  }

  function setCard(extension, panel, card) {
    const face = assetPath(extension, 'Deck2', cardCode(card) + '.png');
    const back = assetPath(extension, 'Deck1', 'green_back.png');

    panel.setContent(
      '<div class="hl-card">' +
      '<img class="hl-card__face" src="' + face + '" alt="">' +
      '<img class="hl-card__back" src="' + back + '" alt="">' +
      '</div>'
    );

    return panel.element.querySelector('.hl-card');
  }

  function showCard(extension, card) {
    const panel = getPanel(extension);
    extension.state.card = card;
    const element = setCard(extension, panel, card);

    element.style.transform = 'rotateY(180deg)';
    panel.show(panel.runner.getActive() || positions.Center);
    return Promise.resolve(panel);
  }

  function flipCard(extension, card) {
    const panel = getPanel(extension);
    extension.state.card = card;
    const element = setCard(extension, panel, card);

    element.style.transform = 'rotateY(0deg)';
    panel.show(panel.runner.getActive() || positions.Center);

    const animation = element.animate(
      [
        { transform: 'rotateY(0deg)' },
        { transform: 'rotateY(180deg)' }
      ],
      {
        duration: 600,
        easing: 'ease-in-out',
        fill: 'forwards'
      }
    );

    return animation.finished.then(() => panel);
  }

  function moveCard(extension, position) {
    const panel = getPanel(extension);
    const target = panel.runner.resolve(position, position);
    const from = panel.runner.getActive() || target;

    panel.show(from);

    return new Promise(resolve => {
      panel.runner.transition(
        from,
        target,
        500,
        'ease-in-out',
        () => resolve(panel)
      );
    });
  }

  window.RTSHigherLowerPresentation = {
    showCard,
    flipCard,
    moveCard
  };
})();
