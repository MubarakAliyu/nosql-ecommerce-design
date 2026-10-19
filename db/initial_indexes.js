// Illustrative MongoDB Shell commands for the initial schema.
// Run against an appropriately configured database, not blindly in production.

db.users.createIndex({ emailNormalized: 1 }, { unique: true, name: "uniq_user_email" });

db.products.createIndex({ sku: 1 }, { unique: true, name: "uniq_product_sku" });
db.products.createIndex(
  { categoryId: 1, isActive: 1, "price.amount": 1 },
  { name: "catalog_category_active_price" }
);
// Use Atlas Search or another search service for production-grade full-text search.

db.orders.createIndex({ orderId: 1 }, { unique: true, name: "uniq_order_id" });
db.orders.createIndex({ customerId: 1, createdAt: -1 }, { name: "customer_order_history" });
db.orders.createIndex({ status: 1, createdAt: 1 }, { name: "orders_by_status_created" });
db.orders.createIndex({ idempotencyKey: 1 }, { unique: true, name: "uniq_checkout_idempotency" });
