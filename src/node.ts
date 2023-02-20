export default class Node<T>{
  data: T;
  next: Node<T> | null;
  constructor(data: T) {
    this.data = data;
    this.next = null;
  }

  linking(node: Node<T>) {
    this.next = node;
  }

  unLinking() {
    this.next = null;
  }


  getData() {
    return this.data;
  }


}

