# reviews/models.py
from django.db import models

class Review(models.Model):

    '''
    enrollment: enrollment 정보 - course_id, user_id 모두 포함함
    rating: 평점(0.5~5.0)
    comment: 리뷰 내용      
    '''

    RATING_CHOICES = [(round(i * 0.5, 1), f'{round(i * 0.5, 1)}점') for i in range(1, 11)]

    # ERD에 따라 '수강 등록(enrollment)' 정보와 연결함 - User, Course 정보를 모두 포함할 수 있음
    # 이렇게 하면 수강한 사람만 리뷰를 남길 수 있으며, User 및 course 정보에 직접적으로 연결할 수 있음
    enrollment = models.ForeignKey(
        'courses.Enrollment',
        on_delete=models.CASCADE, 
        related_name='reviews'
    )

    # ERD의 'rating' 필드. 'choices' 옵션을 적용 - 별점은 0.5부터 5.0까지 가질 수 있음
    # FloatField 대신 DecimalField를 사용하면 부동소수점 오류를 방지해 더 정확함
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

    # '수강 완료' 상태에서 남긴 Review만 유효하도록 설정할 수 있지만, Front에서도 수정할 수 있는 기능인 것 같아 남겨둡니다.
    # 필요할 시 백엔드 작업으로 옮기겠습니다.