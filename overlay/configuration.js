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
      if (!Configuration.apply(configuration)) return false;
      return RTSOverlaySocket.requestAction(
        'RTS - Higher Lower Game - Core',
        {
          rtsHigherLowerOperation: 'save',
          rtsHigherLowerConfiguration: JSON.stringify(configuration)
        }
      );
    },

    getLayouts() {
      return { ...(Configuration.current?.layouts || {}) };
    },

    getActiveLayoutName() {
      return Configuration.current?.activeLayout || 'default';
    },

    saveLayout(layout, name = Configuration.getActiveLayoutName()) {
      const configuration = JSON.parse(JSON.stringify(
        Configuration.current || { settings: {}, game: {} }
      ));
      const layoutName = String(name || '').trim();
      if (!layoutName) return false;

      configuration.layouts = {
        ...(configuration.layouts || {}),
        [layoutName]: JSON.parse(JSON.stringify(layout))
      };
      configuration.activeLayout = layoutName;
      delete configuration.layout;
      return Configuration.save(configuration);
    },

    createLayout(layout, name) {
      const layoutName = String(name || '').trim();
      if (!layoutName || Configuration.current?.layouts?.[layoutName])
        return false;

      return Configuration.saveLayout(layout, layoutName);
    },

    activateLayout(name) {
      const layoutName = String(name || '').trim();
      if (!layoutName || !Configuration.current?.layouts?.[layoutName])
        return false;

      const configuration = JSON.parse(JSON.stringify(Configuration.current));
      configuration.activeLayout = layoutName;
      return Configuration.save(configuration);
    },

    deleteLayout(name) {
      const layoutName = String(name || '').trim();
      const layouts = Configuration.current?.layouts || {};
      const names = Object.keys(layouts);
      if (!layoutName || !layouts[layoutName] || names.length <= 1)
        return false;

      const configuration = JSON.parse(JSON.stringify(Configuration.current));
      delete configuration.layouts[layoutName];
      if (configuration.activeLayout === layoutName)
        configuration.activeLayout = Object.keys(configuration.layouts)[0];
      return Configuration.save(configuration);
    },

    getBrands() {
      return { ...(Configuration.current?.brands || {}) };
    },

    getActiveBrandName() {
      return Configuration.current?.activeBrand || 'default';
    },

    saveBrand(brand, name = Configuration.getActiveBrandName()) {
      const configuration = JSON.parse(JSON.stringify(
        Configuration.current || { settings: {}, game: {} }
      ));
      const brandName = String(name || '').trim();
      if (!brandName) return false;

      configuration.brands = {
        ...(configuration.brands || {}),
        [brandName]: JSON.parse(JSON.stringify(brand))
      };
      configuration.activeBrand = brandName;
      delete configuration.appearance;
      return Configuration.save(configuration);
    },

    createBrand(brand, name) {
      const brandName = String(name || '').trim();
      if (!brandName || Configuration.current?.brands?.[brandName])
        return false;

      return Configuration.saveBrand(brand, brandName);
    },

    activateBrand(name) {
      const brandName = String(name || '').trim();
      if (!brandName || !Configuration.current?.brands?.[brandName])
        return false;

      const configuration = JSON.parse(JSON.stringify(Configuration.current));
      configuration.activeBrand = brandName;
      return Configuration.save(configuration);
    },

    deleteBrand(name) {
      const brandName = String(name || '').trim();
      const brands = Configuration.current?.brands || {};
      const names = Object.keys(brands);
      if (!brandName || !brands[brandName] || names.length <= 1)
        return false;

      const configuration = JSON.parse(JSON.stringify(Configuration.current));
      delete configuration.brands[brandName];
      if (configuration.activeBrand === brandName)
        configuration.activeBrand = Object.keys(configuration.brands)[0];
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

  RTSOverlaySocket.onConnect(() => Configuration.request());

  window.RTSHigherLowerConfiguration = Configuration;
})();
