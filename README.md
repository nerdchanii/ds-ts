# ds-ts

TypeScript로 직접 구현하며 공부하는 자료구조 모음집.

## 자료구조집 (`src/adt/`)

각 폴더에 구현, 테스트, 해설(README)이 있음. 해설은 ADT 정의, 동기, 구현, 복잡도, TypeScript 주의점 순서.

| 자료구조 | 핵심 | 위치 |
| --- | --- | --- |
| Stack | LIFO, 배열 끝에서만 입출력 | [src/adt/stack](src/adt/stack/README.md) |
| Queue / Deque | FIFO, 원형 버퍼로 `shift()`의 O(n) 회피 | [src/adt/queue](src/adt/queue/README.md) |
| Linked List | 단일/이중 연결, 삽입·삭제는 포인터 교체 | [src/adt/linked-list](src/adt/linked-list/README.md) |
| Dynamic Array | 용량 2배 확장으로 amortized O(1) push | [src/adt/dynamic-array](src/adt/dynamic-array/README.md) |
| Hash Map | 체이닝 + 리해싱으로 평균 O(1) 조회 | [src/adt/hash-map](src/adt/hash-map/README.md) |
| Heap / Priority Queue | 배열로 만든 완전 이진 트리, 최솟값 O(log n) | [src/adt/heap](src/adt/heap/README.md) |
| Binary Search Tree | 정렬 불변식, 순회, 삭제 3가지 경우 | [src/adt/binary-search-tree](src/adt/binary-search-tree/README.md) |
| Graph | 인접 리스트, BFS/DFS, 다익스트라, 위상 정렬 | [src/adt/graph](src/adt/graph/README.md) |
| Trie | 접두사 질의, 자동완성 | [src/adt/trie](src/adt/trie/README.md) |
| Union-Find | 경로 압축 + 크기 기반 합치기 | [src/adt/union-find](src/adt/union-find/README.md) |

## 실행

```bash
yarn install
yarn test              # vitest (watch)
npx vitest run src/adt # 자료구조집만 한 번 실행
```

## 원칙

- 외부 의존성 없음, 자료구조끼리 서로 import하지 않음
- TypeScript strict, 제네릭 사용
- 재귀 깊이가 문제될 곳은 반복문으로 구현하고 테스트로 확인
