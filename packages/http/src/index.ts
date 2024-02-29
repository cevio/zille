import Koa, { Context, Next } from 'koa';
import FindMyWay, { Instance } from './server';
import { randomBytes } from 'node:crypto';
import { createServer, Server } from 'node:http';
import { Component } from "@zille/core";
import { Configurator } from '@zille/configurator';
import { HttpProps } from './types';
import { HttpMiddlewares } from './middleware';

export * from './middleware';
export * from './server';
export * from './types';

@Component.Injectable()
export class Http extends Component {
  static readonly namespace = Symbol('HTTP');

  @Component.Inject(Configurator)
  private readonly configure: Configurator;

  @Component.Inject(HttpMiddlewares)
  private readonly middlewares: HttpMiddlewares;

  public koa: Koa;
  public app: Instance;
  public server: Server;
  public keys: string[];
  public port: number;

  public async initialize() {
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
      ctx.state['SERVICE:STORE'] = new Map();
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
  }

  public terminate() {
    this.server.close();
  }
}