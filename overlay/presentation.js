(() => {
  function getPanel(extension) {
    if (extension.state.panel) return extension.state.panel;
    extension.state.panel = RTS.core.panels.create('higher-lower-board');
    RTSHigherLowerBoard.build(extension.state.panel);
    RTSHigherLowerBoard.applyLayout(extension.state.panel, extension.state.layout);
    return extension.state.panel;
  }

  function show(extension) {
    getPanel(extension).show();
  }

  function hide(extension) {
    const panel = getPanel(extension);
    if (panel.element) panel.element.style.display = 'none';
  }

  function reset(extension) {
    RTSHigherLowerTimer.stop(extension);
    RTSHigherLowerCardsPresentation.resetCards(extension);
    extension.state.card = null;
    hide(extension);
  }

  function updatePlayers(extension) {
    if (!RTSHigherLowerPlayersPresentation) return;
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
  }

  window.RTSHigherLowerPresentation = {
    getPanel,
    show,
    hide,
    reset,
    showCard: (extension, card) => RTSHigherLowerCardsPresentation.showCard(extension, card),
    restoreCard: (extension, card, position, previous) => RTSHigherLowerCardsPresentation.restoreCard(extension, card, position, previous),
    presentDraw: (extension, result) => RTSHigherLowerCardsPresentation.presentDraw(extension, result),
    resetCards: extension => RTSHigherLowerCardsPresentation.resetCards(extension),
    flipCard: extension => RTSHigherLowerCardsPresentation.flipCard(extension),
    moveCard: (extension, position) => RTSHigherLowerCardsPresentation.moveCard(extension, position),
    updatePlayers
  };
})();
