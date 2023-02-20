/** It is Queue that is based on Array*/
class Queue<T> {
  private data: T[];
  constructor() {
    this.data = [];
  }
  enqueue(item: any) {
    this.data.push(item);
  }
  dequeue() {
    return this.data.shift();
  }
}