from rest_framework import serializers
from .models import Course, Category
from accounts.models import Account



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
    tutor_name = serializers.CharField(source='tutor.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    thumbnail_url = serializers.ReadOnlyField()
    remaining_slots = serializers.ReadOnlyField()

    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'thumbnail_url',
            'tutor_name',
            'category_name',
            'max_students',
            'current_students',
            'remaining_slots',
            'wishlist_count',
            'review_count',
            'average_rating',
            'popularity_score',
            'is_active',
            'created_at',
        ]