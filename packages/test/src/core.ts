import {
  Application,
  container,
} from '@zille/application';

@Application.Injectable()
class A extends Application {
  public value = 1;
  public setup() {
    this.value++;
    console.log('+', 'A initialized');
    return () => console.log('-', 'A terminated');
  }
}

@Application.Injectable()
class C extends Application {
  public value = 1;
  public setup() {
    this.value++;
    console.log('+', 'C initialized');
    return () => console.log('-', 'C terminated');
  }
}

@Application.Injectable()
class B extends Application {
  @Application.Inject(A)
  private readonly a: A;
  private b = 2
  public value = 1;
  public async setup() {
    const c = await this.$use(C);
    this.value += (this.a.value + this.b + c.value + Date.now());
    console.log('+', 'B initialized');
    return () => console.log('-', 'B terminated');
  }
}

(async () => {
  let b = await container.connect(B);
  console.log('b.value', b.value)
  const a = await container.connect(A);
  const c = await container.connect(C);
  console.log('a.value', a.value);
  console.log('c.value', c.value);
  console.log(container)
  await container.destroy(B);
  console.log('-----------------')
  console.log(container)
  await new Promise(resolve => {
    setTimeout(resolve, 3000)
  })
  b = await container.connect(B);
  console.log('b.value', b.value);
  await container.destroy(B);
  console.log('done');
})();