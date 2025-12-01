/**
 * @typedef {object} Toast
 * @property {string} [id]
 * @property {string} [title]
 * @property {string} [message]
 * @property {any} [timeout]
 */

/**
 * @type {{ toasts: Toast[] }}
 */
export const toast_queue = $state({
	toasts: []
});

/**
 *
 * @param {Toast} toast
 * @param {number} [duration]
 * @returns
 */
export function addToast(toast, duration = 5000) {
	toast.id = crypto.randomUUID();
	if (duration > 0) {
		toast.timeout = setTimeout(() => {
			removeToast(toast.id);
		}, duration);
	}

	toast_queue.toasts = [...toast_queue.toasts, toast];

	return toast.id;
}

/**
 * @param {string} [id]
 */
export function removeToast(id) {
	clearTimeout(toast_queue.toasts.find((t) => t.id === id)?.timeout);
	toast_queue.toasts = toast_queue.toasts.filter((t) => t.id !== id);
}
