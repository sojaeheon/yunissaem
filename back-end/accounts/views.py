# users/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, generics
from .serializers import UserRegisterSerializer, ProfileSerializer

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    serializer = UserRegisterSerializer(data=request.data)
    
    if serializer.is_valid():
        user = serializer.save()
        
        return Response(
            {
                "message": "회원가입 성공",
                "user": serializer.data,
            },
            status=status.HTTP_201_CREATED,
        )

        # 실패 시 에러 메시지 반환
    print(serializer.errors)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MyPageDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        # 현재 로그인한 유저의 프로필만 반환
        return self.request.user
    
    def get_serializer_context(self):
        # Serializer에서 request.user에 접근할 수 있도록 컨텍스트 전달
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context