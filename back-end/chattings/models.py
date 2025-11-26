from django.db import models
from courses.models import Course
from accounts.models import User

# ChatRoom 모델 (채팅방)
class ChatRoom(models.Model):
    courses = models.ForeignKey(Course, on_delete=models.CASCADE)  # 과외와 연결
    tutor = models.ForeignKey(User, related_name="chat_tutor", on_delete=models.CASCADE)  # 튜터
    tutee = models.ForeignKey(User, related_name="chat_tutee", on_delete=models.CASCADE)  # 튜티
    created_at = models.DateTimeField(auto_now_add=True)  # 생성일

    class Meta:
        unique_together = ('courses', 'tutor', 'tutee')  # 튜티-튜터-과외 조합이 중복되지 않도록 설정

    def __str__(self):
        return f"채팅방: {self.courses.title} - {self.tutor.name} & {self.tutee.name}"


# Message 모델 (메시지)
class Message(models.Model):
    chatroom = models.ForeignKey(ChatRoom, on_delete=models.CASCADE)  # 어떤 채팅방에 속하는지
    sender = models.ForeignKey(User, on_delete=models.CASCADE)  # 메시지 보낸 사람
    content = models.TextField()  # 메시지 내용
    is_read = models.BooleanField(default=False)  # 읽음 여부
    created_at = models.DateTimeField(auto_now_add=True)  # 메시지 작성일

    def __str__(self):
        return f"메시지: {self.content[:20]}..."  # 메시지 내용 일부 출력
