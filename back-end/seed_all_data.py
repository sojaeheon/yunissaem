import os
import django
import csv
from django.db import IntegrityError
from datetime import datetime

# -----------------------------------------------------------------------------
# 1. Django 환경 설정
# -----------------------------------------------------------------------------
# Docker 환경에서는 프로젝트 루트가 /app 이므로 settings 경로만 정확하면 OK
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'yunissaem_api.settings')
django.setup()

# -----------------------------------------------------------------------------
# 2. 모델 import (django.setup() 이후)
# -----------------------------------------------------------------------------
from accounts.models import User
from courses.models import Course, Category, WishedCourses, Enrollment
from chattings.models import ChatRoom, Message
# from reviews.models import Review  # 리뷰 모델 있으면 활성화

# -----------------------------------------------------------------------------
# 3. CSV 경로 설정 (Docker 기준 /app/data)
# -----------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")

USERS_CSV_PATH = os.path.join(DATA_DIR, "users.csv")
CATEGORIES_CSV_PATH = os.path.join(DATA_DIR, "categories.csv")
COURSES_CSV_PATH = os.path.join(DATA_DIR, "courses.csv")
WISHED_CSV_PATH = os.path.join(DATA_DIR, "wished_courses.csv")
ENROLLMENT_CSV_PATH = os.path.join(DATA_DIR, "enrollment.csv")
CHATROOMS_CSV_PATH = os.path.join(DATA_DIR, 'chatrooms.csv')
MESSAGES_CSV_PATH = os.path.join(DATA_DIR, 'messages.csv')

# -----------------------------------------------------------------------------
# 출력 컬러 유틸
# -----------------------------------------------------------------------------
def print_success(msg): print(f"✅ \033[92m{msg}\033[0m")
def print_error(msg):   print(f"❌ \033[91m{msg}\033[0m")
def print_warning(msg): print(f"⚠️ \033[93m{msg}\033[0m")


# -----------------------------------------------------------------------------
# 기존 데이터 삭제
# -----------------------------------------------------------------------------
def clear_data():
    print("🧹 기존 데이터 삭제 중...")

    Enrollment.objects.all().delete()
    WishedCourses.objects.all().delete()
    Course.objects.all().delete()
    Category.objects.all().delete()
    User.objects.all().delete()
    Message.objects.all().delete()
    ChatRoom.objects.all().delete()
    print_success("데이터 초기화 완료.")


