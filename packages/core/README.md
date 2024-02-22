# @zille/core

一套基于类的依赖注入服务。

## Install

```bash
$ npm i @zille/core
```

## Usage

```ts
import { Injectable, create, Component, destroy } from '@zille/core';

@Injectable()
class A extends Component {
  public value = 1;
  public initialize() {
    this.value++;
    console.log('+', 'A initialized');
  }
  public terminate() {
    console.log('-', 'A terminated');
  }
}

@Injectable()
class B extends Component {
  @Inject(A)
  private readonly a: A;
  private b = 2
  public value = 1;
  public async initialize() {
    this.value += (this.a.value + this.b + Date.now());
    console.log('+', 'B initialized');
  }
  public async terminate() {
    console.log('-', 'B terminated');
  }
}

(async () => {
  const b = await create(B);
  await destroy(b);
})();
```

## 创建一个新的服务

服务通过`@Injectable()`装饰器来描述，同时服务必须`extends Component`。

```ts
import { Injectable, Component } from '@zille/core';
@Injectable()
class A extends Component {
  public value = 1;
  public initialize() {
    this.value++;
    console.log('+', 'A initialized');
  }
  public terminate() {
    console.log('-', 'A terminated');
  }
}
```

它需要实现 以下 2 个函数:

- `initialize(rollback)` 初始化服务函数
- `terminate(rollback)` 销毁服务函数

### 依赖一个服务

依赖服务需要通过`@Inject(someserver)`来描述，程序会自动加载这个服务。
当然我们也提供了一个方法用于动态加载服务`this.use(...)`

```ts
import { Injectable, create, Component, destroy } from '@zille/core';
@Injectable()
class B extends Component {
  @Inject(A)
  private readonly a: A;
  private b = 2
  public value = 1;
  public async initialize() {
    this.value += (this.a.value + this.b + Date.now());
    console.log('+', 'B initialized');
    // 也可以动态加载
    const a = await this.use(A);
  }
  public async terminate() {
    console.log('-', 'B terminated');
  }
}
```

### 服务回滚

`initialize`与`terminate`都有一个回滚处理函数参数`rollback`

```ts
import { Injectable, Component } from '@zille/core';
@Injectable()
class A extends Component {
  public value = 1;
  public async initialize(rollback: (rollback: () => unknown | Promise<unknown>) => number) {
    this.value++;
    // 当出错时候回滚 this.value 的值
    rollback(() => this.value--);
    throw new Error('...')
    console.log('+', 'A initialized');
  }
  public terminate() {
    console.log('-', 'A terminated');
  }
}
```

### 服务数据共享存储

- `this.setState(key, value)` 添加数据
- `this.getState(key)` 获取数据
- `this.hasState(key)` 判断是否存在数据
- `this.delState(key)` 删除数据

```ts
import { Injectable, Component } from '@zille/core';
@Injectable()
class A extends Component {
  public value = 1;
  public async initialize() {
    this.value++;
    this.setState('abc', 1111);
    // 之后你可以在别的地方使用
    const a = await this.use(A);
    console.log(a.getState('abc'));
  }
  public terminate() {
    console.log('-', 'A terminated');
  }
}
```