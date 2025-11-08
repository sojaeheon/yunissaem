from rest_framework import serializers
from .models import Course, Category
from accounts.models import User
from reviews.serializers import ReviewSerializer

class CourseListSerializer(serializers.ModelSerializer):
    # models 내부에 property 정의 시 아래와 같이 사용
    current_tutees_count = serializers.ReadOnlyField()
    # course.tutor 객체로부터 tutor의 username을 불러옴
    tutor_name = serializers.StringRelatedField(source='tutor')

    class Meta:
        model = Course
        fields = ('id', # 클릭 시 접속을 위함
                  'title', # 과외명
                  'thumbnail_image_url', # 썸네일 이미지
                  #'price', # 가격
                  'max_tutees', # 최대 수강생 인원
                  'status', # 현재 상태
                  'view_count', # 조회수
                  'description', # 과외 소개
                  'current_tutees_count', # 현재 수강생 인원
                  'tutor_name', # tutor 이름
                  ) 

# 튜터 프로필 표시용
class TutorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'profile_image']


# 과외 상세 조회용 Serializer
class CourseDetailSerializer(serializers.ModelSerializer):
    tutor = TutorSerializer(read_only=True)
    reviews = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    is_wished = serializers.SerializerMethodField()
    enrollment_status = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id', 
            'title', 
            'description', 
            'curriculum',
            'current_tutees_count', 
            'max_tutees', 
            #'price',
            'tutor',
            'average_rating',
            'reviews',
            'is_wished',
            'is_owner', 
            'enrollment_status',
            'view_count',
            'thumbnail_image_url',
        ]
    
    # 리뷰 목록 직렬화
    def get_reviews(self, obj):
        enrollments = obj.enrollment_set.all()
        reviews = [review for e in enrollments for review in e.reviews.all()]
        serializer = ReviewSerializer(reviews, many=True)
        return serializer.data

    # 찜 여부
    def get_is_wished(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return obj.wish_users.filter(id=user.id).exists()

    # 튜터 본인 여부
    def get_is_owner(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return obj.tutor == user

    # 로그인한 사용자의 수강 상태
    def get_enrollment_status(self, obj):
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None

        enrollment = obj.enrollment_set.filter(user=request.user).first()
        if enrollment:
            return enrollment.status
        return None