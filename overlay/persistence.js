(() => {
  const Persistence = {
    save(game) {
      const state = typeof game?.state === 'function'
        ? game.state()
        : null;

      if (!state) return false;

      return RTSOverlaySocket.requestAction(
        'RTS - Higher Lower - Game',
        {
          rtsHigherLowerOperation: 'saveGame',
          rtsHigherLowerGame: JSON.stringify(state)
        }
      );
    }
  };

  window.RTSHigherLowerPersistence = Persistence;
})();
