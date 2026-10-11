# 스택 (Stack)

## 1. 추상 자료형(ADT) 정의

스택은 **한쪽 끝(top)에서만** 삽입·삭제가 일어나는 **LIFO(Last In, First Out)** 컬렉션이다.

| 연산 | 사전 조건 | 사후 조건 |
| --- | --- | --- |
| `push(x)` | 없음 | x가 top이 되고 `size`가 1 증가 |
| `pop()` | 없음 (빈 스택이면 `undefined` 반환) | 비어 있지 않았다면 top이 제거되어 반환되고 `size`가 1 감소. 비어 있었다면 상태 불변 |
| `peek()` | 없음 (빈 스택이면 `undefined` 반환) | 상태 불변, top 반환 |
| `size` | 없음 | 원소 개수 반환, 상태 불변 |
| `isEmpty()` | 없음 | `size === 0` 여부 반환 |
| `clear()` | 없음 | `size === 0` |
| `toArray()` | 없음 | top → bottom 순서의 복사본 배열 반환, 상태 불변 |
| `[Symbol.iterator]` | 없음 | top → bottom 순으로 순회, 상태 불변 |

불변식: `push(x)` 직후 `peek()`은 x이고, 직후 `pop()`은 push 직전 상태로 되돌린다.

## 2. 왜 쓰는가

"가장 최근에 들어온 것을 가장 먼저 처리"해야 하는 문제에 맞는다.

- **호출 스택**: 함수를 호출하면 복귀 주소와 지역 변수가 담긴 프레임이 push되고, 반환하면 pop된다. 재귀가 너무 깊으면 스택이 가득 차 `RangeError: Maximum call stack size exceeded`(스택 오버플로)가 발생한다.
- **괄호 검사**: 여는 괄호는 push, 닫는 괄호를 만나면 pop하여 짝이 맞는지 확인한다. 끝났을 때 스택이 비어 있어야 올바른 식이다. (`stack.test.ts`에 구현 예)
- 그 외: 실행 취소(undo), 브라우저 뒤로 가기, DFS 반복 구현, 후위 표기식 계산.

```ts
const stack = new Stack<string>();
for (const ch of "{[()]}") {
  if ("([{".includes(ch)) stack.push(ch);
  else stack.pop(); // 실제로는 짝이 맞는지 비교해야 한다
}
stack.isEmpty(); // true
```

## 3. 구현 방식

내부에 배열 `items`를 두고 **배열의 끝을 top**으로 사용한다.

- `push` → `Array.prototype.push`, `pop` → `Array.prototype.pop`, `peek` → `items[length - 1]`.
- 배열 앞쪽을 top으로 쓰면 `unshift/shift`가 모든 원소를 밀어야 해서 O(n)이 되므로 끝을 쓰는 것이 핵심이다.
- `toArray`와 이터레이터는 top → bottom 순서를 위해 뒤에서부터 읽는다. 이터레이터는 원본을 변경하지 않는다.

## 4. 시간·공간 복잡도

| 연산 | 시간 | 추가 공간 |
| --- | --- | --- |
| `push` | O(1) 분할 상환 (배열 확장 시 일시적으로 O(n)) | O(1) |
| `pop` | O(1) | O(1) |
| `peek` | O(1) | O(1) |
| `size` | O(1) | O(1) |
| `isEmpty` | O(1) | O(1) |
| `clear` | O(1) (새 배열 할당) | O(1) |
| `toArray` | O(n) | O(n) |
| 순회 | O(n) | O(1) |

전체 저장 공간은 O(n)이다.

## 5. TypeScript 구현 시 장단점·주의점

- **장점**: JS 배열이 동적 크기와 분할 상환 O(1) `push/pop`을 제공해 구현이 매우 간단하다. 제네릭 `Stack<T>`으로 원소 타입을 컴파일 시점에 검사한다.
- **빈 스택과 `undefined`**: `pop()`이 `T | undefined`를 반환하므로 호출부에서 처리해야 한다(strict 모드가 이를 강제). `T`에 `undefined`를 넣으면 "비어 있음"과 구분되지 않으므로 `size`/`isEmpty()`로 확인한다.
- **캡슐화**: `items`를 `private`으로 둬서 외부에서 중간 원소를 건드리지 못하게 한다. 단 `private`은 컴파일 시점 검사일 뿐이며 런타임에는 접근 가능하다(엄격히 막으려면 `#items`).
- **`toArray`는 복사본**이므로 결과를 수정해도 스택에 영향이 없다. 대신 O(n) 비용이 든다.
- **고정 용량 없음**: 메모리가 허용하는 한 커진다. 용량 제한이 필요하면 `push`에서 직접 검사해야 한다.
- **`clear`**: 새 배열을 할당해 이전 원소의 참조를 해제하므로 GC가 회수할 수 있다.
