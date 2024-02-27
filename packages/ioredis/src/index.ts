import { Component } from '@zille/core';
import { Configurator } from '@zille/configurator';

import ioRedis, { type RedisOptions } from 'ioredis';

@Component.Injectable()
export class IORedis extends Component {
  static readonly namespace = Symbol('IOREDIS');

  public connection: ioRedis;

  @Component.Inject(Configurator)
  private readonly configure: Configurator;

  public async initialize() {
    if (!this.configure.has(IORedis.namespace)) {
      throw new Error('Missing configuration parameters for IORedis service startup');
    }
    const props = this.configure.get<RedisOptions>(IORedis.namespace);
    const connection = new ioRedis(props);
    await new Promise<void>((resolve, reject) => {
      const onerror = (e: any) => reject(e);
      connection.on('error', onerror);
      connection.on('connect', () => {
        connection.off('error', onerror);
        resolve();
      })
    });
    this.connection = connection;
  }

  public terminate() {
    this.connection.disconnect();
  }
}