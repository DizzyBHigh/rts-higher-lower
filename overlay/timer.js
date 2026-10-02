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

  function start(extension) {
    const length = Math.max(
      1000,
      Number(extension?.state?.configuration?.settings?.roundLength) || DEFAULT_LENGTH
    );

    if (interval) clearInterval(interval);
    deadline = Date.now() + length;
    render(extension, length);

    interval = setInterval(() => {
      const remaining = Math.max(0, deadline - Date.now());
      render(extension, remaining);
      if (!remaining) {
        clearInterval(interval);
        interval = null;
      }
    }, 100);
  }

  window.RTSHigherLowerTimer = { start, stop, format };
})();
