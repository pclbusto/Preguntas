# Concepto de Ejercicios (El Motor de Desafío)

En **Preguntas**, el **Ejercicio** es el núcleo de la interactividad. Es el componente que contiene la pregunta real, las respuestas esperadas y las posibles opciones para confundir o asistir al estudiante.

## El Modelo de Datos del Ejercicio

Cada ejercicio se define mediante tres pilares fundamentales que permiten al sistema generar el desafío interactivo:

### 1. Contenido (La Pregunta y los Huecos)

El campo `content` almacena el texto del ejercicio. Para indicar dónde debe ir una interacción (un hueco para escribir o soltar), se utiliza la sintaxis `{gapX}`.

- **Ejemplo**: `"El sol es de color {gap1} y la luna se ve de noche en el {gap2}."`

El sistema detecta automáticamente estos marcadores y los reemplaza en la interfaz por elementos interactivos.

### 2. Respuestas Correctas (JSON)

El campo `correct_answers` es un objeto JSON que mapea cada `{gapX}` con su valor correcto.

- **Ejemplo**: `{"gap1": "amarillo", "gap2": "cielo"}`

### 3. Opciones de Interacción (JSON)

Para los ejercicios de tipo **Arrastrar y Soltar**, el campo `options` contiene una lista de todos los elementos que el estudiante puede mover.

- **Importante**: Aquí es donde se incluyen los **distractores**. La lista debe contener las respuestas correctas más cualquier opción incorrecta que se desee mostrar.
- **Ejemplo**: `["amarillo", "cielo", "verde", "mar", "rojo"]`

## Funcionamiento del Parser

Cuando el sistema carga un ejercicio, realiza el siguiente proceso:

1. **Identificación**: Escanea el `content` buscando etiquetas `{gap}`.
2. **Inyección**: Dependiendo del `layout` de la **Página**, inyecta un cuadro de texto (Input) o una zona de soltar (Drop Zone).
3. **Validación**: Al enviar la respuesta, el sistema compara lo que el usuario ingresó o soltó en cada `gap` contra el objeto `correct_answers`.

## Relación con el Layout de la Página

El **Ejercicio** provee la lógica y los datos, pero la **Página** decide la visualización:

- Si la Página tiene un layout de **Escritura**, los gaps serán campos de texto.
- Si la Página tiene un layout de **Arrastrar**, los gaps serán zonas de soltar y el sistema mostrará las `options` como elementos arrastrables.

## Ejemplo Completo (Modo Creador)

Para crear un desafío sobre el color del sol:

- **Contenido**: `"De qué color es el sol: {gap1}"`
- **Respuestas Correctas**: `{"gap1": "amarillo"}`
- **Opciones (para arrastrar)**: `["amarillo", "azul", "verde"]`

## Atajo para Creadores (Sintaxis Simplificada)

Para facilitar la creación de ejercicios, la interfaz de administración permite una sintaxis simplificada que el sistema procesa automáticamente:

1. **Entrada**: El creador escribe su pregunta incluyendo la respuesta entre llaves.
    - `"El cielo es de color {azul}."`
2. **Procesamiento**: Al guardar, el sistema realiza lo siguiente:
    - Convierte `{azul}` en `{gap1}` para el campo `content`.
    - Mueve `"azul"` al objeto `correct_answers` bajo la clave `"gap1"`.
    - Si es un ejercicio de arrastrar, añade `"azul"` a la lista de `options`.
3. **Resultado Final**:
    - `content`: `"El cielo es de color {gap1}."`
    - `correct_answers`: `{"gap1": "azul"}`

Esta lógica permite que el creador se centre en el contenido sin preocuparse por la estructura técnica del JSON.

---
*Testing knowledge with precision - Developed by Antigravity & User.*
