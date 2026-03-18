"""
Phase 2 Features Backend Tests

Tests for:
1. Categories API (/api/categories) - CRUD and reorder
2. Options API (/api/options/{type}) - Save and retrieve custom options
3. Global Search API (/api/search)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://costruzioni-desk.preview.emergentagent.com')

@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": "admin",
        "password": "admin123",
        "remember_me": False
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    return response.json()["token"]

@pytest.fixture(scope="module")
def api_client(auth_token):
    """Create authenticated session"""
    session = requests.Session()
    session.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    })
    return session


class TestCategoriesAPI:
    """Test Categories CRUD operations"""
    
    def test_get_categories(self, api_client):
        """GET /api/categories - List all categories"""
        response = api_client.get(f"{BASE_URL}/api/categories")
        assert response.status_code == 200
        
        categories = response.json()
        assert isinstance(categories, list)
        print(f"Found {len(categories)} categories")
        
        # Verify categories have required fields
        if len(categories) > 0:
            cat = categories[0]
            assert "id" in cat
            assert "name" in cat
            assert "color" in cat
            assert "default_vat_percent" in cat
            print(f"First category: {cat['name']} - Color: {cat['color']} - IVA: {cat['default_vat_percent']}%")
    
    def test_create_category(self, api_client):
        """POST /api/categories - Create new category"""
        new_cat = {
            "name": "TEST_Pittura_Speciale",
            "color": "#E91E63",
            "default_vat_percent": 22.0,
            "description": "Test category description",
            "position": 99,
            "parent_id": None
        }
        
        response = api_client.post(f"{BASE_URL}/api/categories", json=new_cat)
        assert response.status_code == 200
        
        created = response.json()
        assert created["name"] == new_cat["name"]
        assert created["color"] == new_cat["color"]
        assert created["default_vat_percent"] == new_cat["default_vat_percent"]
        assert "id" in created
        
        print(f"Created category ID: {created['id']}")
        
        # Store for update/delete tests
        pytest.created_category_id = created["id"]
    
    def test_update_category(self, api_client):
        """PUT /api/categories/{id} - Update category"""
        if not hasattr(pytest, 'created_category_id'):
            pytest.skip("No category created in previous test")
        
        update_data = {
            "name": "TEST_Pittura_Speciale_Updated",
            "color": "#9C27B0",
            "default_vat_percent": 10.0,
            "description": "Updated description",
            "position": 98,
            "parent_id": None
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/categories/{pytest.created_category_id}",
            json=update_data
        )
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["name"] == update_data["name"]
        assert updated["color"] == update_data["color"]
        print(f"Updated category: {updated['name']}")
    
    def test_reorder_categories(self, api_client):
        """PUT /api/categories/reorder - Reorder categories"""
        # Get existing categories first
        response = api_client.get(f"{BASE_URL}/api/categories")
        categories = response.json()
        
        if len(categories) < 2:
            pytest.skip("Need at least 2 categories to test reorder")
        
        # Build position map
        positions = {}
        for i, cat in enumerate(categories[:3]):
            positions[cat["id"]] = 100 - i  # Reverse order
        
        # Send with positions wrapper as expected by backend
        response = api_client.put(f"{BASE_URL}/api/categories/reorder", json={"positions": positions})
        assert response.status_code == 200
        
        result = response.json()
        assert "message" in result
        print(f"Reorder response: {result['message']}")
    
    def test_delete_category(self, api_client):
        """DELETE /api/categories/{id} - Delete category"""
        if not hasattr(pytest, 'created_category_id'):
            pytest.skip("No category created in previous test")
        
        response = api_client.delete(
            f"{BASE_URL}/api/categories/{pytest.created_category_id}"
        )
        assert response.status_code == 200
        
        result = response.json()
        assert "message" in result
        print(f"Delete response: {result['message']}")
        
        # Verify deletion
        response = api_client.get(f"{BASE_URL}/api/categories")
        categories = response.json()
        deleted_ids = [c["id"] for c in categories]
        assert pytest.created_category_id not in deleted_ids, "Category should be deleted"


class TestOptionsAPI:
    """Test Options API for combobox persistence"""
    
    def test_save_city_option(self, api_client):
        """POST /api/options - Save city option"""
        data = {
            "option_type": "cities",
            "option_value": "TEST_Milano"
        }
        
        response = api_client.post(f"{BASE_URL}/api/options", json=data)
        assert response.status_code == 200
        
        result = response.json()
        assert "message" in result
        print(f"Save option response: {result['message']}")
    
    def test_get_city_options(self, api_client):
        """GET /api/options/cities - Get saved city options"""
        response = api_client.get(f"{BASE_URL}/api/options/cities")
        assert response.status_code == 200
        
        options = response.json()
        assert isinstance(options, list)
        assert "TEST_Milano" in options
        print(f"Cities options: {options}")
    
    def test_save_province_option(self, api_client):
        """POST /api/options - Save province option"""
        data = {
            "option_type": "provinces",
            "option_value": "TEST_MI"
        }
        
        response = api_client.post(f"{BASE_URL}/api/options", json=data)
        assert response.status_code == 200
    
    def test_get_province_options(self, api_client):
        """GET /api/options/provinces - Get saved province options"""
        response = api_client.get(f"{BASE_URL}/api/options/provinces")
        assert response.status_code == 200
        
        options = response.json()
        assert isinstance(options, list)
        assert "TEST_MI" in options
        print(f"Provinces options: {options}")
    
    def test_save_payment_terms_option(self, api_client):
        """POST /api/options - Save payment terms option"""
        data = {
            "option_type": "payment_terms",
            "option_value": "TEST_30 giorni fine mese"
        }
        
        response = api_client.post(f"{BASE_URL}/api/options", json=data)
        assert response.status_code == 200
    
    def test_get_payment_terms_options(self, api_client):
        """GET /api/options/payment_terms - Get saved payment terms options"""
        response = api_client.get(f"{BASE_URL}/api/options/payment_terms")
        assert response.status_code == 200
        
        options = response.json()
        assert isinstance(options, list)
        assert "TEST_30 giorni fine mese" in options
        print(f"Payment terms options: {options}")


class TestGlobalSearchAPI:
    """Test Global Search API"""
    
    def test_search_clients(self, api_client):
        """GET /api/search - Search clients"""
        # First create a test client
        client_data = {
            "name": "TEST_SearchClient",
            "company_name": "TEST_SearchCompany Srl",
            "email": "test.search@example.com"
        }
        response = api_client.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200
        created_client = response.json()
        pytest.test_client_id = created_client["id"]
        
        # Now search for it
        response = api_client.get(f"{BASE_URL}/api/search?q=SearchClient&limit=20")
        assert response.status_code == 200
        
        results = response.json()
        assert "clients" in results
        assert "quotes" in results
        assert "materials" in results
        
        client_names = [c["name"] for c in results["clients"]]
        assert "TEST_SearchClient" in client_names
        print(f"Search found {len(results['clients'])} clients, {len(results['quotes'])} quotes, {len(results['materials'])} materials")
    
    def test_search_materials(self, api_client):
        """GET /api/search - Search materials"""
        # Create test material
        material_data = {
            "name": "TEST_SearchPaint",
            "supplier": "TEST_SupplierCorp"
        }
        response = api_client.post(f"{BASE_URL}/api/materials", json=material_data)
        assert response.status_code == 200
        created = response.json()
        pytest.test_material_id = created["id"]
        
        # Search for it
        response = api_client.get(f"{BASE_URL}/api/search?q=SearchPaint")
        assert response.status_code == 200
        
        results = response.json()
        material_names = [m["name"] for m in results["materials"]]
        assert "TEST_SearchPaint" in material_names
        print(f"Found material in search: {material_names}")
    
    def test_search_empty_query(self, api_client):
        """GET /api/search - Empty query returns empty results"""
        response = api_client.get(f"{BASE_URL}/api/search?q=&limit=20")
        assert response.status_code == 200
        
        results = response.json()
        # Empty or minimal results expected
        print(f"Empty search results: clients={len(results['clients'])}, quotes={len(results['quotes'])}, materials={len(results['materials'])}")
    
    def test_cleanup_search_data(self, api_client):
        """Cleanup test data"""
        if hasattr(pytest, 'test_client_id'):
            api_client.delete(f"{BASE_URL}/api/clients/{pytest.test_client_id}")
        if hasattr(pytest, 'test_material_id'):
            api_client.delete(f"{BASE_URL}/api/materials/{pytest.test_material_id}")


class TestInactivitySettings:
    """Test inactivity timeout settings"""
    
    def test_login_returns_timeout(self):
        """Login response includes inactivity timeout"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "admin",
            "password": "admin123",
            "remember_me": False
        })
        assert response.status_code == 200
        
        data = response.json()
        assert "inactivity_timeout_minutes" in data
        assert data["inactivity_timeout_minutes"] > 0
        print(f"Inactivity timeout: {data['inactivity_timeout_minutes']} minutes")
    
    def test_settings_include_timeout(self, api_client):
        """GET /api/settings - Settings include inactivity timeout"""
        response = api_client.get(f"{BASE_URL}/api/settings")
        assert response.status_code == 200
        
        settings = response.json()
        assert "inactivity_timeout_minutes" in settings
        print(f"Settings inactivity timeout: {settings['inactivity_timeout_minutes']} minutes")


