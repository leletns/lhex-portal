import os
import sqlite3
import secrets
import json
import time
from flask import Flask, render_template, request, redirect, url_for, session, g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from openai import OpenAI

app = Flask(__name__)
# CHAVE DE SEGURANÇA BANCÁRIA
app.secret_key = 'LHEXUNICORNKEY2026SYSTEMS'

# --- CONFIGURAÇÃO ---
app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
DATABASE = 'lhex.db'

# ⚠️ SUA CHAVE OPENAI (Se não tiver agora, deixe assim, o site abre igual)
client = OpenAI(api_key="sk-...") 

# --- CONEXÃO BANCO DE DADOS ---
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

# --- INICIALIZAÇÃO AUTOMÁTICA (O Robô se constrói) ---
def init_db():
    with app.app_context():
        db = get_db()
        # Cria a tabela de Clientes com DNA do Negócio
        db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                name TEXT NOT NULL,
                business_niche TEXT,
                pain_point TEXT,
                api_key TEXT,
                recuperado REAL DEFAULT 0.0
            )
        ''')
        # Cria ADMIN (Você)
        try:
            db.execute("INSERT INTO users (username, password, name) VALUES (?, ?, ?)",
                       ('admin', generate_password_hash('Lhex@2026'), 'CEO Lelet'))
        except: pass
        
        # Cria CLIENTE DEMO (Dr. Roberto)
        try:
            # Gera uma chave de API profissional para ele
            api_key = f"lhex_live_{secrets.token_hex(16)}"
            db.execute("INSERT INTO users (username, password, name, business_niche, pain_point, api_key) VALUES (?, ?, ?, ?, ?, ?)",
                       ('cliente', generate_password_hash('1234'), 'Dr. Roberto', 'Estética Avançada', 'Medo de resultados artificiais', api_key))
        except: pass
        
        db.commit()

# --- INTEGRAÇÃO SNIPER (O Cérebro de Vendas) ---
def gerar_resposta_sniper(nicho, dor, msg):
    prompt = f"""
    ATUE COMO: Maior especialista em vendas de {nicho}.
    CLIENTE SENTE: {dor}.
    Analise: "{msg}".
    Retorne JSON: {{ "analise": "Emoção", "gatilho": "Técnica", "resposta": "Texto curto WhatsApp" }}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o", messages=[{"role": "system", "content": prompt}], response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except:
        return {"analise": "IA Offline", "gatilho": "Erro", "resposta": "Erro de conexão."}

# --- ROTAS (Onde o cliente clica) ---
@app.route('/')
def home(): return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form['username']
        pwd = request.form['password']
        db = get_db()
        data = db.execute('SELECT * FROM users WHERE username = ?', (user,)).fetchone()
        if data and check_password_hash(data['password'], pwd):
            session['user_id'] = data['id']
            session['name'] = data['name']
            return redirect(url_for('dashboard'))
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect(url_for('login'))
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    return render_template('dashboard.html', user=user)

# API: O Chat que fala com o JavaScript do Dashboard
@app.route('/api/chat', methods=['POST'])
def api_chat():
    if 'user_id' not in session: return jsonify({'error': 'Login'})
    data = request.json
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    nicho = user['business_niche'] if user['business_niche'] else "Vendas"
    dor = user['pain_point'] if user['pain_point'] else "Preço"
    
    return jsonify(gerar_resposta_sniper(nicho, dor, data.get('msg')))

# API: Lázaro (Simulação de Auditoria)
@app.route('/run_lazaro', methods=['POST'])
def run_lazaro():
    if 'user_id' not in session: return jsonify({'error': 'Login'})
    time.sleep(1.5) # Charme
    return jsonify({'success': True, 'msg': 'Divergências encontradas.', 'total': "R$ 15.450,30"})

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# INICIA TUDO
init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)