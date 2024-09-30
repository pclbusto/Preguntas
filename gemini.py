import google.generativeai as genai
import os

genai.configure(api_key="AIzaSyA_qKebPRHPnJPFvTf_c3dyFu_5PEhTMtA")
model = genai.GenerativeModel("gemini-1.5-flash")
response = model.generate_content("ejercicios de could y couldn't usando boat, run, river, jumpp, bridge, clim and rocks")
print(response.text)