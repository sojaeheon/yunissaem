from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import TutorProfile    # Tutor 소개 페이지 API 구축
from courses.models import Course   # 과외 목록 가져오기 위함

User = get_user_model()

# 내부 method들은 DRF 규정에 따라 이름이 고정되어 있음
class UserRegisterSerializer(serializers.ModelSerializer):
    # 비밀번호는 화면에 표시되지 않도록 함
    password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        # 사용자 입력이 필요한 필드만 명시 - *은 필수 요소
        # (*username, *password, email, *name, phone, bio)
        fields = ('username', 'password', 'password_confirm', 'email', 'name', 'phone')

    # 전체 데이터를 받아서 검증하는 메소드
    def validate(self, data):
        # 비밀번호가 일치하지 않으면 400 Bad Request 에러 발생
        if data.get('password') != data.get('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "비밀번호가 일치하지 않습니다."})
        return data

    def create(self, validated_data):
        # password_confirm은 필요없음
        validated_data.pop('password_confirm')

        user = User.objects.create_user(
            username=validated_data['username'],
            password=validated_data['password'],
            name=validated_data['name'],
            email=validated_data.get('email', ''),
            phone=validated_data.get('phone', ''),
            bio = validated_data.get('bio', ''),
        )
        return user
    
# 마이 페이지 사용자 프로필 serializer
class ProfileSerializer(serializers.ModelSerializer):
    # 비밀번호: PATCH 요청 시에만(설정할 때만) 비밀번호를 확인할 수 있도록 - GET 요청 시 응답에 포함 X
    current_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['name', 'profile_image', 'bio', 'phone', 'current_password']

    # 비밀번호 확인
    def validate_current_password(self, value):
        user = self.context['request'].user
        # Django의 check_password 함수로 해싱된 비밀번호와 비교
        if not user.check_password(value):
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")
        return value
    
class TutorIntroductionSerializer(serializers.ModelSerializer):
    # User 모델에서 가져올 필드
    name = serializers.ReadOnlyField()
    profile_image = serializers.ReadOnlyField()
    
    # TutorProfile 모델에서 가져올 필드 - profile이 없을 경우를 대비해 null을 허용함
    experience = serializers.CharField(source='tutor_profile.experience', read_only=True, default="")

    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'profile_image', 'bio', 'experience']
    
# 조회 / 변경 별도 제공 <= 접근 권한이 다르기 때문
class TutorProfileUpdateSerializer(serializers.ModelSerializer):
    # User 모델 필드 가져오기
    name = serializers.CharField(source='user.name', read_only=True) 
    profile_image = serializers.URLField(source='user.profile_image', required=False)
    
    # 튜터 전용 필드 (경력 등)
    experience = serializers.CharField(required=True)
    
    # 검증용 비밀번호
    current_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = TutorProfile
        fields = ['name', 'profile_image', 'experience', 'current_password']

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("비밀번호가 일치하지 않습니다.")
        return value

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        user = instance.user

        # 1. User 모델 정보 업데이트 (사진 등)
        if 'profile_image' in user_data:
            user.profile_image = user_data.get('profile_image', user.profile_image)
            user.save()

        # 2. TutorProfile 모델 정보 업데이트 (경력)
        instance.experience = validated_data.get('experience', instance.experience)
        instance.save()

        return instance