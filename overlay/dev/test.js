(() => {
  const extension = RTS.getExtension('rts-higher-lower');
  const host = document.getElementById('extension-tools');
  if (!extension || !host) return;

  const state = {
    round: 4,
    players: [
      { name: 'DuhBuhHuh', vote: 'Higher', bet: 5000 },
      { name: 'Johnny', vote: 'Lower', bet: 1000 },
      { name: 'Dawn', vote: 'Lower', status: 'BANK', bet: 0 },
      { name: 'JayGeeX', vote: 'Higher', bet: 2000 },
      { name: 'Bobby', vote: 'Higher', bet: 2000 }
    ],
    roundTotal: 10000,
    potTotal: 28000
  };

  const section = document.createElement('section');
  section.className = 'extension-dev-tools';
  section.innerHTML =
    '<strong>RTS Higher Lower</strong>' +
    '<div class="actions">' +
      '<button data-action="state">Show Test State</button>' +
      '<button data-action="start">Start Game</button>' +
      '<button data-action="draw">Draw Card</button>' +
      '<button data-action="reset">Reset Layout</button>' +
    '</div>' +
    '<div class="hl-layout-editor">' +
      '<label>Target <select id="hl-layout-target"></select></label>' +
      '<div class="hl-layout-fields"></div>' +
    '</div>';

  host.appendChild(section);

  const target = section.querySelector('#hl-layout-target');
  const fields = section.querySelector('.hl-layout-fields');
  let layout = extension.api.getLayout();

  const targets = [
    ['board', 'Board'],
    ...Object.keys(layout.elements).map(key => [key, key])
  ];

  targets.forEach(([key, label]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = label;
    target.appendChild(option);
  });

  function current() {
    return target.value === 'board'
      ? layout.board
      : layout.elements[target.value];
  }

  function renderFields() {
    fields.replaceChildren();
    const value = current();
    const keys = target.value === 'board'
      ? ['x', 'y', 'width', 'height', 'scale']
      : ['x', 'y', 'width', 'height'];

    keys.forEach(key => {
      const label = document.createElement('label');
      label.textContent = key.toUpperCase();
      const input = document.createElement('input');
      input.type = 'number';
      input.value = value[key];
      input.dataset.key = key;
      input.addEventListener('input', () => {
        const next = Number(input.value);
        if (!Number.isFinite(next)) return;
        const nextLayout = RTSHigherLowerLayout.create(layout);
        nextLayout[target.value === 'board' ? 'board' : 'elements'][target.value === 'board' ? key : target.value][key] = next;
        layout = extension.api.setLayout(nextLayout);
      });
      label.appendChild(input);
      fields.appendChild(label);
    });
  }

  function saveLayout() {
    localStorage.setItem(
      'rts-higher-lower-layout',
      JSON.stringify(layout)
    );
  }

  target.addEventListener('change', renderFields);

  section.addEventListener('input', saveLayout);

  section.addEventListener('click', async event => {
    const action = event.target?.dataset?.action;
    if (!action) return;

    try {
      if (action === 'state')
        extension.api.updateState(state);
      if (action === 'start')
        extension.api.startGame(10);
      if (action === 'draw')
        await extension.api.drawCard();
      if (action === 'reset') {
        layout = RTSHigherLowerLayout.create();
        layout = extension.api.setLayout(layout);
        localStorage.removeItem('rts-higher-lower-layout');
        renderFields();
      }
    } catch (error) {
      document.getElementById('log').textContent = error.message;
    }
  });

  try {
    const saved = JSON.parse(
      localStorage.getItem('rts-higher-lower-layout') || 'null'
    );
    if (saved) layout = extension.api.setLayout(saved);
  } catch (error) {
    document.getElementById('log').textContent = error.message;
  }

  renderFields();
})();
