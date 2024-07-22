import arcade
from PIL import Image, ImageDraw, ImageFont
from arcade.gui import UIManager
import arcade.gui
import math
import os

class Recursos():
    def __init__(self):
        self.circulo_letras = Image.open("./sprites/Circulo_letras.png")

class TexImg:
    def crear_imagen(self):
        out1 = Image.new("RGBA", (1, 1), (255, 255, 255,0))
        # out = out.convert('RGBA')
        # out.a
        # get a font
        fnt = ImageFont.truetype("./fuentes/Ubuntu-Title.ttf", 40)
        # get a drawing context
        d = ImageDraw.Draw(out1)
        box = d.textbbox(xy=(0,0), text="Batman is the best super hero", font=fnt)
        print(box[2],box[3])
        out = Image.new("RGBA", (box[2],box[3]), (255, 255, 255, 0))
        d = ImageDraw.Draw(out)
        # draw multiline text
        d.text((0, 0), "Batman is the best super hero", font=fnt, fill=(243, 123, 0))
        return out
        # out.show()

class Text_Sprite(arcade.Sprite):
    def __init__(self, texto="", size=100):
        '''No puedo detectar el error al crear las texturas en memoria y no bajarlas a disco asi que por ahora las creo y las guardo'''
        self.text = texto[0]
        self.aux = Image.new("RGBA", (1, 1), (255, 255, 255, 0))
        self.fnt = ImageFont.truetype("./fuentes/Mat Saleh.ttf", size)
        d = ImageDraw.Draw(self.aux)
        self.box = d.textbbox(xy=(0, 0), text=self.text, font=self.fnt)
        self.texto_imagen = Image.new("RGBA", (self.box[2], self.box[3]), (255, 255, 255, 0))
        self.d = ImageDraw.Draw(self.texto_imagen)
        self.d.text((0, 0), self.text, font=self.fnt, fill=((162,126,150)))
        nombre_archivo = "sprites"+os.path.sep+ self.text + ".png"
        if not os.path.exists(nombre_archivo):
            with open(nombre_archivo, "wb") as fp:
                self.texto_imagen.save(fp,"PNG")
        super().__init__(nombre_archivo)

class Circulo_De_Letra(arcade.Sprite):
    def __init__(self):
        imagen = Image.open("./sprites/Circulo_letras.png")
        textura = arcade.load_texture("./sprites/Circulo_letras.png")
        # textura = arcade.Texture(name="texto", image=imagen, hit_box_algorithm="Detailed")
        super().__init__(texture=textura)
        self.center_x = (textura.size[0]/2)+100
        self.center_y = (textura.size[1]/2)+100
        print(self.position)


class Box2(arcade.Sprite):
    def __init__(self):
        # este srpite es para representar la palabra mietras se va seleccionando con las letras
        super().__init__(filename="./sprites/caja2.png")