class TestClientWithComboboxFields:
    """Test clients with combobox fields (city, province, payment_terms)"""
    
    def test_create_client_with_combobox_fields(self, api_client):
        """Create client with city, province, payment_terms"""
        client_data = {
            "name": "TEST_ComboboxClient",
            "company_name": "TEST_ComboboxCompany",
            "city": "Roma",
            "province": "RM",
            "payment_terms": "60 giorni data fattura",
            "address": "Via Test 123",
            "cap": "00100"
        }
        
        response = api_client.post(f"{BASE_URL}/api/clients", json=client_data)
        assert response.status_code == 200
        
        created = response.json()
        assert created["city"] == "Roma"
        assert created["province"] == "RM"
        assert created["payment_terms"] == "60 giorni data fattura"
        
        pytest.combobox_client_id = created["id"]
        print(f"Created client with combobox fields: ID={created['id']}")
    
    def test_update_client_combobox_fields(self, api_client):
        """Update client combobox fields"""
        if not hasattr(pytest, 'combobox_client_id'):
            pytest.skip("No client created")
        
        update_data = {
            "name": "TEST_ComboboxClient",
            "company_name": "TEST_ComboboxCompany",
            "city": "Milano",
            "province": "MI",
            "payment_terms": "30 giorni data fattura"
        }
        
        response = api_client.put(
            f"{BASE_URL}/api/clients/{pytest.combobox_client_id}",
            json=update_data
        )
        assert response.status_code == 200
        
        updated = response.json()
        assert updated["city"] == "Milano"
        assert updated["province"] == "MI"
        assert updated["payment_terms"] == "30 giorni data fattura"
        print(f"Updated client combobox fields successfully")
    
    def test_get_client_with_combobox_fields(self, api_client):
        """Verify client has combobox fields persisted"""
        if not hasattr(pytest, 'combobox_client_id'):
            pytest.skip("No client created")
        
        response = api_client.get(f"{BASE_URL}/api/clients/{pytest.combobox_client_id}")
        assert response.status_code == 200
        
        client = response.json()
        assert "city" in client
        assert "province" in client
        assert "payment_terms" in client
        print(f"Client fields: city={client['city']}, province={client['province']}, payment_terms={client['payment_terms']}")
    
    def test_cleanup_client(self, api_client):
        """Cleanup test client"""
        if hasattr(pytest, 'combobox_client_id'):
            api_client.delete(f"{BASE_URL}/api/clients/{pytest.combobox_client_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
