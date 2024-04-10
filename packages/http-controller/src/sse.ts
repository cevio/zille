import { Context } from "koa";
import { Transform, TransformCallback } from 'node:stream';
import { Response } from "./response";

export class SSE extends Transform {
  private id = 0;
  private _closed = false;
  constructor(private readonly res: Response) {
    super({ writableObjectMode: true });
    res.set("Content-Type", "text/event-stream");
    res.set("Cache-Control", "no-cache, no-transform");
    res.set("Connection", "keep-alive");
  }

  public send(event: string, data: any) {
    if (!this._closed) {
      let id = this.id++;
      if (id >= Number.MAX_SAFE_INTEGER) {
        id = this.id = 0;
      }
      this.write(`id: ${id}\nevent: ${event}\ndata: ${formatSseData(data)}\n\n`);
    }
  }

  public render(ctx: Context) {
    ctx.req.socket.setTimeout(0);
    ctx.req.socket.setNoDelay(true);
    ctx.req.socket.setKeepAlive(true);
    const timer = setInterval(() => this.send('heartbeat', Date.now() + ''), 1000);
    ctx.req.on('close', () => this.res.emit('close'));
    this.res.on('sse', (event: string, data: any) => this.send(event, data));
    this.res.on('close', () => {
      if (this._closed) return;
      this.send('close', '{}');
      this.unpipe();
      this.destroy();
      ctx.res.end();
      ctx.socket.destroy();
      clearInterval(timer);
      this._closed = true;
    });
  }

  public _transform(data: any, _: string, cb: TransformCallback): void {
    this.push(data);
    return cb();
  }
}

function formatSseData(data: any) {
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
}