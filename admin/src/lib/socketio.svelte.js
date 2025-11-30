import { io } from 'socket.io-client';

/**
 * @description Socket.io client instance and related functions.
 * @typedef {object} SocketIO
 * @property {import("socket.io-client").Socket} [client] - The socket.io client instance.
 */

/** @type {SocketIO} */
export const socketio = $state({});

/**
 * @description Initializes the socket connection.
 * @param {object} connection_settings
 * @param {string} connection_settings.url - The socket.io server URL.
 * @param {string} connection_settings.client_id - The client ID for authentication.
 * @param {string} connection_settings.token - The JWT token for authentication.
 * @returns
 */
export function initSocket(connection_settings) {
	if (socketio.client) return;

	// Connect with connection info
	socketio.client = io(connection_settings.url, {
		query: {
			client_id: connection_settings.client_id
		},
		auth: {
			token: connection_settings.token
		}
	});

	socketio.client.on('connect', () => {
		console.log('Socket connected:', socketio.client?.id);
	});

	socketio.client.on('connect_error', (err) => {
		console.error('Socket connection error:', err.message);
	});
}

/**
 * @description Join specified socket rooms.
 * @param {string} token
 * @param {string[]} rooms - The rooms to join.
 * @returns
 */
export function joinSocketRooms(token, rooms) {
	socketio.client?.emit('join_rooms', { token, rooms });
}

/**
 * @description Leave specified socket rooms.
 * @param {string[]} rooms - The rooms to leave.
 * @returns
 */
export function leaveSocketRooms(rooms) {
	socketio.client?.emit('leave_rooms', { rooms });
}
