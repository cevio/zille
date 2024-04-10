import { Context } from "koa";
import { Stream } from "node:stream";
import { SetOption } from 'cookies';
import { EventEmitter } from 'node:events';
import { clearInterval } from "node:timers";
import { SSE } from "./sse";

export class Response extends EventEmitter {
  public redirect_url: string;
  public type: string;
  public data: any;
  public readonly headers = new Map<string, string | number | boolean>();
  public readonly cookies = new Map<string, [string | number | boolean, SetOption]>();

  constructor(public status = 200) {
    super();
    this.setMaxListeners(+Infinity);
  }

  public setStatus(i: number) {
    this.status = i;
    return this;
  }

  public set(key: string, value: string | number | boolean) {
    this.headers.set(key, value);
    return this;
  }

  public cookie(key: string, value: string | number | boolean, options: SetOption) {
    this.cookies.set(key, [value, options]);
    return this;
  }

  public redirect(url: string) {
    this.redirect_url = url;
    return this;
  }

  public setType(type: string) {
    this.type = type;
    return this;
  }

  public setData(data: any) {
    this.data = data;
    return this;
  }

  public render(ctx: Context) {
    ctx.status = this.status;
    this.emit('render', ctx);
    if (this.headers.size) {
      const out: Record<string, string> = {}
      for (const [key, value] of this.headers.entries()) {
        out[key] = value.toString();
      }
      ctx.set(out);
    }
    if (this.cookies.size) {
      for (const [key, [value, options]] of this.cookies.entries()) {
        ctx.cookies.set(key, value.toString(), options);
      }
    }
    if (this.redirect_url) {
      ctx.redirect(this.redirect_url);
    }
    if (this.type) {
      ctx.type = this.type;
    }
    if (this.data !== undefined) {
      ctx.body = this.data;
    }
    return this;
  }

  static redirect(url: string, status?: number) {
    const res = new Response(status || 301);
    res.redirect(url);
    return res;
  }

  static html(data: string) {
    const res = new Response();
    res.type = '.html';
    res.data = data;
    return res;
  }

  static json(data: any) {
    const res = new Response();
    res.type = '.json';
    res.data = data;
    return res;
  }

  static buffer(data: Buffer | ArrayBuffer) {
    const res = new Response();
    res.data = data;
    return res;
  }

  static stream(data: Stream) {
    const res = new Response();
    res.data = data;
    return res;
  }

  static null(status?: number) {
    const res = new Response(status);
    res.data = null;
    return res;
  }

  static empty(status?: number) {
    const res = new Response(status);
    res.data = undefined;
    return res;
  }

  /**
   * SSE响应
   * 事件：
   * 1. sse: (event: string, data: any) => void 发送数据
   * 2. close: () => void 关闭链接
   * @param status 
   * @returns 
   */
  static sse(status?: number) {
    const res = new Response(status);
    const sse = new SSE(res);
    res.on('render', (ctx: Context) => sse.render(ctx));
    res.data = sse;
    return res;
  }
}

function formatSseData(data: any) {
  if (typeof data === 'string') return data;
  return JSON.stringify(data);
}