import os
import requests
import urllib.parse
import random
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'LHEX_BILLIONAIRE_KEY_IMBATÍVEL'

# --- BANCO DE DADOS DE EMERGÊNCIA (O SEGREDO) ---
# Se a IA falhar, o sistema usa essas frases prontas de alto nível.
BACKUP_RESPONSES = {
    "Luxo & Autoridade": [
        "A excelência não é um ato, é um hábito. Com {tema}, elevamos o padrão do impossível. Descubra a exclusividade que você merece. ✨💎 #HighTicket #Exclusividade",
        "Não se trata apenas de {tema}, trata-se de como você se sente ao olhar no espelho. A sofisticação está nos detalhes. Agende sua consultoria exclusiva.",
        "O verdadeiro luxo é o tempo e a confiança. Nossa abordagem em {tema} garante resultados que superam expectativas. Seja único."
    ],
    "Venda Direta": [
        "⚠️ ÚLTIMAS VAGAS: O protocolo exclusivo de {tema} está com agenda quase lotada. Não deixe para depois o que vai transformar sua vida hoje. Clique no link da bio!",
        "Você merece o melhor. Invista em {tema} e veja o retorno imediato na sua autoestima e posicionamento. Condições especiais apenas para hoje. 🔥",
        "Transforme sua realidade com {tema}. A oportunidade de elevar seu nível é agora. Comente 'EU QUERO' para atendimento VIP."
    ],
    "Educativo": [
        "Você sabia? O segredo por trás de um {tema} de sucesso está na precisão técnica e na personalização. Não arrisque com amadores. Entenda como fazemos a diferença. 💡",
        "Mito vs. Verdade sobre {tema}: Muitos prometem, poucos entregam. Nossa metodologia é baseada em ciência e resultados comprovados. Saiba mais.",
        "3 Pilares fundamentais do {tema}: Segurança, Tecnologia e Resultado Natural. Nunca aceite menos que a excelência."
    ]
}

# --- SUAS CHAVES (PREENCHA AQUI) ---
GEMINI_KEY = "AIzaSyA-ibm_kkNyIcH3tmYwnsgpHZVGdva4Z2c"                  # <--- TENTE COLOCAR A CHAVE CERTA
EVOLUTION_URL = "https://api.lhexsystems.com" 
EVOLUTION_KEY = "LHEX_MASTER_KEY"       
INSTANCE_NAME = "Lhex_Principal"

# Tenta configurar a IA, mas não trava se der erro
IA_ONLINE = False
try:
    if "AIza" in GEMINI_KEY:
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel('gemini-pro')
        IA_ONLINE = True
except: 
    print("Aviso: IA Offline. Usando modo Backup.")

users = {
    "admin": {"password": generate_password_hash("Lhex@2026"), "name": "CEO Lelet", "is_admin": True},
    "cliente": {"password": generate_password_hash("1234"), "name": "Dr. Cliente VIP", "is_admin": False}
}

# --- FUNÇÃO BLINDADA (NUNCA DÁ ERRO) ---
def gerar_conteudo_lhex(tema, tom):
    # 1. Tenta usar a IA Real
    conteudo = ""
    usou_backup = False
    
    if IA_ONLINE:
        try:
            prompt = f"Aja como um Estrategista de Luxo. Crie uma legenda curta e impactante para Instagram sobre '{tema}'. Tom: {tom}. Sem emojis infantis."
            res = model.generate_content(prompt)
            conteudo = res.text
        except:
            usou_backup = True
    else:
        usou_backup = True
    
    # 2. Se a IA falhou (ou chave errada), usa o Backup
    if usou_backup or not conteudo:
        # Pega uma frase pronta e insere o tema do cliente
        frase_base = random.choice(BACKUP_RESPONSES.get(tom, BACKUP_RESPONSES["Luxo & Autoridade"]))
        conteudo = frase_base.replace("{tema}", tema)
    
    # 3. Gera a Imagem (Pollinations é grátis e difícil de falhar)
    try:
        prompt_img = f"luxury editorial photography about {tema}, cinematic lighting, 8k, vogue magazine style, dark mood, no text"
        clean_prompt = urllib.parse.quote(prompt_img)
        # Adiciona um numero aleatorio para a imagem sempre mudar
        seed = random.randint(0, 9999)
        img_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=1024&height=1024&model=flux&nologo=true&seed={seed}"
    except:
        # Se até a imagem falhar, usa uma imagem de luxo genérica
        img_url = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop"

    return {"success": True, "conteudo": conteudo, "imagem": img_url, "modo": "IA" if not usou_backup else "Backup"}

# --- ROTAS ---
@app.route('/')
def index(): 
    return render_template('index.html', logo_url=url_for('static', filename='logo.png', _external=True))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        u = request.form.get('username')
        p = request.form.get('password')
        if u in users and check_password_hash(users[u]['password'], p):
            session['user'] = u
            return redirect(url_for('dashboard'))
        return render_template('login.html', error="ACESSO NEGADO")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user' not in session: return redirect('/login')
    status = "OFFLINE 🔴"
    try:
        r = requests.get(f"{EVOLUTION_URL}/instance/connectionState/{INSTANCE_NAME}", 
                        headers={"apikey": EVOLUTION_KEY}, timeout=1)
        if r.json().get('instance',{}).get('state') == 'open': status = "ONLINE 🟢"
    except: pass
    return render_template('dashboard.html', user=users[session['user']], status=status)

@app.route('/api/gerar', methods=['POST'])
def api_gerar():
    d = request.json
    # Essa função NUNCA retorna erro. Ela sempre entrega algo.
    return jsonify(gerar_conteudo_lhex(d.get('tema', 'Serviço Premium'), d.get('tom', 'Luxo & Autoridade')))

@app.route('/api/connect_zap', methods=['POST'])
def api_connect():
    h = {"apikey": EVOLUTION_KEY}
    try:
        requests.post(f"{EVOLUTION_URL}/instance/create", json={"instanceName": INSTANCE_NAME, "qrcode": True}, headers=h)
        r = requests.get(f"{EVOLUTION_URL}/instance/connect/{INSTANCE_NAME}", headers=h)
        data = r.json()
        if 'base64' in data: return jsonify({'success': True, 'qr': data['base64']})
        if 'code' in data: return jsonify({'success': True, 'qr': data['code']})
        return jsonify({'success': False, 'msg': 'Tentando conectar...'})
    except:
        return jsonify({'success': False, 'msg': 'Erro de conexão'})

@app.route('/logout')
def logout(): session.clear(); return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
