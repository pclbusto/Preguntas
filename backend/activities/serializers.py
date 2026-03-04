from rest_framework import serializers
from .models import Lesson, Exercise, Activity

class ExerciseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exercise
        fields = ['id', 'content', 'interaction_type', 'correct_answers', 'options', 'order', 'lesson', 'activity']

class LessonSerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, read_only=True)
    creator_name = serializers.ReadOnlyField(source='creator.username')

    class Meta:
        model = Lesson
        fields = ['id', 'title', 'description', 'creator', 'creator_name', 'exercises', 'created_at']
        read_only_fields = ['creator', 'created_at']

class ActivitySerializer(serializers.ModelSerializer):
    exercises = ExerciseSerializer(many=True, required=False)
    creator_name = serializers.ReadOnlyField(source='creator.username')

    class Meta:
        model = Activity
        fields = ['id', 'title', 'description', 'activity_type', 'creator', 'creator_name', 'exercises', 'created_at', 'updated_at']
        read_only_fields = ['creator', 'created_at', 'updated_at']

    def create(self, validated_data):
        exercises_data = validated_data.pop('exercises', [])
        activity = Activity.objects.create(**validated_data)
        for exercise_data in exercises_data:
            exercise_data.pop('activity', None)
            exercise_data.pop('lesson', None)
            Exercise.objects.create(activity=activity, **exercise_data)
        return activity

    def update(self, instance, validated_data):
        exercises_data = validated_data.pop('exercises', None)
        instance.title = validated_data.get('title', instance.title)
        instance.description = validated_data.get('description', instance.description)
        instance.activity_type = validated_data.get('activity_type', instance.activity_type)
        instance.save()

        if exercises_data is not None:
            # Simple approach: clear and recreation. 
            # For a more robust approach, we could match by ID.
            instance.exercises.all().delete()
            for exercise_data in exercises_data:
                exercise_data.pop('activity', None)
                exercise_data.pop('lesson', None)
                Exercise.objects.create(activity=instance, **exercise_data)
        
        return instance
