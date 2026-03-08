from django.db import models
from django.conf import settings

class Lesson(models.Model):
    title = models.CharField(max_length=200, verbose_name="Título de la Lección")
    description = models.TextField(blank=True, verbose_name="Descripción")
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lessons',
        verbose_name="Creador"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Lección"
        verbose_name_plural = "Lecciones"
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Page(models.Model):
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='pages', null=True, blank=True)
    page_number = models.PositiveIntegerField()
    layout = models.CharField(max_length=50, default='cloze_drag_drop')
    instructions = models.CharField(max_length=500, blank=True)
    pool_options = models.JSONField(blank=True, null=True, verbose_name="Opciones (pool_opciones)")

    class Meta:
        ordering = ['lesson', 'page_number']

    def __str__(self):
        return f"Página {self.page_number} de {self.lesson.title if self.lesson else 'Sin Lección'}"

class Exercise(models.Model):
    INTERACTION_TYPES = [
        ('drag_and_drop', 'Arrastrar y Soltar'),
        ('text_input', 'Escribir texto'),
    ]

    page = models.ForeignKey(
        Page,
        on_delete=models.CASCADE,
        related_name='exercises',
        verbose_name="Página",
        null=True,
        blank=True
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='exercises_legacy',
        verbose_name="Lección (Legacy)",
        null=True,
        blank=True
    )
    content = models.TextField(verbose_name="Contenido (use {gap} para los huecos)")
    interaction_type = models.CharField(
        max_length=20,
        choices=INTERACTION_TYPES,
        default='text_input',
        verbose_name="Tipo de Interacción"
    )
    correct_answers = models.JSONField(verbose_name="Respuestas Correctas (JSON)")
    options = models.JSONField(blank=True, null=True, verbose_name="Opciones (solo para Arrastrar)")
    
    order = models.PositiveIntegerField(default=0, verbose_name="Orden")

    class Meta:
        verbose_name = "Ejercicio"
        verbose_name_plural = "Ejercicios"
        ordering = ['order', 'id']

    def __str__(self):
        return f"Ejercicio {self.id}"

# ==========================================
# GAMIFICACIÓN Y TRACKING
# ==========================================

class StudentProgress(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='progress')
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='progress')
    completed_pages = models.PositiveIntegerField(default=0)
    is_completed = models.BooleanField(default=False)
    last_accessed = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'lesson')

class Attempt(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='attempts')
    exercise = models.ForeignKey(Exercise, on_delete=models.CASCADE, related_name='attempts', null=True, blank=True)
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='attempts', null=True, blank=True)
    start_time = models.DateTimeField(null=True, blank=True)
    end_time = models.DateTimeField(auto_now_add=True)
    score = models.FloatField(default=0.0)
    answers = models.JSONField(default=dict)
    is_correct = models.BooleanField(default=False)

    def time_taken_seconds(self):
        if self.start_time and self.end_time:
            return (self.end_time - self.start_time).total_seconds()
        return 0

class Achievement(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=300)
    icon_url = models.CharField(max_length=200, blank=True)
    criteria_type = models.CharField(max_length=50) # ej: 'speed', 'perfect_score', 'completion'
    threshold = models.FloatField(default=0) 

    def __str__(self):
        return self.name

class UserAchievement(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('student', 'achievement')
