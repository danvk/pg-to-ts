# schemats

This is a personal fork of [PYST/schemats][pyst-fork], which is a fork of [SweetIQ/schemats][orig-repo].

Usage:

    git clone https://github.com/danvk/schemats.git
    cd schemats
    npm install
    npm run build

    node bin/schemats.js generate -c postgresql://user:pass@host/db -o dbschema.ts

The resulting file looks like:

```ts
// Table product
export interface Product {
  id: string;
  name: string;
  description: string;
  created_at: Date;
}
export interface ProductInput {
  id?: string;
  name: string;
  description: string;
  created_at?: Date;
}
const product = {
  tableName: 'product',
  columns: ['id', 'name', 'description', 'created_at'],
  requiredForInsert: ['name', 'description'],
} as const;

export interface TableTypes {
  product: {
    select: Product;
    input: ProductInput;
  };
}

export const tables = {
  product,
};
```

This gives you most of the types you need for static analysis and runtime.

See [SweetIQ/schemats][orig-repo] for the original README.

[orig-repo]: https://github.com/SweetIQ/schemats
[pyst-fork]: https://github.com/PSYT/schemats
