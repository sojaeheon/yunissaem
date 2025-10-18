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
    
    # 기본 정보 - introduction, curriculum은 긴 글을 포함하므로 TextField
    title = models.CharField(max_length=200, null=False)
    thumbnail_image_url = models.URLField(max_length=500, null=False)
    introduction = models.TextField(null=False)
    curriculum = models.TextField(null=False)
    price = models.PositiveIntegerField(null=False)
    max_tutees = models.PositiveIntegerField(null=False)
    
    # 상태, 카운트
    status = models.CharField(max_length=20, choices=StatusChoices, default=StatusChoices.PREPARING)
    view_count = models.PositiveIntegerField(default=0)
    
    # 날짜/시간
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 강사(1:N) - 역참조 이름은 created_courses
    tutor = models.ForeignKey(Account, on_delete=models.CASCADE, related_name='created_courses')

    # inprogress -> tutees (수강생들) - attending_courses
    tutees = models.ManyToManyField(Account, through='AttendingCourses', blank=True, related_name='attending_courses')

    # wish -> wish_users (찜한 유저들) - wished_courses
    wish_users = models.ManyToManyField(Account, through='WishedCourses', blank=True, related_name='wished_courses')

    # print 함수 실행시 '[강사명]: 강좌명' 반환
    def __str__(self):
        return f'[{self.tutor.username}] {self.title}'
    
    # 현재 수강생 수 반환
    @property
    def current_tutees_count(self):
        return self.tutees.count()

    # 나중에 리뷰 추가할 시, 리뷰와의 관계도 고려해야 함

# ManyToManyFields: 찜 목록, 수강생 목록  
class WishedCourses(models.Model):
    user = models.ForeignKey(Account, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    # 수정 지점: 최신 찜목록부터 보여주기 위해 created_at 컬럼을 추가함
    created_at = models.DateTimeField(auto_now_add=True)

class AttendingCourses(models.Model):
    user = models.ForeignKey(Account, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    # 수정 지점: 최신 등록 강좌부터 보여주기 위해 created_at 컬럼을 추가함
    created_at = models.DateTimeField(auto_now_add=True)
