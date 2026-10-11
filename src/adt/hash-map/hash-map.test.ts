import { describe, it, expect } from 'vitest';
import { HashMap, hashString, hashNumber } from './hash-map';

describe('HashMap 기본 동작', () => {
  it('set/get/has/delete', () => {
    const m = new HashMap<string, number>();
    m.set('a', 1).set('b', 2);
    expect(m.get('a')).toBe(1);
    expect(m.has('b')).toBe(true);
    expect(m.size).toBe(2);
    expect(m.delete('a')).toBe(true);
    expect(m.has('a')).toBe(false);
    expect(m.size).toBe(1);
  });

  it('같은 키 set은 값을 갱신하고 size는 그대로', () => {
    const m = new HashMap<string, number>();
    m.set('k', 1);
    m.set('k', 2);
    expect(m.get('k')).toBe(2);
    expect(m.size).toBe(1);
  });

  it('숫자/불린 키', () => {
    const m = new HashMap<number | boolean, string>();
    m.set(1, 'one').set(-5, 'neg').set(1.5, 'f').set(true, 'T').set(false, 'F');
    m.set(2 ** 40, 'big').set(NaN, 'nan');
    expect(m.get(1)).toBe('one');
    expect(m.get(-5)).toBe('neg');
    expect(m.get(1.5)).toBe('f');
    expect(m.get(true)).toBe('T');
    expect(m.get(false)).toBe('F');
    expect(m.get(2 ** 40)).toBe('big');
    expect(m.get(NaN)).toBe('nan');
  });

  it('0과 -0은 같은 키', () => {
    const m = new HashMap<number, string>();
    m.set(0, 'zero');
    expect(m.get(-0)).toBe('zero');
  });

  it('keys/values/entries/iterator', () => {
    const m = new HashMap<string, number>();
    m.set('x', 1).set('y', 2).set('z', 3);
    expect([...m.keys()].sort()).toEqual(['x', 'y', 'z']);
    expect([...m.values()].sort()).toEqual([1, 2, 3]);
    expect([...m.entries()].sort()).toEqual([['x', 1], ['y', 2], ['z', 3]]);
    expect([...m].length).toBe(3);
    const seen: string[] = [];
    for (const [k] of m) seen.push(k);
    expect(seen.sort()).toEqual(['x', 'y', 'z']);
  });

  it('기본 해시가 지원하지 않는 키 타입은 TypeError', () => {
    const m = new HashMap<object, number>();
    expect(() => m.set({}, 1)).toThrow(TypeError);
  });

  it('해시 함수는 결정적이고 문자열/숫자가 퍼진다', () => {
    expect(hashString('hello')).toBe(hashString('hello'));
    expect(hashString('ab')).not.toBe(hashString('ba'));
    expect(hashNumber(1)).not.toBe(hashNumber(2));
  });
});

describe('빈 상태와 경계', () => {
  it('빈 맵', () => {
    const m = new HashMap<string, number>();
    expect(m.isEmpty()).toBe(true);
    expect(m.size).toBe(0);
    expect(m.get('none')).toBeUndefined();
    expect(m.has('none')).toBe(false);
    expect(m.delete('none')).toBe(false);
    expect([...m]).toEqual([]);
  });

  it('값이 undefined여도 has는 true', () => {
    const m = new HashMap<string, number | undefined>();
    m.set('u', undefined);
    expect(m.has('u')).toBe(true);
    expect(m.get('u')).toBeUndefined();
  });

  it('clear 후 다시 사용 가능', () => {
    const m = new HashMap<number, number>();
    for (let i = 0; i < 100; i++) m.set(i, i);
    m.clear();
    expect(m.isEmpty()).toBe(true);
    expect(m.get(5)).toBeUndefined();
    m.set(5, 50);
    expect(m.get(5)).toBe(50);
  });

  it('잘못된 initialCapacity는 RangeError', () => {
    expect(() => new HashMap({ initialCapacity: 0 })).toThrow(RangeError);
    expect(() => new HashMap({ initialCapacity: 1.5 })).toThrow(RangeError);
  });

  it('용량 1에서도 동작', () => {
    const m = new HashMap<number, number>({ initialCapacity: 1 });
    for (let i = 0; i < 20; i++) m.set(i, i * 2);
    for (let i = 0; i < 20; i++) expect(m.get(i)).toBe(i * 2);
  });
});

