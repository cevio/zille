import { Application } from '@zille/application';

@Application.Injectable()
export class Configurator extends Application {
  private readonly state = new Map<string | symbol, any>();

  public setup() { }

  public set(key: string | symbol, value: any) {
    this.state.set(key, value);
  }

  public get<T = any>(key: string | symbol) {
    return this.state.get(key) as T;
  }

  public has(key: string | symbol) {
    return this.state.has(key);
  }

  public delete(key: string | symbol) {
    return this.state.delete(key);
  }
}