# Part 2 — Refactored Schema: Analytics, Sharding and High Availability

## What changed?

The `users`, `products`, and `orders` collections remain the operational source of truth. The refactor adds an append-only `order_events` collection, a `customer_order_lookup` query model, and a `product_sales_daily` aggregate collection. This separates latency-sensitive checkout and status updates from analytical reads.

## Refactored collections

### `users` and `products`
Keep the initial document structure. Normalize email and SKU and maintain indexes that match account and catalogue queries. Use a dedicated search index/service where available for full-text catalogue search.

### `orders`
Retain customer and line-item snapshots for historical accuracy. The order is authoritative for current payment/fulfilment status. Validate status transitions and make checkout/status operations idempotent.

### `order_events` (append-only)
Records `OrderPlaced`, `PaymentConfirmed`, `OrderDispatched`, `OrderDelivered`, and similar events. Each event has a unique `eventId`, `orderId`, `customerId`, `occurredAt`, `eventType`, schema version, and event data. Consumers deduplicate by event ID/idempotency key. Define retention, privacy and replay rules.

### `customer_order_lookup`
Stores a small per-order/customer record with customer ID, order ID, creation time and status. It supports customer history queries independently when the main `orders` collection is sharded by order ID. It may update asynchronously, so it is a query model rather than the authoritative order record.

### `product_sales_daily`
Stores a pre-aggregated document for each date, product and relevant reporting dimensions such as market and currency: units sold, order count, gross merchandise value and update time. Keeping currency and market dimensions prevents invalidly adding unlike monetary values. Aggregates should be idempotent and rebuildable from events or orders.

Sample documents are in `../schemas/refactored/`.

## Scaling strategy

1. **Replica sets:** Place replica members across separate availability zones/failure domains where supported. Configure write concern, backups and restore drills deliberately.
2. **Shard orders:** `{ orderId: "hashed" }` is a candidate to spread individual order writes. Queries using only customer ID may scatter across shards, which motivates the customer lookup query model. Validate the key before production.
3. **Shard customer lookup:** `{ customerId: "hashed" }` can target customer-history reads, though unusually active customers may still create hot spots.
4. **Shard products:** `{ productId: "hashed" }` is a candidate for distributed ID lookups. It does not automatically make text search or category filters optimal.
5. **Analytics pipeline:** Populate events and aggregates with a durable asynchronous consumer, change stream, or event pipeline. Export to an analytical warehouse/lake if reporting outgrows operational aggregates.

These are candidates, not universal best choices. Validate shard-key cardinality, query patterns, monotonicity, data growth and write hot spots. Check the selected MongoDB version's unique-index/shard-key restrictions before deployment.

## Consistency, availability and partition tolerance

- Use unique IDs/idempotency and suitable majority write concern for critical order updates. Read from the primary when a current authoritative order status is required.
- Secondary reads and analytical aggregates may be stale. Expose an `updatedAt`/freshness timestamp and accept eventual consistency for reports only when the business permits it.
- Replica sets improve availability and enable failover, but during a network partition a system cannot promise strong consistency and unrestricted availability to every partition simultaneously. Majority writes favour consistency and may be rejected on a minority side.
- Use retries with backoff, bounded timeouts, health checks, backups, restore drills and monitoring.

## Trade-offs

| Change | Benefit | Cost / risk |
|---|---|---|
| Sharding | Distributes storage and workload | Operational complexity; poor keys cause hot spots or scatter-gather queries |
| Replication | Fault tolerance and supported read scaling | Extra storage; secondary reads may be stale; failover is not zero-downtime |
| Events | Audit trail and replayable analytics input | Duplicate/out-of-order processing, retention and privacy concerns |
| Pre-aggregates | Fast dashboards without repeatedly scanning orders | Eventual consistency and rebuild/reconciliation logic |
| Customer lookup view | Can target customer-history queries independently | Duplicated data must be reconciled |

## Validation plan

Before production, load-test representative browse, checkout, status-update and analytics workloads. Monitor p95/p99 latency, CPU, memory, disk, replication lag and shard distribution. Test duplicate retries, consumer replay, node failure, network partition and backup restoration. Reconcile aggregate totals against operational orders and define acceptable analytics freshness.
