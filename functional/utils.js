export function my_reduce(list, callback, initial_value) {
	const acc = initial_value;

	function recurse(list, acc) {
		if (list.length === 0) return acc;
		const new_acc = callback(acc, list[0]);
		return recurse(list.slice(1), new_acc);
	}

	return recurse(list, acc);
}
