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
      const duration = RTS.core.ui.number({
        value: defaults.settings.cardAnimation.duration,
        min: 0,
        step: 50
      });
      const easing = RTS.core.ui.dropdown({
        options: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
        value: defaults.settings.cardAnimation.easing
      });
      const status = RTS.core.ui.el('small', {
        className: 'hl-settings-status'
      });

      const apply = configuration => {
        const value = configuration || defaults;
        const gameSettings = value.settings || defaults.settings;
        const animation = gameSettings.cardAnimation || defaults.settings.cardAnimation;
        rounds.value = Number(gameSettings.defaultRounds) || 10;
        length.value = Number(gameSettings.roundLength) === 30000
          ? '30 Seconds'
          : '1 Minute';
        duration.value = Math.max(0, Number(animation.duration) || 500);
        easing.value = animation.easing || 'ease-in-out';
      };

      const save = RTS.core.ui.button('Save Settings', {
        variant: 'blue',
        onClick: () => {
          const configuration = JSON.parse(
            JSON.stringify(RTSHigherLowerConfiguration.current || defaults)
          );

          configuration.settings = {
            defaultRounds: Math.max(1, Number(rounds.value) || 10),
            roundLength: length.value === '30 Seconds' ? 30000 : 60000,
            cardAnimation: {
              duration: Math.max(0, Number(duration.value) || 500),
              easing: easing.value || 'ease-in-out'
            }
          };

          status.textContent = 'Saving...';
          RTSHigherLowerConfiguration.save(configuration);
        }
      });

      section.append(
        RTS.core.ui.field('Default Rounds', rounds),
        RTS.core.ui.field('Round Length', length),
        RTS.core.ui.field('Card Duration', duration),
        RTS.core.ui.field('Card Easing', easing),
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
