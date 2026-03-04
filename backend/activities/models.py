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

class Exercise(models.Model):
    INTERACTION_TYPES = [
        ('drag_and_drop', 'Arrastrar y Soltar'),
        ('text_input', 'Escribir texto'),
    ]

    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='exercises',
        verbose_name="Lección",
        null=True,
        blank=True
    )
    activity = models.ForeignKey(
        'Activity',
        on_delete=models.CASCADE,
        related_name='exercises',
        verbose_name="Actividad",
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
    # Correct answers as JSON: {"gap1": "is", "gap2": "are"}
    correct_answers = models.JSONField(verbose_name="Respuestas Correctas (JSON)")
    # Options for Drag & Drop as JSON: ["am", "is", "are"]
    options = models.JSONField(blank=True, null=True, verbose_name="Opciones (solo para Arrastrar)")
    
    order = models.PositiveIntegerField(default=0, verbose_name="Orden")

    class Meta:
        verbose_name = "Ejercicio"
        verbose_name_plural = "Ejercicios"
        ordering = ['order', 'id']

    def __str__(self):
        return f"Ejercicio {self.id} de {self.lesson.title}"

# We can keep Activity as a legacy/container or remove it. 
# For now, let's keep it but focus on the new models.
class Activity(models.Model):
    ACTIVITY_TYPES = [
        ('quiz', 'Cuestionario'),
        ('task', 'Tarea'),
        ('exercise', 'Ejercicio'),
    ]

    title = models.CharField(max_length=200, verbose_name="Título")
    description = models.TextField(blank=True, verbose_name="Descripción")
    activity_type = models.CharField(
        max_length=20, 
        choices=ACTIVITY_TYPES, 
        default='task',
        verbose_name="Tipo de Actividad"
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='activities',
        verbose_name="Creador"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creación")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Última Actualización")

    class Meta:
        verbose_name = "Actividad Genérica"
        verbose_name_plural = "Actividades Genéricas"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.get_activity_type_display()})"
