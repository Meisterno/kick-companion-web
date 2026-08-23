const PUSHER_KEY = '32cbd69e4b950bf97679';
const WS_URL = `wss://ws-us2.pusher.com/app/${PUSHER_KEY}?protocol=7&client=js&version=8.4.0&flash=false`;

export type ChatHandler = (data: any) => void;

export class KickChatClient {
  private ws: WebSocket | null = null;
  private handlers: ChatHandler[] = [];
  private chatroomId: number | null = null;
  private shouldReconnect = true;
  private attempts = 0;
  private pingTimer: any = null;
  public onStatus?: (s: string) => void;

  onMessage(handler: ChatHandler) {
    this.handlers.push(handler);
  }

  connect(chatroomId: number) {
    this.chatroomId = chatroomId;
    this.shouldReconnect = true;
    this.attempts = 0;
    this._connect();
  }

  private _connect() {
    if (this.ws) try { this.ws.close(); } catch {}
    this.onStatus?.('connecting');
    this.ws = new WebSocket(WS_URL);

    this.ws.onopen = () => {
      this.attempts = 0;
      this.onStatus?.('connected');
      this.send({
        event: 'pusher:subscribe',
        data: { auth: '', channel: `chatrooms.${this.chatroomId}.v2` },
      });
      this.pingTimer = setInterval(() => {
        this.send({ event: 'pusher:ping', data: {} });
      }, 25000);
    };

    this.ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.event === 'App\\Events\\ChatMessageEvent' || msg.event === 'App\\Events\\ChatMessageSentEvent') {
          const data = typeof msg.data === 'string' ? JSON.parse(msg.data) : msg.data;
          this.handlers.forEach((h) => h(data));
        }
      } catch {}
    };

    this.ws.onclose = () => {
      clearInterval(this.pingTimer);
      this.onStatus?.('disconnected');
      if (this.shouldReconnect && this.attempts < 8) {
        const delay = Math.min(1000 * 2 ** this.attempts, 12000);
        this.attempts++;
        setTimeout(() => this._connect(), delay);
      }
    };

    this.ws.onerror = () => this.onStatus?.('error');
  }

  private send(obj: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(obj));
    }
  }

  disconnect() {
    this.shouldReconnect = false;
    clearInterval(this.pingTimer);
    try { this.ws?.close(); } catch {}
    this.ws = null;
  }
}
