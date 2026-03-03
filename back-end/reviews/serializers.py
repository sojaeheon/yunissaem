from rest_framework import serializers
from .models import Review
from courses.models import Enrollment
from decimal import Decimal

class ReviewSerializer(serializers.ModelSerializer):
    # 리뷰 작성자의 이름을 가져오기 위한 필드 (enrollment -> user -> name)
    user_name = serializers.ReadOnlyField(source='enrollment.user.name')

    class Meta:
        model = Review
        fields = ['id', 'user_name', 'rating', 'comment', 'created_at']

# 안전하게 Float 형을 Decimal로 변환하기 위한 공통 로직
class ReviewBaseSerializer(serializers.ModelSerializer):
    rating = serializers.FloatField()

    def validate_rating(self, value):
        return Decimal(str(value))

# 1. 후기 생성용
class ReviewCreateSerializer(ReviewBaseSerializer):
    class Meta:
        model = Review
        fields = ['enrollment', 'rating', 'comment']

    def validate(self, data):
        user = self.context['request'].user
        enrollment = data.get('enrollment')

        if enrollment.user != user:
            raise serializers.ValidationError("본인의 수강 내역이 아닙니다.")
        if enrollment.status != 'completed':
            raise serializers.ValidationError("과외가 종료된 후에만 리뷰를 남길 수 있습니다.")
        if Review.objects.filter(enrollment=enrollment).exists():
            raise serializers.ValidationError("이미 이 과외에 대한 리뷰를 작성하셨습니다.")
        return data

# 2. 후기 수정용
class ReviewUpdateSerializer(ReviewBaseSerializer):
    # read_only=True: 입력(JSON Body)으로는 안 받지만, 출력(Response)에는 포함함
    enrollment = serializers.PrimaryKeyRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'enrollment', 'rating', 'comment', 'created_at']

    def validate(self, data):
        # 이제 enrollment가 read_only이므로 data.get('enrollment')는 항상 None입니다.
        # 따라서 여기서 enrollment와 관련된 복잡한 체크를 할 필요가 없어집니다.
        # 수정 시에는 오직 별점(rating)과 내용(comment)의 유효성만 보면 됩니다.
        return data

    def update(self, instance, validated_data):
        # rating 형변환 (DecimalField 대응)
        if 'rating' in validated_data:
            from decimal import Decimal
            validated_data['rating'] = Decimal(str(validated_data['rating']))
        return super().update(instance, validated_data)