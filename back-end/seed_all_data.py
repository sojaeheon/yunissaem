import os
import django
import csv
from django.db import IntegrityError
from datetime import datetime

# 1. Django 환경 설정
# ---------------------------------------------------------------------
# 'config.settings'는 실제 settings.py가 있는 Django 프로젝트 폴더 이름입니다.
# (예: my_project/settings.py 라면 'my_project.settings')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yunissaem_api.settings')
django.setup()
# ---------------------------------------------------------------------

# 2. Django 환경이 로드된 *후에* 모델을 임포트합니다.
from accounts.models import User
from courses.models import Course, Category, WishedCourses, Enrollment
from django.db.models import Avg

# --- CSV 파일 경로 정의 ---
# (파일이 manage.py와 같은 위치에 있다면 "users.csv"로 수정)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'data') # 'data'라는 하위 폴더를 가정

USERS_CSV_PATH = os.path.join(DATA_DIR, 'users.csv')
CATEGORIES_CSV_PATH = os.path.join(DATA_DIR, 'categories.csv')
COURSES_CSV_PATH = os.path.join(DATA_DIR, 'courses.csv')
WISHED_CSV_PATH = os.path.join(DATA_DIR, 'wished_courses.csv')
ENROLLMENT_CSV_PATH = os.path.join(DATA_DIR, 'enrollment.csv')
# REVIEWS_CSV_PATH = os.path.join(DATA_DIR, 'reviews.csv') # (필요시 리뷰도 추가)


def print_success(message):
    print(f"✅ \033[92m{message}\033[0m") # 초록색

def print_error(message):
    print(f"❌ \033[91m{message}\033[0m") # 빨간색

def print_warning(message):
    print(f"⚠️ \033[93m{message}\033[0m") # 노란색

def clear_data():
    """기존 데이터를 모두 삭제합니다."""
    print("기존 데이터 삭제 중...")
    # 순서 중요: M2M -> Course -> User/Category
    Enrollment.objects.all().delete()
    WishedCourses.objects.all().delete()
    # Review.objects.all().delete() # (리뷰가 있다면)
    Course.objects.all().delete()
    User.objects.all().delete()
    Category.objects.all().delete()
    print_success("모든 데이터 삭제 완료.")


def seed_users(file_path):
    """users.csv 파일에서 유저 데이터를 생성합니다."""
    print("\n유저 생성 시작...")
    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            try:
                # create_user를 사용해야 비밀번호가 암호화됩니다.
                User.objects.create_user(
                    username=row['username'],
                    password=row['password'], # CSV에 평문 비밀번호가 있어야 함
                    email=row.get('email', ''),
                    name=row.get('name', ''),
                    bio=row.get('bio', ''),
                    profile_image=row.get('profile_image', ''),
                    phone=row.get('phone', '')
                )
            except IntegrityError:
                # 중복 데이터 건너뛰기
                print_warning(f"유저 '{row['username']}'는 이미 존재합니다. 건너뜁니다.")
            except Exception as e:
                # 생성 중 오류
                print_error(f"유저 '{row['username']}' 생성 중 오류: {e}")
    print_success("유저 생성 완료.")


