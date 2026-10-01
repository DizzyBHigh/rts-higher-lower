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

      updateBoard(extension, gameState);
      return gameState;
    }
  };

  function updateBoard(extension, game) {
    const players = Array.isArray(game.players)
      ? game.players
      : [];
    const roundTotal = players.reduce(
      (total, player) => total + (Number(player.bet) || 0),
      0
    );
    const potTotal = players.reduce(
      (total, player) => total + (Number(player.pot) || 0),
      0
    );

    extension.api.updateState({
      round: game.round || 0,
      players,
      roundTotal,
      potTotal
    });
  }

  window.RTSHigherLowerRecovery = Recovery;
})();
