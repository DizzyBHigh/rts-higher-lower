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

  function cardText(card) {
    return (card?.symbol || '') + (card?.rank || '') +
      (card?.suit ? ' of ' + card.suit : '');
  }

  function setCard(panel, card, hidden) {
    panel.setContent(
      '<div class="hl-card ' + (hidden ? 'hl-card--back' : '') + '">' +
      '<div class="hl-card__corner">' + (hidden ? '?' : cardText(card)) + '</div>' +
      '<div class="hl-card__value">' +
      (hidden ? '?' : (card?.symbol || '') + (card?.rank || '')) +
      '</div></div>'
    );
  }

  function showCard(extension, card) {
    const panel = getPanel();
    extension.state.card = card;
    setCard(panel, card, false);
    panel.show({ x: 0, y: 0, scale: 100 });
    return panel;
  }

  function flipCard(extension, card) {
    const panel = getPanel();
    extension.state.card = card;
    const runner = panel.runner;
    const front = { x: 0, y: 0, scale: 100, rotateY: 0 };
    const edge = { x: 0, y: 0, scale: 100, rotateY: 90 };
    panel.show(front);
    runner.transition(front, edge, 300, 'ease-in', () => {
      setCard(panel, card, false);
      runner.transition(edge, front, 300, 'ease-out');
    });
    return panel;
  }

  RTS.core.extensions.registerManifest(manifest);
  RTS.core.extensions.registerSource(manifest.id, source);
})();
