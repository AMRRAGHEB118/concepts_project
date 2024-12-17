import execute from "./parser.js";

export default function program(strings) {
  const globalContext = {};
  for (let i = 0; i < strings.length; i++) execute(strings[i], globalContext);
}
