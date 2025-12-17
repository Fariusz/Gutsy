# 🛠️ Gutsy: Data Model & Correlation Logic

Since you are using Supabase (a Postgres database) and TypeScript, we will define the key tables and the statistical approach needed for your **Pattern Discovery** feature.

---

## 1. Core Supabase/SQL Schema

You need three main tables to capture the event, the food, and the symptoms, linked by foreign keys.

### Table Definitions

| **Table Name**      | **Purpose**                                      | **Key Columns (Supabase/Postgres)**                                                                 |
|----------------------|--------------------------------------------------|-----------------------------------------------------------------------------------------------------|
| `users`             | Standard user data (handled by Supabase Auth).   | `id` (UUID), `created_at` (timestamp)                                                              |
| `logs`              | The central record of a specific time and event. | `id` (UUID), `user_id` (UUID - FK to users), `log_date` (date), `notes` (text), `meal_photo_url` (text) |
| `ingredients`       | A tag system for normalized food items.          | `id` (INT), `name` (TEXT, UNIQUE)                                                                  |
| `symptoms`          | A list of possible reactions.                    | `id` (INT), `name` (TEXT, UNIQUE, e.g., 'Bloating', 'Pain', 'Diarrhea'), `severity` (INT 1-5)       |
| `log_ingredients`   | Junction Table: Links a log entry to ingredients.| `log_id` (UUID - FK to logs), `ingredient_id` (INT - FK to ingredients)                            |
| `log_symptoms`      | Junction Table: Links a log entry to symptoms.   | `log_id` (UUID - FK to logs), `symptom_id` (INT - FK to symptoms), `severity` (INT 1-5)            |

---

## 2. Pattern Discovery Logic (SQL Analysis)

The core logic of Gutsy is determining if the frequency of a symptom is significantly higher when a specific ingredient is present.

### Goal: Find the "Trigger Score" for an Ingredient

Your correlation engine should prioritize ingredients that:
- Appear frequently in logs with high-severity symptoms.
- Rarely appear in logs without symptoms.

#### Formula for Trigger Score

$$
\text{Trigger Score} \propto \frac{\text{Total Symptom Severity Score when Ingredient is Present}}{\text{Total Logs where Ingredient is Present}}
$$

---

### Conceptual SQL Query for a Single Ingredient

This query calculates the average severity of all symptoms recorded on days when a specific ingredient (e.g., 'Dairy') was consumed:

```sql
SELECT
  i.name AS ingredient_name,
  -- Calculate the weighted average severity for logs containing this ingredient
  AVG(ls.severity) AS weighted_average_severity,
  COUNT(li.log_id) AS total_consumption_logs
FROM
  ingredients i
JOIN
  log_ingredients li ON i.id = li.ingredient_id
JOIN
  logs l ON li.log_id = l.id
JOIN
  log_symptoms ls ON l.id = ls.log_id  -- Join to symptoms recorded on that day
WHERE
  i.name = 'Dairy'  -- Filter for the ingredient being analyzed
GROUP BY
  i.name
ORDER BY
  weighted_average_severity DESC;
```