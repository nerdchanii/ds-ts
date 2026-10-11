# Queue / Deque (원형 버퍼 구현)

## 1. 추상 자료형(ADT) 정의

### Queue<T> (FIFO: 먼저 들어간 것이 먼저 나온다)

| 연산 | 사전 조건 | 사후 조건 |
| --- | --- | --- |
| `enqueue(x)` | 없음 | `x`가 맨 뒤에 추가되고 `size`가 1 증가 |
| `dequeue()` | 없음 (비어 있으면 `undefined` 반환) | 비어 있지 않았다면 맨 앞 원소를 반환하고 제거, `size`가 1 감소 |
| `peek()` | 없음 (비어 있으면 `undefined`) | 큐는 변하지 않음, 맨 앞 원소 반환 |
| `size` | 없음 | 현재 원소 수 반환, 큐는 변하지 않음 |
| `isEmpty()` | 없음 | `size === 0` 여부 반환 |
| `clear()` | 없음 | `size === 0` |
| `toArray()` / `[Symbol.iterator]` | 없음 | 앞에서 뒤 순서로 원소를 돌려주며 큐는 변하지 않음 |

핵심 불변식: `enqueue(a); enqueue(b)` 후 `dequeue()`는 항상 `a`를 먼저 돌려준다.

### Deque<T> (양방향 큐)

| 연산 | 사후 조건 |
| --- | --- |
| `pushFront(x)` / `pushBack(x)` | 앞 / 뒤에 추가, `size` +1 |
| `popFront()` / `popBack()` | 앞 / 뒤 원소를 반환하고 제거 (비어 있으면 `undefined`) |
| `peekFront()` / `peekBack()` | 제거 없이 앞 / 뒤 원소 반환 (비어 있으면 `undefined`) |
| `get(i)` | 앞에서 i번째 원소 (범위 밖이면 `undefined`) |
| `size`, `isEmpty`, `clear`, `toArray`, iterator | Queue와 동일 |

Deque는 스택(`pushBack`/`popBack`)과 큐(`pushBack`/`popFront`)를 모두 흉내 낼 수 있는 더 일반적인 자료형이다.

## 2. 왜 쓰는가

순서대로 처리해야 하는 일을 다룰 때 쓴다.

- **BFS(너비 우선 탐색)**: 가까운 노드부터 방문하려면 "발견한 순서대로 처리"해야 한다.
- **작업 큐**: 프린터 대기열, 서버의 요청 대기열, 메시지 큐(생산자-소비자).
- **버퍼링**: 스트리밍 데이터, 이벤트 루프의 태스크 큐.
- **Deque**: 슬라이딩 윈도우 최댓값(단조 덱), undo/redo 기록 제한, 작업 훔치기(work stealing) 스케줄러.

### BFS 예시

```ts
const q = new Queue<string>();
const visited = new Set<string>(["A"]);
q.enqueue("A");
while (!q.isEmpty()) {
  const cur = q.dequeue()!;
  for (const next of graph[cur]) {
    if (!visited.has(next)) { visited.add(next); q.enqueue(next); }
  }
}
```

### 작업 큐 예시

```ts
const jobs = new Queue<() => void>();
jobs.enqueue(() => console.log("메일 발송"));
jobs.enqueue(() => console.log("썸네일 생성"));
while (!jobs.isEmpty()) jobs.dequeue()!(); // 들어온 순서대로 실행
```

## 3. 구현 방식 설명

### 왜 `Array.shift()`는 O(n)인가

배열은 연속된 메모리에 원소를 놓는다. 맨 앞 원소를 지우면 0번 자리가 비므로, 나머지 원소를 한 칸씩 앞으로 당겨야 한다 (`[a,b,c,d] -> [b,c,d]`에서 b, c, d가 모두 이동). 원소가 n개면 n-1번 이동하므로 O(n)이다. (일부 JS 엔진은 작은 배열에 최적화를 하지만 보장되지 않으며, 큰 배열에서는 느려진다.) 큐에서 `dequeue`를 n번 하면 O(n²)이 된다.

### 원형 버퍼가 필요한 이유

"앞 원소를 지울 때 이동하지 말고, 앞을 가리키는 `head` 위치만 한 칸 옮기자"가 아이디어다. 그런데 그냥 `head`만 계속 증가시키면 배열 앞쪽에 쓰지 못하는 빈 공간이 쌓인다. 그래서 배열의 끝과 처음을 이어 붙인 고리처럼 취급한다 (인덱스를 `% capacity`로 감는다).

