import json
import logging
import ollama

logger = logging.getLogger(__name__)


SYSTEM_PROMPT = """
You are a finance query parser.

Your task is to convert user finance questions into structured JSON.

IMPORTANT RULES:
- Return ONLY valid JSON
- Do NOT explain anything
- Do NOT return markdown
- Do NOT return SQL
- Do NOT add extra text

Supported actions:
- sum
- filter
- top_category
- compare

Supported transaction types:
- EXPENSE
- INCOME

Supported filters:
- category
- period
- min_amount
- max_amount

Examples:

User: How much did I spend this month?
Output:
{
  "action": "sum",
  "type": "EXPENSE",
  "period": "this_month"
}

User: Show food expenses this month
Output:
{
  "action": "sum",
  "type": "EXPENSE",
  "category": "Food",
  "period": "this_month"
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

User: Compare this month spending with last month
Output:
{
  "action": "compare",
  "type": "EXPENSE",
  "periods": ["this_month", "last_month"]
}
"""


def query_llm(
    user_query: str,
    model: str = "llama3.2:3b",
    temperature: float = 0,
):
    """
    Convert natural language finance queries into structured JSON.
    """

    try:
        messages = [
            {
                "role": "system",
                "content": SYSTEM_PROMPT,
            },
            {
                "role": "user",
                "content": user_query,
            },
        ]

        logger.info(f"Sending query to model: {user_query}")

        response = ollama.chat(
            model=model,
            messages=messages,
            options={
                "temperature": temperature,
            }
        )

        content = response.get("message", {}).get("content", "").strip()

        logger.info(f"Raw model response: {content}")

        # Remove markdown wrappers if model returns ```json
        content = (
            content
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )

        parsed_json = json.loads(content)

        logger.info(f"Parsed JSON: {parsed_json}")

        return parsed_json

    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {e}")

        return {
            "success": False,
            "error": "Invalid JSON response from model",
            "raw_response": content if 'content' in locals() else None
        }

    except ollama.ResponseError as e:
        logger.error(f"Ollama response error: {e}")

        return {
            "success": False,
            "error": f"Ollama error: {str(e)}"
        }

    except ConnectionError as e:
        logger.error(f"Connection error: {e}")

        return {
            "success": False,
            "error": (
                "Cannot connect to Ollama. "
                "Please make sure Ollama is running."
            )
        }

    except Exception as e:
        logger.error(f"Unexpected error: {e}", exc_info=True)

        return {
            "success": False,
            "error": str(e)
        }


if __name__ == "__main__":

    test_queries = [
        "How much did I spend this month?",
        "Show food expenses this month",
        "Show expenses above 5000",
        "Which category has highest spending?",
        "Compare this month spending with last month"
    ]

    for query in test_queries:

        print("\n" + "=" * 50)
        print(f"Question: {query}")

        result = query_llm(query)

        print("Parsed Response:")
        print(json.dumps(result, indent=2))