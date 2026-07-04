# Strata - Snowflake Database Schema

This document maps out the normalized **Snowflake Schema** representing Strata's database layout. By splitting channel configurations and AI metrics into sub-dimension tables, we minimize redundancy and enforce clean relationships.

---

## 📊 Database Schema Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    %% Central Fact Table
    MESSAGE {
        string id PK "UUID"
        string project_id FK "UUID"
        string name "Submitter Name"
        string email "Submitter Email"
        string subject "Optional Subject"
        string message "Body Content"
        string status "unread | read | archived"
        timestamp created_at
    }

    %% Dimension Tables
    PROJECT {
        string id PK "UUID"
        string name "Project Name"
        string api_key "Secret Key used in SDK"
        timestamp created_at
    }

    AI_METRICS {
        string id PK "UUID"
        string message_id FK "UUID"
        float spam_score "Spam probability (0.0 - 1.0)"
        string priority "low | medium | high"
        string sentiment "positive | neutral | negative"
    }

    PROJECT_SETTINGS {
        string id PK "UUID"
        string project_id FK "UUID"
        boolean discord_enabled "Default: false"
        boolean telegram_enabled "Default: false"
        boolean email_enabled "Default: false"
    }

    %% Sub-Dimension tables (Normalized branches of the snowflake)
    DISCORD_CONFIG {
        string id PK "UUID"
        string settings_id FK "UUID"
        string webhook_url "Discord channel integration"
    }

    TELEGRAM_CONFIG {
        string id PK "UUID"
        string settings_id FK "UUID"
        string bot_token "Telegram API Token"
        string chat_id "Target Chat Identifier"
    }

    EMAIL_CONFIG {
        string id PK "UUID"
        string settings_id FK "UUID"
        string recipient_email "Target Email Address"
    }

    %% Relationships
    PROJECT ||--o{ MESSAGE : "hosts"
    MESSAGE ||--|| AI_METRICS : "analyzed_by"
    PROJECT ||--|| PROJECT_SETTINGS : "configures"
    
    PROJECT_SETTINGS ||--|{ DISCORD_CONFIG : "defines"
    PROJECT_SETTINGS ||--|{ TELEGRAM_CONFIG : "defines"
    PROJECT_SETTINGS ||--|{ EMAIL_CONFIG : "defines"
```

---

## 🗄️ Relational Mapping Table

| Table Name | Schema Type | Parent Table | Relationship | Key Fields |
| :--- | :--- | :--- | :--- | :--- |
| **`MESSAGE`** | Fact Table | `PROJECT` | Many-to-One (`project_id`) | `id` (PK), `project_id` (FK), `name`, `email`, `subject`, `message`, `status` |
| **`PROJECT`** | Dimension Table | None | One-to-Many (`MESSAGE`) | `id` (PK), `name`, `api_key`, `created_at` |
| **`AI_METRICS`** | Dimension Table | `MESSAGE` | One-to-One (`message_id`) | `id` (PK), `message_id` (FK), `spam_score`, `priority`, `sentiment` |
| **`PROJECT_SETTINGS`** | Dimension Table | `PROJECT` | One-to-One (`project_id`) | `id` (PK), `project_id` (FK), `discord_enabled`, `telegram_enabled`, `email_enabled` |
| **`DISCORD_CONFIG`** | Sub-Dimension Table | `PROJECT_SETTINGS` | One-to-One (`settings_id`) | `id` (PK), `settings_id` (FK), `webhook_url` |
| **`TELEGRAM_CONFIG`** | Sub-Dimension Table | `PROJECT_SETTINGS` | One-to-One (`settings_id`) | `id` (PK), `settings_id` (FK), `bot_token`, `chat_id` |
| **`EMAIL_CONFIG`** | Sub-Dimension Table | `PROJECT_SETTINGS` | One-to-One (`settings_id`) | `id` (PK), `settings_id` (FK), `recipient_email` |
