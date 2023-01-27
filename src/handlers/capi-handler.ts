import { parse } from "@vue/compiler-sfc";
import { green } from "colorette";
import { readFile, writeFile } from "fs/promises";
import { Project } from "ts-morph";
import { convertCapi } from "../lib/convert-capi";
import { generateProgressBar } from "../lib/generateProgressBar";

export const capiHanler = async (
  targetFilePaths: string[],
  tsconfigPath: string
) => {
  const allFiles = await Promise.all(
    targetFilePaths.map(async (path) => {
      const fullText = await readFile(path, "utf8");
      const descriptor = parse(fullText).descriptor;
      const script = descriptor.script?.content ?? "";
      return {
        path,
        fullText,
        script,
      };
    })
  );

  const targetFiles = allFiles.filter((file) => file.script !== "");

  const progressBar = generateProgressBar(green);
  progressBar.start(targetFiles.length, 0);

  const project = new Project({ tsConfigFilePath: tsconfigPath });
  const targetFilesWithSourceFile = targetFiles.map((file) => {
    const sourceFile = project.createSourceFile(`${file.path}.ts`, file.script);

    return {
      ...file,
      sourceFile,
    };
  });

  let convertedCount = 0;
  for await (const file of targetFilesWithSourceFile) {
    const { result } = convertCapi(file.sourceFile);

    if (!result) {
      progressBar.increment();
      continue;
    }

    const newText = file.fullText.replace(
      file.script,
      file.sourceFile.getFullText()
    );

    await writeFile(file.path, newText);

    convertedCount += 1;
    progressBar.increment();
  }

  progressBar.stop();

  return {
    convertedCount,
  };
};
