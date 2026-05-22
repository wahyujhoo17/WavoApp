// Minimal ambient declaration for the local `database` package.
// This prevents TypeScript build errors when the package has no types.
declare module 'database' {
  const value: any;
  export default value;
}
