import os
import logging

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

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
You are a SQLite expert.

Generate ONLY valid SQLite SELECT queries.

Rules:
- ONLY generate SELECT queries
- NEVER generate DELETE, UPDATE, INSERT, DROP, ALTER
- Return ONLY SQL
- No markdown
- Use ONLY the schema provided
- Always filter using user_id
- Use proper JOINs when category names are needed
- finance_transaction.category_id references finance_category.id

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
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": final_prompt
                }
            ]
        )

        sql_query = response.choices[0].message.content.strip()

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
                """
            },
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content.strip()