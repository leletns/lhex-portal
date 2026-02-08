import os
import requests
import urllib.parse
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'LHEX_BILLIONAIRE_KEY_FINAL'

# --- SUAS CHAVES (PREENCHA AQUI) ---
GEMINI_KEY = "AIzaSyA-ibm_kkNyIcH3tmYwnsgpHZVGdva4Z2c"                  # <--- SUA CHAVE NOVA (Google AI Studio)
EVOLUTION_URL = "https://api.lhexsystems.com" # <--- SEU LINK DO COOLIFY
EVOLUTION_KEY = "LHEX_MASTER_KEY"       # <--- SUA SENHA DA EVOLUTION
INSTANCE_NAME = "Lhex_Principal"
EMAIL_SUPORTE = "contato@lhexsystems.com"

# Configura IA
try:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
except: pass

# Usuários
users = {
    "admin": {"password": generate_password_hash("Lhex@2026"), "name": "CEO Lelet", "is_admin": True},
    "cliente": {"password": generate_password_hash("1234"), "name": "Dr. Cliente VIP", "is_admin": False}
}

# --- FUNÇÕES ---
def gerar_conteudo_lhex(tema, tom):
    try:
        # Texto IA
        prompt = f"Você é uma IA de Marketing de Luxo. Escreva uma legenda curta, impactante e viral para Instagram sobre: '{tema}'. Tom: {tom}. Use quebras de linha e emojis premium."
        res = model.generate_content(prompt)
        legenda = res.text

        # Imagem IA (Pollinations)
        prompt_img = f"editorial fashion photography about {tema}, luxury, cinematic lighting, 8k, vogue magazine style, no text"
        clean_prompt = urllib.parse.quote(prompt_img)
        img_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=1024&height=1024&model=flux&nologo=true"

        return {"success": True, "conteudo": legenda, "imagem": img_url}
    except Exception as e:
        return {"success": False, "erro": str(e)}

# --- ROTAS ---
@app.route('/')
def index():
    # A Landing Page de Mistério
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        u = request.form.get('username')
        p = request.form.get('password')
        if u in users and check_password_hash(users[u]['password'], p):
            session['user'] = u
            return redirect(url_for('dashboard'))
        return render_template('login.html', error="ACESSO NEGADO: CREDENCIAIS INVÁLIDAS")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user' not in session: return redirect('/login')
    # Checa Zap
    status = "OFFLINE 🔴"
    try:
        r = requests.get(f"{EVOLUTION_URL}/instance/connectionState/{INSTANCE_NAME}", 
                        headers={"apikey": EVOLUTION_KEY}, timeout=2)
        if r.json().get('instance',{}).get('state') == 'open': status = "ONLINE 🟢"
    except: pass
    
    return render_template('dashboard.html', user=users[session['user']], status=status, email=EMAIL_SUPORTE)

# --- API ---
@app.route('/api/gerar', methods=['POST'])
def api_gerar():
    d = request.json
    return jsonify(gerar_conteudo_lhex(d['tema'], d['tom']))

@app.route('/api/connect_zap', methods=['POST'])
def api_connect():
    h = {"apikey": EVOLUTION_KEY}
    try:
        requests.post(f"{EVOLUTION_URL}/instance/create", json={"instanceName": INSTANCE_NAME, "qrcode": True}, headers=h)
        r = requests.get(f"{EVOLUTION_URL}/instance/connect/{INSTANCE_NAME}", headers=h)
        data = r.json()
        if 'base64' in data: return jsonify({'qr': data['base64']})
        if 'code' in data: return jsonify({'qr': data['code']})
    except: pass
    return jsonify({'erro': 'Erro de Conexão'})

@app.route('/logout')
def logout(): session.clear(); return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
