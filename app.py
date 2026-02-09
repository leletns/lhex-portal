import os
import requests
import urllib.parse
import random
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'LHEX_INFINITE_CONTENT'

# --- SUAS CHAVES ---
GEMINI_KEY = "AIzaSyA-ibm_kkNyIcH3tmYwnsgpHZVGdva4Z2c"                  # <--- SUA CHAVE
EVOLUTION_URL = "https://api.lhexsystems.com" 
EVOLUTION_KEY = "LHEX_MASTER_KEY"       
INSTANCE_NAME = "Lhex_Principal"

# --- CONTEXTO MÉDICO (O CÉREBRO DO RAFA) ---
CONTEXTO_MEDICO = """
Você é o Dr. Rafael, maior autoridade em Lipedema do Brasil.
VOCÊ NÃO VENDE LIPOASPIRAÇÃO, VOCÊ VENDE LIBERDADE E TRATAMENTO DE DOENÇA.
Técnicas Obrigatórias:
1. LIPEDEFINITION: Retirada de gordura doente preservando vasos linfáticos (essencial!).
2. ARGOPLASMA: Jato de plasma para colar a pele (retração máxima).
3. MORPHEUS: Radiofrequência fracionada para flacidez profunda.
4. SUBLIFT: Soltura de fibroses (celulites profundas).
Tom de voz: Empático, Técnico, Autoritário e Protetor.
"""

# Configura IA
try:
    genai.configure(api_key=GEMINI_KEY)
    model = genai.GenerativeModel('gemini-pro')
except: pass

users = {
    "admin": {"password": generate_password_hash("Lhex@2026"), "name": "CEO Lelet", "is_admin": True},
    "cliente": {"password": generate_password_hash("1234"), "name": "Dr. Rafael", "is_admin": False}
}

# --- FUNÇÃO GERADORA DE POSTS ---
def gerar_post_infinito(tema, tipo):
    try:
        if tipo == "cronograma":
            prompt = f"""
            {CONTEXTO_MEDICO}
            Crie um CRONOGRAMA SEMANAL (Segunda a Domingo) de conteúdo para Instagram sobre '{tema}'.
            Para cada dia, defina:
            - Tema do Post (Feed)
            - Ideia de Stories (Sequência)
            - Formato (Reels/Carrossel/Foto)
            Use formatação HTML simples (<b>Dia</b>: conteudo <br>).
            """
        else:
            # Sorteia um ângulo para nunca repetir o texto
            angulos = [
                "Focar na dor física (peso nas pernas)",
                "Focar na vergonha estética (esconder o corpo)",
                "Focar na técnica (diferença de Lipo vs Lipedefinition)",
                "Focar no pós-operatório e segurança",
                "Quebrar o mito de que 'Lipedema é gordura comum'",
                "Focar na tecnologia (Argoplasma/Morpheus)"
            ]
            angulo_escolhido = random.choice(angulos)
            
            prompt = f"""
            {CONTEXTO_MEDICO}
            Escreva uma legenda de Instagram sobre '{tema}'.
            ÂNGULO OBRIGATÓRIO DE HOJE: {angulo_escolhido}.
            Estrutura: Gancho forte -> Explicação Técnica Simplificada -> Chamada para Ação.
            """

        res = model.generate_content(prompt)
        conteudo = res.text.replace("**", "").replace("#", "") # Limpa formatação md
        
        # Imagem Médica High End
        prompt_img = f"medical aesthetic photography, {tema}, high definition, clean clinical background, cinematic lighting, 8k, no text"
        clean_prompt = urllib.parse.quote(prompt_img)
        img_url = f"https://image.pollinations.ai/prompt/{clean_prompt}?width=1024&height=1024&model=flux&nologo=true&seed={random.randint(0,99999)}"

        return {"success": True, "conteudo": conteudo, "imagem": img_url}

    except Exception as e:
        # BACKUP DE EMERGÊNCIA (Caso a IA falhe, entrega algo pronto mas variado)
        frases_backup = [
            f"Lipedema não é culpa sua. É uma doença inflamatória. Com o protocolo Lipedefinition, removemos a gordura doente preservando seus vasos linfáticos. Agende sua avaliação.",
            f"Você sente peso nas pernas no final do dia? Isso não é cansaço, pode ser Lipedema. Tratamos com Morpheus e Argoplasma para devolver sua qualidade de vida.",
            f"Lipoaspiração comum pode piorar o Lipedema. Você precisa de especialistas. Conheça a técnica de preservação linfática."
        ]
        return {"success": True, "conteudo": random.choice(frases_backup), "imagem": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?q=80&w=1000", "erro_real": str(e)}

# --- ROTAS ---
@app.route('/')
def index(): return render_template('index.html', logo_url=url_for('static', filename='logo.png', _external=True))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        u = request.form.get('username')
        p = request.form.get('password')
        if u in users and check_password_hash(users[u]['password'], p):
            session['user'] = u
            return redirect(url_for('dashboard'))
        return render_template('login.html', error="Acesso Negado")
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user' not in session: return redirect('/login')
    status = "SISTEMA ONLINE 🟢"
    return render_template('dashboard.html', user=users[session['user']], status=status)

@app.route('/api/gerar', methods=['POST'])
def api_gerar():
    d = request.json
    return jsonify(gerar_post_infinito(d.get('tema'), d.get('tipo')))

@app.route('/logout')
def logout(): session.clear(); return redirect('/')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000)
