(() => {
  async function presentDraw(extension, result) {
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    const options = RTSHigherLowerCards.options(extension);
    const old = extension.state.resultCardElement;

    RTSHigherLowerCards.remove(extension.state.previousCardElement);

    if (old) {
      await RTSHigherLowerCards.move(
        old, root, extension.state.layout,
        old.dataset.slot || 'higher', 'previous', options
      );
      old.dataset.slot = 'previous';
      extension.state.previousCardElement = old;
      extension.state.resultCardElement = null;
    }

    const node = RTSHigherLowerCards.create(extension, result.card);
    node.dataset.slot = 'deck';
    root.appendChild(node);
    panel.show(extension.state.layout.board);

    await RTSHigherLowerCards.move(
      node, root, extension.state.layout, 'deck', 'deck', options
    );
    await RTSHigherLowerCards.reveal(node);

    if (result.type === 'first-card') {
      await RTSHigherLowerCards.move(
        node, root, extension.state.layout, 'deck', 'previous', options
      );
      node.dataset.slot = 'previous';
      extension.state.previousCardElement = node;
    } else {
      const destination = result.result === 'lower' ? 'lower' : 'higher';
      await RTSHigherLowerCards.move(
        node, root, extension.state.layout, 'deck', destination, options
      );
      node.dataset.slot = destination;
      extension.state.resultCardElement = node;
    }

    return panel;
  }

  function resetCards(extension) {
    RTSHigherLowerCards.remove(extension.state.previousCardElement);
    RTSHigherLowerCards.remove(extension.state.resultCardElement);
    extension.state.previousCardElement = null;
    extension.state.resultCardElement = null;
  }

  async function showCard(extension, card) {
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    const node = RTSHigherLowerCards.create(extension, card);
    root.appendChild(node);
    panel.show(extension.state.layout.board);
    await RTSHigherLowerCards.move(
      node, root, extension.state.layout, 'deck', 'deck',
      RTSHigherLowerCards.options(extension)
    );
    await RTSHigherLowerCards.reveal(node);
    node.dataset.slot = 'deck';
    extension.state.resultCardElement = node;
    return panel;
  }

  async function flipCard(extension) {
    const node = extension.state.resultCardElement ||
      extension.state.previousCardElement;
    if (node) await RTSHigherLowerCards.reveal(node);
    return RTSHigherLowerPresentation.getPanel(extension);
  }

  function moveCard(extension, position) {
    const node = extension.state.resultCardElement ||
      extension.state.previousCardElement;
    if (!node) return Promise.resolve(RTSHigherLowerPresentation.getPanel(extension));
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const root = panel.element.querySelector('.hl-board');
    const from = node.dataset.slot || position;
    return RTSHigherLowerCards.move(
      node, root, extension.state.layout, from, position,
      RTSHigherLowerCards.options(extension)
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
