import arcade
from PIL import Image, ImageDraw, ImageFont
from arcade.gui import UIManager
import arcade.gui
from arcade import Sprite
import os
import json



from enum import Enum

class Orientacion(Enum):
    IZQUIERDA = 1
    DERECHA = 2
    ARRIBA = 3
    ABAJO = 4

class Botton_Flecha(arcade.Sprite):
    def __init__(self, orientacion=Orientacion.DERECHA, center_y=0, center_x=0):
        filename=""
        flipped_horizontally = False
        if orientacion == Orientacion.DERECHA:
            filename = "../../sprites/boton-siguiente.png"
        elif orientacion == Orientacion.IZQUIERDA:
            filename = "../../sprites/boton-siguiente.png"
            flipped_horizontally = True
        elif orientacion == Orientacion.ABAJO:
            filename = "../../sprites/boton-abajo.png"
        elif orientacion == Orientacion.ARRIBA:
            filename = "../../sprites/boton-arriba.png"

        super().__init__(filename=filename, center_y=center_y, center_x=center_x, flipped_horizontally=flipped_horizontally)
        self.puntero_encima = False
        self.clickeado = False
        self.evento_click = None

    def set_evento(self, funcion):
        self.evento_click = funcion

    def mouse_over(self, x: float, y: float, dx: float, dy: float):
        if self.collides_with_point((x,y)):
            if not self.puntero_encima:
                self.puntero_encima = True
                self.scale = 1.15
        else:
            if self.puntero_encima:
                self.puntero_encima = False
                self.scale = 1
    def mouse_clicked(self, x: float, y: float, button: int, modifiers: int):
        if self.collides_with_point((x, y)):
            self.clickeado = True
            self.scale = 0.75
            if self.evento_click:
                self.evento_click()


    def mouse_released(self, x: float, y: float, button: int, modifiers: int):
        if self.collides_with_point((x, y)):
            self.clickeado = False
            self.scale = 1

class Cuestionario():
    def __init__(self, archivo=None):
        self.cuestionario = None
        if archivo is None:
            return
        with open(archivo) as json_file:
            self.cuestionario = json.load(json_file)
            for index, pregunta in enumerate(self.cuestionario["preguntas"]):
                cantidad_respuestas= pregunta["pregunta"].count("_")
                self.cuestionario["preguntas"][index]["respuestas"] = [""]*cantidad_respuestas
        self.indice = 0

    def opciones(self):
        if self.cuestionario is not None:
            return self.cuestionario["preguntas"][self.indice]["opciones"]

    def pregunta(self):
        if self.cuestionario is not None:
            return self.cuestionario["preguntas"][self.indice]["pregunta"]

    def siguiente(self):
        self.indice += 1
    def anterior(self):
        self.indice -= 1

    def agregar_respuesta(self,valor, index):
        print(self.cuestionario)
        print(valor, index)
        self.cuestionario["preguntas"][self.indice]["respuestas"][index] = valor

class Text_Sprite(arcade.Sprite):
    def __init__(self, text='', start_x=0,start_y=0, color=(0,0, 0), font_size=8, font_name=None):
        super().__init__()
        aux  = arcade.create_text_sprite(text=text, start_x=start_x, start_y=start_y, color=color, font_size=font_size,
                                         font_name=font_name)
        self.texture = aux.texture
        self.hit_box = self.texture.hit_box_points
        self.text = text


