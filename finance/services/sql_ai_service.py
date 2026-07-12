import os
import logging

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

SCHEMA = """
Table: finance_transaction

Columns:
- id
- user_id
- category_id
- amount
- type
- description
- date

Transaction types:
- INCOME
- EXPENSE


Table: finance_category

Columns:
- id
- name
- type
- user_id


Relationships:
- finance_transaction.category_id references finance_category.id
"""

SYSTEM_PROMPT = f"""
You are a PostgreSQL SQL expert.

Generate ONLY valid PostgreSQL SELECT queries.

Rules:
- ONLY generate SELECT queries.
- NEVER generate INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, or any other modifying statement.
- Return ONLY the SQL query.
- Do NOT use markdown.
- Do NOT explain the query.
- Use ONLY the schema provided below.
- Always include the provided user_id in the WHERE clause.
- finance_transaction.category_id references finance_category.id.
- Use JOINs whenever category information is required.

PostgreSQL Date Rules:
- Use CURRENT_DATE for today's date.
- Use CURRENT_TIMESTAMP when current date and time are needed.
- Never use SQLite functions such as:
    - strftime()
    - date()
    - datetime()
- For the current month, use:
    DATE_TRUNC('month', date) = DATE_TRUNC('month', CURRENT_DATE)
- For the previous month, use:
    date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
    AND date < DATE_TRUNC('month', CURRENT_DATE)
- For today's records, use:
    date = CURRENT_DATE
- For year comparisons, use EXTRACT(YEAR FROM date).
- For month comparisons, use EXTRACT(MONTH FROM date).

Schema:
{SCHEMA}
"""


def generate_sql(user_query, user_id):

    try:
        final_prompt = f"""
User question:
{user_query}

IMPORTANT:
Always add:
WHERE user_id = {user_id}
"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": final_prompt},
            ],
        )

        sql_query = response.choices[0].message.content.strip()

        sql_query = sql_query.replace("```sql", "").replace("```", "").strip()

        return sql_query

    except Exception as e:
        logger.error(e)

        return None


def generate_human_response(user_query, sql_result):

    prompt = f"""
User Question:
{user_query}

Database Result:
{sql_result}

Generate a short natural language response.
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0,
        messages=[
            {
                "role": "system",
                "content": """
                You are a finance assistant.

                Rules:
                - Always use Indian Rupees symbol ₹
                - Never use $
                - Keep answers short and clear
                """,
            },
            {"role": "user", "content": prompt},
        ],
    )

    return response.choices[0].message.content.strip()
