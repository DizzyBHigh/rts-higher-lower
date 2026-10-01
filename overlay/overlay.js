const RTS_OVERLAY = {
  host: '127.0.0.1',
  port: 8080,
  eventName: null,
  reconnectDelay: 3000
};

let rtsSocket;
let reconnectTimer;

function rtsSetStatus(connected) {
  document.documentElement.dataset.rtsConnected = connected ? 'true' : 'false';
}

function rtsHandleEvent(message) {
  if (message?.event?.source !== 'Custom' || message?.event?.type !== 'Event') return;

  const data = message.data;
  if (!data?.eventName || !data.args) return;
  if (RTS_OVERLAY.eventName && data.eventName !== RTS_OVERLAY.eventName) return;

  if (typeof window.rtsOnEvent === 'function') {
    window.rtsOnEvent(data.eventName, data.args, message);
  }
}

function rtsConnect() {
  clearTimeout(reconnectTimer);
  rtsSocket = new WebSocket(`ws://${RTS_OVERLAY.host}:${RTS_OVERLAY.port}/`);

  rtsSocket.onopen = () => {
    rtsSocket.send(JSON.stringify({
      request: 'Subscribe',
      id: 'rts-overlay',
      events: { Custom: ['Event'] }
    }));
    rtsSetStatus(true);
    if (typeof window.rtsOnConnect === 'function') window.rtsOnConnect();
  };

  rtsSocket.onmessage = event => {
    try {
      rtsHandleEvent(JSON.parse(event.data));
    } catch (error) {
      console.warn('Invalid Streamer.bot WebSocket message', error);
    }
  };

  rtsSocket.onerror = () => rtsSetStatus(false);
  rtsSocket.onclose = () => {
    rtsSetStatus(false);
    if (typeof window.rtsOnDisconnect === 'function') window.rtsOnDisconnect();
    reconnectTimer = setTimeout(rtsConnect, RTS_OVERLAY.reconnectDelay);
  };

  window.rtsSocket = rtsSocket;
}

window.rtsOverlay = RTS_OVERLAY;
window.rtsConnect = rtsConnect;
rtsConnect();
