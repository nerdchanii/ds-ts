import Queue from "./queue/list";
import Stack from './stack/list';
import LinkedList from './linkedList/index';
import CircularLinkedList from "./linkedList/circularLinkedList/index";
import DoublyLinkedList from "./linkedList/doublyLinkedList/index";
// queue
const queue = new Queue();
queue.enqueue(1);
queue.enqueue(2);


// stack
const stack = new Stack(10);
stack.push(1);
stack.push(2);


// linkedList
const linkedList = new LinkedList<number>();
linkedList.append(1);
linkedList.append(2);
linkedList.prepend(3);
linkedList.prepend(4);
linkedList.append(5);
linkedList.append(6);
linkedList.prepend(7);
linkedList.delete(2);
console.log('linked list 7 => 4 -> 3 -> 1 -> 2(delete) -> 5 -> 6 -> null')
let head = linkedList.find(7);
while (head) {
  console.log(head.getData());
  head = head.getNext();
}



// Circular Linked List
const cll = new CircularLinkedList<number>();
cll.append(1);
cll.append(2);
cll.append(3);
cll.append(4);
cll.append(5);
cll.insert(6, 1, true);
cll.insert(7, 1, false);
cll.insert(8, 1, true);
cll.insert(9, 8, true);
cll.insert(10, 8, false);
cll.append(11);
cll.append(12);
console.log(cll.toString())
// console.log(cll);



const dbl = new DoublyLinkedList<number>();
dbl.add(1);
dbl.add(2);
dbl.add(3);
dbl.delete(3);
dbl.add(4);
dbl.add(5);
dbl.delete(5);
dbl.add(6);
dbl.add(7);
dbl.insert(8, 1, true);
dbl.insert(10, 4, true);
{
  let head = dbl.find(8);
  let visited = false;
  while (head) {
    if (head === dbl.head && visited) break;
    if (!visited) visited = true;
    console.log(head.data);
    head = head.next;
  }
}
console.log('head before link', dbl.head?.before?.data);
console.log('tail after link', dbl.tail?.next?.data);


