(() => {
  const DEFAULT_LENGTH = 60000;
  let interval = null;
  let deadline = 0;

  function getElement(extension) {
    return extension?.state?.panel?.element?.querySelector('.hl-board__round-timer');
  }

  function format(remaining) {
    const seconds = Math.ceil(Math.max(0, remaining) / 1000);
    const minutes = Math.floor(seconds / 60);
    const value = seconds % 60;
    return String(minutes).padStart(2, '0') + ':' + String(value).padStart(2, '0');
  }

  function render(extension, remaining) {
    const element = getElement(extension);
    if (element) element.textContent = format(remaining);
  }

  function stop(extension, remaining = 0) {
    if (interval) clearInterval(interval);
    interval = null;
    deadline = 0;
    render(extension, remaining);
  }

  function run(extension, endTime, onComplete) {
    if (interval) clearInterval(interval);
    deadline = endTime;
    const tick = () => {
      const remaining = Math.max(0, deadline - Date.now());
      render(extension, remaining);
      if (!remaining) {
        clearInterval(interval);
        interval = null;
        deadline = 0;
        RTS.core.log?.info('Higher Lower timer completed');
        if (onComplete) onComplete();
      }
    };
    tick();
    if (deadline) interval = setInterval(tick, 100);
  }

  function start(extension) {
    const length = Math.max(
      1000,
      Number(extension?.state?.configuration?.settings?.roundLength) || DEFAULT_LENGTH
    );
    RTS.core.log?.info('Higher Lower round timer started', { length });
    run(extension, Date.now() + length);
  }

  function startRegistration(extension, startedAt) {
    const length = Math.max(
      1000,
      Number(extension?.state?.configuration?.settings?.roundLength) || DEFAULT_LENGTH
    );
    const startTime = Number(startedAt) || Date.now();
    RTS.core.log?.info('Higher Lower registration timer started', { startTime, length });
    run(extension, startTime + length, () => {
      RTS.core.log?.info('Higher Lower registration ended; requesting begin');
      RTSOverlaySocket.requestAction('RTS - Higher Lower Game - Core', {
        rtsHigherLowerOperation: 'begin'
      });
    });
  }

  window.RTSHigherLowerTimer = { start, startRegistration, stop, format };
})();
