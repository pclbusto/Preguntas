import arcade


class MyGame(arcade.Window):

    def __init__(self, width, height, title):

        # Call the parent class's init function
        super().__init__(width, height, title)
        self.palabra = arcade.create_text_sprite(text="Jiraffe",start_x=110,start_y=110,color=(255,120,0),font_size=60,font_name="Konichiwa", align="left")
        self.texto = arcade.Text(text="Jiraffe",start_y=40,start_x=40,color=(134,214,123),font_size=60,font_name="Konichiwa", align="left",width=1)
        self.sprite = arcade.Sprite(image_x=40, image_y=40,image_width=self.texto.content_width, image_height=self.texto.content_height,hit_box_algorithm = "Simple")
        print(self.texto.content_width)
    def on_draw(self):
        self.palabra.draw()
        self.texto.draw()
def main():
    window = MyGame(640, 480, "Drawing Example")

    arcade.run()


main()