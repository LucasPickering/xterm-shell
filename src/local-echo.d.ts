/**
 * Type declarations for https://github.com/wavesoft/local-echo
 */
declare module "local-echo" {
  import type { Terminal } from "xterm";

  export interface IOptions {
    historySize?: number;
    maxAutocompleteEntries?: number;
  }

  export type AutocompleteCallback = (
    index: number,
    tokens: string[],
    ...args: unknown[]
  ) => void;

  export class HistoryController {}

  class LocalEchoController {
    public constructor(term?: Terminal, options?: IOptions);
    public activate(): void;
    public dispose(): void;
    public attach(): void;
    public detach(): void;
    public read(prompt: string, continuationPrompt?: string): Promise<string>;
    public readChar(prompt: string): Promise<string>;
    public abortRead(reason?: string): void;
    public print(message: string): void;
    public println(message: string): void;
    public printWide(items: string[], padding?: number): void;
    public addAutocompleteHandler(
      fn: AutocompleteCallback,
      ...args: unknown[]
    ): void;
    public removeAutocompleteHandler(fn: AutocompleteCallback): void;
  }
  export default LocalEchoController;
}
