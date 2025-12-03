import pygame
import sys
import math

# --- Constants ---
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600
FPS = 60

# Colors (R, G, B)
GREEN_FIELD = (50, 170, 80)
WHITE = (255, 255, 255)
RED_TEAM = (230, 50, 50)
BLUE_TEAM = (50, 50, 230)
BLACK = (0, 0, 0)

# --- Classes ---

class Ball:
    def __init__(self, x, y):
        self.x = x
        self.y = y
        self.radius = 10
        self.color = WHITE
        # Velocity (speed)
        self.vx = 3
        self.vy = 3
        self.friction = 0.99  # Slows ball down slightly over time

    def move(self):
        # Update position based on velocity
        self.x += self.vx
        self.y += self.vy

        # Friction (optional, makes it feel more like grass)
        self.vx *= self.friction
        self.vy *= self.friction

        # Wall Collision (Bounce)
        # Right/Left Walls
        if self.x + self.radius > SCREEN_WIDTH:
            self.x = SCREEN_WIDTH - self.radius
            self.vx *= -1
        elif self.x - self.radius < 0:
            self.x = self.radius
            self.vx *= -1
        
        # Top/Bottom Walls
        if self.y + self.radius > SCREEN_HEIGHT:
            self.y = SCREEN_HEIGHT - self.radius
            self.vy *= -1
        elif self.y - self.radius < 0:
            self.y = self.radius
            self.vy *= -1

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.radius)
        # Draw a thin black outline for style
        pygame.draw.circle(screen, BLACK, (int(self.x), int(self.y)), self.radius, 1)

class Player:
    def __init__(self, x, y, color):
        self.x = x
        self.y = y
        self.radius = 15
        self.color = color
        self.speed = 4

    def handle_input(self):
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            self.x -= self.speed
        if keys[pygame.K_RIGHT]:
            self.x += self.speed
        if keys[pygame.K_UP]:
            self.y -= self.speed
        if keys[pygame.K_DOWN]:
            self.y += self.speed

        # Keep player on screen
        self.x = max(self.radius, min(self.x, SCREEN_WIDTH - self.radius))
        self.y = max(self.radius, min(self.y, SCREEN_HEIGHT - self.radius))

    def draw(self, screen):
        pygame.draw.circle(screen, self.color, (int(self.x), int(self.y)), self.radius)
        pygame.draw.circle(screen, BLACK, (int(self.x), int(self.y)), self.radius, 1)

# --- Main Game Setup ---
pygame.init()
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption("Simple Soccer Sim")
clock = pygame.time.Clock()

# Create objects
ball = Ball(SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2)
player1 = Player(200, 300, RED_TEAM)

# --- Game Loop ---
running = True
while running:
    # 1. Event Handling (Input)
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    player1.handle_input()

    # 2. Physics & Logic
    ball.move()

    # Simple Kick Mechanic (Collision)
    # Distance formula: sqrt((x2-x1)^2 + (y2-y1)^2)
    dist_x = ball.x - player1.x
    dist_y = ball.y - player1.y
    distance = math.sqrt(dist_x**2 + dist_y**2)

    if distance < (ball.radius + player1.radius):
        # Collision detected!
        # Push ball away from player
        # We normalize the vector to get direction, then multiply by kick power
        if distance == 0: distance = 0.1 # prevent divide by zero
        ball.vx = (dist_x / distance) * 6
        ball.vy = (dist_y / distance) * 6

    # 3. Drawing
    screen.fill(GREEN_FIELD)
    
    # Draw Center Line
    pygame.draw.line(screen, WHITE, (SCREEN_WIDTH // 2, 0), (SCREEN_WIDTH // 2, SCREEN_HEIGHT), 2)
    # Draw Center Circle
    pygame.draw.circle(screen, WHITE, (SCREEN_WIDTH // 2, SCREEN_HEIGHT // 2), 70, 2)

    ball.draw(screen)
    player1.draw(screen)

    # 4. Display Update
    pygame.display.flip()
    clock.tick(FPS)

pygame.quit()
sys.exit()