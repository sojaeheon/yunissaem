# accounts/management/commands/create_dummy_users.py
# csv 파일로부터 더미 유저 데이터를 생성하기 위한 코드입니다.
# 더미데이터는 csv 파일로서, manage.py와 동일한 경로에 위치합니다.
# 실행 시 python manage.py create_dummy_users users.csv

import csv
from django.core.management.base import BaseCommand
from accounts.models import User
from django.db import IntegrityError

class Command(BaseCommand):
    help = 'CSV 파일로부터 더미 유저 데이터를 생성합니다.'

    # 1. 명령어 인자 추가 (CSV 파일 경로를 받습니다)
    def add_arguments(self, parser):
        parser.add_argument('csv_file_path', type=str, help='유저 정보가 담긴 CSV 파일 경로')

    # 2. 명령어 실행 로직
    def handle(self, *args, **options):
        csv_path = options['csv_file_path']
        
        self.stdout.write(self.style.SUCCESS(f"'{csv_path}' 파일에서 유저 생성을 시작합니다..."))

        try:
            with open(csv_path, mode='r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                for row in reader:
                    try:
                        # create_user를 사용해야 비밀번호가 암호화됩니다.
                        user = User.objects.create_user(
                            username=row['username'],
                            password=row['password'],
                            email=row['email'],
                            name=row['name'],
                            bio=row['bio'],
                            # phone=row['phone']  # CSV에 있다면 추가
                        )
                        self.stdout.write(self.style.SUCCESS(f"'{user.username}' 유저 생성 완료."))
                    
                    except IntegrityError:
                        self.stderr.write(self.style.ERROR(f"'{row['username']}' 유저는 이미 존재합니다. 건너뜁니다."))
                    except Exception as e:
                        self.stderr.write(self.style.ERROR(f"'{row['username']}' 생성 중 오류 발생: {e}"))

        except FileNotFoundError:
            self.stderr.write(self.style.ERROR(f"파일을 찾을 수 없습니다: {csv_path}"))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"파일 처리 중 오류 발생: {e}"))