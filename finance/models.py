from django.db import models

# Create your models here.
from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
    CATEGORY_TYPES = (
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    )

    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=CATEGORY_TYPES, default='EXPENSE')
    user = models.ForeignKey(User, on_delete=models.CASCADE)  # personal category list

    def __str__(self):
        return f"{self.name} ({self.type})"

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('INCOME', 'Income'),
        ('EXPENSE', 'Expense'),
    )

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    type = models.CharField(choices=TRANSACTION_TYPES, max_length=30)
    description = models.TextField(blank=True)
    date = models.DateField()

    def __str__(self):
        return f"{self.user.username} - {self.type} - {self.amount}"

class AIInsight(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    query = models.TextField()
    response = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"
