from django.db import models
from accounts.models import Account

class Category(models.Model):
    name = models.CharField()

    def __str__(self):
        return self.name

class Course(models.Model):
    # 강의 상태 정의  
    class StatusChoices(models.TextChoices):
        PREPARING = 'preparing', '준비중' 
        RECRUITING = 'recruiting', '모집중'
        IN_PROGRESS = 'in_progress', '강의중'
        FINISHED = 'finished', '종료'
    
    # 기본 정보
    title = models.CharField(max_length=200, null=False)
    thumbnail_image_url = models.URLField(max_length=500, null=False)
    introduction = models.CharField(null=False)
    curriculum = models.CharField(null=False)
    price = models.IntegerField(null=False)
    max_tutees = models.IntegerField(null=False)
    
    # 상태, 카운트
    status = models.CharField(max_length=20, choices=StatusChoices, default=StatusChoices.PREPARING)
    view_count = models.IntegerField(default=0)
    
    # 날짜/시간
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)
    
    # 강사(1:N) - 역참조 이름은 created_courses
    tutor = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='created_courses')

    # inprogress -> tutees (수강생들) - attending_courses
    tutees = models.ManyToManyField(Account, related_name='attending_courses', blank=True)

    # wish -> wish_users (찜한 유저들) - wished_courses
    wish_users = models.ManyToManyField(Account, related_name='wished_courses', blank=True)


    def __str__(self):
        return f'[{self.tutor.username}] {self.title}'
    
    @property
    def current_tutees_count(self):
        # 현재 수강생 수 반환
        return self.tutees.count()

    # 나중에 리뷰 추가할 시, 리뷰와의 관계도 고려해야 함