(() => {
  const source = {
    init(extension) {
      RTSHigherLowerRuntime.init(extension);
      RTS.core.events?.on('RTS - Overlay - Extension Command', message =>
        RTSHigherLowerRuntime.handleCommand(extension, message)
      );
    }
  };

  RTS.core.extensions.registerSource(RTSHigherLowerRuntime.manifest.id, source);
})();
