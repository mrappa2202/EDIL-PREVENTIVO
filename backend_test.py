import requests
import sys
from datetime import datetime
import json

class PaintingQuoteAPITester:
    def __init__(self, base_url="https://site-preventivi.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if response.status_code != 204:  # No content responses
                    try:
                        return success, response.json()
                    except:
                        return success, {}
                return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    print(f"Error details: {error_detail}")
                except:
                    print(f"Response text: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_seed_data(self):
        """Initialize seed data"""
        success, response = self.run_test(
            "Seed Data Initialization",
            "POST",
            "seed",
            200
        )
        return success

    def test_login(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"username": "admin", "password": "admin123"}
        )
        if success and 'token' in response:
            self.token = response['token']
            print(f"🔑 Token acquired successfully")
            return True
        return False

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        if success and response.get('username') == 'admin':
            print(f"👤 Current user: {response.get('name', 'Admin')}")
            return True
        return False

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        success, response = self.run_test(
            "Dashboard Stats",
            "GET",
            "dashboard/stats",
            200
        )
        if success:
            print(f"📊 Stats: Quotes={response.get('quotes', {}).get('total', 0)}, "
                  f"Clients={response.get('clients_count', 0)}, "
                  f"Revenue=€{response.get('monthly_revenue', 0)}")
            return True
        return False

    def test_settings(self):
        """Test settings retrieval"""
        success, response = self.run_test(
            "Get Settings",
            "GET",
            "settings",
            200
        )
        if success and response.get('company_name'):
            print(f"🏢 Company: {response.get('company_name')}")
            return True
        return False

    def test_clients_crud(self):
        """Test complete CRUD operations for clients"""
        # Create client
        client_data = {
            "name": "Test Cliente",
            "company_name": "Test Company S.r.l.",
            "vat_number": "12345678901",
            "email": "test@example.com",
            "phone": "+39 123456789",
            "address": "Via Roma 123",
            "city": "Milano",
            "cap": "20100",
            "province": "MI"
        }
        
        success, response = self.run_test(
            "Create Client",
            "POST",
            "clients",
            200,
            data=client_data
        )
        
        if not success:
            return False
            
        client_id = response.get('id')
        print(f"📝 Created client with ID: {client_id}")
        
        # Get client
        success, response = self.run_test(
            "Get Client",
            "GET",
            f"clients/{client_id}",
            200
        )
        
        if not success:
            return False
            
        # Update client
        update_data = client_data.copy()
        update_data['notes'] = 'Cliente di test aggiornato'
        
        success, response = self.run_test(
            "Update Client",
            "PUT",
            f"clients/{client_id}",
            200,
            data=update_data
        )
        
        if not success:
            return False
            
        # List clients
        success, response = self.run_test(
            "List Clients",
            "GET",
            "clients",
            200
        )
        
        if not success:
            return False
            
        print(f"📋 Found {len(response)} clients")
        
        # Store client ID for quote tests
        self.client_id = client_id
        return True

    def test_quotes_crud(self):
        """Test complete CRUD operations for quotes"""
        if not hasattr(self, 'client_id'):
            print("❌ Client ID not available, skipping quote tests")
            return False
            
        # Create quote
        quote_data = {
            "client_id": self.client_id,
            "project_description": "Pittura interna appartamento",
            "site_address": "Via Test 456, Milano",
            "validity_days": 30,
            "status": "draft",
            "notes": "Preventivo di test",
            "items": [
                {
                    "category": "Pittura Interni",
                    "description": "Pittura pareti e soffitti",
                    "unit": "mq",
                    "quantity": 50.0,
                    "unit_price": 25.0,
                    "discount_percent": 0,
                    "vat_percent": 22.0,
                    "position": 0
                }
            ]
        }
        
        success, response = self.run_test(
            "Create Quote",
            "POST",
            "quotes",
            200,
            data=quote_data
        )
        
        if not success:
            return False
            
        quote_id = response.get('id')
        quote_number = response.get('quote_number')
        print(f"📋 Created quote {quote_number} with ID: {quote_id}")
        
        # Get quote
        success, response = self.run_test(
            "Get Quote",
            "GET",
            f"quotes/{quote_id}",
            200
        )
        
        if not success:
            return False
            
        # Update quote status
        update_data = quote_data.copy()
        update_data['status'] = 'sent'
        
        success, response = self.run_test(
            "Update Quote",
            "PUT",
            f"quotes/{quote_id}",
            200,
            data=update_data
        )
        
        if not success:
            return False
            
        # List quotes
        success, response = self.run_test(
            "List Quotes",
            "GET",
            "quotes",
            200
        )
        
        if not success:
            return False
            
        print(f"📋 Found {len(response)} quotes")
        
        # Test PDF generation
        success, response = self.run_test(
            "Generate Quote PDF",
            "GET",
            f"quotes/{quote_id}/pdf",
            200
        )
        
        if success:
            print(f"📄 PDF generated successfully")
        
        # Store quote ID for other tests
        self.quote_id = quote_id
        return True

    def test_materials_crud(self):
        """Test complete CRUD operations for materials"""
        # Create material
        material_data = {
            "name": "Idropittura Bianca Test",
            "category": "Pittura Interni", 
            "unit": "lt",
            "stock_quantity": 100.0,
            "unit_cost": 15.50,
            "supplier": "Fornitore Test",
            "min_stock_alert": 10.0,
            "notes": "Materiale di test"
        }
        
        success, response = self.run_test(
            "Create Material",
            "POST",
            "materials",
            200,
            data=material_data
        )
        
        if not success:
            return False
            
        material_id = response.get('id')
        print(f"📦 Created material with ID: {material_id}")
        
        # Get material
        success, response = self.run_test(
            "Get Material",
            "GET",
            f"materials/{material_id}",
            200
        )
        
        if not success:
            return False
            
        # List materials
        success, response = self.run_test(
            "List Materials",
            "GET",
            "materials",
            200
        )
        
        if not success:
            return False
            
        print(f"📦 Found {len(response)} materials")
        
        # Test stock adjustment
        success, response = self.run_test(
            "Adjust Stock",
            "POST",
            f"materials/{material_id}/adjust-stock",
            200,
            data={"adjustment": -10, "reason": "Test usage"}
        )
        
        if success:
            print(f"📊 Stock adjusted successfully")
            
        return True

    def test_expenses_crud(self):
        """Test complete CRUD operations for expenses"""
        # Create expense
        expense_data = {
            "date": "2025-01-15",
            "category": "Materiali",
            "supplier": "Fornitore Test",
            "description": "Spesa di test per materiali",
            "amount": 150.00,
            "vat_amount": 33.00,
            "payment_method": "Bonifico",
            "notes": "Spesa di test"
        }
        
        success, response = self.run_test(
            "Create Expense",
            "POST",
            "expenses",
            200,
            data=expense_data
        )
        
        if not success:
            return False
            
        expense_id = response.get('id')
        print(f"💰 Created expense with ID: {expense_id}")
        
        # List expenses
        success, response = self.run_test(
            "List Expenses",
            "GET",
            "expenses",
            200
        )
        
        if not success:
            return False
            
        print(f"💰 Found {len(response)} expenses")
        return True

    def test_employees_crud(self):
        """Test complete CRUD operations for employees"""
        # Create employee
        employee_data = {
            "name": "Mario Rossi",
            "role": "Pittore", 
            "hourly_rate": 25.00,
            "daily_rate": 200.00,
            "phone": "+39 333123456",
            "email": "mario@example.com",
            "notes": "Dipendente di test"
        }
        
        success, response = self.run_test(
            "Create Employee",
            "POST",
            "employees",
            200,
            data=employee_data
        )
        
        if not success:
            return False
            
        employee_id = response.get('id')
        print(f"👷 Created employee with ID: {employee_id}")
        
        # List employees
        success, response = self.run_test(
            "List Employees",
            "GET",
            "employees",
            200
        )
        
        if not success:
            return False
            
        print(f"👷 Found {len(response)} employees")
        
        # Create worklog
        worklog_data = {
            "employee_id": employee_id,
            "date": "2025-01-15",
            "hours": 8.0,
            "description": "Lavoro di test"
        }
        
        success, response = self.run_test(
            "Create Worklog",
            "POST",
            "worklogs",
            200,
            data=worklog_data
        )
        
        if success:
            print(f"⏰ Created worklog successfully")
            
        # Create payment
        payment_data = {
            "employee_id": employee_id,
            "amount": 200.00,
            "date": "2025-01-15",
            "payment_method": "Bonifico",
            "status": "pending",
            "notes": "Pagamento di test"
        }
        
        success, response = self.run_test(
            "Create Payment",
            "POST",
            "payments",
            200,
            data=payment_data
        )
        
        if success:
            print(f"💳 Created payment successfully")
            
        return True

    def cleanup_test_data(self):
        """Clean up test data"""
        print(f"\n🧹 Cleaning up test data...")
        
        # Clean up in reverse order of dependencies
        if hasattr(self, 'quote_id'):
            self.run_test("Delete Quote", "DELETE", f"quotes/{self.quote_id}", 200)
            
        if hasattr(self, 'client_id'):
            self.run_test("Delete Client", "DELETE", f"clients/{self.client_id}", 200)

def main():
    """Main test execution"""
    print("🏗️ Starting Italian Painting Quote Management API Tests")
    print("=" * 60)
    
    tester = PaintingQuoteAPITester()
    
    # Core functionality tests
    tests_to_run = [
        ("Seed Data", tester.test_seed_data),
        ("Authentication", tester.test_login), 
        ("User Info", tester.test_auth_me),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("Settings", tester.test_settings),
        ("Client Management", tester.test_clients_crud),
        ("Quote Management", tester.test_quotes_crud),
        ("Material Management", tester.test_materials_crud),
        ("Expense Management", tester.test_expenses_crud),
        ("Employee Management", tester.test_employees_crud)
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests_to_run:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Cleanup
    tester.cleanup_test_data()
    
    # Final Results
    print(f"\n{'='*60}")
    print(f"🎯 Test Summary")
    print(f"{'='*60}")
    print(f"📊 Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"✅ Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"   - {test}")
    else:
        print(f"\n🎉 All tests passed!")
    
    return 0 if not failed_tests else 1

if __name__ == "__main__":
    sys.exit(main())