describe('충돌 처리 (모든 키가 같은 해시)', () => {
  const makeMap = () => new HashMap<string, number>({ hash: () => 42, initialCapacity: 4 });

  it('전부 충돌해도 set/get/has가 정확', () => {
    const m = makeMap();
    for (let i = 0; i < 50; i++) m.set('k' + i, i);
    expect(m.size).toBe(50);
    for (let i = 0; i < 50; i++) expect(m.get('k' + i)).toBe(i);
    expect(m.has('nope')).toBe(false);
  });

  it('체인 머리/중간/꼬리 삭제', () => {
    const m = makeMap();
    ['a', 'b', 'c', 'd'].forEach((k, i) => m.set(k, i));
    // 머리 삽입이므로 d가 머리, a가 꼬리
    expect(m.delete('d')).toBe(true); // 머리
    expect(m.delete('b')).toBe(true); // 중간
    expect(m.delete('a')).toBe(true); // 꼬리
    expect([...m.keys()]).toEqual(['c']);
    expect(m.size).toBe(1);
  });

  it('충돌 키 갱신', () => {
    const m = makeMap();
    m.set('a', 1).set('b', 2).set('a', 3);
    expect(m.get('a')).toBe(3);
    expect(m.size).toBe(2);
  });

  it('음수/소수 해시 값도 안전', () => {
    const m = new HashMap<number, number>({ hash: (k) => -k * 1.5 });
    for (let i = 0; i < 30; i++) m.set(i, i);
    for (let i = 0; i < 30; i++) expect(m.get(i)).toBe(i);
  });
});

describe('커스텀 equals', () => {
  it('객체 키를 hash/equals로 다룬다', () => {
    type P = { x: number; y: number };
    const m = new HashMap<P, string>({
      hash: (p) => hashString(`${p.x},${p.y}`),
      equals: (a, b) => a.x === b.x && a.y === b.y,
    });
    m.set({ x: 1, y: 2 }, 'A');
    expect(m.get({ x: 1, y: 2 })).toBe('A');
    expect(m.get({ x: 2, y: 1 })).toBeUndefined();
  });

  it('대소문자 무시 문자열 키', () => {
    const m = new HashMap<string, number>({
      hash: (s) => hashString(s.toLowerCase()),
      equals: (a, b) => a.toLowerCase() === b.toLowerCase(),
    });
    m.set('Hello', 1);
    expect(m.get('HELLO')).toBe(1);
    m.set('hello', 2);
    expect(m.size).toBe(1);
  });
});

describe('리해싱', () => {
  it('부하율 0.75 초과 시 버킷 2배', () => {
    const m = new HashMap<number, number>({ initialCapacity: 8 });
    for (let i = 0; i < 6; i++) m.set(i, i); // 6/8 = 0.75, 아직 리해싱 안 함
    expect(m.capacity).toBe(8);
    m.set(6, 6); // 7/8 > 0.75
    expect(m.capacity).toBe(16);
    expect(m.loadFactor).toBeLessThanOrEqual(0.75);
  });

  it('리해싱 후에도 모든 데이터 보존', () => {
    const m = new HashMap<string, number>({ initialCapacity: 2 });
    for (let i = 0; i < 1000; i++) m.set('key-' + i, i);
    expect(m.capacity).toBeGreaterThan(2);
    expect(m.size).toBe(1000);
    for (let i = 0; i < 1000; i++) expect(m.get('key-' + i)).toBe(i);
    expect(m.loadFactor).toBeLessThanOrEqual(0.75);
  });

  it('충돌 해시 + 리해싱 조합에서도 보존', () => {
    const m = new HashMap<number, number>({ hash: () => 7, initialCapacity: 2 });
    for (let i = 0; i < 100; i++) m.set(i, i);
    expect(m.capacity).toBeGreaterThan(2);
    for (let i = 0; i < 100; i++) expect(m.get(i)).toBe(i);
  });
});

describe('많은 데이터', () => {
  it('10만 개 삽입/조회/삭제', () => {
    const N = 100000;
    const m = new HashMap<number, number>();
    for (let i = 0; i < N; i++) m.set(i, i * 2);
    expect(m.size).toBe(N);
    for (let i = 0; i < N; i += 997) expect(m.get(i)).toBe(i * 2);
    for (let i = 0; i < N; i += 2) expect(m.delete(i)).toBe(true);
    expect(m.size).toBe(N / 2);
    expect(m.has(2)).toBe(false);
    expect(m.get(3)).toBe(6);
    expect([...m.keys()].length).toBe(N / 2);
  });
});