class MyGame(arcade.Window):

    def __init__(self, width, height, title):

        # Call the parent class's init function
        super().__init__(width, height, title)
        self.color_circulos = color=(130, 149, 218, 200)
        # Set the background color
        arcade.set_background_color(arcade.color.ASH_GREY)
        # self.texto_seleccionado = None
        # self.imagen_sprt = arcade.Sprite("Cuestionarios/wild_animals01/Imagenes/dolphin.png", scale=0.5, center_x=50, center_y=50)
        lista_letras = "LIAEIMRTE"
        self.lista_sprites_letras = arcade.SpriteList()
        self.lista_sprites_circulos = arcade.SpriteList()
        for i in range(0, len(lista_letras)):
            self.lista_sprites_letras.append(Text_Sprite(lista_letras[i]))
            self.lista_sprites_circulos.append(arcade.SpriteCircle(radius=int(self.lista_sprites_letras[i].height/1.6), color=self.color_circulos))
            self.lista_sprites_circulos[i].visible = False
        self.lista_seleccionados = []
        self.start_pos = (0,0)
        self.end_pos = (0, 0)
        self.track_mouse = False
        self.circulo_letra = Circulo_De_Letra()
        self.distribuir_letras()

    def distribuir_letras(self):
        centro_circulo = self.circulo_letra.position
        radio = self.circulo_letra.height/2.8
        cantiad_letras = len(self.lista_sprites_letras)
        print(cantiad_letras, self.lista_sprites_letras)
        grados_seccion = (2*math.pi)/cantiad_letras
        for i in range(0, cantiad_letras):
            print(i, (grados_seccion*i)*180/math.pi)
            self.lista_sprites_letras[i].center_x = radio * math.cos(grados_seccion*i)+self.circulo_letra.center_x
            self.lista_sprites_letras[i].center_y = radio * math.sin(grados_seccion * i)+self.circulo_letra.center_y
            self.lista_sprites_circulos[i].position = self.lista_sprites_letras[i].position

    def on_draw(self):
        """ Called whenever we need to draw the window. """
        arcade.start_render()

        self.circulo_letra.draw()
        self.lista_sprites_circulos.draw()
        if len(self.lista_seleccionados)>=2:
            for index in range(1,len(self.lista_seleccionados)):
                start_x = self.lista_seleccionados[index-1].center_x
                start_y = self.lista_seleccionados[index-1].center_y
                end_x = self.lista_seleccionados[index].center_x
                end_y = self.lista_seleccionados[index].center_y
                # arcade.draw_circle_filled(center_x= start_x, center_y=start_y, radius=5, color=(0,0,200,100))
                arcade.draw_line(start_x= start_x, start_y=start_y,end_x= end_x,end_y= end_y, line_width=10, color=self.color_circulos)
        self.lista_sprites_letras.draw()
    #     vamos a dibujar las cajas con las letras que fueron seleccionadas para ver la palabra que se esta formando.
        palabra = ""
        for circulo_seleccionado in self.lista_seleccionados:
            index = self.lista_sprites_circulos.index(circulo_seleccionado)
            palabra += self.lista_sprites_letras[index].text
        print(palabra)

    def on_mouse_press(self, x: int, y: int, button: int, modifiers: int):
        self.track_mouse = True

    def on_mouse_release(self, x: int, y: int, button: int, modifiers: int):
        self.track_mouse = False
        self.lista_seleccionados.clear()
        for circulo in self.lista_sprites_circulos:
            circulo.visible = False

    def on_mouse_motion(self, x: float, y: float, dx: float, dy: float):
        if self.track_mouse:
            # revisamos para todo circulo si hay colision con las coords del mouse
            for circulo in self.lista_sprites_circulos:
                if circulo.collides_with_point([x, y]):
                    # podriamos preguntar si estan en la lista de seleccionados o si esta visibles
                    # el efecto es el mismo. saber si ya esta marcado
                    if circulo.visible:
                        # pueden pasar dos cosas. Una que el circulo en cuestion sea el ultimo marcado. En esta
                        # situación no hacemos nada. Si el circulo es el anterior entramos en el proceso de
                        # deseleccinar. Para entrar en el proceso de deseleción tiene que haber al menos 2. Entonces
                        # lo primero es pregruntar si podemos deseleccionar.
                        if len(self.lista_seleccionados)>=2:
                            # ya estaba marcado hay que ver si esta tacandose a si mismo o al anterior en la lista,
                            # si es asi desmarcar el actual. solo preguntamos por el anteultimo porque en el resto de
                            # los casos no hacemos nada
                            if circulo == self.lista_seleccionados[-2]:
                                self.lista_seleccionados[-1].visible = False
                                self.lista_seleccionados.pop()
                    else:
                        # lo marcamos
                        circulo.visible = True
                        self.lista_seleccionados.append(circulo)



def main():

    window = MyGame(1320, 720, "Drawing Example")

    arcade.run()
    # TexImg().crear_imagen()

main()