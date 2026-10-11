/** 두 값을 비교하는 함수. a<b 이면 음수, a==b 이면 0, a>b 이면 양수를 반환한다. */
export type Comparator<T> = (a: T, b: T) => number;

/** 기본 비교자: 숫자·문자열처럼 <, > 로 비교 가능한 값용 */
const defaultComparator = <T>(a: T, b: T): number => (a < b ? -1 : a > b ? 1 : 0);

/** 트리의 노드. 부모 포인터 없이 왼쪽/오른쪽 자식만 가진다. */
class TreeNode<T> {
  left: TreeNode<T> | null = null;
  right: TreeNode<T> | null = null;
  constructor(public value: T) {}
}

/**
 * 이진 탐색 트리(Binary Search Tree). 집합(set) 의미: 중복 값은 무시한다.
 *
 * 불변식: 모든 노드 x 에 대해
 *   (x 왼쪽 서브트리의 모든 값) < x.value < (x 오른쪽 서브트리의 모든 값)
 *
 * 삽입/탐색/삭제/순회는 모두 반복문(명시적 스택·큐)으로 구현하여
 * 한쪽으로 치우친 깊은 트리에서도 호출 스택 오버플로가 나지 않는다.
 */
export class BinarySearchTree<T> {
  private root: TreeNode<T> | null = null;
  private count = 0;
  private readonly compare: Comparator<T>;

  /** @param comparator 값의 순서를 정하는 비교 함수 (생략하면 <, > 사용) */
  constructor(comparator: Comparator<T> = defaultComparator) {
    this.compare = comparator;
  }

  /** 저장된 값의 개수 */
  get size(): number {
    return this.count;
  }

  isEmpty(): boolean {
    return this.count === 0;
  }

  /** 모든 값을 제거한다. */
  clear(): void {
    this.root = null;
    this.count = 0;
  }

  /**
   * 값을 삽입한다.
   * @returns 새로 삽입했으면 true, 이미 있어서 무시했으면 false
   */
  insert(value: T): boolean {
    if (this.root === null) {
      this.root = new TreeNode(value);
      this.count++;
      return true;
    }
    let cur = this.root;
    for (;;) {
      const c = this.compare(value, cur.value);
      if (c === 0) return false; // 중복은 무시
      if (c < 0) {
        if (cur.left === null) {
          cur.left = new TreeNode(value);
          break;
        }
        cur = cur.left;
      } else {
        if (cur.right === null) {
          cur.right = new TreeNode(value);
          break;
        }
        cur = cur.right;
      }
    }
    this.count++;
    return true;
  }

  /** 값이 트리에 있는지 확인한다. */
  has(value: T): boolean {
    let cur = this.root;
    while (cur !== null) {
      const c = this.compare(value, cur.value);
      if (c === 0) return true;
      cur = c < 0 ? cur.left : cur.right;
    }
    return false;
  }

  /**
   * 값을 삭제한다. (자식 0개 / 1개 / 2개 세 가지 경우를 모두 처리)
   * @returns 삭제했으면 true, 값이 없었으면 false
   */
  remove(value: T): boolean {
    // 1) 삭제할 노드와 그 부모를 찾는다.
    let parent: TreeNode<T> | null = null;
    let node = this.root;
    while (node !== null) {
      const c = this.compare(value, node.value);
      if (c === 0) break;
      parent = node;
      node = c < 0 ? node.left : node.right;
    }
    if (node === null) return false;

    if (node.left !== null && node.right !== null) {
      // 경우 3: 자식 2개 -> 후속자(오른쪽 서브트리의 최솟값)의 값을 복사해 오고,
      //         대신 후속자 노드를 삭제한다. (후속자는 왼쪽 자식이 없다)
      let succParent: TreeNode<T> = node;
      let succ: TreeNode<T> = node.right;
      while (succ.left !== null) {
        succParent = succ;
        succ = succ.left;
      }
      node.value = succ.value;
      // 후속자는 자식이 많아야 1개(오른쪽)이므로 경우 1/2 로 환원된다.
      this.replaceChild(succParent, succ, succ.right);
    } else {
      // 경우 1(자식 0개): null 로 대체, 경우 2(자식 1개): 그 자식으로 대체
      this.replaceChild(parent, node, node.left ?? node.right);
    }
    this.count--;
    return true;
  }

  /** parent 의 자식 old 를 replacement 로 바꾼다. parent 가 null 이면 루트를 바꾼다. */
  private replaceChild(parent: TreeNode<T> | null, old: TreeNode<T>, replacement: TreeNode<T> | null): void {
    if (parent === null) this.root = replacement;
    else if (parent.left === old) parent.left = replacement;
    else parent.right = replacement;
  }

