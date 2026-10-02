(() => {
  const Recovery = {
    apply(extension, configuration) {
      const value = configuration || {};
      const gameState = extension.state.game.restore(value.game);
      extension.state.card = gameState.currentCard || null;

      const history = Array.isArray(gameState.roundHistory)
        ? gameState.roundHistory
        : [];
      const last = history[history.length - 1];
      const previous = gameState.previousCard;
      const currentPosition = last?.result === 'lower'
        ? 'lower'
        : last?.result === 'higher'
          ? 'higher'
          : last?.result === 'equal'
            ? 'deck'
            : 'previous';

      if (gameState.round > 1 && previous)
        RTSHigherLowerPresentation.restoreCard(
          extension, previous, 'previous', true
        );

      if (gameState.currentCard)
        RTSHigherLowerPresentation.restoreCard(
          extension,
          gameState.currentCard,
          currentPosition,
          gameState.round <= 1
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
