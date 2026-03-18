from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import aiosqlite
import os
import logging
import json
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from io import BytesIO
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.enums import TA_LEFT, TA_RIGHT, TA_CENTER

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# SQLite Database Path
DB_PATH = ROOT_DIR / 'preventivi.db'

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'preventivi-pittura-secret-key-2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24
JWT_REMEMBER_ME_DAYS = 30
INACTIVITY_TIMEOUT_MINUTES = 30

app = FastAPI(title="Preventivi Pittura Edile")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== DATABASE HELPERS =====================

async def get_db():
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    return db

async def init_db():
    db = await get_db()
    try:
        # Users table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'operator',
                name TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        # Sessions table for multi-session support
        await db.execute('''
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                token TEXT NOT NULL,
                device_info TEXT DEFAULT '',
                ip_address TEXT DEFAULT '',
                created_at TEXT,
                last_activity TEXT,
                expires_at TEXT,
                is_remember_me INTEGER DEFAULT 0,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # Categories table with sub-categories support
        await db.execute('''
            CREATE TABLE IF NOT EXISTS categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                color TEXT DEFAULT '#005f73',
                default_vat_percent REAL DEFAULT 22.0,
                description TEXT DEFAULT '',
                position INTEGER DEFAULT 0,
                created_at TEXT,
                FOREIGN KEY (parent_id) REFERENCES categories(id)
            )
        ''')
        
        # Saved options table (for free-text combobox persistence)
        await db.execute('''
            CREATE TABLE IF NOT EXISTS saved_options (
                id TEXT PRIMARY KEY,
                option_type TEXT NOT NULL,
                option_value TEXT NOT NULL,
                created_at TEXT,
                UNIQUE(option_type, option_value)
            )
        ''')
        
        # Clients table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS clients (
                id TEXT PRIMARY KEY,
                name TEXT DEFAULT '',
                company_name TEXT DEFAULT '',
                vat_number TEXT DEFAULT '',
                fiscal_code TEXT DEFAULT '',
                address TEXT DEFAULT '',
                city TEXT DEFAULT '',
                cap TEXT DEFAULT '',
                province TEXT DEFAULT '',
                country TEXT DEFAULT 'Italia',
                phone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                bank_name TEXT DEFAULT '',
                iban TEXT DEFAULT '',
                sdi_code TEXT DEFAULT '',
                pec_email TEXT DEFAULT '',
                payment_terms TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        # Quotes table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS quotes (
                id TEXT PRIMARY KEY,
                quote_number TEXT,
                client_id TEXT,
                project_description TEXT DEFAULT '',
                site_address TEXT DEFAULT '',
                validity_days INTEGER DEFAULT 30,
                status TEXT DEFAULT 'draft',
                notes TEXT DEFAULT '',
                special_conditions TEXT DEFAULT '',
                date TEXT,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (client_id) REFERENCES clients(id)
            )
        ''')
        
        # Quote items table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS quote_items (
                id TEXT PRIMARY KEY,
                quote_id TEXT NOT NULL,
                category_id TEXT,
                category_name TEXT DEFAULT '',
                description TEXT DEFAULT '',
                unit TEXT DEFAULT 'mq',
                quantity REAL DEFAULT 1.0,
                unit_price REAL DEFAULT 0.0,
                discount_percent REAL DEFAULT 0.0,
                vat_percent REAL DEFAULT 22.0,
                position INTEGER DEFAULT 0,
                FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        ''')
        
        # Quote drafts table (for auto-save)
        await db.execute('''
            CREATE TABLE IF NOT EXISTS quote_drafts (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                quote_id TEXT,
                draft_data TEXT NOT NULL,
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        ''')
        
        # Materials table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS materials (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                category_id TEXT,
                category_name TEXT DEFAULT '',
                unit TEXT DEFAULT 'pz',
                stock_quantity REAL DEFAULT 0.0,
                unit_cost REAL DEFAULT 0.0,
                supplier TEXT DEFAULT '',
                min_stock_alert REAL DEFAULT 10.0,
                notes TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT,
                FOREIGN KEY (category_id) REFERENCES categories(id)
            )
        ''')
        
        # Expenses table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS expenses (
                id TEXT PRIMARY KEY,
                date TEXT,
                category_id TEXT,
                category_name TEXT DEFAULT '',
                supplier TEXT DEFAULT '',
                description TEXT DEFAULT '',
                amount REAL DEFAULT 0.0,
                vat_amount REAL DEFAULT 0.0,
                payment_method TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                quote_id TEXT,
                created_at TEXT,
                FOREIGN KEY (category_id) REFERENCES categories(id),
                FOREIGN KEY (quote_id) REFERENCES quotes(id)
            )
        ''')
        
        # Employees table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                role TEXT DEFAULT '',
                hourly_rate REAL DEFAULT 0.0,
                daily_rate REAL DEFAULT 0.0,
                tax_info TEXT DEFAULT '',
                phone TEXT DEFAULT '',
                email TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT
            )
        ''')
        
        # Work logs table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS worklogs (
                id TEXT PRIMARY KEY,
                employee_id TEXT NOT NULL,
                quote_id TEXT,
                date TEXT,
                hours REAL DEFAULT 0.0,
                days REAL DEFAULT 0.0,
                description TEXT DEFAULT '',
                created_at TEXT,
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (quote_id) REFERENCES quotes(id)
            )
        ''')
        
        # Payments table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                employee_id TEXT NOT NULL,
                amount REAL DEFAULT 0.0,
                date TEXT,
                payment_method TEXT DEFAULT '',
                notes TEXT DEFAULT '',
                status TEXT DEFAULT 'pending',
                created_at TEXT,
                FOREIGN KEY (employee_id) REFERENCES employees(id)
            )
        ''')
        
        # Settings table
        await db.execute('''
            CREATE TABLE IF NOT EXISTS settings (
                id TEXT PRIMARY KEY DEFAULT 'company_settings',
                company_name TEXT DEFAULT '',
                company_address TEXT DEFAULT '',
                company_city TEXT DEFAULT '',
                company_cap TEXT DEFAULT '',
                company_province TEXT DEFAULT '',
                company_vat TEXT DEFAULT '',
                company_fiscal_code TEXT DEFAULT '',
                company_phone TEXT DEFAULT '',
                company_email TEXT DEFAULT '',
                company_pec TEXT DEFAULT '',
                company_iban TEXT DEFAULT '',
                company_bank TEXT DEFAULT '',
                quote_prefix TEXT DEFAULT 'PRV',
                invoice_prefix TEXT DEFAULT 'FT',
                current_year INTEGER DEFAULT 2025,
                quote_counter INTEGER DEFAULT 0,
                invoice_counter INTEGER DEFAULT 0,
                default_vat_rates TEXT DEFAULT '[22.0, 10.0, 4.0, 0.0]',
                default_payment_terms TEXT DEFAULT '',
                default_notes TEXT DEFAULT '',
                units TEXT DEFAULT '["mq", "ml", "pz", "kg", "lt", "ore", "gg", "corpo"]',
                inactivity_timeout_minutes INTEGER DEFAULT 30
            )
        ''')
        
        await db.commit()
    finally:
        await db.close()

