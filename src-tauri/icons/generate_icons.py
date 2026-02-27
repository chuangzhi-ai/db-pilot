from PIL import Image
import os

sizes = [32, 128, 256]
for size in sizes:
    img = Image.new('RGB', (size, size), color='#3b82f6')
    img.save(f'{size}x{size}.png')
    
# Create placeholder for other formats
print("Icons created: 32x32.png, 128x128.png, 256x256.png")
