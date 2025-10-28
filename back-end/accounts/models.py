from django.db import models
from django.contrib.auth.models import AbstractBaseUser
from phonenumber_field.modelfields import PhoneNumberField

class User(AbstractBaseUser):
    username=models.CharField(_("로그인 ID"), max_length=10, null=False)    # user 고유 아이디
    password=models.CharField(_("비밀번호"), max_length=12, null=False) # 나중에 input 방식만 바꿔주면 됨
    name=models.CharField(_("사용자 이름(본명)"), max_length=10, numm=False)    # 사용자 본명
    phone=PhoneNumberField(verbose_name='휴대폰 번호', blank=True, null=True, region='KR')  # 사용자 전화번호
    email=models.EmailField(_("Email 주소"), max_length=254)
    bio=models.CharField(_("상태 메세지"), max_length=50)
    profile_image=models.URLField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)