# ===================== MODELS =====================

class LoginRequest(BaseModel):
    username: str
    password: str
    remember_me: bool = False

class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str

class CategoryBase(BaseModel):
    name: str
    parent_id: Optional[str] = None
    color: str = "#005f73"
    default_vat_percent: float = 22.0
    description: str = ""
    position: int = 0

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str
    created_at: str

class CategoryReassign(BaseModel):
    target_category_id: str

class SavedOptionCreate(BaseModel):
    option_type: str
    option_value: str

class ClientBase(BaseModel):
    name: str = ""
    company_name: str = ""
    vat_number: str = ""
    fiscal_code: str = ""
    address: str = ""
    city: str = ""
    cap: str = ""
    province: str = ""
    country: str = "Italia"
    phone: str = ""
    email: str = ""
    notes: str = ""
    bank_name: str = ""
    iban: str = ""
    sdi_code: str = ""
    pec_email: str = ""
    payment_terms: str = ""

class QuoteItemInput(BaseModel):
    id: str = ""
    category_id: Optional[str] = None
    category_name: str = ""
    description: str = ""
    unit: str = "mq"
    quantity: float = 1.0
    unit_price: float = 0.0
    discount_percent: float = 0.0
    vat_percent: float = 22.0
    position: int = 0

class QuoteBase(BaseModel):
    client_id: str
    project_description: str = ""
    site_address: str = ""
    validity_days: int = 30
    status: str = "draft"
    notes: str = ""
    special_conditions: str = ""
    items: List[QuoteItemInput] = []

class QuoteDraftSave(BaseModel):
    quote_id: Optional[str] = None
    draft_data: dict

class MaterialBase(BaseModel):
    name: str
    category_id: Optional[str] = None
    category_name: str = ""
    unit: str = "pz"
    stock_quantity: float = 0.0
    unit_cost: float = 0.0
    supplier: str = ""
    min_stock_alert: float = 10.0
    notes: str = ""

class ExpenseBase(BaseModel):
    date: str
    category_id: Optional[str] = None
    category_name: str = ""
    supplier: str = ""
    description: str = ""
    amount: float = 0.0
    vat_amount: float = 0.0
    payment_method: str = ""
    notes: str = ""
    quote_id: str = ""

class EmployeeBase(BaseModel):
    name: str
    role: str = ""
    hourly_rate: float = 0.0
    daily_rate: float = 0.0
    tax_info: str = ""
    phone: str = ""
    email: str = ""
    notes: str = ""

class WorkLogBase(BaseModel):
    employee_id: str
    quote_id: str = ""
    date: str
    hours: float = 0.0
    days: float = 0.0
    description: str = ""

class PaymentBase(BaseModel):
    employee_id: str
    amount: float = 0.0
    date: str
    payment_method: str = ""
    notes: str = ""
    status: str = "pending"

class SettingsModel(BaseModel):
    company_name: str = ""
    company_address: str = ""
    company_city: str = ""
    company_cap: str = ""
    company_province: str = ""
    company_vat: str = ""
    company_fiscal_code: str = ""
    company_phone: str = ""
    company_email: str = ""
    company_pec: str = ""
    company_iban: str = ""
    company_bank: str = ""
    quote_prefix: str = "PRV"
    invoice_prefix: str = "FT"
    current_year: int = 2025
    quote_counter: int = 0
    invoice_counter: int = 0
    default_vat_rates: List[float] = [22.0, 10.0, 4.0, 0.0]
    default_payment_terms: str = ""
    default_notes: str = ""
    units: List[str] = ["mq", "ml", "pz", "kg", "lt", "ore", "gg", "corpo"]
    inactivity_timeout_minutes: int = 30

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "operator"
    name: str = ""

class GlobalSearchQuery(BaseModel):
    query: str
    limit: int = 20

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, username: str, role: str, session_id: str, remember_me: bool = False) -> str:
    exp_time = timedelta(days=JWT_REMEMBER_ME_DAYS) if remember_me else timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'session_id': session_id,
        'exp': datetime.now(timezone.utc) + exp_time
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Update session activity
        db = await get_db()
        try:
            await db.execute(
                "UPDATE sessions SET last_activity = ? WHERE id = ?",
                (datetime.now(timezone.utc).isoformat(), payload.get('session_id'))
            )
            await db.commit()
        finally:
            await db.close()
        
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token scaduto")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")

async def require_admin(user = Depends(get_current_user)):
    if user.get('role') != 'admin':
        raise HTTPException(status_code=403, detail="Accesso riservato agli amministratori")
    return user

# ===================== AUTH ENDPOINTS =====================

