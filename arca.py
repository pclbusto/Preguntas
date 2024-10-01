import arcade
from PIL import Image, ImageDraw, ImageFont
from arcade.gui import UIManager
import arcade.gui
from arcade import  Sprite
import os
import json


# class TexImg:
#     def crear_imagen(self):
#         out1 = Image.new("RGBA", (1, 1), (255, 255, 255,0))
#         # out = out.convert('RGBA')
#         # out.a
#         # get a font
#         fnt = ImageFont.truetype("./fuentes/Ubuntu-Title.ttf", 40)
#         # get a drawing context
#         d = ImageDraw.Draw(out1)
#         box = d.textbbox(xy=(0,0), text="Batman is the best super hero", font=fnt)
#         print(box[2],box[3])
#         out = Image.new("RGBA", (box[2],box[3]), (255, 255, 255, 0))
#         d = ImageDraw.Draw(out)
#         # draw multiline text
#         d.text((0, 0), "Batman is the best super hero", font=fnt, fill=(243, 123, 0))
#         return out
#         # out.show()
#
# class Text_Sprite(arcade.Sprite):
#     def __init__(self, texto="", size=40):
#         aux = Image.new("RGBA", (1, 1), (255, 255, 255, 0))
#         fnt = ImageFont.truetype("../../fuentes/Ubuntu-Title.ttf", size)
#         d = ImageDraw.Draw(aux)
#         box = d.textbbox(xy=(0, 0), text=texto, font=fnt)
#         texto_imagen = Image.new("RGBA", (box[2], box[3]), (255, 255, 255, 0))
#         d = ImageDraw.Draw(texto_imagen)
#         # draw multiline text
#         d.text((0, 0), texto, font=fnt, fill=((162,126,150)))
#         textura = arcade.Texture(name="texto", image=texto_imagen, hit_box_algorithm="Simple")
#         super().__init__(texture=textura)
#
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

    def mouse_released(self, x: float, y: float, button: int, modifiers: int):
        if self.collides_with_point((x, y)):
            self.clickeado = False
            self.scale = 1

class MyGame(arcade.Window):

    def __init__(self, width, height, title):

        # Call the parent class's init function
        super().__init__(width, height, title,center_window=True)

        self.index = 0
        print("DIRECTORIO{}".format(os.getcwd()))
        os.chdir("venv/bin")
        cuestionario = None
        with open('../../Cuestionarios/ejercicio-ejemplo.json') as json_file:
            cuestionario = json.load(json_file)
        # Set the background color
        arcade.set_background_color(arcade.color.ASH_GREY)
        self.texto_seleccionado = None
        self.opciones_lista = arcade.SpriteList()
        for opcion in cuestionario["preguntas"][self.index]["opciones"]:
            altura = height - (height/8)
            self.opciones_lista.append(arcade.create_text_sprite(opcion, 0,altura,(123,41,12), 20, font_name="../../fuentes/Mat Saleh.ttf"))
        lista_palabra = cuestionario["preguntas"][self.index]["pregunta"].split()
        self.palabra_lista = arcade.SpriteList()
        self.respuesta_lista = arcade.SpriteList()
        for palabra in lista_palabra:
            if palabra == '_':
                aux = arcade.create_text_sprite("________", 0,altura,(123,41,12), 20, font_name="../../fuentes/Mat Saleh.ttf")
                aux = arcade.SpriteSolidColor(width=aux.width, height=aux.height, color=(0,0,0))
                aux.bottom = altura
                aux.visible = False
                self.palabra_lista.append(aux)
                self.respuesta_lista.append(aux)
                # self.palabra_lista.append(arcade.create_text_sprite("________", 0,altura,(123,41,12), 20, font_name="../../fuentes/Mat Saleh.ttf"))
            else:
                self.palabra_lista.append(arcade.create_text_sprite(palabra, 0, altura, (123, 41, 12), 20,
                                                                    font_name="../../fuentes/Mat Saleh.ttf"))

        self.lista_botones = arcade.SpriteList()
        self.lista_botones.append(Botton_Flecha(orientacion=Orientacion.DERECHA, center_y=100, center_x=self.width-100,))
        self.lista_botones.append(Botton_Flecha(orientacion=Orientacion.IZQUIERDA, center_y=100, center_x=100))
        self.distribuir(lista_palabras=self.opciones_lista)
        self.distribuir(lista_palabras=self.palabra_lista, altura=-300)
        self.lista_pos_originales_opciones = list()
        for opcion in self.opciones_lista:
            self.lista_pos_originales_opciones.append((opcion.center_x, opcion.center_y))
        self.boton_focused = None

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