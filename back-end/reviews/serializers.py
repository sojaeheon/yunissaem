from rest_framework import serializers
from .models import Review
from courses.models import Enrollment

class ReviewSerializer(serializers.ModelSerializer):
    # 리뷰 작성자의 이름을 가져오기 위한 필드 (enrollment -> user -> name)
    user_name = serializers.ReadOnlyField(source='enrollment.user.name')

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'comment', 'created_at']

# reviews/serializers.py
class ReviewCreateSerializer(serializers.ModelSerializer):
    rating = serializers.FloatField()

    class Meta:
        model = Review
        fields = ['enrollment', 'rating', 'comment']

    # 입력받은 값을 Decimal로 변환해서 반환하므로, 모델 저장 시 FloatField로 받아도 안전함
    def validate_rating(self, value):
        from decimal import Decimal
        return Decimal(str(value))

    def validate(self, data):
        user = self.context['request'].user
        enrollment = data.get('enrollment')

        # 1. 본인 확인
        if enrollment.user != user:
            raise serializers.ValidationError("본인의 수강 내역이 아닙니다.")
        
        # 2. 종료 여부 확인 (필드명이 'completed'라고 가정)
        if enrollment.status != 'completed':
            raise serializers.ValidationError("과외가 종료된 후에만 리뷰를 남길 수 있습니다.")
            
        return data