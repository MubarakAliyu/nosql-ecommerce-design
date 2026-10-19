# Architecture Overview

## Initial operational design

```mermaid
flowchart TD
    A[Web / Mobile Client] --> B[Application API]
    B --> U[(users)]
    B --> P[(products)]
    B --> O[(orders)]
    P --> S[Product Search Index]
```

The initial design optimizes transactional reads and writes. Product search may use a dedicated search index depending on the selected deployment.

## Refactored design

```mermaid
flowchart TD
    A[Web / Mobile Client] --> B[Application API]
    B --> U[(users)]
    B --> P[(products)]
    B --> O[(orders: source of truth)]
    O --> E[(order_events: append-only)]
    E --> C[Async event consumer]
    C --> L[(customer_order_lookup)]
    C --> D[(product_sales_daily)]
    C --> W[Optional analytics warehouse / lake]
    P --> S[Product Search Index]
```

These are logical data-flow diagrams; actual deployment and service configuration depend on the selected provider and cluster topology.
