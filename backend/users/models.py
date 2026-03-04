from django.db import models
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    # Constants for roles
    CREATOR = 'creator'
    STUDENT = 'student'
    
    ROLE_CHOICES = [
        (CREATOR, 'Creator'),
        (STUDENT, 'Student'),
    ]

    role = models.CharField(
        max_length=15, 
        choices=ROLE_CHOICES, 
        default=STUDENT
    )

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
