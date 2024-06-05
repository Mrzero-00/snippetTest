import fs from "fs";
import path from "path";

import { defineCommand } from "@toktokhan-fe/cli";

/**
 * 플러그인의 config 타입을 정의합니다.
 *
 * - tok-cli.config.ts 에서 해당 플러그인의 option 을 정의할 때 사용됩니다.
 * - config 파일은 js, ts 이기 때문에, 옵션 객체의 각 property 는 함수, 배열 등 어떤 타입이든 정의 가능합니다.
 * - run 함수의 인자 type 으로 사용됩니다.
 */
export type GenTxtConfig = {
  output: string;
};

interface snippetType {
  prefix: string;
  body: string[];
  description: string;
}

function parseSnippets(snippetString: string) {
  const snippets = snippetString
    .split("/**")
    .filter((s) => s.trim().startsWith("* @prefix"));
  return snippets.map((snippet) => {
    const prefixMatch = snippet.match(/\* @prefix\s+(\w+)/);
    const descriptionMatch = snippet.match(/\* @description\s+([^\*]+)/);
    const codeMatch = snippet.match(/\* @code\s+([^*]+)/);

    return {
      prefix: prefixMatch ? prefixMatch[1].trim() : "",
      description: descriptionMatch ? descriptionMatch[1].trim() : "",
      code: codeMatch ? codeMatch[1].trim() : "",
    };
  });
}

function formatSnippets(snippetArray) {
  const formatted = {};
  snippetArray.forEach((snippet) => {
    formatted[snippet.prefix] = {
      prefix: snippet.prefix,
      body: [snippet.code],
      description: snippet.description,
    };
  });
  return formatted;
}

export const genTxt = defineCommand<"gen:txt", GenTxtConfig>({
  /**
   * 플러그인의 이름을 정의합니다.
   *
   * - tokript {command} 로 실행됩니다.
   * - tok-cli.config 에서 옵션 정의시 해당 옵션의 key 값으로 사용됩니다.
   */
  name: "gen:txt",
  /**
   * 플러그인의 설명을 정의합니다.
   *
   * - tokript help 실행시 표기됩니다.
   */
  description: "텍스트 파일을 생성합니다.",
  /**
   * 플러그인 실행시 사용할 config 의 기본값을 정의합니다.
   *
   * - 특정 옵션이 `--output` 과 같은 `cli option` 이나 `tok-cli.config.ts` 에 정의 되지 않았을 때 사용됩니다.
   */
  default: {
    output: path.resolve("generated", "my.txt"),
  },
  /**
   * --output, -o 와 같은 cli option 을 정의합니다.
   *
   * - cli option 에 정의되지 않은 옵션은 오직 config 파일에서만 정의 가능합니다.
   * - cli option 은 원시값, 원시값 배열과 같은 간단한 값만 사용 가능합니다. ex) string, string[]
   * - tokript help {command} 시 정의한 alias, 설명, 기본값을 확인할 수 있습니다.
   */
  cliOptions: [
    {
      name: "output",
      alias: "o",
      description: "텍스트 파일 생성 경로",
      type: "string",
    },
  ],
  /**
   * 플러그인 실행 함수를 정의합니다.
   *
   * - config: GenTxtConfig 타입의 config 객체가 인자로 넘어옵니다.
   * - config 객체는 default, cli option, tok-cli.config.ts 에 정의된 값들이 합쳐진 값입니다.
   * - config 우선순위는 cli option > tok-cli.config.ts > default 입니다.
   * - run 함수는 플러그인의 실제 동작을 정의합니다.
   */
  run: (config) => {
    const data = fs.readFileSync("customSnippets.ts", { encoding: "utf8" });
    const formattedSnippets = formatSnippets(parseSnippets(data));

    const projectRoot = process.cwd();
    const outputPath = path.join(
      projectRoot,
      ".vscode",
      "project.code-snippets"
    );

    fs.mkdir(path.dirname(outputPath), { recursive: true }, (err) => {
      if (err) throw err;

      fs.writeFile(
        outputPath,
        JSON.stringify(formattedSnippets, null, 2),
        (err) => {
          if (err) throw err;
          console.log("Snippets saved to .vscode/project.code-snippets");
        }
      );
    });
  },
});
