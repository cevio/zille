import { Component } from '@zille/core';

@Component.Injectable()
export class Configurator extends Component {
  private readonly state = new Map<string | symbol, any>();

  public initialize() { }
  public terminate() { }

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