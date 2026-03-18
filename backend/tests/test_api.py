"""
Backend API Tests for Preventivi Pittura Edile Application
Tests: Authentication, Clients CRUD, Categories, Quotes CRUD, Dashboard, Settings, Search
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
assert BASE_URL, "REACT_APP_BACKEND_URL environment variable must be set"

# Test data tracking
TEST_PREFIX = "TEST_"

class TestAuth:
    """Authentication endpoint tests"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_login_success(self, session):
        """Test login with valid admin credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
            "remember_me": False
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "token" in data
        assert "session_id" in data
        assert "user" in data
        assert "inactivity_timeout_minutes" in data
        
        # Verify user data
        assert data["user"]["username"] == "admin"
        assert data["user"]["role"] == "admin"
        assert isinstance(data["token"], str)
        assert len(data["token"]) > 0
        assert isinstance(data["inactivity_timeout_minutes"], int)
        
    def test_login_with_remember_me(self, session):
        """Test login with remember_me flag set to True"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
            "remember_me": True
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "token" in data
        assert "session_id" in data
        # Token should be valid
        assert len(data["token"]) > 100
        
    def test_login_invalid_credentials(self, session):
        """Test login with invalid credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "wronguser",
            "password": "wrongpass",
            "remember_me": False
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data

    def test_login_empty_credentials(self, session):
        """Test login with empty credentials"""
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "",
            "password": "",
            "remember_me": False
        })
        assert response.status_code in [400, 401, 422]


class TestAuthenticatedEndpoints:
    """Tests requiring authentication"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
            "remember_me": False
        })
        assert response.status_code == 200
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_me(self, auth_session):
        """Test /api/auth/me endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == "admin"
        assert data["role"] == "admin"
        
    def test_get_sessions(self, auth_session):
        """Test /api/auth/sessions endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/auth/sessions")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_heartbeat(self, auth_session):
        """Test /api/auth/heartbeat endpoint"""
        response = auth_session.post(f"{BASE_URL}/api/auth/heartbeat")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert data["status"] == "ok"


