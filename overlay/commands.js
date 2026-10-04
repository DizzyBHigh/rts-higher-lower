const RTSHigherLowerCommands = {
  reportResult(extension, result) {
    const game = extension.state.game?.state?.() || {};
    const data = {
      round: result.round,
      previousCard: result.previous,
      currentCard: result.card,
      result: result.result,
      deck: game.deck,
      roundHistory: game.roundHistory
    };
    RTS.core.log?.info('Higher Lower result', data);
    RTSOverlaySocket.requestAction('RTS - Higher Lower Game - Core', {
      rtsHigherLowerOperation: 'result',
      rtsOverlayData: JSON.stringify(data)
    });
  },

  handleCommand(extension, message) {
    const args = message?.data?.args || message?.args || {};
    RTS.core.log?.info('Higher Lower command received', args);
    if (args.rtsOverlayExtension !== 'rts-higher-lower') return;
    const command = args.rtsOverlayCommand || args.command;
    if (!command) return;
    const rawData = args.rtsOverlayData ?? args.data;
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    RTS.core.log?.info('Higher Lower command dispatch', { command, data });
    if (command === 'create') {
      extension.api.createGame(data?.startedAt ?? data ?? Date.now());
    }
    if (command === 'recover') extension.api.recover();
    if (command === 'start') {
      if (extension.state.game?.state?.() === 'playing') {
        RTS.core.log?.info('Higher Lower start already active; ignoring duplicate start command');
        return;
      }
      extension.api.startGame(data?.rounds ?? data ?? 10);
    }
    if (command === 'registration') {
      const startedAt = data?.startedAt ?? data ?? Date.now();
      extension.api.startRegistration(startedAt);
    }
    if (command === 'reset') extension.api.resetGame();
    if (command === 'hide') RTSHigherLowerPresentation.hide(extension);
    if (command === 'state' || command === 'update') extension.api.updateState(data);
    if (command === 'layout') extension.api.setLayout(data);
    if (command === 'draw') extension.api.drawCard();
    if (command === 'show') extension.api.showCard(data);
    if (command === 'flip') extension.api.flipCard();
    if (command === 'move') extension.api.moveCard(data?.position || data);
  }
};
