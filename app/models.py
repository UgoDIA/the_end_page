from datetime import datetime
from app.database import db


class Element(db.Model):
    __tablename__ = 'elements'

    id = db.Column(db.Integer, primary_key=True)
    # heading, paragraph, image, etc.
    type = db.Column(db.String(50), nullable=False)
    # Store element content as JSON
    content = db.Column(db.JSON, nullable=False)
    position = db.Column(db.Integer, nullable=False)  # Position in the page
    page_id = db.Column(db.Integer, db.ForeignKey('pages.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'type': self.type,
            'content': self.content,
            'position': self.position,
            'page_id': self.page_id,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat()
        }


class Page(db.Model):
    __tablename__ = 'pages'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    slug = db.Column(db.String(255), unique=True, nullable=False)
    theme = db.Column(db.String(50), default='light')
    tone = db.Column(db.String(50), default='honest')

    # Relationship with elements
    elements = db.relationship(
        'Element', backref='page', lazy=True, order_by='Element.position')

    def __repr__(self):
        return f'<Page {self.title}>'

    def to_dict(self):
        # Get elements from both content and relationship
        elements = []
        if self.content and 'elements' in self.content:
            elements.extend(self.content['elements'])
        if self.elements:
            elements.extend([element.to_dict() for element in self.elements])

        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'slug': self.slug,
            'theme': self.theme,
            'tone': self.tone,
            'elements': elements
        }
