(() => {
  function root(extension) {
    return RTSHigherLowerPresentation.getPanel(extension).element;
  }

  async function presentDraw(extension, result) {
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const stage = root(extension);
    const options = RTSHigherLowerCards.options(extension);
    const old = extension.state.resultCardElement;

    if (old) {
      await RTSHigherLowerCards.move(
        old, stage, extension.state.layout,
        old.dataset.slot || 'higher', 'previous', options
      );
      old.dataset.slot = 'previous';
      extension.state.previousCardElement = old;
      extension.state.resultCardElement = null;
    }

    const node = RTSHigherLowerCards.create(extension, result.card);
    node.dataset.slot = 'deck';
    stage.appendChild(node);
    panel.show();
    await RTSHigherLowerCards.move(node, stage, extension.state.layout, 'deck', 'deck', options);
    await RTSHigherLowerCards.reveal(node);

    const destination = result.type === 'first-card' ? 'previous' :
      result.result === 'lower' ? 'lower' :
      result.result === 'higher' ? 'higher' : 'deck';
    await RTSHigherLowerCards.move(node, stage, extension.state.layout, 'deck', destination, options);
    node.dataset.slot = destination;
    if (destination === 'previous') extension.state.previousCardElement = node;
    else extension.state.resultCardElement = node;
    return panel;
  }

  function applyCardLayout(extension) {
    const stage = root(extension);
    [extension.state.previousCardElement, extension.state.resultCardElement].forEach(node => {
      if (!node?.dataset?.slot) return;
      RTSHigherLowerCards.move(
        node, stage, extension.state.layout,
        node.dataset.slot, node.dataset.slot,
        { duration: 0, easing: 'linear' }
      );
    });
  }

  function restoreCard(extension, card, position, previous) {
    if (!card || !position) return;
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const stage = root(extension);
    const node = RTSHigherLowerCards.create(extension, card);
    stage.appendChild(node);
    panel.show();
    const configured = RTSHigherLowerCards.options(extension);
    configured.duration = 0;
    return RTSHigherLowerCards.move(
      node, stage, extension.state.layout, position, position, configured
    ).then(() => {
      node.querySelector('.hl-card__inner').style.transform = 'rotateY(180deg)';
      node.dataset.slot = position;
      if (previous) extension.state.previousCardElement = node;
      else extension.state.resultCardElement = node;
    });
  }

  function resetCards(extension) {
    RTSHigherLowerCards.remove(extension.state.previousCardElement);
    RTSHigherLowerCards.remove(extension.state.resultCardElement);
    extension.state.previousCardElement = null;
    extension.state.resultCardElement = null;
  }

  async function showCard(extension, card) {
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const stage = root(extension);
    const node = RTSHigherLowerCards.create(extension, card);
    stage.appendChild(node);
    panel.show();
    await RTSHigherLowerCards.move(node, stage, extension.state.layout, 'deck', 'deck', RTSHigherLowerCards.options(extension));
    await RTSHigherLowerCards.reveal(node);
    node.dataset.slot = 'deck';
    extension.state.resultCardElement = node;
    return panel;
  }

  async function flipCard(extension) {
    const node = extension.state.resultCardElement || extension.state.previousCardElement;
    if (node) await RTSHigherLowerCards.reveal(node);
    return RTSHigherLowerPresentation.getPanel(extension);
  }

  function moveCard(extension, position) {
    const node = extension.state.resultCardElement || extension.state.previousCardElement;
    if (!node) return Promise.resolve(RTSHigherLowerPresentation.getPanel(extension));
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    const stage = root(extension);
    const from = node.dataset.slot || position;
    return RTSHigherLowerCards.move(
      node, stage, extension.state.layout, from, position,
      RTSHigherLowerCards.options(extension)
    ).then(() => {
      node.dataset.slot = position;
      return panel;
    });
  }

  window.RTSHigherLowerCardsPresentation = {
    presentDraw, applyLayout: applyCardLayout, restoreCard,
    resetCards, showCard, flipCard, moveCard
  };
})();
