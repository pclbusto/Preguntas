import ttkbootstrap as ttk
from ttkbootstrap.constants import *
from PIL import Image, ImageTk
import os
import random
class Cuestionario(ttk.Window):

    def __init__(self):
        super().__init__()
        self.lista_banderas = os.listdir("Banderas/")
        self.lista_banderas = self.lista_banderas [:-10]
        self.lista_respuestas = []
        self.list_index = []
        for index in range(0,len(self.lista_banderas)):
            self.lista_banderas[index] = self.lista_banderas[index][:-4]
            self.list_index.append(index)
            self.lista_respuestas.append("")
        random.shuffle(self.list_index)
        self.current_index = 0

        self.variable = ttk.StringVar()
        self.ingreso = ttk.Entry(bootstyle="info", textvariable=self.variable)
        self.ingreso.grid(column=1, row=1, pady=5)
        self.ingreso.bind("<Return>",self.enter)
        self.boton_aceptar = ttk.Button(bootstyle="info", text="aceptar", command=self.aceptar)
        self.boton_aceptar.grid(column=1, row=2, pady=5)
        self.boton_siguiente = ttk.Button(bootstyle="info", text="siguiente", command=self.siguiente)
        self.boton_siguiente.grid(column=2, row=2, pady=5)
        self.boton_anterion = ttk.Button(bootstyle="info", text="anterior", command=self.anterior)
        self.boton_anterion.grid(column=0, row=2, pady=5)
        self.index_label = ttk.Label(bootstyle="info")
        self.index_label.grid(column=1, row=3, pady=5)
        self.load()

    def enter(self, event):
        self.internal_siguiente()   
    def load(self):
        path = "Banderas/"+self.lista_banderas[self.list_index[self.current_index]]+".png"
        self.image = Image.open(path)
        self.imagen_bandera = ImageTk.PhotoImage(self.image)
        self.bandera = ttk.Label(bootstyle="info", image=self.imagen_bandera)
        self.bandera.grid(column=1, row=0, pady=5)
        self.variable.set(self.lista_respuestas[self.current_index])
        self.index_label.config(text="{}/{}".format(self.current_index+1, len(self.list_index)))

    def internal_siguiente(self):
        self.lista_respuestas[self.current_index] = self.variable.get()
        if self.current_index < len(self.list_index) - 1:
            self.current_index += 1

        self.load()

    def siguiente(self):
        self.internal_siguiente()
    def anterior(self):
        self.lista_respuestas[self.current_index] = self.variable.get()
        if self.current_index > 0:
            self.current_index -= 1
        self.load()


    def aceptar(self):
        self.lista_respuestas[self.current_index] = self.variable.get()
        cadena_resultado = ""
        cantidad_correctos = 0
        for index in range(0, len(self.lista_banderas)):
            resultado = "ERROR"
            if self.lista_respuestas[index] == self.lista_banderas[self.list_index[index]]:
                resultado = "CORRECTO"
                cantidad_correctos += 1
            cadena_resultado+="\n{}: respuesta ingresada:{} respuesta correcta:{} resultado: {}".format(index, self.lista_respuestas[index], self.lista_banderas[self.list_index[index]], resultado)

        cadena_resultado+="\nNOTA:{}".format(10*(cantidad_correctos/len(self.lista_banderas)))
        self.label_resultado = ttk.Label(text=cadena_resultado)

        self.label_resultado.grid(row=4,column=1)

# root = ttk.Window()
#
# b1 = ttk.Button(root, text='primary', bootstyle=PRIMARY)
# b1.pack(side=LEFT, padx=5, pady=5)
#
# b2 = ttk.Button(root, text='secondary', bootstyle=SECONDARY)
# b2.pack(side=LEFT, padx=5, pady=5)
#
# b3 = ttk.Button(root, text='success', bootstyle=SUCCESS)
# b3.pack(side=LEFT, padx=5, pady=5)
#
# b4 = ttk.Button(root, text='info', bootstyle=INFO)
# b4.pack(side=LEFT, padx=5, pady=5)
#
# b5 = ttk.Button(root, text='warning', bootstyle=WARNING)
# b5.pack(side=LEFT, padx=5, pady=5)
#
# b6 = ttk.Button(root, text='danger', bootstyle=DANGER)
# b6.pack(side=LEFT, padx=5, pady=5)
#
# b7 = ttk.Button(root, text='light', bootstyle=LIGHT)
# b7.pack(side=LEFT, padx=5, pady=5)
#
# b8 = ttk.Button(root, text='dark', bootstyle=DARK)
# b8.pack(side=LEFT, padx=5, pady=5)
#

root = Cuestionario()
root.mainloop()

# import random
#
# cadena = "ENGLAND"
# l = list(cadena)
# random.shuffle(l)
# y = ''.join(l)
# print(y)


