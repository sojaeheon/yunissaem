from rest_framework import serializers
from django.contrib.auth import get_user_model

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
    """
    마이페이지 조회 및 수정용 -> 사용자가 데이터를 보낼 때 비밀번호가 필수
    "데이터를 받을 때만" 존재해야 함
    """
    # 비밀번호: PATCH 요청 시에만(설정할 때만) 비밀번호를 확인할 수 있도록 - GET 요청 시 응답에 포함 X
    current_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['name', 'profile_image', 'bio', 'phone', 'current_password']

    # 전체 validate 확인
    def validate(self, data):
        # 1. PATCH 요청이더라도 current_password가 없으면 에러 발생 (필수 체크)
        current_password = data.get('current_password')
        if not current_password:
            raise serializers.ValidationError({"current_password": "본인 확인을 위해 비밀번호를 입력해주세요."})

        # 2. 비밀번호 일치 여부 확인
        user = self.context['request'].user
        if not user.check_password(current_password):
            raise serializers.ValidationError({"current_password": "비밀번호가 일치하지 않습니다."})

        return data

    def update(self, instance, validated_data):
        # 업데이트 직전, 모델 필드에 없는 current_password는 제거
        validated_data.pop('current_password', None)
        return super().update(instance, validated_data)

class TutorProfileUpdateSerializer(serializers.ModelSerializer):
    # 수정 시 보안을 위한 비밀번호 확인 필드
    current_password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        # 튜터 페이지에서 수정할 필드들
        fields = ['name', 'profile_image', 'tutor_intro', 'current_password']

    def validate(self, data):
        # 1. PATCH 요청 시에도 비밀번호가 누락되지 않았는지 강제 확인
        if 'current_password' not in data:
            raise serializers.ValidationError({"current_password": "본인 확인을 위해 비밀번호를 입력해주세요."})
        current_password = data.get('current_password')

        # 2. 비밀번호 일치 여부 확인
        user = self.context['request'].user
        if not user.check_password(current_password):
            raise serializers.ValidationError({"current_password": "비밀번호가 일치하지 않습니다."})

        return data

    def update(self, instance, validated_data):
        # 비밀번호 필드는 실제 모델 업데이트에 쓰이지 않으므로 제거
        validated_data.pop('current_password', None)
        return super().update(instance, validated_data)
    

class UserDetailSerializer(serializers.ModelSerializer):
    """
    일반 유저 정보 조회용 (tutor_intro가 있을 때만 포함)
    타인이 내 정보를 보거나, 내가 내 정보를 단순히 확인하는 경우
    비밀번호 검증 로직 X -> 실수로 조회 응답에 포함되지 않음
    """
    class Meta:
        model = User
        fields = ['id', 'username', 'name', 'profile_image', 'bio', 'tutor_intro']

    def to_representation(self, instance):
        # 1. 일단 전체 데이터를 직렬화합니다.
        ret = super().to_representation(instance)
        
        # 2. tutor_intro가 비어있거나 None이면 응답 데이터에서 제외합니다.
        if not ret.get('tutor_intro'):
            ret.pop('tutor_intro', None)
            
        return ret