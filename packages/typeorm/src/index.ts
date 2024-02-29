import { Component } from '@zille/core';
import { Configurator } from '@zille/configurator';
import { DataSource, DataSourceOptions, QueryRunner } from 'typeorm';

@Component.Injectable()
export class TypeORM extends Component {
  static readonly namespace = Symbol('TYPEORM');

  public connection: DataSource;

  @Component.Inject(Configurator)
  private readonly configure: Configurator;

  public async initialize() {
    if (!this.configure.has(TypeORM.namespace)) {
      throw new Error('Missing configuration parameters for Typeorm service startup');
    }
    const props = this.configure.get<DataSourceOptions>(TypeORM.namespace);
    const connection = new DataSource(props);
    await connection.initialize();
    this.connection = connection;
  }

  public async terminate() {
    await this.connection.destroy();
  }
}

export async function useTransaction<T>(datasource: DataSource, callback: (
  runner: QueryRunner,
  rollback: (roll: () => unknown | Promise<unknown>) => number
) => Promise<T>) {
  const rollbacks: (() => unknown | Promise<unknown>)[] = [];
  const runner = datasource.createQueryRunner();
  await runner.connect();
  await runner.startTransaction();
  const push = (roll: () => unknown | Promise<unknown>) => rollbacks.push(roll);
  try {
    const res = await callback(runner, push);
    await runner.commitTransaction();
    return res;
  } catch (e) {
    await runner.rollbackTransaction();
    let i = rollbacks.length;
    while (i--) await Promise.resolve(rollbacks[i]());
    throw e;
  } finally {
    await runner.release();
  }
}