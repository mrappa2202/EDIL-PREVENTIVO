# Gestione Preventivi Pittura Edile - PRD

## Original Problem Statement
Build a complete offline-capable full stack desktop web application for construction/building company quote management (preventivi edilizi) specifically for PAINTING/DECORATING business (pittura edile).

## Architecture
- **Frontend**: React + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **PDF Generation**: ReportLab
- **Authentication**: JWT + bcrypt

## User Personas
1. **Admin**: Full access to all features including user management and settings
2. **Operator**: Can create/manage clients, quotes, materials, expenses, employees

## Core Requirements (Static)
- Italian language interface
- Role-based access control
- Client management with billing data
- Quote builder with line items
- Materials inventory tracking
- Expense tracking
- Employee payment tracking
- PDF generation for quotes
- Configurable settings (categories, VAT rates, units)

## What's Been Implemented (2026-03-17)
- [x] Authentication system with JWT
- [x] Client CRUD with full billing data
- [x] Quote builder with line items, auto-calculations
- [x] Quote status management (Bozza, Inviato, Accettato, Rifiutato, Fatturato)
- [x] PDF generation with company header, items, totals
- [x] Materials inventory with low stock alerts
- [x] Expense tracking linked to projects
- [x] Employee management with work logs and payments
- [x] Settings configuration (company data, categories, VAT rates)
- [x] User management (Admin only)
- [x] Dashboard with real-time statistics
- [x] Dark/Light theme toggle
- [x] 11 pre-configured painting categories

## Pre-configured Categories (Pittura Edile)
1. Preparazione Superfici
2. Pittura Interni
3. Pittura Esterni
4. Verniciatura Legno
5. Verniciatura Ferro
6. Decorazioni
7. Cartongesso
8. Rasatura e Stuccatura
9. Trattamenti Speciali
10. Ponteggi e Noleggi
11. Manodopera

## Units of Measure
mq, ml, pz, kg, lt, ore, gg, corpo

## Default Credentials
- Username: admin
- Password: admin123

## Prioritized Backlog

### P0 (Critical) - COMPLETED
- Authentication
- Quote management
- Client management
- PDF generation

### P1 (High)
- Invoice generation from accepted quotes
- Quote archiving functionality
- Database export/backup feature

### P2 (Medium)
- Material usage tracking per quote
- Project cost summary dashboard
- Monthly revenue reports

### P3 (Low)
- Batch PDF generation
- Quote templates
- Client communication log

## Next Tasks
1. Add invoice generation from accepted quotes
2. Implement database backup/export functionality
3. Add material usage tracking per project
4. Create monthly revenue reports