class MyGame(arcade.Window):

    def __init__(self, width, height, title):

        # Call the parent class's init function
        super().__init__(width, height, title,center_window=True)

        self.index = 0
        print("DIRECTORIO{}".format(os.getcwd()))
        print(os.listdir())
        os.chdir(".venv/Scripts")
        # Set the background color
        arcade.set_background_color(arcade.color.ASH_GREY)
        self.texto_seleccionado = None
        self.opciones_lista = arcade.SpriteList()
        self.cuestionario = Cuestionario('../../Cuestionarios/ejercicio-ejemplo.json')
        self.font_name = "../../fuentes/Mat Saleh.ttf"
        self.lista_botones = arcade.SpriteList()
        self.lista_botones.append(Botton_Flecha(orientacion=Orientacion.DERECHA, center_y=100, center_x=self.width-100,))
        self.lista_botones.append(Botton_Flecha(orientacion=Orientacion.IZQUIERDA, center_y=100, center_x=100))
        self.lista_pos_originales_opciones = list()
        self.mostrar_pregunta()
        self.boton_focused = None
        self.lista_botones[0].set_evento( self.evento_click_siguiente)
        self.lista_botones[1].set_evento(self.evento_click_anterior)

    def evento_click_siguiente(self):
        self.cuestionario.siguiente()
        self.mostrar_pregunta()
    def evento_click_anterior(self):
        self.cuestionario.anterior()
        self.mostrar_pregunta()
    def mostrar_pregunta(self):
        self.opciones_lista.clear()
        for opcion in self.cuestionario.opciones():
            altura = self.height - (self.height/8)
            # self.opciones_lista.append(arcade.create_text_sprite(opcion, 0,altura,(123,41,12), 20, font_name=self.font_name))
            self.opciones_lista.append(
                Text_Sprite(text=opcion, start_x=0, start_y=altura, color=(123, 41, 12), font_size= 20, font_name=self.font_name))

        lista_palabra = self.cuestionario.pregunta().split()
        self.palabra_lista = arcade.SpriteList()
        self.respuesta_lista = arcade.SpriteList()
        for palabra in lista_palabra:
            if palabra == '_':
                aux = arcade.create_text_sprite("________", 0,altura,(123,41,12), 20, font_name=self.font_name)
                aux = arcade.SpriteSolidColor(width=aux.width, height=aux.height, color=(0,0,0))
                aux.bottom = altura
                aux.visible = False
                self.palabra_lista.append(aux)
                self.respuesta_lista.append(aux)
            else:
                self.palabra_lista.append(arcade.create_text_sprite(palabra, 0, altura, (123, 41, 12), 20,
                                                                    font_name=self.font_name))
        self.distribuir(lista_palabras=self.opciones_lista, altura=600)
        self.distribuir(lista_palabras=self.palabra_lista, altura=-300)
        for opcion in self.opciones_lista:
            self.lista_pos_originales_opciones.append((opcion.center_x, opcion.center_y))

    def distribuir(self, altura=0, lista_palabras=None):
        longitud_total=0
        for opcion in lista_palabras:
            longitud_total+=opcion.width+10
        punto_inicial = 10
        print(self.width, longitud_total-10)
        if self.width>=longitud_total-10:
            # alcanza con una sola linea
            punto_inicial = (self.width-(longitud_total-10))/2

        for opcion in lista_palabras:
            opcion.left = punto_inicial
            opcion.bottom += altura
            punto_inicial += opcion.width + 10
            if lista_palabras.index(opcion)<len(lista_palabras)-1:
                if punto_inicial+lista_palabras[lista_palabras.index(opcion)+1].width+10>self.width:
                    punto_inicial = 10
                    altura -= 35



    def on_draw(self):
        """ Called whenever we need to draw the window. """
        arcade.start_render()
        self.opciones_lista.draw()
        self.palabra_lista.draw()
        self.respuesta_lista.draw_hit_boxes(color=(255,0,0), line_thickness=2)
        self.lista_botones.draw()
    def on_mouse_press(self, x: int, y: int, button: int, modifiers: int):
        for opcion in self.opciones_lista:
            if opcion.collides_with_point((x,y)):
                self.texto_seleccionado = opcion
                self.texto_seleccionado.x = x
                self.texto_seleccionado.y = y
                print("seleccionado")
                break
        for boton in self.lista_botones:
            boton.mouse_clicked(x,y, button, modifiers)
    def on_mouse_motion(self, x: float, y: float, dx: float, dy: float):
        focused = False
        for boton in self.lista_botones:
            boton.mouse_over(x, y, dx, dy)


    def on_mouse_release(self, x: int, y: int, button: int, modifiers: int):
        if self.texto_seleccionado:
            lista_coliciones = self.texto_seleccionado.collides_with_list(self.respuesta_lista)
            if lista_coliciones:
                self.texto_seleccionado.center_x = lista_coliciones[0].center_x
                self.texto_seleccionado.bottom = lista_coliciones[0].bottom
                self.cuestionario.agregar_respuesta(lista_coliciones.index(lista_coliciones[0]), self.texto_seleccionado.text)
                # todo: marcar de alguna manera la opcion que se asigno. Es decir guarda la opcion seleccionada.
            #     teniendo en cuenta que podemos tener mas de una opción lo que que hay que hacer es una asignacion
            else:
                self.texto_seleccionado.center_x = \
                self.lista_pos_originales_opciones[self.opciones_lista.index(self.texto_seleccionado)][0]
                self.texto_seleccionado.center_y = \
                self.lista_pos_originales_opciones[self.opciones_lista.index(self.texto_seleccionado)][1]
            self.texto_seleccionado = None
        for boton in self.lista_botones:
            boton.mouse_released(x,y, button, modifiers)

    def on_mouse_drag(self, x: int, y: int, dx: int, dy: int, buttons: int, modifiers: int):
        if self.texto_seleccionado is not None:
            # self.texto_seleccionado. = x
            self.texto_seleccionado.center_y = y
            self.texto_seleccionado.center_x = x
            print("arrastrando")


def main():

    window = MyGame(1320, 720, "Drawing Example")

    arcade.run()
    # TexImg().crear_imagen()

main()

#AIzaSyA_qKebPRHPnJPFvTf_c3dyFu_5PEhTMtA