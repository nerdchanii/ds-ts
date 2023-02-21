import Node from "../node";

type Head<T> = Node<T> | null;

export default class CircularLinkedList<T>{
  head: Head<T>;
  tail: Node<T> | null;

  constructor() {
    this.head = null;
    this.tail = null;
  }

  prepend(data: T) {
    const newNode = new Node(data);
    if (this.isEmpty()) this.addFirstNode(newNode);
    else {
      this.tail?.setNext(newNode);
      newNode.setNext(this.head);
      this.head = newNode;
    }
    return this;
  }

  append(data: T) {
    const newNode = new Node(data);
    if (this.isEmpty()) this.addFirstNode(newNode);
    else {
      newNode.setNext(this.head);
      this.tail?.setNext(newNode);
      this.tail = newNode;
    }
  }

  insert(data: T, searchData: T, before: boolean = true) {
    const newNode = new Node(data);
    if (before) this.insertBefore(newNode, searchData);
    else this.insertAfter(newNode, searchData);
  }
  private insertAfter(newNode: Node<T>, data: T) {
    let searchedNode = this.head;
    while (searchedNode?.getData() !== data) {
      searchedNode = searchedNode?.getNext() || null;
    }
    newNode.setNext(searchedNode.getNext());
    searchedNode.setNext(newNode);
    if (searchedNode === this.tail) {
      this.tail = newNode;
    }
  }

  private insertBefore(newNode: Node<T>, data: T) {
    let searchedNode = this.head;
    while (searchedNode?.getNext()?.getData() !== data) {
      searchedNode = searchedNode?.getNext() || null
    }

    if (searchedNode.getNext() === this.head) {
      this.tail = newNode;
    }
    console.log('searchNode', searchedNode)
    newNode.setNext(searchedNode.getNext());
    searchedNode.setNext(newNode);

  }



  isEmpty() {
    return this.head === null && this.tail === null
  }

  private addFirstNode(node: Node<T>) {
    node.setNext(node);
    this.head = node;
    this.tail = node;
  }

  toString() {
    let temp = this.head;
    let visit = false;
    const result = [];
    while (temp !== null) {
      if (visit && temp === this.head) return result.toString();
      visit = true;
      result.push(temp.getData());
      temp = temp.getNext();
    }
  }
}