from django.db import models
from accounts.models import User
from reviews.models import Review

class Category(models.Model):
    name = models.CharField()

    def __str__(self):
        return self.name

class Course(models.Model):
    '''
    아래는 erd 기반 수정사항
    id:	과외 고유 식별자
    title: 과외 제목
    thumbnail: 과외 썸네일 이미지 경로
    description: 과외 소개
    curriculum:	커리큘럼 내용
    max_students: 최대 수강 인원
    + status: 상태 - (준비중, 모집중, 강의중, 종료)
    + view_count: 조회수

    category_id: 과외 카테고리
    tutor_id: 과외를 개설한 튜터
    + tutees_id: 과외를 수강하는 튜티들

    created_at: 과외 생성일
    updated_at: 최근 수정일

    current_tutees_count: 현재 수강 중인 인원
    review_count: 리뷰 개수 (캐싱 필드)
    wishlist_count: 찜 수 (캐싱 필드)
    average_rating: 평균 평점 (캐싱 필드)
    popularity_score: 인기 점수 (가중치 기반)

    - is_active: 과외 활성화 여부 -> status
    '''

    # 강의 상태 정의  
    class StatusChoices(models.TextChoices):
        RECRUITING = 'recruiting'
        IN_PROGRESS = 'in_progress'
        FINISHED = 'finished'
    
    # 기본 정보 - introduction, curriculum은 긴 글을 포함하므로 TextField
    title = models.CharField(max_length=200, null=False)
    thumbnail_image_url = models.URLField(max_length=500, null=False)   # default를 지정해주는 게 낫겠다
    description = models.TextField(null=False) # 비어있어도 상관 없을듯
    curriculum = models.TextField(null=False)   # 비어있으면 안 됨 - 게시글 만들기를 위한 서드파티를 사용해야함 <ckeditor>
    # price = models.PositiveIntegerField(null=False)
    max_tutees = models.PositiveIntegerField(null=False)
    
    # 상태, 카운트
    status = models.CharField(max_length=20, choices=StatusChoices, default=StatusChoices.RECRUITING)
    view_count = models.PositiveIntegerField(default=0)
    
    # category
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='courses', null=False, default=1)
    
    # 강사(1:N) - 역참조 이름은 created_courses
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_courses')

    # inprogress -> tutees (수강생들) - attending_courses
    tutees = models.ManyToManyField(User, through='Enrollment', blank=True, related_name='attending_courses')

    # wish -> wish_users (찜한 유저들) - wished_courses
    wish_users = models.ManyToManyField(User, through='WishedCourses', blank=True, related_name='wished_courses')

    # 날짜/시간
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    current_tutees_count = models.IntegerField(default=0)
    review_count = models.IntegerField(default=0)
    average_rating = models.FloatField(default=0.0)
    popularity_score = models.FloatField(default=0.0)

    # print 함수 실행시 '[강사명]: 강좌명' 반환
    def __str__(self):
        return f'[{self.tutor.username}] {self.title}'
    
    # current_tutees_count를 update
    def update_tutee_count(self):
        count = self.tutees.count()
        self.current_tutees_count = count
        self.save(update_fields=['current_tutees_count'])

    # 리뷰와의 관계를 고려함    
    # 이 과목에 달린 총 리뷰 개수 및 평균 평점 구하고 저장함
    # 여기서 enrollment는 Review에 정의된 정보를 의미함
    def update_review_metrics(self):
        reviews = self.review_set.all() # reviews.models impor 대신 사용함
        self.review_count = reviews.count()
        self.average_rating = reviews.aggregate(models.Avg('rating'))['rating__avg'] or 0
        self.save(update_fields=['review_count', 'average_rating'])

    # 가중치 계산 결과를 popularity_score에 저장함
    def update_popularity_score(self):
        self.popularity_score = (
            self.current_students * 0.5 +
            self.wishlist_count * 0.3 +
            self.review_count * 0.15 +
            self.average_rating * 0.05
        )
        self.save(update_fields=['popularity_score'])


# ManyToManyFields: 찜 목록, 수강생 목록  
class WishedCourses(models.Model):
    '''
    id
    user_id
    course_id
    created_at
    '''
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    # 수정 지점: 최신 찜목록부터 보여주기 위해 created_at 컬럼을 추가함
    created_at = models.DateTimeField(auto_now_add=True)

# 이름 AttendingCourses -> Enrollment로 변경!
# 관련 사항 모두 수정해야 함
class Enrollment(models.Model):
    '''
    id:	수강 상태 식별자
    class_id:	수강 중인 과외
    user_id:	수강하는 사용자
    status:	수강 상태 (‘enrolled’ 또는 ‘completed’)
    start_date:	수강 시작일
    end_date:	수강 종료일
    '''
    
    class StatusChoices(models.TextChoices):
        ENROLLED = 'enrolled', '수강중'
        COMPLETED = 'completed', '수강완료'

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    course = models.ForeignKey(Course, on_delete=models.CASCADE)
    # 수정 지점: 최신 등록 강좌부터 보여주기 위해 created_at 컬럼을 추가함
    created_at = models.DateTimeField(auto_now_add=True)

    # status 기본 값은 수강중
    status = models.CharField(max_length=10, choices=StatusChoices.choices, default=StatusChoices.ENROLLED)
    start_date = models.DateField()
    end_date = models.DateField()