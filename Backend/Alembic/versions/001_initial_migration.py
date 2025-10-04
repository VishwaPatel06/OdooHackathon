# alembic/versions/001_initial_migration.py
"""Initial migration

Revision ID: 001
Revises: 
Create Date: 2024-10-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Enable UUID extension
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')
    
    # Create companies table
    op.create_table(
        'companies',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('country', sa.String(100), nullable=False),
        sa.Column('currency_code', sa.String(3), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now())
    )
    op.create_index('idx_companies_currency', 'companies', ['currency_code'])
    op.create_index('idx_companies_active', 'companies', ['is_active'])
    
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=False, unique=True),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('full_name', sa.String(255), nullable=False),
        sa.Column('role', sa.String(50), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.CheckConstraint("role IN ('admin', 'manager', 'employee')", name='check_user_role')
    )
    op.create_index('idx_users_company', 'users', ['company_id'])
    op.create_index('idx_users_email', 'users', ['email'])
    op.create_index('idx_users_role', 'users', ['role'])
    
    # Create manager_relationships table
    op.create_table(
        'manager_relationships',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('manager_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['manager_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('employee_id', 'manager_id'),
        sa.CheckConstraint('employee_id != manager_id', name='check_employee_not_manager')
    )
    op.create_index('idx_manager_rel_employee', 'manager_relationships', ['employee_id'])
    op.create_index('idx_manager_rel_manager', 'manager_relationships', ['manager_id'])
    
    # Create expense_categories table
    op.create_table(
        'expense_categories',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE')
    )
    
    # Create expenses table
    op.create_table(
        'expenses',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('employee_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('expense_number', sa.String(50), nullable=False, unique=True),
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('expense_date', sa.Date(), nullable=False),
        sa.Column('submitted_currency', sa.String(3), nullable=False),
        sa.Column('submitted_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('company_currency', sa.String(3), nullable=False),
        sa.Column('company_amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('exchange_rate', sa.Numeric(10, 6), nullable=False),
        sa.Column('status', sa.String(50), server_default='pending', nullable=False),
        sa.Column('receipt_url', sa.Text()),
        sa.Column('receipt_filename', sa.String(255)),
        sa.Column('submitted_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['employee_id'], ['users.id'], ondelete='CASCADE'),
        sa.CheckConstraint("status IN ('draft', 'pending', 'approved', 'rejected', 'cancelled')", name='check_expense_status')
    )
    op.create_index('idx_expenses_company', 'expenses', ['company_id'])
    op.create_index('idx_expenses_employee', 'expenses', ['employee_id'])
    op.create_index('idx_expenses_status', 'expenses', ['status'])
    op.create_index('idx_expenses_date', 'expenses', ['expense_date'])
    
    # Create expense_lines table
    op.create_table(
        'expense_lines',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('expense_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True)),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('amount', sa.Numeric(15, 2), nullable=False),
        sa.Column('merchant_name', sa.String(255)),
        sa.Column('line_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['category_id'], ['expense_categories.id'], ondelete='SET NULL')
    )
    op.create_index('idx_expense_lines_expense', 'expense_lines', ['expense_id'])
    
    # Create approval_rules table
    op.create_table(
        'approval_rules',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('rule_type', sa.String(50), nullable=False),
        sa.Column('approval_percentage', sa.Numeric(5, 2)),
        sa.Column('specific_approver_id', postgresql.UUID(as_uuid=True)),
        sa.Column('requires_manager_approval', sa.Boolean(), server_default='false'),
        sa.Column('min_amount', sa.Numeric(15, 2)),
        sa.Column('max_amount', sa.Numeric(15, 2)),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('priority', sa.Integer(), server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['specific_approver_id'], ['users.id'], ondelete='SET NULL'),
        sa.CheckConstraint("rule_type IN ('percentage', 'specific_approver', 'hybrid', 'sequential')", name='check_rule_type')
    )
    op.create_index('idx_approval_rules_company', 'approval_rules', ['company_id'])
    
    # Create approver_sequences table
    op.create_table(
        'approver_sequences',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('approval_rule_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('approver_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sequence_order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['approval_rule_id'], ['approval_rules.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approver_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('approval_rule_id', 'approver_id'),
        sa.UniqueConstraint('approval_rule_id', 'sequence_order')
    )
    
    # Create expense_approvals table
    op.create_table(
        'expense_approvals',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('expense_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('approver_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('sequence_order', sa.Integer(), nullable=False),
        sa.Column('status', sa.String(50), server_default='pending', nullable=False),
        sa.Column('comments', sa.Text()),
        sa.Column('approved_at', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['approver_id'], ['users.id'], ondelete='CASCADE'),
        sa.UniqueConstraint('expense_id', 'approver_id'),
        sa.CheckConstraint("status IN ('pending', 'approved', 'rejected', 'skipped')", name='check_approval_status')
    )
    op.create_index('idx_exp_approvals_expense', 'expense_approvals', ['expense_id'])
    op.create_index('idx_exp_approvals_approver', 'expense_approvals', ['approver_id'])
    
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), server_default=sa.text('uuid_generate_v4()'), primary_key=True),
        sa.Column('company_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True)),
        sa.Column('expense_id', postgresql.UUID(as_uuid=True)),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('entity_type', sa.String(50), nullable=False),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True)),
        sa.Column('old_value', postgresql.JSONB()),
        sa.Column('new_value', postgresql.JSONB()),
        sa.Column('ip_address', postgresql.INET()),
        sa.Column('user_agent', sa.Text()),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['expense_id'], ['expenses.id'], ondelete='SET NULL')
    )
    op.create_index('idx_audit_company', 'audit_logs', ['company_id'])
    op.create_index('idx_audit_created', 'audit_logs', ['created_at'])


def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('expense_approvals')
    op.drop_table('approver_sequences')
    op.drop_table('approval_rules')
    op.drop_table('expense_lines')
    op.drop_table('expenses')
    op.drop_table('expense_categories')
    op.drop_table('manager_relationships')
    op.drop_table('users')
    op.drop_table('companies')