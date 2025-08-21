declare module "*.jpg" {
  const value: import("next/dist/shared/lib/get-img-props").StaticImport;
  export default value;
}

declare module "*.png" {
  const value: import("next/dist/shared/lib/get-img-props").StaticImport;
  export default value;
}

declare module "*.jpeg" {
  const value: import("next/dist/shared/lib/get-img-props").StaticImport;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}
