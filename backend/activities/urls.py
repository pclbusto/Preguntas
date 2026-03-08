from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LessonViewSet, PageViewSet, ExerciseViewSet,
    AttemptViewSet, AchievementViewSet, UserStatsViewSet
)

router = DefaultRouter()
router.register(r'lessons', LessonViewSet)
router.register(r'pages', PageViewSet)
router.register(r'exercises', ExerciseViewSet)
router.register(r'attempts', AttemptViewSet, basename='attempt')
router.register(r'achievements', AchievementViewSet)

urlpatterns = [
    path('students/me/stats/', UserStatsViewSet.as_view({'get': 'me'}), name='user-stats'),
    path('', include(router.urls)),
]
