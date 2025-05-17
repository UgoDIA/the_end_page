from flask import Blueprint, jsonify, request
from app.models import Page
from app.database import db
import json

api_bp = Blueprint('api', __name__)


@api_bp.route('/elements', methods=['GET'])
def get_elements():
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


@api_bp.route('/save', methods=['POST'])
def save_page():
    data = request.get_json()

    # Create or update page
    page = Page.query.filter_by(slug=data.get('slug')).first()
    if not page:
        page = Page(
            title=data.get('title', 'Untitled'),
            content=data.get('content', {}),
            slug=data.get('slug'),
            theme=data.get('theme', 'light'),
            tone=data.get('tone', 'honest')
        )
        db.session.add(page)
    else:
        page.title = data.get('title', page.title)
        page.content = data.get('content', page.content)
        page.theme = data.get('theme', page.theme)
        page.tone = data.get('tone', page.tone)

    try:
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Page sauvegardée',
            'page': page.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api_bp.route('/page/<slug>', methods=['GET'])
def get_page(slug):
    page = Page.query.filter_by(slug=slug).first()
    if not page:
        return jsonify({
            'status': 'error',
            'message': 'Page non trouvée'
        }), 404

    return jsonify({
        'status': 'success',
        'page': page.to_dict()
    })
