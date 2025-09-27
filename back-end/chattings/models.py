from django.db import models
from courses.models import Course

# Create your models here.
class Chatroom(models.Model):
    # on delete 처리 생각해보기
    course_id = models.ForeignKey('courses.Course')
    created_at = models.DateTimeField(auto_created=True)
    
# 채팅 메세지 table 생각해보기