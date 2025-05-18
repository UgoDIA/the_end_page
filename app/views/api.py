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


@api_bp.route('/feed', methods=['GET'])
def get_feed():
    try:
        # Get query parameters
        sort = request.args.get('sort', 'trending')
        tone = request.args.get('tone')
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 8))

        # Base query
        query = Page.query

        # Apply tone filter if specified
        if tone:
            query = query.filter(Page.tone == tone)

        # Apply sorting
        if sort == 'trending':
            # Sort by likes count (descending) and then by creation date
            query = query.order_by(Page.likes.desc(), Page.created_at.desc())
        elif sort == 'recent':
            # Sort by creation date (most recent first)
            query = query.order_by(Page.created_at.desc())

        # Paginate results
        pages = query.paginate(page=page, per_page=per_page, error_out=False)

        # Format the response
        pages_data = [{
            'id': page.id,
            'title': page.title,
            'slug': page.slug,
            'theme': page.theme,
            'tone': page.tone,
            'created_at': page.created_at.isoformat(),
            'likes': page.likes or 0,
            'elements': page.content.get('elements', []) if page.content else []
        } for page in pages.items]

        return jsonify({
            'status': 'success',
            'pages': pages_data,
            'has_next': pages.has_next,
            'total': pages.total
        })

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


@api_bp.route('/page/<slug>/like', methods=['POST'])
def toggle_like(slug):
    try:
        page = Page.query.filter_by(slug=slug).first()
        if not page:
            return jsonify({
                'status': 'error',
                'message': 'Page non trouvée'
            }), 404

        data = request.get_json()
        if not data:
            return jsonify({
                'status': 'error',
                'message': 'Données manquantes'
            }), 400

        action = data.get('action', 'toggle')
        # Debug log
        print(f"Processing like action: {action} for page: {slug}")

        try:
            # Initialize likes to 0 if it's None
            if page.likes is None:
                page.likes = 0

            if action == 'like':
                page.likes += 1
            elif action == 'unlike':
                page.likes = max(0, page.likes - 1)
            else:  # toggle
                page.likes = max(
                    0, page.likes + (1 if page.likes == 0 else -1))

            db.session.commit()
            print(f"Updated likes count: {page.likes}")  # Debug log

            return jsonify({
                'status': 'success',
                'message': 'Like mis à jour',
                'likes': page.likes
            })
        except Exception as e:
            db.session.rollback()
            print(f"Database error: {str(e)}")  # Debug log
            return jsonify({
                'status': 'error',
                'message': f'Erreur de base de données: {str(e)}'
            }), 500

    except Exception as e:
        print(f"Unexpected error: {str(e)}")  # Debug log
        return jsonify({
            'status': 'error',
            'message': f'Erreur inattendue: {str(e)}'
        }), 500


@api_bp.route('/stats', methods=['GET'])
def get_stats():
    try:
        # Get total number of pages
        total_pages = Page.query.count()

        # Get total number of likes
        total_likes = db.session.query(db.func.sum(Page.likes)).scalar() or 0

        return jsonify({
            'status': 'success',
            'stats': {
                'total_pages': total_pages,
                'total_likes': total_likes
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
