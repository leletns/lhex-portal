import os
import requests
import urllib.parse
import random
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'LHEX_RAFA_PROTOCOL_FINAL'

# --- BANCO DE DADOS DE ELITE (SE A IA FALHAR, ISSO APARECE) ---
# O texto exato que você mandou, para garantir a demo perfeita.
BACKUP_RESPONSES = {
    "Narrativa Emocional": """Você odeia praia ou está se escondendo? 

Este é um caso real de uma paciente que, assim como todas as mulheres que convivem com lipedema, tentava se esconder com cangas, evitava o mar, evitava viver! O lipedema aprisiona.

Nódulos, celulites, dor ao toque, sensação de peso... se isso te limita, saiba que tratar é o primeiro passo para a libertação!

Nossa paciente passou pelo protocolo exclusivo Lipedefinition:
1. Cirurgia de alta definição preservando o sistema linfático.
2. Tecnologias Morpheus e Argoplasma para retração máxima de pele.
3. Sublift para soltar as fibroses profundas.

Não é estética, é devolver sua vida. Se você se identifica, comente "LIBERDADE".""",

    "Protocolo Técnico": """Lipedema não é gordura comum. É uma doença inflamatória. 🧬

Por isso, a lipoaspiração tradicional pode ser desastrosa. Aqui na clínica, utilizamos o conceito de LIPEDEFINITION.

O diferencial?
✅ Preservação total dos vasos linfáticos (evitando inchaço crônico).
✅ Uso de Argoplasma para "colar" a pele após a retirada da gordura.
✅ Morpheus para tratar a flacidez em camadas profundas.

Tratamos a doença com a seriedade que ela exige e entregamos o contorno que você sonha. Agende sua avaliação."""
}

# --- SUAS CHAVES ---
GEMINI_KEY = "AIzaSyA-ibm_kkNyIcH3tmYwnsgpHZVGdva4Z2c"                  # <--- SUA CHAVE
EVOLUTION_URL = "https://api.lhexsystems.com" 
EVOLUTION_KEY = "redis://lhex-redis:bURI73NTsNeUklKiTDCnN2DLcxsUos5QrmGKGYaGzH2YHWybM6uM01PrYtCHwLWB@dskoso8sgk8cg4k0s0gswc8s:6379/0"       
INSTANCE_NAME = "Lhex_Principal"

# Configuração da IA
IA_ONLINE = False
try:
    if "AIza" in GEMINI_KEY:
        genai.configure(api_key=GEMINI_KEY)
        model = genai.GenerativeModel('gemini-pro')
        IA_ONLINE = True
except: pass

users = {
    "admin": {"password": generate_password_hash("Lhex@2026"), "name": "CEO Lelet", "is_admin": True},
    "cliente": {"password": generate_password_hash("1234"), "name": "Dr. Rafael", "is_admin": False}
}

def gerar_conteudo_lhex(tema, tom):
    conteudo = ""
    usou_backup = False
    
    # CONTEXTO MÉDICO AVANÇADO (PROMPT)
    contexto_medico = """
    Você é um Especialista em Lipedema e Cirurgia Plástica de Alta Definição.
    CONHECIMENTO OBRIGATÓRIO:
    - Lipedefinition: Técnica que retira gordura preservando vasos linfáticos.
    - Tecnologias: Morpheus (radiofrequência fracionada) e Argoplasma (jato de plasma para retração).
    - Sublift: Tratamento para celulite profunda.
    - Foco: Não é só estética, é tratar a dor e a inflamação. É libertação.
    """

    if IA_ONLINE:
        try:
            prompt = f"""
            {contexto_medico}
            
            TAREFA: Escreva uma legenda para Instagram sobre: '{tema}'.
            ESTILO: {tom}.
            
            REGRAS DE OURO:
            1. Comece com uma pergunta que toque na ferida emocional ou física.
            2. Use parágrafos curtos.
            3. Cite as tecnologias (Morpheus/Argoplasma) se fizer sentido.
            4. Termine com um convite acolhedor, não agressivo.
            5. NADA DE EMOJIS DE DIAMANTE OU FOGUINHO. Use: 🧬, 🩺, 🚫, ✨ (poucos).
            """
            res = model.generate_content(prompt)
            conteudo = res.text
        except:
            usou_backup = True
    else:
        usou_backup = True
    
    # Se falhar, usa o texto perfeito que você escreveu
    if usou_backup or not conteudo:
        # Se o tema for parecido com lipedema, usa o texto do backup
        conteudo = BACKUP_RESPONSES.get(tom, BACKUP_RESPONSES["Narrativa Emocional"])
    
    # Imagem (Pollinations - Medical/Clean)
    try:
        prompt_img = f"medical aesthetic photography, {tema}, soft lighting, clean clinical background, high end photography, 8k, no text, cinematic"
        clean_prompt = urllib.parse.quote(prompt_img)
        img_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=1024&height=1024&model=flux&nologo=true&seed={random.randint(0,9999)}"
    except:
        img_url = "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1000&auto=format&fit=crop"

    return {"success": True, "conteudo": conteudo, "imagem": img_url}

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
        r = requests.get(f"{EVOLUTION_URL}/instance/connectionState/{INSTANCE_NAME}", headers={"apikey": EVOLUTION_KEY}, timeout=1)
        if r.json().get('instance',{}).get('state') == 'open': status = "SISTEMA ONLINE 🟢"
    except: pass
    return render_template('dashboard.html', user=users[session['user']], status=status)

@app.route('/api/gerar', methods=['POST'])
def api_gerar():
    d = request.json
    return jsonify(gerar_conteudo_lhex(d.get('tema'), d.get('tom')))

@app.route('/api/connect_zap', methods=['POST'])
def api_connect():
    h = {"apikey": EVOLUTION_KEY}
    try:
        requests.post(f"{EVOLUTION_URL}/instance/create", json={"instanceName": INSTANCE_NAME, "qrcode": True}, headers=h)
        r = requests.get(f"{EVOLUTION_URL}/instance/connect/{INSTANCE_NAME}", headers=h)
        data = r.json()
        if 'base64' in data: return jsonify({'success': True, 'qr': data['base64']})
        if 'code' in data: return jsonify({'success': True, 'qr': data['code']})
    except: pass
    return jsonify({'success': False})

@app.route('/logout')
def logout(): session.clear(); return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
