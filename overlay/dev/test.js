(() => {
  const extension = RTS.getExtension('rts-higher-lower');
  const host = document.getElementById('extension-tools');
  if (!extension || !host || !RTS.core.ui) return;

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
    '</div>';
  host.appendChild(section);

  const editor = document.createElement('div');
  editor.className = 'hl-layout-editor';
  section.appendChild(editor);

  const target = RTS.core.ui.positionSelector({
    options: ['board', ...Object.keys(extension.api.getLayout().elements)],
    value: 'board'
  });
  editor.append(RTS.core.ui.field('Target', target));

  let layout = extension.api.getLayout();

  const getValue = () =>
    target.value === 'board' ? layout.board : layout.elements[target.value];

  const apply = (patch) => {
    const next = RTSHigherLowerLayout.create(layout);
    const item = target.value === 'board'
      ? next.board
      : next.elements[target.value];
    Object.assign(item, patch);
    layout = extension.api.setLayout(next);
    saveLayout();
    render();
  };

  const render = () => {
    editor.querySelectorAll('.hl-shared-fields').forEach(node => node.remove());
    const value = getValue();
    const fields = document.createElement('div');
    fields.className = 'hl-shared-fields';

    const position = RTS.core.ui.positionEditor({
      fields: target.value === 'board' ? ['x', 'y', 'scale'] : ['x', 'y'],
      value,
      onChange: next => apply(next)
    });
    fields.append(RTS.core.ui.field('Position', position));

    const ratio = RTS.core.ui.aspectRatio({
      width: value.width,
      height: value.height,
      onChange: (width, height) => apply({ width, height })
    });
    fields.append(RTS.core.ui.field('Size', ratio));

    editor.appendChild(fields);
  };

  const saveLayout = () => localStorage.setItem(
    'rts-higher-lower-layout',
    JSON.stringify(layout)
  );

  target.addEventListener('change', render);

  section.addEventListener('click', async event => {
    const action = event.target?.dataset?.action;
    if (!action) return;
    try {
      if (action === 'state') extension.api.updateState(state);
      if (action === 'start') extension.api.startGame(10);
      if (action === 'draw') await extension.api.drawCard();
      if (action === 'reset') {
        layout = RTSHigherLowerLayout.create();
        layout = extension.api.setLayout(layout);
        localStorage.removeItem('rts-higher-lower-layout');
        render();
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

  render();
})();
