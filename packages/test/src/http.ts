import { Configurator } from '@zille/configurator';
import { Http, HttpMiddlewares, HttpProps } from '@zille/http';
import { container } from '@zille/application';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { LoadControllers } from '@zille/http-controller'

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function main(props: HttpProps) {
  const configs = await container.connect(Configurator);
  // 启动参数设置
  configs.set(Http.namespace, props);
  const mds = await container.connect(HttpMiddlewares);
  mds.add('suffix', async (ctx, next) => {
    ctx.body = 'kk'
  })
  const http = await container.connect(Http);
  await LoadControllers(resolve(__dirname, 'controller'), http.app);
  console.log('start on', http.port);
}

main({
  port: 8921,
});