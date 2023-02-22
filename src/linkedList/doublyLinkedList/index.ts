class DoublyLinkedNode<T>{
  data: T;
  before: DoublyLinkedNode<T> | null;
  next: DoublyLinkedNode<T> | null;

  constructor(data: T) {
    this.data = data;
    this.before = null;
    this.next = null;
  }


  setBefore(Node: DoublyLinkedNode<T> | null) {
    this.before = Node;
  }

  setNext(Node: DoublyLinkedNode<T> | null) {
    this.next = Node;
  }

  setData(data: T) {
    this.data = data;
  }
}

export default class DoublyLinkedList<T> {
  head: DoublyLinkedNode<T> | null;
  tail: DoublyLinkedNode<T> | null;

  constructor() {
    this.head = null;
    this.tail = null;
  }

  add(data: T) {
    const newNode = new DoublyLinkedNode(data);

    if (!this.head) {
      this.head = newNode;
      this.tail = newNode;
      this.head.setBefore(this.tail);
      this.head.setNext(this.tail);
      this.tail.setBefore(this.head);
      this.tail.setNext(this.head);
    }
    if (this.tail && this.head) {
      this.head.setBefore(newNode)
      this.tail.setNext(newNode);
      newNode.setBefore(this.tail);
      newNode.setNext(this.head);
      this.tail = newNode;
    }
    return this;
  }

  find(data: T) {
    let currentNode = this.head;
    let visited = false;
    while (currentNode) {
      if (currentNode === this.head && visited) return null;
      if (!visited) visited = true;
      if (currentNode.data === data) return currentNode;
      currentNode = currentNode.next;
    }
    return null;
  }

  insert(data: T, searchData: T, before: boolean = true) {
    let currentNode = this.find(searchData) || this.tail;
    if (currentNode) {
      if (before) this.insertBefore(data, currentNode);
      else this.insertAfter(data, currentNode);
    }
  }

  private insertBefore(data: T, currentNode: DoublyLinkedNode<T>) {
    const newNode = new DoublyLinkedNode(data);
    newNode.setNext(currentNode);
    newNode.setBefore(currentNode.before);
    currentNode.before?.setNext(newNode);
    currentNode.setBefore(newNode);
    if (currentNode === this.head) this.head = newNode;
  }

  private insertAfter(data: T, currentNode: DoublyLinkedNode<T>) {
    const newNode = new DoublyLinkedNode(data);
    newNode.setBefore(currentNode);
    newNode.setNext(currentNode.next);
    currentNode.next?.setBefore(newNode);
    currentNode.setNext(newNode);
    if (currentNode === this.tail) this.tail = newNode;

  }


  delete(data: T) {
    let currentNode = this.find(data);
    if (currentNode !== null) { // if the node exists
      currentNode.before?.setNext(currentNode.next);   // 1 2 3 -> 1 -> 3
      currentNode.next?.setBefore(currentNode.before); // 1 2 3 -> 3 -> 1 
    }
    if (currentNode === this.head) this.head = currentNode?.next || null;
    if (currentNode === this.tail) this.tail = currentNode?.before || null;
  }
}

