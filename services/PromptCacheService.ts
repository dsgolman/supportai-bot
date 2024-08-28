export class PromptCacheService {
  private cache: Map<string, string>;

  constructor() {
    this.cache = new Map<string, string>();
  }

  setPrompt(key: string, prompt: string): void {
    this.cache.set(key, prompt);
  }

  getPrompt(key: string): string | undefined {
    return this.cache.get(key);
  }

  hasPrompt(key: string): boolean {
    return this.cache.has(key);
  }
}
