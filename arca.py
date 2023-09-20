import arcade
from PIL import Image, ImageDraw, ImageFont

class TexImg:
    def crear_imagen(self):
        out1 = Image.new("RGBA", (1, 1), (255, 255, 255,0))
        # out = out.convert('RGBA')
        # out.a
        # get a font
        fnt = ImageFont.truetype("Batman.ttf", 40)
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


class MyGame(arcade.Window):

    def __init__(self, width, height, title):

        # Call the parent class's init function
        super().__init__(width, height, title)

        # Set the background color
        arcade.set_background_color(arcade.color.ASH_GREY)
        self.texto = arcade.Text(text="Giraffe",start_x=50, start_y=50, color=(231,51,123),font_size=50, font_name="Comic Sans MS")
        self.texto_sprite = arcade.create_text_sprite(text="Giraffe",start_x=150, start_y=150, color=(231,51,123),font_size=50, font_name="Comic Sans MS")
        self.texto_sprite._hit_box_algorithm = "Detailed"
        self.texto_seleccionado = None
        textura = arcade.Texture(name="texto",image=TexImg().crear_imagen(),hit_box_algorithm = "Simple")
        self.sprtTxt = arcade.Sprite(texture=textura)
        self.sprtTxt.center_x=200
        self.sprtTxt.center_y=200
        # self.sprtTxt.hit_box = self.sprtTxt.texture.hit_box_points
    def on_draw(self):
        """ Called whenever we need to draw the window. """
        arcade.start_render()

        self.texto.draw()
        self.texto_sprite.draw()
        self.texto_sprite.draw_hit_box()
        self.sprtTxt.draw()
        self.sprtTxt.draw_hit_box()


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

    window = MyGame(640, 480, "Drawing Example")

    arcade.run()
    # TexImg().crear_imagen()

main()