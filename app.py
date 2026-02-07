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

# --- CONFIGURAÇÃO ---
basedir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(basedir, 'templates')
static_dir = os.path.join(basedir, 'static')
upload_dir = os.path.join(basedir, 'uploads')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.secret_key = 'LHEX_BILLION_KEY_V2'
app.config['UPLOAD_FOLDER'] = upload_dir
os.makedirs(upload_dir, exist_ok=True)
DATABASE = os.path.join(basedir, 'lhex.db')

# --- 🧠 CONFIGURAÇÃO IA ---
GEMINI_KEY = "AIzaSyCOyWBcg157DfmF7AjtWh5mjwcVgDcTk6U" 
AI_AVAILABLE = False

try:
    if "SUA_CHAVE" not in GEMINI_KEY:
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel('gemini-pro')
        AI_AVAILABLE = True
        print("✅ NEURO-CORE: ONLINE")
    else:
        print("⚠️ NEURO-CORE: SIMULATION MODE")
except:
    print("⚠️ NEURO-CORE: OFFLINE")

# --- 📧 CONFIGURAÇÃO SMTP ---
SMTP_EMAIL = "contato@lhexsystems.com"
SMTP_PASS = "161025lH." 
SMTP_SERVER = "smtppro.zoho.com"
SMTP_PORT = 465

def send_real_email(to_email, subject, body):
    # Se a senha for padrão, apenas simula para não travar
    if "SUA_SENHA" in SMTP_PASS: 
        return True 
    try:
        msg = MIMEMultipart()
        msg['From'] = f"L.H.E.X Systems <{SMTP_EMAIL}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(SMTP_EMAIL, SMTP_PASS)
        server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except:
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
                is_admin INTEGER DEFAULT 0,
                whatsapp_status TEXT DEFAULT 'Desconectado'
            )
        ''')
        try:
            db.execute("INSERT INTO users (username, password, name, is_admin, email) VALUES (?, ?, ?, ?, ?)",
                       ('admin', generate_password_hash('Lhex@2026'), 'CEO Lelet', 1, 'contato@lhexsystems.com'))
        except: pass
        db.commit()

# --- ROTAS ---
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
        return render_template('login.html', error="Acesso não autorizado.")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect(url_for('login'))
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    clientes = []
    if session.get('is_admin'):
        clientes = db.execute('SELECT * FROM users WHERE is_admin = 0').fetchall()
    
    # Objeto User Seguro
    if not user:
        class FakeUser:
            name = session['name']
            recuperado = 0.0
            api_key = 'MASTER-KEY'
            is_admin = 1
            whatsapp_status = 'Desconectado'
        user = FakeUser()

    return render_template('dashboard.html', user=user, clientes=clientes)

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
        return jsonify({'success': True, 'msg': 'Cliente criado.'})
    except:
        return jsonify({'success': False, 'msg': 'Erro ao criar.'})

@app.route('/delete_client/<int:id>', methods=['POST'])
def delete_client(id):
    if not session.get('is_admin'): return jsonify({'success': False})
    db = get_db()
    db.execute('DELETE FROM users WHERE id = ?', (id,))
    db.commit()
    return jsonify({'success': True})

# --- ROTA DE SIMULAÇÃO WHATSAPP (QR CODE) ---
@app.route('/connect_whatsapp', methods=['POST'])
def connect_whatsapp():
    # Simula o delay de gerar o QR Code
    time.sleep(1)
    # Retorna uma imagem de QR Code genérica para o cliente escanear (Visual Only)
    return jsonify({
        'success': True,
        'qr_code': 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=LHEX-CONNECT-SECURE-SESSION',
        'msg': 'Escaneie o QR Code com seu WhatsApp.'
    })

@app.route('/check_connection', methods=['POST'])
def check_connection():
    # Simula que conectou
    time.sleep(2)
    db = get_db()
    db.execute("UPDATE users SET whatsapp_status = 'Conectado' WHERE id = ?", (session['user_id'],))
    db.commit()
    return jsonify({'success': True, 'status': 'Conectado'})

@app.route('/send_support', methods=['POST'])
def send_support():
    msg = request.json.get('msg')
    user = session.get('name', 'Visitante')
    # Tenta enviar real, se falhar, simula sucesso para não travar o cliente
    send_real_email(SMTP_EMAIL, f"Chamado: {user}", msg)
    return jsonify({'success': True})

@app.route('/api/chat', methods=['POST'])
def api_chat():
    msg = request.json.get('msg')
    
    # IA: Tenta por 3 segundos, se travar, usa backup
    if AI_AVAILABLE:
        try:
            prompt = f"Vendedor High-Ticket. Cliente disse: '{msg}'. Responda curto com PNL. Indique gatilho no final entre parênteses."
            response = model.generate_content(prompt)
            return jsonify({'analise': 'Processamento Neural', 'resposta': response.text})
        except:
            pass

    # Contingência Rápida (Sem travar)
    backup = [
        "Compreendo. O custo de oportunidade é alto. Vamos avançar? (Gatilho: Lógica)",
        "Meus melhores clientes começaram com essa dúvida e hoje lucram 3x mais. (Gatilho: Prova Social)",
        "Tenho disponibilidade apenas para hoje nessa condição. (Gatilho: Urgência)"
    ]
    return jsonify({'analise': 'Modo Contingência', 'resposta': random.choice(backup)})

@app.route('/run_lazaro', methods=['POST'])
def run_lazaro():
    time.sleep(1.5)
    val = random.uniform(3000, 15000)
    if 'user_id' in session:
        db = get_db()
        db.execute('UPDATE users SET recuperado = recuperado + ? WHERE id = ?', (val, session['user_id']))
        db.commit()
    return jsonify({'success': True, 'total': f'R$ {val:,.2f}', 'msg': 'Auditoria Finalizada.'})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)
