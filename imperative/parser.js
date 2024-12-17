// Tokenize the input string
function tokenize(input) {
  const tokens = input.match(
    /[a-zA-Z_][a-zA-Z_0-9]*|\d+|==|!=|<=|>=|[+\-*/=(){}<>!]|if|while|let|\S/g,
  );
  if (!tokens) throw new Error("Invalid input");
  return tokens;
}

// Parsing Expressions
function parseExpression(tokens) {
  let position = 0;

  function parse() {
    let expression;

    if (tokens[position] === "(") {
      position++;
      expression = parse();
      if (tokens[position] !== ")") throw new Error("Expected )");
      position++;
    } else if (/^\d+$/.test(tokens[position])) {
      expression = { type: "Number", value: Number(tokens[position++]) };
    } else if (/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(tokens[position])) {
      expression = { type: "Identifier", name: tokens[position++] };
    } else {
      throw new Error(`Unexpected token in expression: ${tokens[position]}`);
    }

    while (tokens[position] && /^>=|<=|==|[+\-*/<>]$/.test(tokens[position])) {
      const operator = tokens[position++];
      const right = parse();
      expression = {
        type: ["+", "-", "/", "*"].includes(operator)
          ? "ArithmeticExpression"
          : "ConditionalExpression",
        operator,
        left: expression,
        right,
      };
    }

    return expression;
  }

  const ast = parse();
  return { ast, length: position };
}

// Parsing Statements
function parseStatement(tokens, define = false) {
  let position = 0;

  function parse() {
    if (tokens[position] === "if") {
      position++;
      const condition = parseExpression(tokens.slice(position));
      position += condition.length;
      if (tokens[position] !== "{") throw new Error("Expected '{'");
      position++;
      const body = parseStatement(tokens.slice(position));
      position += body.length;
      if (tokens[position] !== "}") throw new Error("Expected '}'");
      return {
        type: "IfThenStatement",
        condition: condition.ast,
        body: body.statement,
      };
    } else if (tokens[position] === "while") {
      position++;
      const condition = parseExpression(tokens.slice(position));
      position += condition.length;
      if (tokens[position] !== "{") throw new Error("Expected '{'");
      position++;
      const body = parseStatement(tokens.slice(position));
      position += body.length;
      if (tokens[position] !== "}") throw new Error("Expected '}'");
      return {
        type: "WhileStatement",
        condition: condition.ast,
        body: body.statement,
      };
    } else if (tokens[position] == "let") {
      position++;
      return parseStatement(tokens.slice(position), true).statement;
    } else if (/^[a-zA-Z_][a-zA-Z_0-9]*$/.test(tokens[position])) {
      const name = tokens[position++];
      if (tokens[position] === "=") {
        position++;
        const value = parseExpression(tokens.slice(position));
        position += value.length;
        return {
          type: "AssignmentStatement",
          left: { type: "Identifier", name },
          value: value.ast,
          define,
        };
      } else {
        throw new Error("Invalid statement: expected '=' after identifier");
      }
    } else {
      throw new Error(`Invalid statement: ${tokens[position]}`);
    }
  }

  const statement = parse();
  return { statement, length: position };
}

// Evaluate AST
function evaluate(ast, globalContext) {
  switch (ast.type) {
    case "Number":
      return ast.value;
    case "Identifier":
      if (!(ast.name in globalContext))
        throw new Error(`Undefined variable: ${ast.name}`);
      return globalContext[ast.name];
    case "ArithmeticExpression":
      const left = evaluate(ast.left, globalContext);
      const right = evaluate(ast.right, globalContext);
      switch (ast.operator) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          if (right === 0) throw new Error("Division by zero");
          return left / right;
        default:
          throw new Error(`Unknown operator: ${ast.operator}`);
      }
    case "AssignmentStatement":
      const value = evaluate(ast.value, globalContext); // Evaluate the right-hand side
      if (ast.define) {
        if (ast.left.name in globalContext)
          throw new Error(`Indentifier ${ast.left.name} already defined`);
      } else {
        if (!(ast.left.name in globalContext))
          throw new Error(`Indentifier ${ast.left.name} undefined`);
      }
      globalContext[ast.left.name] = value; // Assign it to the variable in global context
      return value;
    case "ConditionalExpression":
      const leftCond = evaluate(ast.left, globalContext);
      const rightCond = evaluate(ast.right, globalContext);
      switch (ast.operator) {
        case "<":
          return leftCond < rightCond;
        case ">":
          return leftCond > rightCond;
        case "==":
          return leftCond === rightCond;
        case "!=":
          return leftCond !== rightCond;
        case "<=":
          return leftCond <= rightCond;
        case ">=":
          return leftCond >= rightCond;
        default:
          throw new Error(`Unknown operator: ${ast.operator}`);
      }
    case "IfThenStatement":
      if (evaluate(ast.condition, globalContext))
        evaluate(ast.body, globalContext);
      return;
    case "WhileStatement":
      while (evaluate(ast.condition, globalContext)) {
        evaluate(ast.body, globalContext);
      }
      return;
    default:
      throw new Error(`Unknown AST node type: ${ast.type}`);
  }
}

// Display AST
function displayAST(ast, depth = 0) {
  const indent = "  ".repeat(depth);
  switch (ast.type) {
    case "Number":
      return `${indent}Number(${ast.value})`;
    case "Identifier":
      return `${indent}Identifier(${ast.name})`;
    case "ArithmeticExpression":
      return `${indent}ArithmeticExpression(
${displayAST(ast.left, depth + 1)}
${indent}  ${ast.operator}
${displayAST(ast.right, depth + 1)}
${indent})`;
    case "AssignmentStatement":
      return `${indent}Assignment(
${indent}  ${ast.left.name}
${displayAST(ast.value, depth + 1)}
${indent})`;
    case "ConditionalExpression":
      return `${indent}ConditionalExpression(
${displayAST(ast.left, depth + 1)}
${indent}  ${ast.operator}
${displayAST(ast.right, depth + 1)}
${indent})`;
    case "IfThenStatement":
      return `${indent}IfThenStatement(
${displayAST(ast.condition, depth + 1)}
${displayAST(ast.body, depth + 1)}
${indent})`;
    case "WhileStatement":
      return `${indent}WhileStatement(
${displayAST(ast.condition, depth + 1)}
${displayAST(ast.body, depth + 1)}
${indent})`;
    default:
      throw new Error(`Unknown AST node type: ${ast.type}`);
  }
}

// Execute the mini-language
export default function execute(input, globalContext) {
  const tokens = tokenize(input);
  const { statement } = parseStatement(tokens);
  evaluate(statement, globalContext);
  console.log("AST:", displayAST(statement));
  console.log("Global Context:", globalContext);
}
