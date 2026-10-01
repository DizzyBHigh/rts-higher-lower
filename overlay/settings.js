(() => {
  const Settings = {
    defaults: { noOfRounds: 10, roundLength: 60000 },

    render(host) {
      if (!host || !RTS.core.ui) return null;

      const section = RTS.core.ui.section('Game Settings');
      const rounds = RTS.core.ui.number({
        value: Settings.defaults.noOfRounds,
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

      const save = RTS.core.ui.button('Save Settings', {
        variant: 'blue',
        onClick: () => {
          const data = {
            noOfRounds: Math.max(1, Number(rounds.value) || 10),
            roundLength: length.value === '30 Seconds' ? 30000 : 60000
          };
          RTSOverlaySocket.requestAction('RTS - Higher Lower - Settings', {
            rtsHigherLowerSettingsOperation: 'save',
            rtsHigherLowerSettings: JSON.stringify(data)
          });
          status.textContent = 'Saving...';
        }
      });

      section.append(
        RTS.core.ui.field('Default Rounds', rounds),
        RTS.core.ui.field('Round Length', length),
        save,
        status
      );
      host.append(section);

      const apply = data => {
        const value = data || Settings.defaults;
        rounds.value = Number(value.noOfRounds) || 10;
        length.value = Number(value.roundLength) === 30000
          ? '30 Seconds'
          : '1 Minute';
      };

      RTSOverlaySocket.onEvent(message => {
        const args = message?.data?.args || message?.args || {};
        if (args.rtsOverlayExtension !== 'rts-higher-lower') return;
        if ((args.rtsOverlayCommand || args.command) !== 'settings') return;

        try {
          const raw = args.rtsOverlayData || args.data;
          apply(typeof raw === 'string' ? JSON.parse(raw) : raw);
          status.textContent = 'Saved.';
        } catch (error) {
          status.textContent = error.message;
        }
      });

      RTSOverlaySocket.requestAction(
        'RTS - Higher Lower - Settings',
        { rtsHigherLowerSettingsOperation: 'get' }
      );

      return { apply };
    }
  };

  window.RTSHigherLowerSettings = Settings;
})();
