from django.db import models

class Account(models.Model):
    username = models.CharField(max_length=20, null=False)

    def __str__(self):
        return self.username