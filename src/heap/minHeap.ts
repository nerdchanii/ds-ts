export class MinHeap<T> {
  private _inner: T[];

  constructor() {
    this._inner = [];
  }

  get inner() {
    return [...this._inner];
  }

  public size() {
    return this._inner.length;
  }

  public insert(value: T) {
    this._inner.push(value);
    this.#heapifyUp(this._inner.length - 1);
  }

  public peek(): T | null {
    if (this._inner.length === 0) {
      return null;
    }
    return this._inner[0];
  }

  public extract(): T | null {
    if (this._inner.length === 0) {
      return null;
    }
    const result = this._inner[0];
    const last = this._inner.pop()!;
    if (this.size() === 0) {
      return result;
    }
    this._inner[0] = last;
    this.#heapifyDown(0);
    return result;
  }

  #heapifyUp(index: number) {
    const value = this._inner[index];

    while (index > 0) {
      const parentIndex = Math.floor((index - 1) / 2);
      const parentValue = this._inner[parentIndex];
      if (value >= parentValue) {
        break;
      }
      this._inner[index] = parentValue;
      index = parentIndex;
    }

    this._inner[index] = value;
  }

  #heapifyDown(index: number) {
    const value = this._inner[index];

    while (true) {
      const leftChildIndex = 2 * index + 1;
      const rightChildIndex = 2 * index + 2;
      let smallerIndex = index;

      if (
        leftChildIndex < this._inner.length &&
        this._inner[leftChildIndex] < this._inner[smallerIndex]
      ) {
        smallerIndex = leftChildIndex;
      }

      if (
        rightChildIndex < this._inner.length &&
        this._inner[rightChildIndex] < this._inner[smallerIndex]
      ) {
        smallerIndex = rightChildIndex;
      }

      if (smallerIndex === index) {
        break;
      }
      let temp = this._inner[index];
      this._inner[index] = this._inner[smallerIndex];
      this._inner[smallerIndex] = temp;
      index = smallerIndex;
    }
    // this._inner[index] = value;
  }
}