def seed_categories(file_path):
    """categories.csv 파일에서 카테고리 데이터를 생성합니다."""
    print("\n카테고리 생성 시작...")
    # 카테고리 1번(default)이 없을 경우를 대비해 get_or_create 사용
    Category.objects.get_or_create(id=1, defaults={'name': '기타'})

    with open(file_path, mode='r', encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        for row in reader:
            Category.objects.get_or_create(
                id=int(row['id']),
                defaults={'name': row['name']}
            )
    print_success("카테고리 생성 완료.")


def seed_courses(file_path):
    """courses.csv 파일에서 과외 데이터를 생성합니다."""
    print("\n과외 생성 시작...")
    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            try:
                # 1. 외래 키(객체)를 먼저 찾습니다.
                tutor_obj = User.objects.get(id=int(row['tutor']))
                category_obj = Category.objects.get(id=int(row['category']))

                # 2. create로 객체 생성
                Course.objects.create(
                    title=row['title'],
                    thumbnail_image_url=row['thumbnail'],
                    description=row['description'], # ⭐️ 모델 필드명: description
                    curriculum=row['curriculum'],
                    max_tutees=int(row['max_tutees']),
                    status=row.get('status', 'RECRUITING'), # CSV에 없으면 기본값
                    view_count=int(row.get('view_count', 0)),
                    category=category_obj, # 객체 전달
                    tutor=tutor_obj        # 객체 전달
                )
            except User.DoesNotExist:
                # tutor가 존재하지 않음
                print_error(f"과외 '{row['title']}' 생성 실패: 튜터 ID {row['tutor']}를 찾을 수 없습니다.")
            except Category.DoesNotExist:
                # 카테고리가 존재하지 않음
                print_error(f"과외 '{row['title']}' 생성 실패: 카테고리 ID {row['category']}를 찾을 수 없습니다.")
            except IntegrityError:
                # 중복 데이터
                print_warning(f"과외 '{row['title']}'는 이미 존재합니다. 건너뜁니다.")
            except Exception as e:
                print_error(f"과외 '{row['title']}' 생성 중 오류: {e}")
    print_success("과외 생성 완료.")


def seed_m2m(file_path, model_class):
    """WishedCourses, Enrollment 등 M2M 중간 모델 데이터를 생성합니다."""
    model_name = model_class.__name__
    print(f"\n{model_name} 생성 시작...")
    
    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            try:
                user_obj = User.objects.get(id=int(row['user']))
                course_obj = Course.objects.get(id=int(row['course']))

                # 모델별로 필요한 필드가 다름
                if model_class == WishedCourses:
                    model_class.objects.get_or_create(
                        user=user_obj,
                        course=course_obj
                    )
                elif model_class == Enrollment:
                    model_class.objects.get_or_create(
                        user=user_obj,
                        course=course_obj,
                        defaults={
                            'status': row.get('status', 'ENROLLED'),
                            'start_date': row['start_date'], # ⭐️ CSV에 필수!
                            'end_date': row['end_date']      # ⭐️ CSV에 필수!
                        }
                    )
                
            except User.DoesNotExist:
                print_error(f"{model_name} 생성 실패: 유저 ID {row['user']}를 찾을 수 없습니다.")
            except Course.DoesNotExist:
                print_error(f"{model_name} 생성 실패: 과외 ID {row['course']}를 찾을 수 없습니다.")
            except Exception as e:
                print_error(f"데이터 {row} 생성 중 오류: {e}")
    print_success(f"{model_name} 생성 완료.")


def update_cached_fields():
    """모든 과외의 캐싱 필드(카운트, 평점 등)를 업데이트합니다."""
    print("\n캐싱 필드(카운트, 평점) 업데이트 시작...")
    
    # ⭐️ 참고: update_popularity_score는 모델 코드에 오류가 있어서(current_students) 호출하지 않습니다.
    # ⭐️ 참고: Review 시딩이 없으므로 리뷰 카운트는 0이 됩니다.
    
    for course in Course.objects.all():
        course.update_tutee_count()
        # course.update_review_metrics() # (Review 시딩을 구현했다면 주석 해제)
    
    print_success("캐싱 필드 업데이트 완료.")


# --- 메인 실행 ---
if __name__ == "__main__":
    
    # 0. 기존 데이터 삭제 (선택 사항, 새로 시작할 때만 주석 해제)
    # clear_data()
    
    # 1. 의존성 없는 모델부터 생성
    seed_users(USERS_CSV_PATH)
    seed_categories(CATEGORIES_CSV_PATH)
    
    # 2. 외래 키가 있는 모델 생성
    seed_courses(COURSES_CSV_PATH)
    
    # 3. M2M 중간 모델 생성
    seed_m2m(WISHED_CSV_PATH, WishedCourses)
    seed_m2m(ENROLLMENT_CSV_PATH, Enrollment)
    # seed_m2m(REVIEWS_CSV_PATH, Review) # (리뷰 CSV가 있다면)
    
    # 4. 캐싱 필드 업데이트
    update_cached_fields()

    print("\n데이터 시딩 완료. db.sqlite3 파일을 확인해주세요.")