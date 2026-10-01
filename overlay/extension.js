(() => {
  const manifest = {
    id: 'rts-higher-lower',
    name: 'RTS Higher Lower',
    version: '0.1.0'
  };

  const source = {
    init(extension) {
      extension.state.card = null;
      extension.api.showCard = card => showCard(extension, card);
      extension.api.flipCard = card => flipCard(extension, card);
    }
  };

  function getPanel() {
    return RTS.core.panels.create('higher-lower-card', {
      positions: {
        Center: { x: 0, y: 0, scale: 100 },
        OffLeft: { x: -45, y: 0, scale: 100 },
        OffRight: { x: 45, y: 0, scale: 100 }
      }
    });
  }

  function cardCode(card) {
    const ranks = {
      Jack: 'J',
      Queen: 'Q',
      King: 'K',
      Ace: 'A'
    };
    const suits = {
      Clubs: 'C',
      Diamonds: 'D',
      Hearts: 'H',
      Spades: 'S'
    };
    const rank = ranks[card?.rank] || card?.rank || '';
    const suit = suits[card?.suit] || card?.suit || '';
    return rank + suit;
  }

  function assetPath(deck, file) {
    return '../assets/images/card%20Images/' + deck + '/' +
      encodeURIComponent(file);
  }

  function setCard(panel, card) {
    const face = assetPath('Deck2', cardCode(card) + '.png');
    const back = assetPath('Deck1', 'green_back.png');
    panel.setContent(
      '<div class="hl-card">' +
      '<img class="hl-card__face" src="' + face + '" alt="">' +
      '<img class="hl-card__back" src="' + back + '" alt="">' +
      '</div>'
    );
  }

  function showCard(extension, card) {
    const panel = getPanel();
    extension.state.card = card;
    setCard(panel, card);
    panel.show({ x: 0, y: 0, scale: 100, rotateY: 180 });
    return panel;
  }

  function flipCard(extension, card) {
    const panel = getPanel();
    extension.state.card = card;
    const runner = panel.runner;
    const back = { x: 0, y: 0, scale: 100, rotateY: 0 };
    const edge = { x: 0, y: 0, scale: 100, rotateY: 90 };
    const front = { x: 0, y: 0, scale: 100, rotateY: 180 };

    setCard(panel, card);
    panel.show(back);
    runner.transition(back, edge, 300, 'ease-in', () => {
      runner.transition(edge, front, 300, 'ease-out');
    });
    return panel;
  }

  RTS.core.extensions.registerSource(manifest.id, source);
})();