@api_router.post("/auth/login")
async def login(request: Request, login_data: LoginRequest):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM users WHERE username = ?", (login_data.username,))
        user = await cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=401, detail="Credenziali non valide")
        if not verify_password(login_data.password, user['password_hash']):
            raise HTTPException(status_code=401, detail="Credenziali non valide")
        
        # Create session
        session_id = str(uuid.uuid4())
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "unknown")
        now = datetime.now(timezone.utc).isoformat()
        
        exp_time = timedelta(days=JWT_REMEMBER_ME_DAYS) if login_data.remember_me else timedelta(hours=JWT_EXPIRATION_HOURS)
        expires_at = (datetime.now(timezone.utc) + exp_time).isoformat()
        
        token = create_token(user['id'], user['username'], user['role'], session_id, login_data.remember_me)
        
        await db.execute('''
            INSERT INTO sessions (id, user_id, token, device_info, ip_address, created_at, last_activity, expires_at, is_remember_me)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (session_id, user['id'], token, user_agent[:200], client_ip, now, now, expires_at, 1 if login_data.remember_me else 0))
        await db.commit()
        
        # Get settings for inactivity timeout
        cursor = await db.execute("SELECT inactivity_timeout_minutes FROM settings WHERE id = 'company_settings'")
        settings = await cursor.fetchone()
        timeout = settings['inactivity_timeout_minutes'] if settings else INACTIVITY_TIMEOUT_MINUTES
        
        return {
            "token": token,
            "session_id": session_id,
            "user": {
                "id": user['id'],
                "username": user['username'],
                "role": user['role'],
                "name": user['name']
            },
            "inactivity_timeout_minutes": timeout
        }
    finally:
        await db.close()

@api_router.post("/auth/logout")
async def logout(user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM sessions WHERE id = ?", (user.get('session_id'),))
        await db.commit()
        return {"message": "Logout effettuato"}
    finally:
        await db.close()

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, username, role, name, created_at FROM users WHERE id = ?", (user['user_id'],))
        db_user = await cursor.fetchone()
        if not db_user:
            raise HTTPException(status_code=404, detail="Utente non trovato")
        return dict(db_user)
    finally:
        await db.close()

@api_router.get("/auth/sessions")
async def get_user_sessions(user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT id, device_info, ip_address, created_at, last_activity, is_remember_me FROM sessions WHERE user_id = ? ORDER BY last_activity DESC",
            (user['user_id'],)
        )
        sessions = await cursor.fetchall()
        return [dict(s) for s in sessions]
    finally:
        await db.close()

@api_router.delete("/auth/sessions/{session_id}")
async def revoke_session(session_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        # Check session belongs to user
        cursor = await db.execute("SELECT user_id FROM sessions WHERE id = ?", (session_id,))
        session = await cursor.fetchone()
        if not session or session['user_id'] != user['user_id']:
            raise HTTPException(status_code=404, detail="Sessione non trovata")
        
        await db.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        await db.commit()
        return {"message": "Sessione revocata"}
    finally:
        await db.close()

@api_router.post("/auth/change-password")
async def change_password(data: PasswordChangeRequest, user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT password_hash FROM users WHERE id = ?", (user['user_id'],))
        db_user = await cursor.fetchone()
        
        if not verify_password(data.current_password, db_user['password_hash']):
            raise HTTPException(status_code=400, detail="Password attuale non corretta")
        
        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="La nuova password deve essere almeno 6 caratteri")
        
        new_hash = hash_password(data.new_password)
        await db.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, user['user_id']))
        
        # Invalidate all other sessions
        await db.execute("DELETE FROM sessions WHERE user_id = ? AND id != ?", (user['user_id'], user['session_id']))
        await db.commit()
        
        return {"message": "Password aggiornata"}
    finally:
        await db.close()

@api_router.post("/auth/heartbeat")
async def heartbeat(user = Depends(get_current_user)):
    """Update session activity timestamp"""
    return {"status": "ok", "timestamp": datetime.now(timezone.utc).isoformat()}

# ===================== USERS ENDPOINTS =====================

@api_router.get("/users")
async def get_users(user = Depends(require_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id, username, role, name, created_at FROM users")
        users = await cursor.fetchall()
        return [dict(u) for u in users]
    finally:
        await db.close()

@api_router.post("/users")
async def create_user(user_data: UserCreate, admin = Depends(require_admin)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT id FROM users WHERE username = ?", (user_data.username,))
        existing = await cursor.fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Username già esistente")
        
        user_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO users (id, username, password_hash, role, name, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, user_data.username, hash_password(user_data.password), user_data.role, user_data.name, now))
        await db.commit()
        
        return {"id": user_id, "username": user_data.username, "role": user_data.role, "name": user_data.name}
    finally:
        await db.close()

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin = Depends(require_admin)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        result = await db.execute("DELETE FROM users WHERE id = ?", (user_id,))
        await db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Utente non trovato")
        return {"message": "Utente eliminato"}
    finally:
        await db.close()

# ===================== CATEGORIES ENDPOINTS =====================

@api_router.get("/categories")
async def get_categories(user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM categories ORDER BY position, name")
        categories = await cursor.fetchall()
        return [dict(c) for c in categories]
    finally:
        await db.close()

@api_router.post("/categories")
async def create_category(data: CategoryCreate, user = Depends(get_current_user)):
    db = await get_db()
    try:
        cat_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO categories (id, name, parent_id, color, default_vat_percent, description, position, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (cat_id, data.name, data.parent_id, data.color, data.default_vat_percent, data.description, data.position, now))
        await db.commit()
        
        return {"id": cat_id, **data.model_dump(), "created_at": now}
    finally:
        await db.close()

@api_router.put("/categories/{category_id}")
async def update_category(category_id: str, data: CategoryCreate, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute('''
            UPDATE categories SET name = ?, parent_id = ?, color = ?, default_vat_percent = ?, description = ?, position = ?
            WHERE id = ?
        ''', (data.name, data.parent_id, data.color, data.default_vat_percent, data.description, data.position, category_id))
        await db.commit()
        return {"id": category_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.put("/categories/reorder")
async def reorder_categories(positions: Dict[str, int], user = Depends(get_current_user)):
    db = await get_db()
    try:
        for cat_id, position in positions.items():
            await db.execute("UPDATE categories SET position = ? WHERE id = ?", (position, cat_id))
        await db.commit()
        return {"message": "Ordine aggiornato"}
    finally:
        await db.close()

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str, reassign_to: str = None, user = Depends(get_current_user)):
    db = await get_db()
    try:
        # Check if category has items
        cursor = await db.execute("SELECT COUNT(*) as count FROM quote_items WHERE category_id = ?", (category_id,))
        result = await cursor.fetchone()
        
        if result['count'] > 0 and not reassign_to:
            raise HTTPException(status_code=400, detail="Categoria in uso. Specificare categoria di destinazione per riassegnare le voci.")
        
        if reassign_to:
            # Reassign items
            cursor = await db.execute("SELECT name FROM categories WHERE id = ?", (reassign_to,))
            target = await cursor.fetchone()
            if target:
                await db.execute("UPDATE quote_items SET category_id = ?, category_name = ? WHERE category_id = ?", 
                               (reassign_to, target['name'], category_id))
                await db.execute("UPDATE materials SET category_id = ?, category_name = ? WHERE category_id = ?",
                               (reassign_to, target['name'], category_id))
                await db.execute("UPDATE expenses SET category_id = ?, category_name = ? WHERE category_id = ?",
                               (reassign_to, target['name'], category_id))
        
        # Delete sub-categories
        await db.execute("DELETE FROM categories WHERE parent_id = ?", (category_id,))
        # Delete category
        await db.execute("DELETE FROM categories WHERE id = ?", (category_id,))
        await db.commit()
        
        return {"message": "Categoria eliminata"}
    finally:
        await db.close()

# ===================== SAVED OPTIONS ENDPOINTS (for free-text combobox) =====================

@api_router.get("/options/{option_type}")
async def get_saved_options(option_type: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT option_value FROM saved_options WHERE option_type = ? ORDER BY option_value",
            (option_type,)
        )
        options = await cursor.fetchall()
        return [o['option_value'] for o in options]
    finally:
        await db.close()

@api_router.post("/options")
async def save_option(data: SavedOptionCreate, user = Depends(get_current_user)):
    db = await get_db()
    try:
        opt_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT OR IGNORE INTO saved_options (id, option_type, option_value, created_at)
            VALUES (?, ?, ?, ?)
        ''', (opt_id, data.option_type, data.option_value, now))
        await db.commit()
        
        return {"message": "Opzione salvata"}
    finally:
        await db.close()

# ===================== CLIENTS ENDPOINTS =====================

@api_router.get("/clients")
async def get_clients(search: str = "", user = Depends(get_current_user)):
    db = await get_db()
    try:
        if search:
            cursor = await db.execute('''
                SELECT * FROM clients 
                WHERE name LIKE ? OR company_name LIKE ? OR email LIKE ?
                ORDER BY company_name, name
            ''', (f'%{search}%', f'%{search}%', f'%{search}%'))
        else:
            cursor = await db.execute("SELECT * FROM clients ORDER BY company_name, name")
        clients = await cursor.fetchall()
        return [dict(c) for c in clients]
    finally:
        await db.close()

