# Part 1 — Initial NoSQL Schema Design

## Requirements and workload

The initial version supports product browsing/search, customer profiles, order records with customer and item details plus delivery status, and a target workload of thousands of transactions per second. MongoDB is selected as a **document database** because related information often read together can be stored in a document. Throughput must still be verified with load tests; schema selection alone does not prove the target.

## Collections

### `users`
Stores account and profile data. Normalize email before storage and enforce uniqueness with an index. Do not copy authentication secrets into orders. Example: `../schemas/initial/users.example.json`.

### `products`
Stores `productId`, SKU, title, description, category, tags, attributes, price, inventory and active status. This keeps catalogue documents independently searchable. Example: `../schemas/initial/products.example.json`.

### `orders`
Stores a unique order ID, customer ID, customer/contact/address snapshot, purchased line items, purchase-time SKU/title/price snapshots, totals, status, delivery tracking and timestamps. Example: `../schemas/initial/orders.example.json`.

Items are embedded because the order must preserve what was actually purchased even if a product listing changes. The order also stores `customerId` for account-level queries, while embedding only the customer details needed as a historical snapshot.

## Query patterns and indexes

| Query | Index / approach |
|---|---|
| Find a user by email | Unique index on normalized email |
| Browse active products by category and price | Compound index `{ categoryId: 1, isActive: 1, "price.amount": 1 }` |
| Search product title/description/tags | Dedicated text-search index, e.g. Atlas Search |
| Customer's recent orders | `{ customerId: 1, createdAt: -1 }` |
| Orders awaiting dispatch | `{ status: 1, createdAt: 1 }` |
| Look up one order | Unique index on `orderId` |

Indexes should follow measured query patterns; each extra index consumes storage and adds work to writes.

## Consistency and scale

- Use unique order IDs and idempotency keys to prevent retried checkout requests from creating duplicate orders.
- Treat the order as the source of truth for current status and purchased-price snapshots.
- Prefer atomic single-document status updates where possible. When inventory, payment, and order creation span multiple documents or services, define a transaction or a saga/compensation strategy.
- Start with a replica set, appropriate indexes, bounded document sizes, connection pooling, and load tests. Add sharding when measured data volume or throughput requires it.

## Trade-offs

Embedding supports efficient order reads and preserves historical values, but documents should remain bounded. Keeping users and products separate avoids duplicating entire records. The initial design is practical for operational workflows, but large analytical scans could compete with checkout traffic; Part 2 addresses this limitation.
