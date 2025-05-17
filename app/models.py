from datetime import datetime
from app.database import db


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

    def __repr__(self):
        return f'<Page {self.title}>'

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'content': self.content,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'slug': self.slug,
            'theme': self.theme,
            'tone': self.tone
        }
