# This is a sample Python script.

# Press Mayús+F10 to execute it or replace it with your code.
# Press Double Shift to search everywhere for classes, files, tool windows, actions, and settings.
import json
import customtkinter
import tkinter
from PIL import Image
import os
import random

class Pregunta():
    def __int__(self):
        self.pregunta = ""

    def evaluar_respuesta(self):
        pass



class Cuestionario():
    def __init__(self, cuestionario_json):
        self.init_cuestionario(cuestionario_json)
        self.pregunta_actual = 0
        self.resultado = 0

    def cantidad_preguntas(self):
        print(self.conjunto_preguntas)
        return (len(self.conjunto_preguntas["preguntas"]))

    def imagen_pregunta_actual(self):
        return self.conjunto_preguntas["preguntas"][self.pregunta_actual]["imagen"]

    def obtener_pregunta_actual(self):
        return self.conjunto_preguntas["preguntas"][self.pregunta_actual]["pregunta"]
    def init_cuestionario(self, cuestionario_json):
        with open(cuestionario_json, "r") as f:
            self.conjunto_preguntas = json.load(f)

    def pregunta_siguiente(self):
        if self.pregunta_actual < self.cantidad_preguntas() - 1:
            self.pregunta_actual += 1

    def pregunta_anterior(self):
        if self.pregunta_actual>0:
            self.pregunta_actual-=1


class App(customtkinter.CTk):
    def __init__(self, cuestionario):
        super().__init__()
        self.geometry("500x280")
        self.frm = customtkinter.CTkFrame(self)
        self.cuestionario = cuestionario
        self.image_path="Imagenes"
        self.label_imagen = customtkinter.CTkLabel(self.frm, text="")
        self.label_imagen.grid(column=0, row=0, pady=10, padx=10)
        self.label_letras_cambiadas = customtkinter.CTkLabel(self.frm, text="", font=customtkinter.CTkFont(size=15, weight="bold"))
        self.label_letras_cambiadas.grid(column=1, row=0, columnspan=3)
        self.var_respuesta = tkinter.StringVar()
        self.frm_inferior = customtkinter.CTkFrame(self.frm)
        self.frm_inferior.grid(column=0, row=1,pady=5, padx=5)
        self.entry_respuesta = customtkinter.CTkEntry(self.frm_inferior, textvariable=self.var_respuesta)
        self.entry_respuesta.grid(column=1, row=0)
        self.button_anterior = customtkinter.CTkButton(self.frm_inferior, text="anterior", command=self.button_callbck_anterior)
        self.button_anterior.grid(column=0, row=0)
        self.button_siguiente = customtkinter.CTkButton(self.frm_inferior, text="siguiente", command=self.button_callbck_siguiente)
        self.button_siguiente.grid(column=2, row=0)
        self.button = customtkinter.CTkButton(self.frm_inferior, text="aceptar", command=self.button_callbck)
        self.button.grid(column=1, row=2, pady=5)
        self.frm.grid(column=0, row = 0 )
        self.cargar_pregunta()

    def button_callbck_anterior(self):
        self.cuestionario.pregunta_anterior()
        self.cargar_pregunta()
    def button_callbck_siguiente(self):
        self.cuestionario.pregunta_siguiente()
        self.cargar_pregunta()
    def cargar_pregunta(self):
        ima = Image.open(os.path.join(self.image_path, self.cuestionario.imagen_pregunta_actual()))
        self.image = customtkinter.CTkImage(ima, size=(260, 260 * (ima.size[1] / ima.size[0])))
        self.label_imagen.configure(image=self.image)
        cad = self.mezclar_cadena(cuestionario.obtener_pregunta_actual())
        self.label_letras_cambiadas.configure(text=cad)

    def button_callbck(self):
        print(self.var_respuesta.get())

    def mezclar_cadena(self, cadena):

        lst = list(cadena)
        random.shuffle(lst)
        mezcla = "".join(lst)
        print(mezcla)
        return mezcla

# Press the green button in the gutter to run the script.
if __name__ == '__main__':
    cuestionario = Cuestionario("wild _Animals.json")
    app = App(cuestionario)
    # app.mezclar_cadena("leon")
    app.mainloop()

    # print(cuestionario.cantidad_preguntas())
# See PyCharm help at https://www.jetbrains.com/help/pycharm/
