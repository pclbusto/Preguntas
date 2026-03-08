# Arquitectura de Evaluación

La arquitectura de **Preguntas** está diseñada para soportar un motor de cuestionamiento dinámico y eficiente.

## Visión General del Motor

El sistema opera como un motor de desafíos divido en tres capas técnicas:

- **Backend (Django)**: API REST que expone los sets de preguntas y gestiona los intentos y logros.
- **Frontend (React)**: Interfaz de usuario premium diseñada para el dinamismo de las pruebas interactivas.
- **Capa de Persistencia**: Almacena de manera estructurada las evaluaciones, los resultados y las medallas de los estudiantes.

## Jerarquía de Datos ( assessment-first )

El contenido interactivo sigue estrictamente esta estructura de desafío:

1. **Lección**: El contenedor de evaluación (ej. "Desafío de Álgebra Nivel 1").
2. **Página**: Un bloque de preguntas dentro del desafío.
3. **Ejercicio**: La pregunta técnica interactiva (Escribir, Arrastrar, etc.).

## Lógica de Seguimiento de Conocimientos

El progreso del estudiante se mide a través de:

- **Intentos (Attempts)**: El registro exacto de cada resolución de pregunta, incluyendo puntaje y tiempo.
- **Logros (Achievements)**: Reconocimientos gamificados basados en el rendimiento durante las evaluaciones.
- **Progreso**: El estado de completitud de los desafíos activos para cada estudiante.

## Stack Tecnológico

- **Backend**: Django & DRF.
- **Frontend**: React (Vite).
- **Documentación**: MkDocs Material.
- **Filosofía**: Cuestionamiento interactivo continuo.
