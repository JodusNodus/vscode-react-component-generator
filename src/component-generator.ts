import * as path from "path";
import * as fs from "fs";
import { promisify } from "./utils";

const fsExists = promisify<boolean>(fs.exists);
const fsMkdir = promisify<void>(fs.mkdir);
const fsReadFile = promisify<string>(fs.readFile);
const fsWriteFile = promisify<void>(fs.writeFile);

import { InputBoxOptions, window, Uri, workspace, commands } from "vscode";
import { IDisposable } from "./disposable.interface";
import {
  TEMPLATES,
  TEMPLATE_PATH,
  COMPONENT_REPLACEMENT_KEY,
  FILE_ENCODING
} from "./constants";
import { AlreadyExistsError } from "./errors";

export class ComponentGenerator implements IDisposable {
  async execute(folderPath: string): Promise<void> {
    const componentName: string | undefined = await prompt();
    if (!componentName) {
      return;
    }

    try {
      await createComponentFiles(folderPath, componentName);

      window.showInformationMessage(
        `Component: '${componentName}' successfully created`
      );
    } catch (err) {
      if (err instanceof AlreadyExistsError) {
        window.showErrorMessage(
          `Component folder '${componentName}' already exists`
        );
      } else {
        window.showErrorMessage(`Error: ${err.message}`);
      }
    }
  }

  dispose(): void {
    console.log("disposing...");
  }
}

async function prompt(): Promise<string | undefined> {
  const options: InputBoxOptions = {
    ignoreFocusOut: true,
    prompt: `Component name`,
    placeHolder: "E.g. UserOverview",
    validateInput: validateInput
  };

  return await window.showInputBox(options);
}

function validateInput(name: string): string | null {
  if (!name) {
    return "Name is required";
  }
  if (name.includes(" ")) {
    return "Spaces are not allowed";
  }
  return null;
}

async function createComponentFiles(folderPath: string, componentName: string) {
  const componentFolderPath: string = path.join(folderPath, componentName);

  if (await fsExists(componentFolderPath)) {
    const duck: string = path.basename(componentFolderPath);
    throw new AlreadyExistsError(`'${duck}' already exists`);
  }

  await fsMkdir(componentFolderPath);

  const [mainComponentFilePath] = await Promise.all(
    TEMPLATES.map(file =>
      createComponentFile(file, componentName, componentFolderPath)
    )
  );
  commands.executeCommand("workbench.files.action.refreshFilesExplorer");

  const openPath = Uri.parse(mainComponentFilePath);
  const doc = await workspace.openTextDocument(openPath);
  await window.showTextDocument(doc);
}

async function createComponentFile(
  file: string,
  componentName: string,
  componentFolderPath: string
) {
  const templatePath = path.join(__dirname, TEMPLATE_PATH, file);
  const templateContent = await fsReadFile(templatePath, FILE_ENCODING);
  const fileContent = parseTemplate(componentName, templateContent);
  const fileName = file
    .replace(COMPONENT_REPLACEMENT_KEY, componentName)
    .replace(".template", "");
  const filePath = path.join(componentFolderPath, fileName);
  await fsWriteFile(filePath, fileContent, FILE_ENCODING);
  return filePath;
}

function parseTemplate(componentName: string, content: string) {
  const regexp = new RegExp(`\{{2}${COMPONENT_REPLACEMENT_KEY}\}{2}`, "g");
  return content.replace(regexp, componentName);
}
