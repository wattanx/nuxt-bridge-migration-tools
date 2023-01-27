import { Project, ts } from "ts-morph";
import { test, expect } from "vitest";
import { convertCapi } from "./convert-capi";

test("API that does not exist in bridge is being converted.", () => {
  const script = `
  import { 
    defineComponent,
    ref,
    useContext,
    useStore,
    useAsync,
    useFetch
  } from '@nuxtjs/composition-api';
  export default defineComponent({
    setup(props, { emit }) {
      emit('change');
    }
  })
  `;

  const project = new Project({ tsConfigFilePath: "tsconfig.json" });
  const sourceFile = project.createSourceFile("test.ts", script);

  sourceFile.formatText({
    indentSize: 2,
  });

  const { importSpecifiers } = convertCapi(sourceFile);

  expect(importSpecifiers).toEqual([
    "defineComponent",
    "ref",
    "useNuxtApp",
    "useLazyAsyncData",
    "useLazyFetch",
  ]);

  expect(sourceFile.getFullText())
    .toBe(`import { defineComponent, ref, useNuxtApp, useLazyAsyncData, useLazyFetch } from "#imports";

export default defineComponent({
  setup(props, { emit }) {
    emit('change');
  }
})
`);
});
