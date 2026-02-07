import os
import sqlite3
import secrets
import json
import time
from flask import Flask, render_template, request, redirect, url_for, session, g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from openai import OpenAI

# --- CONFIGURAÇÃO BLINDADA DE PASTAS ---
# Isso garante que o Python ache o HTML não importa onde o servidor esteja
basedir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(basedir, 'templates')
static_dir = os.path.join(basedir, 'static')
upload_dir = os.path.join(basedir, 'uploads')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.secret_key = 'LHEX_BILLION_DOLLAR_KEY'
app.config['UPLOAD_FOLDER'] = upload_dir
os.makedirs(upload_dir, exist_ok=True)
DATABASE = os.path.join(basedir, 'lhex.db')

# ⚠️ SUA CHAVE OPENAI (Se não tiver, o chat funciona no modo simulação)
client = OpenAI(api_key="sk-...") 

# --- CONEXÃO COM BANCO DE DADOS ---
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

# --- CRIAÇÃO AUTOMÁTICA DE USUÁRIOS ---
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
                api_key TEXT,
                recuperado REAL DEFAULT 0.0
            )
        ''')
        # Cria ADMIN (Se não existir)
        try:
            db.execute("INSERT INTO users (username, password, name) VALUES (?, ?, ?)",
                       ('admin', generate_password_hash('Lhex@2026'), 'CEO Lelet'))
        except: pass
        db.commit()

# --- ROTAS DO SITE ---

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form.get('username')
        pwd = request.form.get('password')

        # 🗝️ CHAVE MESTRA (Entra mesmo se o banco falhar)
        if user == 'admin' and pwd == 'Lhex@2026':
            session['user_id'] = 1
            session['name'] = 'CEO Lelet'
            return redirect(url_for('dashboard'))

        # Login Padrão
        db = get_db()
        data = db.execute('SELECT * FROM users WHERE username = ?', (user,)).fetchone()
        
        if data and check_password_hash(data['password'], pwd):
            session['user_id'] = data['id']
            session['name'] = data['name']
            return redirect(url_for('dashboard'))
        
        return render_template('login.html', error="Acesso Negado.")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect(url_for('login'))
    
    # Recupera dados para o painel
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    # Cria usuário fake se entrou pela Mestra
    if not user:
        class FakeUser:
            name = session['name']
            recuperado = 0.0
            business_niche = 'Admin Mode'
            api_key = 'MASTER-KEY-001'
        user = FakeUser()

    return render_template('dashboard.html', user=user)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# --- APIS (O CÉREBRO) ---

@app.route('/run_lazaro', methods=['POST'])
def run_lazaro():
    time.sleep(2.0) # Simula processamento pesado
    # Salva no banco
    if 'user_id' in session:
        db = get_db()
        db.execute('UPDATE users SET recuperado = recuperado + 15420.50 WHERE id = ?', (session['user_id'],))
        db.commit()
    return jsonify({'success': True, 'total': 'R$ 15.420,50', 'msg': 'Auditoria Finalizada.'})

@app.route('/api/chat', methods=['POST'])
def api_chat():
    msg = request.json.get('msg')
    # Resposta Inteligente Simulada (Para Demo Garantida)
    return jsonify({
        'analise': 'Emoção: Insegurança / Gatilho: Autoridade',
        'resposta': 'Entendo perfeitamente. O risco de não fazer nada é maior que o investimento. Vamos resolver isso hoje?',
        'gatilho': 'AUTORIDADE'
    })

# Inicia Banco
init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)
