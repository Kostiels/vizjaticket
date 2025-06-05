# System Rezerwacji Biletów

System rezerwacji biletów to kompleksowa platforma do zarządzania wydarzeniami i rezerwacjami biletów online. Aplikacja umożliwia użytkownikom przeglądanie, rezerwowanie i opłacanie biletów na różne wydarzenia, a administratorom zarządzanie wydarzeniami, biletami i rezerwacjami.

## Strony i Funkcjonalności

### Strona Główna
- Wyświetlanie nadchodzących wydarzeń
- Automatyczne wykrywanie lokalizacji użytkownika (na podstawie adresu IP)
- Priorytetowe wyświetlanie wydarzeń lokalnych (w mieście użytkownika)
- Szybki dostęp do najpopularniejszych kategorii wydarzeń

### Strona Wydarzeń
- Pełna lista wszystkich dostępnych wydarzeń
- Filtrowanie wydarzeń według kategorii, lokalizacji i daty
- Szczegółowe informacje o każdym wydarzeniu
- Wyszukiwarka wydarzeń

### Szczegóły Wydarzenia
- Pełny opis wydarzenia
- Informacje o dacie, lokalizacji i kategorii
- Opcje zakupu biletów
- Wybór miejsc (jeśli dostępne)

### System Rezerwacji
- Wybór typu biletu i liczby miejsc
- Możliwość wyboru konkretnych miejsc (w zależności od konfiguracji wydarzenia)
- Podsumowanie zamówienia
- Proces płatności

### Panel Użytkownika
- Rejestracja i logowanie
- Zarządzanie profilem użytkownika
- Historia rezerwacji
- Anulowanie rezerwacji
- Zmiana hasła

### Panel Administratora
- Zarządzanie wydarzeniami (dodawanie, edycja, usuwanie)
- Konfiguracja biletów i miejsc
- Zarządzanie rezerwacjami
- Podgląd statystyk

### Strony Informacyjne
- O nas
- Kontakt

## Zintegrowane API

### IP Geolocation API
- Automatyczne wykrywanie lokalizacji użytkownika
- Priorytetowe wyświetlanie wydarzeń w mieście użytkownika
- Personalizacja doświadczenia użytkownika na podstawie lokalizacji
- Wyróżnianie lokalnych wydarzeń specjalnymi oznaczeniami

### NBP API (Narodowy Bank Polski)
- Pobieranie aktualnych kursów walut
- Konwersja cen biletów między różnymi walutami
- Historia kursów walut
- Obsługa płatności w różnych walutach

## Funkcje API

System udostępnia kompletne API RESTful dla wszystkich funkcjonalności:

### API Użytkowników
- `/api/auth/register` - Rejestracja nowego użytkownika
- `/api/auth/login` - Logowanie użytkownika
- `/api/user/profile` - Zarządzanie profilem użytkownika
- `/api/user/password` - Zmiana hasła

### API Wydarzeń
- `/api/events` - Lista wszystkich wydarzeń
- `/api/events/:id` - Szczegóły konkretnego wydarzenia
- `/api/events` (POST) - Tworzenie nowego wydarzenia (tylko admin)
- `/api/events/:id` (PUT) - Aktualizacja wydarzenia (tylko admin)
- `/api/events/:id` (DELETE) - Usunięcie wydarzenia (tylko admin)

### API Biletów
- `/api/events/:id/tickets` - Lista biletów dla wydarzenia
- `/api/events/:id/tickets` (POST) - Tworzenie biletów (tylko admin)
- `/api/tickets/:id` (PUT) - Aktualizacja biletu (tylko admin)
- `/api/tickets/:id` (DELETE) - Usunięcie biletu (tylko admin)

### API Rezerwacji
- `/api/reservations` - Lista rezerwacji użytkownika
- `/api/reservations/:id` - Szczegóły konkretnej rezerwacji
- `/api/reservations` (POST) - Tworzenie nowej rezerwacji
- `/api/reservations/:id` (DELETE) - Anulowanie rezerwacji

### API Płatności
- `/api/payments/simple-payment/:reservationId` - Realizacja prostej płatności

## Technologie

- **Backend**: Node.js, Express.js
- **Baza danych**: MongoDB z Mongoose
- **Frontend**: EJS, HTML, CSS, JavaScript
- **Uwierzytelnianie**: Passport.js, JWT
- **Płatności**: Własny system płatności
- **Integracje**: IP Geolocation API, NBP API

## Modele Danych

### Użytkownik (User)
- Dane osobowe (imię, email, telefon)
- Adres
- Rola (użytkownik/administrator)
- Dane uwierzytelniające

### Wydarzenie (Event)
- Tytuł i opis
- Data i lokalizacja
- Kategoria (koncert, teatr, kino, sport, inne)
- Zdjęcie
- Status (nadchodzące, trwające, zakończone, anulowane)
- Konfiguracja biletów i miejsc

### Bilet (Ticket)
- Typ biletu
- Cena
- Przypisane miejsce (sektor, rząd, miejsce)
- Status (dostępny, zarezerwowany, sprzedany)

### Rezerwacja (Reservation)
- Przypisany użytkownik
- Zarezerwowane bilety
- Status płatności
- Data rezerwacji
- Całkowita kwota

## Funkcje Administracyjne

- Tworzenie i zarządzanie wydarzeniami
- Konfiguracja układu miejsc dla wydarzeń
- Zarządzanie typami biletów i cenami
- Przeglądanie i zarządzanie rezerwacjami
- Anulowanie rezerwacji
- Statystyki sprzedaży 