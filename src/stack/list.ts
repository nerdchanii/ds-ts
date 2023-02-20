import Node from '../node';

export default class Stack<T>{
  private top: Node<T> | null;
  private currentSize: number;

  constructor(private size: number) {
    this.size = size;
    this.top = null;
    this.currentSize = 0;
  }

  push(item: T) {
    const node = new Node(item);
    node.next = this.top;
    this.top = node;
  }

  pop() {
    this.currentSize--;
    const { data, next } = this.top!;
    this.top = next;
    return data;
  }



}
