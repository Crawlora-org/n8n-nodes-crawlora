// Treat imported JSON as `any` so tsc doesn't infer a giant tuple type from the
// (large, generated) properties.json. The runtime value is the array itself.
declare module '*.json' {
	const value: any;
	export default value;
}
