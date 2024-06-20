import { Context } from './context';
export type IClass<T = any> = { new(ctx: Context): T }
export type InjectAcceptType<T = any> = string | symbol | IClass<T>;