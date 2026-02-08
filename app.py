import os
import requests
import urllib.parse
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'LHEX_BILLIONAIRE_KEY_FINAL_V3'

# --- SUAS CHAVES (O COFRE) ---
# PREENCHA COM CUIDADO:
GEMINI_KEY = "AIzaSyA-ibm_kkNyIcH3tmYwnsgpHZVGdva4Z2c"                  # <--- SUA CHAVE GOOGLE AI STUDIO
EVOLUTION_URL = "https://api.lhexsystems.com" # <--- SEU LINK COOLIFY
EVOLUTION_KEY = "redis://lhex-redis:bURI73NTsNeUklKiTDCnN2DLcxsUos5QrmGKGYaGzH2YHWybM6uM01PrYtCHwLWB@dskoso8sgk8cg4k0s0gswc8s:6379/0"       # <--- SUA CHAVE EVOLUTION
INSTANCE_NAME = "Lhex_Principal"

# --- CONFIGURAÇÃO DA IA (ANTI-ROBÔ) ---
try:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-pro')
except: pass

users = {
    "admin": {"password": generate_password_hash("Lhex@2026"), "name": "CEO Lelet", "is_admin": True},
    "cliente": {"password": generate_password_hash("1234"), "name": "Dr. Cliente VIP", "is_admin": False}
}

# --- PRODUTO: SOCIAL MEDIA (ALTO PADRÃO) ---
def gerar_conteudo_lhex(tema, tom):
    try:
        # Prompt "CEO Level" - Sem emojis infantis
        prompt = f"""
        Atue como um Estrategista de Marca de Luxo. Escreva uma legenda para Instagram sobre '{tema}'.
        O tom deve ser: {tom}.
        REGRAS:
        1. NÃO use emojis excessivos (máximo 1 discreto no final).
        2. Linguagem sóbria, direta e autoritária.
        3. Foco em dor e solução high-ticket.
        4. Estrutura: Gancho forte -> Argumento Lógico -> Chamada para ação elegante.
        """
        res = model.generate_content(prompt)
        legenda = res.text

        # Imagem (Pollinations - Realismo)
        prompt_img = f"minimalist luxury photography about {tema}, dark mood, cinematic lighting, 8k, architectural digest style, no text"
        clean_prompt = urllib.parse.quote(prompt_img)
        img_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=1024&height=1024&model=flux&nologo=true"

        return {"success": True, "conteudo": legenda, "imagem": img_url}
    except Exception as e:
        print(f"Erro IA: {e}") # Log no servidor
        return {"success": False, "erro": "Erro na IA. Verifique a Chave API."}

# --- ROTAS ---
@app.route('/')
def index(): 
    # Passa URL da logo para o preview do WhatsApp
    return render_template('index.html', logo_url=url_for('static', filename='logo.png', _external=True))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        u = request.form.get('username')
        p = request.form.get('password')
        if u in users and check_password_hash(users[u]['password'], p):
            session['user'] = u
            return redirect(url_for('dashboard'))
        return render_template('login.html', error="CREDENCIAIS INVÁLIDAS")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user' not in session: return redirect('/login')
    
    # Checa Zap (Timeout curto para não travar a tela)
    status = "OFFLINE 🔴"
    try:
        r = requests.get(f"{EVOLUTION_URL}/instance/connectionState/{INSTANCE_NAME}", 
                        headers={"apikey": EVOLUTION_KEY}, timeout=1)
        if r.json().get('instance',{}).get('state') == 'open': status = "ONLINE 🟢"
    except: pass
    
    return render_template('dashboard.html', user=users[session['user']], status=status)

# --- API FUNCIONAL ---
@app.route('/api/gerar', methods=['POST'])
def api_gerar():
    d = request.json
    return jsonify(gerar_conteudo_lhex(d.get('tema'), d.get('tom')))

@app.route('/api/connect_zap', methods=['POST'])
def api_connect():
    h = {"apikey": EVOLUTION_KEY}
    try:
        # Cria instância se não existir
        requests.post(f"{EVOLUTION_URL}/instance/create", json={"instanceName": INSTANCE_NAME, "qrcode": True}, headers=h)
        # Pede QR
        r = requests.get(f"{EVOLUTION_URL}/instance/connect/{INSTANCE_NAME}", headers=h)
        data = r.json()
        
        # Tratamento de erro robusto
        if 'base64' in data: return jsonify({'success': True, 'qr': data['base64']})
        if 'code' in data: return jsonify({'success': True, 'qr': data['code']})
        return jsonify({'success': False, 'msg': 'Instância já conectada ou erro no servidor.'})
    except Exception as e:
        return jsonify({'success': False, 'msg': str(e)})

@app.route('/logout')
def logout(): session.clear(); return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
