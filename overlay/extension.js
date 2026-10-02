(() => {
  const manifest = { id: 'rts-higher-lower', name: 'RTS Higher Lower', version: '0.1.0' };
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
      extension.configure = configuration => configure(extension, configuration);
      extension.api.startGame = rounds => startGame(extension, rounds);
      extension.api.updateState = data => updateBoard(extension, data);
      extension.api.setLayout = layout => setLayout(extension, layout);
      extension.api.getLayout = () => extension.state.layout;
      extension.api.drawCard = () => drawCard(extension);
      extension.api.showCard = card => RTSHigherLowerPresentation.showCard(extension, card);
      extension.api.flipCard = () => RTSHigherLowerPresentation.flipCard(extension);
      extension.api.moveCard = position => RTSHigherLowerPresentation.moveCard(extension, position);
      RTS.core.events?.on('RTS - Overlay - Extension Command', message => handleCommand(extension, message));
    }
  };
  async function startGame(extension, rounds) {
    const players = extension.state.configuration?.game?.players || [];
    const bonusPot = extension.state.configuration?.game?.bonusPot || 0;
    const state = extension.state.game.start(rounds, players, bonusPot);
    RTSHigherLowerPresentation.resetCards(extension);
    updateBoard(extension, { round: 0, players: state.players });
    await drawCard(extension);
    RTSHigherLowerPersistence.save(extension.state.game);
    return extension.state.game.state();
  }
  function configure(extension, configuration) {
    const value = configuration || {};
    extension.state.configuration = value;
    extension.state.layout = RTSHigherLowerLayout.fromConfiguration(value);
    RTSHigherLowerRecovery.apply(extension, value);
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    panel.show();
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerCardsPresentation.applyLayout(extension);
  }
  async function drawCard(extension) {
    const result = extension.state.game.draw();
    extension.state.card = result.card || null;
    if (!result.card) return result;
    updateBoard(extension, { round: result.round });
    await RTSHigherLowerPresentation.presentDraw(extension, result);
    RTSHigherLowerPersistence.save(extension.state.game);
    if (result.type !== 'first-card') reportResult(extension, result);
    return result;
  }
  function setLayout(extension, value) {
    extension.state.layout = RTSHigherLowerLayout.create(RTSHigherLowerLayout.merge(extension.state.layout, value));
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    panel.show();
    RTSHigherLowerPlayersPresentation.applyLayout(extension);
    RTSHigherLowerCardsPresentation.applyLayout(extension);
    return extension.state.layout;
  }
  function updateBoard(extension, data) {
    extension.state.board = { ...extension.state.board, ...(data || {}) };
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.update(panel, extension.state.board);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    panel.show();
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
  }
  function reportResult(extension, result) {
    RTSOverlaySocket.requestAction('RTS - Overlay - Extension Result', {
      rtsOverlayExtension: manifest.id,
      rtsOverlayEvent: 'higher-lower-result',
      rtsOverlayData: JSON.stringify({ round: result.round, previousCard: result.previous, currentCard: result.card, result: result.result })
    });
  }
  function handleCommand(extension, message) {
    const args = message?.data?.args || message?.args || {};
    if (args.rtsOverlayExtension !== manifest.id) return;
    const command = args.rtsOverlayCommand || args.command;
    const rawData = args.rtsOverlayData || args.data;
    const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
    if (command === 'start') extension.api.startGame(data?.rounds ?? data ?? 10);
    if (command === 'state' || command === 'update') extension.api.updateState(data);
    if (command === 'layout') extension.api.setLayout(data);
    if (command === 'draw') extension.api.drawCard();
    if (command === 'show') extension.api.showCard(data);
    if (command === 'flip') extension.api.flipCard();
    if (command === 'move') extension.api.moveCard(data?.position || data);
  }
  RTS.core.extensions.registerSource(manifest.id, source);
})();
