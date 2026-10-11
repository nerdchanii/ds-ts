/**
 * 트라이(Trie, 접두사 트리)
 *
 * 문자열 집합을 "글자 단위 경로"로 저장하는 트리.
 * - 루트에서 어떤 노드까지의 경로를 이어 붙이면 그 노드가 나타내는 접두사가 된다.
 * - 단어가 끝나는 노드에는 isEnd 표시를 한다. (app 과 apple 은 같은 경로를 공유)
 * - 글자는 유니코드 코드포인트 단위로 순회한다. (`for (const ch of word)`)
 *   그래서 한글, 이모지(서로게이트 쌍)도 한 글자로 올바르게 처리된다.
 *   단, 결합 문자(예: 자모 분리형 한글 NFD)는 NFC 로 정규화한 뒤 넣는 것을 권장한다.
 *
 * V 는 단어에 붙일 수 있는 부가 값(선택)의 타입이다. (예: 사전의 뜻, 검색 빈도)
 */

/** 트라이의 노드. 외부에서 직접 만질 일은 없다. */
class TrieNode<V> {
  /** 다음 글자 -> 자식 노드 */
  readonly children = new Map<string, TrieNode<V>>();
  /** 이 노드에서 단어가 끝나는가 */
  isEnd = false;
  /** 단어에 붙은 부가 값 (isEnd 일 때만 의미 있음) */
  value: V | undefined = undefined;
  /** 이 노드를 루트로 하는 부분 트리에 들어있는 단어 수 (자기 자신 포함) */
  wordCount = 0;
}

/** 코드포인트 기준 비교 (UTF-16 코드 유닛 비교와 달리 이모지도 올바른 순서) */
function compareCodePoint(a: string, b: string): number {
  return (a.codePointAt(0) as number) - (b.codePointAt(0) as number);
}

export class Trie<V = undefined> implements Iterable<string> {
  private readonly root = new TrieNode<V>();

  /** 저장된 단어 수 */
  get size(): number {
    return this.root.wordCount;
  }

  /** 비어 있는가 */
  isEmpty(): boolean {
    return this.size === 0;
  }

  /**
   * 단어를 삽입한다. 이미 있으면 값만 갱신하고 size 는 그대로다.
   * @returns 새로 추가되었으면 true, 이미 있던 단어면 false
   */
  insert(word: string, value?: V): boolean {
    const isNew = !this.has(word);
    let node = this.root;
    if (isNew) node.wordCount++;
    for (const ch of word) {
      let next = node.children.get(ch);
      if (next === undefined) {
        next = new TrieNode<V>();
        node.children.set(ch, next);
      }
      node = next;
      // 경로상의 모든 노드의 "부분 트리 단어 수"를 함께 올린다.
      if (isNew) node.wordCount++;
    }
    node.isEnd = true;
    node.value = value;
    return isNew;
  }

  /** 정확히 이 단어가 저장되어 있는가. ("app" 만 넣었다면 has("ap") 는 false) */
  has(word: string): boolean {
    const node = this.findNode(word);
    return node !== undefined && node.isEnd;
  }

  /** 단어에 붙은 부가 값을 돌려준다. 없는 단어면 undefined. */
  get(word: string): V | undefined {
    const node = this.findNode(word);
    return node !== undefined && node.isEnd ? node.value : undefined;
  }

  /** 이 접두사로 시작하는 단어가 하나라도 있는가. (단어 자신도 포함) */
  startsWith(prefix: string): boolean {
    return this.countWithPrefix(prefix) > 0;
  }

