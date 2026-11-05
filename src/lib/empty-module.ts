export default {};

//Fix para lidar com o erro de importação do "module" no ambiente do navegador, que não possui suporte nativo para o Node.js.

export const createRequire = () => () => {
  throw new Error("createRequire is not available in the browser");
};