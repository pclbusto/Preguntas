from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LessonViewSet, ExerciseViewSet, ActivityViewSet

router = DefaultRouter()
router.register(r'lessons', LessonViewSet)
router.register(r'exercises', ExerciseViewSet)
router.register(r'generics', ActivityViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
