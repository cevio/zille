import { Controller } from '@zille/http-controller';
import { Context } from 'koa';

@Controller.Injectable()
@Controller.Method('GET')
export default class extends Controller {
  public async main(ctx: Context): Promise<void> {
    ctx.body = 'hello world';
  }
}