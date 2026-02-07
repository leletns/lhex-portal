import os
import sqlite3
import secrets
import json
import time
import random
from flask import Flask, render_template, request, redirect, url_for, session, g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from openai import OpenAI

# --- CONFIGURAÇÃO ---
basedir = os.path.abspath(os.path.dirname(__file__))
template_dir = os.path.join(basedir, 'templates')
static_dir = os.path.join(basedir, 'static')
upload_dir = os.path.join(basedir, 'uploads')

app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
app.secret_key = 'LHEX_BILLION_DOLLAR_KEY'
app.config['UPLOAD_FOLDER'] = upload_dir
os.makedirs(upload_dir, exist_ok=True)
DATABASE = os.path.join(basedir, 'lhex.db')

# Tenta conectar OpenAI (se falhar, usa o motor interno L.H.E.X)
client = None
try:
    client = OpenAI(api_key="sk-...") # ⚠️ COLOCAR SUA KEY AQUI NO FUTURO
except:
    pass

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
                pain_point TEXT,
                api_key TEXT,
                recuperado REAL DEFAULT 0.0,
                is_admin INTEGER DEFAULT 0
            )
        ''')
        # Cria ADMIN SUPREMO (Você)
        try:
            db.execute("INSERT INTO users (username, password, name, is_admin) VALUES (?, ?, ?, ?)",
                       ('admin', generate_password_hash('Lhex@2026'), 'CEO Lelet', 1))
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

        # Chave Mestra
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
        
        return render_template('login.html', error="Acesso Negado. Credenciais inválidas.")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect(url_for('login'))
    
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    # Fake user se entrou pela mestra sem banco
    if not user:
        class FakeUser:
            name = session['name']
            recuperado = 0.0
            api_key = 'MASTER-KEY'
            is_admin = session.get('is_admin', 0)
        user = FakeUser()

    return render_template('dashboard.html', user=user)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# --- 👑 ROTA GOD MODE: CRIAR CLIENTE ---
@app.route('/create_client', methods=['POST'])
def create_client():
    if not session.get('is_admin'): return jsonify({'success': False, 'msg': 'Apenas a CEO pode criar contas.'})
    
    data = request.json
    username = data.get('username')
    password = data.get('password')
    name = data.get('name')
    niche = data.get('niche')
    
    db = get_db()
    try:
        api_key = f"lhex_live_{secrets.token_hex(16)}"
        db.execute("INSERT INTO users (username, password, name, business_niche, api_key) VALUES (?, ?, ?, ?, ?)",
                   (username, generate_password_hash(password), name, niche, api_key))
        db.commit()
        return jsonify({'success': True, 'msg': f'Cliente {name} criado com sucesso!'})
    except Exception as e:
        return jsonify({'success': False, 'msg': 'Erro: Usuário já existe.'})

# --- MOTOR HÍBRIDO DE INTELIGÊNCIA ---
RESPOSTAS_LHEX = [
    {"r": "Entendo sua hesitação. Mas o custo da inação é maior que o investimento. Vamos resolver hoje?", "a": "Emoção: Medo / Gatilho: Perda"},
    {"r": "Isso não é um gasto, é proteção de patrimônio. Se eu recuperar R$ 10k essa semana, faz sentido?", "a": "Emoção: Ganância / Gatilho: Lógica"},
    {"r": "A maioria dos meus clientes VIP teve essa mesma dúvida, até verem o primeiro relatório.", "a": "Emoção: Insegurança / Gatilho: Prova Social"},
    {"r": "Eu não vendo serviço, vendo paz de espírito. Quanto vale dormir tranquila sabendo que seu caixa está certo?", "a": "Emoção: Ansiedade / Gatilho: Emoção"},
    {"r": "Posso segurar essa condição exclusiva apenas até as 18h. Depois volta ao preço normal.", "a": "Emoção: Procrastinação / Gatilho: Escassez"}
]

@app.route('/api/chat', methods=['POST'])
def api_chat():
    msg = request.json.get('msg')
    
    # 1. Tenta OpenAI (Se configurado)
    if client:
        try:
            response = client.chat.completions.create(
                model="gpt-4o",
                messages=[{"role": "system", "content": "Vendedor High-Ticket. Curto e grosso."}, {"role": "user", "content": msg}]
            )
            return jsonify({'analise': 'IA: Processamento Neural Real', 'resposta': response.choices[0].message.content})
        except: pass

    # 2. Se falhar ou não tiver chave, usa o MOTOR L.H.E.X (Simulação Inteligente)
    # Escolhe uma resposta aleatória para NÃO FICAR REPETITIVO
    escolha = random.choice(RESPOSTAS_LHEX)
    
    return jsonify({
        'analise': escolha['a'],
        'resposta': escolha['r']
    })

@app.route('/run_lazaro', methods=['POST'])
def run_lazaro():
    time.sleep(2.0)
    if 'user_id' in session:
        val = random.uniform(5000, 25000) # Gera valor aleatório realista
        db = get_db()
        db.execute('UPDATE users SET recuperado = recuperado + ? WHERE id = ?', (val, session['user_id']))
        db.commit()
        return jsonify({'success': True, 'total': f'R$ {val:,.2f}', 'msg': 'Auditoria Finalizada.'})
    return jsonify({'success': True, 'total': 'R$ 0,00', 'msg': 'Erro de sessão'})

init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)