# -----------------------------------------------------------------------------
# 1) Users
# -----------------------------------------------------------------------------
def seed_users(path):
    print("\n👤 유저 생성 시작...")
    with open(path, encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            try:
                User.objects.create_user(
                    username=row["username"],
                    password=row["password"],
                    email=row.get("email", ""),
                    name=row.get("name", ""),
                    bio=row.get("bio", ""),
                    profile_image=row.get("profile_image", None),
                    phone=row.get("phone", ""),
                )
            except IntegrityError:
                print_warning(f"유저 '{row['username']}'는 이미 존재합니다.")
            except Exception as e:
                print_error(f"유저 생성 오류: {e}")

    print_success("유저 생성 완료.")


# -----------------------------------------------------------------------------
# 2) Categories
# -----------------------------------------------------------------------------
def seed_categories(path):
    print("\n📂 카테고리 생성 시작...")

    with open(path, encoding='utf-8-sig') as file:
        reader = csv.DictReader(file)
        for row in reader:
            Category.objects.get_or_create(
                id=int(row["id"]),
                defaults={"name": row["name"]},
            )

    print_success("카테고리 생성 완료.")


# -----------------------------------------------------------------------------
# 3) Courses
# -----------------------------------------------------------------------------
def seed_courses(path):
    print("\n📘 과외 생성 시작...")

    with open(path, encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:

            try:
                tutor = User.objects.get(id=int(row["tutor"]))
                category = Category.objects.get(id=int(row["category"]))

                Course.objects.create(
                    title=row["title"],
                    thumbnail_image_url=row["thumbnail"],
                    description=row["description"],
                    curriculum=row.get("curriculum", ""),
                    max_tutees=int(row["max_tutees"]),
                    view_count=int(row.get("view_count", 0)),
                    status=row.get("status", "RECRUITING"),
                    tutor=tutor,
                    category=category,
                )

            except User.DoesNotExist:
                print_error(f"튜터 {row['tutor']} 없음 → 과외 '{row['title']}' 스킵")
            except Category.DoesNotExist:
                print_error(f"카테고리 {row['category']} 없음 → 과외 '{row['title']}' 스킵")
            except Exception as e:
                print_error(f"과외 생성 오류 ({row['title']}): {e}")

    print_success("과외 생성 완료.")


# -----------------------------------------------------------------------------
# 4) Many-to-Many : Wishlist & Enrollment
# -----------------------------------------------------------------------------
def seed_m2m(path, model):
    model_name = model.__name__
    print(f"\n🔗 {model_name} 생성 시작...")

    with open(path, encoding='utf-8') as file:
        reader = csv.DictReader(file)

        for row in reader:
            try:
                user = User.objects.get(id=int(row["user"]))
                course = Course.objects.get(id=int(row["course"]))

                if model == WishedCourses:
                    model.objects.get_or_create(user=user, course=course)

                elif model == Enrollment:
                    start_date = datetime.fromisoformat(row["start_date"])
                    end_date = datetime.fromisoformat(row["end_date"])

                    model.objects.get_or_create(
                        user=user,
                        course=course,
                        defaults={
                            "status": row.get("status", "ENROLLED"),
                            "start_date": start_date,
                            "end_date": end_date,
                        }
                    )

            except Exception as e:
                print_error(f"{model_name} 생성 실패: {e}")

    print_success(f"{model_name} 생성 완료.")


# -----------------------------------------------------------------------------
# 5) 캐싱 필드 업데이트
# -----------------------------------------------------------------------------
def update_cached_fields():
    print("\n📊 캐싱 필드 업데이트...")
    for course in Course.objects.all():
        course.update_tutee_count()
    print_success("캐싱 필드 업데이트 완료.")

# -----------------------------------------------------------------------------
# 채팅
# -----------------------------------------------------------------------------
def seed_chatrooms(file_path):
    """chatrooms.csv 파일에서 채팅방 데이터를 생성합니다."""
    print("\n📌 채팅방(ChatRoom) 생성 시작...")

    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)

        for row in reader:
            try:
                # update_or_create 사용 → seed 재실행 시 중복 방지
                ChatRoom.objects.update_or_create(
                    id=row['id'],
                    defaults={
                        'courses_id': row['courses_id'],
                        'tutor_id': row['tutor_id'],
                        'tutee_id': row['tutee_id'],
                        'created_at': row['created_at'],
                    }
                )
            except IntegrityError:
                # FK 문제 또는 unique_together 충돌 시 발생
                print_warning(
                    f"⚠ 채팅방 ID {row['id']} 생성 중 무결성 오류 발생. 건너뜁니다."
                )
            except Exception as e:
                print_error(
                    f"❌ 채팅방 ID {row['id']} 생성 중 오류: {e}"
                )

    print_success("✅ 채팅방 생성 완료.")

def seed_messages(file_path):
    """messages.csv 파일에서 메시지 데이터를 생성합니다."""
    print("\n📌 메시지(Message) 생성 시작...")

    with open(file_path, mode='r', encoding='utf-8') as file:
        reader = csv.DictReader(file)

        for row in reader:
            try:
                # 문자열 "true"/"false" → boolean 변환
                is_read_value = str(row['is_read']).lower() == 'true'

                # update_or_create → 재실행 시 중복 방지
                Message.objects.update_or_create(
                    id=row['id'],
                    defaults={
                        'chatroom_id': row['chatroom_id'],
                        'sender_id': row['sender_id'],
                        'content': row['content'],
                        'is_read': is_read_value,
                        'created_at': row['created_at'],
                    }
                )
            except IntegrityError:
                print_warning(
                    f"⚠ 메시지 ID {row['id']} 생성 중 무결성 오류. FK 확인 필요."
                )
            except Exception as e:
                print_error(
                    f"❌ 메시지 ID {row['id']} 생성 중 오류: {e}"
                )

    print_success("✅ 메시지 생성 완료.")


# -----------------------------------------------------------------------------
# MAIN
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    # clear_data()  # 매번 초기화하고 싶으면 주석 해제

    seed_users(USERS_CSV_PATH)
    seed_categories(CATEGORIES_CSV_PATH)
    seed_courses(COURSES_CSV_PATH)
    seed_chatrooms(CHATROOMS_CSV_PATH)
    seed_messages(MESSAGES_CSV_PATH)
    seed_m2m(WISHED_CSV_PATH, WishedCourses)
    seed_m2m(ENROLLMENT_CSV_PATH, Enrollment)

    update_cached_fields()

    print("\n🎉 PostgreSQL 데이터 시딩 완료!")
