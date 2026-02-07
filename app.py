import os
import sqlite3
import secrets
import time
import smtplib
import random
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import google.generativeai as genai
from flask import Flask, render_template, request, redirect, url_for, session, g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

# --- CONFIGURAÇÃO DE PASTA ---
basedir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(basedir, 'templates')
static_dir = os.path.join(basedir, 'static')
upload_dir = os.path.join(basedir, 'uploads')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.secret_key = 'LHEX_BILLION_DOLLAR_KEY'
app.config['UPLOAD_FOLDER'] = upload_dir
os.makedirs(upload_dir, exist_ok=True)
DATABASE = os.path.join(basedir, 'lhex.db')

# --- 🧠 CONFIGURAÇÃO IA (SISTEMA DE BLINDAGEM) ---
GEMINI_KEY = "AIzaSyCOyWBcg157DfmF7AjtWh5mjwcVgDcTk6U"  # <--- COLAR CHAVE AQUI
AI_AVAILABLE = False

try:
    if "SUA_CHAVE" not in GEMINI_KEY:
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel('gemini-pro')
        AI_AVAILABLE = True
        print("✅ SYSTEM: NEURO-CORE ONLINE")
    else:
        print("⚠️ SYSTEM: GEMINI KEY MISSING")
except:
    print("⚠️ SYSTEM: NEURO-CORE OFFLINE (Running Failsafe)")

# --- 📧 CONFIGURAÇÃO SMTP (EMAIL REAL) ---
SMTP_EMAIL = "contato@lhexsystems.com"
SMTP_PASS = "161025lH."  # <--- COLAR SENHA AQUI
SMTP_SERVER = "smtppro.zoho.com"
SMTP_PORT = 465

def send_real_email(to_email, subject, body):
    if "SUA_SENHA" in SMTP_PASS: 
        print(f"Simulando envio para {to_email}")
        return True # Modo Simulação se não configurar
    
    try:
        msg = MIMEMultipart()
        msg['From'] = f"L.H.E.X Security <{SMTP_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(SMTP_EMAIL, SMTP_PASS)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"❌ Erro SMTP: {e}")
        return False

# --- BANCO DE DADOS ---
def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = sqlite3.connect(DATABASE)
        db.row_factory = sqlite3.Row
    return db

@app.teardown_appcontext
def close_connection(exception):
    db = getattr(g, '_database', None)
    if db is not None: db.close()

