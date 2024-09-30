import arcade
from arcade.gui import UIManager
from arcade.gui.widgets import UIFlatButton, UIBoxLayout, UIAnchorWidget


class UIMockup(arcade.Window):

    def __init__(self):
        super().__init__(800, 600, "Preguntas", resizable=True)
        self.manager = UIManager()
        self.manager.enable()
        arcade.set_background_color(arcade.color.ASH_GREY)

        self.v_box = UIBoxLayout(
            x=0, y=0,
            vertical=False,
            children=[
                UIFlatButton(text="can", color=arcade.color.RED).with_space_around(bottom=20),
                UIFlatButton(text="can't", color=arcade.color.RED).with_space_around(bottom=20),
                UIFlatButton(text="could", color=arcade.color.RED).with_space_around(bottom=20),
            ],
            space_between = 10)
        self.manager.add(
            UIAnchorWidget(
                anchor_x="center_x",
                # x_align=-50,
                anchor_y="center_y",
                # y_align=-20,
                child=self.v_box)
        )
    def on_draw(self):
        self.clear()
        self.manager.draw()


window = UIMockup()
arcade.run()
