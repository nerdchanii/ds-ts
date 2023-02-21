import Queue from "./queue/list";
import Stack from './stack/list';
import LinkedList from './linkedList/index';
import CircularLinkedList from "./linkedList/circularLinkedList/index";
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





