import { glob } from 'glob';
import { resolve } from 'node:path';
import { Controller, ControllerConstructor } from './controller';
import { Meta } from '@zille/service';
import { Instance } from '@zille/http';
import { compile, match } from 'path-to-regexp';
import { HTTPMethod } from 'find-my-way';
import { Middleware } from 'koa';

export interface LoadControllerProps {
  suffix?: string,
  defaultPath?: string,
  transformPhysicalPathToRoutingPath?(path: string): string,
}

export * from './controller';

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
      const meta = Meta.instance(controller);
      LoadController(app, meta, path, options);
    }
  }
  return rollbacks;
}

function LoadController(app: Instance, meta: Meta<Controller>, path: string, options: LoadControllerProps = {}) {
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
  const _toPath = compile<Record<string, string>>(routingPath, { encode: encodeURIComponent });
  const _match = match(routingPath, { decode: decodeURIComponent });
  const method = meta.classes.get(Controller.NAMESPACE_METHOD).parameters[0] as HTTPMethod;
  const middlewareAnnotation = meta.classes.get(Controller.NAMESPACE_MIDDLEWARE);
  const middlewares = !!middlewareAnnotation ? middlewareAnnotation.parameters as Middleware[] : [];
  app.on(method, routingPath, ...middlewares, async ctx => {
    const target = await meta.create();
    await target.main(ctx);
  })
  return {
    physicalPath,
    routingPath,
    toPath: _toPath,
    match: _match,
    delete: () => app.off(this.method, path),
  }
}