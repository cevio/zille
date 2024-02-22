import { Component } from '@zille/core';
import { Service, Meta } from '@zille/service';

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
class B extends Component {
  @Component.Inject(A)
  private readonly a: A;

  public value = 1;
  public initialize(): void {
    this.value += this.a.value;
    console.log('+', 'B initialized');
  }
  public terminate(): void {
    console.log('-', 'B terminated');
  }
}

@Service.Injectable()
class AS extends Service {
  @Service.Inject(A)
  private readonly a: A;

  public sum(a: number, b: number) {
    return a + b + this.a.value;
  }
}

@Service.Injectable()
class BS extends Service {
  @Service.Inject(B)
  private readonly b: B;

  @Service.Inject(AS)
  private readonly ass: AS;

  public sum(a: number, b: number) {
    return a + b + this.b.value + this.ass.sum(a, b);
  }
}

(async () => {
  const meta = Meta.instance(BS);
  const target = await meta.create();
  const value = target.sum(5, 6);
  console.log('value', value);
  {
    const meta = Meta.instance(BS);
    const target = await meta.create();
    const value = target.sum(5, 6);
    console.log('value', value);
  }
  console.log('done')
})()