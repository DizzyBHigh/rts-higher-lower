(() => {
  const Configuration = {
    current: null,
    listeners: [],

    apply(configuration) {
      if (!configuration || typeof configuration !== 'object') return false;

      Configuration.current = configuration;
      const extension = RTS.getExtension('rts-higher-lower');

      if (extension?.configure)
        extension.configure(configuration);

      Configuration.listeners.forEach(listener => listener(configuration));
      return true;
    },

    onChange(listener) {
      if (typeof listener === 'function')
        Configuration.listeners.push(listener);
    },

    request() {
      return RTSOverlaySocket.requestAction(
        'RTS - Higher Lower Game - Core',
        { rtsHigherLowerOperation: 'get' }
      );
    },

    save(configuration) {
      Configuration.current = configuration;
      return RTSOverlaySocket.requestAction(
        'RTS - Higher Lower Game - Core',
        {
          rtsHigherLowerOperation: 'save',
          rtsHigherLowerConfiguration: JSON.stringify(configuration)
        }
      );
    },

    saveLayout(layout) {
      const configuration = JSON.parse(JSON.stringify(
        Configuration.current || { settings: {}, game: {} }
      ));
      const value = JSON.parse(JSON.stringify(layout));
      configuration.layouts = {
        ...(configuration.layouts || {}),
        default: value
      };
      configuration.activeLayout = 'default';
      delete configuration.layout;
      return Configuration.save(configuration);
    }
  };

  RTSOverlaySocket.onEvent(message => {
    const eventName =
      message?.data?.eventName ?? message?.eventName;

    if (eventName !== 'RTS - Higher Lower Game') return;

    const raw =
      message?.data?.args?.rtsHigherLowerConfiguration ??
      message?.args?.rtsHigherLowerConfiguration;

    try {
      Configuration.apply(
        typeof raw === 'string' ? JSON.parse(raw) : raw
      );
    } catch (error) {
      console.warn('RTS Higher Lower: configuration error', error);
    }
  });

  window.RTSHigherLowerConfiguration = Configuration;
})();
