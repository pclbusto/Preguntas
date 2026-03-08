from django.contrib import admin
from .models import Lesson, Page, Exercise, Attempt, Achievement, UserAchievement, StudentProgress

class ExerciseInline(admin.TabularInline):
    model = Exercise
    extra = 1

class PageInline(admin.TabularInline):
    model = Page
    extra = 1

@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'creator', 'created_at')
    inlines = [PageInline]

@admin.register(Page)
class PageAdmin(admin.ModelAdmin):
    list_display = ('id', 'lesson', 'page_number', 'layout')
    list_filter = ('lesson', 'layout')
    inlines = [ExerciseInline]

@admin.register(Exercise)
class ExerciseAdmin(admin.ModelAdmin):
    list_display = ('id', 'page', 'lesson', 'interaction_type', 'order')
    list_filter = ('interaction_type', 'page')



@admin.register(Attempt)
class AttemptAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'exercise', 'score', 'is_correct', 'start_time', 'end_time')
    list_filter = ('is_correct', 'student')

@admin.register(Achievement)
class AchievementAdmin(admin.ModelAdmin):
    list_display = ('name', 'criteria_type', 'threshold')

@admin.register(UserAchievement)
class UserAchievementAdmin(admin.ModelAdmin):
    list_display = ('student', 'achievement', 'earned_at')

@admin.register(StudentProgress)
class StudentProgressAdmin(admin.ModelAdmin):
    list_display = ('student', 'lesson', 'completed_pages', 'is_completed')
    list_filter = ('is_completed', 'lesson')
