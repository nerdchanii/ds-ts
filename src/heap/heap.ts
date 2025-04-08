export class heap<T> {
  private _inner: T[];
  constructor(private diff = (a: T, b: T) => a < b) {
    this._inner = [];
  }

  get size() {
    return this._inner.length;
  }
  get inner() {
    return [...this._inner];
  }
  insert(value: T) {
    this._inner.push(value);
    this.#shiftUp();
  }

  peek() {
    return this._inner[0];
  }
  extract() {
    if (this.size === 0) return null;
    const result = this._inner[0];
    const last = this._inner.pop()!;
    if (this.size === 0) return result;
    this._inner[0] = last;
    this.#shiftDown();
    return result;
  }

  isEmpty() {
    return this.size === 0;
  }

  #shiftDown() {
    let idx = 0;
    while (true) {
      let targetIdx = idx;
      let leftValue = this.#leftChild(idx);
      let rightValue = this.#rightChild(idx);
      if (leftValue && this.diff(this._inner[targetIdx], leftValue)) {
        targetIdx = idx * 2 + 1;
      }
      if (rightValue && this.diff(this._inner[targetIdx], rightValue)) {
        targetIdx = idx * 2 + 2;
      }
      if (targetIdx === idx) {
        break;
      }
      let tempvalue = this._inner[idx];
      this._inner[idx] = this._inner[targetIdx];
      this._inner[targetIdx] = tempvalue;
      idx = targetIdx;
    }
  }

  #shiftUp() {
    let currIdx = this._inner.length - 1;
    let v = this._inner[currIdx];
    let parentIdx;
    while (currIdx > 0) {
      parentIdx = Math.floor((currIdx - 1) / 2);
      if (!this.diff(this._inner[parentIdx], this._inner[currIdx])) {
        break;
      }
      this._inner[currIdx] = this._inner[parentIdx];
      currIdx = (currIdx - 1) / 2;
    }
    this._inner[currIdx] = v;
  }

  #leftChild(index: number) {
    const leftChildIndex = index * 2 + 1;
    if (this.size - 1 < leftChildIndex) {
      return null;
    }
    return this._inner[leftChildIndex];
  }

  #rightChild(index: number) {
    const rightChildIndex = index * 2 + 2;
    if (this.size - 1 < rightChildIndex) {
      return null;
    }
    return this._inner[rightChildIndex];
  }
}

// let minheap = new heap<number>((a, b) => a < b);

// minheap.insert(1);
// console.log(minheap.inner);
// minheap.insert(7);
// console.log(minheap.inner);
// minheap.insert(6);
// console.log(minheap.inner);
// minheap.insert(5);
// console.log(minheap.inner);
// minheap.insert(2);
// console.log(minheap.inner);
