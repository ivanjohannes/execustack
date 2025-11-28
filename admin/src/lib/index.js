/**
 * @summary Debounce function to limit how often a function is called.
 *
 * @description
 * This function returns a new function that, when called, will delay the execution of the original function
 * and return a promise that resolves with the result of the original function.
 *
 * @template T
 * @param {(...args: any[]) => T | Promise<T>} func - The function to debounce.
 * @param {number} delay - The delay in milliseconds.
 * @returns {(...args: any[]) => Promise<T>} - A new function that debounces the execution of the original function.
 *
 * @since 1.0.0
 */
export function debounce(func, delay) {
	/**@type {number | NodeJS.Timeout} */
	let timeout;

	return function (...args) {
		return new Promise((resolve) => {
			clearTimeout(timeout);
			timeout = setTimeout(async () => {
				const result = await func.apply(this, args);
				resolve(result);
			}, delay);
		});
	};
}
