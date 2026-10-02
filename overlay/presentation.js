(() => {
  function getPanel(extension) {
    if (extension.state.panel) return extension.state.panel;
    const board = extension.state.layout.board;
    extension.state.panel = RTS.core.panels.create(
      'higher-lower-board', { positions: { Center: board } }
    );
    RTSHigherLowerBoard.build(extension.state.panel);
    RTSHigherLowerBoard.applyLayout(extension.state.panel, extension.state.layout);
    return extension.state.panel;
  }

  function updatePlayers(extension) {
    if (!RTSHigherLowerPlayersPresentation) return;
    RTSHigherLowerPlayersPresentation.update(
      extension,
      extension.state.board
    );
  }

  window.RTSHigherLowerPresentation = {
    getPanel,
    showCard: (extension, card) =>
      RTSHigherLowerCardsPresentation.showCard(extension, card),
    presentDraw: (extension, result) =>
      RTSHigherLowerCardsPresentation.presentDraw(extension, result),
    resetCards: extension =>
      RTSHigherLowerCardsPresentation.resetCards(extension),
    flipCard: extension =>
      RTSHigherLowerCardsPresentation.flipCard(extension),
    moveCard: (extension, position) =>
      RTSHigherLowerCardsPresentation.moveCard(extension, position),
    updatePlayers
  };
})();