  /**
   * 단어를 삭제한다. 삭제 후 단어도 아니고 자식도 없는 노드는 아래에서부터 잘라낸다.
   * 반복문으로 구현하여 긴 단어에서도 재귀 깊이 문제가 없다.
   * @returns 실제로 삭제했으면 true, 없던 단어면 false
   */
  remove(word: string): boolean {
    if (!this.has(word)) return false;

    // 1) 루트부터 내려가며 (부모, 글자, 노드) 경로를 기록하고 단어 수를 줄인다.
    const path: Array<{ parent: TrieNode<V>; ch: string; node: TrieNode<V> }> = [];
    let node = this.root;
    node.wordCount--;
    for (const ch of word) {
      const next = node.children.get(ch) as TrieNode<V>; // has 로 존재가 보장됨
      path.push({ parent: node, ch, node: next });
      node = next;
      node.wordCount--;
    }

    // 2) 단어 표시를 지운다. (app 삭제 시 apple 은 자식으로 남아 있으므로 보존)
    node.isEnd = false;
    node.value = undefined;

    // 3) 리프 쪽에서 루트 쪽으로 올라가며, 쓸모없어진 노드만 잘라낸다.
    for (let i = path.length - 1; i >= 0; i--) {
      const { parent, ch, node: cur } = path[i];
      if (cur.isEnd || cur.children.size > 0) break; // 다른 단어가 쓰는 노드면 중단
      parent.children.delete(ch);
    }
    return true;
  }

  /**
   * 접두사로 시작하는 단어를 사전순(코드포인트 순)으로 최대 limit 개 돌려준다.
   * 접두사와 같은 단어가 있으면 가장 먼저 나온다. (app, apple, apply ...)
   * @param limit 생략하면 전부. 0 이하이면 빈 배열.
   */
  autocomplete(prefix: string, limit?: number): string[] {
    const result: string[] = [];
    if (limit !== undefined && limit <= 0) return result;
    const start = this.findNode(prefix);
    if (start === undefined) return result;
    for (const word of this.walk(start, prefix)) {
      result.push(word);
      if (limit !== undefined && result.length >= limit) break;
    }
    return result;
  }

  /** 접두사로 시작하는 단어의 수. O(접두사 길이). 노드에 단어 수를 미리 세어 둔 덕분. */
  countWithPrefix(prefix: string): number {
    const node = this.findNode(prefix);
    return node === undefined ? 0 : node.wordCount;
  }

  /** 모든 단어를 지운다. */
  clear(): void {
    this.root.children.clear();
    this.root.isEnd = false;
    this.root.value = undefined;
    this.root.wordCount = 0;
  }

  /** 모든 단어를 사전순으로 순회한다. */
  [Symbol.iterator](): Iterator<string> {
    return this.walk(this.root, "");
  }

  // ---------------------------------------------------------------- 내부 구현

  /** 접두사 경로를 따라 내려가 해당 노드를 찾는다. 없으면 undefined. */
  private findNode(prefix: string): TrieNode<V> | undefined {
    let node = this.root;
    for (const ch of prefix) {
      const next = node.children.get(ch);
      if (next === undefined) return undefined;
      node = next;
    }
    return node;
  }

  /**
   * start 노드(접두사 prefix)의 부분 트리를 사전순으로 순회하는 제너레이터.
   * 명시적 스택을 쓰는 전위 순회(DFS)라 재귀 깊이 제한이 없고,
   * 전위 순회이므로 "app" 이 "apple" 보다 먼저 나온다.
   * 스택은 LIFO 이므로 자식을 사전 역순으로 넣어야 사전순으로 꺼낸다.
   */
  private *walk(start: TrieNode<V>, prefix: string): Generator<string, void, undefined> {
    const stack: Array<{ node: TrieNode<V>; word: string }> = [{ node: start, word: prefix }];
    while (stack.length > 0) {
      const { node, word } = stack.pop() as { node: TrieNode<V>; word: string };
      if (node.isEnd) yield word;
      const keys = Array.from(node.children.keys()).sort(compareCodePoint);
      for (let i = keys.length - 1; i >= 0; i--) {
        stack.push({ node: node.children.get(keys[i]) as TrieNode<V>, word: word + keys[i] });
      }
    }
  }
}
