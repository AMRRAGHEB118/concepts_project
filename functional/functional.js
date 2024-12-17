import generateAST from "./ast.js";
import evaluate from "./evaluate.js";

export default function program() {
  return { generateAST, evaluate };
}
