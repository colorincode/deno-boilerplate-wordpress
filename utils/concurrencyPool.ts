// utils/concurrencyPool.ts
export class ConcurrencyPool {
  private queue: (() => Promise<void>)[] = [];
  private running = 0;

  constructor(private readonly maxConcurrency: number) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const wrapped = async () => {
        this.running++;
        try {
          const result = await task();
          resolve(result);
        } catch (err) {
          reject(err);
        } finally {
          this.running--;
          this.next();
        }
      };

      if (this.running < this.maxConcurrency) {
        wrapped();
      } else {
        this.queue.push(wrapped);
      }
    });
  }

  private next() {
    if (this.queue.length > 0 && this.running < this.maxConcurrency) {
      const nextTask = this.queue.shift()!;
      nextTask();
    }
  }
}
