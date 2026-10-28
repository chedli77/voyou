/** Les feuilles de style importées sont du texte (loader "text" d'esbuild). */
declare module "*.css" {
  const css: string;
  export default css;
}
