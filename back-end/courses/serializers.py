from rest_framework import serializers
from .models import Course, Category, Enrollment
from accounts.models import User
from reviews.serializers import ReviewSerializer
from django.conf import settings
from django.core.files.base import ContentFile
import os



# =========================================================
# ✅ 카테고리 Serializer
# =========================================================
class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name']
        

# =========================================================
# ✅ 과외 목록용 Serializer (리스트 페이지)
# =========================================================
class CourseListSerializer(serializers.ModelSerializer):
    """
    카테고리별 과외 목록 조회용 Serializer
    """
    # tutor의 username 불러오기
    tutor_name = serializers.CharField(source='tutor.username', read_only=True)

    # category 이름 불러오기
    category_name = serializers.CharField(source='category.name', read_only=True)

    thumbnail_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = [
            'id',                   # 과외 ID
            'title',                # 과외 제목
            'thumbnail_image_url',  # 썸네일 URL
            'description',          # 과외 소개
            'max_tutees',           # 최대 인원
            'current_tutees_count', # 현재 인원
            'status',               # 상태 (모집중, 종료 등)
            'average_rating',       # 평균 평점
            'tutor_name',           # 튜터 이름
            'category_name',        # 카테고리명
            'created_at',           # 등록일
        ]

    def get_thumbnail_image_url(self, obj):
        request = self.context.get('request')
        if obj.thumbnail_image_url:
            url = obj.thumbnail_image_url.url
        else:
            url = "/static/default.jpg"
        
        if request:
            return request.build_absolute_uri(url)
        return url


# =========================================================
# ✅ 과외 생성 Serializer 
# =========================================================
class CourseCreateSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = Course
        fields = [
            "tutor",
            "category",
            "title",
            "thumbnail_image_url",
            "description",
            "curriculum",
            "max_tutees"
        ]



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
            'status',
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

# 마이페이지 과외 조회용 공용 Serializer
class MypageCourseSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(source='course.id', read_only=True)
    title = serializers.CharField(source='course.title', read_only=True)
    tutor_name = serializers.CharField(source='course.tutor.username', read_only=True)
    category_name = serializers.CharField(source='course.category.name', read_only=True)
    thumbnail_image_url = serializers.SerializerMethodField()

    class Meta:
        model = Enrollment
        fields = [
            'course_id',
            'title',
            'thumbnail_image_url',
            'tutor_name',
            'category_name',
        ]

    def get_thumbnail_image_url(self, obj):
        request = self.context.get('request')
        if obj.course.thumbnail_image_url:
            url = obj.course.thumbnail_image_url.url
        else:
            url = "/static/default.jpg"

        if request:
            return request.build_absolute_uri(url)
        return url
    
# 수강중 과외 조회용 Serializer
class EnrolledCourseListSerializer(MypageCourseSerializer):
    start_date = serializers.DateField(read_only=True)

    class Meta(MypageCourseSerializer.Meta):
        fields = MypageCourseSerializer.Meta.fields + [
            "start_date",
        ]

# 수강완료 과외 조회용 Serializer
class CompletedCourseListSerializer(MypageCourseSerializer):
    start_date = serializers.DateField(read_only=True)
    end_date = serializers.DateField(read_only=True)

    class Meta(MypageCourseSerializer.Meta):
        fields = MypageCourseSerializer.Meta.fields + [
            "start_date",
            "end_date",
        ]