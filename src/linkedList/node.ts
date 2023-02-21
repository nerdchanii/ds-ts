

export default class Node<T> {
  private data: T;
  private next: Node<T> | null;

  constructor(data: T) {
    this.data = data;
    this.next = null;
  }

  getData() {
    return this.data;
  }

  setData(data: T) {
    this.data = data;
  }

  getNext() {
    return this.next;
  }

  setNext(next: Node<T> | null) {
    this.next = next;
  }

  hasNext() {
    return this.next !== null;
  }



}