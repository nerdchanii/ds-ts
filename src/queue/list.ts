/** It is Queue Impletation that based on Nodes */
import Node from '../node';

export default class Queue<T> {
  front: Node<T> | null;
  rear: Node<T> | null;
  constructor() {
    this.front = null;
    this.rear = null;
  }


  enqueue(item: T) {
    const node = new Node(item);
    if (this.front === null) {
      this.front = node;
      this.rear = node;
    } else {
      if (this.rear !== null) this.rear.next = node;
      this.rear = node;
    }

  }
  dequeue() {
    if (this.front === null) return new Error('Can not dequeue from empty queue!');
    const { data, next } = this.front;
    this.front = next;
    return data;
  }

  peek() {
    return this.front?.data || null;
  }
}


