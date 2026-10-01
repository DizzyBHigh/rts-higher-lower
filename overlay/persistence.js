(() => {
  const Persistence = {
    save(game) {
      const state = typeof game?.state === 'function'
        ? game.state()
        : null;

      if (!state) return false;

      return RTSOverlaySocket.requestAction(
        'RTS - Higher Lower - Save Game State',
        {
          rtsHigherLowerGame: JSON.stringify(state)
        }
      );
    }
  };

  window.RTSHigherLowerPersistence = Persistence;
})();
