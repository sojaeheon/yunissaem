from rest_framework import serializers
from .models import Course, Category
from accounts.models import Account

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
                  'price', # 가격
                  'max_tutees', # 최대 수강생 인원
                  'status', # 현재 상태
                  'view_count', # 조회수
                  'introduction', # 과외 소개
                  'current_tutees_count', # 현재 수강생 인원
                  'tutor_name', # tutor 이름
                  ) 