from django.contrib import admin
from .models import Lesson, Exercise, Activity

class ExerciseInline(admin.TabularInline):
    model = Exercise
    extra = 1

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'created_at')
    inlines = [ExerciseInline]

@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('id', 'lesson', 'interaction_type', 'order')
    list_filter = ('interaction_type', 'lesson')

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ('title', 'activity_type', 'creator', 'created_at')
    inlines = [ExerciseInline]
