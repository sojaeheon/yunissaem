from django.db import models
from accounts.models import Account
import Course, Category

# Create your models here.
class Course(models.Model):
    title = models.CharField()
    thumbnail_image_url = models.CharField()
    introduction = models.CharField()
    curriculum = models.CharField()
    price = models.IntegerField()
    max_tutees = models.IntegerField()
    current_tutees = models.IntegerField()
    status = models.BooleanField()
    created_at = models.DateField(auto_created=True)
    updated_at = models.DateField(auto_now=True)
    
    # tutor가 사라지면 기존 tutor가 만들어둔 내용도 사라짐
    tutor_id = models.ForeignKey('accounts.Account', on_delete=models.CASCADE)
    tutees_id_lst = models.ManyToManyField('accounts.Account')
    
    # tutor_id = tutor.
    
class Category(models.Model):
    name = models.CharField()