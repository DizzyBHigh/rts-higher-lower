(() => {
  const manifest = {
    id: 'rts-higher-lower',
    name: 'RTS Higher Lower',
    version: '0.1.0'
  };

  const source = {
    init(extension) {
      extension.state.card = null;
      extension.state.panel = null;
      extension.api.showCard = card => showCard(extension, card);
      extension.api.flipCard = card => flipCard(extension, card);
    }
  };

  function getPanel(extension) {
    if (extension.state.panel) return extension.state.panel;

    const panel = RTS.core.panels.create('higher-lower-card', {
      positions: {
        Center: { x: 0, y: 0, scale: 100 },
        OffLeft: { x: -45, y: 0, scale: 100 },
        OffRight: { x: 45, y: 0, scale: 100 }
      }
    });

    extension.state.panel = panel;
    return panel;
  }

  function cardCode(card) {
    const ranks = { Jack: 'J', Queen: 'Q', King: 'K', Ace: 'A' };
    const suits = { Clubs: 'C', Diamonds: 'D', Hearts: 'H', Spades: 'S' };
    return (ranks[card?.rank] || card?.rank || '') +
      (suits[card?.suit] || card?.suit || '');
  }

  function assetPath(extension, deck, file) {
    return new URL('../assets/images/card Images/' + deck + '/' + file,
      extension.options.baseUrl + '/').href;
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
    const cardElement = setCard(extension, panel, card);

    cardElement.style.transform = 'rotateY(180deg)';
    panel.show({ x: 0, y: 0, scale: 100 });
    return panel;
  }

  function flipCard(extension, card) {
    const panel = getPanel(extension);
    extension.state.card = card;

    const cardElement = setCard(extension, panel, card);
    cardElement.style.transform = 'rotateY(0deg)';
    panel.show(panel.runner.getActive() || {
      x: 0,
      y: 0,
      scale: 100
    });

    cardElement.animate(
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

    return panel;
  }

  RTS.core.extensions.registerSource(manifest.id, source);
})();
