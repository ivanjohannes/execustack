export function match(client_id) {
	// clients~[uuid]
	const client_id_pattern =
		/^clients~[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

	return client_id_pattern.test(client_id);
}
