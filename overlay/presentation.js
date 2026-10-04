(() => {
  function getPanel(extension) {
    if (extension.state.panel) return extension.state.panel;
    extension.state.panel = RTS.core.panels.create('higher-lower-board');
    RTSHigherLowerBoard.build(extension.state.panel);
    RTSHigherLowerBoard.applyLayout(extension.state.panel, extension.state.layout);
    return extension.state.panel;
  }

  function show(extension) {
    const panel = getPanel(extension);
    const board = extension.state.layout?.board;
    if (board) panel.element.style.zIndex = String(board.z ?? 0);
    panel.show();
  }

  function reset(extension) {
    RTSHigherLowerTimer.stop(extension);
    RTSHigherLowerCardsPresentation.resetCards(extension);
    extension.state.card = null;
  }

  function updatePlayers(extension) {
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
  }

  window.RTSHigherLowerPresentation = {
    getPanel,
    show,
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
