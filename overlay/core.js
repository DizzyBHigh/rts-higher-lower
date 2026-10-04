(() => {
  const manifest = {
    id: 'rts-higher-lower',
    name: 'RTS Higher Lower',
    version: '0.1.0'
  };

  const source = {
    init(extension) {
      extension.state.game = RTS.core.higherLowerGame.create();
      extension.state.card = null;
      extension.state.previousCardElement = null;
      extension.state.resultCardElement = null;
      extension.state.panel = null;
      extension.state.playersPanel = null;
      extension.state.layout = RTSHigherLowerLayout.create();
      extension.state.board = { round: 0, players: [], roundTotal: 0, potTotal: 0 };
      extension.configure = configuration => RTSHigherLowerRuntime.configure(extension, configuration);
      extension.api.startRegistration = startedAt => RTSHigherLowerRuntime.startRegistration(extension, startedAt);
      extension.api.startGame = rounds => RTSHigherLowerRuntime.startGame(extension, rounds);
      extension.api.updateState = data => RTSHigherLowerRuntime.updateBoard(extension, data);
      extension.api.setLayout = (layout, options) => RTSHigherLowerRuntime.setLayout(extension, layout, options);
      extension.api.getLayout = () => extension.state.layout;
      extension.api.drawCard = () => RTSHigherLowerRuntime.drawCard(extension);
      extension.api.showCard = card => RTSHigherLowerPresentation.showCard(extension, card);
      extension.api.flipCard = () => RTSHigherLowerPresentation.flipCard(extension);
      extension.api.moveCard = position => RTSHigherLowerPresentation.moveCard(extension, position);
      extension.api.resetGame = () => RTSHigherLowerRuntime.resetGame(extension);
      RTS.core.events?.on('RTS - Higher Lower Game', message =>
        RTSHigherLowerCommands.handleCommand(extension, message)
      );
    }
  };

  RTS.core.extensions.registerSource(manifest.id, source);
})();