상태는 세 가지뿐이다.

- `buffer`: 고정 크기 배열
- `head`: 맨 앞 원소의 위치
- `count`: 원소 수

논리 인덱스 `i`의 실제 위치는 `(head + i) % capacity`이다.

```
capacity=4, 논리 순서 [3,4,5,6], head=2 (wrap-around)
index:   0  1  2  3
buffer: [5, 6, 3, 4]
               ^head
```

- `enqueue`: `buffer[(head + count) % cap] = x; count++`
- `dequeue`: `x = buffer[head]; head = (head + 1) % cap; count--`
- `pushFront`: `head = (head - 1 + cap) % cap; buffer[head] = x; count++`
- `popBack`: `idx = (head + count - 1) % cap`의 값을 꺼내고 `count--`

### 확장(resize)

`count === capacity`이면 용량을 2배로 만든 새 배열을 만들고, 원소를 **논리 순서대로** 새 배열 앞쪽에 복사한 뒤 `head = 0`으로 되돌린다. 이 복사는 O(n)이지만 용량이 2배씩 커지므로 n번의 삽입 전체에서 복사 횟수 합은 n + n/2 + n/4 + ... < 2n이다. 그래서 삽입 한 번당 분할상환(amortized) O(1)이다.

### 코드 구조

`CircularBuffer<T>`(내부 클래스)가 위 로직을 담고, `Queue<T>`는 `enqueue/dequeue/peek`, `Deque<T>`는 양끝 연산과 `get`만 공개한다. 한 파일에서 둘 다 export한다.

## 4. 연산별 시간·공간 복잡도

| 연산 | 시간 | 비고 |
| --- | --- | --- |
| `enqueue` / `pushBack` / `pushFront` | 분할상환 O(1) | resize 시 최악 O(n) |
| `dequeue` / `popFront` / `popBack` | O(1) | |
| `peek` / `peekFront` / `peekBack` / `get` | O(1) | |
| `size` / `isEmpty` / `capacity` | O(1) | |
| `clear` | O(1) | 새 배열을 할당 (GC 비용 별도) |
| `toArray` / 순회 | O(n) | |
| (비교) `Array.shift()` 기반 dequeue | O(n) | |

공간 복잡도: 전체 O(n) (용량은 원소 수의 최대 2배 이내, 단 줄어들지는 않음). `toArray`는 추가 O(n), iterator는 추가 O(1).

## 5. TypeScript로 구현할 때의 장단점·주의점

- **제네릭**: `Queue<number>`처럼 원소 타입을 컴파일 시점에 검사할 수 있다.
- **빈 상태 표현**: 비어 있을 때 `undefined`를 반환한다. 그래서 `Queue<number | undefined>`처럼 `undefined`를 원소로 넣으면 `dequeue()` 결과만으로는 빈 큐와 구분할 수 없다. 이때는 `size`/`isEmpty()`로 확인한다.
- **내부 배열 타입**: 빈 칸 때문에 `(T | undefined)[]`로 선언하고, 꺼낼 때 `as T`로 단언한다. 단언은 `count`로 유효 범위를 보장하기 때문에 안전하다.
- **메모리 해제**: 꺼낸 자리를 `undefined`로 덮어써야 객체 참조가 남아 GC가 회수하지 못하는 문제를 막는다.
- **희소 배열**: `new Array(n)`은 구멍(hole) 배열이다. 접근은 문제없지만 엔진이 느린 모드로 처리할 수 있어 대규모 성능이 중요하면 `fill`을 고려한다.
- **`%` 연산과 음수**: JS의 `%`는 음수 결과가 나올 수 있어 `pushFront`에서 `(head - 1 + cap) % cap`처럼 `cap`을 더해 준다.
- **축소 없음**: 한 번 커진 버퍼는 줄이지 않는다. 필요하면 `size`가 `capacity`의 1/4 이하일 때 절반으로 줄이는 로직을 추가할 수 있다.
- **대안**: 정말 단순한 용도라면 연결 리스트로도 O(1) 큐를 만들 수 있지만, 노드 할당과 포인터 때문에 보통 원형 버퍼가 캐시 효율이 좋고 빠르다.
