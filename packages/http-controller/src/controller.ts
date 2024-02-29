import 'koa-body';
import { Middleware, Context } from 'koa';
import { HTTPMethod } from 'find-my-way';
import { Annotation } from '@zille/annotation';
import { Response } from './response';
import { GetOption } from 'cookies';
import { Service, ServiceConstructor, Meta } from '@zille/service';
import { PathFunction, MatchFunction } from 'path-to-regexp';
import { stringify } from 'node:querystring';

export interface ControllerConstructor<T extends Controller = Controller> extends ServiceConstructor<T> { }
export abstract class Controller<PARAMS extends string = string, QUERY extends string = string> extends Service {
  public abstract main(...args: any[]): Promise<Response>;
  static readonly NAMESPACE_METHOD = Symbol('http:method');
  static readonly NAMESPACE_MIDDLEWARE = Symbol('http:middlewares');
  static readonly Middleware = Annotation.createClassDecorator<Middleware[], Meta>(Controller.NAMESPACE_MIDDLEWARE, () => new Meta());
  static readonly Method = Annotation.createClassDecorator<[HTTPMethod], Meta>(Controller.NAMESPACE_METHOD, () => new Meta());

  static readonly Context = Annotation.createParameterDecorator<[(ctx: Context) => unknown], Meta, Context>(() => new Meta(), (_, ctx) => _.parameters[0](ctx));
  static readonly Cookie = Annotation.createParameterDecorator<[string, GetOption?], Meta, Context>(() => new Meta(), (_, ctx) => ctx.cookies.get(_.parameters[0], _.parameters[1]));
  static readonly Params = Controller.Context(ctx => ctx.params);
  static readonly Querys = Controller.Context(ctx => ctx.query);
  static readonly Headers = Controller.Context(ctx => ctx.headers);
  static readonly Body = Controller.Context(ctx => ctx.request.body);
  static readonly Store = Controller.Context(ctx => ctx.state['SERVICE:STORE']);

  static readonly Param = Annotation.createParameterDecorator<[string, ...Function[]], Meta, Context>(
    () => new Meta(),
    async (anno, ctx) => {
      const [key, ...fns] = anno.parameters;
      return AsyncReduce(ctx.params[key], fns);
    }
  );

  static readonly Query = Annotation.createParameterDecorator<[string, ...Function[]], Meta, Context>(
    () => new Meta(),
    async (anno, ctx) => {
      const [key, ...fns] = anno.parameters;
      return AsyncReduce(ctx.query[key], fns);
    }
  );

  static readonly Header = Annotation.createParameterDecorator<[string, ...Function[]], Meta, Context>(
    () => new Meta(),
    async (anno, ctx) => {
      const [key, ...fns] = anno.parameters;
      return AsyncReduce(ctx.headers[key], fns);
    }
  );

  public toPath<P extends string, C extends Controller<P>>(clazz: ControllerConstructor<C>, data?: Record<P, string>) {
    const meta = Meta.instance(clazz);
    const toPath = meta.state.get('toPath') as PathFunction<Partial<Record<P, string>>>;
    if (typeof toPath !== 'function') {
      throw new Error('The controller has not been initialized and there is no toPath method.');
    }
    return toPath(data || {});
  }

  public toMatch<P extends string, C extends Controller<P>>(clazz: ControllerConstructor<C>, path: string) {
    const meta = Meta.instance(clazz);
    const toMatch = meta.state.get('toMatch') as MatchFunction<Partial<Record<P, string>>>;
    if (typeof toMatch !== 'function') {
      throw new Error('The controller has not been initialized and there is no toMatch method.');
    }
    return toMatch(path);
  }

  public toHref<P extends string, Q extends string, C extends Controller<P, Q>>(
    clazz: ControllerConstructor<C>,
    params?: Record<P, string>, query?: Record<Q, string>
  ) {
    const p = this.toPath(clazz, params);
    const q = stringify(query || {});
    if (q) return p + '?' + q;
    return p;
  }
}

async function AsyncReduce<T>(value: T, fns: Function[]) {
  for (let i = 0; i < fns.length; i++) {
    value = await Promise.resolve(fns[i](value));
  }
  return value;
}