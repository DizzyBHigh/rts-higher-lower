const RTSHigherLowerCommands = {
  reportResult(extension, result) {
    RTS.core.log?.info('Higher Lower result', result);
    RTSOverlaySocket.requestAction('RTS - Overlay - Extension Result', {
      rtsOverlayExtension: 'rts-higher-lower',
      rtsOverlayEvent: 'higher-lower-result',
      rtsOverlayData: JSON.stringify({
        round: result.round,
        previousCard: result.previous,
        currentCard: result.card,
        result: result.result
      })
    });
  },

  handleCommand(extension, message) {
    const args = message?.data?.args || message?.args || {};
    RTS.core.log?.info('Higher Lower command received', args);
    if (args.rtsOverlayExtension !== 'rts-higher-lower') return;
    const command = args.rtsOverlayCommand || args.command;
    const rawData = args.rtsOverlayData || args.data;
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    RTS.core.log?.info('Higher Lower command dispatch', { command, data });
    if (command === 'start') extension.api.startGame(data?.rounds ?? data ?? 10);
    if (command === 'registration') {
      const startedAt = data?.startedAt ?? data ?? Date.now();
      RTSHigherLowerTimer.startRegistration(extension, startedAt);
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
