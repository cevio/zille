import { glob } from 'glob';
import { resolve } from 'node:path';
import { Controller } from './controller';
import { Instance } from '@zille/http';
import { compile, match } from 'path-to-regexp';
import { HTTPMethod } from 'find-my-way';
import { Middleware } from 'koa';
import { Response } from './response';
import { IControllerLoadingMeta, Newable, hook } from './types';
import { executeParameters, getClassDecorator } from './decorator';

export interface LoadControllerProps {
  prefix?: string,
  suffix?: string,
  defaultPath?: string,
  transformPhysicalPathToRoutingPath?(path: string): string,
}

export * from './controller';
export * from './response';
export * from './decorator';
export * from './hook';
export * from './types';

export async function LoadControllers(directory: string, app: Instance, options: LoadControllerProps = {}) {
  const suffix = options.suffix ?? 'controller';
  const files = await glob(`**/*.${suffix}.{ts,js}`, { cwd: directory });
  const rollbacks: (() => unknown)[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = file.substring(0, file.length - (4 + suffix.length));
    let controllers = (await import(resolve(directory, file))).default as Newable | Newable[];
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
  controller: Newable,
  path: string,
  options: LoadControllerProps = {}
) {
  const suffix = options.defaultPath || '/index';
  path = path.startsWith('/') ? path : '/' + path;
  if (path.endsWith(suffix)) {
    path = path.substring(0, path.length - suffix.length);
  }
  if (!path) path = '/';
  let physicalPath = options.prefix ? options.prefix + path : path;
  if (physicalPath.endsWith('/')) {
    physicalPath = physicalPath.substring(0, physicalPath.length - 1);
  }
  if (!physicalPath) physicalPath = '/';
  const routingPath = options.transformPhysicalPathToRoutingPath
    ? options.transformPhysicalPathToRoutingPath(physicalPath)
    : physicalPath.replace(/\[([^\]]+)\]/g, ':$1');

  const methods = getClassDecorator(Controller.NAMESPACE_METHOD, controller) as HTTPMethod[];
  const middlewares = getClassDecorator(Controller.NAMESPACE_MIDDLEWARE, controller) as Middleware[];

  const meta: IControllerLoadingMeta = {
    methods,
    middlewares,
    physicalPath,
    routingPath,
  }

  hook.addPath(controller, compile<Record<string, string>>(routingPath, { encode: encodeURIComponent }));
  hook.addMatch(controller, match(routingPath, { decode: decodeURIComponent }));
  hook.created(controller, meta);

  app.on(methods, routingPath, ...middlewares, async ctx => {
    const store = ctx.__SERVICE_STORAGE__;
    const target = await store.connect(controller);
    const args = await executeParameters(ctx, target, 'main');
    const res = await target.main(...args);
    if (res instanceof Response) {
      res.render(ctx);
    } else {
      ctx.body = res;
    }
  })

  hook.mounted(controller, meta);

  return () => app.off(methods, routingPath);
}