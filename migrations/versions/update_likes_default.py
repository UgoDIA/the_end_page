"""Set default likes to 0

Revision ID: update_likes_default
Revises: 070cd2e026ae
Create Date: 2024-03-19 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'update_likes_default'
down_revision = '070cd2e026ae'
branch_labels = None
depends_on = None


def upgrade():
    # Update existing records to set likes to 0 where it's NULL
    op.execute("UPDATE pages SET likes = 0 WHERE likes IS NULL")


def downgrade():
    # No downgrade needed as we're just setting a default value
    pass
