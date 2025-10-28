# reviews/models.py
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from courses.models import AttendingCourses # 수강 등록(inProgress) 모델을 임포트

class Review(models.Model):

    RATING_CHOICES = [(round(i * 0.5, 1), f'{round(i * 0.5, 1)}점') for i in range(1, 11)]

    # ERD에 따라 '수강 등록(inProgress)' 정보와 연결합니다.
    # 이렇게 하면 수강한 사람만 리뷰를 남길 수 있으며, User 및 course 정보에 직접적으로 연결할 수 있음
    enrollment = models.ForeignKey(
        AttendingCourses, 
        on_delete=models.CASCADE, 
        related_name='reviews'
    )
    
    # 리뷰를 작성한 유저 (ERD에는 없지만, 편의를 위해 추가할 수 있습니다)
    # user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    # ERD의 'rating' 필드. 'choices' 옵션을 적용합니다.
    # FloatField 대신 DecimalField를 사용하면 부동소수점 오류를 방지해 더 정확합니다.
    rating = models.DecimalField(
        max_digits=2,      # 5.0 (숫자 2개)
        decimal_places=1,  # 소수점 1자리
        choices=RATING_CHOICES
    )

    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # 한 번의 수강에 대해, 하나의 리뷰만 작성 가능하도록 설정
        unique_together = ('enrollment',)

    def __str__(self):
        return f"{self.enrollment.user.username} - {self.enrollment.course.title} ({self.rating})"