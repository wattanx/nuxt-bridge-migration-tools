import { Node, SourceFile, StructureKind } from "ts-morph";

const capiMap = new Map([
  ["useContext", "useNuxtApp"],
  ["useStore", "useNuxtApp"],
  ["useAsync", "useLazyAsyncData"],
  ["useFetch", "useLazyFetch"],
  ["useMeta", "useHead"],
]);

export const convertCapi = (sourceFile: SourceFile) => {
  const importDeclarations = sourceFile.getImportDeclarations();

  const capiImportStatement = importDeclarations.find(
    (x) => x.getModuleSpecifier().getLiteralText() === "@nuxtjs/composition-api"
  );

  if (!capiImportStatement) {
    return {
      result: false,
    };
  }

  const namedImportNode = capiImportStatement
    .getImportClause()
    ?.getNamedBindings();

  if (!namedImportNode || !Node.isNamedImports(namedImportNode)) {
    return {
      result: false,
    };
  }

  const elements = namedImportNode.getElements();

  const importSpecifiers = [
    ...new Set(
      elements
        .map((x) => {
          const name = x.getName();
          if (capiMap.has(name)) {
            return capiMap.get(name) ?? "";
          }
          return name;
        })
        .filter(Boolean)
    ),
  ];

  capiImportStatement.remove();
  sourceFile.addImportDeclaration({
    moduleSpecifier: "#imports",
    namedImports: importSpecifiers.map((x) => ({
      name: x,
    })),
  });

  const result = true;
  return {
    result,
    importSpecifiers,
  };
};
