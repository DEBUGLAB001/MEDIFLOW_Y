/**
 * Operational Priority Queue implemented as a Binary Min-Heap.
 * Maintains deterministic emergency queue ordering based on clinical triage category
 * and patient arrival timestamps.
 */
export class PriorityQueue {
  constructor(comparator = PriorityQueue.defaultComparator) {
    this.heap = [];
    this.comparator = comparator;
  }

  /**
   * Deterministic triage comparison policy:
   * 1. Triage Category (1 is highest medical urgency, 5 is lowest)
   * 2. Arrival Timestamp tie-breaker
   * 3. Visit identifier tie-breaker
   */
  static defaultComparator(a, b) {
    if (a.triageCategory !== b.triageCategory) {
      return a.triageCategory - b.triageCategory;
    }

    const timeA = new Date(a.arrivalTime).getTime();
    const timeB = new Date(b.arrivalTime).getTime();

    if (timeA !== timeB) {
      return timeB - timeA;
    }

    return (a.id || '').localeCompare(b.id || '');
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  peek() {
    return this.heap.length > 0 ? this.heap[0] : null;
  }

  insert(item) {
    this.heap.push(item);
    this._siftUp(this.heap.length - 1);
  }

  extractMin() {
    if (this.isEmpty()) {
      return null;
    }
    const root = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._siftDown(0);
    }
    return root;
  }

  toArray() {
    // Return a sorted copy of the elements without destroying the heap
    const copy = [...this.heap];
    copy.sort((a, b) => this.comparator(a, b));
    return copy;
  }

  _siftUp(index) {
    let current = index;
    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);
      if (this.comparator(this.heap[current], this.heap[parent]) < 0) {
        this._swap(current, parent);
        current = parent;
      } else {
        break;
      }
    }
  }

  _siftDown(index) {
    let current = index;
    const length = this.heap.length;

    while (true) {
      let smallest = current;
      const left = 2 * current + 1;
      const right = 2 * current + 2;

      if (left < length && this.comparator(this.heap[left], this.heap[smallest]) < 0) {
        smallest = left;
      }

      if (right < length && this.comparator(this.heap[right], this.heap[smallest]) < 0) {
        smallest = right;
      }

      if (smallest !== current) {
        this._swap(current, smallest);
        current = smallest;
      } else {
        break;
      }
    }
  }

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }
}
