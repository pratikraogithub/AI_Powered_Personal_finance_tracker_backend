from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta

from finance.models import Transaction


def handle_finance_query(user, data):

    action = data.get("action")
    transaction_type = data.get("type")
    category = data.get("category")
    period = data.get("period")
    min_amount = data.get("min_amount")

    queryset = Transaction.objects.filter(user=user)

    # Filter by transaction type
    if transaction_type:
        queryset = queryset.filter(type=transaction_type)

    # Filter by category
    if category:
        queryset = queryset.filter(category__name__iexact=category)

    # Filter by current month
    if period == "this_month":
        now = timezone.now()

        queryset = queryset.filter(
            date__month=now.month,
            date__year=now.year
        )

        # Yesterday
    if period == "yesterday":

        yesterday = timezone.now().date() - timedelta(days=1)

        queryset = queryset.filter(date=yesterday)


    # Last Month
    if period == "last_month":

        now = timezone.now()

        if now.month == 1:
            month = 12
            year = now.year - 1
        else:
            month = now.month - 1
            year = now.year

        queryset = queryset.filter(
            date__month=month,
            date__year=year
        )

    # Filter by minimum amount
    if min_amount:
        queryset = queryset.filter(amount__gte=min_amount)

    # SUM ACTION
    if action == "sum":

        total = queryset.aggregate(
            total=Sum("amount")
        )["total"] or 0

        return {
            "success": True,
            "response": f"Total amount is ₹{total}"
        }

    # FILTER ACTION
    elif action == "filter":

        transactions = queryset.order_by("-date")[:5]

        results = []

        for tx in transactions:
            results.append({
                "amount": tx.amount,
                "category": tx.category.name if tx.category else None,
                "date": tx.date,
                "type": tx.type
            })

        return {
            "success": True,
            "response": results
        }

    # TOP CATEGORY ACTION
    elif action == "top_category":

        top_category = (
            queryset.values("category__name")
            .annotate(total=Sum("amount"))
            .order_by("-total")
            .first()
        )

        if not top_category:
            return {
                "success": False,
                "response": "No transactions found."
            }

        return {
            "success": True,
            "response": (
                f"Top spending category is "
                f"{top_category['category__name']} "
                f"with ₹{top_category['total']}"
            )
        }

    return {
        "success": False,
        "response": "Unsupported query."
    }