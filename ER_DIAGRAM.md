# QueueOS ER Diagram

Below is the Entity-Relationship (ER) Diagram for the QueueOS database architecture.

```mermaid
erDiagram
    MANAGER ||--o{ QUEUE : "manages"
    MANAGER ||--o{ ACTIVITY_LOG : "creates"
    QUEUE ||--o{ TOKEN : "contains"
    QUEUE ||--o| QUEUE_METRICS : "has"
    QUEUE ||--o{ ACTIVITY_LOG : "generates"

    MANAGER {
        String id PK
        String name
        String email UK
        String password
        DateTime createdAt
    }

    QUEUE {
        String id PK
        String name
        String description
        String managerId FK
        DateTime createdAt
    }

    TOKEN {
        String id PK
        String tokenNumber
        String personName
        String phone
        Enum status "WAITING, SERVING, COMPLETED, CANCELLED"
        String queueId FK
        Int position
        DateTime createdAt
        DateTime servedAt
        DateTime cancelledAt
    }

    QUEUE_METRICS {
        String id PK
        String queueId FK UK
        Int averageWaitTime "in seconds"
        Int averageServiceTime "in seconds"
        Int totalServed
        Int totalCancelled
    }

    ACTIVITY_LOG {
        String id PK
        String eventType
        String description
        String managerId FK
        String queueId FK "nullable"
        DateTime createdAt
    }
```
