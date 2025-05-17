from flask import Blueprint, jsonify, request
from app.models import Page, Element
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


@api_bp.route('/page/<slug>/elements', methods=['GET'])
def get_page_elements(slug):
    page = Page.query.filter_by(slug=slug).first()
    if not page:
        return jsonify({
            'status': 'error',
            'message': 'Page non trouvée'
        }), 404

    return jsonify({
        'status': 'success',
        'elements': [element.to_dict() for element in page.elements]
    })


@api_bp.route('/page/<slug>/elements', methods=['POST'])
def create_element(slug):
    page = Page.query.filter_by(slug=slug).first()
    if not page:
        return jsonify({
            'status': 'error',
            'message': 'Page non trouvée'
        }), 404

    data = request.get_json()

    # Get the highest position number
    max_position = db.session.query(db.func.max(
        Element.position)).filter_by(page_id=page.id).scalar() or 0

    new_element = Element(
        type=data.get('type'),
        content=data.get('content', {}),
        position=max_position + 1,
        page_id=page.id
    )

    try:
        db.session.add(new_element)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Élément créé avec succès',
            'element': new_element.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api_bp.route('/page/<slug>/elements/<int:element_id>', methods=['PUT'])
def update_element(slug, element_id):
    page = Page.query.filter_by(slug=slug).first()
    if not page:
        return jsonify({
            'status': 'error',
            'message': 'Page non trouvée'
        }), 404

    element = Element.query.filter_by(id=element_id, page_id=page.id).first()
    if not element:
        return jsonify({
            'status': 'error',
            'message': 'Élément non trouvé'
        }), 404

    data = request.get_json()

    if 'content' in data:
        element.content = data['content']
    if 'position' in data:
        element.position = data['position']
    if 'type' in data:
        element.type = data['type']

    try:
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Élément mis à jour avec succès',
            'element': element.to_dict()
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api_bp.route('/page/<slug>/elements/<int:element_id>', methods=['DELETE'])
def delete_element(slug, element_id):
    page = Page.query.filter_by(slug=slug).first()
    if not page:
        return jsonify({
            'status': 'error',
            'message': 'Page non trouvée'
        }), 404

    element = Element.query.filter_by(id=element_id, page_id=page.id).first()
    if not element:
        return jsonify({
            'status': 'error',
            'message': 'Élément non trouvé'
        }), 404

    try:
        db.session.delete(element)
        db.session.commit()
        return jsonify({
            'status': 'success',
            'message': 'Élément supprimé avec succès'
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


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
