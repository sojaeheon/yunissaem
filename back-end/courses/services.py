from django.utils import timezone

from .models import Enrollment


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
