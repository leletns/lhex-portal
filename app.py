import os
import requests
import urllib.parse
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'LHEX_BILLIONAIRE_KEY_V2'

# --- SUAS CHAVES (O COFRE) ---
GEMINI_KEY = "AIzaSyA-ibm_kkNyIcH3tmYwnsgpHZVGdva4Z2c" # <--- SUA CHAVE GOOGLE (AIza...)
EVOLUTION_URL = "https://api.lhexsystems.com" # <--- SEU LINK COOLIFY
EVOLUTION_KEY = "LHEX_MASTER_KEY"       # <--- SUA CHAVE EVOLUTION
INSTANCE_NAME = "Lhex_Principal"
EMAIL_SUPORTE = "contato@lhexsystems.com"

# --- CORREÇÃO DO ERRO DA IA ---
try:
    genai.configure(api_key=GEMINI_KEY)
    # Mudamos para 'gemini-pro' que é estável e não dá erro 404
    model = genai.GenerativeModel('gemini-pro') 
except: pass

users = {
    "admin": {"password": generate_password_hash("Lhex@2026"), "name": "CEO Lelet", "is_admin": True},
    "cliente": {"password": generate_password_hash("1234"), "name": "Dr. Cliente VIP", "is_admin": False}
}

# --- FUNÇÕES ---
def gerar_conteudo_lhex(tema, tom):
    try:
        # Texto (Gemini Pro)
        prompt = f"Você é um Copywriter de Luxo. Escreva uma legenda para Instagram sobre '{tema}'. Tom: {tom}. Use estrutura AIDA (Atenção, Interesse, Desejo, Ação). Use emojis sofisticados."
        res = model.generate_content(prompt)
        legenda = res.text

        # Imagem (Pollinations)
        prompt_img = f"luxury editorial photography about {tema}, cinematic lighting, 8k, vogue style, no text, minimalist"
        clean_prompt = urllib.parse.quote(prompt_img)
        img_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=1024&height=1024&model=flux&nologo=true"

        return {"success": True, "conteudo": legenda, "imagem": img_url}
    except Exception as e:
        return {"success": False, "erro": "Erro na IA: " + str(e)}

# --- ROTAS ---
@app.route('/')
def index(): return render_template('index.html', email=EMAIL_SUPORTE)

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
    status = "OFFLINE 🔴"
    try:
        r = requests.get(f"{EVOLUTION_URL}/instance/connectionState/{INSTANCE_NAME}", 
                        headers={"apikey": EVOLUTION_KEY}, timeout=2)
        if r.json().get('instance',{}).get('state') == 'open': status = "ONLINE 🟢"
    except: pass
    return render_template('dashboard.html', user=users[session['user']], status=status)

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
    return jsonify({'erro': 'Falha na conexão com servidor'})

@app.route('/logout')
def logout(): session.clear(); return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
