/** stack based on Array */

class Stack<T> {
  private data: T[];
  constructor(private size: number) {
    this.data = [];
  }

  push(item: T) {
    if (this.isFull()) throw new Error('Stack is full');
    this.data.push(item);
  }

  pop() {
    if (this.isEmpty()) {
      throw new Error('Stack is empty');
    }
    return this.data.pop() as T;
  }

  peek() {
    if (!this.data.length) return null;
    return this.data[this.data.length - 1];
  }

  isEmpty() {
    return !!this.data.length;
  }

  isFull() {
    return this.data.length === this.size;
  }

}


