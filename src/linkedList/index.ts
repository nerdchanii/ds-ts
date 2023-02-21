import Node from './node';

export default class LinkedList<T> {
  private head: Node<T> | null;
  private tail: Node<T> | null;

  constructor() {
    this.head = null;
    this.tail = null;
    return this;
  }

  prepend(data: T) {
    const node = new Node(data);

    if (!this.head) {
      this.head = node;
      this.tail = node;
      return this;
    }

    node.setNext(this.head);
    this.head = node;
    return this;
  }

  append(data: T) {
    const node = new Node(data);

    if (!this.head) {
      this.head = node;
      this.tail = node;
      return this;
    }
    this.tail?.setNext(node);
    this.tail = node;
    return this;
  }

  delete(data: T) {
    if (!this.head) {
      return null;
    }
    let tempNode = this.head
    while (tempNode.hasNext()) {
      if (tempNode.getNext()?.getData() === data) {
        let deleteNode = tempNode.getNext();
        tempNode.setNext(deleteNode?.getNext() || null);
      }
      tempNode = tempNode.getNext() as Node<T>
    }
  }

  find(data: T) {
    let node = this.head;
    while (node !== null) {
      if (node.getData() === data) {
        return node;
      }
      node = node.getNext();
    }
    return null;
  }

  insertAfter(findData: T, newData: T) {
    const node = this.find(findData);
    if (node) {
      const newNode = new Node(newData);
      newNode.setNext(node.getNext());
      node.setNext(newNode);
    }
  }
}
