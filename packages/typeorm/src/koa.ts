import { create } from '@zille/core';
import { Middleware as KoaMiddleware } from 'koa';
import { DataSource, QueryRunner } from 'typeorm';
import { TypeORM, useTransaction } from './index';

declare module 'koa' {
  interface BaseContext {
    database: DataBaseConnection,
    onDataBaseRollback?: (roll: () => unknown) => number,
  }
}

export type DataBaseConnection = DataSource | QueryRunner;
export const Middleware = (transaction?: boolean): KoaMiddleware => {
  return async (ctx, next) => {
    const database = await create(TypeORM);
    if (transaction) {
      await useTransaction(database.connection, async (runner, rollback) => {
        ctx.database = runner;
        ctx.onDataBaseRollback = rollback;
        await next();
      })
    } else {
      ctx.database = database.connection;
      await next();
    }
  }
}