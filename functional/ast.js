const KEYWORDS = ["let", "if", "while", "print"];

const TOKENS = [
  {
    regex: /^\s+/,
    type: null,
  },
  {
    regex: /^\/\/.*/,
    type: null,
  },
  {
    regex: /^(if)\s*\(([^\)]+)\)\s*{([^}]*)}/,
    type: "CONDITIONALSTATEMENT",
  },
  {
    regex: /^(while)\s*\(([^\)]+)\)\s*{([^}]*)}/,
    type: "CONDITIONALSTATEMENT",
  },
  {
    regex: /^([^;]*);/,
    type: "EXPRESSION",
  },
  {
    regex: /^print\(([^)]*)\)$/,
    type: "PRINTEXPRESSION",
  },
  {
    regex: /^(let\s+|)([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/,
    type: "ASSIGNMENTEXPRESSION",
  },
  {
    regex: /^(.*)\s*([\+-])\s*([^\+-]*)$/,
    type: "BINARYEXPRESSION",
  },
  {
    regex: /^(.*)\s*([\*\/])\s*([^\*\/]*)$/,
    type: "BINARYEXPRESSION",
  },
  {
    regex: /^(.*)\s*(==|!=|<=|>=|<|>)\s*(.*)$/,
    type: "BINARYEXPRESSION",
  },
  {
    regex: /^[a-zA-z_][a-zA-Z0-9_]*\s*$/,
    type: "VARIABLE",
  },
  {
    regex: /^\d+(\.\d+)?\s*$/,
    type: "NUMBER",
  },
  {
    regex: /^"[^"]*"\s*$/,
    type: "STRING",
  },
  {
    regex: /^'[^']*'\s*$/,
    type: "STRING",
  },
  {
    regex: /^$/,
    type: "EOF",
  },
];

/**
 * Program
 * : Statement
 * | Expression
 * | Program Program
 * ;
 *
 * Statement
 * : IfStatement
 * ;
 *
 * IfStatement
 * : "if" "(" Expression ")" "{" Program "}"
 * ;
 *
 * Expression
 * : Assignment
 * | Addition
 * | Multiplication
 * ;
 *
 * Assignment
 * : "let" Identifier "=" Expression ";"
 * ;
 *
 * Addition
 * : Literal "+" Literal ";"
 * | Literal "-" Literal ";"
 * | Literal "+" Addition
 * | Literal "-" Addition
 * ;
 */
export default function generateAST(string) {
  return {
    type: "Program",
    body: getASTList(string, []),
  };
}

function getASTList(string, list) {
  const { ast, new_string } = parse(string);
  if (ast) return getASTList(new_string, list.concat([ast]));
  else return list;
}

function parse(string) {
  function traverse(token_list) {
    if (token_list.length == 0)
      throw new Error(`Invalid Syntax: (${string})\nAre you missing a ";"`);

    const token = token_list[0];
    const match = token.regex.exec(string.trim());
    if (match) return tokenizeMatch(match, token);
    else return traverse(token_list.slice(1));
  }
  return traverse(TOKENS);
}

function tokenizeMatch(match, token) {
  const result = { new_string: match.input.slice(match[0].length) };

  switch (token.type) {
    case null:
      return parse(result.new_string);

    case "EOF":
      result.ast = null;
      break;

    case "VARIABLE":
      if (KEYWORDS.includes(match[0]))
        throw new Error(`Syntax Error: Keyword (${match[0]}) Unavailable`);
      result.ast = { type: token.type, value: match[0] };
      break;

    case "NUMBER":
      result.ast = { type: token.type, value: Number(match[0]) };
      break;

    case "STRING":
      result.ast = { type: token.type, value: match[0] };
      break;

    case "BINARYEXPRESSION":
      result.ast = {
        type: token.type,
        operator: match[2],
        left: parse(match[1]).ast,
        right: parse(match[3]).ast,
      };
      break;

    case "ASSIGNMENTEXPRESSION":
      result.ast = {
        type: token.type,
        define: match[1] != "",
        left: parse(match[2]).ast,
        right: parse(match[3]).ast,
      };
      break;

    case "PRINTEXPRESSION":
      result.ast = {
        type: token.type,
        value: parse(match[1]).ast,
      };
      break;

    case "EXPRESSION":
      result.ast = { type: token.type, body: parse(match[1]).ast };
      break;

    case "CONDITIONALSTATEMENT":
      result.ast = {
        type: token.type,
        keyword: match[1].toUpperCase(),
        condition: parse(match[2]).ast,
        statement: getASTList(match[3], []),
      };
      break;

    default:
      throw new Error(`Invalid Token Found: ${token}`);
  }
  return result;
}
