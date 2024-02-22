import { Configurator } from '@zille/configurator';
import { Http, HttpProps } from '@zille/http';
import { create } from '@zille/core';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { LoadControllers } from '@zille/http-controller'

const __dirname = fileURLToPath(new URL('.', import.meta.url));

async function main(props: HttpProps) {
  const configs = await create(Configurator);
  // 启动参数设置
  configs.set(Http.namespace, props);
  const http = await create(Http);
  await LoadControllers(resolve(__dirname, 'controller'), http.app);
  console.log('start on', http.port);
}

main({
  port: 8921,
});