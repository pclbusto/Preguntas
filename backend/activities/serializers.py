from rest_framework import serializers
from .models import Lesson, Page, Exercise, Attempt, Achievement, UserAchievement, StudentProgress

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'content', 'interaction_type', 'correct_answers', 'options', 'order', 'page', 'lesson']

class PageSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, required=False)

    class Meta:
        model = Page
        fields = ['id', 'page_number', 'layout', 'instructions', 'pool_options', 'exercises', 'lesson']

class LessonSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True, read_only=True)
    creator_name = serializers.ReadOnlyField(source='creator.username')

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'creator', 'creator_name', 'pages', 'created_at']
        read_only_fields = ['creator', 'created_at']

# Gamification Serializers
class AttemptSerializer(serializers.ModelSerializer):
    time_taken_seconds = serializers.ReadOnlyField()
    lesson_title = serializers.ReadOnlyField(source='lesson.title')

    class Meta:
        model = Attempt
        fields = [
            'id', 'student', 'exercise', 'lesson', 'lesson_title', 
            'start_time', 'end_time', 'score', 'answers', 
            'is_correct', 'time_taken_seconds'
        ]
        read_only_fields = ['student', 'end_time', 'time_taken_seconds']

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'name', 'description', 'icon_url', 'criteria_type', 'threshold']

class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    
    class Meta:
        model = UserAchievement
        fields = ['id', 'student', 'achievement', 'earned_at']
        read_only_fields = ['student', 'achievement', 'earned_at']

class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = ['id', 'student', 'lesson', 'completed_pages', 'is_completed', 'last_accessed']
