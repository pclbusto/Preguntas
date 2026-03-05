from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Lesson, Page, Exercise, Activity, Attempt, Achievement, UserAchievement, StudentProgress
from .serializers import (
    LessonSerializer, PageSerializer, ExerciseSerializer, ActivitySerializer,
    AttemptSerializer, AchievementSerializer, UserAchievementSerializer, StudentProgressSerializer
)

class LessonViewSet(viewsets.ModelViewSet):
    queryset = Lesson.objects.all()
    serializer_class = LessonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class PageViewSet(viewsets.ModelViewSet):
    queryset = Page.objects.all()
    serializer_class = PageSerializer
    permission_classes = [permissions.IsAuthenticated]

class ExerciseViewSet(viewsets.ModelViewSet):
    queryset = Exercise.objects.all()
    serializer_class = ExerciseSerializer
    permission_classes = [permissions.IsAuthenticated]

class ActivityViewSet(viewsets.ModelViewSet):
    queryset = Activity.objects.all()
    serializer_class = ActivitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

class AttemptViewSet(viewsets.ModelViewSet):
    queryset = Attempt.objects.all()
    serializer_class = AttemptSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(student=self.request.user)

    def perform_create(self, serializer):
        attempt = serializer.save(student=self.request.user)
        self._check_achievements(attempt)
        self._update_progress(attempt)

    def _check_achievements(self, attempt):
        time_taken = attempt.time_taken_seconds()
        speed_achievements = Achievement.objects.filter(criteria_type='speed')
        for ach in speed_achievements:
            if time_taken <= ach.threshold and attempt.is_correct:
                UserAchievement.objects.get_or_create(student=attempt.student, achievement=ach)
        
        if attempt.score >= 100:
            perfect_achievements = Achievement.objects.filter(criteria_type='perfect_score')
            for ach in perfect_achievements:
                UserAchievement.objects.get_or_create(student=attempt.student, achievement=ach)

    def _update_progress(self, attempt):
        if not attempt.exercise or not attempt.exercise.lesson:
            return  # Activity generics progress tracking omitted for simplicity
        lesson = attempt.exercise.lesson
        progress, created = StudentProgress.objects.get_or_create(
            student=attempt.student, 
            lesson=lesson
        )
        if attempt.is_correct:
            progress.completed_pages += 1
            total_pages = lesson.pages.count() # Or exercises
            if progress.completed_pages >= total_pages:
                progress.is_completed = True
            progress.save()

class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserStatsViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        user = request.user
        attempts = Attempt.objects.filter(student=user).order_by('-start_time')
        achievements = UserAchievement.objects.filter(student=user).order_by('-earned_at')
        progress = StudentProgress.objects.filter(student=user)

        return Response({
            'attempts': AttemptSerializer(attempts, many=True).data,
            'achievements': UserAchievementSerializer(achievements, many=True).data,
            'progress': StudentProgressSerializer(progress, many=True).data
        })
