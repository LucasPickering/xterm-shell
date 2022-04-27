# Xterm.js Shell

A simple shell intended to be used with [xterm.js](https://www.npmjs.com/package/xterm). Based heavily on [xterm-js-shell](https://github.com/RangerMauve/xterm-js-shell). Built to be used with [osrs-cli](https://github.com/LucasPickering/osrs-cli).

This repo isn't my finest work, I just hacked it together to get the CLI working.

## Example Usage

```typescript
import { XtermShell } from "xterm-shell";

const shell = new XtermShell(terminal);
shell.setPrompt("> ").addGlobalCommandHandler(async (shell, command, args) => {
  shell.printLine(`command: ${command}; args: ${args.toString()}`);
});
shell.repl();
```

## Publishing

```sh
npm run build
npm publish
```
