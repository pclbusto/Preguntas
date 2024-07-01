import pygame

pygame.init()

width = 800
height = 600
screen = pygame.display.set_mode((width, height))
pygame.display.set_caption("My Pygame Window")
RED = (255, 0, 0)
WHITE = (255, 255, 255)
background_color = (0, 150, 0)
screen.fill(background_color)

pygame.display.flip()

start_pos = (0, 0)  # Example starting position
mouse_pos = (700, 300)  # Example ending position
line_color = (255, 0, 0)  # Blue color
thickness = 5  # Optional thickness
track_mouse = False

running = True
while running:
  for event in pygame.event.get():
    

    if event.type == pygame.QUIT:
      running = False
    if event.type == pygame.MOUSEBUTTONDOWN:
      # Get mouse position (x, y) coordinates
      mouse_pos = pygame.mouse.get_pos()
      track_mouse = True
    if event.type == pygame.MOUSEBUTTONUP:
      track_mouse = False
    if event.type == pygame.MOUSEMOTION:
      if track_mouse:
        mouse_pos = pygame.mouse.get_pos()
   
    screen.fill(WHITE)
    pygame.draw.line(screen, RED, start_pos, mouse_pos, thickness)
    pygame.display.flip()

pygame.quit()
