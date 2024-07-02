# import pygame
#
# pygame.init()
#
# width = 800
# height = 600
# screen = pygame.display.set_mode((width, height))
# pygame.display.set_caption("My Pygame Window")
# RED = (255, 0, 0)
# WHITE = (255, 255, 255)
# background_color = (0, 150, 0)
# screen.fill(background_color)
#
# pygame.display.flip()
#
# start_pos = (0, 0)  # Example starting position
# mouse_pos = (700, 300)  # Example ending position
# line_color = (255, 0, 0)  # Blue color
# thickness = 5  # Optional thickness
# track_mouse = False
#
# running = True
# while running:
#   for event in pygame.event.get():
#
#
#     if event.type == pygame.QUIT:
#       running = False
#     if event.type == pygame.MOUSEBUTTONDOWN:
#       # Get mouse position (x, y) coordinates
#       mouse_pos = pygame.mouse.get_pos()
#       track_mouse = True
#     if event.type == pygame.MOUSEBUTTONUP:
#       track_mouse = False
#     if event.type == pygame.MOUSEMOTION:
#       if track_mouse:
#         mouse_pos = pygame.mouse.get_pos()
#
#     screen.fill(WHITE)
#     pygame.draw.line(screen, RED, start_pos, mouse_pos, thickness)
#     pygame.display.flip()
#
# pygame.quit()
#


import arcade
from PIL import Image, ImageDraw, ImageFont
from arcade.gui import UIManager
import arcade.gui


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
        aux = Image.new("RGBA", (1, 1), (255, 255, 255, 0))
        # fnt = ImageFont.truetype("./fuentes/Ubuntu-Title.ttf", size)
        fnt = ImageFont.truetype("./fuentes/Mat Saleh.ttf", size)
        d = ImageDraw.Draw(aux)

        box = d.textbbox(xy=(0, 0), text=texto, font=fnt)
        texto_imagen = Image.new("RGBA", (box[2], box[3]), (255, 255, 255, 0))
        d = ImageDraw.Draw(texto_imagen)
        # draw multiline text
        d.text((0, 0), texto, font=fnt, fill=((162,126,150)))

        textura = arcade.Texture(name="texto", image=texto_imagen, hit_box_algorithm="Simple")
        super().__init__(texture=textura)


class Circulo_De_Letra(arcade.Sprite):
    def __init__(self):
        imagen = Image.open("./sprites/Circulo_letras.png")
        textura = arcade.load_texture("./sprites/Circulo_letras.png")
        # textura = arcade.Texture(name="texto", image=imagen, hit_box_algorithm="Detailed")
        super().__init__(texture=textura)
        self.center_x = (textura.size[0]/2)+100
        self.center_y = (textura.size[1]/2)+100
        print(self.position)

class Circulo_De_Letra(arcade.Sprite):
    def __init__(self):
        imagen = Image.open("./sprites/Circulo_letras.png")
        textura = arcade.load_texture("./sprites/Circulo_letras.png")
        # textura = arcade.Texture(name="texto", image=imagen, hit_box_algorithm="Detailed")
        super().__init__(texture=textura)
        self.center_x = (textura.size[0]/2)+100
        self.center_y = (textura.size[1]/2)+100
        print(self.position)


class MyGame(arcade.Window):

    def __init__(self, width, height, title):

        # Call the parent class's init function
        super().__init__(width, height, title)

        # Set the background color
        arcade.set_background_color(arcade.color.ASH_GREY)
        # self.texto_seleccionado = None
        # self.imagen_sprt = arcade.Sprite("Cuestionarios/wild_animals01/Imagenes/dolphin.png", scale=0.5, center_x=50, center_y=50)
        lista_letras = "DTEN"
        self.lista_sprites_letras = arcade.SpriteList()
        for i in range(1,len(lista_letras)):
            self.lista_sprites_letras.append(Text_Sprite(lista_letras[i]))
        # self.ui_manager = UIManager()
        # ui_input_box = arcade.gui.UIInputText(center_x = 300, center_y = 300, width = 300)
        # ui_input_box.text = 'UIInputBox'
        # ui_input_box.cursor_index = len(ui_input_box.text)
        # self.ui_manager.add(ui_input_box)
        self.start_pos = (0,0)
        self.end_pos = (0, 0)
        self.track_mouse = False
        self.circulo_letra = Circulo_De_Letra()

    def on_draw(self):
        """ Called whenever we need to draw the window. """
        arcade.start_render()
        arcade.draw_line(start_x= self.start_pos[0], start_y=self.start_pos[1],end_x= self.end_pos[0],end_y= self.end_pos[1], line_width=2, color=(0,0,255))
        self.circulo_letra.draw()
        self.lista_sprites_letras.draw()
        # self.imagen_sprt.draw()
        # self.ui_manager.draw()


    def on_mouse_press(self, x: int, y: int, button: int, modifiers: int):
        # if self.sprtTxt.collides_with_point((x,y)):
        #     self.texto_seleccionado = self.sprtTxt
        #     self.texto_seleccionado.x = x
        #     self.texto_seleccionado.y = y
        #     print("seleccionado")
        self.track_mouse = True
        self.end_pos = (x,y)

    def on_mouse_release(self, x: int, y: int, button: int, modifiers: int):
        # self.texto_seleccionado = None
        # print("liberado")
        self.track_mouse = False

    def on_mouse_motion(self, x: float, y: float, dx: float, dy: float):
      if self.track_mouse:
        self.end_pos = (x, y)

    # def on_mouse_drag(self, x: int, y: int, dx: int, dy: int, buttons: int, modifiers: int):
    #     # print("hol")
    #     if self.texto_seleccionado is not None:
    #         # self.texto_seleccionado. = x
    #         self.texto_seleccionado.center_y = y
    #         self.texto_seleccionado.center_x = x
    #         print("arrastrando")


def main():

    window = MyGame(1320, 720, "Drawing Example")

    arcade.run()
    # TexImg().crear_imagen()

main()