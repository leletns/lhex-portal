from PIL import Image, ImageOps

def create_billionaire_preview():
    try:
        # 1. Configurações da Vitrine
        WIDTH, HEIGHT = 1200, 630
        BG_COLOR = (5, 5, 5) # Preto L.H.E.X (#050505)
        
        # 2. Carrega sua logo
        logo = Image.open("logo.png").convert("RGBA")
        
        # 3. Cria o Canvas Preto (O Palco)
        preview = Image.new("RGB", (WIDTH, HEIGHT), BG_COLOR)
        
        # 4. TRUQUE DE DESIGN: 
        # Se a logo tiver fundo branco, vamos criar um "Card" elegante para ela
        # Se for transparente, ela vai flutuar no preto.
        
        # Redimensiona a logo para caber no centro com respiro (Padding)
        # Deixamos ela com 400px de altura max para não ficar gigante
        logo.thumbnail((500, 500), Image.Resampling.LANCZOS)
        
        # Calcula o centro exato
        x_center = (WIDTH - logo.width) // 2
        y_center = (HEIGHT - logo.height) // 2
        
        # 5. O Efeito "Glow" (Opcional - só se a logo for transparente)
        # Se não for transparente, colamos direto.
        preview.paste(logo, (x_center, y_center), logo if logo.mode == 'RGBA' else None)
        
        # 6. Salva o Ouro
        preview.save("preview.png")
        print("✅ SUCESSO! Arquivo 'preview.png' criado.")
        print("Agora suba ele para o GitHub e veja a mágica no WhatsApp.")
        
    except Exception as e:
        print(f"❌ Erro: {e}")
        print("Verifique se o arquivo 'logo.png' está na mesma pasta.")

if __name__ == "__main__":
    create_billionaire_preview()
