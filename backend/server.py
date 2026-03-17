from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
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

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'preventivi-pittura-secret-key-2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

app = FastAPI(title="Preventivi Pittura Edile")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class UserBase(BaseModel):
    username: str
    role: str = "operator"  # admin or operator
    name: str = ""

class UserCreate(UserBase):
    password: str

class User(UserBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class LoginRequest(BaseModel):
    username: str
    password: str

class ClientBase(BaseModel):
    name: str
    company_name: str = ""
    vat_number: str = ""  # P.IVA
    fiscal_code: str = ""
    address: str = ""
    city: str = ""
    cap: str = ""
    province: str = ""
    phone: str = ""
    email: str = ""
    notes: str = ""
    # Billing data
    bank_name: str = ""
    iban: str = ""
    sdi_code: str = ""  # Codice SDI
    pec_email: str = ""
    payment_terms: str = ""

class Client(ClientBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuoteItemBase(BaseModel):
    category: str = ""
    description: str
    unit: str = "mq"  # mq, ml, pz, ore, etc.
    quantity: float = 1.0
    unit_price: float = 0.0
    discount_percent: float = 0.0
    vat_percent: float = 22.0
    position: int = 0

class QuoteItem(QuoteItemBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))

class QuoteBase(BaseModel):
    client_id: str
    project_description: str = ""
    site_address: str = ""
    validity_days: int = 30
    status: str = "draft"  # draft, sent, accepted, rejected, invoiced
    notes: str = ""
    special_conditions: str = ""
    items: List[QuoteItem] = []

class Quote(QuoteBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quote_number: str = ""
    date: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MaterialBase(BaseModel):
    name: str
    category: str = ""
    unit: str = "pz"
    stock_quantity: float = 0.0
    unit_cost: float = 0.0
    supplier: str = ""
    min_stock_alert: float = 10.0
    notes: str = ""

class Material(MaterialBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ExpenseBase(BaseModel):
    date: str
    category: str = ""
    supplier: str = ""
    description: str = ""
    amount: float = 0.0
    vat_amount: float = 0.0
    payment_method: str = ""
    notes: str = ""
    quote_id: str = ""  # Link to project/quote

class Expense(ExpenseBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class EmployeeBase(BaseModel):
    name: str
    role: str = ""
    hourly_rate: float = 0.0
    daily_rate: float = 0.0
    tax_info: str = ""
    phone: str = ""
    email: str = ""
    notes: str = ""

class Employee(EmployeeBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class WorkLogBase(BaseModel):
    employee_id: str
    quote_id: str = ""
    date: str
    hours: float = 0.0
    days: float = 0.0
    description: str = ""

class WorkLog(WorkLogBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class PaymentBase(BaseModel):
    employee_id: str
    amount: float = 0.0
    date: str
    payment_method: str = ""
    notes: str = ""
    status: str = "pending"  # pending, partial, paid

class Payment(PaymentBase):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class SettingsModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = "company_settings"
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
    default_payment_terms: str = "Pagamento a 30 giorni dalla data fattura"
    default_notes: str = ""
    categories: List[str] = []
    units: List[str] = []

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, username: str, role: str) -> str:
    payload = {
        'user_id': user_id,
        'username': username,
        'role': role,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
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
async def login(request: LoginRequest):
    user = await db.users.find_one({"username": request.username}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    if not verify_password(request.password, user.get('password_hash', '')):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    token = create_token(user['id'], user['username'], user['role'])
    return {
        "token": token,
        "user": {
            "id": user['id'],
            "username": user['username'],
            "role": user['role'],
            "name": user.get('name', '')
        }
    }

@api_router.get("/auth/me")
async def get_me(user = Depends(get_current_user)):
    db_user = await db.users.find_one({"id": user['user_id']}, {"_id": 0, "password_hash": 0})
    if not db_user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    return db_user

@api_router.get("/users", response_model=List[User])
async def get_users(user = Depends(require_admin)):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate, admin = Depends(require_admin)):
    existing = await db.users.find_one({"username": user_data.username})
    if existing:
        raise HTTPException(status_code=400, detail="Username già esistente")
    user_obj = User(**user_data.model_dump(exclude={'password'}))
    doc = user_obj.model_dump()
    doc['password_hash'] = hash_password(user_data.password)
    await db.users.insert_one(doc)
    return user_obj

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin = Depends(require_admin)):
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    return {"message": "Utente eliminato"}

# ===================== CLIENTS ENDPOINTS =====================

@api_router.get("/clients", response_model=List[Client])
async def get_clients(search: str = "", user = Depends(get_current_user)):
    query = {}
    if search:
        query = {"$or": [
            {"name": {"$regex": search, "$options": "i"}},
            {"company_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]}
    clients = await db.clients.find(query, {"_id": 0}).to_list(1000)
    return clients

@api_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, user = Depends(get_current_user)):
    client = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    return client

@api_router.post("/clients", response_model=Client)
async def create_client(client_data: ClientBase, user = Depends(get_current_user)):
    client_obj = Client(**client_data.model_dump())
    doc = client_obj.model_dump()
    await db.clients.insert_one(doc)
    return client_obj

@api_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, client_data: ClientBase, user = Depends(get_current_user)):
    update_data = client_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.clients.update_one({"id": client_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    return await get_client(client_id, user)

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user = Depends(get_current_user)):
    result = await db.clients.delete_one({"id": client_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    return {"message": "Cliente eliminato"}

# ===================== QUOTES ENDPOINTS =====================

async def generate_quote_number():
    settings = await db.settings.find_one({"id": "company_settings"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().model_dump()
        await db.settings.insert_one(settings)
    
    current_year = datetime.now().year
    if settings.get('current_year', 2025) != current_year:
        settings['current_year'] = current_year
        settings['quote_counter'] = 0
    
    counter = settings.get('quote_counter', 0) + 1
    prefix = settings.get('quote_prefix', 'PRV')
    quote_number = f"{prefix}-{current_year}-{counter:03d}"
    
    await db.settings.update_one(
        {"id": "company_settings"},
        {"$set": {"quote_counter": counter, "current_year": current_year}}
    )
    return quote_number

@api_router.get("/quotes", response_model=List[Quote])
async def get_quotes(
    client_id: str = "",
    status: str = "",
    date_from: str = "",
    date_to: str = "",
    user = Depends(get_current_user)
):
    query = {}
    if client_id:
        query['client_id'] = client_id
    if status:
        query['status'] = status
    if date_from:
        query['date'] = {"$gte": date_from}
    if date_to:
        if 'date' in query:
            query['date']['$lte'] = date_to
        else:
            query['date'] = {"$lte": date_to}
    
    quotes = await db.quotes.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return quotes

@api_router.get("/quotes/{quote_id}", response_model=Quote)
async def get_quote(quote_id: str, user = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    return quote

@api_router.post("/quotes", response_model=Quote)
async def create_quote(quote_data: QuoteBase, user = Depends(get_current_user)):
    quote_number = await generate_quote_number()
    quote_obj = Quote(**quote_data.model_dump())
    quote_obj.quote_number = quote_number
    doc = quote_obj.model_dump()
    await db.quotes.insert_one(doc)
    return quote_obj

@api_router.put("/quotes/{quote_id}", response_model=Quote)
async def update_quote(quote_id: str, quote_data: QuoteBase, user = Depends(get_current_user)):
    update_data = quote_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.quotes.update_one({"id": quote_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    return await get_quote(quote_id, user)

@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str, user = Depends(get_current_user)):
    result = await db.quotes.delete_one({"id": quote_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    return {"message": "Preventivo eliminato"}

@api_router.post("/quotes/{quote_id}/duplicate", response_model=Quote)
async def duplicate_quote(quote_id: str, user = Depends(get_current_user)):
    original = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not original:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    
    quote_number = await generate_quote_number()
    new_quote = Quote(
        client_id=original['client_id'],
        project_description=original.get('project_description', ''),
        site_address=original.get('site_address', ''),
        validity_days=original.get('validity_days', 30),
        status='draft',
        notes=original.get('notes', ''),
        special_conditions=original.get('special_conditions', ''),
        items=[QuoteItem(**item) for item in original.get('items', [])]
    )
    new_quote.quote_number = quote_number
    
    # Regenerate item IDs
    for item in new_quote.items:
        item.id = str(uuid.uuid4())
    
    doc = new_quote.model_dump()
    await db.quotes.insert_one(doc)
    return new_quote

# ===================== MATERIALS ENDPOINTS =====================

@api_router.get("/materials", response_model=List[Material])
async def get_materials(category: str = "", low_stock: bool = False, user = Depends(get_current_user)):
    query = {}
    if category:
        query['category'] = category
    materials = await db.materials.find(query, {"_id": 0}).to_list(1000)
    if low_stock:
        materials = [m for m in materials if m.get('stock_quantity', 0) <= m.get('min_stock_alert', 10)]
    return materials

@api_router.get("/materials/{material_id}", response_model=Material)
async def get_material(material_id: str, user = Depends(get_current_user)):
    material = await db.materials.find_one({"id": material_id}, {"_id": 0})
    if not material:
        raise HTTPException(status_code=404, detail="Materiale non trovato")
    return material

@api_router.post("/materials", response_model=Material)
async def create_material(material_data: MaterialBase, user = Depends(get_current_user)):
    material_obj = Material(**material_data.model_dump())
    doc = material_obj.model_dump()
    await db.materials.insert_one(doc)
    return material_obj

@api_router.put("/materials/{material_id}", response_model=Material)
async def update_material(material_id: str, material_data: MaterialBase, user = Depends(get_current_user)):
    update_data = material_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.materials.update_one({"id": material_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Materiale non trovato")
    return await get_material(material_id, user)

@api_router.delete("/materials/{material_id}")
async def delete_material(material_id: str, user = Depends(get_current_user)):
    result = await db.materials.delete_one({"id": material_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Materiale non trovato")
    return {"message": "Materiale eliminato"}

@api_router.post("/materials/{material_id}/adjust-stock")
async def adjust_stock(material_id: str, adjustment: float, reason: str = "", user = Depends(get_current_user)):
    material = await db.materials.find_one({"id": material_id}, {"_id": 0})
    if not material:
        raise HTTPException(status_code=404, detail="Materiale non trovato")
    
    new_quantity = material.get('stock_quantity', 0) + adjustment
    if new_quantity < 0:
        raise HTTPException(status_code=400, detail="Quantità insufficiente")
    
    await db.materials.update_one(
        {"id": material_id},
        {"$set": {"stock_quantity": new_quantity, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Log the adjustment
    await db.stock_logs.insert_one({
        "id": str(uuid.uuid4()),
        "material_id": material_id,
        "adjustment": adjustment,
        "reason": reason,
        "user_id": user['user_id'],
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    return {"message": "Giacenza aggiornata", "new_quantity": new_quantity}

# ===================== EXPENSES ENDPOINTS =====================

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(
    category: str = "",
    date_from: str = "",
    date_to: str = "",
    quote_id: str = "",
    user = Depends(get_current_user)
):
    query = {}
    if category:
        query['category'] = category
    if quote_id:
        query['quote_id'] = quote_id
    if date_from:
        query['date'] = {"$gte": date_from}
    if date_to:
        if 'date' in query:
            query['date']['$lte'] = date_to
        else:
            query['date'] = {"$lte": date_to}
    
    expenses = await db.expenses.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return expenses

@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseBase, user = Depends(get_current_user)):
    expense_obj = Expense(**expense_data.model_dump())
    doc = expense_obj.model_dump()
    await db.expenses.insert_one(doc)
    return expense_obj

@api_router.put("/expenses/{expense_id}", response_model=Expense)
async def update_expense(expense_id: str, expense_data: ExpenseBase, user = Depends(get_current_user)):
    update_data = expense_data.model_dump()
    result = await db.expenses.update_one({"id": expense_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Spesa non trovata")
    expense = await db.expenses.find_one({"id": expense_id}, {"_id": 0})
    return expense

@api_router.delete("/expenses/{expense_id}")
async def delete_expense(expense_id: str, user = Depends(get_current_user)):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Spesa non trovata")
    return {"message": "Spesa eliminata"}

# ===================== EMPLOYEES ENDPOINTS =====================

@api_router.get("/employees", response_model=List[Employee])
async def get_employees(user = Depends(get_current_user)):
    employees = await db.employees.find({}, {"_id": 0}).to_list(1000)
    return employees

@api_router.get("/employees/{employee_id}", response_model=Employee)
async def get_employee(employee_id: str, user = Depends(get_current_user)):
    employee = await db.employees.find_one({"id": employee_id}, {"_id": 0})
    if not employee:
        raise HTTPException(status_code=404, detail="Dipendente non trovato")
    return employee

@api_router.post("/employees", response_model=Employee)
async def create_employee(employee_data: EmployeeBase, user = Depends(get_current_user)):
    employee_obj = Employee(**employee_data.model_dump())
    doc = employee_obj.model_dump()
    await db.employees.insert_one(doc)
    return employee_obj

@api_router.put("/employees/{employee_id}", response_model=Employee)
async def update_employee(employee_id: str, employee_data: EmployeeBase, user = Depends(get_current_user)):
    update_data = employee_data.model_dump()
    update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.employees.update_one({"id": employee_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Dipendente non trovato")
    return await get_employee(employee_id, user)

@api_router.delete("/employees/{employee_id}")
async def delete_employee(employee_id: str, user = Depends(get_current_user)):
    result = await db.employees.delete_one({"id": employee_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dipendente non trovato")
    return {"message": "Dipendente eliminato"}

# ===================== WORK LOGS ENDPOINTS =====================

@api_router.get("/worklogs", response_model=List[WorkLog])
async def get_worklogs(employee_id: str = "", quote_id: str = "", user = Depends(get_current_user)):
    query = {}
    if employee_id:
        query['employee_id'] = employee_id
    if quote_id:
        query['quote_id'] = quote_id
    worklogs = await db.worklogs.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return worklogs

@api_router.post("/worklogs", response_model=WorkLog)
async def create_worklog(worklog_data: WorkLogBase, user = Depends(get_current_user)):
    worklog_obj = WorkLog(**worklog_data.model_dump())
    doc = worklog_obj.model_dump()
    await db.worklogs.insert_one(doc)
    return worklog_obj

@api_router.delete("/worklogs/{worklog_id}")
async def delete_worklog(worklog_id: str, user = Depends(get_current_user)):
    result = await db.worklogs.delete_one({"id": worklog_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Registro ore non trovato")
    return {"message": "Registro ore eliminato"}

# ===================== PAYMENTS ENDPOINTS =====================

@api_router.get("/payments", response_model=List[Payment])
async def get_payments(employee_id: str = "", status: str = "", user = Depends(get_current_user)):
    query = {}
    if employee_id:
        query['employee_id'] = employee_id
    if status:
        query['status'] = status
    payments = await db.payments.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return payments

@api_router.post("/payments", response_model=Payment)
async def create_payment(payment_data: PaymentBase, user = Depends(get_current_user)):
    payment_obj = Payment(**payment_data.model_dump())
    doc = payment_obj.model_dump()
    await db.payments.insert_one(doc)
    return payment_obj

@api_router.put("/payments/{payment_id}", response_model=Payment)
async def update_payment(payment_id: str, payment_data: PaymentBase, user = Depends(get_current_user)):
    update_data = payment_data.model_dump()
    result = await db.payments.update_one({"id": payment_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento non trovato")
    payment = await db.payments.find_one({"id": payment_id}, {"_id": 0})
    return payment

@api_router.delete("/payments/{payment_id}")
async def delete_payment(payment_id: str, user = Depends(get_current_user)):
    result = await db.payments.delete_one({"id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento non trovato")
    return {"message": "Pagamento eliminato"}

# ===================== SETTINGS ENDPOINTS =====================

@api_router.get("/settings", response_model=SettingsModel)
async def get_settings(user = Depends(get_current_user)):
    settings = await db.settings.find_one({"id": "company_settings"}, {"_id": 0})
    if not settings:
        settings = SettingsModel().model_dump()
        await db.settings.insert_one(settings)
    return settings

@api_router.put("/settings", response_model=SettingsModel)
async def update_settings(settings_data: SettingsModel, user = Depends(require_admin)):
    update_data = settings_data.model_dump()
    update_data['id'] = 'company_settings'
    await db.settings.update_one(
        {"id": "company_settings"},
        {"$set": update_data},
        upsert=True
    )
    return settings_data

# ===================== DASHBOARD STATS =====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(user = Depends(get_current_user)):
    # Count quotes by status
    quotes = await db.quotes.find({}, {"_id": 0}).to_list(1000)
    draft_count = sum(1 for q in quotes if q.get('status') == 'draft')
    sent_count = sum(1 for q in quotes if q.get('status') == 'sent')
    accepted_count = sum(1 for q in quotes if q.get('status') == 'accepted')
    
    # Calculate monthly revenue from accepted quotes
    current_month = datetime.now().strftime('%Y-%m')
    monthly_total = 0
    for q in quotes:
        if q.get('status') == 'accepted' and q.get('date', '').startswith(current_month):
            for item in q.get('items', []):
                qty = item.get('quantity', 0)
                price = item.get('unit_price', 0)
                discount = item.get('discount_percent', 0)
                line_total = qty * price * (1 - discount / 100)
                monthly_total += line_total
    
    # Low stock materials
    materials = await db.materials.find({}, {"_id": 0}).to_list(1000)
    low_stock_count = sum(1 for m in materials if m.get('stock_quantity', 0) <= m.get('min_stock_alert', 10))
    
    # Pending payments
    payments = await db.payments.find({"status": {"$in": ["pending", "partial"]}}, {"_id": 0}).to_list(1000)
    pending_payments_total = sum(p.get('amount', 0) for p in payments)
    
    # Clients count
    clients_count = await db.clients.count_documents({})
    
    # Recent quotes
    recent_quotes = await db.quotes.find({}, {"_id": 0}).sort("date", -1).limit(5).to_list(5)
    
    return {
        "quotes": {
            "draft": draft_count,
            "sent": sent_count,
            "accepted": accepted_count,
            "total": len(quotes)
        },
        "monthly_revenue": monthly_total,
        "low_stock_alerts": low_stock_count,
        "pending_payments": pending_payments_total,
        "clients_count": clients_count,
        "recent_quotes": recent_quotes
    }

# ===================== PDF GENERATION =====================

@api_router.get("/quotes/{quote_id}/pdf")
async def generate_quote_pdf(quote_id: str, user = Depends(get_current_user)):
    quote = await db.quotes.find_one({"id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    
    client = await db.clients.find_one({"id": quote.get('client_id')}, {"_id": 0})
    settings = await db.settings.find_one({"id": "company_settings"}, {"_id": 0})
    if not settings:
        settings = {}
    
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
    quote_date = quote.get('date', '')[:10]
    validity_date = ''
    try:
        from dateutil.parser import parse
        qd = parse(quote.get('date', ''))
        vd = qd + timedelta(days=quote.get('validity_days', 30))
        validity_date = vd.strftime('%d/%m/%Y')
        quote_date = qd.strftime('%d/%m/%Y')
    except:
        pass
    
    elements.append(Paragraph(f"<b>PREVENTIVO N. {quote.get('quote_number', '')}</b>", ParagraphStyle('QuoteNum', parent=styles['Heading2'], fontSize=14, textColor=colors.HexColor('#005f73'))))
    elements.append(Paragraph(f"Data: {quote_date} - Validità: {validity_date}", normal_style))
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
    items = quote.get('items', [])
    if items:
        table_data = [['Descrizione', 'U.M.', 'Q.tà', 'Prezzo', 'Sconto', 'IVA', 'Totale']]
        
        subtotal = 0
        vat_breakdown = {}
        
        for item in sorted(items, key=lambda x: x.get('position', 0)):
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
            if item.get('category'):
                desc = f"[{item.get('category')}] {desc}"
            
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
        
        totals_data = [
            ['', '', '', '', '', 'Imponibile:', f"€ {subtotal:.2f}"],
        ]
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
    
    # Notes and conditions
    if quote.get('notes'):
        elements.append(Paragraph(f"<b>Note:</b><br/>{quote.get('notes', '')}", normal_style))
        elements.append(Spacer(1, 5*mm))
    
    if quote.get('special_conditions'):
        elements.append(Paragraph(f"<b>Condizioni particolari:</b><br/>{quote.get('special_conditions', '')}", normal_style))
        elements.append(Spacer(1, 5*mm))
    
    # Payment terms
    payment_terms = settings.get('default_payment_terms', '')
    if payment_terms:
        elements.append(Paragraph(f"<b>Condizioni di pagamento:</b><br/>{payment_terms}", normal_style))
        elements.append(Spacer(1, 5*mm))
    
    # Bank details
    if settings.get('company_iban'):
        bank_info = f"<b>Coordinate bancarie:</b><br/>{settings.get('company_bank', '')} - IBAN: {settings.get('company_iban', '')}"
        elements.append(Paragraph(bank_info, normal_style))
        elements.append(Spacer(1, 10*mm))
    
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

# ===================== SEED DATA =====================

@api_router.post("/seed")
async def seed_data():
    # Check if admin exists
    admin = await db.users.find_one({"username": "admin"})
    if not admin:
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "password_hash": hash_password("admin123"),
            "role": "admin",
            "name": "Amministratore",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
    
    # Check if settings exist
    settings = await db.settings.find_one({"id": "company_settings"})
    if not settings:
        default_settings = {
            "id": "company_settings",
            "company_name": "Pittura Edile S.r.l.",
            "company_address": "Via Roma 123",
            "company_city": "Milano",
            "company_cap": "20100",
            "company_province": "MI",
            "company_vat": "12345678901",
            "company_fiscal_code": "12345678901",
            "company_phone": "+39 02 1234567",
            "company_email": "info@pitturaedile.it",
            "company_pec": "pitturaedile@pec.it",
            "company_iban": "IT60X0542811101000000123456",
            "company_bank": "Banca Intesa San Paolo",
            "quote_prefix": "PRV",
            "invoice_prefix": "FT",
            "current_year": 2025,
            "quote_counter": 0,
            "invoice_counter": 0,
            "default_vat_rates": [22.0, 10.0, 4.0, 0.0],
            "default_payment_terms": "Pagamento a 30 giorni dalla data fattura mediante bonifico bancario.",
            "default_notes": "I prezzi si intendono IVA esclusa. Il preventivo ha validità 30 giorni.",
            "categories": [
                "Preparazione Superfici",
                "Pittura Interni",
                "Pittura Esterni",
                "Verniciatura Legno",
                "Verniciatura Ferro",
                "Decorazioni",
                "Cartongesso",
                "Rasatura e Stuccatura",
                "Trattamenti Speciali",
                "Ponteggi e Noleggi",
                "Manodopera"
            ],
            "units": ["mq", "ml", "pz", "kg", "lt", "ore", "gg", "corpo"]
        }
        await db.settings.insert_one(default_settings)
    
    return {"message": "Dati inizializzati con successo"}

@api_router.get("/")
async def root():
    return {"message": "API Preventivi Pittura Edile"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    # Auto-seed on startup
    await seed_data()
    logger.info("Application started, seed data initialized")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
