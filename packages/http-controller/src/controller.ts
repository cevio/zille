import { Middleware, Context } from 'koa';
import { HTTPMethod } from 'find-my-way';
import { Annotation } from '@zille/annotation';
import { Instance } from '@zille/http';
import { Service, ServiceConstructor, Meta } from '@zille/service';
import { LoadControllerProps } from './index';
import { PathFunction, MatchFunction, compile, match } from 'path-to-regexp';

export type ControllerConstructor<T extends Controller = Controller> = ServiceConstructor<T>;

export abstract class Controller<T extends string = string> extends Service {
  // private readonly method: HTTPMethod;
  // private readonly middlewares: Middleware[];
  // private physicalPath: string;
  // private routingPath: string;
  public abstract main(ctx: Context): Promise<void>;
  // private _toPath: PathFunction<Record<T, string>>;
  // private _matcher: MatchFunction<Record<T, string>>;

  static readonly NAMESPACE_METHOD = Symbol('http:method');
  static readonly NAMESPACE_MIDDLEWARE = Symbol('http:middlewares');
  static readonly Middleware = Annotation.createClassDecorator<Middleware[], Meta>(Controller.NAMESPACE_MIDDLEWARE, () => new Meta());
  static readonly Method = Annotation.createClassDecorator<[HTTPMethod], Meta>(Controller.NAMESPACE_METHOD, () => new Meta());
}

@Controller.Injectable()
@Controller.Method('GET')
@Controller.Middleware(async (ctx, next) => {
  console.log(ctx.url);
  await next();
})
class abc extends Controller {
  public async main(): Promise<void> {

  }
}