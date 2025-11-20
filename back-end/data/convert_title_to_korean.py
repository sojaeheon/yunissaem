import pandas as pd
import random

# --- 설정 ---
original_csv_path = 'origin_courses.csv'  # 원본 CSV 파일 경로
output_csv_path = 'courses_final_data.csv' # 새롭게 생성될 CSV 파일 경로
# --- 설정 끝 ---

# 1. 튜플 리스트로 변경: (강의명, 카테고리ID)
#    카테고리 ID는 제공해주신 1~7번을 따릅니다.
korean_titles_with_categories = [
    ("왕초보 피아노 레슨", 1),
    ("기타 초보 탈출 강좌", 1),
    ("요가로 몸과 마음 힐링하기", 2),
    ("나만의 그림 그리기 강좌", 3),
    ("여행 스케치 완전 정복", 3),
    ("스마트폰으로 만드는 감성 영상", 3),
    ("나만의 브이로그 만들기", 3),
    ("포토샵 기초부터 심화까지", 3),
    ("파이썬으로 데이터 분석 시작하기", 4),
    ("코딩 테스트 완벽 대비", 4),
    ("초보를 위한 금융 지식", 5),
    ("주식 투자 기초 다지기", 5),
    ("TOEIC 900점 달성 비법", 6),
    ("실전 영어 회화 마스터", 6),
    ("스페인어 기초 회화", 6),
    ("매력적인 자기소개서 작성법", 7),
    ("퇴근 후 여유로운 베이킹 클래스", 7),
    ("바리스타 자격증 한 번에 따기", 7),
    ("엑셀 데이터 활용 능력 향상", 7),
    ("글쓰기 실력 향상 프로젝트", 7)
]

def generate_korean_data(input_csv_path, output_csv_path, title_list):
    try:
        df = pd.read_csv(input_csv_path)
    except FileNotFoundError:
        print(f"오류: '{input_csv_path}' 파일을 찾을 수 없습니다.")
        return
    except Exception as e:
        print(f"오류: {e}")
        return

    # 2. 'title'과 'category' 컬럼을 업데이트하기 위한 리스트 생성
    new_titles = []
    new_categories = []

    for _ in range(len(df)):
        # 3. 튜플(강의명, 카테고리ID)을 랜덤으로 선택
        chosen_title, chosen_category_id = random.choice(title_list)
        new_titles.append(chosen_title)
        new_categories.append(chosen_category_id)

    # 4. DataFrame의 컬럼을 새로운 리스트로 통째로 교체
    df['title'] = new_titles
    df['category'] = new_categories # ⭐️ 이 부분이 추가되었습니다.

    # 5. 새로운 CSV 파일로 저장
    df.to_csv(output_csv_path, index=False, encoding='utf-8')
    print(f"✅ 'title' 및 'category' 컬럼이 업데이트되어 '{output_csv_path}'에 저장되었습니다.")

if __name__ == "__main__":
    generate_korean_data(original_csv_path, output_csv_path, korean_titles_with_categories)