import { ERROR_CONFLICT } from "./variable";
import { Annotation } from '@zille/annotation';

enum NODE_STATUS {
  PREPARE,
  PENDING,
  RESOLVED,
  REJECTED,
}

enum NODE_MODE {
  INITIALIZE,
  TERMINATE,
}

export abstract class Node extends Annotation {
  private status: NODE_STATUS;
  private mode: NODE_MODE;
  private doing = false;
  private error: any;
  abstract initialize(): Promise<unknown>;
  abstract terminate(): Promise<unknown>;
  private readonly callbacks = new Set<{
    resolve: () => void,
    reject: (reason?: any) => void,
  }>();

  private resolve() {
    for (const { resolve } of this.callbacks.values()) {
      resolve();
    }
    this.callbacks.clear();
  }

  private reject(e: any) {
    for (const { reject } of this.callbacks.values()) {
      reject(e);
    }
    this.callbacks.clear();
  }

  private push(first?: true) {
    return new Promise<void>((resolve, reject) => {
      this.callbacks.add({ resolve, reject });
      if (first) {
        Promise.resolve(
          this.mode === NODE_MODE.INITIALIZE
            ? this.initialize()
            : this.terminate()
        ).then(() => {
          this.error = null;
          this.resolve();
          this.status = NODE_STATUS.RESOLVED;
          this.doing = false
        }).catch(e => {
          this.error = e;
          this.status = NODE_STATUS.REJECTED;
          this.reject(e);
          this.doing = false
        })
      }
    });
  }

  private execute() {
    switch (this.status) {
      case NODE_STATUS.PENDING: return this.push();
      case NODE_STATUS.RESOLVED: return Promise.resolve();
      case NODE_STATUS.REJECTED: return Promise.reject(this.error);
      default:
        this.status = NODE_STATUS.PENDING;
        return this.push(true);
    }
  }

  public setup() {
    if (this.doing && this.mode === NODE_MODE.TERMINATE) {
      return Promise.reject(ERROR_CONFLICT);
    }
    if (this.mode !== NODE_MODE.INITIALIZE) {
      this.mode = NODE_MODE.INITIALIZE;
      if (!this.doing) {
        this.status = NODE_STATUS.PREPARE;
        this.doing = true;
      }
    }
    return this.execute();
  }

  public destroy() {
    if (this.doing && this.mode === NODE_MODE.INITIALIZE) {
      return Promise.reject(ERROR_CONFLICT);
    }
    if (this.mode !== NODE_MODE.TERMINATE) {
      this.mode = NODE_MODE.TERMINATE;
      if (!this.doing) {
        this.status = NODE_STATUS.PREPARE;
        this.doing = true;
      }
    }
    return this.execute();
  }
}