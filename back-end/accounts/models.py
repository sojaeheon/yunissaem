from django.db import models
from django.contrib.auth.models import AbstractUser
from phonenumber_field.modelfields import PhoneNumberField

# 비밀번호 암호화 및 유저 생성 로직 사용을 위해서 AbstractUser를 상속받아서 활용함
# 기존에 AbstractUser에 정의된 field와 함께, 아래에 작성된 field를 추가함
# 사용하지 않는 field는 그냥 내버려둬도 됨(굳이 채울 필요 없으며, 용량도 적게 차지함)

'''
field 설명
- 는 사용하지 않음 / +는 상속 후 추가한 field

username: 기본 인증에 사용되는 사용자 ID 
email: 이메일 주소
password: 해시된 비밀번호
is_staff: 관리 사이트 접근 가능 여부 (인증용)
is_active: 사용자 활성화 상태 여부 (인증용)
is_superuser: 슈퍼유저 권한 여부 (인증용)
last_login: 마지막 로그인 시간 
- first_name: 사용자 이름
- last_name: 사용자 성
- date_joined: 계정 생성 시간
+ phone: 전화번호
+ bio: user 상태 메세지
+ profile_image: 프로필 이미지 URL
+ created_at: 계정 생성 시간
'''

class User(AbstractUser):
    name=models.CharField(max_length=10, null=False)    # 사용자 본명
    phone=PhoneNumberField(verbose_name='휴대폰 번호', blank=True, null=True, region='KR')  # 사용자 전화번호
    bio=models.CharField(max_length=50)
    profile_image=models.URLField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)