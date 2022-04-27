/*
 * This library is heavily based on https://github.com/RangerMauve/xterm-js-shell,
 * under the MIT license. This library is re-licensed under the same.
 */

import { parseArgsStringToArgv } from "string-argv";
import { Terminal } from "xterm";
import LocalEchoController from "local-echo";

/**
 * A callback for a command. Executed when the user types the command.
 * @param shell A handler to interact with the user's terminal
 * @param command The command that triggered this handler
 * @param argv List of arguments, *not* including the command name
 */
type CommandHandler = (
  shell: SubShell,
  command: string,
  argv: string[]
) => Promise<void>;

/** Shell abstraction for Xterm.js */
export class XtermShell {
  private readonly echo: LocalEchoController;
  private readonly commandHandlers: Map<string, CommandHandler> = new Map();
  private globalCommandHandler: CommandHandler | undefined = undefined;
  private prompt: string = "$ ";

  /**
   * Instantiate and attach a shell to the terminal
   * @param term The xterm.js terminal
   */
  public constructor(private readonly term: Terminal) {
    this.echo = new LocalEchoController(this.term);
    // this.attach();
  }

  /**
   * Set the prompt printed after each command
   * @param prompt String to print
   * @returns this
   */
  public setPrompt(prompt: string): this {
    this.prompt = prompt;
    return this;
  }

  /**
   * Add a command to the shell
   * @param  command The name of the command
   * @param  handler Async callback, executed when the command is called
   * @returns this
   */
  public addCommand(command: string, handler: CommandHandler): this {
    if (this.commandHandlers.has(command)) {
      throw new Error(`Command already registered: ${command}`);
    }

    this.commandHandlers.set(command, handler);
    return this;
  }

  /**
   * Register a single handler that will be called for *all* commands. Use this
   * if you want to handle all command dispatch yourself. *If a global command
   * handler is set, other registered command handlers will still be called.*
   *
   * @param handler The handler to call for *all* commands
   * @returns this
   */
  public addGlobalCommandHandler(handler: CommandHandler): this {
    this.globalCommandHandler = handler;
    return this;
  }

  /**
   * Attach the shell to xterm.js
   */
  public attach(): void {
    this.echo.attach();
  }

  /**
   * Detach the shell from xterm.js
   */
  public detach(): void {
    this.echo.detach();
  }

  /**
   * Read-eval-print-loop, run this to start the shell
   * @returns Resolves after a pass of the loop finishes
   */
  public async repl(): Promise<void> {
    // Read
    const prompt = await this.prompt;
    const line = await this.echo.read(prompt);

    const argv = parseArgsStringToArgv(line);
    const command = argv.shift();

    // Don't do anything for empty lines
    if (command) {
      try {
        // Eval / Print
        await this.run(command, argv);
      } catch (e) {
        await this.echo.println(
          e instanceof Error ? e.message : "Unknown error"
        );
      }
    }

    // Loop
    this.repl();
  }

  /**
   * Run a command in the shell
   * @param command The name of the command to run
   * @param args The list of command arguments to run
   * @returns Resolves after the command has finished
   */
  private async run(command: string, args: string[]): Promise<void> {
    const handlers: CommandHandler[] = [];

    // Check for a global handler
    if (this.globalCommandHandler) {
      handlers.push(this.globalCommandHandler);
    }

    // Check for a command-specific handler
    const handler = this.commandHandlers.get(command);
    if (handler) {
      handlers.push(handler);
    }

    if (handlers.length > 0) {
      const shell = new SubShell(this.echo);
      try {
        // Call all handlers *in parallel*
        await Promise.all(
          handlers.map((handler) => handler(shell, command, args))
        );
      } finally {
        shell.destroy();
      }
    } else {
      throw new Error(`Unknown command: ${command}`);
    }
  }
}

export class SubShell {
  /**
   * Flag to make sure we don't output the terminal after the command has
   * terminated.
   */
  private destroyed: boolean = false;

  public constructor(private readonly echo: LocalEchoController) {}

  public async readLine(message: string): Promise<void> {
    this.checkDestroyed();
    await this.echo.read(message);
  }

  public async abortRead(reason: string): Promise<void> {
    this.checkDestroyed();
    await this.echo.abortRead(reason);
  }

  public async print(message: string): Promise<void> {
    this.checkDestroyed();
    await this.echo.print(message);
  }

  public async printLine(message: string): Promise<void> {
    this.checkDestroyed();
    await this.echo.println(message);
  }

  public destroy(): void {
    this.destroyed = true;
  }

  private checkDestroyed(): void {
    if (this.destroyed) {
      throw new Error("Terminal destroyed");
    }
  }
}
