from django.contrib import admin

# Register your models here.
from accounts.models import Account

admin.site.register(Account)
