# Concepto de Páginas (Agrupadores de Desafíos)

En la jerarquía de **Preguntas**, una **Página** actúa como un agrupador intermedio y un controlador de presentación. Mientras que la Lección define el tema y el Ejercicio contiene la pregunta, la Página determina **cómo se organiza y se muestra** ese contenido.

## El Rol de la Página

Una página no es solo un contenedor pasivo; es la unidad de visualización que el estudiante ve en pantalla en un momento dado. Su propósito es estructurar la secuencia de evaluación.

### Atributos Clave

- **Page Number**: Define el orden secuencial dentro de la lección (Página 1, Página 2, etc.).
- **Instructions**: Texto opcional que orienta al estudiante sobre cómo abordar los desafíos de esa pantalla específica.
- **Layout**: El selector de diseño que define la "plantilla" de visualización.

## Layout vs. Contenido (El "Cómo" vs. el "Qué")

Es fundamental entender la separación de responsabilidades entre la Página y el Ejercicio:

| Componente | Responsabilidad | Ejemplo |
| :--- | :--- | :--- |
| **Página (Layout)** | **Cómo** se muestra. Define la disposición visual y el comportamiento de la interfaz. | `cloze_drag_drop` (un diseño de completar huecos con arrastrar). |
| **Ejercicio (Contenido)** | **Qué** se pregunta. Contiene el texto, las respuestas correctas y las opciones. | "El sol es una {gap1}." / Respuestas: `{"gap1": "estrella"}`. |

### ¿Por qué el Layout está en la Página?

Centralizar el `layout` en la página permite:

1. **Consistencia**: Todos los ejercicios dentro de una misma página compartirán el mismo estilo visual y método de interacción (ej. todos son de arrastrar y soltar).
2. **Flexibilidad**: Se pueden crear diferentes páginas con distintos diseños dentro de una misma lección, manteniendo la lógica del ejercicio independiente de su representación visual.

## Conclusión

La **Página** es el puente entre la estructura de la lección y la interactividad del ejercicio. Al encargarse del diseño (layout), permite que el motor de **Preguntas** sea extensible y visualmente variado sin complicar la definición de las preguntas individuales.
