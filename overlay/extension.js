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
    const ranks = { Jack: 'J', Queen: 'Q', King: 'K', Ace: 'A' };
    const suits = { Clubs: 'C', Diamonds: 'D', Hearts: 'H', Spades: 'S' };
    return (ranks[card?.rank] || card?.rank || '') +
      (suits[card?.suit] || card?.suit || '');
  }

  function assetPath(extension, deck, file) {
    return new URL('../assets/images/card Images/' + deck + '/' + file,
      extension.options.baseUrl + '/').href;
  }

  function setCard(extension, panel, card, back) {
    const file = back ? 'green_back.png' : cardCode(card) + '.png';
    panel.setContent(
      '<div class="hl-card">' +
      '<img class="hl-card__image" src="' +
      assetPath(extension, back ? 'Deck1' : 'Deck2', file) +
      '" alt="">' +
      '</div>'
    );
  }

  function showCard(extension, card) {
    const panel = getPanel();
    extension.state.card = card;
    setCard(extension, panel, card, false);
    panel.show({ x: 0, y: 0, scale: 100, rotateY: 180 });
    return panel;
  }

  function flipCard(extension, card) {
    const panel = getPanel();
    extension.state.card = card;
    const back = { x: 0, y: 0, scale: 100, rotateY: 0 };
    const edge = { x: 0, y: 0, scale: 100, rotateY: 90 };
    const front = { x: 0, y: 0, scale: 100, rotateY: 180 };

    setCard(extension, panel, card, true);
    panel.show(back);
    panel.runner.transition(back, edge, 300, 'ease-in', () => {
      setCard(extension, panel, card, false);
      panel.runner.transition(edge, front, 300, 'ease-out');
    });
    return panel;
  }

  RTS.core.extensions.registerSource(manifest.id, source);
})();
