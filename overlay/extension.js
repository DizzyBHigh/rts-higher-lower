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
      extension.state.panel = null;

      extension.api.startGame = rounds =>
        extension.state.game.start(rounds);

      extension.api.drawCard = () => drawCard(extension);
      extension.api.showCard = card =>
        RTSHigherLowerPresentation.showCard(extension, card);
      extension.api.flipCard = card =>
        RTSHigherLowerPresentation.flipCard(extension, card);
      extension.api.moveCard = position =>
        RTSHigherLowerPresentation.moveCard(extension, position);

      RTS.core.events?.on(
        'RTS - Overlay - Extension Command',
        message => handleCommand(extension, message)
      );
    }
  };

  async function drawCard(extension) {
    const result = extension.state.game.draw();
    extension.state.card = result.card || null;

    if (!result.card)
      return result;

    await RTSHigherLowerPresentation.flipCard(
      extension,
      result.card
    );

    reportResult(result);
    return result;
  }

  function reportResult(result) {
    RTSOverlaySocket.requestAction(
      'RTS - Overlay - Extension Result',
      {
        rtsOverlayExtension: manifest.id,
        rtsOverlayEvent: 'higher-lower-result',
        rtsOverlayData: JSON.stringify(result)
      }
    );
  }

  function handleCommand(extension, message) {
    const args = message?.data?.args || message?.args || {};
    if (args.rtsOverlayExtension !== manifest.id) return;

    const command = args.rtsOverlayCommand || args.command;
    const rawData = args.rtsOverlayData || args.data;
    const data = typeof rawData === 'string'
      ? JSON.parse(rawData)
      : rawData;

    if (command === 'start')
      extension.api.startGame(data?.rounds ?? data ?? 10);

    if (command === 'draw')
      extension.api.drawCard();

    if (command === 'show')
      extension.api.showCard(data);

    if (command === 'flip')
      extension.api.flipCard(data);

    if (command === 'move')
      extension.api.moveCard(data?.position || data);
  }

  RTS.core.extensions.registerSource(manifest.id, source);
})();
