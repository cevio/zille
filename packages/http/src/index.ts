import Koa, { Context, Next } from 'koa';
import FindMyWay, { Instance } from './server';
import { randomBytes } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { Application } from "@zille/application";
import { Configurator } from '@zille/configurator';
import { HttpProps } from './types';
import { HttpMiddlewares } from './middleware';
import { createContext } from '@zille/service';

export * from './middleware';
export * from './server';
export * from './types';

declare module 'koa' {
  interface BaseContext {
    __SERVICE_STORAGE__: ReturnType<typeof createContext>,
  }
}

@Application.Injectable()
export class Http extends Application {
  static readonly namespace = Symbol('HTTP');

  @Application.Inject(Configurator)
  private readonly configure: Configurator;

  @Application.Inject(HttpMiddlewares)
  private readonly middlewares: HttpMiddlewares;

  public koa: Koa;
  public app: Instance;
  public server: Server;
  public keys: string[];
  public port: number;

  public async setup() {
    if (!this.configure.has(Http.namespace)) {
      throw new Error('Missing configuration parameters for HTTP service startup');
    }
    const props = this.configure.get<HttpProps>(Http.namespace);
    const koa = new Koa();
    const keys = koa.keys = props.keys ? props.keys : [randomBytes(32).toString(), randomBytes(64).toString()];
    const app = FindMyWay({
      ignoreDuplicateSlashes: props.ignoreDuplicateSlashes ?? true,
      ignoreTrailingSlash: props.ignoreTrailingSlash ?? true,
      maxParamLength: props.maxParamLength ?? +Infinity,
      allowUnsafeRegex: props.allowUnsafeRegex ?? true,
      caseSensitive: props.caseSensitive ?? true,
      // @ts-ignore
      defaultRoute: async (ctx: Context, next: Next) => await next(),
    })
    koa.use(async (ctx, next) => {
      ctx.__SERVICE_STORAGE__ = createContext();
      await next();
    })
    koa.use(this.middlewares.compose('prefix'));
    koa.use(app.routes());
    koa.use(this.middlewares.compose('suffix'));
    const server = createServer(koa.callback());
    await this.middlewares.attachServer(server);
    await new Promise<void>((resolve, reject) => {
      server.listen(props.port, (err?: any) => {
        if (err) return reject(err);
        resolve();
      })
    })

    this.koa = koa;
    this.app = app;
    this.server = server;
    this.keys = keys;
    this.port = props.port;

    return () => this.terminate();
  }

  public terminate() {
    this.server.close();
    this.koa = undefined;
    this.app = undefined;
    this.server = undefined;
    this.keys = undefined;
    this.port = undefined;

  }
}