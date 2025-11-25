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