from flask import Flask, jsonify, request, send_from_directory
import os

app = Flask(__name__, static_folder='../Front')

# Configuration pour cPanel
app.config['APPLICATION_ROOT'] = '/home/username/public_html/your_app'

# Route pour servir les fichiers statics
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Routes API
@app.route('/api/elements', methods=['GET'])
def get_elements():
    # Retourne la liste des éléments disponibles
    elements = [
        {'type': 'heading', 'name': 'Titre'},
        {'type': 'paragraph', 'name': 'Paragraphe'},
        {'type': 'image', 'name': 'Image'},
        {'type': 'button', 'name': 'Bouton'},
        {'type': 'video', 'name': 'Vidéo'},
        {'type': 'audio', 'name': 'Audio'},
        {'type': 'gif', 'name': 'GIF'}
    ]
    return jsonify(elements)

@app.route('/api/save', methods=['POST'])
def save_page():
    # Sauvegarde la configuration de la page
    data = request.get_json()
    # Ici vous pourriez sauvegarder dans une base de données
    return jsonify({'status': 'success', 'message': 'Page sauvegardée'})

if __name__ == '__main__':
    app.run(debug=True)