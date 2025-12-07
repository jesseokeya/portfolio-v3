/* eslint-disable @typescript-eslint/no-explicit-any */
import { visit } from "unist-util-visit";

export function rehypeMermaid() {
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (node.tagName === "pre") {
        const codeNode = node.children[0];
        if (
          codeNode &&
          codeNode.tagName === "code" &&
          codeNode.properties.className &&
          Array.isArray(codeNode.properties.className) &&
          codeNode.properties.className.includes("language-mermaid")
        ) {
          node.tagName = "div";
          node.properties.className = ["mermaid"];
          // We want the text content of the code node.
          // Usually code node has a single text child.
          if (codeNode.children && codeNode.children.length > 0 && codeNode.children[0].type === 'text') {
             node.children = [{ type: "text", value: codeNode.children[0].value }];
          }
        }
      }
    });
  };
}

