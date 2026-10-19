# NoSQL E-commerce Database Design

A GitHub-ready submission for **Designing NoSQL Databases Based on Multiple Requirement Views**.

This repository presents an initial document-oriented schema for an e-commerce platform and a refactored design that introduces high availability, horizontal scaling, an event record for analytics, and pre-aggregated reporting.

## Problem and approach

The platform must support searchable product listings and durable order records with customer details, purchased items, and delivery status while targeting thousands of transactions per second. The design uses MongoDB's document model. An order embeds purchase-time customer and line-item snapshots so that later profile or catalogue changes do not rewrite historical orders.

## Repository structure

```text
nosql-ecommerce-design/
├── schemas/
│   ├── initial/                  # Example user, product and order documents
│   └── refactored/               # Operational, event and analytics documents
├── db/
│   ├── initial_indexes.js        # Baseline query indexes
│   └── refactored_setup.js       # Refactored indexes and candidate shard keys
└── docs/
    ├── INITIAL_SCHEMA.md
    ├── REFACTORED_SCHEMA.md
    ├── ARCHITECTURE.md
    └── REFLECTION.md
```

## Design overview

| Concern | Initial design | Refactored design |
|---|---|---|
| Product search | Product documents, catalogue indexes and a text-search index | Same operational catalogue, optionally sharded and backed by a dedicated search index/service |
| Orders | Customer and purchased-item snapshots embedded in order | Same snapshots remain authoritative; append-only order events are added |
| Customer order history | Index on customer ID and creation time | Separate customer-order lookup view can make history queries targetable with its own shard key |
| Analytics | Reports query operational orders | Event-driven processing and daily product-sales aggregates reduce repeated scans of orders |
| Availability and scale | Indexes, replica set, load testing | Replica sets across failure domains, candidate sharding, monitoring and workload-based tests |

## How to review

1. Read `docs/INITIAL_SCHEMA.md` for the initial design and query patterns.
2. Read `docs/REFACTORED_SCHEMA.md` for the analytics/high-availability refactor and trade-offs.
3. Inspect sample documents in `schemas/`.
4. Review the illustrative MongoDB Shell commands in `db/`.
5. Read `docs/REFLECTION.md` for the 200–300-word reflection.

## Important assumptions and limitations

- MongoDB is the selected document-oriented NoSQL database; the assignment permits other data models too.
- The example identifiers and records are illustrative, not production data.
- Full-text search can use MongoDB Atlas Search or an equivalent search service, depending on the chosen deployment.
- A schema alone cannot guarantee thousands of transactions per second. Cluster topology, workload mix, indexes, document size, write concern, hardware, and load testing matter.
- Replica sets improve fault tolerance and availability. During a network partition, strong consistency and unrestricted availability cannot both be guaranteed to every partition; majority-write requirements can reject writes on a minority side.
- Analytics aggregates are asynchronously derived and can be eventually consistent. Operational orders remain the source of truth.
- Shard-key examples are candidates that must be validated against actual query patterns, cardinality, growth, and hot spots before production.

## Submission checklist

- [ ] Push the repository to GitHub.
- [ ] Include the public GitHub repository URL in the checkpoint submission.
- [ ] Confirm the initial and refactored schemas are present.
- [ ] Review and personalize the reflection before submitting.

## Author

Mubarak Aliyu