from django.db import connection


BLOCKED_KEYWORDS = [
    "DELETE",
    "UPDATE",
    "INSERT",
    "DROP",
    "ALTER"
]


def execute_sql(sql_query):

    sql_upper = sql_query.upper()

    for keyword in BLOCKED_KEYWORDS:

        if keyword in sql_upper:

            return {
                "success": False,
                "error": "Unsafe query detected"
            }

    try:

        with connection.cursor() as cursor:

            cursor.execute(sql_query)

            columns = [col[0] for col in cursor.description]

            rows = cursor.fetchall()

            results = [
                dict(zip(columns, row))
                for row in rows
            ]

        return {
            "success": True,
            "data": results
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }