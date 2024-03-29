import { Application } from '@zille/application';
import { Configurator } from '@zille/configurator';
import { DataSource, DataSourceOptions, QueryRunner } from 'typeorm';

@Application.Injectable()
export class TypeORM extends Application {
  static readonly namespace = Symbol('TYPEORM');

  public connection: DataSource;

  @Application.Inject(Configurator)
  private readonly configure: Configurator;

  public async setup() {
    if (!this.configure.has(TypeORM.namespace)) {
      throw new Error('Missing configuration parameters for Typeorm service startup');
    }
    const props = this.configure.get<DataSourceOptions>(TypeORM.namespace);
    const connection = new DataSource(props);
    await connection.initialize();
    this.connection = connection;
    return () => this.terminate();
  }

  /**
   * 事物处理
   * @param callback 
   * @returns 
   */
  public transaction<T>(callback: (
    runner: QueryRunner,
    rollback: (roll: () => unknown | Promise<unknown>) => number
  ) => Promise<T>) {
    return useTransaction(this.connection, callback);
  }

  public async terminate() {
    await this.connection.destroy();
    this.connection = undefined;
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