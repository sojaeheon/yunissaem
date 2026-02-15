from django.utils import timezone
from django.db.models import Exists, OuterRef

from .models import Enrollment, Course


def complete_expired_enrollments(user=None):
    """
    수강 종료일이 지난 수강중(enrolled) 데이터를 수강완료(completed)로 전환한다.

    user가 전달되면 해당 사용자 데이터만 동기화한다.
    """
    qs = Enrollment.objects.filter(
        status=Enrollment.StatusChoices.ENROLLED,
        end_date__lt=timezone.localdate(),
    )
    if user is not None:
        qs = qs.filter(user=user)
    return qs.update(status=Enrollment.StatusChoices.COMPLETED)


def finish_expired_tutor_courses(tutor=None):
    """
    튜터 과외 중 종료 조건을 만족한 과외를 finished로 전환한다.

    - 튜터 과외의 만료된 enrolled 수강을 completed로 먼저 정리
    - 이후 in_progress 과외 중 현재 enrolled 수강이 없는 과외를 finished로 전환
    """
    expired_enrollments = Enrollment.objects.filter(
        status=Enrollment.StatusChoices.ENROLLED,
        end_date__lt=timezone.localdate(),
    )
    if tutor is not None:
        expired_enrollments = expired_enrollments.filter(course__tutor=tutor)
    expired_enrollments.update(status=Enrollment.StatusChoices.COMPLETED)

    active_enrolled_subquery = Enrollment.objects.filter(
        course_id=OuterRef("pk"),
        status=Enrollment.StatusChoices.ENROLLED,
    )

    courses = (
        Course.objects
        .filter(status=Course.StatusChoices.IN_PROGRESS)
        .annotate(has_active_enrollment=Exists(active_enrolled_subquery))
        .filter(has_active_enrollment=False)
    )
    if tutor is not None:
        courses = courses.filter(tutor=tutor)

    return courses.update(status=Course.StatusChoices.FINISHED)
