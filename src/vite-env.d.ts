/// <reference types="vite/client" />

declare module 'virtual:card-workshop-dcc' {
  export const assets: Readonly<
    Record<string, import('../packages/dcc-workbench/src/delivery-types').PublishedAsset>
  >;
}
