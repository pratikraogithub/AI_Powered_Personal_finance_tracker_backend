from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated

from .models import Category
from .serializers import CategorySerializer

from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from django.db.models.functions import TruncMonth
from collections import defaultdict

from finance.models import Transaction, AIInsight
from finance.serializers import TransactionSerializer

from rest_framework.views import APIView

from finance.services.sql_ai_service import generate_human_response, generate_sql
from finance.services.sql_executor import execute_sql



class CategoryViewSet(ModelViewSet):
    serializer_class=CategorySerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return Category.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TransactionViewSet(ModelViewSet):
    serializer_class=TransactionSerializer
    permission_classes=[IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).order_by('-date')
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    # /transactions/balance
    @action(detail=False, methods=['get'])
    def balance(self, request):
        qs=self.get_queryset()

        income = qs.filter(type='INCOME').aggregate(Sum('amount'))['amount__sum'] or 0
        expense = qs.filter(type='EXPENSE').aggregate(Sum('amount'))['amount__sum'] or 0

        return Response ({
            "total_income": income,
            "total_expense": expense,
            "balance": income - expense
        })
    
    @action(detail=False, methods=['get'])
    def monthly_summary(self, request):
        year = request.query_params.get('year')
        qs = self.get_queryset()

        if year:
            qs = qs.filter(date__year=int(year))

        data = qs.annotate(month=TruncMonth('date')).values('month', 'type').annotate(total=Sum('amount')).order_by('month')

        summary = defaultdict(lambda: {'income': 0, 'expense': 0})

        for row in data:
            month = row['month'].strftime('%Y-%m')
            if row['type'] == 'INCOME':
                summary[month]['income'] = row['total']
            else:
                summary[month]['expense'] = row['total']

        return Response([
            {"month": m, **v} for m, v in summary.items()
        ])
    
# class AIFinanceAssistantAPIView(APIView):

#     permission_classes = [IsAuthenticated]

#     def post(self, request):

#         user = request.user
#         query = request.data.get("query")

#         # Step 1: Convert natural language -> JSON
#         parsed_data = query_llm(query)

#         # Step 2: Execute ORM query safely
#         result = handle_finance_query(user, parsed_data)

#         AIInsight.objects.create(
#             user=user,
#             query=query,
#             parsed_data=parsed_data,
#             response=str(result)
#         )

#         return Response({
#             "query": query,
#             "parsed_data": parsed_data,
#             "result": result
#         })
    
class AIFinanceAssistantAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        user = request.user

        query = request.data.get("query")

        sql_query = generate_sql(
            user_query=query,
            user_id=user.id
        )

        result = execute_sql(sql_query)

        human_response = generate_human_response(
            query,
            result
        )

        return Response({
            "query": query,
            "generated_sql": sql_query,
            "sql_result": result,
            "response": human_response
        })