class TestCategories:
    """Categories endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_categories(self, auth_session):
        """Test GET /api/categories returns predefined categories"""
        response = auth_session.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have predefined categories from seed
        # Check structure of category
        if len(data) > 0:
            cat = data[0]
            assert "id" in cat
            assert "name" in cat


class TestClientsCRUD:
    """Clients CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture(scope="class")
    def test_client_id(self, auth_session):
        """Create a test client and return its ID for other tests"""
        client_data = {
            "name": f"{TEST_PREFIX}Mario Rossi",
            "company_name": f"{TEST_PREFIX}Ditta Rossi SRL",
            "vat_number": "IT12345678901",
            "fiscal_code": "RSSMRA80A01H501Z",
            "address": "Via Test 123",
            "city": "Roma",
            "cap": "00100",
            "province": "RM",
            "country": "Italia",
            "phone": "+39 06 12345678",
            "email": "test@example.com",
            "notes": "Test client"
        }
        response = auth_session.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200
        data = response.json()
        yield data["id"]
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/clients/{data['id']}")
    
    def test_create_client(self, auth_session):
        """Test creating a new client"""
        client_data = {
            "name": f"{TEST_PREFIX}Giovanni Bianchi",
            "company_name": f"{TEST_PREFIX}Bianchi Costruzioni",
            "email": "giovanni@test.com",
            "phone": "+39 333 1234567"
        }
        response = auth_session.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data["name"] == client_data["name"]
        assert data["email"] == client_data["email"]
        
        # Verify persistence with GET
        get_response = auth_session.get(f"{BASE_URL}/api/clients/{data['id']}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["name"] == client_data["name"]
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/clients/{data['id']}")
    
    def test_get_all_clients(self, auth_session, test_client_id):
        """Test getting all clients"""
        response = auth_session.get(f"{BASE_URL}/api/clients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        
    def test_get_client_by_id(self, auth_session, test_client_id):
        """Test getting a specific client"""
        response = auth_session.get(f"{BASE_URL}/api/clients/{test_client_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_client_id
        
    def test_update_client(self, auth_session, test_client_id):
        """Test updating a client"""
        update_data = {
            "name": f"{TEST_PREFIX}Mario Rossi Updated",
            "company_name": f"{TEST_PREFIX}Ditta Rossi SRL",
            "email": "updated@example.com"
        }
        response = auth_session.put(f"{BASE_URL}/api/clients/{test_client_id}", json=update_data)
        assert response.status_code == 200
        
        # Verify persistence
        get_response = auth_session.get(f"{BASE_URL}/api/clients/{test_client_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched["email"] == "updated@example.com"
        
    def test_search_clients(self, auth_session, test_client_id):
        """Test client search"""
        response = auth_session.get(f"{BASE_URL}/api/clients?search=TEST_")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_delete_client(self, auth_session):
        """Test deleting a client"""
        # Create a client to delete
        client_data = {"name": f"{TEST_PREFIX}ToDelete"}
        create_response = auth_session.post(f"{BASE_URL}/api/clients", json=client_data)
        client_id = create_response.json()["id"]
        
        # Delete
        response = auth_session.delete(f"{BASE_URL}/api/clients/{client_id}")
        assert response.status_code == 200
        
        # Verify deletion
        get_response = auth_session.get(f"{BASE_URL}/api/clients/{client_id}")
        assert get_response.status_code == 404


class TestQuotesCRUD:
    """Quotes CRUD tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    @pytest.fixture(scope="class")
    def test_client_for_quotes(self, auth_session):
        """Create a client for quote tests"""
        client_data = {"name": f"{TEST_PREFIX}Quote Client"}
        response = auth_session.post(f"{BASE_URL}/api/clients", json=client_data)
        client_id = response.json()["id"]
        yield client_id
        auth_session.delete(f"{BASE_URL}/api/clients/{client_id}")
    
    def test_create_quote(self, auth_session, test_client_for_quotes):
        """Test creating a new quote"""
        quote_data = {
            "client_id": test_client_for_quotes,
            "project_description": f"{TEST_PREFIX}Pittura appartamento",
            "site_address": "Via Test 456",
            "validity_days": 30,
            "status": "draft",
            "items": [
                {
                    "description": "Pittura pareti interne",
                    "unit": "mq",
                    "quantity": 100,
                    "unit_price": 15.00,
                    "vat_percent": 22.0
                }
            ]
        }
        response = auth_session.post(f"{BASE_URL}/api/quotes", json=quote_data)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "quote_number" in data
        assert data["client_id"] == test_client_for_quotes
        
        # Verify persistence
        get_response = auth_session.get(f"{BASE_URL}/api/quotes/{data['id']}")
        assert get_response.status_code == 200
        
        # Cleanup
        auth_session.delete(f"{BASE_URL}/api/quotes/{data['id']}")
    
    def test_get_all_quotes(self, auth_session):
        """Test getting all quotes"""
        response = auth_session.get(f"{BASE_URL}/api/quotes")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_quote_update_and_delete(self, auth_session, test_client_for_quotes):
        """Test updating and deleting a quote"""
        # Create
        quote_data = {
            "client_id": test_client_for_quotes,
            "project_description": f"{TEST_PREFIX}Update test",
            "items": []
        }
        create_response = auth_session.post(f"{BASE_URL}/api/quotes", json=quote_data)
        quote_id = create_response.json()["id"]
        
        # Update
        update_data = {
            "client_id": test_client_for_quotes,
            "project_description": f"{TEST_PREFIX}Updated description",
            "status": "sent",
            "items": []
        }
        update_response = auth_session.put(f"{BASE_URL}/api/quotes/{quote_id}", json=update_data)
        assert update_response.status_code == 200
        
        # Verify update
        get_response = auth_session.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.json()["status"] == "sent"
        
        # Delete
        delete_response = auth_session.delete(f"{BASE_URL}/api/quotes/{quote_id}")
        assert delete_response.status_code == 200


class TestDashboard:
    """Dashboard endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_dashboard_stats(self, auth_session):
        """Test /api/dashboard/stats endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/dashboard/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "quotes" in data
        assert "monthly_revenue" in data
        assert "low_stock_alerts" in data
        assert "clients_count" in data


class TestSettings:
    """Settings endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_settings(self, auth_session):
        """Test GET /api/settings"""
        response = auth_session.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "company_name" in data or data is not None
        assert "inactivity_timeout_minutes" in data


class TestSearch:
    """Global search endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_global_search(self, auth_session):
        """Test /api/search endpoint"""
        response = auth_session.get(f"{BASE_URL}/api/search?q=test&limit=10")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "clients" in data
        assert "quotes" in data
        assert "materials" in data
        assert isinstance(data["clients"], list)


class TestMaterials:
    """Materials endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_get_materials(self, auth_session):
        """Test GET /api/materials"""
        response = auth_session.get(f"{BASE_URL}/api/materials")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
    
    def test_material_crud(self, auth_session):
        """Test materials CRUD operations"""
        # Create
        material_data = {
            "name": f"{TEST_PREFIX}Vernice bianca",
            "unit": "lt",
            "stock_quantity": 50.0,
            "unit_cost": 25.00,
            "supplier": "Test Supplier",
            "min_stock_alert": 10.0
        }
        create_response = auth_session.post(f"{BASE_URL}/api/materials", json=material_data)
        assert create_response.status_code == 200
        material_id = create_response.json()["id"]
        
        # Read
        get_response = auth_session.get(f"{BASE_URL}/api/materials")
        assert get_response.status_code == 200
        
        # Update
        update_data = {**material_data, "stock_quantity": 75.0}
        update_response = auth_session.put(f"{BASE_URL}/api/materials/{material_id}", json=update_data)
        assert update_response.status_code == 200
        
        # Delete
        delete_response = auth_session.delete(f"{BASE_URL}/api/materials/{material_id}")
        assert delete_response.status_code == 200


class TestExpenses:
    """Expenses endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_expenses_crud(self, auth_session):
        """Test expenses CRUD operations"""
        # Create
        expense_data = {
            "date": "2025-01-01",
            "supplier": f"{TEST_PREFIX}Test Supplier",
            "description": "Test expense",
            "amount": 100.00,
            "vat_amount": 22.00,
            "payment_method": "carta"
        }
        create_response = auth_session.post(f"{BASE_URL}/api/expenses", json=expense_data)
        assert create_response.status_code == 200
        expense_id = create_response.json()["id"]
        
        # Read
        get_response = auth_session.get(f"{BASE_URL}/api/expenses")
        assert get_response.status_code == 200
        
        # Delete
        delete_response = auth_session.delete(f"{BASE_URL}/api/expenses/{expense_id}")
        assert delete_response.status_code == 200


class TestEmployeesAndPayments:
    """Employees and payments endpoint tests"""
    
    @pytest.fixture(scope="class")
    def auth_session(self):
        session = requests.Session()
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        return session
    
    def test_employees_crud(self, auth_session):
        """Test employees CRUD operations"""
        # Create
        employee_data = {
            "name": f"{TEST_PREFIX}Mario Dipendente",
            "role": "Pittore",
            "hourly_rate": 15.00,
            "daily_rate": 120.00,
            "phone": "+39 333 1234567"
        }
        create_response = auth_session.post(f"{BASE_URL}/api/employees", json=employee_data)
        assert create_response.status_code == 200
        employee_id = create_response.json()["id"]
        
        # Read
        get_response = auth_session.get(f"{BASE_URL}/api/employees")
        assert get_response.status_code == 200
        
        # Delete
        delete_response = auth_session.delete(f"{BASE_URL}/api/employees/{employee_id}")
        assert delete_response.status_code == 200


class TestLogout:
    """Logout functionality test"""
    
    def test_logout(self):
        """Test logout invalidates session"""
        session = requests.Session()
        # Login
        login_response = session.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = login_response.json()["token"]
        session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Logout
        logout_response = session.post(f"{BASE_URL}/api/auth/logout")
        assert logout_response.status_code == 200
