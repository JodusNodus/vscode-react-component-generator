import { ExtensionContext, commands } from "vscode";
import { ComponentGenerator } from "./component-generator";

export function activate(context: ExtensionContext) {
  const generator = new ComponentGenerator();
  let disposable = commands.registerCommand(
    "extension.generateComponent",
    ({ path }: { path: string }) => {
      generator.execute(path);
    }
  );

  context.subscriptions.push(disposable);
  context.subscriptions.push(generator);
}

export function deactivate() {}