  /** 최솟값 (비어 있으면 undefined) */
  min(): T | undefined {
    if (this.root === null) return undefined;
    let cur = this.root;
    while (cur.left !== null) cur = cur.left;
    return cur.value;
  }

  /** 최댓값 (비어 있으면 undefined) */
  max(): T | undefined {
    if (this.root === null) return undefined;
    let cur = this.root;
    while (cur.right !== null) cur = cur.right;
    return cur.value;
  }

  /**
   * 트리의 높이(노드 개수 기준). 빈 트리는 0, 노드 하나면 1.
   * 레벨 단위로 큐를 훑어 반복문으로 계산한다.
   */
  height(): number {
    if (this.root === null) return 0;
    let level: TreeNode<T>[] = [this.root];
    let h = 0;
    while (level.length > 0) {
      h++;
      const next: TreeNode<T>[] = [];
      for (const n of level) {
        if (n.left) next.push(n.left);
        if (n.right) next.push(n.right);
      }
      level = next;
    }
    return h;
  }

  /** value 보다 큰 값 중 가장 작은 값 (value 가 트리에 없어도 동작, 없으면 undefined) */
  successor(value: T): T | undefined {
    let result: T | undefined = undefined;
    let cur = this.root;
    while (cur !== null) {
      if (this.compare(value, cur.value) < 0) {
        result = cur.value; // 후보: 더 작은 후보를 찾으려고 왼쪽으로
        cur = cur.left;
      } else {
        cur = cur.right;
      }
    }
    return result;
  }

  /** value 보다 작은 값 중 가장 큰 값 (value 가 트리에 없어도 동작, 없으면 undefined) */
  predecessor(value: T): T | undefined {
    let result: T | undefined = undefined;
    let cur = this.root;
    while (cur !== null) {
      if (this.compare(value, cur.value) > 0) {
        result = cur.value;
        cur = cur.right;
      } else {
        cur = cur.left;
      }
    }
    return result;
  }

  /** 중위 순회: 왼쪽 -> 자신 -> 오른쪽. 오름차순으로 값을 내놓는다. */
  *inOrder(): Generator<T, void, undefined> {
    const stack: TreeNode<T>[] = [];
    let cur = this.root;
    while (cur !== null || stack.length > 0) {
      while (cur !== null) {
        stack.push(cur);
        cur = cur.left;
      }
      const node = stack.pop()!;
      yield node.value;
      cur = node.right;
    }
  }

  /** 전위 순회: 자신 -> 왼쪽 -> 오른쪽 */
  *preOrder(): Generator<T, void, undefined> {
    if (this.root === null) return;
    const stack: TreeNode<T>[] = [this.root];
    while (stack.length > 0) {
      const node = stack.pop()!;
      yield node.value;
      // 스택은 LIFO 이므로 오른쪽을 먼저 넣어야 왼쪽이 먼저 나온다.
      if (node.right) stack.push(node.right);
      if (node.left) stack.push(node.left);
    }
  }

  /** 후위 순회: 왼쪽 -> 오른쪽 -> 자신 */
  *postOrder(): Generator<T, void, undefined> {
    const stack: TreeNode<T>[] = [];
    let cur = this.root;
    let lastVisited: TreeNode<T> | null = null;
    while (cur !== null || stack.length > 0) {
      while (cur !== null) {
        stack.push(cur);
        cur = cur.left;
      }
      const top = stack[stack.length - 1];
      // 오른쪽 자식이 있고 아직 방문 전이면 오른쪽으로 내려간다.
      if (top.right !== null && top.right !== lastVisited) {
        cur = top.right;
      } else {
        yield top.value;
        lastVisited = stack.pop()!;
      }
    }
  }

  /** 레벨 순회(너비 우선): 위 레벨부터, 같은 레벨에서는 왼쪽부터 */
  *levelOrder(): Generator<T, void, undefined> {
    if (this.root === null) return;
    const queue: TreeNode<T>[] = [this.root];
    // 배열 shift() 는 O(n) 이므로 head 인덱스로 큐를 흉내 낸다.
    for (let head = 0; head < queue.length; head++) {
      const node = queue[head];
      yield node.value;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  /** for...of 로 순회하면 중위(오름차순) 순서 */
  [Symbol.iterator](): Generator<T, void, undefined> {
    return this.inOrder();
  }
}
