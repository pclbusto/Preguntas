# Concepto de Lecciones (Contenedores de Evaluación)

En **Preguntas**, una **Lección** no es una clase teórica ni un espacio para la exposición de temas. Conceptualmente, es un **encapsulador de desafíos**. Su función es agrupar una serie de páginas y ejercicios diseñados para poner a prueba los conocimientos del estudiante.

## ¿Qué es una Lección en Preguntas?

A diferencia de un LMS tradicional, aquí una lección representa una **unidad de evaluación**. No tiene como finalidad armar temarios, explicarlos o dar teoría. Su objetivo es puramente el cuestionamiento y la validación de conocimientos previos o adquiridos.

### Atributos Orientados a la Evaluación

- **Título**: El nombre del conjunto de preguntas o el área del conocimiento a evaluar.
- **Descripción**: Un resumen de qué conocimientos se pondrán a prueba en este bloque.
- **Creador**: El perfil docente o evaluador que diseñó el set de preguntas.

## Estructura de Evaluación

La jerarquía de **Preguntas** está optimizada para el flujo de cuestionamiento:

1. **Lección (Evaluador)**: El contenedor de alto nivel que define el área de prueba.
2. **Página (Secuencia)**: Divide la evaluación en bloques lógicos. Permite estructurar el flujo de preguntas de manera que el estudiante no se abrume.
3. **Ejercicio (Cuestionamiento)**: El núcleo interactivo. Es donde se realiza la pregunta concreta (Drag & Drop, In-line input, etc.) que el estudiante debe resolver.

### El Enfoque de Preguntas

> Una actividad para realizar en **Preguntas** siempre es una lección. Esta lección puede tener uno o más bloques (páginas), y cada bloque contiene los desafíos reales (ejercicios) que el estudiante debe superar.

El uso de "Lección" en esta plataforma debe entenderse siempre bajo el prisma del cuestionamiento. **Preguntas** no es un libro de texto; es una herramienta de desafío constante para el intelecto del estudiante.

## Importación Masiva (JSON)

Puedes importar lecciones completas usando un archivo JSON con la siguiente estructura:

```json
{
  "title": "Mi Nueva Lección",
  "description": "Descripción opcional",
  "pages": [
    {
      "page_number": 1,
      "instructions": "Instrucciones de la página",
      "exercises": [
        {
          "content": "La capital de Francia es {París}.",
          "interaction_type": "drag_and_drop",
          "extra_options": ["Londres", "Madrid", "Berlín"]
        }
      ]
    }
  ]
}
```

> [!TIP]
> El importador soporta la **Sintaxis de Acceso Directo de Creador** (`{respuesta}`). Si usas `drag_and_drop`, puedes añadir el campo opcional `"extra_options": ["opcion1", "opcion2"]` para incluir distractores (opciones incorrectas) en la bolsa de palabras.
