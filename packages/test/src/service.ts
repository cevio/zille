import { Application, container } from '@zille/application';
import { Service, createContext } from '@zille/service';

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
class B extends Application {
  @Application.Inject(A)
  private readonly a: A;

  public value = 1;
  public setup() {
    this.value += this.a.value;
    console.log('+', 'B initialized');
    return () => console.log('-', 'B terminated');
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
  const ctx = createContext();
  console.log('初始context', ctx);
  console.log('初始container', container);
  const target = await ctx.connect(BS);
  const value = target.sum(5, 6);
  console.log('第一次context', ctx);
  console.log('第一次container', container);
  {
    const ctx = createContext();
    console.log('第二次初始context', ctx);
    console.log('第二次初始container', container);
    const target = await ctx.connect(BS);
    const value = target.sum(5, 6);
    console.log('第二次context', ctx);
    console.log('第二次container', container);
    console.log('value', value);
  }
  console.log('done')
})()