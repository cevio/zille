import { glob } from 'glob';
import { resolve } from 'node:path';
import { Controller, ControllerConstructor } from './controller';
import { Meta } from '@zille/service';
import { Instance } from '@zille/http';
import { compile, match } from 'path-to-regexp';
import { HTTPMethod } from 'find-my-way';
import { Middleware } from 'koa';
import { Response } from './response';

export interface LoadControllerProps {
  suffix?: string,
  defaultPath?: string,
  transformPhysicalPathToRoutingPath?(path: string): string,
}

export * from './controller';
export * from './response';

export async function LoadControllers(directory: string, app: Instance, options: LoadControllerProps = {}) {
  const suffix = options.suffix ?? 'controller';
  const files = await glob(`**/*.${suffix}.{ts,js}`, { cwd: directory });
  const rollbacks: (() => unknown)[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = file.substring(0, file.length - (4 + suffix.length));
    let controllers = (await import(resolve(directory, file))).default as ControllerConstructor | ControllerConstructor[];
    if (!Array.isArray(controllers)) controllers = [controllers];
    for (let i = 0; i < controllers.length; i++) {
      const controller = controllers[i];
      rollbacks.push(
        LoadController(app, controller, path, options)
      );
    }
  }
  return rollbacks;
}

function LoadController(
  app: Instance,
  controller: ControllerConstructor,
  path: string,
  options: LoadControllerProps = {}
) {
  const meta = Meta.instance(controller);
  const suffix = options.defaultPath || '/index';
  path = path.startsWith('/') ? path : '/' + path;
  if (path.endsWith(suffix)) {
    path = path.substring(0, path.length - suffix.length);
  }
  if (!path) path = '/';
  const physicalPath = path;
  const routingPath = options.transformPhysicalPathToRoutingPath
    ? options.transformPhysicalPathToRoutingPath(path)
    : path.replace(/\[([^\]]+)\]/g, ':$1');
  const method = meta.classes.get(Controller.NAMESPACE_METHOD).parameters[0] as HTTPMethod;
  const middlewareAnnotation = meta.classes.get(Controller.NAMESPACE_MIDDLEWARE);
  const middlewares = !!middlewareAnnotation ? middlewareAnnotation.parameters as Middleware[] : [];
  const _toPath = compile<Record<string, string>>(routingPath, { encode: encodeURIComponent });
  const _match = match(routingPath, { decode: decodeURIComponent });

  meta.state.set('toPath', _toPath);
  meta.state.set('toMatch', _match);
  meta.emit('created', physicalPath, routingPath);

  app.on(method, routingPath, ...middlewares, async ctx => {
    const args = await meta.executeParamters('main', ctx);
    const target = await meta.create();
    const res = await target.main(...args);
    if (res instanceof Response) {
      res.render(ctx);
    } else {
      ctx.body = res;
    }
  })

  meta.emit('mounted', physicalPath, routingPath);

  return () => app.off(method, routingPath);
}