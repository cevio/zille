import { Controller, Response } from '@zille/http-controller';

const { Injectable, Method, Context, Query } = Controller;

@Injectable()
@Method('GET')
export default class ABC extends Controller {
  public async main(
    @Context(ctx => ctx.url) url: string,
    @Query('abc', Number) abc: number,
    @Controller.Next next: () => Promise<any>
  ) {
    return await next()
    return Response.html(`${url}:${abc + 1}`)
  }
}