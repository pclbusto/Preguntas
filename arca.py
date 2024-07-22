import arcade
from PIL import Image, ImageDraw, ImageFont
from arcade.gui import UIManager
import arcade.gui

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
    def __init__(self, texto="", size=40):
        aux = Image.new("RGBA", (1, 1), (255, 255, 255, 0))
        fnt = ImageFont.truetype("./fuentes/Ubuntu-Title.ttf", size)
        d = ImageDraw.Draw(aux)
        box = d.textbbox(xy=(0, 0), text=texto, font=fnt)
        texto_imagen = Image.new("RGBA", (box[2], box[3]), (255, 255, 255, 0))
        d = ImageDraw.Draw(texto_imagen)
        # draw multiline text
        d.text((0, 0), texto, font=fnt, fill=((162,126,150)))
        textura = arcade.Texture(name="texto", image=texto_imagen, hit_box_algorithm="Simple")
        super().__init__(texture=textura)



class MyGame(arcade.Window):

    def __init__(self, width, height, title):

        # Call the parent class's init function
        super().__init__(width, height, title)

        # Set the background color
        arcade.set_background_color(arcade.color.ASH_GREY)
        self.texto_seleccionado = None
        self.imagen_sprt = arcade.Sprite("Cuestionarios/wild_animals01/Imagenes/dolphin.png", scale=0.5, center_x=50, center_y=50)
        self.sprtTxt = Text_Sprite("dolphin")
        self.sprtTxt.center_x=200
        self.sprtTxt.center_y=200
        self.ui_manager = UIManager()
        ui_input_box = arcade.gui.UIInputText(center_x = 300, center_y = 300, width = 300)
        ui_input_box.text = 'UIInputBox'
        ui_input_box.cursor_index = len(ui_input_box.text)
        self.ui_manager.add(ui_input_box)

    def on_draw(self):
        """ Called whenever we need to draw the window. """
        arcade.start_render()
        self.sprtTxt.draw()
        self.imagen_sprt.draw()
        self.ui_manager.draw()


    def on_mouse_press(self, x: int, y: int, button: int, modifiers: int):
        if self.sprtTxt.collides_with_point((x,y)):
            self.texto_seleccionado = self.sprtTxt
            self.texto_seleccionado.x = x
            self.texto_seleccionado.y = y
            print("seleccionado")

    def on_mouse_release(self, x: int, y: int, button: int, modifiers: int):
        self.texto_seleccionado = None
        print("liberado")

    def on_mouse_drag(self, x: int, y: int, dx: int, dy: int, buttons: int, modifiers: int):
        # print("hol")
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