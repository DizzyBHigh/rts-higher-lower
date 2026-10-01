(() => {
  const Recovery = {
    apply(extension, configuration) {
      const value = configuration || {};
      const gameState = extension.state.game.restore(value.game);
      extension.state.card = gameState.currentCard || null;

      if (gameState.currentCard)
        RTSHigherLowerPresentation.showCard(
          extension,
          gameState.currentCard
        );

      return gameState;
    }
  };

  window.RTSHigherLowerRecovery = Recovery;
})();
