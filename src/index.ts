import Queue from "./queue/list";
import Stack from './stack/list';

// queue
const queue = new Queue();
queue.enqueue(1);
queue.enqueue(2);
console.log(queue);
console.log(queue.dequeue());
console.log(queue.dequeue());


// stack
const stack = new Stack(10);
stack.push(1);
stack.push(2);

console.log(stack);
console.log(stack.pop());
console.log(stack.pop());