@api_router.get("/clients/{client_id}")
async def get_client(client_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM clients WHERE id = ?", (client_id,))
        client = await cursor.fetchone()
        if not client:
            raise HTTPException(status_code=404, detail="Cliente non trovato")
        return dict(client)
    finally:
        await db.close()

@api_router.post("/clients")
async def create_client(data: ClientBase, user = Depends(get_current_user)):
    if not data.name and not data.company_name:
        raise HTTPException(status_code=400, detail="Inserire almeno nome o ragione sociale")
    
    db = await get_db()
    try:
        client_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO clients (id, name, company_name, vat_number, fiscal_code, address, city, cap, province, country,
                               phone, email, notes, bank_name, iban, sdi_code, pec_email, payment_terms, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (client_id, data.name, data.company_name, data.vat_number, data.fiscal_code, data.address, data.city,
              data.cap, data.province, data.country, data.phone, data.email, data.notes, data.bank_name, data.iban,
              data.sdi_code, data.pec_email, data.payment_terms, now, now))
        await db.commit()
        
        return {"id": client_id, **data.model_dump(), "created_at": now, "updated_at": now}
    finally:
        await db.close()

@api_router.put("/clients/{client_id}")
async def update_client(client_id: str, data: ClientBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        await db.execute('''
            UPDATE clients SET name = ?, company_name = ?, vat_number = ?, fiscal_code = ?, address = ?, city = ?,
                cap = ?, province = ?, country = ?, phone = ?, email = ?, notes = ?, bank_name = ?, iban = ?,
                sdi_code = ?, pec_email = ?, payment_terms = ?, updated_at = ?
            WHERE id = ?
        ''', (data.name, data.company_name, data.vat_number, data.fiscal_code, data.address, data.city,
              data.cap, data.province, data.country, data.phone, data.email, data.notes, data.bank_name, data.iban,
              data.sdi_code, data.pec_email, data.payment_terms, now, client_id))
        await db.commit()
        return await get_client(client_id, user)
    finally:
        await db.close()

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM clients WHERE id = ?", (client_id,))
        await db.commit()
        return {"message": "Cliente eliminato"}
    finally:
        await db.close()

# ===================== QUOTES ENDPOINTS =====================

async def generate_quote_number(db):
    cursor = await db.execute("SELECT quote_prefix, current_year, quote_counter FROM settings WHERE id = 'company_settings'")
    settings = await cursor.fetchone()
    
    if not settings:
        return "PRV-2025-001"
    
    current_year = datetime.now().year
    counter = settings['quote_counter']
    
    if settings['current_year'] != current_year:
        counter = 0
        await db.execute("UPDATE settings SET current_year = ?, quote_counter = 0 WHERE id = 'company_settings'", (current_year,))
    
    counter += 1
    quote_number = f"{settings['quote_prefix']}-{current_year}-{counter:03d}"
    
    await db.execute("UPDATE settings SET quote_counter = ? WHERE id = 'company_settings'", (counter,))
    
    return quote_number

@api_router.get("/quotes")
async def get_quotes(client_id: str = "", status: str = "", category_id: str = "", date_from: str = "", date_to: str = "", user = Depends(get_current_user)):
    db = await get_db()
    try:
        query = "SELECT * FROM quotes WHERE 1=1"
        params = []
        
        if client_id:
            query += " AND client_id = ?"
            params.append(client_id)
        if status:
            query += " AND status = ?"
            params.append(status)
        if date_from:
            query += " AND date >= ?"
            params.append(date_from)
        if date_to:
            query += " AND date <= ?"
            params.append(date_to)
        
        query += " ORDER BY date DESC"
        
        cursor = await db.execute(query, params)
        quotes = await cursor.fetchall()
        
        result = []
        for q in quotes:
            quote_dict = dict(q)
            # Get items
            items_cursor = await db.execute("SELECT * FROM quote_items WHERE quote_id = ? ORDER BY position", (q['id'],))
            items = await items_cursor.fetchall()
            quote_dict['items'] = [dict(i) for i in items]
            
            # Filter by category if specified
            if category_id:
                has_category = any(i['category_id'] == category_id for i in items)
                if not has_category:
                    continue
            
            result.append(quote_dict)
        
        return result
    finally:
        await db.close()

@api_router.get("/quotes/{quote_id}")
async def get_quote(quote_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM quotes WHERE id = ?", (quote_id,))
        quote = await cursor.fetchone()
        if not quote:
            raise HTTPException(status_code=404, detail="Preventivo non trovato")
        
        quote_dict = dict(quote)
        items_cursor = await db.execute("SELECT * FROM quote_items WHERE quote_id = ? ORDER BY position", (quote_id,))
        items = await items_cursor.fetchall()
        quote_dict['items'] = [dict(i) for i in items]
        
        return quote_dict
    finally:
        await db.close()

@api_router.post("/quotes")
async def create_quote(data: QuoteBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        quote_id = str(uuid.uuid4())
        quote_number = await generate_quote_number(db)
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO quotes (id, quote_number, client_id, project_description, site_address, validity_days, 
                              status, notes, special_conditions, date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (quote_id, quote_number, data.client_id, data.project_description, data.site_address, data.validity_days,
              data.status, data.notes, data.special_conditions, now, now, now))
        
        # Insert items
        for i, item in enumerate(data.items):
            item_id = str(uuid.uuid4())
            await db.execute('''
                INSERT INTO quote_items (id, quote_id, category_id, category_name, description, unit, quantity, 
                                       unit_price, discount_percent, vat_percent, position)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (item_id, quote_id, item.category_id, item.category_name, item.description, item.unit, item.quantity,
                  item.unit_price, item.discount_percent, item.vat_percent, i))
        
        await db.commit()
        return await get_quote(quote_id, user)
    finally:
        await db.close()

@api_router.put("/quotes/{quote_id}")
async def update_quote(quote_id: str, data: QuoteBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            UPDATE quotes SET client_id = ?, project_description = ?, site_address = ?, validity_days = ?,
                status = ?, notes = ?, special_conditions = ?, updated_at = ?
            WHERE id = ?
        ''', (data.client_id, data.project_description, data.site_address, data.validity_days,
              data.status, data.notes, data.special_conditions, now, quote_id))
        
        # Delete existing items and re-insert
        await db.execute("DELETE FROM quote_items WHERE quote_id = ?", (quote_id,))
        
        for i, item in enumerate(data.items):
            item_id = item.id if item.id and not item.id.startswith('temp-') else str(uuid.uuid4())
            await db.execute('''
                INSERT INTO quote_items (id, quote_id, category_id, category_name, description, unit, quantity,
                                       unit_price, discount_percent, vat_percent, position)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (item_id, quote_id, item.category_id, item.category_name, item.description, item.unit, item.quantity,
                  item.unit_price, item.discount_percent, item.vat_percent, i))
        
        await db.commit()
        return await get_quote(quote_id, user)
    finally:
        await db.close()

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM quote_items WHERE quote_id = ?", (quote_id,))
        await db.execute("DELETE FROM quotes WHERE id = ?", (quote_id,))
        await db.commit()
        return {"message": "Preventivo eliminato"}
    finally:
        await db.close()

@api_router.post("/quotes/{quote_id}/duplicate")
async def duplicate_quote(quote_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM quotes WHERE id = ?", (quote_id,))
        original = await cursor.fetchone()
        if not original:
            raise HTTPException(status_code=404, detail="Preventivo non trovato")
        
        new_id = str(uuid.uuid4())
        new_number = await generate_quote_number(db)
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO quotes (id, quote_number, client_id, project_description, site_address, validity_days,
                              status, notes, special_conditions, date, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?)
        ''', (new_id, new_number, original['client_id'], original['project_description'], original['site_address'],
              original['validity_days'], original['notes'], original['special_conditions'], now, now, now))
        
        # Copy items
        items_cursor = await db.execute("SELECT * FROM quote_items WHERE quote_id = ?", (quote_id,))
        items = await items_cursor.fetchall()
        
        for item in items:
            new_item_id = str(uuid.uuid4())
            await db.execute('''
                INSERT INTO quote_items (id, quote_id, category_id, category_name, description, unit, quantity,
                                       unit_price, discount_percent, vat_percent, position)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (new_item_id, new_id, item['category_id'], item['category_name'], item['description'], item['unit'],
                  item['quantity'], item['unit_price'], item['discount_percent'], item['vat_percent'], item['position']))
        
        await db.commit()
        return await get_quote(new_id, user)
    finally:
        await db.close()

# ===================== QUOTE DRAFTS (Auto-save) =====================

@api_router.post("/quotes/drafts")
async def save_quote_draft(data: QuoteDraftSave, user = Depends(get_current_user)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        draft_id = str(uuid.uuid4())
        draft_json = json.dumps(data.draft_data)
        
        # Check if draft exists for this user/quote
        if data.quote_id:
            cursor = await db.execute(
                "SELECT id FROM quote_drafts WHERE user_id = ? AND quote_id = ?",
                (user['user_id'], data.quote_id)
            )
        else:
            cursor = await db.execute(
                "SELECT id FROM quote_drafts WHERE user_id = ? AND quote_id IS NULL",
                (user['user_id'],)
            )
        existing = await cursor.fetchone()
        
        if existing:
            await db.execute(
                "UPDATE quote_drafts SET draft_data = ?, updated_at = ? WHERE id = ?",
                (draft_json, now, existing['id'])
            )
        else:
            await db.execute('''
                INSERT INTO quote_drafts (id, user_id, quote_id, draft_data, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (draft_id, user['user_id'], data.quote_id, draft_json, now, now))
        
        await db.commit()
        return {"message": "Bozza salvata"}
    finally:
        await db.close()

@api_router.get("/quotes/drafts")
async def get_quote_drafts(user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM quote_drafts WHERE user_id = ? ORDER BY updated_at DESC",
            (user['user_id'],)
        )
        drafts = await cursor.fetchall()
        result = []
        for d in drafts:
            draft_dict = dict(d)
            draft_dict['draft_data'] = json.loads(d['draft_data'])
            result.append(draft_dict)
        return result
    finally:
        await db.close()

@api_router.delete("/quotes/drafts/{draft_id}")
async def delete_quote_draft(draft_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM quote_drafts WHERE id = ? AND user_id = ?", (draft_id, user['user_id']))
        await db.commit()
        return {"message": "Bozza eliminata"}
    finally:
        await db.close()

# ===================== MATERIALS, EXPENSES, EMPLOYEES, etc. =====================
# (Similar patterns for other endpoints - keeping them concise)

@api_router.get("/materials")
async def get_materials(category_id: str = "", low_stock: bool = False, user = Depends(get_current_user)):
    db = await get_db()
    try:
        query = "SELECT * FROM materials WHERE 1=1"
        params = []
        if category_id:
            query += " AND category_id = ?"
            params.append(category_id)
        
        cursor = await db.execute(query, params)
        materials = await cursor.fetchall()
        result = [dict(m) for m in materials]
        
        if low_stock:
            result = [m for m in result if m['stock_quantity'] <= m['min_stock_alert']]
        
        return result
    finally:
        await db.close()

@api_router.post("/materials")
async def create_material(data: MaterialBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        mat_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO materials (id, name, category_id, category_name, unit, stock_quantity, unit_cost, supplier, min_stock_alert, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (mat_id, data.name, data.category_id, data.category_name, data.unit, data.stock_quantity, data.unit_cost, data.supplier, data.min_stock_alert, data.notes, now, now))
        await db.commit()
        return {"id": mat_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.put("/materials/{material_id}")
async def update_material(material_id: str, data: MaterialBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        await db.execute('''
            UPDATE materials SET name = ?, category_id = ?, category_name = ?, unit = ?, stock_quantity = ?, unit_cost = ?, supplier = ?, min_stock_alert = ?, notes = ?, updated_at = ?
            WHERE id = ?
        ''', (data.name, data.category_id, data.category_name, data.unit, data.stock_quantity, data.unit_cost, data.supplier, data.min_stock_alert, data.notes, now, material_id))
        await db.commit()
        return {"id": material_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM materials WHERE id = ?", (material_id,))
        await db.commit()
        return {"message": "Materiale eliminato"}
    finally:
        await db.close()

@api_router.post("/materials/{material_id}/adjust-stock")
async def adjust_stock(material_id: str, adjustment: float, reason: str = "", user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT stock_quantity FROM materials WHERE id = ?", (material_id,))
        material = await cursor.fetchone()
        if not material:
            raise HTTPException(status_code=404, detail="Materiale non trovato")
        
        new_qty = material['stock_quantity'] + adjustment
        if new_qty < 0:
            raise HTTPException(status_code=400, detail="Quantità insufficiente")
        
        await db.execute("UPDATE materials SET stock_quantity = ? WHERE id = ?", (new_qty, material_id))
        await db.commit()
        return {"message": "Giacenza aggiornata", "new_quantity": new_qty}
    finally:
        await db.close()

# Expenses endpoints
@api_router.get("/expenses")
async def get_expenses(category_id: str = "", quote_id: str = "", date_from: str = "", date_to: str = "", user = Depends(get_current_user)):
    db = await get_db()
    try:
        query = "SELECT * FROM expenses WHERE 1=1"
        params = []
        if category_id:
            query += " AND category_id = ?"
            params.append(category_id)
        if quote_id:
            query += " AND quote_id = ?"
            params.append(quote_id)
        if date_from:
            query += " AND date >= ?"
            params.append(date_from)
        if date_to:
            query += " AND date <= ?"
            params.append(date_to)
        query += " ORDER BY date DESC"
        
        cursor = await db.execute(query, params)
        expenses = await cursor.fetchall()
        return [dict(e) for e in expenses]
    finally:
        await db.close()

@api_router.post("/expenses")
async def create_expense(data: ExpenseBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        exp_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO expenses (id, date, category_id, category_name, supplier, description, amount, vat_amount, payment_method, notes, quote_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (exp_id, data.date, data.category_id, data.category_name, data.supplier, data.description, data.amount, data.vat_amount, data.payment_method, data.notes, data.quote_id or None, now))
        await db.commit()
        return {"id": exp_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.put("/expenses/{expense_id}")
async def update_expense(expense_id: str, data: ExpenseBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute('''
            UPDATE expenses SET date = ?, category_id = ?, category_name = ?, supplier = ?, description = ?, amount = ?, vat_amount = ?, payment_method = ?, notes = ?, quote_id = ?
            WHERE id = ?
        ''', (data.date, data.category_id, data.category_name, data.supplier, data.description, data.amount, data.vat_amount, data.payment_method, data.notes, data.quote_id or None, expense_id))
        await db.commit()
        return {"id": expense_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM expenses WHERE id = ?", (expense_id,))
        await db.commit()
        return {"message": "Spesa eliminata"}
    finally:
        await db.close()

# Employees endpoints
@api_router.get("/employees")
async def get_employees(user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM employees ORDER BY name")
        employees = await cursor.fetchall()
        return [dict(e) for e in employees]
    finally:
        await db.close()

@api_router.post("/employees")
async def create_employee(data: EmployeeBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        emp_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO employees (id, name, role, hourly_rate, daily_rate, tax_info, phone, email, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (emp_id, data.name, data.role, data.hourly_rate, data.daily_rate, data.tax_info, data.phone, data.email, data.notes, now, now))
        await db.commit()
        return {"id": emp_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.put("/employees/{employee_id}")
async def update_employee(employee_id: str, data: EmployeeBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        now = datetime.now(timezone.utc).isoformat()
        await db.execute('''
            UPDATE employees SET name = ?, role = ?, hourly_rate = ?, daily_rate = ?, tax_info = ?, phone = ?, email = ?, notes = ?, updated_at = ?
            WHERE id = ?
        ''', (data.name, data.role, data.hourly_rate, data.daily_rate, data.tax_info, data.phone, data.email, data.notes, now, employee_id))
        await db.commit()
        return {"id": employee_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM employees WHERE id = ?", (employee_id,))
        await db.commit()
        return {"message": "Dipendente eliminato"}
    finally:
        await db.close()

# Worklogs
@api_router.get("/worklogs")
async def get_worklogs(employee_id: str = "", quote_id: str = "", user = Depends(get_current_user)):
    db = await get_db()
    try:
        query = "SELECT * FROM worklogs WHERE 1=1"
        params = []
        if employee_id:
            query += " AND employee_id = ?"
            params.append(employee_id)
        if quote_id:
            query += " AND quote_id = ?"
            params.append(quote_id)
        query += " ORDER BY date DESC"
        
        cursor = await db.execute(query, params)
        worklogs = await cursor.fetchall()
        return [dict(w) for w in worklogs]
    finally:
        await db.close()

@api_router.post("/worklogs")
async def create_worklog(data: WorkLogBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        log_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO worklogs (id, employee_id, quote_id, date, hours, days, description, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (log_id, data.employee_id, data.quote_id or None, data.date, data.hours, data.days, data.description, now))
        await db.commit()
        return {"id": log_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.delete("/worklogs/{worklog_id}")
async def delete_worklog(worklog_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM worklogs WHERE id = ?", (worklog_id,))
        await db.commit()
        return {"message": "Registro ore eliminato"}
    finally:
        await db.close()

# Payments
@api_router.get("/payments")
async def get_payments(employee_id: str = "", status: str = "", user = Depends(get_current_user)):
    db = await get_db()
    try:
        query = "SELECT * FROM payments WHERE 1=1"
        params = []
        if employee_id:
            query += " AND employee_id = ?"
            params.append(employee_id)
        if status:
            query += " AND status = ?"
            params.append(status)
        query += " ORDER BY date DESC"
        
        cursor = await db.execute(query, params)
        payments = await cursor.fetchall()
        return [dict(p) for p in payments]
    finally:
        await db.close()

@api_router.post("/payments")
async def create_payment(data: PaymentBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        pay_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        await db.execute('''
            INSERT INTO payments (id, employee_id, amount, date, payment_method, notes, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (pay_id, data.employee_id, data.amount, data.date, data.payment_method, data.notes, data.status, now))
        await db.commit()
        return {"id": pay_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.put("/payments/{payment_id}")
async def update_payment(payment_id: str, data: PaymentBase, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute('''
            UPDATE payments SET employee_id = ?, amount = ?, date = ?, payment_method = ?, notes = ?, status = ?
            WHERE id = ?
        ''', (data.employee_id, data.amount, data.date, data.payment_method, data.notes, data.status, payment_id))
        await db.commit()
        return {"id": payment_id, **data.model_dump()}
    finally:
        await db.close()

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        await db.execute("DELETE FROM payments WHERE id = ?", (payment_id,))
        await db.commit()
        return {"message": "Pagamento eliminato"}
    finally:
        await db.close()

# ===================== SETTINGS =====================

@api_router.get("/settings")
async def get_settings(user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM settings WHERE id = 'company_settings'")
        settings = await cursor.fetchone()
        
        if not settings:
            return SettingsModel().model_dump()
        
        result = dict(settings)
        result['default_vat_rates'] = json.loads(result.get('default_vat_rates', '[]'))
        result['units'] = json.loads(result.get('units', '[]'))
        return result
    finally:
        await db.close()

@api_router.put("/settings")
async def update_settings(data: SettingsModel, user = Depends(require_admin)):
    db = await get_db()
    try:
        vat_rates_json = json.dumps(data.default_vat_rates)
        units_json = json.dumps(data.units)
        
        await db.execute('''
            INSERT OR REPLACE INTO settings (id, company_name, company_address, company_city, company_cap, company_province,
                company_vat, company_fiscal_code, company_phone, company_email, company_pec, company_iban, company_bank,
                quote_prefix, invoice_prefix, current_year, quote_counter, invoice_counter, default_vat_rates, 
                default_payment_terms, default_notes, units, inactivity_timeout_minutes)
            VALUES ('company_settings', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (data.company_name, data.company_address, data.company_city, data.company_cap, data.company_province,
              data.company_vat, data.company_fiscal_code, data.company_phone, data.company_email, data.company_pec,
              data.company_iban, data.company_bank, data.quote_prefix, data.invoice_prefix, data.current_year,
              data.quote_counter, data.invoice_counter, vat_rates_json, data.default_payment_terms, data.default_notes,
              units_json, data.inactivity_timeout_minutes))
        await db.commit()
        return data.model_dump()
    finally:
        await db.close()

# ===================== DASHBOARD =====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user = Depends(get_current_user)):
    db = await get_db()
    try:
        # Quotes stats
        cursor = await db.execute("SELECT status, COUNT(*) as count FROM quotes GROUP BY status")
        quote_stats = await cursor.fetchall()
        quotes_by_status = {row['status']: row['count'] for row in quote_stats}
        
        cursor = await db.execute("SELECT COUNT(*) as total FROM quotes")
        total_quotes = (await cursor.fetchone())['total']
        
        # Monthly revenue
        current_month = datetime.now().strftime('%Y-%m')
        cursor = await db.execute('''
            SELECT SUM(qi.quantity * qi.unit_price * (1 - qi.discount_percent / 100)) as revenue
            FROM quotes q JOIN quote_items qi ON q.id = qi.quote_id
            WHERE q.status = 'accepted' AND q.date LIKE ?
        ''', (f'{current_month}%',))
        monthly_revenue = (await cursor.fetchone())['revenue'] or 0
        
        # Low stock
        cursor = await db.execute("SELECT COUNT(*) as count FROM materials WHERE stock_quantity <= min_stock_alert")
        low_stock = (await cursor.fetchone())['count']
        
        # Pending payments
        cursor = await db.execute("SELECT SUM(amount) as total FROM payments WHERE status IN ('pending', 'partial')")
        pending_payments = (await cursor.fetchone())['total'] or 0
        
        # Clients count
        cursor = await db.execute("SELECT COUNT(*) as count FROM clients")
        clients_count = (await cursor.fetchone())['count']
        
        # Recent quotes
        cursor = await db.execute("SELECT * FROM quotes ORDER BY date DESC LIMIT 5")
        recent_quotes = [dict(q) for q in await cursor.fetchall()]
        
        return {
            "quotes": {
                "draft": quotes_by_status.get('draft', 0),
                "sent": quotes_by_status.get('sent', 0),
                "accepted": quotes_by_status.get('accepted', 0),
                "total": total_quotes
            },
            "monthly_revenue": monthly_revenue,
            "low_stock_alerts": low_stock,
            "pending_payments": pending_payments,
            "clients_count": clients_count,
            "recent_quotes": recent_quotes
        }
    finally:
        await db.close()

# ===================== GLOBAL SEARCH =====================

@api_router.get("/search")
async def global_search(q: str, limit: int = 20, user = Depends(get_current_user)):
    db = await get_db()
    try:
        results = {"clients": [], "quotes": [], "materials": []}
        search_term = f'%{q}%'
        
        # Search clients
        cursor = await db.execute('''
            SELECT id, name, company_name, email, phone FROM clients
            WHERE name LIKE ? OR company_name LIKE ? OR email LIKE ?
            LIMIT ?
        ''', (search_term, search_term, search_term, limit))
        results['clients'] = [dict(c) for c in await cursor.fetchall()]
        
        # Search quotes
        cursor = await db.execute('''
            SELECT id, quote_number, project_description, status FROM quotes
            WHERE quote_number LIKE ? OR project_description LIKE ?
            LIMIT ?
        ''', (search_term, search_term, limit))
        results['quotes'] = [dict(q) for q in await cursor.fetchall()]
        
        # Search materials
        cursor = await db.execute('''
            SELECT id, name, category_name, supplier FROM materials
            WHERE name LIKE ? OR supplier LIKE ?
            LIMIT ?
        ''', (search_term, search_term, limit))
        results['materials'] = [dict(m) for m in await cursor.fetchall()]
        
        return results
    finally:
        await db.close()

# ===================== PDF GENERATION =====================

@api_router.get("/quotes/{quote_id}/pdf")
async def generate_quote_pdf(quote_id: str, user = Depends(get_current_user)):
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM quotes WHERE id = ?", (quote_id,))
        quote = await cursor.fetchone()
        if not quote:
            raise HTTPException(status_code=404, detail="Preventivo non trovato")
        
        quote = dict(quote)
        
        cursor = await db.execute("SELECT * FROM quote_items WHERE quote_id = ? ORDER BY position", (quote_id,))
        items = [dict(i) for i in await cursor.fetchall()]
        
        cursor = await db.execute("SELECT * FROM clients WHERE id = ?", (quote['client_id'],))
        client_row = await cursor.fetchone()
        client = dict(client_row) if client_row else {}
        
        cursor = await db.execute("SELECT * FROM settings WHERE id = 'company_settings'")
        settings_row = await cursor.fetchone()
        settings = dict(settings_row) if settings_row else {}
        
        # Generate PDF
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=20*mm, leftMargin=20*mm, topMargin=20*mm, bottomMargin=20*mm)
        
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#005f73'), alignment=TA_CENTER)
        header_style = ParagraphStyle('Header', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#333333'))
        normal_style = ParagraphStyle('Normal', parent=styles['Normal'], fontSize=9)
        small_style = ParagraphStyle('Small', parent=styles['Normal'], fontSize=8, textColor=colors.HexColor('#666666'))
        
        elements = []
        
        # Company header
        company_name = settings.get('company_name', 'La Tua Azienda')
        elements.append(Paragraph(f"<b>{company_name}</b>", title_style))
        elements.append(Spacer(1, 5*mm))
        
        company_info = f"""
        {settings.get('company_address', '')} - {settings.get('company_cap', '')} {settings.get('company_city', '')} ({settings.get('company_province', '')})<br/>
        P.IVA: {settings.get('company_vat', '')} - C.F.: {settings.get('company_fiscal_code', '')}<br/>
        Tel: {settings.get('company_phone', '')} - Email: {settings.get('company_email', '')}
        """
        elements.append(Paragraph(company_info, small_style))
        elements.append(Spacer(1, 10*mm))
        
        # Quote info
        quote_date = quote.get('date', '')[:10] if quote.get('date') else ''
        validity_days = quote.get('validity_days', 30)
        
        elements.append(Paragraph(f"<b>PREVENTIVO N. {quote.get('quote_number', '')}</b>", 
                                  ParagraphStyle('QuoteNum', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#005f73'))))
        elements.append(Paragraph(f"Data: {quote_date}", normal_style))
        elements.append(Spacer(1, 8*mm))
        
        # Client info
        if client:
            client_info = f"""
            <b>Cliente:</b><br/>
            {client.get('company_name', '') or client.get('name', '')}<br/>
            {client.get('address', '')} - {client.get('cap', '')} {client.get('city', '')} ({client.get('province', '')})<br/>
            P.IVA: {client.get('vat_number', '')} - C.F.: {client.get('fiscal_code', '')}<br/>
            {client.get('email', '')} - {client.get('phone', '')}
            """
            elements.append(Paragraph(client_info, header_style))
            elements.append(Spacer(1, 8*mm))
        
        # Project description
        if quote.get('project_description'):
            elements.append(Paragraph(f"<b>Oggetto:</b> {quote.get('project_description', '')}", normal_style))
        if quote.get('site_address'):
            elements.append(Paragraph(f"<b>Indirizzo cantiere:</b> {quote.get('site_address', '')}", normal_style))
        elements.append(Spacer(1, 8*mm))
        
        # Items table
        if items:
            table_data = [['Descrizione', 'U.M.', 'Q.tà', 'Prezzo', 'Sconto', 'IVA', 'Totale']]
            
            subtotal = 0
            vat_breakdown = {}
            
            for item in items:
                qty = item.get('quantity', 0)
                price = item.get('unit_price', 0)
                discount = item.get('discount_percent', 0)
                vat = item.get('vat_percent', 22)
                
                line_subtotal = qty * price * (1 - discount / 100)
                line_vat = line_subtotal * vat / 100
                line_total = line_subtotal + line_vat
                
                subtotal += line_subtotal
                vat_breakdown[vat] = vat_breakdown.get(vat, 0) + line_vat
                
                desc = item.get('description', '')
                if item.get('category_name'):
                    desc = f"[{item.get('category_name')}] {desc}"
                
                table_data.append([
                    Paragraph(desc, small_style),
                    item.get('unit', ''),
                    f"{qty:.2f}",
                    f"€ {price:.2f}",
                    f"{discount:.0f}%" if discount else "-",
                    f"{vat:.0f}%",
                    f"€ {line_total:.2f}"
                ])
            
            table = Table(table_data, colWidths=[80*mm, 15*mm, 15*mm, 20*mm, 15*mm, 15*mm, 25*mm])
            table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#005f73')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
                ('TOPPADDING', (0, 0), (-1, 0), 8),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                ('ALIGN', (3, 1), (-1, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#dee2e6')),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 6),
                ('TOPPADDING', (0, 1), (-1, -1), 6),
            ]))
            elements.append(table)
            elements.append(Spacer(1, 8*mm))
            
            # Totals
            total_vat = sum(vat_breakdown.values())
            grand_total = subtotal + total_vat
            
            totals_data = [['', '', '', '', '', 'Imponibile:', f"€ {subtotal:.2f}"]]
            for vat_rate, vat_amount in sorted(vat_breakdown.items()):
                totals_data.append(['', '', '', '', '', f'IVA {vat_rate:.0f}%:', f"€ {vat_amount:.2f}"])
            totals_data.append(['', '', '', '', '', 'TOTALE:', f"€ {grand_total:.2f}"])
            
            totals_table = Table(totals_data, colWidths=[80*mm, 15*mm, 15*mm, 20*mm, 15*mm, 20*mm, 25*mm])
            totals_table.setStyle(TableStyle([
                ('ALIGN', (5, 0), (-1, -1), 'RIGHT'),
                ('FONTNAME', (5, -1), (-1, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 9),
                ('TEXTCOLOR', (5, -1), (-1, -1), colors.HexColor('#005f73')),
            ]))
            elements.append(totals_table)
        
        elements.append(Spacer(1, 10*mm))
        
        # Notes
        if quote.get('notes'):
            elements.append(Paragraph(f"<b>Note:</b><br/>{quote.get('notes', '')}", normal_style))
            elements.append(Spacer(1, 5*mm))
        
        if quote.get('special_conditions'):
            elements.append(Paragraph(f"<b>Condizioni particolari:</b><br/>{quote.get('special_conditions', '')}", normal_style))
            elements.append(Spacer(1, 5*mm))
        
        # Payment terms
        if settings.get('default_payment_terms'):
            elements.append(Paragraph(f"<b>Condizioni di pagamento:</b><br/>{settings.get('default_payment_terms', '')}", normal_style))
            elements.append(Spacer(1, 5*mm))
        
        # Bank details
        if settings.get('company_iban'):
            bank_info = f"<b>Coordinate bancarie:</b><br/>{settings.get('company_bank', '')} - IBAN: {settings.get('company_iban', '')}"
            elements.append(Paragraph(bank_info, normal_style))
        
        # Signature
        elements.append(Spacer(1, 15*mm))
        elements.append(Paragraph("Per accettazione:", normal_style))
        elements.append(Spacer(1, 15*mm))
        elements.append(Paragraph("_" * 40, normal_style))
        elements.append(Paragraph("(Firma e timbro)", small_style))
        
        doc.build(elements)
        buffer.seek(0)
        
        filename = f"Preventivo_{quote.get('quote_number', 'N')}.pdf"
        return StreamingResponse(
            buffer,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    finally:
        await db.close()

# ===================== SEED DATA =====================

@api_router.post("/seed")
async def seed_data():
    db = await get_db()
    try:
        # Check if admin exists
        cursor = await db.execute("SELECT id FROM users WHERE username = 'admin'")
        admin = await cursor.fetchone()
        
        if not admin:
            admin_id = str(uuid.uuid4())
            now = datetime.now(timezone.utc).isoformat()
            await db.execute('''
                INSERT INTO users (id, username, password_hash, role, name, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (admin_id, 'admin', hash_password('admin123'), 'admin', 'Amministratore', now))
        
        # Check if settings exist
        cursor = await db.execute("SELECT id FROM settings WHERE id = 'company_settings'")
        settings = await cursor.fetchone()
        
        if not settings:
            await db.execute('''
                INSERT INTO settings (id, company_name, company_address, company_city, company_cap, company_province,
                    company_vat, company_fiscal_code, company_phone, company_email, company_pec, company_iban, company_bank,
                    quote_prefix, invoice_prefix, current_year, quote_counter, invoice_counter, default_vat_rates,
                    default_payment_terms, default_notes, units, inactivity_timeout_minutes)
                VALUES ('company_settings', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', ('Pittura Edile S.r.l.', 'Via Roma 123', 'Milano', '20100', 'MI', '12345678901', '12345678901',
                  '+39 02 1234567', 'info@pitturaedile.it', 'pitturaedile@pec.it', 'IT60X0542811101000000123456',
                  'Banca Intesa San Paolo', 'PRV', 'FT', 2025, 0, 0, '[22.0, 10.0, 4.0, 0.0]',
                  'Pagamento a 30 giorni dalla data fattura mediante bonifico bancario.',
                  'I prezzi si intendono IVA esclusa. Il preventivo ha validità 30 giorni.',
                  '["mq", "ml", "pz", "kg", "lt", "ore", "gg", "corpo"]', 30))
        
        # Seed default categories
        cursor = await db.execute("SELECT COUNT(*) as count FROM categories")
        cat_count = (await cursor.fetchone())['count']
        
        if cat_count == 0:
            now = datetime.now(timezone.utc).isoformat()
            default_categories = [
                ("Preparazione Superfici", None, "#4CAF50", 22.0, "Pulizia, carteggiatura, stuccatura"),
                ("Pittura Interni", None, "#2196F3", 10.0, "Pittura pareti e soffitti interni"),
                ("Pittura Esterni", None, "#FF9800", 10.0, "Pittura facciate e balconi"),
                ("Verniciatura Legno", None, "#795548", 22.0, "Infissi, porte, persiane"),
                ("Verniciatura Ferro", None, "#607D8B", 22.0, "Ringhiere, cancelli, strutture metalliche"),
                ("Decorazioni", None, "#9C27B0", 22.0, "Effetti decorativi, stucchi, velature"),
                ("Cartongesso", None, "#00BCD4", 10.0, "Pareti e controsoffitti in cartongesso"),
                ("Rasatura e Stuccatura", None, "#8BC34A", 10.0, "Rasatura pareti, stuccatura crepe"),
                ("Trattamenti Speciali", None, "#E91E63", 22.0, "Antimuffa, impermeabilizzanti"),
                ("Ponteggi e Noleggi", None, "#FFC107", 22.0, "Noleggio ponteggi e attrezzature"),
                ("Manodopera", None, "#3F51B5", 22.0, "Ore di lavoro"),
            ]
            
            for i, (name, parent, color, vat, desc) in enumerate(default_categories):
                cat_id = str(uuid.uuid4())
                await db.execute('''
                    INSERT INTO categories (id, name, parent_id, color, default_vat_percent, description, position, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (cat_id, name, parent, color, vat, desc, i, now))
        
        await db.commit()
        return {"message": "Dati inizializzati con successo"}
    finally:
        await db.close()

@api_router.get("/")
async def root():
    return {"message": "API Preventivi Pittura Edile - SQLite Version"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_db()
    await seed_data()
    logger.info("Application started with SQLite database")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
