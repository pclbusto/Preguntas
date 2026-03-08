from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Lesson, Page, Exercise, Attempt, Achievement, UserAchievement, StudentProgress
from .serializers import (
    LessonSerializer, PageSerializer, ExerciseSerializer,
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
        
    def _check_achievements(self, attempt):
        if attempt.score >= 100:
            perfect_achievements = Achievement.objects.filter(criteria_type='perfect_score')
            for ach in perfect_achievements:
                UserAchievement.objects.get_or_create(student=attempt.student, achievement=ach)

    def _update_progress(self, attempt):
        # Determine the lesson
        lesson = attempt.lesson
        if not lesson and attempt.exercise:
            lesson = attempt.exercise.lesson or (attempt.exercise.page.lesson if attempt.exercise.page else None)
        
        if not lesson:
            return

        progress, created = StudentProgress.objects.get_or_create(
            student=attempt.student, 
            lesson=lesson
        )

        if attempt.lesson:
            # Result of the entire lesson
            if attempt.is_correct or attempt.score >= 80:
                progress.is_completed = True
                # If finished lesson, we can assume all pages are covered
                total_pages = lesson.pages.count()
                progress.completed_pages = max(progress.completed_pages, total_pages)
            progress.save()
            self._check_achievements(attempt)
        elif attempt.exercise and attempt.is_correct:
            # Individual exercise success
            # Note: simplistic increment, could be improved with per-exercise tracking
            total_pages = lesson.pages.count()
            if progress.completed_pages < total_pages:
                progress.completed_pages += 1
            
            if progress.completed_pages >= total_pages:
                progress.is_completed = True
            progress.save()
            self._check_achievements(attempt)

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
