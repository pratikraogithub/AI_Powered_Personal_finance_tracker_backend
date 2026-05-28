import json
import logging
import os

from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

logger = logging.getLogger(__name__)

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)


SYSTEM_PROMPT = """
You are a finance query parser.

Convert user finance questions into structured JSON.

IMPORTANT:
- Return ONLY valid JSON
- No markdown
- No explanation
- No SQL

Supported actions:
- sum
- filter
- top_category
- compare

Supported transaction types:
- EXPENSE
- INCOME

Examples:

User: How much did I spend this month?
Output:
{
  "action": "sum",
  "type": "EXPENSE",
  "period": "this_month"
}

User: Show food expenses
Output:
{
  "action": "sum",
  "type": "EXPENSE",
  "category": "Food"
}

User: Show expenses above 5000
Output:
{
  "action": "filter",
  "type": "EXPENSE",
  "min_amount": 5000
}

User: Which category has highest spending?
Output:
{
  "action": "top_category",
  "type": "EXPENSE"
}
"""


def query_llm(user_query: str):

    try:

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT
                },
                {
                    "role": "user",
                    "content": user_query
                }
            ]
        )

        content = response.choices[0].message.content.strip()

        logger.info(f"Raw response: {content}")

        parsed_json = json.loads(content)

        return parsed_json

    except json.JSONDecodeError as e:

        logger.error(f"JSON parsing error: {e}")

        return {
            "success": False,
            "error": "Invalid JSON response",
            "raw_response": content if 'content' in locals() else None
        }

    except Exception as e:

        logger.error(f"OpenAI error: {e}", exc_info=True)

        return {
            "success": False,
            "error": str(e)
        }