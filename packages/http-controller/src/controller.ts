import 'koa-body';
import { Middleware, Context } from 'koa';
import { HTTPMethod } from 'find-my-way';
import { Response } from './response';
import { GetOption } from 'cookies';
import { Service } from '@zille/service';
import { PathFunction, MatchFunction } from 'path-to-regexp';
import { stringify } from 'node:querystring';
import { createClassDecorator, createParameterDecorator } from './decorator';
import { Newable, hook } from './types';

export abstract class Controller<PARAMS extends string = string, QUERY extends string = string> extends Service {
  public abstract main(...args: any[]): Promise<Response>;
  static readonly NAMESPACE_METHOD = Symbol('http:method');
  static readonly NAMESPACE_MIDDLEWARE = Symbol('http:middlewares');
  static readonly Middleware = createClassDecorator<Middleware[]>(Controller.NAMESPACE_MIDDLEWARE);
  static readonly Method = createClassDecorator<HTTPMethod[]>(Controller.NAMESPACE_METHOD);

  static readonly Context = createParameterDecorator<Context, [(ctx: Context) => unknown]>((ctx, callback) => callback(ctx));
  static readonly Cookie = createParameterDecorator<Context, [string, GetOption?]>((ctx, name, options) => ctx.cookies.get(name, options));
  static readonly Params = Controller.Context(ctx => ctx.params);
  static readonly Querys = Controller.Context(ctx => ctx.query);
  static readonly Headers = Controller.Context(ctx => ctx.headers);
  static readonly Body = Controller.Context(ctx => ctx.request.body);
  static readonly Files = Controller.Context(ctx => ctx.request.files);
  static readonly Store = Controller.Context(ctx => ctx.state['SERVICE:STORE']);

  static readonly Param = createParameterDecorator<Context, [string, ...Function[]]>((ctx, key, ...fns) => AsyncReduce(ctx.params[key], fns));
  static readonly Query = createParameterDecorator<Context, [string, ...Function[]]>((ctx, key, ...fns) => AsyncReduce(ctx.query[key], fns));
  static readonly Header = createParameterDecorator<Context, [string, ...Function[]]>((ctx, key, ...fns) => AsyncReduce(ctx.headers[key], fns));

  public toPath<P extends string, C extends Controller<P>>(clazz: Newable<C>, data?: Record<P, string>) {
    const toPath = hook.getPath(clazz) as PathFunction<Partial<Record<P, string>>>;
    if (typeof toPath !== 'function') {
      throw new Error('The controller has not been initialized and there is no toPath method.');
    }
    return toPath(data || {});
  }

  public toMatch<P extends string, C extends Controller<P>>(clazz: Newable<C>, path: string) {
    const toMatch = hook.getMatch(clazz) as MatchFunction<Partial<Record<P, string>>>;
    if (typeof toMatch !== 'function') {
      throw new Error('The controller has not been initialized and there is no toMatch method.');
    }
    return toMatch(path);
  }

  public toHref<P extends string, Q extends string, C extends Controller<P, Q>>(
    clazz: Newable<C>,
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