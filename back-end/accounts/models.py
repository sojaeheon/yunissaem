from django.db import models

# Create your models here.
class Account(models.Model):
    id = models.CharField()
    password = models.CharField()
    name = models.CharField()
    phone_number = models.CharField()
    email = models.EmailField()
    profile_image_url = models.URLField()
    introduction = models.CharField()
    created_at = models.DateField(auto_created=True)
    
# 별도의 tutee 테이블이 필요하지는 않을 것 같다는 생각이 들었음