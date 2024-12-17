import { my_reduce } from "./utils.js";

export default function evaluate(ast, variables) {
	Object.freeze(variables);
	return traverseList(ast.body, variables);
}

function traverseList(astList, variables) {
	const new_variables = my_reduce(
		astList,
		(acc, ast) => {
			const traverse_result = traverse(ast, acc);
			return { ...acc, ...traverse_result.variables };
		},
		variables,
	);

	return { ...variables, ...new_variables };
}

function traverse(ast, variables) {
	switch (ast.type) {
		case "STRING":
			return { variables, value: ast.value };

		case "NUMBER":
			return { variables, value: ast.value };

		case "VARIABLE":
			if (variables[ast.value] == undefined)
				throw new Error(`Variable (${ast.value}) Undeclared`);
			return { variables, value: variables[ast.value] };

		case "BINARYEXPRESSION":
			switch (ast.operator) {
				case "+":
					return {
						variables,
						value:
							traverse(ast.left, variables).value +
							traverse(ast.right, variables).value,
					};

				case "-":
					return {
						variables,
						value:
							traverse(ast.left, variables).value -
							traverse(ast.right, variables).value,
					};

				case "*":
					return {
						variables,
						value:
							traverse(ast.left, variables).value *
							traverse(ast.right, variables).value,
					};

				case "/":
					return {
						variables,
						value:
							traverse(ast.left, variables).value /
							traverse(ast.right, variables).value,
					};

				case "==":
					return {
						variables,
						value:
							traverse(ast.left, variables).value ===
							traverse(ast.right, variables).value,
					};

				case "!=":
					return {
						variables,
						value:
							traverse(ast.left, variables).value !==
							traverse(ast.right, variables).value,
					};

				case ">=":
					return {
						variables,
						value:
							traverse(ast.left, variables).value >=
							traverse(ast.right, variables).value,
					};

				case "<=":
					return {
						variables,
						value:
							traverse(ast.left, variables).value <=
							traverse(ast.right, variables).value,
					};

				case ">":
					return {
						variables,
						value:
							traverse(ast.left, variables).value >
							traverse(ast.right, variables).value,
					};

				case "<":
					return {
						variables,
						value:
							traverse(ast.left, variables).value <
							traverse(ast.right, variables).value,
					};
			}

		case "ASSIGNMENTEXPRESSION":
			if (ast.define) {
				if (variables[ast.left.value] !== undefined)
					throw new Error(`Cannot Redeclare Variable (${ast.left.value})`);
				const traverse_result = traverse(ast.right, variables);
				const new_variables = {
					...variables,
					...traverse_result.variables,
					[ast.left.value]: traverse_result.value,
				};
				console.log({
					variables: new_variables,
					indentifier: ast.left.value,
					value: traverse_result.value,
				});
				return { variables: new_variables, value: traverse_result.value };
			} else {
				if (variables[ast.left.value] === undefined)
					throw new Error(`Variable (${ast.left.value}) Undeclared`);
				const traverse_result = traverse(ast.right, variables);
				const new_variables = {
					...variables,
					...traverse_result.variables,
					[ast.left.value]: traverse_result.value,
				};
				console.log({
					variables: new_variables,
					indentifier: ast.left.value,
					value: traverse_result.value,
				});
				return { variables: new_variables, value: traverse_result.value };
			}

		case "PRINTEXPRESSION":
			console.log(traverse(ast.value, variables));
			return;

		case "EXPRESSION":
			const traverse_result = traverse(ast.body, variables);
			const new_variables = { ...variables, ...traverse_result.variables };
			return { variables: new_variables, value: traverse_result.value };

		case "CONDITIONALSTATEMENT":
			switch (ast.keyword) {
				case "IF":
					if (traverse(ast.condition, variables).value) {
						const traverse_list_variables = traverseList(
							ast.statement,
							variables,
						);
						const new_variables = { ...variables, ...traverse_list_variables };
						return { variables: new_variables, value: null };
					}
					return;

				case "WHILE":
					function condition_callback(new_variables) {
						return traverse(ast.condition, new_variables).value;
					}
					function statement_callback(new_variables) {
						return traverseList(ast.statement, new_variables);
					}
					function functionalWhile(
						condition_callback,
						statement_callback,
						variables_acc,
					) {
						if (condition_callback(variables_acc)) {
							const new_variables_acc = {
								...variables_acc,
								...statement_callback(variables_acc),
							};
							return functionalWhile(
								condition_callback,
								statement_callback,
								new_variables_acc,
							);
						} else {
							return variables_acc;
						}
					}
					const new_variables = functionalWhile(
						condition_callback,
						statement_callback,
						variables,
					);

					return { variables: { ...variables, ...new_variables }, value: null };
			}
	}
}
