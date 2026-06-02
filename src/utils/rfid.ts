// WebSerial ベースの RFID リーダー管理
// Arduino (atom_rfid.ino) から JSON を受信: {"type":"rfid","piece":"piece_1","uid":"..."}

// Web Serial API 型宣言（Chrome/Edge のみ対応、TS DOM lib 未収録）
interface BuccaSerialPort {
  readonly readable: ReadableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
}
interface BuccaSerial {
  requestPort(): Promise<BuccaSerialPort>;
}
declare global {
  interface Navigator {
    readonly serial: BuccaSerial;
  }
}

type ScanHandler = (piece: string) => void;

class RfidManager {
  private port: BuccaSerialPort | null = null;
  private activeReader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private readonly handlers = new Set<ScanHandler>();

  get isConnected(): boolean {
    return this.port !== null;
  }

  isSupported(): boolean {
    return 'serial' in navigator;
  }

  async connect(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      this.port = await navigator.serial.requestPort();
      await this.port.open({ baudRate: 115200 });
      void this.startReading();
      return true;
    } catch {
      this.port = null;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    try { await this.activeReader?.cancel(); } catch { /* ignore */ }
    this.activeReader = null;
    const port = this.port;
    this.port = null;
    try { await port?.close(); } catch { /* ignore */ }
  }

  // スキャンイベントを購読する。戻り値を呼ぶと購読解除。
  onScan(handler: ScanHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  private async startReading(): Promise<void> {
    if (!this.port?.readable) return;
    const decoder = new TextDecoder();
    const reader = this.port.readable.getReader();
    this.activeReader = reader;
    let buffer = '';
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const msg = JSON.parse(trimmed) as { type?: string; piece?: string };
            if (msg.type === 'rfid' && msg.piece) {
              const p = msg.piece;
              this.handlers.forEach(h => h(p));
            }
          } catch { /* JSON以外の行はスキップ */ }
        }
      }
    } catch { /* ポートクローズまたはキャンセル */ } finally {
      reader.releaseLock();
      this.activeReader = null;
      this.port = null;
    }
  }
}

export const rfidManager = new RfidManager();
