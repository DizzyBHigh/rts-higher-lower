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
      extension.api.resetGame = () => resetGame(extension);
      RTS.core.events?.on('RTS - Overlay - Extension Command', message => handleCommand(extension, message));
    }
  };

  const getBrand = configuration => {
    const brands = configuration?.brands || {};
    const name = configuration?.activeBrand || Object.keys(brands)[0] || 'default';
    return brands[name] || configuration?.appearance || {};
  };

  function applyDefaults(configuration) {
    const value = { ...(configuration || {}) };
    const settings = value.settings || {};
    const layouts = value.layouts || {};
    const brands = value.brands || {};
    if (settings.defaultLayout && layouts[settings.defaultLayout]) value.activeLayout = settings.defaultLayout;
    if (settings.defaultBrand && brands[settings.defaultBrand]) value.activeBrand = settings.defaultBrand;
    return value;
  }

  async function startGame(extension, rounds) {
    if (extension.state.configuration)
      configure(extension, applyDefaults(extension.state.configuration));
    const players = extension.state.configuration?.game?.players || [];
    const bonusPot = extension.state.configuration?.game?.bonusPot || 0;
    const state = extension.state.game.start(rounds, players, bonusPot);
    RTSHigherLowerTimer.stop(extension);
    RTSHigherLowerPresentation.resetCards(extension);
    RTSHigherLowerPresentation.show(extension);
    updateBoard(extension, { round: 0, players: state.players, startedPlayers: state.startedPlayers });
    await drawCard(extension);
    RTSHigherLowerPersistence.save(extension.state.game);
    return extension.state.game.state();
  }

  function configure(extension, configuration) {
    const value = configuration || {};
    extension.state.configuration = value;
    RTSHigherLowerTimer.stop(extension);
    extension.state.layout = RTSHigherLowerLayout.fromConfiguration(value);
    RTSHigherLowerRecovery.apply(extension, value);
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(value));
    const game = value.game || {};
    if (game.state === 'playing') RTSHigherLowerPresentation.show(extension);
    else RTSHigherLowerPresentation.hide(extension);
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(value));
    RTSHigherLowerCardsPresentation.applyLayout(extension);
    if (game.state === 'registration' && game.registrationStartedAt)
      RTSHigherLowerTimer.startRegistration(extension, game.registrationStartedAt);
  }

  function resetGame(extension) {
    RTSHigherLowerTimer.stop(extension);
    extension.state.game.reset();
    extension.state.card = null;
    RTSHigherLowerPresentation.resetCards(extension);
    updateBoard(extension, { round: 0, players: [], roundTotal: 0, potTotal: 0, startedPlayers: 0 });
    RTSHigherLowerPresentation.hide(extension);
    return true;
  }

  async function drawCard(extension) {
    const result = extension.state.game.draw();
    extension.state.card = result.card || null;
    if (!result.card) { RTSHigherLowerTimer.stop(extension); return result; }
    updateBoard(extension, { round: result.round });
    await RTSHigherLowerPresentation.presentDraw(extension, result);
    RTSHigherLowerTimer.start(extension);
    RTSHigherLowerPersistence.save(extension.state.game);
    if (result.type !== 'first-card') reportResult(extension, result);
    return result;
  }

  function setLayout(extension, value) {
    let layoutName = null;
    let layoutValue = value;
    if (typeof value === 'string') {
      layoutName = value.trim();
      layoutValue = extension.state.configuration?.layouts?.[layoutName];
      if (!layoutValue) return extension.state.layout;
    }
    return RTSHigherLowerLayout.transition(extension, () => {
      extension.state.layout = RTSHigherLowerLayout.create(
        RTSHigherLowerLayout.merge(extension.state.layout, layoutValue)
      );
      if (layoutName && extension.state.configuration)
        extension.state.configuration.activeLayout = layoutName;
      const panel = RTSHigherLowerPresentation.getPanel(extension);
      RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
      RTSHigherLowerBoard.applyAppearance(panel, getBrand(extension.state.configuration));
      panel.show();
      RTSHigherLowerPlayersPresentation.applyLayout(extension);
      RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(extension.state.configuration));
      RTSHigherLowerCardsPresentation.applyLayout(extension);
      return extension.state.layout;
    });
  }

  function updateBoard(extension, data) {
    extension.state.board = { ...extension.state.board, ...(data || {}) };
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.update(panel, extension.state.board);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(extension.state.configuration));
    if (extension.state.configuration?.game?.state === 'playing')
      RTSHigherLowerPresentation.show(extension);
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(extension.state.configuration));
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
    if (command === 'registration') {
      const startedAt = data?.startedAt ?? data ?? Date.now();
      RTSHigherLowerPresentation.hide(extension);
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

  RTS.core.extensions.registerSource(manifest.id, source);
})();
