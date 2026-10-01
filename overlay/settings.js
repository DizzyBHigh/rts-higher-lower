(() => {
  const defaults = {
    settings: {
      defaultRounds: 10,
      roundLength: 60000
    }
  };

  const Settings = {
    render(host) {
      if (!host || !RTS.core.ui) return null;

      const section = RTS.core.ui.section('Game Settings');
      const rounds = RTS.core.ui.number({
        value: defaults.settings.defaultRounds,
        min: 1,
        step: 1
      });
      const length = RTS.core.ui.dropdown({
        options: ['1 Minute', '30 Seconds'],
        value: '1 Minute'
      });
      const status = RTS.core.ui.el('small', {
        className: 'hl-settings-status'
      });

      const apply = configuration => {
        const value = configuration || defaults;
        const gameSettings = value.settings || defaults.settings;
        rounds.value = Number(gameSettings.defaultRounds) || 10;
        length.value = Number(gameSettings.roundLength) === 30000
          ? '30 Seconds'
          : '1 Minute';
      };

      const save = RTS.core.ui.button('Save Settings', {
        variant: 'blue',
        onClick: () => {
          const configuration = JSON.parse(
            JSON.stringify(RTSHigherLowerConfiguration.current || defaults)
          );

          configuration.settings = {
            defaultRounds: Math.max(1, Number(rounds.value) || 10),
            roundLength: length.value === '30 Seconds' ? 30000 : 60000
          };

          status.textContent = 'Saving...';
          RTSHigherLowerConfiguration.save(configuration);
        }
      });

      section.append(
        RTS.core.ui.field('Default Rounds', rounds),
        RTS.core.ui.field('Round Length', length),
        save,
        status
      );
      host.append(section);

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
