from rest_framework import serializers
from .models import Lesson, Page, Exercise, Activity, Attempt, Achievement, UserAchievement, StudentProgress

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'content', 'interaction_type', 'correct_answers', 'options', 'order', 'page', 'lesson', 'activity']

class PageSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, required=False)

    class Meta:
        model = Page
        fields = ['id', 'page_number', 'layout', 'instructions', 'pool_options', 'exercises', 'lesson', 'activity']

class LessonSerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True, read_only=True)
    creator_name = serializers.ReadOnlyField(source='creator.username')

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'creator', 'creator_name', 'pages', 'created_at']
        read_only_fields = ['creator', 'created_at']

class ActivitySerializer(serializers.ModelSerializer):
    pages = PageSerializer(many=True, required=False)
    creator_name = serializers.ReadOnlyField(source='creator.username')

    class Meta:
        model = Activity
        fields = ['id', 'title', 'description', 'activity_type', 'creator', 'creator_name', 'pages', 'created_at', 'updated_at']
        read_only_fields = ['creator', 'created_at', 'updated_at']

    def create(self, validated_data):
        pages_data = validated_data.pop('pages', [])
        activity = Activity.objects.create(**validated_data)
        for page_data in pages_data:
            exercises_data = page_data.pop('exercises', [])
            page_data.pop('lesson', None)
            page_data.pop('activity', None)
            page = Page.objects.create(activity=activity, **page_data)
            for exercise_data in exercises_data:
                exercise_data.pop('page', None)
                exercise_data.pop('lesson', None)
                exercise_data.pop('activity', None)
                Exercise.objects.create(page=page, activity=activity, **exercise_data)
        return activity

    def update(self, instance, validated_data):
        pages_data = validated_data.pop('pages', None)
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.activity_type = validated_data.get('activity_type', instance.activity_type)
        instance.save()

        if pages_data is not None:
            instance.pages.all().delete()
            for page_data in pages_data:
                exercises_data = page_data.pop('exercises', [])
                page_data.pop('lesson', None)
                page_data.pop('activity', None)
                page = Page.objects.create(activity=instance, **page_data)
                for exercise_data in exercises_data:
                    exercise_data.pop('page', None)
                    exercise_data.pop('lesson', None)
                    exercise_data.pop('activity', None)
                    Exercise.objects.create(page=page, activity=instance, **exercise_data)
        
        return instance

# Gamification Serializers
class AttemptSerializer(serializers.ModelSerializer):
    time_taken_seconds = serializers.ReadOnlyField()

    class Meta:
        model = Attempt
        fields = ['id', 'student', 'exercise', 'start_time', 'end_time', 'score', 'answers', 'is_correct', 'time_taken_seconds']
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
