import programFunctional from "./functional/functional.js";
import programImperative from "./imperative/imperative.js";

console.log("====== start Mini Lamguage Parser in functional paradigm ====");
const functionalString = `
let x = 2;

let y = 3 + 3 * 2 - 12 / 2;

x = 1;
x=2;

if (x <= y) {
	x = 5;
}

let z = 0;

while(z<5)
{
	z = z + 1;
}
`;
const { generateAST, evaluate } = programFunctional();
const ast = generateAST(functionalString);
console.log(JSON.stringify(ast, null, 2));
const variables = evaluate(ast, {});

console.log("====== start Mini Lamguage Parser in imperative paradigm ====");
const imperativeStrings = [
	"let x = 0",
	"let y = 8",
	"x = x + y",
	"if ((x + 1) > 0) { x = 20 }",
	"while   (   x >  0 ) {  x    =  x - 1 }",
];

// Imperative Implementation
programImperative(imperativeStrings);
