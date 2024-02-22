import {
  create,
  destroy,
  Component,
} from '@zille/core';

@Component.Injectable()
class A extends Component {
  public value = 1;
  public initialize(): void {
    this.value++;
    console.log('+', 'A initialized');
  }
  public terminate(): void {
    console.log('-', 'A terminated');
  }
}

@Component.Injectable()
class C extends Component {
  public value = 1;
  public initialize(): void {
    this.value++;
    console.log('+', 'C initialized');
    this.setState('val', 1243);
  }
  public terminate(): void {
    console.log('-', 'C terminated');
  }
}

@Component.Injectable()
class B extends Component {
  @Component.Inject(A)
  private readonly a: A;
  private b = 2
  public value = 1;
  public async initialize() {
    const c = await this.use(C);
    this.value += (this.a.value + this.b + c.value + Date.now());
    console.log('+', 'B initialized');
    console.log('c.state', c.getState<number>('val'));
  }
  public async terminate() {
    console.log('-', 'B terminated');
  }
}

(async () => {
  let b = await create(B);
  console.log('b.value', b.value)
  const a = await create(A);
  const c = await create(C);
  console.log('a.value', a.value);
  console.log('c.value', c.value);
  await destroy(b);
  b = await create(B);
  console.log('b.value', b.value);
  await destroy(b);
  console.log('done');
})();