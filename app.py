import os
import sqlite3
import requests
import smtplib
import random
import string
import urllib.parse
import google.generativeai as genai
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, render_template, request, jsonify, session, redirect, url_for, g, flash
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'LHEX_BILLIONAIRE_KEY_SECURE'
basedir = os.path.abspath(os.path.dirname(__file__))
DATABASE = os.path.join(basedir, 'lhex.db')

# --- 1. CONFIGURAÇÕES DO IMPÉRIO (PREENCHA AQUI) ---
GEMINI_KEY = "AIzaSyA-ibm_kkNyIcH3tmYwnsgpHZVGdva4Z2c"                  # <--- SUA CHAVE GOOGLE GEMINI
EVOLUTION_URL = "redis://lhex-redis:bURI73NTsNeUklKiTDCnN2DLcxsUos5QrmGKGYaGzH2YHWybM6uM01PrYtCHwLWB@dskoso8sgk8cg4k0s0gswc8s:6379/0" # <--- SEU LINK DO COOLIFY
EVOLUTION_KEY = "LHEX_MASTER_KEY"       # <--- SUA CHAVE DA EVOLUTION
ZOHO_EMAIL = "contato@lhexsystems.com"  # <--- SEU EMAIL ZOHO
ZOHO_PASSWORD = "161025lH."        # <--- SUA SENHA DE APP ZOHO
INSTANCE_NAME = "Lhex_Principal"

# Inicializa Gemini
try:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
except: pass

# --- 2. BANCO DE DADOS (SQLite) ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None: db = g._database = sqlite3.connect(DATABASE); db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_db(e):
    db = getattr(g, '_database', None)
    if db is not None: db.close()

def init_db():
    with app.app_context():
        db = get_db()
        # Cria tabela de usuários com suporte a token de recuperação
        db.execute('''CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY, 
            username TEXT UNIQUE, 
            password TEXT, 
            name TEXT, 
            email TEXT,
            reset_token TEXT,
            is_admin INTEGER DEFAULT 0
        )''')
        
        # Cria ADMIN se não existir
        try:
            db.execute("INSERT INTO users (username, password, name, email, is_admin) VALUES (?, ?, ?, ?, ?)", 
                       ('admin', generate_password_hash('Lhex@2026'), 'CEO Lelet', ZOHO_EMAIL, 1))
            db.commit()
        except: pass

# --- 3. FUNÇÕES DE INTELIGÊNCIA ---
def gerar_conteudo_lhex(tema, tom):
    try:
        # Texto via Gemini
        prompt = f"Crie uma legenda de Instagram curta, viral e de alto padrão (High Ticket) sobre '{tema}'. Tom: {tom}. Use emojis sofisticados."
        res = model.generate_content(prompt)
        legenda = res.text

        # Imagem via Pollinations (Grátis e Ilimitado)
        prompt_img = f"luxury photorealistic 8k image about {tema}, cinematic lighting, editorial vogue style, no text"
        clean_prompt = urllib.parse.quote(prompt_img)
        img_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=1024&height=1024&model=flux&nologo=true&seed={random.randint(0,9999)}"

        return {"success": True, "conteudo": legenda, "imagem": img_url}
    except Exception as e:
        return {"success": False, "erro": str(e)}

# --- 4. FUNÇÕES DE E-MAIL (RECUPERAÇÃO SENHA) ---
def enviar_email_recuperacao(email_destino, token):
    try:
        server = smtplib.SMTP_SSL('smtppro.zoho.com', 465)
        server.login(ZOHO_EMAIL, ZOHO_PASSWORD)
        
        msg = MIMEMultipart()
        msg['From'] = ZOHO_EMAIL
        msg['To'] = email_destino
        msg['Subject'] = "L.H.E.X | Recuperação de Acesso"
        
        body = f"""
        Olá.
        Seu código de recuperação é: {token}
        
        Se não foi você, ignore este e-mail.
        Att, L.H.E.X Systems.
        """
        msg.attach(MIMEText(body, 'plain'))
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(e)
        return False

# --- 5. ROTAS DO SISTEMA ---
@app.route('/')
def home(): return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        u = request.form.get('username')
        p = request.form.get('password')
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE username=?', (u,)).fetchone()
        
        if user and check_password_hash(user['password'], p):
            session['user_id'] = user['id']
            session['name'] = user['name']
            session['is_admin'] = user['is_admin']
            return redirect(url_for('dashboard'))
        
        return render_template('login.html', error="Acesso Negado. Verifique suas credenciais.")
    return render_template('login.html')

@app.route('/forgot_password', methods=['GET', 'POST'])
def forgot_password():
    if request.method == 'POST':
        email = request.form.get('email')
        db = get_db()
        user = db.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
        
        if user:
            token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
            db.execute('UPDATE users SET reset_token=? WHERE id=?', (token, user['id']))
            db.commit()
            if enviar_email_recuperacao(email, token):
                return render_template('login.html', success="Código enviado para seu e-mail!")
            else:
                return render_template('login.html', error="Erro ao enviar e-mail. Verifique SMTP.")
        return render_template('login.html', error="E-mail não encontrado.")
    
    return render_template('forgot.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect('/login')
    
    # Status do Zap
    status = "OFFLINE 🔴"
    try:
        r = requests.get(f"{EVOLUTION_URL}/instance/connectionState/{INSTANCE_NAME}", 
                        headers={"apikey": EVOLUTION_KEY}, timeout=2)
        if r.json().get('instance',{}).get('state') == 'open': status = "ONLINE 🟢"
    except: pass
    
    return render_template('dashboard.html', name=session['name'], status=status)

# --- 6. API INTERNA ---
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
    except Exception as e: return jsonify({'erro': str(e)})
    return jsonify({'erro': 'Falha'})

@app.route('/logout')
def logout(): session.clear(); return redirect('/')

init_db()
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
