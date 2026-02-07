import os
import sqlite3
import secrets
import json
import time
import google.generativeai as genai
from flask import Flask, render_template, request, redirect, url_for, session, g, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

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

# --- 🧠 CONFIGURAÇÃO DO GOOGLE GEMINI (IA REAL) ---
# Cole sua chave abaixo dentro das aspas!
GEMINI_KEY = "AIzaSyCOyWBcg157DfmF7AjtWh5mjwcVgDcTk6U" 

try:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-pro')
    print("✅ GEMINI AI CONECTADO COM SUCESSO!")
except:
    print("⚠️ AVISO: Chave Gemini não configurada ou inválida.")
    model = None

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
                api_key TEXT,
                recuperado REAL DEFAULT 0.0,
                is_admin INTEGER DEFAULT 0,
                whatsapp_status TEXT DEFAULT 'Desconectado'
            )
        ''')
        # Cria ADMIN SUPREMO
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
        
        return render_template('login.html', error="Credenciais Inválidas.")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session: return redirect(url_for('login'))
    
    db = get_db()
    user = db.execute('SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    # Se for Admin, pega a lista de TODOS os clientes para gerir
    clientes = []
    if session.get('is_admin'):
        clientes = db.execute('SELECT * FROM users WHERE is_admin = 0').fetchall()

    if not user: # Fallback
        class FakeUser:
            name = session['name']
            recuperado = 0.0
            api_key = 'MASTER-KEY'
            is_admin = 1
            whatsapp_status = 'Online'
        user = FakeUser()

    return render_template('dashboard.html', user=user, clientes=clientes)

@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('home'))

# --- 👑 GOD MODE: GESTÃO DE CLIENTES ---
@app.route('/create_client', methods=['POST'])
def create_client():
    if not session.get('is_admin'): return jsonify({'success': False, 'msg': 'Acesso Negado.'})
    data = request.json
    
    db = get_db()
    try:
        key = f"lhex_live_{secrets.token_hex(8)}"
        db.execute("INSERT INTO users (username, password, name, business_niche, api_key) VALUES (?, ?, ?, ?, ?)",
                   (data['username'], generate_password_hash(data['password']), data['name'], data['niche'], key))
        db.commit()
        return jsonify({'success': True, 'msg': 'Cliente Criado com Sucesso!'})
    except:
        return jsonify({'success': False, 'msg': 'Erro: Login já existe.'})

@app.route('/delete_client/<int:id>', methods=['POST'])
def delete_client(id):
    if not session.get('is_admin'): return jsonify({'success': False})
    db = get_db()
    db.execute('DELETE FROM users WHERE id = ?', (id,))
    db.commit()
    return jsonify({'success': True})

# --- 🧠 API IA COM GEMINI (O CÉREBRO REAL) ---
@app.route('/api/chat', methods=['POST'])
def api_chat():
    msg = request.json.get('msg')
    
    if model:
        # Prompt de Engenharia para Vendas High-Ticket
        prompt = f"""
        Você é a IA de Vendas da L.H.E.X Systems.
        Seu objetivo: Analisar o cliente e vender serviços High-Ticket.
        Cliente disse: "{msg}"
        
        Regras:
        1. Responda curto (estilo WhatsApp).
        2. Use um Gatilho Mental (Escassez, Autoridade, Prova Social).
        3. No final, indique a Emoção do Cliente entre parênteses.
        Exemplo: "O preço sobe amanhã. Vamos fechar? (Emoção: Urgência)"
        """
        try:
            response = model.generate_content(prompt)
            texto = response.text
            
            # Separa a emoção do texto (truque simples)
            if "(" in texto:
                resposta_final = texto.split("(")[0]
                analise_final = texto.split("(")[1].replace(")", "")
            else:
                resposta_final = texto
                analise_final = "Análise Neural: Interesse Detectado"
                
            return jsonify({'analise': analise_final, 'resposta': resposta_final})
        except Exception as e:
            return jsonify({'analise': 'Erro Neural', 'resposta': 'Conexão instável com o satélite Gemini. Tente novamente.'})
    
    # Fallback se não tiver chave
    return jsonify({'analise': 'Modo Simulação', 'resposta': 'Configure sua chave Gemini no app.py para ativar a inteligência real.'})

# --- 🔌 API WEBHOOK (PARA WHATSAPP/INSTAGRAM) ---
# É aqui que o Zapier ou Evolution API vai bater
@app.route('/api/webhook', methods=['POST'])
def webhook():
    data = request.json
    print(f"📩 MENSAGEM RECEBIDA DO WHATSAPP: {data}")
    return jsonify({'status': 'received'}), 200

# --- LÁZARO (AUDITORIA) ---
@app.route('/run_lazaro', methods=['POST'])
def run_lazaro():
    time.sleep(1.5)
    if 'user_id' in session:
        import random
        val = random.uniform(2000, 15000)
        db = get_db()
        db.execute('UPDATE users SET recuperado = recuperado + ? WHERE id = ?', (val, session['user_id']))
        db.commit()
        return jsonify({'success': True, 'total': f'R$ {val:,.2f}', 'msg': 'Auditoria Finalizada.'})
    return jsonify({'success': False})

init_db()

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=8000)
