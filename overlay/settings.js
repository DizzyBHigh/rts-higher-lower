(() => {
  const defaults = {
    settings: {
      defaultRounds: 10,
      roundLength: 60000,
      cardAnimation: {
        duration: 500,
        easing: 'ease-in-out'
      }
    }
  };

  const Settings = {
    render(host) {
      if (!host || !RTS.core.ui) return null;

      const overlay = RTS.core.ui.section('Overlay Settings');
      const duration = RTS.core.ui.number({
        value: 500, min: 0, step: 50
      });
      const easing = RTS.core.ui.dropdown({
        options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
        value: 'ease-in-out'
      });
      const status = RTS.core.ui.el('small', {
        className: 'hl-settings-status'
      });

      const apply = configuration => {
        const value = configuration || defaults;
        const gameSettings = value.settings || defaults.settings;
        const animation = gameSettings.cardAnimation ||
          defaults.settings.cardAnimation;
        duration.value = Math.max(0, Number(animation.duration) || 500);
        easing.value = animation.easing || 'ease-in-out';
      };

      const save = RTS.core.ui.button('Save Settings', {
        variant: 'blue',
        onClick: () => {
          const configuration = JSON.parse(JSON.stringify(
            RTSHigherLowerConfiguration.current || defaults
          ));
          configuration.settings = {
            ...(configuration.settings || {}),
            cardAnimation: {
              duration: Math.max(0, Number(duration.value) || 500),
              easing: easing.value || 'ease-in-out'
            }
          };
          status.textContent = 'Saving...';
          RTSHigherLowerConfiguration.save(configuration);
        }
      });

      overlay.append(
        RTS.core.ui.field('Card Duration', duration),
        RTS.core.ui.field('Card Easing', easing),
        save,
        status
      );
      host.append(overlay);

      RTSHigherLowerConfiguration.onChange(configuration => {
        apply(configuration);
        status.textContent = 'Saved.';
      });

      apply(RTSHigherLowerConfiguration.current || defaults);
      RTSHigherLowerConfiguration.request();
      return { apply };
    }
  };

  window.RTSHigherLowerSettings = Settings;
})();
