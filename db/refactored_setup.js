// Illustrative setup commands for a sharded MongoDB deployment.
// Prerequisites: connect through mongos to a properly configured sharded cluster.
// Validate shard keys and unique-index restrictions against the target MongoDB version.

db.users.createIndex({ emailNormalized: 1 }, { unique: true, name: "uniq_user_email" });
db.products.createIndex({ sku: 1 }, { unique: true, name: "uniq_product_sku" });
db.products.createIndex(
  { categoryId: 1, isActive: 1, "price.amount": 1 },
  { name: "catalog_category_active_price" }
);

db.orders.createIndex({ orderId: 1 }, { unique: true, name: "uniq_order_id" });
db.orders.createIndex({ idempotencyKey: 1 }, { unique: true, name: "uniq_checkout_idempotency" });
db.orders.createIndex({ customerId: 1, createdAt: -1 }, { name: "customer_order_history" });

db.order_events.createIndex({ eventId: 1 }, { unique: true, name: "uniq_event_id" });
db.order_events.createIndex({ orderId: 1, occurredAt: 1 }, { name: "order_event_history" });
db.order_events.createIndex({ occurredAt: 1, eventType: 1 }, { name: "event_analytics_scan" });

db.customer_order_lookup.createIndex(
  { customerId: 1, createdAt: -1 }, { name: "customer_lookup_history" }
);
db.customer_order_lookup.createIndex(
  { customerId: 1, orderId: 1 }, { unique: true, name: "uniq_customer_order" }
);
db.product_sales_daily.createIndex(
  { date: 1, productId: 1, market: 1, currency: 1 },
  { unique: true, name: "uniq_daily_product_market_currency" }
);

// Candidate shard-key plan — only run after enabling sharding and evaluating workload.
// sh.enableSharding("ecommerce");
// sh.shardCollection("ecommerce.orders", { orderId: "hashed" });
// sh.shardCollection("ecommerce.customer_order_lookup", { customerId: "hashed" });
// sh.shardCollection("ecommerce.products", { productId: "hashed" });
// Select event/analytics shard keys based on retention, time-range queries and distribution.
