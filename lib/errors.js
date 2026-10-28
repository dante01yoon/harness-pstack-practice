// 사용자에게 그대로 보여줄 오류. CLI는 이 오류만 메시지로 출력하고 나머지는 그대로 던진다.
export class HarnessError extends Error {
  constructor(message) {
    super(message);
    this.name = 'HarnessError';
  }
}