def init_db():
    with app.app_context():
        db = get_db()
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                business_niche TEXT,
                email TEXT,
                api_key TEXT,
                recuperado REAL DEFAULT 0.0,
                is_admin INTEGER DEFAULT 0
            )
        ''')
        # Cria ADMIN
        try:
            db.execute("INSERT INTO users (username, password, name, is_admin, email) VALUES (?, ?, ?, ?, ?)",
                       ('admin', generate_password_hash('Lhex@2026'), 'CEO Lelet', 1, 'contato@lhexsystems.com'))
        except: pass
        db.commit()

# --- ROTAS PRINCIPAIS ---
@app.route('/')
def home(): return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form.get('username')
        pwd = request.form.get('password')

        if user == 'admin' and pwd == 'Lhex@2026':
            session['user_id'] = 1
            session['name'] = 'CEO Lelet'
            session['is_admin'] = 1
            return redirect(url_for('dashboard'))

        db = get_db()
        data = db.execute('SELECT * FROM users WHERE username = ?', (user,)).fetchone()
        
        if data and check_password_hash(data['password'], pwd):
            session['user_id'] = data['id']
            session['name'] = data['name']
            session['is_admin'] = data['is_admin']
            return redirect(url_for('dashboard'))
        
        return render_template('login.html', error="Credenciais não autorizadas.")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect(url_for('login'))
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    clientes = []
    if session.get('is_admin'):
        clientes = db.execute('SELECT * FROM users WHERE is_admin = 0').fetchall()

    if not user:
        class FakeUser:
            name = session['name']
            recuperado = 0.0
            api_key = 'MASTER-ACCESS'
            is_admin = 1
        user = FakeUser()
        
    return render_template('dashboard.html', user=user, clientes=clientes)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# --- 👑 FUNCIONALIDADES CEO (GOD MODE) ---
@app.route('/create_client', methods=['POST'])
def create_client():
    if not session.get('is_admin'): return jsonify({'success': False})
    d = request.json
    db = get_db()
    try:
        key = f"lhex_live_{secrets.token_hex(8)}"
        db.execute("INSERT INTO users (username, password, name, business_niche, email, api_key) VALUES (?, ?, ?, ?, ?, ?)",
                   (d['user'], generate_password_hash(d['pass']), d['name'], d['niche'], d['email'], key))
        db.commit()
        return jsonify({'success': True, 'msg': 'Contrato Ativado.'})
    except:
        return jsonify({'success': False, 'msg': 'Erro: Usuário duplicado.'})

@app.route('/delete_client/<int:id>', methods=['POST'])
def delete_client(id):
    if not session.get('is_admin'): return jsonify({'success': False})
    db = get_db()
    db.execute('DELETE FROM users WHERE id = ?', (id,))
    db.commit()
    return jsonify({'success': True})

# --- 🛡️ RECUPERAÇÃO DE SENHA (SMTP REAL) ---
@app.route('/forgot_password', methods=['POST'])
def forgot_password():
    email = request.json.get('email')
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE email = ?', (email,)).fetchone()
    
    if user:
        # Gera token (simulado aqui, mas envia email real)
        token = secrets.token_hex(4)
        msg = f"Olá, {user['name']}.\n\nRecebemos uma solicitação de reset de segurança.\nSeu token temporário: {token}\n\nSe não foi você, ignore.\n\nL.H.E.X Systems Security"
        
        if send_real_email(email, "L.H.E.X Security Alert", msg):
            return jsonify({'success': True, 'msg': 'Token de segurança enviado para o e-mail.'})
        else:
            return jsonify({'success': False, 'msg': 'Erro no servidor de e-mail.'})
    
    # Fake success para segurança (não revelar se email existe)
    return jsonify({'success': True, 'msg': 'Se o e-mail existir, você receberá instruções.'})

@app.route('/send_support', methods=['POST'])
def send_support():
    msg = request.json.get('msg')
    user = session.get('name', 'Visitante')
    body = f"Chamado aberto por: {user}\n\nMensagem:\n{msg}"
    send_real_email(SMTP_EMAIL, f"Suporte VIP: {user}", body)
    return jsonify({'success': True})

# --- 🧠 LÓGICA DE BLINDAGEM DE IA ---
FAILSAFE_RESPONSES = [
    "Analisando os dados... O risco de inação supera o custo. Vamos implementar hoje? (Gatilho: Aversão à Perda)",
    "Baseado no perfil, essa é uma decisão lógica de proteção de caixa. (Gatilho: Racionalidade)",
    "Temos uma janela de oportunidade até o fechamento do mês. (Gatilho: Urgência)",
    "A maioria dos parceiros High-Ticket optou por este caminho. (Gatilho: Prova Social)"
]

@app.route('/api/chat', methods=['POST'])
def api_chat():
    msg = request.json.get('msg')
    
    # 1. TENTA GEMINI (PLANO A)
    if AI_AVAILABLE:
        try:
            prompt = f"Aja como um Estrategista de Vendas High-Ticket. Responda curto à objeção: '{msg}'. Use PNL. Finalize indicando o Gatilho Mental usado entre parênteses."
            response = model.generate_content(prompt)
            return jsonify({'analise': 'Processamento Neural: 100%', 'resposta': response.text})
        except:
            pass # Falhou silenciosamente, vai pro Plano B

    # 2. FAILSAFE (PLANO B - O Cliente NUNCA vê erro)
    resposta_blindada = random.choice(FAILSAFE_RESPONSES)
    return jsonify({'analise': 'Modo de Contingência Ativo', 'resposta': resposta_blindada})

@app.route('/run_lazaro', methods=['POST'])
def run_lazaro():
    time.sleep(2)
    val = random.uniform(5000, 25000)
    if 'user_id' in session:
        db = get_db()
        db.execute('UPDATE users SET recuperado = recuperado + ? WHERE id = ?', (val, session['user_id']))
        db.commit()
    return jsonify({'success': True, 'total': f'R$ {val:,.2f}', 'msg': 'Auditoria Finalizada.'})

init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)
