const RTSHigherLowerRuntime = (() => {
  const getBrand = configuration => {
    const brands = configuration?.brands || {};
    const name = configuration?.activeBrand || Object.keys(brands)[0] || 'default';
    return brands[name] || configuration?.appearance || {};
  };

  function isGameVisible(game) {
    return game?.active === true || game?.state === 'playing' || game?.state === 'registration';
  }

  function getGameLayoutName(configuration) {
    const value = configuration || {};
    const settings = value.settings || {};
    const layouts = value.layouts || {};
    const game = value.game || {};
    const preferred = isGameVisible(game) ? settings.showingLayout : settings.hiddenLayout;
    return preferred && layouts[preferred] ? preferred : value.activeLayout || Object.keys(layouts)[0] || 'default';
  }

  function getConfiguredLayout(configuration, name) {
    const value = configuration || {};
    const layouts = value.layouts || {};
    const selected = name && layouts[name] ? name : getGameLayoutName(value);
    return RTSHigherLowerLayout.create(layouts[selected] || value.layout);
  }

  function applyDefaults(configuration) {
    const value = { ...(configuration || {}) };
    const settings = value.settings || {};
    const layouts = value.layouts || {};
    const brands = value.brands || {};
    const layoutName = getGameLayoutName(value);
    if (layoutName && layouts[layoutName]) value.activeLayout = layoutName;
    if (settings.defaultBrand && brands[settings.defaultBrand]) value.activeBrand = settings.defaultBrand;
    return value;
  }

  function configure(extension, configuration) {
    const value = applyDefaults(configuration || {});
    RTS.core.log?.info('Higher Lower configure', { state: value.game?.state, active: value.game?.active, activeLayout: value.activeLayout });
    extension.state.configuration = value;
    RTSHigherLowerTimer.stop(extension);

    extension.state.layout = getConfiguredLayout(value, value.settings?.hiddenLayout);
    RTSHigherLowerRecovery.apply(extension, value);
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(value));
    const game = value.game || {};
    if (isGameVisible(game))
      RTSHigherLowerPresentation.show(extension);
    else
      RTSHigherLowerPresentation.hide(extension);
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(value));
    RTSHigherLowerCardsPresentation.applyLayout(extension);

    if (game.state === 'registration') {
      void startRegistration(extension, game.registrationStartedAt || Date.now());
      return;
    }

    if (game.state === 'registration' && game.registrationStartedAt)
      RTSHigherLowerTimer.startRegistration(extension, game.registrationStartedAt);
  }

  async function startRegistration(extension, startedAt) {
    const configuration = extension.state.configuration || {};
    const hiddenLayout = getConfiguredLayout(configuration, configuration.settings?.hiddenLayout);
    const showingLayout = getConfiguredLayout(configuration, configuration.settings?.showingLayout);

    extension.state.layout = hiddenLayout;
    applyLayout(extension);
    RTS.core.log?.info('Higher Lower animating registration layout into view');

    if (JSON.stringify(hiddenLayout) !== JSON.stringify(showingLayout))
      await RTSHigherLowerLayout.transition(extension, hiddenLayout, showingLayout);

    extension.state.layout = showingLayout;
    applyLayout(extension);
    RTSHigherLowerTimer.startRegistration(extension, startedAt);
    RTS.core.log?.info('Higher Lower registration layout visible');
    return true;
  }

  async function startGame(extension, rounds) {
    RTS.core.log?.info('Higher Lower startGame entered', { rounds });
    const configuration = extension.state.configuration || {};
    const showingLayout = getConfiguredLayout(configuration, configuration.settings?.showingLayout);
    const state = extension.state.game.start(
      rounds,
      configuration.game?.players || [],
      configuration.game?.bonusPot || 0
    );
    RTS.core.log?.info('Higher Lower game state started', state);

    configuration.game = state;
    extension.state.configuration = configuration;
    if (configuration.settings?.showingLayout && configuration.layouts?.[configuration.settings.showingLayout])
      configuration.activeLayout = configuration.settings.showingLayout;

    RTSHigherLowerTimer.stop(extension);
    RTSHigherLowerPresentation.resetCards(extension);

    extension.state.layout = showingLayout;
    applyLayout(extension);
    updateBoard(extension, {
      round: 0,
      players: state.players,
      startedPlayers: state.startedPlayers
    });
    await drawCard(extension);
    RTSHigherLowerPersistence.save(extension.state.game);
    RTS.core.log?.info('Higher Lower startGame completed');
    return extension.state.game.state();
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
    if (result.type !== 'first-card') RTSHigherLowerCommands.reportResult(extension, result);
    return result;
  }

  function applyLayout(extension) {
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(extension.state.configuration));
    if (isGameVisible(extension.state.configuration?.game))
      RTSHigherLowerPresentation.show(extension);
    else
      RTSHigherLowerPresentation.hide(extension);
    RTSHigherLowerPlayersPresentation.applyLayout(extension);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(extension.state.configuration));
    RTSHigherLowerCardsPresentation.applyLayout(extension);
  }

  function setLayout(extension, value) {
    let layoutName = null;
    let layoutValue = value;
    if (typeof value === 'string') {
      layoutName = value.trim();
      layoutValue = extension.state.configuration?.layouts?.[layoutName];
      if (!layoutValue) return extension.state.layout;
    }
    const from = RTSHigherLowerLayout.clone(extension.state.layout);
    const to = RTSHigherLowerLayout.create(RTSHigherLowerLayout.merge(extension.state.layout, layoutValue));
    extension.state.layout = to;
    if (layoutName && extension.state.configuration) extension.state.configuration.activeLayout = layoutName;
    RTSHigherLowerLayout.transition(extension, from, to, () => applyLayout(extension));
    return to;
  }

  function updateBoard(extension, data) {
    extension.state.board = { ...extension.state.board, ...(data || {}) };
    const panel = RTSHigherLowerPresentation.getPanel(extension);
    RTSHigherLowerBoard.update(panel, extension.state.board);
    RTSHigherLowerBoard.applyLayout(panel, extension.state.layout);
    RTSHigherLowerBoard.applyAppearance(panel, getBrand(extension.state.configuration));
    RTSHigherLowerPresentation.show(extension);
    RTSHigherLowerPlayersPresentation.update(extension, extension.state.board);
    RTSHigherLowerPlayers.applyAppearance(RTSHigherLowerPlayersPresentation.getPanel(extension), getBrand(extension.state.configuration));
  }

  return { configure, startRegistration, startGame, resetGame, drawCard, setLayout, updateBoard };
})();
